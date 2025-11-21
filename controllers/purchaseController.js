// controllers/purchaseController.js
const db = require("../config/db");

exports.createPurchase = (req, res) => {
  const { supplier_id, medicine_id, quantity, unit_price, expiry_date, purchased_at } = req.body;
  if (!medicine_id || !quantity) return res.status(400).json({ message: "medicine_id and quantity required" });

  const sql = `INSERT INTO purchases (supplier_id, medicine_id, quantity, available_qty, unit_price, expiry_date, purchased_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values = [supplier_id || null, medicine_id, quantity, quantity, unit_price || 0, expiry_date || null, purchased_at || null];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Insert error", error: err });
    res.status(201).json({ id: result.insertId, message: "Purchase recorded" });
  });
};

exports.getPurchases = (req, res) => {
  const sql = `
    SELECT p.*, m.name AS medicine_name, s.name AS supplier_name
    FROM purchases p
    LEFT JOIN medicines m ON p.medicine_id = m.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.purchased_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
};

// exports.getPurchaseById = (req, res) => {
//   db.query(`SELECT * FROM purchases WHERE id=?`, [req.params.id], (err, rows) => {
//     if (err) return res.status(500).json({ error: err });
//     if (!rows.length) return res.status(404).json({ message: "Not found" });
//     res.json(rows[0]);
//   });
// };

exports.getPurchaseById = (req, res) => {
  const sql = `
    SELECT p.*, m.name AS medicine_name, s.name AS supplier_name
    FROM purchases p
    LEFT JOIN medicines m ON p.medicine_id = m.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  });
};

// Update Purchase
exports.updatePurchase = (req, res) => {
  const { supplier_id, medicine_id, quantity, unit_price, expiry_date, purchased_at, available_qty } = req.body;
  const id = req.params.id;

  if (!medicine_id || !quantity) {
    return res.status(400).json({ message: "medicine_id and quantity required" });
  }

  if (available_qty > quantity) {
    return res.status(400).json({ message: "available_qty cannot exceed total quantity" });
  }

  const sql = `
    UPDATE purchases 
    SET supplier_id=?, medicine_id=?, quantity=?, available_qty=?, unit_price=?, expiry_date=?, purchased_at=?
    WHERE id=?
  `;
  const values = [
    supplier_id || null,
    medicine_id,
    quantity,
    available_qty ?? quantity,
    unit_price || 0,
    expiry_date || null,
    purchased_at || null,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Update error", error: err });
    res.json({ message: "Purchase updated successfully" });
  });
};

// Delete Purchase
exports.deletePurchase = (req, res) => {
  const id = req.params.id;
  db.query(`DELETE FROM purchases WHERE id=?`, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Delete error", error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Purchase not found" });
    res.json({ message: "Purchase deleted successfully" });
  });
};
