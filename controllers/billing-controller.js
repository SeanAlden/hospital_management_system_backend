const db = require("../config/db");

// GET all bills
exports.getBills = (req, res) => {
  const sql = `
    SELECT bills.*, patients.name AS patient_name
    FROM bills
    JOIN patients ON bills.patient_id = patients.id
    ORDER BY bills.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// GET single bill with items
exports.getBillById = (req, res) => {
  const billId = req.params.id;
  const billSql = `
    SELECT b.*, p.name AS patient_name, a.id AS admission_ref
    FROM bills b
    LEFT JOIN patients p ON b.patient_id = p.id
    LEFT JOIN admissions a ON b.admission_id = a.id
    WHERE b.id = ?
  `;
  const itemsSql = `SELECT * FROM bill_items WHERE bill_id = ?`;

  db.query(billSql, [billId], (err, billResults) => {
    if (err) return res.status(500).json(err);
    if (billResults.length === 0) return res.status(404).json({ message: "Bill not found" });

    db.query(itemsSql, [billId], (err, itemsResults) => {
      if (err) return res.status(500).json(err);
      res.json({ ...billResults[0], items: itemsResults });
    });
  });
};

// CREATE new bill
exports.createBill = (req, res) => {
  const { patient_id, admission_id, items } = req.body;

  let total = 0;
  items.forEach((i) => (total += parseFloat(i.amount)));

  const sql = `INSERT INTO bills (patient_id, admission_id, total_amount) VALUES (?, ?, ?)`;
  db.query(sql, [patient_id, admission_id || null, total], (err, result) => {
    if (err) return res.status(500).json(err);

    const billId = result.insertId;
    const itemSql = `INSERT INTO bill_items (bill_id, description, amount) VALUES ?`;
    const itemValues = items.map((i) => [billId, i.description, i.amount]);

    db.query(itemSql, [itemValues], (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Bill created successfully" });
    });
  });
};

// UPDATE bill (status or items)
// exports.updateBill = (req, res) => {
//   const billId = req.params.id;
//   const { status, items } = req.body;

//   db.query(`UPDATE bills SET status = ? WHERE id = ?`, [status, billId], (err) => {
//     if (err) return res.status(500).json(err);

//     if (items && items.length > 0) {
//       db.query(`DELETE FROM bill_items WHERE bill_id = ?`, [billId], (err2) => {
//         if (err2) return res.status(500).json(err2);

//         const itemSql = `INSERT INTO bill_items (bill_id, description, amount) VALUES ?`;
//         const itemValues = items.map((i) => [billId, i.description, i.amount]);
//         db.query(itemSql, [itemValues], (err3) => {
//           if (err3) return res.status(500).json(err3);
//           res.json({ message: "Bill updated successfully" });
//         });
//       });
//     } else {
//       res.json({ message: "Bill updated successfully" });
//     }
//   });
// };

exports.updateBill = (req, res) => {
  const billId = req.params.id;
  const { status, items } = req.body;

  db.query(`UPDATE bills SET status = ? WHERE id = ?`, [status, billId], (err) => {
    if (err) return res.status(500).json(err);

    if (items && items.length > 0) {
      db.query(`DELETE FROM bill_items WHERE bill_id = ?`, [billId], (err2) => {
        if (err2) return res.status(500).json(err2);

        const itemSql = `INSERT INTO bill_items (bill_id, description, amount) VALUES ?`;
        const itemValues = items.map((i) => [billId, i.description, i.amount]);

        db.query(itemSql, [itemValues], (err3) => {
          if (err3) return res.status(500).json(err3);

          // Hitung ulang total_amount
          const updateTotalSql = `
            UPDATE bills
            SET total_amount = (SELECT SUM(amount) FROM bill_items WHERE bill_id = ?)
            WHERE id = ?
          `;
          db.query(updateTotalSql, [billId, billId], (err4) => {
            if (err4) return res.status(500).json(err4);
            res.json({ message: "Bill updated successfully" });
          });
        });
      });
    } else {
      res.json({ message: "Bill updated successfully" });
    }
  });
};

// DELETE bill
exports.deleteBill = (req, res) => {
  const id = req.params.id;
  db.query(`DELETE FROM bill_items WHERE bill_id = ?`, [id], (err) => {
    if (err) return res.status(500).json(err);
    db.query(`DELETE FROM bills WHERE id = ?`, [id], (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Bill deleted" });
    });
  });
};
