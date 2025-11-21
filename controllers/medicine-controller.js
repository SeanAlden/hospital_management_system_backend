const db = require("../config/db");

// Get all medicines
exports.getMedicines = (req, res) => {
  const sql = `
    SELECT m.*, s.name AS supplier_name
    FROM medicines m
    LEFT JOIN suppliers s ON m.supplier_id = s.id
    ORDER BY m.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
};

// Get single medicine
exports.getMedicineById = (req, res) => {
  const sql = `
    SELECT m.*, s.name AS supplier_name
    FROM medicines m
    LEFT JOIN suppliers s ON m.supplier_id = s.id
    WHERE m.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (!results.length)
      return res.status(404).json({ message: "Medicine not found" });
    res.json(results[0]);
  });
};

// Create medicine
exports.createMedicine = (req, res) => {
  const { name, category, unit_price, supplier_id } = req.body;
  const sql = `INSERT INTO medicines (name, category, unit_price, supplier_id)
               VALUES (?, ?, ?, ?)`;
  const values = [name, category, unit_price || 0, supplier_id || null];

  db.query(sql, values, (err, result) => {
    if (err)
      return res.status(500).json({ message: "Insert error", error: err });
    res.json({ id: result.insertId, message: "Medicine created successfully" });
  });
};

// Update medicine
exports.updateMedicine = (req, res) => {
  const { name, category, unit_price, supplier_id } = req.body;
  const sql = `UPDATE medicines
               SET name=?, category=?, unit_price=?, supplier_id=?
               WHERE id=?`;
  const values = [name, category, unit_price, supplier_id || null, req.params.id];

  db.query(sql, values, (err) => {
    if (err)
      return res.status(500).json({ message: "Update error", error: err });
    res.json({ message: "Medicine updated successfully" });
  });
};

// Delete medicine
exports.deleteMedicine = (req, res) => {
  db.query(`DELETE FROM medicines WHERE id=?`, [req.params.id], (err) => {
    if (err)
      return res.status(500).json({ message: "Delete error", error: err });
    res.json({ message: "Medicine deleted successfully" });
  });
};
