import Fastify from "fastify";
import FastifyView from "@fastify/view";
import FastifyCookie from "@fastify/cookie"
import FastifyFavicon from "fastify-favicon"
import FastifyStatic from "@fastify/static";

import ejs from "ejs";

import { PrismaClient } from "@prisma/client"

import bcrypt from "bcrypt";
import crypto, { randomUUID } from "crypto";

import { getTokenData, redirectToLogin } from "./auth.js";
import { generateCSV, generateNumpyArray, generateSemicolonSeparated } from "./exportdata_generators.js";
import { calculateAverage } from "./math_functions.js";

import path from "path";
import * as url from "url";
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const home_page = "public/home.ejs";
const admin_groups_page = "public/admin/groups.ejs"
const admin_users_page = "public/admin/users.ejs"
const login_page = "public/login.ejs"
const change_password_page = "public/change_password.ejs"
const experiments_page = "public/experiments.ejs"
const measurements_page = "public/measurements.ejs"
const export_page = "public/export.ejs"

const fastify = Fastify({
    logger: false,
    ignoreTrailingSlash: true,
});

fastify.register(FastifyView, {
    engine: {
        ejs,
    },
});

fastify.register(FastifyCookie, {
    secret: "dATafyqqkn2DHuFyWKY49j*X2WRT2odf!JXsQit9i2wJWV9-XxgBKKgAwQJmdBqDu7TrVwWQW*7QjJxdo3MzGgc3oQ6@A*HbhGvo", // for cookies signature
    parseOptions: {},
    hook: "onRequest",
});

fastify.register(FastifyFavicon, {
    path: "./public"
})

fastify.register(FastifyStatic, {
    root: path.join(__dirname, "/public/scripts/"),
    prefix: "/scripts/"
})

const prisma = new PrismaClient();

let disable_admin_auth = false;

const adminCheckInterval = setInterval(() => checkIfNoAdmin(), 5000);
async function checkIfNoAdmin() {
    const admin = await prisma.user.findMany({
        where: {
            role: "ADMIN",
        }
    });

    if (admin.length === 0) {
        disable_admin_auth = true;
    }
    else {
        disable_admin_auth = false;
        clearInterval(adminCheckInterval);
    }
}

fastify.get("/", async (req, reply) => {
    const version = process.env.npm_package_version;

    const stats = {
        groups: await prisma.group.count(),
        users: await prisma.user.count(),
        experiments: await prisma.experiment.count(),
        measures: await prisma.measurement.count(),
        queries: (await prisma.$metrics.json()).counters.find(met => met.key === "prisma_datasource_queries_total").value
    };

    await reply.view(home_page, {
        stats,
        version
    });
})

// Groups

fastify.get("/admin/groups", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN" && !disable_admin_auth) {
            return redirectToLogin(reply);
        }

        await reply.view(admin_groups_page, {
            groups: await prisma.group.findMany()
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.put("/admin/groups", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN" && !disable_admin_auth) {
            reply.status(403).send();
        }

        await prisma.group.create({
            data: {
                name: req.body.groupName
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.delete("/admin/groups", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN") {
            reply.status(403).send();
        }

        if (req.body.groupId === undefined) {
            throw "Group id is undefined! Executing delete would drop table";
        }

        await prisma.group.delete({
            where: {
                id: Number(req.body.groupId),
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});


// Users

fastify.get("/admin/users", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN" && !disable_admin_auth) {
            return redirectToLogin(reply);
        }

        await reply.view(admin_users_page, {
            users: await prisma.user.findMany({
                include: {
                    group: true,
                }
            }),
            groups: await prisma.group.findMany(),
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.put("/admin/users", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN" && !disable_admin_auth) {
            reply.status(403).send();
        }

        await prisma.user.create({
            data: {
                name: req.body.userName,
                password: bcrypt.hashSync(req.body.userPassword, 4),
                groupId: Number(req.body.userGroupId),
                role: req.body.userAdmin ? "ADMIN" : "USER"
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.delete("/admin/users", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user?.role != "ADMIN") {
            reply.status(403).send();
        }

        if (req.body.userId === undefined) {
            throw "User id is undefined! Executing delete would drop table";
        }

        await prisma.user.delete({
            where: {
                id: Number(req.body.userId),
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});


// Auth

fastify.get("/login", async (req, reply) => {
    await reply.view(login_page, {});
});

fastify.post("/login", async (req, reply) => {
    try {
        const user = (await prisma.user.findFirstOrThrow({
            where: {
                name: req.body.userName ?? null,
            }
        }));

        const userTryPassword = req.body.userPassword;

        if (bcrypt.compareSync(userTryPassword, user.password) || user.password === "") {
            const token = crypto.randomBytes(128).toString("hex");
            await prisma.token.create({
                data: {
                    userId: user.id,
                    token,
                }
            });

            reply.setCookie("token", token).send();

        }
        else {
            throw "Wrong password";
        }
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.get("/login_success", async (req, reply) => {
    const tokenData = await getTokenData(req.cookies["token"]);

    if (tokenData?.user === undefined) {
        return redirectToLogin(reply);
    }

    if (tokenData.user.needPasswordChange) {
        reply.redirect("/change_password");
    }
    else {
        reply.redirect("/experiments");
    }
});

fastify.get("/logout", async (req, reply) => {
    const tokenData = await getTokenData(req.cookies["token"]);

    if (tokenData?.id === undefined) {
        return redirectToLogin(reply);
    }

    try {
        await prisma.token.delete({
            where: {
                id: tokenData.id,
            }
        });

        reply.setCookie("token", "");
        redirectToLogin(reply);

    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.get("/change_password", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return redirectToLogin(reply);
        }

        await reply.view(change_password_page, {});
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.post("/change_password", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return reply.status(403).send();
        }

        await prisma.user.update({
            where: {
                id: tokenData.user.id,
            },
            data: {
                password: bcrypt.hashSync(req.body.userPassword, 4),
                needPasswordChange: false,
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

// Experiments

fastify.get("/experiments", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return redirectToLogin(reply);
        }

        const experiments = await prisma.experiment.findMany({
            where: {
                groupId: tokenData.user.groupId ?? null,
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        await reply.view(experiments_page, {
            user: tokenData.user,
            group: tokenData.user.group,
            experiments,
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.put("/experiments", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return reply.status(403).send();
        }

        const key = tokenData.user.group.name.replace(/[\W_]+/g, "_") +
            "-" + req.body.experimentName.replace(/[\W_]+/g, "_") +
            "-" + randomUUID();

        await prisma.experiment.create({
            data: {
                name: req.body.experimentName,
                groupId: tokenData.user.groupId,
                key
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.get("/measurements", async (req, reply) => {
    reply.redirect("/experiments");
});

fastify.get("/measurements/:experimentId", async (req, reply) => {
    try {
        if (req.params.experimentId === "") {
            reply.redirect("/measurements");
        }

        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return redirectToLogin(reply);
        }

        const experiment = await prisma.experiment.findUnique({
            where: {
                id: Number(req.params.experimentId)
            }
        });

        if (tokenData?.user.groupId !== experiment.groupId) {
            return redirectToLogin(reply);
        }

        const measurements = await prisma.measurement.findMany({
            where: {
                experimentId: Number(req.params.experimentId),
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const measurementsAvg = calculateAverage(measurements);

        await reply.view(measurements_page, {
            user: tokenData.user,
            group: tokenData.user.group,
            experiment,
            measurements,
            measurementsAvg,
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.put("/measurements", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return reply.status(403).send();
        }

        const experiment = await prisma.experiment.findUnique({
            where: {
                id: Number(req.body.experimentId)
            }
        });

        if (tokenData?.user.groupId !== experiment.groupId) {
            return reply.status(403).send();
        }

        await prisma.measurement.create({
            data: {
                measure: req.body.measurementMeasure,
                experimentId: experiment.id,
                userId: tokenData.userId,
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.delete("/measurements", async (req, reply) => {
    try {
        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return reply.status(403).send();
        }

        const experiment = (await prisma.measurement.findFirstOrThrow({
            where: {
                id: Number(req.body.measurementId) ?? null
            },
            include: {
                experiment: true
            }
        })).experiment;

        if (tokenData?.user.groupId !== experiment.groupId) {
            return reply.status(403).send();
        }

        await prisma.measurement.delete({
            where: {
                id: Number(req.body.measurementId),
            }
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});


// Export

fastify.get("/export", async (req, reply) => {
    reply.redirect("/experiments");
});

fastify.get("/export/:experimentId", async (req, reply) => {
    try {
        if (req.params.experimentId === "") {
            reply.redirect("/export");
        }

        const tokenData = await getTokenData(req.cookies["token"]);

        if (tokenData?.user === undefined) {
            return redirectToLogin(reply);
        }

        const experiment = await prisma.experiment.findUnique({
            where: {
                id: Number(req.params.experimentId)
            }
        });

        if (tokenData?.user.groupId !== experiment.groupId) {
            return redirectToLogin(reply);
        }

        const measurements = await prisma.measurement.findMany({
            where: {
                experimentId: Number(req.params.experimentId),
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const protocol = req.hostname.includes("localhost") ? "http" : "https"

        const exportdata_url = protocol + "://" + req.hostname + "/exportdata/";
        const exportData = {
            links: {
                csv: exportdata_url + experiment.key + ".csv"
            },
            data: {
                numpy: generateNumpyArray(measurements),
                semicolon: generateSemicolonSeparated(measurements),
                avg: calculateAverage(measurements),
            }
        };

        await reply.view(export_page, {
            user: tokenData.user,
            group: tokenData.user.group,
            experiment,
            measurements,
            exportData,
        });
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});

fastify.get("/exportdata/:experimentKey", async (req, reply) => {
    try {
        if (req.params.experimentKey === "") {
            reply.status(404).send();
        }

        const expertimentKey = req.params.experimentKey.split(".")[0];
        const format = req.params.experimentKey.split(".")[1].toLowerCase();

        const experiment = await prisma.experiment.findFirstOrThrow({
            where: {
                key: expertimentKey ?? null
            },
            include: {
                measurements: true,
            }
        });

        const measurements = experiment.measurements;

        reply
            .header("Cache-Control", "no-cache, no-store, must-revalidate")
            .header("Pragma", "no-cache")
            .header("Expires", "0")

        switch (format) {
            case "csv":
                reply
                    .header("Content-Type", "text/csv")
                    .send(generateCSV(measurements));
                break;

            default:
                throw "Invalid format";
        }
    } catch (err) {
        reply.status(401);
        await reply.send({
            errorText: err.toString()
        })
    }
});


fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    console.log("Misurator started!");
    if (err) throw err
}); 