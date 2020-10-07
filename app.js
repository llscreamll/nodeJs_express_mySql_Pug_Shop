const express = require("express");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const cookie = require('cookie');
const cookieParser = require("cookie-parser");

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// настройка подключения к базе данных sql
let conn = mysql.createConnection({
    database: "shop",
    user: "root",
    password: "root",
    host: "localhost"
});


// путь к папке
app.use(express.static("static"));
//подключаем шаблонизатор
app.set("view engine", "pug");
app.listen(3000, () => console.log("server WOrk"));

app.use((req, res, next) => {
    if (req.originalUrl == "/admin" || req.originalUrl == "/admin-order") {
        admin(req, res, conn, next);
    } else {
        next();
    }
});


app.get("/", (req, res) => {
    let category = new Promise((res, rej) => {
        conn.query("SELECT id,slug,name,cost,image,category FROM (SELECT id,slug,name,cost,image,category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   FROM goods, ( SELECT @curr_category := '' ) v ) goods where ind < 3", (err, result) => {
            if (err) rej(err);
            else res(result);
        })
    })
    let catDescription = new Promise((res, rej) => {
        conn.query("SELECT * FROM category", (err, result) => {
            if (err) rej(err);
            else res(result);
        })
    })
    Promise.all([category, catDescription]).then(value => {
        res.render("index", {
            goods: value[0],
            category: value[1]
        })
    })
});
app.get("/cat", (req, res) => {
    let cat = new Promise((res, rej) => {
        conn.query(`SELECT * FROM category where id=${req.query["id"]}`, (err, result) => {
            if (err) rej(err);
            res(result);
        });
    });
    let goods = new Promise((res, rej) => {
        conn.query(`SELECT * FROM goods where category=${req.query["id"]}`, (err, result) => {
            if (err) rej(err);
            res(result);
        });
    });
    Promise.all([cat, goods]).then((value) => {
        res.render("cat", {
            cat: value[0][0],
            goods: value[1],
        });

    });
});
app.get("/goods/*", (req, res) => {

    conn.query(`SELECT * FROM goods where slug='${req.params["0"]}'`, (err, result) => {
        if (err) throw err;
        else {
            if (result[0]) {
                conn.query(`SELECT * FROM images where goods_id=${result[0]["id"]}`, (error, results) => {
                    if (error) throw error;
                    else {
                        let goodsImages = results;
                        res.render("goods", {
                            goods: result[0],
                            goods_images: goodsImages
                        });
                    }
                });
            } else {
                res.render("404");
            }
        };
    });
});
app.get("/order", (req, res) => {
    res.render("order");
});
app.post("/get-category-list", (req, res) => {
    conn.query(`SELECT id,category FROM category`, (err, result) => {
        if (err) throw err;
        else res.json(result)
    });
});
app.post("/get-goods-info", (req, res) => {
    if (req.body.key.length != 0) {
        conn.query(`SELECT id,name,cost FROM goods WHERE id IN(${req.body.key.join(",")})`, (err, result) => {
            if (err) throw err;
            else {
                let goods = {};
                for (let i = 0; i < result.length; i++) {
                    goods[result[i]["id"]] = result[i];

                }
                res.json(goods);
            }
        })
    } else {
        res.send("0");
    }

});
app.post("/finish-order", (req, res) => {
    console.log(req.body);
    if (req.body.key.length != 0) {
        let key = Object.keys(req.body.key);
        conn.query(`SELECT id,name,cost FROM goods WHERE id IN(${key.join(",")})`, (err, result) => {
            if (err) throw err;
            else {
                // sendMail(req.body, result);
                saveOrder(req.body, result)
                res.send("1");
            }
        });
    } else {
        res.send("0");
    }
});

app.get("/admin", (req, res) => {
    res.render("admin", {});
});

app.get("/admin-order", (req, res) => {
    conn.query(`SELECT shop_order.id as id, shop_order.user_id as user_id, shop_order.goods_id as goods_id, shop_order.goods_cost as goods_cost, shop_order.goods_amount as goods_amount, shop_order.total as total, from_unixtime(date, '%y-%m-%d %h:%m') as human_date, user_info.user_name as user, user_info.user_phone as phone, user_info.address as address FROM shop_order LEFT JOIN user_info ON shop_order.user_id = user_info.id ORDER BY id DESC`, (err, result) => {
        if (err) throw err;
        res.render("admin-order", {
            order: result
        })
    });
});
// login FORM ==================================================
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", (req, res) => {
    conn.query(`SELECT * FROM user WHERE login='${req.body.login}' and password='${req.body.password}'`, (err, result) => {
        if (err) throw err;
        else {
            let results = result[0];
            if (results) {
                let hach = genegalString(20);
                res.cookie("hach", hach);
                res.cookie("id", results.id);

                // запись в базу данных HASH
                let sql = `UPDATE user SET hash = '${hach}' WHERE user.login ='${results.login}'`;
                conn.query(sql, (sqlerr, sqlresult) => {
                    if (sqlerr) throw sqlerr;
                    else {
                        console.log("Запись произошла");
                        res.redirect("/admin")
                    }
                });
            } else {
                console.log("Eser not found");
                res.redirect("/login");
            }
        }
    })

});

function saveOrder(data, result) {
    // data информации о пользователе
    // result сведения о товаре
    let sql = `INSERT INTO user_info (user_name,user_phone,user_email,address) VALUES ('${data.userName}','${data.phone}','${data.email}','${data.address}')`;
    conn.query(sql, (err, resultQuery) => {
        if (err) throw err;
        else {
            console.log("User save to INFO");
            console.log(resultQuery);
            let userID = resultQuery.insertId;
            let date = new Date() / 1000;
            for (let i = 0; i < result.length; i++) {
                sql = `INSERT INTO shop_order (date,user_id,goods_id,goods_cost,goods_amount,total) VALUES (${date},${userID},${result[i]["id"]},${result[i]["cost"]},${data.key[result[i]["id"]]},${data.key[result[i]["id"]] * result[i]["cost"]})`;
                conn.query(sql, (err, resultQuery) => {
                    if (err) throw err;
                    else console.log("1 goods saved");
                })
            }

        }
    })


}
function sendMail(data, result) {
    // отправка сообщения
    let res = `<h2>Order in lite shop</h2>`
    let total = 0;
    for (let i = 0; i < result.length; i++) {
        res += `<p>${result[i]["name"]} - ${data.key[result[i]["id"]]} - ${result[i]["cost"] * data.key[result[i]["id"]]} uah</p>`
        total += result[i]["cost"] * data.key[result[i]["id"]];
    }
    res += `<hr>`;
    res += `Total ${total} uah`;
    res += `<hr>Phone: ${data.phone}`;
    res += `<hr>UserName: ${data.username}`;
    res += `<hr>address: ${data.address}`;
    res += `<hr>Email: ${data.email}`;

    async function main() {
        let testAccount = await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        let info = await transporter.sendMail({
            from: '<*****@mail.ru',
            to: `*****@mail.ru,${data.email}`,
            subject: "Lite Shop order",
            text: "Hello world",
            html: res
        });

        console.log(`MessageSend: $s,${info.messageId}`);
        console.log(`PreviewgeSend: $s,${nodemailer.getTestMessageUrl(info)}`);
        return true;

    }
    main().catch(console.error);
}
function genegalString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
function admin(req, res, conn, next) {
    conn.query(`SELECT * FROM user WHERE id=${req.cookies.id} and hash='${req.cookies.hach}'`, (sqlerr, sqlresult) => {
        if (sqlerr) {
            res.redirect("/login");
        } else if (sqlresult[0]) {
            next();
        } else {
            res.redirect("/login");
        }
    });
};