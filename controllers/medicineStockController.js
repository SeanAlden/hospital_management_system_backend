// controllers/medicineStockController.js
const db = require("../config/db");

// list stocks
// exports.getStocks = (req, res) => {
//   const sql = `
//     SELECT ms.*, m.name AS medicine_name
//     FROM medicine_stocks ms
//     LEFT JOIN medicines m ON ms.medicine_id = m.id
//     ORDER BY ms.medicine_id, ms.expiry_date
//   `;
//   db.query(sql, (err, rows) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(rows);
//   });
// };

// controllers/medicineStockController.js
exports.getStocks = (req, res) => {
  const { medicine_id } = req.query; // ambil query param

  let sql = `
    SELECT ms.*, m.name AS medicine_name
    FROM medicine_stocks ms
    LEFT JOIN medicines m ON ms.medicine_id = m.id
  `;
  const params = [];

  if (medicine_id) {
    sql += ` WHERE ms.medicine_id = ?`;
    params.push(medicine_id);
  }

  sql += ` ORDER BY ms.expiry_date`;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
};

// get stock by id
exports.getStockById = (req, res) => {
  db.query(`SELECT ms.*, m.name AS medicine_name FROM medicine_stocks ms LEFT JOIN medicines m ON ms.medicine_id=m.id WHERE ms.id=?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  });
};
