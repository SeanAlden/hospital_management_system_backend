// const mysql = require('mysql')

// // Buat koneksi ke database
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "hospital_management_system"
// })

// // Cek koneksi
// db.connect((err) => {
//     if (err) {
//         console.error("❌ Database connection failed:", err.message)
//     } else {
//         console.log("✅ Connected to MySQL database")
//     }
// })

// module.exports = db

// config/db.js
const mysql = require('mysql');

const db = mysql.createPool({
  host: "bcffbnujzhru7q2etmje-mysql.services.clever-cloud.com",
  user: "u1fqcebykhjk5v08",
  password: "cJHIUdg75FXnZ5wNubU4",
  database: "bcffbnujzhru7q2etmje",
  connectionLimit: 10 // jumlah maksimal koneksi
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL pool");
    connection.release(); // lepas setelah tes koneksi
  }
});

module.exports = db;
