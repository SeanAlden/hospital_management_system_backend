const db = require('../config/db')

// Tambah departemen
exports.addDepartment = (req, res) => {
    const sql = "INSERT INTO departments (`name`, `description`) VALUES (?, ?)"
    const values = [req.body.name, req.body.description]

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err })
        return res.json({ success: "Department added successfully" })
    })
}

// Ambil semua departemen
exports.getAllDepartments = (req, res) => {
    const sql = "SELECT * FROM departments"
    db.query(sql, (err, result) => {
        if (err) return res.json({ message: "Server error" })
        return res.json(result)
    })
}

// Ambil departemen berdasarkan ID
exports.getDepartmentById = (req, res) => {
    const id = req.params.id
    const sql = "SELECT * FROM departments WHERE id=?"
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Server error" })
        return res.json(result)
    })
}

// Update departemen
exports.editDepartment = (req, res) => {
    const id = req.params.id
    const sql = "UPDATE departments SET `name`=?, `description`=? WHERE id=?"
    const values = [req.body.name, req.body.description, id]

    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err })
        return res.json({ success: "Department updated successfully" })
    })
}

// Hapus departemen
exports.deleteDepartment = (req, res) => {
    const id = req.params.id
    const sql = "DELETE FROM departments WHERE id=?"
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Something unexpected has occurred: " + err })
        return res.json({ success: "Department deleted successfully" })
    })
}
