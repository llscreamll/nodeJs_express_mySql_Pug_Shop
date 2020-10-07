module.exports = function (req, res, conn, next) {
    conn.query(`SELECT * FROM user WHERE id=${req.cookies.id} and hash='${req.cookies.hach}'`, (sqlerr, sqlresult) => {
        if (sqlerr) {
            res.redirect("/login");
        } else if (sqlresult[0]) {
            next();
        } else {
            res.redirect("/login");
        }

    });
}


