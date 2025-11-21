const db = require('../config/db');

// Menambah medical record
exports.addMedicalRecord = (req, res) => {
  const { patient_id, doctor_id, diagnosis, treatment, prescription, record_date } = req.body;
  const sql = `INSERT INTO medical_records 
    (patient_id, doctor_id, diagnosis, treatment, prescription, record_date) 
    VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [patient_id, doctor_id || null, diagnosis, treatment, prescription, record_date || new Date()];

  db.query(sql, values, (err, result) => {
    if (err) return res.json({ message: "Error adding medical record: " + err });
    return res.json({ success: "Medical record added successfully" });
  });
}

// Menampilkan semua medical records
exports.getAllMedicalRecords = (req, res) => {
  const sql = `
    SELECT mr.*, p.name as patient_name, d.name as doctor_name
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    ORDER BY mr.record_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Server error" });
    return res.json(result);
  });
}

// Menampilkan medical record berdasarkan ID
exports.getMedicalRecordById = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT mr.*, p.name as patient_name, d.name as doctor_name
    FROM medical_records mr
    LEFT JOIN patients p ON mr.patient_id = p.id
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Server error" });
    return res.json(result);
  });
}

// Mengubah medical record
exports.editMedicalRecord = (req, res) => {
  const id = req.params.id;
  const { patient_id, doctor_id, diagnosis, treatment, prescription, record_date } = req.body;
  const sql = `
    UPDATE medical_records
    SET patient_id=?, doctor_id=?, diagnosis=?, treatment=?, prescription=?, record_date=?
    WHERE id=?
  `;
  const values = [patient_id, doctor_id || null, diagnosis, treatment, prescription, record_date || new Date(), id];

  db.query(sql, values, (err, result) => {
    if (err) return res.json({ message: "Error updating medical record: " + err });
    return res.json({ success: "Medical record updated successfully" });
  });
}

// Menghapus medical record
exports.deleteMedicalRecord = (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM medical_records WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error deleting medical record: " + err });
    return res.json({ success: "Medical record deleted successfully" });
  });
}
