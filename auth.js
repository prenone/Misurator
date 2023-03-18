import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTokenData(token) {
    try {
        const tokenData = await prisma.token.findFirstOrThrow({
            where: {
                token: token ?? null,
            },
            include: {
                user: {
                    include: {
                        group: true
                    }
                }
            },
        });
        
        return tokenData;
    } catch (err) {
    }
}

export async function redirectToLogin(reply) {
    reply.redirect("/login");
}
