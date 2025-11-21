const db = require("../config/db");

// Get all lab tests
exports.getLabTests = (req, res) => {
  const sql = `
    SELECT lt.*, p.name AS patient_name, d.name AS doctor_name
    FROM lab_tests lt
    LEFT JOIN patients p ON lt.patient_id = p.id
    LEFT JOIN doctors d ON lt.doctor_id = d.id
    ORDER BY lt.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
};

// Get single lab test
exports.getLabTestById = (req, res) => {
  const sql = `
    SELECT lt.*, p.name AS patient_name, d.name AS doctor_name
    FROM lab_tests lt
    LEFT JOIN patients p ON lt.patient_id = p.id
    LEFT JOIN doctors d ON lt.doctor_id = d.id
    WHERE lt.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    if (!results.length) return res.status(404).json({ message: "Lab test not found" });
    res.json(results[0]);
  });
};

// Create lab test
exports.createLabTest = (req, res) => {
  const { patient_id, doctor_id, test_name, test_date, result } = req.body;

  if (!patient_id || !test_name) {
    return res.status(400).json({ message: "patient_id and test_name are required" });
  }

  const sql = `INSERT INTO lab_tests (patient_id, doctor_id, test_name, test_date, result)
               VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [patient_id, doctor_id || null, test_name, test_date, result], (err, resultData) => {
    if (err) return res.status(500).json({ message: "Insert error", error: err });
    res.json({ id: resultData.insertId, message: "Lab test created successfully" });
  });
};

// Update lab test
exports.updateLabTest = (req, res) => {
  const { patient_id, doctor_id, test_name, test_date, result } = req.body;

  if (!patient_id || !test_name) {
    return res.status(400).json({ message: "patient_id and test_name are required" });
  }

  const sql = `UPDATE lab_tests
               SET patient_id=?, doctor_id=?, test_name=?, test_date=?, result=?
               WHERE id=?`;
  db.query(sql, [patient_id, doctor_id || null, test_name, test_date, result, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Update error", error: err });
    res.json({ message: "Lab test updated successfully" });
  });
};

// Delete lab test
exports.deleteLabTest = (req, res) => {
  db.query("DELETE FROM lab_tests WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete error", error: err });
    res.json({ message: "Lab test deleted successfully" });
  });
};
