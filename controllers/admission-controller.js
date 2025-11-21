// // controllers/admissionController.js
// const db = require("..//config/db");

// // Get all admissions
// exports.getAdmissions = (req, res) => {
//   const sql = `
//     SELECT a.*, p.name AS patient_name, d.name AS doctor_name, r.room_number
//     FROM admissions a
//     LEFT JOIN patients p ON a.patient_id = p.id
//     LEFT JOIN doctors d ON a.doctor_id = d.id
//     LEFT JOIN rooms r ON a.room_id = r.id
//     ORDER BY a.id DESC
//   `;
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ message: "Database error", error: err });
//     res.json(results);
//   });
// };

// // Get single admission
// exports.getAdmissionById = (req, res) => {
//   const sql = `
//     SELECT a.*, p.name AS patient_name, d.name AS doctor_name, r.room_number
//     FROM admissions a
//     LEFT JOIN patients p ON a.patient_id = p.id
//     LEFT JOIN doctors d ON a.doctor_id = d.id
//     LEFT JOIN rooms r ON a.room_id = r.id
//     WHERE a.id = ?
//   `;
//   db.query(sql, [req.params.id], (err, results) => {
//     if (err) return res.status(500).json({ message: "Database error", error: err });
//     res.json(results[0]);
//   });
// };

// // Create admission
// exports.createAdmission = (req, res) => {
//   const { patient_id, room_id, admitted_at, discharged_at, doctor_id, reason } = req.body;
//   const sql = `INSERT INTO admissions (patient_id, room_id, admitted_at, discharged_at, doctor_id, reason)
//                VALUES (?, ?, ?, ?, ?, ?)`;
//   db.query(sql, [patient_id, room_id, admitted_at, discharged_at, doctor_id, reason], (err, result) => {
//     if (err) return res.status(500).json({ message: "Insert error", error: err });
//     res.json({ id: result.insertId, message: "Admission created successfully" });
//   });
// };

// // Update admission
// exports.updateAdmission = (req, res) => {
//   const { patient_id, room_id, admitted_at, discharged_at, doctor_id, reason } = req.body;
//   const sql = `UPDATE admissions
//                SET patient_id=?, room_id=?, admitted_at=?, discharged_at=?, doctor_id=?, reason=?
//                WHERE id=?`;
//   db.query(sql, [patient_id, room_id, admitted_at, discharged_at, doctor_id, reason, req.params.id], (err) => {
//     if (err) return res.status(500).json({ message: "Update error", error: err });
//     res.json({ message: "Admission updated successfully" });
//   });
// };

// // Delete admission
// exports.deleteAdmission = (req, res) => {
//   db.query(`DELETE FROM admissions WHERE id=?`, [req.params.id], (err) => {
//     if (err) return res.status(500).json({ message: "Delete error", error: err });
//     res.json({ message: "Admission deleted successfully" });
//   });
// };

// controllers/admissionController.js
const db = require("../config/db");

// helper: normalisasi datetime-local -> MySQL DATETIME
// function normalizeDatetime(val) {
//   if (!val) return null; // empty string / undefined => null
//   // common incoming: "2025-10-24T12:25" or "2025-10-24T12:25:30"
//   // convert T -> space and ensure seconds
//   try {
//     const s = val.replace("T", " ");
//     // if seconds missing (length 16 like "YYYY-MM-DD HH:MM"), add :00
//     if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
//       return s + ":00";
//     }
//     // if already has seconds (19 chars) return as-is
//     if (/^\d{4}-\d{2}-\d{2} \s?\d{2}:\d{2}:\d{2}$/.test(s)) {
//       return s;
//     }
//     // fallback: try Date parse and format
//     const d = new Date(val);
//     if (!isNaN(d.getTime())) {
//       // format YYYY-MM-DD HH:MM:SS (local)
//       const YYYY = d.getFullYear();
//       const MM = String(d.getMonth() + 1).padStart(2, "0");
//       const DD = String(d.getDate()).padStart(2, "0");
//       const hh = String(d.getHours()).padStart(2, "0");
//       const mm = String(d.getMinutes()).padStart(2, "0");
//       const ss = String(d.getSeconds()).padStart(2, "0");
//       return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
//     }
//   } catch (e) {
//     // ignore and return null
//   }
//   return null;
// }

// helper: normalisasi datetime-local -> MySQL DATETIME
function normalizeDatetime(val) {
  if (!val) return null;

  try {
    // jika format ISO (mengandung Z atau T)
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      // format ke MySQL-compatible local time
      const YYYY = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, "0");
      const DD = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    }

    // fallback manual jika input bukan ISO
    const s = val.replace("T", " ");
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) return s + ":00";
    if (/^\d{4}-\d{2}-\d{2} \s?\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  } catch (e) {
    console.error("normalizeDatetime error:", e);
  }

  return null;
}

// Get all admissions
exports.getAdmissions = (req, res) => {
  const sql = `
    SELECT a.*, p.name AS patient_name, d.name AS doctor_name, r.room_number
    FROM admissions a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN rooms r ON a.room_id = r.id
    ORDER BY a.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
};

// Get single admission
exports.getAdmissionById = (req, res) => {
  const sql = `
    SELECT a.*, p.name AS patient_name, d.name AS doctor_name, r.room_number
    FROM admissions a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN rooms r ON a.room_id = r.id
    WHERE a.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    // return one object (or 404)
    if (!results || results.length === 0) return res.status(404).json({ message: "Admission not found" });
    res.json(results[0]);
  });
};

// Create admission
exports.createAdmission = (req, res) => {
  // ambil dari body
  let { patient_id, room_id, admitted_at, discharged_at, doctor_id, reason } = req.body;

  // normalisasi: kosong -> null
  room_id = room_id ? room_id : null;
  doctor_id = doctor_id ? doctor_id : null;

  // normalize datetimes (returns string YYYY-MM-DD HH:MM:SS or null)
  const admittedAtNorm = normalizeDatetime(admitted_at);
  const dischargedAtNorm = normalizeDatetime(discharged_at);

  // validate required
  if (!patient_id || !admittedAtNorm) {
    return res.status(400).json({ message: "patient_id and admitted_at are required and must be valid datetime" });
  }

  const sql = `INSERT INTO admissions (patient_id, room_id, admitted_at, discharged_at, doctor_id, reason)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [patient_id, room_id, admittedAtNorm, dischargedAtNorm, doctor_id, reason];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Insert error", error: err });
    res.json({ id: result.insertId, message: "Admission created successfully" });
  });
};

// Update admission
exports.updateAdmission = (req, res) => {
  let { patient_id, room_id, admitted_at, discharged_at, doctor_id, reason } = req.body;

  room_id = room_id ? room_id : null;
  doctor_id = doctor_id ? doctor_id : null;

  const admittedAtNorm = normalizeDatetime(admitted_at);
  const dischargedAtNorm = normalizeDatetime(discharged_at);

  if (!patient_id || !admittedAtNorm) {
    return res.status(400).json({ message: "patient_id and admitted_at are required and must be valid datetime" });
  }

  const sql = `UPDATE admissions
               SET patient_id=?, room_id=?, admitted_at=?, discharged_at=?, doctor_id=?, reason=?
               WHERE id=?`;
  const values = [patient_id, room_id, admittedAtNorm, dischargedAtNorm, doctor_id, reason, req.params.id];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: "Update error", error: err });
    res.json({ message: "Admission updated successfully" });
  });
};

// Delete admission
exports.deleteAdmission = (req, res) => {
  db.query(`DELETE FROM admissions WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete error", error: err });
    res.json({ message: "Admission deleted successfully" });
  });
};
