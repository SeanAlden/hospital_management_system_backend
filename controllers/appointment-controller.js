const db = require("../config/db");

// ➕ Tambah appointment
exports.addAppointment = (req, res) => {
  const { patient_id, doctor_id, appointment_date, status, notes } = req.body;

  const sql = `
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [patient_id, doctor_id, appointment_date, status || "scheduled", notes], (err, result) => {
    if (err) return res.json({ message: "Database error: " + err });
    return res.json({ success: "Appointment added successfully" });
  });
};

// 📋 Ambil semua appointment (join ke pasien & dokter)
exports.getAllAppointments = (req, res) => {
  const sql = `
    SELECT a.*, 
           p.name AS patient_name, 
           d.name AS doctor_name,
           d.specialization
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.appointment_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Database error: " + err });
    return res.json(result);
  });
};

// 🔍 Ambil appointment berdasarkan ID
exports.getAppointmentById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT a.*, 
           p.name AS patient_name, 
           d.name AS doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Database error" });
    return res.json(result);
  });
};

// ✏️ Edit appointment
exports.editAppointment = (req, res) => {
  const { id } = req.params;
  const { patient_id, doctor_id, appointment_date, status, notes } = req.body;

  const sql = `
    UPDATE appointments 
    SET patient_id=?, doctor_id=?, appointment_date=?, status=?, notes=? 
    WHERE id=?
  `;
  db.query(sql, [patient_id, doctor_id, appointment_date, status, notes, id], (err, result) => {
    if (err) return res.json({ message: "Database error: " + err });
    return res.json({ success: "Appointment updated successfully" });
  });
};

// ❌ Hapus appointment
exports.deleteAppointment = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM appointments WHERE id=?", [id], (err, result) => {
    if (err) return res.json({ message: "Database error: " + err });
    return res.json({ success: "Appointment deleted successfully" });
  });
};
