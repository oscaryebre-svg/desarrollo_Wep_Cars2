const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "Car_2",
});

module.exports = connection;
