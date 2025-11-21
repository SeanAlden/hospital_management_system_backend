const db = require('../config/db')

// Menambah pasien
exports.addPatient = (req, res) => {
    const sql = "INSERT INTO patients (`name`, `email`, `age`, `gender`) VALUES (?, ?, ?, ?)"
    const values = [req.body.name, req.body.email, req.body.age, req.body.gender]

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occured: " + err })
        return res.json({ success: "Patient added successfully" })
    })
}

// Menampilkan semua pasien
exports.getAllPatients = (req, res) => {
    const sql = "SELECT * FROM patients"
    db.query(sql, (err, result) => {
        if (err) return res.json({ message: "Server error" })
        return res.json(result)
    })
}

// Menampilkan pasien berdasarkan ID
exports.getPatientById = (req, res) => {
    const id = req.params.id
    const sql = "SELECT * FROM patients WHERE `id` = ?"
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Server error" })
        return res.json(result)
    })
}

// Mengubah data pasien
exports.editPatient = (req, res) => {
    const id = req.params.id
    const sql = "UPDATE patients SET `name`=?, `email`=?, `age`=?, `gender`=? WHERE id=?"
    const values = [req.body.name, req.body.email, req.body.age, req.body.gender, id]

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occured: " + err })
        return res.json({ success: "Patient updated successfully" })
    })
}

// Menghapus pasien
exports.deletePatient = (req, res) => {
    const id = req.params.id
    const sql = "DELETE FROM patients WHERE id=?"
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occured: " + err })
        return res.json({ success: "Patient deleted successfully" })
    })
}
