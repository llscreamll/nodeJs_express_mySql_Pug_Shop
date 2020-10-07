document.querySelector(".close-nav").onclick = closeNav;
document.querySelector(".show-nav").onclick = closeNav;

function closeNav() {
    document.querySelector(".site-nav").classList.toggle("site-nav-close");
}


function getCategoryList() {
    fetch("/get-category-list?id=helloMan", {
        method: "POST"
    })
        .then(data => data.text())
        .then(data => showCategoryList(JSON.parse(data)));
}
function showCategoryList(data) {

    let out = `<ul class="category-list"><li><a href="/">Main</a></li>`
    for (let i = 0; i < data.length; i++) {
        out += `<li><a href="/cat?id=${data[i]["id"]}" target="_blank">${data[i]["category"]}</a></li>`;
    }
    out += `</ul>`;
    document.querySelector("#category-list").innerHTML = out;
}
getCategoryList()