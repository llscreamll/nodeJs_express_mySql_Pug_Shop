let cart = {};
document.querySelectorAll(".add-to-cart").forEach(el => el.onclick = addToCart);

if (localStorage.getItem("cart")) {
    cart = JSON.parse(localStorage.getItem("cart"));
    ajaxGetGoodsInfo();
}

function addToCart() {
    let goodId = this.getAttribute("data-goods_id");
    if (cart[goodId]) {
        cart[goodId]++;
    } else {
        cart[goodId] = 1;
    }
    document.querySelector(".site-nav").classList.add("site-nav-close");
    ajaxGetGoodsInfo();
}
function ajaxGetGoodsInfo() {
    updateLocalStorangeCart();
    fetch("/get-goods-info", {
        method: "POST",
        body: JSON.stringify({ key: Object.keys(cart) }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(data => data.text())
        .then(body => showCart(JSON.parse(body)));
}

function showCart(data) {
    let out = "<table class='table table-striped table-cart'><tbody>";
    let total = 0;
    for (const key in cart) {
        out += `<tr><td colspan="4"><a href="/goods?id=${key}">${data[key]["name"]}</a></tr>`;
        out += `<tr><td><span class="material-icons cart-minus"data-goods_id=${key}>remove_circle_outline</span> </td>`;
        out += `<td>${cart[key]}</td>`;
        out += `<td><span class="material-icons cart-plus"data-goods_id=${key}>add_circle_outline</span> </td>`;
        out += `<td>${formatPrise(data[key]["cost"] * cart[key])}uah</td> `
        out += `</tr > `;
        total += cart[key] * data[key]["cost"];
    };
    out += `<tr><td colspan="3">Total: </td><td>${formatPrise(total)} uah</td></tr>`;
    out += "</tbody></table>";
    document.querySelector("#cart-nav").innerHTML = out;


    document.querySelectorAll(".cart-plus").forEach(el => el.onclick = cartAdd)
    document.querySelectorAll(".cart-minus").forEach(el => el.onclick = cartRemove)

}

function cartAdd() {
    console.log("hi");

    let goodId = this.getAttribute("data-goods_id");
    cart[goodId]++;
    console.log(cart);
    ajaxGetGoodsInfo();
}
function cartRemove() {
    let goodId = this.getAttribute("data-goods_id");
    if (cart[goodId] - 1 == 0) {
        delete (cart[goodId]);
    } else {
        cart[goodId]--;
    }
    ajaxGetGoodsInfo();
}

function updateLocalStorangeCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
};

function formatPrise(prise) {
    return prise.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ')
};