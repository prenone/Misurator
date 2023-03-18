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