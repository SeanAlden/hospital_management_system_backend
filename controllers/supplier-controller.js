const db = require('../config/db');

// Get all suppliers
exports.getSuppliers = (req, res) => {
  db.query('SELECT * FROM suppliers ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Get supplier by ID
exports.getSupplierById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM suppliers WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Supplier not found' });
    res.json(results[0]);
  });
};

// Create supplier
exports.createSupplier = (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  db.query(
    'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
    [name, contact_person, phone, email, address],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Supplier created successfully' });
    }
  );
};

// Update supplier
exports.updateSupplier = (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address } = req.body;
  db.query(
    'UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=? WHERE id=?',
    [name, contact_person, phone, email, address, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Supplier updated successfully' });
    }
  );
};

// Delete supplier
exports.deleteSupplier = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM suppliers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Supplier deleted successfully' });
  });
};
