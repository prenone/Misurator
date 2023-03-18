async function deleteGroup(element) {
    const response = await fetch("/admin/groups", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            groupId: element.dataset.groupid,
        })
    });

    if (response.status == 200) {
        alert("Gruppo eliminato");
        location.reload();
    } else {
        alert("Errore nella eliminazione del gruppo: " + (await response.json()).errorText);
    }
}

async function addGroup() {
    const response = await fetch("/admin/groups", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            groupName: document.getElementById("groupNameInput").value,
        })
    });

    if (response.status == 200) {
        alert("Gruppo creato");
        location.reload();
    } else {
        alert("Errore nella creazione del gruppo: " + (await response.json()).errorText);
    }
}

async function deleteUser(element) {
    const response = await fetch("/admin/users", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: element.dataset.userid,
        })
    });
    
    if (response.status == 200) {
        alert("Utente eliminato");
        location.reload();
    } else {
        alert("Errore nella eliminazione dell"utente: " + (await response.json()).errorText);
    }
}

async function addUser() {
    const response = await fetch("/admin/users", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userName: document.getElementById("userNameInput").value,
            userPassword: document.getElementById("userPasswordInput").value,
            userGroupId: document.getElementById("userGroupSelect").value,
            userAdmin: document.getElementById("userAdminInput").checked,
        })
    });
    
    if (response.status == 200) {
        alert("Utente creato");
        location.reload();
    } else {
        alert("Errore nella creazione dell"utente: " + (await response.json()).errorText);
    }
}