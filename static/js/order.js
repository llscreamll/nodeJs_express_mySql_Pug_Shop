document.querySelector("#lite-shop-order").onsubmit = (e) => {
    e.preventDefault();
    let userName = document.querySelector("#username").value.trim();
    let phone = document.querySelector("#phone").value.trim();
    let email = document.querySelector("#email").value.trim();
    let address = document.querySelector("#address").value.trim();

    if (!document.querySelector("#rule").checked) {
        swal({
            title: "Ooops!",
            text: "Ознакомьтесь с правилами!",
            type: "info",
            button: "ok!"
        });
        return false;
    } else if (userName == "" || phone == "" || email == "" || address == "") {
        swal({
            title: "Ooops!",
            text: "Поля не заполнены!",
            type: "info",
            button: "ok!"
        });
        return false;

    } else {
        fetch("/finish-order", {
            method: "POST",
            body: JSON.stringify({
                userName: userName,
                phone: phone,
                email: email,
                address: address,
                key: JSON.parse(localStorage.getItem("cart"))
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(data => data.text())
            .then(body => {
                if (body == 1) {
                    swal({
                        title: "Good job!",
                        text: "заказ выполнен!",
                        icon: "success",
                        button: "ok!"
                    });

                } else if (body == 0) {
                    swal({
                        title: "Ooops!",
                        text: "Ошибка!",
                        type: "info",
                        button: "ok!"
                    });
                } else {
                    swal({
                        title: "Ooops!",
                        text: "Попробуйте позже!",
                        type: "info",
                        button: "ok!"
                    });
                }
            })
    }
}