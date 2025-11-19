const db = require("../configs/db");
const mysql = require("mysql");

const connect = mysql.createPool({
    host: db.HOST,
    user: db.USERNAME,
    password: db.PASSWORD,
    database: db.DATABASE,
});

module.exports = connect;
