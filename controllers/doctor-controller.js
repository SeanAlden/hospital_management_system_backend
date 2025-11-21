const db = require('../config/db');

// Tambah dokter
exports.addDoctor = (req, res) => {
    const { name, email, phone, specialization, department_id } = req.body;
    const sql = "INSERT INTO doctors (`name`, `email`, `phone`, `specialization`, `department_id`) VALUES (?, ?, ?, ?, ?)";
    const values = [name, email, phone, specialization, department_id];

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err });
        return res.json({ success: "Doctor added successfully" });
    });
};

// Ambil semua dokter
exports.getAllDoctors = (req, res) => {
    const sql = `
        SELECT d.*, dep.name AS department_name 
        FROM doctors d
        LEFT JOIN departments dep ON d.department_id = dep.id
    `;
    db.query(sql, (err, result) => {
        if (err) return res.json({ message: "Server error" });
        return res.json(result);
    });
};

// Ambil dokter berdasarkan ID
exports.getDoctorById = (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM doctors WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Server error" });
        return res.json(result);
    });
};

// Update dokter
exports.editDoctor = (req, res) => {
    const id = req.params.id;
    const { name, email, phone, specialization, department_id } = req.body;
    const sql = `
        UPDATE doctors 
        SET name=?, email=?, phone=?, specialization=?, department_id=?, updated_at=CURRENT_TIMESTAMP 
        WHERE id=?
    `;
    const values = [name, email, phone, specialization, department_id, id];

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err });
        return res.json({ success: "Doctor updated successfully" });
    });
};

// Hapus dokter
exports.deleteDoctor = (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM doctors WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err });
        return res.json({ success: "Doctor deleted successfully" });
    });
};
