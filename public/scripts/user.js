async function login() {
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userName: document.getElementById("userNameInput").value,
            userPassword: document.getElementById("userPasswordInput").value,
        })
    });

    if (response.status == 200) {
        alert("Login eseguito");
        window.location = "/login_success"
    } else {
        alert("Errore nel login: " + (await response.json()).errorText);
    }
}

async function changePassword() {
    const response = await fetch("/change_password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userPassword: document.getElementById("userPasswordInput").value,
        })
    });

    if (response.status == 200) {
        alert("Password cambiata");
        window.location = "/experiments"
    } else {
        alert("Errore nel cambiamento della password: " + (await response.json()).errorText);
    }
}

async function addExperiment() {
    const response = await fetch("/experiments", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            experimentName: document.getElementById("experimentNameInput").value,
        })
    });

    if (response.status == 200) {
        alert("Esperimento creato");
        location.reload();
    } else {
        alert("Errore nella creazione dell'esperimento: " + (await response.json()).errorText);
    }
}

async function addMeasurement(element) {
    const response = await fetch("/measurements", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            experimentId: element.dataset.experimentid,
            measurementMeasure: document.getElementById("measurementMeasureInput").value,
        })
    });

    if (response.status == 200) {
        // alert("Misurazione aggiunta");
        location.reload();
    } else {
        alert("Errore nell'aggiunta della misurazione: " + (await response.json()).errorText);
    }
}

async function deleteMeasurement(element) {
    const response = await fetch("/measurements", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            measurementId: element.dataset.measurementid,
        })
    });

    if (response.status == 200) {
        // alert("Misurazione eliminata");
        location.reload();
    } else {
        //alert("Errore nella eliminazione della misurazione: " + (await response.json()).errorText);
    }
}

async function deleteExperiment(element) {
    const response = await fetch("/experiments", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            experimentId: element.dataset.experimentid,
        })
    });

    if (response.status == 200) {
        alert("Esperimento eliminato");
        location.reload();
    } else {
        alert("Errore nella eliminazione dell'esperimento: " + (await response.json()).errorText);
    }
}

async function renameExperiment(element) {
    const experimentRenameInput = document.getElementById("experimentRenameInput")

    const response = await fetch("/experiments", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            experimentId: element.dataset.experimentid,
            experimentName: experimentRenameInput.value,
        })
    });

    if (response.status == 200) {
        alert("Esperimento rinominato");
        location.reload();
    } else {
        alert("Errore nella rinominazione dell'esperimento: " + (await response.json()).errorText);
    }

    experimentRenameInput.value = "";
}


// https://stackoverflow.com/a/30810322/7976964
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        //console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        //console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(element) {
    const text = element.dataset.copytext;

    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        //console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        //console.error('Async: Could not copy text: ', err);
    });
}