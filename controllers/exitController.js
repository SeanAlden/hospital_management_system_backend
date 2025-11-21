// controllers/exitController.js
const db = require("../config/db");

// helper promisified query on connection
function queryConn(conn, sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function commitConn(conn) {
  return new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));
}
function rollbackConn(conn) {
  return new Promise((resolve) => conn.rollback(() => resolve()));
}

// Create exit (remove stock)
// Payload: { medicine_stock_id, quantity, reason, exited_by }
exports.createExit = (req, res) => {
  const { medicine_stock_id, quantity, reason, exited_by } = req.body;
  console.log("Received exit payload:", req.body); // <--- tambahkan baris ini
  if (!medicine_stock_id || !quantity) return res.status(400).json({ message: "medicine_stock_id and quantity required" });

  db.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: err });
    conn.beginTransaction(async (tErr) => {
      if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

      try {
        // lock stock row
        const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
        if (!sRows.length) throw { status: 400, message: "Stock batch not found" };
        const stock = sRows[0];

        const cur = Number(stock.current_stock || 0);
        const qty = Number(quantity);

        if (qty <= 0) throw { status: 400, message: "Quantity must be > 0" };
        if (cur < qty) throw { status: 400, message: "Not enough stock to exit" };

        // decrease stock
        await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock - ? WHERE id = ?`, [qty, medicine_stock_id]);

        // insert exit record
        const ins = await queryConn(conn, `INSERT INTO exit_medicine_stocks (medicine_stock_id, quantity, reason, exited_by, exited_at) VALUES (?, ?, ?, ?, NOW())`,
          [medicine_stock_id, qty, reason || null, exited_by || null]);

        await commitConn(conn);
        conn.release();
        res.status(201).json({ message: "Exit recorded", id: ins.insertId });
      } catch (e) {
        await rollbackConn(conn);
        conn.release();
        if (e && e.status) return res.status(e.status).json({ message: e.message });
        console.error("createExit error:", e);
        return res.status(500).json({ error: e });
      }
    });
  });
};

// List exits (with joined details)
exports.listExits = (req, res) => {
  const sql = `
    SELECT ex.*, ms.expiry_date AS stock_expiry, ms.current_stock AS stock_current,
           m.id AS medicine_id, m.name AS medicine_name
    FROM exit_medicine_stocks ex
    LEFT JOIN medicine_stocks ms ON ex.medicine_stock_id = ms.id
    LEFT JOIN medicines m ON ms.medicine_id = m.id
    ORDER BY ex.exited_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    res.json(rows);
  });
};

// Get exit by id (with details)
exports.getExitById = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT ex.*, ms.expiry_date AS stock_expiry, ms.current_stock AS stock_current,
           m.id AS medicine_id, m.name AS medicine_name
    FROM exit_medicine_stocks ex
    LEFT JOIN medicine_stocks ms ON ex.medicine_stock_id = ms.id
    LEFT JOIN medicines m ON ms.medicine_id = m.id
    WHERE ex.id = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    if (!rows.length) return res.status(404).json({ message: "Exit not found" });
    res.json(rows[0]);
  });
};

// Update exit: adjust medicine_stocks.current_stock accordingly
// Payload: { medicine_stock_id, quantity, reason, exited_by }
exports.updateExit = (req, res) => {
  const id = req.params.id;
  const { medicine_stock_id, quantity, reason, exited_by } = req.body;
  if (!quantity || !medicine_stock_id) return res.status(400).json({ message: "medicine_stock_id and quantity required" });

  db.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: err });
    conn.beginTransaction(async (tErr) => {
      if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

      try {
        // lock existing exit
        const existingRows = await queryConn(conn, `SELECT * FROM exit_medicine_stocks WHERE id=? FOR UPDATE`, [id]);
        if (!existingRows.length) throw { status: 404, message: "Exit not found" };
        const existing = existingRows[0];
        const oldQty = Number(existing.quantity || 0);
        const newQty = Number(quantity);

        // If same stock batch: compute delta
        if (Number(existing.medicine_stock_id) === Number(medicine_stock_id)) {
          // lock stock row
          const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
          if (!sRows.length) throw { status: 400, message: "Stock batch not found" };
          const stock = sRows[0];
          const cur = Number(stock.current_stock || 0);

          // after revert oldQty then subtract newQty => resulting stock = cur + oldQty - newQty
          const resulting = cur + oldQty - newQty;
          if (resulting < 0) throw { status: 400, message: "Not enough stock for this update" };

          // set to resulting: simpler do two updates (add oldQty then subtract newQty)
          if (oldQty > 0) {
            await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [oldQty, medicine_stock_id]);
          }
          if (newQty > 0) {
            await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock - ? WHERE id = ?`, [newQty, medicine_stock_id]);
          }
        } else {
          // different stock batch: revert old batch then apply to new batch
          // lock old stock
          const oldStockRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [existing.medicine_stock_id]);
          if (!oldStockRows.length) throw { status: 400, message: "Old stock batch not found" };
          // revert old
          await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [oldQty, existing.medicine_stock_id]);

          // lock new stock
          const newStockRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
          if (!newStockRows.length) throw { status: 400, message: "New stock batch not found" };
          const newStock = newStockRows[0];
          const curNew = Number(newStock.current_stock || 0);
          if (curNew < newQty) throw { status: 400, message: "Not enough stock in target batch" };

          await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock - ? WHERE id = ?`, [newQty, medicine_stock_id]);
        }

        // update exit record
        await queryConn(conn, `UPDATE exit_medicine_stocks SET medicine_stock_id=?, quantity=?, reason=?, exited_by=?, exited_at=NOW() WHERE id=?`,
          [medicine_stock_id, newQty, reason || null, exited_by || null, id]);

        await commitConn(conn);
        conn.release();
        res.json({ message: "Exit updated successfully" });
      } catch (e) {
        await rollbackConn(conn);
        conn.release();
        if (e && e.status) return res.status(e.status).json({ message: e.message });
        console.error("updateExit error:", e);
        return res.status(500).json({ error: e });
      }
    });
  });
};

// Delete exit: revert stock and remove record
exports.deleteExit = (req, res) => {
  const id = req.params.id;
  db.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: err });
    conn.beginTransaction(async (tErr) => {
      if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

      try {
        const eRows = await queryConn(conn, `SELECT * FROM exit_medicine_stocks WHERE id=? FOR UPDATE`, [id]);
        if (!eRows.length) throw { status: 404, message: "Exit not found" };
        const e = eRows[0];

        // revert stock
        await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [e.quantity, e.medicine_stock_id]);

        // delete exit row
        await queryConn(conn, `DELETE FROM exit_medicine_stocks WHERE id = ?`, [id]);

        await commitConn(conn);
        conn.release();
        res.json({ message: "Exit deleted and stock restored" });
      } catch (e) {
        await rollbackConn(conn);
        conn.release();
        if (e && e.status) return res.status(e.status).json({ message: e.message });
        console.error("deleteExit error:", e);
        return res.status(500).json({ error: e });
      }
    });
  });
};
