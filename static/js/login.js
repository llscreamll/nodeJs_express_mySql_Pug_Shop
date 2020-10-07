document.querySelector("#pushForm").addEventListener("click", pushForms);

function pushForms(e) {
    e.preventDefault();
    fetch("/login", {
        method: "POST",
        body: JSON.stringify({
            login: document.querySelector("#login").value,
            password: document.querySelector("#password").value,
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
}