// controllers/staff-controller.js
const db = require("../config/db");

// Create staff
exports.createStaff = (req, res) => {
  const { name, role, department_id, phone, email } = req.body;
  const dept = department_id ? department_id : null;

  if (!name) return res.status(400).json({ message: "Name is required" });

  const sql = `INSERT INTO staff (name, role, department_id, phone, email)
               VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, role || null, dept, phone || null, email || null], (err, result) => {
    if (err) return res.status(500).json({ message: "Insert error", error: err });
    res.json({ id: result.insertId, message: "Staff created successfully" });
  });
};

// Get all staff (with department name)
exports.getAllStaff = (req, res) => {
  const sql = `
    SELECT s.*, d.name AS department_name
    FROM staff s
    LEFT JOIN departments d ON s.department_id = d.id
    ORDER BY s.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
};

// Get staff by id
exports.getStaffById = (req, res) => {
  const sql = `
    SELECT s.*, d.name AS department_name
    FROM staff s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    if (!results || results.length === 0) return res.status(404).json({ message: "Staff not found" });
    res.json(results[0]);
  });
};

// Update staff
exports.updateStaff = (req, res) => {
  const { name, role, department_id, phone, email } = req.body;
  const dept = department_id ? department_id : null;

  if (!name) return res.status(400).json({ message: "Name is required" });

  const sql = `
    UPDATE staff
    SET name = ?, role = ?, department_id = ?, phone = ?, email = ?
    WHERE id = ?
  `;
  db.query(sql, [name, role || null, dept, phone || null, email || null, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Update error", error: err });
    res.json({ message: "Staff updated successfully" });
  });
};

// Delete staff
exports.deleteStaff = (req, res) => {
  db.query("DELETE FROM staff WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete error", error: err });
    res.json({ message: "Staff deleted successfully" });
  });
};
