// // controllers/entryController.js
// const db = require("../config/db");

// exports.createEntry = async (req, res) => {
//   const { purchase_id, medicine_id, expiry_date, medicine_stock_id, quantity, entered_by } = req.body;
//   if (!quantity || !medicine_id) return res.status(400).json({ message: "medicine_id and quantity required" });

//   // We'll use a connection for transaction
//   db.getConnection((err, conn) => {
//     if (err) return res.status(500).json({ error: err });
//     conn.beginTransaction(async (tErr) => {
//       if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

//       try {
//         // If purchase_id provided -> check purchase available
//         let purchase = null;
//         if (purchase_id) {
//           const [pRows] = await queryConn(conn, `SELECT * FROM purchases WHERE id=? FOR UPDATE`, [purchase_id]);
//           if (!pRows.length) throw { status: 400, message: "Purchase not found" };
//           purchase = pRows[0];
//           if (purchase.available_qty < quantity) throw { status: 400, message: "Not enough available qty in purchase" };
//         } else {
//           // If no purchase_id given, we still may want to ensure total purchased qty for given medicine+expiry >= sum(entries). That check can be added; skipping here for brevity.
//         }

//         // Find or create medicine_stock by medicine_id + expiry_date
//         let stockRow = null;
//         if (medicine_stock_id) {
//           const [sRows] = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
//           if (!sRows.length) throw { status: 400, message: "Medicine stock batch not found" };
//           stockRow = sRows[0];
//         } else {
//           // find by medicine_id + expiry_date (expiry_date may be null)
//           const [sRows] = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE medicine_id=? AND expiry_date <=> ? FOR UPDATE`, [medicine_id, expiry_date]);
//           if (sRows.length) {
//             stockRow = sRows[0];
//           } else {
//             // create new stock batch
//             const ins = await queryConn(conn, `INSERT INTO medicine_stocks (medicine_id, expiry_date, current_stock) VALUES (?, ?, ?)`, [medicine_id, expiry_date || null, 0]);
//             const newId = ins.insertId;
//             const [newRows] = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [newId]);
//             stockRow = newRows[0];
//           }
//         }

//         // reduce purchase.available_qty (if purchase used)
//         if (purchase_id) {
//           await queryConn(conn, `UPDATE purchases SET available_qty = available_qty - ? WHERE id = ?`, [quantity, purchase_id]);
//         } else {
//           // if not linked to purchase, this may be disallowed in your policy; for safety, allow but no purchase available change
//         }

//         // increase medicine_stocks.current_stock
//         await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [quantity, stockRow.id]);

//         // insert entry record
//         const insEntry = await queryConn(conn, `INSERT INTO entry_medicine_stocks (purchase_id, medicine_stock_id, quantity, entered_by, entered_at) VALUES (?, ?, ?, ?, NOW())`, [purchase_id || null, stockRow.id, quantity, entered_by || null]);

//         await commitConn(conn);
//         conn.release();
//         res.json({ message: "Entry recorded", entry_id: insEntry.insertId });
//       } catch (e) {
//         await rollbackConn(conn);
//         conn.release();
//         if (e && e.status) return res.status(e.status).json({ message: e.message });
//         return res.status(500).json({ error: e });
//       }
//     });
//   });
// };

// // helpers for Promisified queries on a connection
// function queryConn(conn, sql, params=[]) {
//   return new Promise((resolve, reject) => {
//     conn.query(sql, params, (err, rows) => {
//       if (err) return reject(err);
//       resolve([rows]);
//     });
//   });
// }
// function commitConn(conn) {
//   return new Promise((resolve, reject) => conn.commit(err => err ? reject(err) : resolve()));
// }
// function rollbackConn(conn) {
//   return new Promise((resolve) => conn.rollback(() => resolve()));
// }

// controllers/entryController.js
const db = require("../config/db");

/**
 * Helper promisified query on connection
 * returns rows (not [rows])
 */
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

// CREATE entry : assume you already have createEntry implementation (kept for reference)
// exports.createEntry = (req, res) => {
//     const { purchase_id, medicine_id, expiry_date, medicine_stock_id, quantity, entered_by } = req.body;
//     if (!quantity || !medicine_id) return res.status(400).json({ message: "medicine_id and quantity required" });

//     db.getConnection((err, conn) => {
//         if (err) return res.status(500).json({ error: err });
//         conn.beginTransaction(async (tErr) => {
//             if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

//             try {
//                 // validate purchase if provided
//                 // let purchase = null;
//                 // if (purchase_id) {
//                 //     const pRows = await queryConn(conn, `SELECT * FROM purchases WHERE id=? FOR UPDATE`, [purchase_id]);
//                 //     if (!pRows.length) throw { status: 400, message: "Purchase not found" };
//                 //     purchase = pRows[0];
//                 //     if (purchase.available_qty < quantity) throw { status: 400, message: "Not enough available qty in purchase" };
//                 // }

//                 // validate purchase if provided
//                 let purchase = null;
//                 if (purchase_id) {
//                     const pRows = await queryConn(conn, `SELECT * FROM purchases WHERE id=? FOR UPDATE`, [purchase_id]);
//                     if (!pRows.length) throw { status: 400, message: "Purchase not found" };
//                     purchase = pRows[0];
//                     if (purchase.available_qty < quantity) throw { status: 400, message: "Not enough available qty in purchase" };

//                     // If expiry_date not provided in body, use purchase.expiry_date as fallback
//                     if (!expiry_date || expiry_date === "") {
//                         expiry_date = purchase.expiry_date || null;
//                     } else {
//                         // normalize expiry_date to YYYY-MM-DD (optional)
//                         expiry_date = expiry_date.split('T')[0];
//                     }
//                 } else if (expiry_date) {
//                     expiry_date = expiry_date.split('T')[0];
//                 }

//                 // find or create medicine_stock
//                 let stockRow = null;
//                 if (medicine_stock_id) {
//                     const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
//                     if (!sRows.length) throw { status: 400, message: "Medicine stock batch not found" };
//                     stockRow = sRows[0];
//                 } else {
//                     const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE medicine_id=? AND expiry_date <=> ? FOR UPDATE`, [medicine_id, expiry_date]);
//                     if (sRows.length) {
//                         stockRow = sRows[0];
//                     } else {
//                         const ins = await queryConn(conn, `INSERT INTO medicine_stocks (medicine_id, expiry_date, current_stock) VALUES (?, ?, 0)`, [medicine_id, expiry_date || null]);
//                         const newId = ins.insertId;
//                         const newRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [newId]);
//                         stockRow = newRows[0];
//                     }
//                 }

//                 // reduce purchase.available_qty if used
//                 if (purchase_id) {
//                     await queryConn(conn, `UPDATE purchases SET available_qty = available_qty - ? WHERE id = ?`, [quantity, purchase_id]);
//                 }

//                 // increase medicine stock
//                 await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [quantity, stockRow.id]);

//                 // insert entry
//                 const insEntry = await queryConn(conn, `INSERT INTO entry_medicine_stocks (purchase_id, medicine_stock_id, quantity, entered_by, entered_at) VALUES (?, ?, ?, ?, NOW())`, [purchase_id || null, stockRow.id, quantity, entered_by || null]);

//                 await commitConn(conn);
//                 conn.release();
//                 res.status(201).json({ message: "Entry recorded", entry_id: insEntry.insertId });
//             } catch (e) {
//                 await rollbackConn(conn);
//                 conn.release();
//                 if (e && e.status) return res.status(e.status).json({ message: e.message });
//                 return res.status(500).json({ error: e });
//             }
//         });
//     });
// };

// controllers/entryController.js (potongan createEntry yang diperbaiki)
// exports.createEntry = (req, res) => {
//     const { purchase_id, medicine_id, expiry_date, medicine_stock_id, quantity, entered_by } = req.body;
//     if (!quantity || !medicine_id) return res.status(400).json({ message: "medicine_id and quantity required" });

//     // normalisasi expiry_date: ubah empty string -> null; potong ke YYYY-MM-DD jika ada
//     let expiry = expiry_date ?? null;
//     if (typeof expiry === "string") {
//         expiry = expiry.trim() === "" ? null : expiry.slice(0, 10); // safe: take YYYY-MM-DD
//     } else {
//         expiry = null;
//     }

//     console.log("CREATE ENTRY - payload:", { purchase_id, medicine_id, expiry, medicine_stock_id, quantity, entered_by });

//     db.getConnection((err, conn) => {
//         if (err) return res.status(500).json({ error: err });
//         conn.beginTransaction(async (tErr) => {
//             if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }

//             try {
//                 // validate purchase if provided
//                 let purchase = null;
//                 if (purchase_id) {
//                     const pRows = await queryConn(conn, `SELECT * FROM purchases WHERE id=? FOR UPDATE`, [purchase_id]);
//                     if (!pRows.length) throw { status: 400, message: "Purchase not found" };
//                     purchase = pRows[0];
//                     if (purchase.available_qty < quantity) throw { status: 400, message: "Not enough available qty in purchase" };
//                 }

//                 // find or create medicine_stock: use explicit IS NULL or = comparison
//                 let stockRow = null;
//                 if (medicine_stock_id) {
//                     const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
//                     if (!sRows.length) throw { status: 400, message: "Medicine stock batch not found" };
//                     stockRow = sRows[0];
//                 } else {
//                     let sRows;
//                     if (expiry === null) {
//                         sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE medicine_id=? AND expiry_date IS NULL FOR UPDATE`, [medicine_id]);
//                     } else {
//                         sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE medicine_id=? AND expiry_date = ? FOR UPDATE`, [medicine_id, expiry]);
//                     }

//                     console.log("FIND stock result for expiry", expiry, sRows);

//                     if (sRows.length) {
//                         stockRow = sRows[0];
//                     } else {
//                         // insert new batch with explicit expiry (null or YYYY-MM-DD)
//                         const ins = await queryConn(conn, `INSERT INTO medicine_stocks (medicine_id, expiry_date, current_stock) VALUES (?, ?, 0)`, [medicine_id, expiry]);
//                         const newId = ins.insertId;
//                         const newRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [newId]);
//                         stockRow = newRows[0];
//                         console.log("Created new stockRow:", stockRow);
//                     }
//                 }

//                 // now update p.available & ms.current_stock and insert entry (unchanged)
//                 if (purchase_id) {
//                     await queryConn(conn, `UPDATE purchases SET available_qty = available_qty - ? WHERE id = ?`, [quantity, purchase_id]);
//                 }
//                 await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [quantity, stockRow.id]);
//                 const insEntry = await queryConn(conn, `INSERT INTO entry_medicine_stocks (purchase_id, medicine_stock_id, quantity, entered_by, entered_at) VALUES (?, ?, ?, ?, NOW())`, [purchase_id || null, stockRow.id, quantity, entered_by || null]);

//                 await commitConn(conn);
//                 conn.release();
//                 res.status(201).json({ message: "Entry recorded", entry_id: insEntry.insertId });
//             } catch (e) {
//                 await rollbackConn(conn);
//                 conn.release();
//                 if (e && e.status) return res.status(e.status).json({ message: e.message });
//                 return res.status(500).json({ error: e });
//             }
//         });
//     });
// };

// CREATE entry : improved version (fix expiry timezone issue)
// exports.createEntry = (req, res) => {
//   let { purchase_id, medicine_id, expiry_date, medicine_stock_id, quantity, entered_by } = req.body;

//   // Validasi dasar
//   if (!quantity || !medicine_id)
//     return res.status(400).json({ message: "medicine_id and quantity required" });

//   // 🕐 Normalisasi expiry_date agar tidak ikut timezone
//   if (expiry_date instanceof Date) {
//     expiry_date = expiry_date.toISOString().split("T")[0];
//   } else if (typeof expiry_date === "string") {
//     expiry_date = expiry_date.split("T")[0]; // ambil hanya 'YYYY-MM-DD'
//   }

//   console.log("CREATE ENTRY - normalized expiry:", expiry_date);

//   db.getConnection((err, conn) => {
//     if (err) return res.status(500).json({ error: err });
//     conn.beginTransaction(async (tErr) => {
//       if (tErr) {
//         conn.release();
//         return res.status(500).json({ error: tErr });
//       }

//       try {
//         // ✅ 1. Validasi purchase (jika ada)
//         let purchase = null;
//         if (purchase_id) {
//           const pRows = await queryConn(
//             conn,
//             `SELECT * FROM purchases WHERE id=? FOR UPDATE`,
//             [purchase_id]
//           );
//           if (!pRows.length)
//             throw { status: 400, message: "Purchase not found" };

//           purchase = pRows[0];
//           if (purchase.available_qty < quantity)
//             throw {
//               status: 400,
//               message: "Not enough available qty in purchase",
//             };
//         }

//         // ✅ 2. Cari atau buat batch medicine_stock
//         let stockRow = null;
//         if (medicine_stock_id) {
//           const sRows = await queryConn(
//             conn,
//             `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`,
//             [medicine_stock_id]
//           );
//           if (!sRows.length)
//             throw { status: 400, message: "Medicine stock batch not found" };
//           stockRow = sRows[0];
//         } else {
//           const sRows = await queryConn(
//             conn,
//             `SELECT * FROM medicine_stocks WHERE medicine_id=? AND expiry_date <=> ? FOR UPDATE`,
//             [medicine_id, expiry_date || null]
//           );

//           if (sRows.length) {
//             stockRow = sRows[0];
//             console.log("Found existing stockRow:", stockRow);
//           } else {
//             const ins = await queryConn(
//               conn,
//               `INSERT INTO medicine_stocks (medicine_id, expiry_date, current_stock)
//                VALUES (?, ?, 0)`,
//               [medicine_id, expiry_date || null]
//             );

//             const newId = ins.insertId;
//             const newRows = await queryConn(
//               conn,
//               `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`,
//               [newId]
//             );
//             stockRow = newRows[0];
//             console.log("🆕 Created new stockRow with expiry:", expiry_date);
//           }
//         }

//         // ✅ 3. Kurangi stok tersedia di purchases (jika pakai purchase_id)
//         if (purchase_id) {
//           await queryConn(conn, 
//             `UPDATE purchases SET available_qty = available_qty - ? WHERE id = ?`, 
//             [quantity, purchase_id]
//           );
//         }

//         // ✅ 4. Tambahkan stok di medicine_stocks
//         await queryConn(conn, 
//           `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, 
//           [quantity, stockRow.id]
//         );

//         // ✅ 5. Masukkan catatan entry
//         const insEntry = await queryConn(
//           conn,
//           `INSERT INTO entry_medicine_stocks (purchase_id, medicine_stock_id, quantity, entered_by, entered_at)
//            VALUES (?, ?, ?, ?, NOW())`,
//           [purchase_id || null, stockRow.id, quantity, entered_by || null]
//         );

//         await commitConn(conn);
//         conn.release();

//         res.status(201).json({
//           message: "Entry recorded successfully",
//           entry_id: insEntry.insertId,
//           stock_id: stockRow.id,
//           expiry_date: expiry_date,
//         });
//       } catch (e) {
//         await rollbackConn(conn);
//         conn.release();
//         if (e && e.status)
//           return res.status(e.status).json({ message: e.message });
//         return res.status(500).json({ error: e });
//       }
//     });
//   });
// };

exports.createEntry = (req, res) => {
  const { purchase_id, medicine_id, expiry, medicine_stock_id, quantity, entered_by } = req.body;

  if (!medicine_id || !quantity)
    return res.status(400).json({ message: "medicine_id and quantity required" });

  // Pastikan expiry dalam format 'YYYY-MM-DD' (string, no timezone)
  const expiry_date = expiry ? expiry.toString().slice(0, 10) : null;

  console.log("CREATE ENTRY - payload:", { purchase_id, medicine_id, expiry, expiry_date, medicine_stock_id, quantity });

  db.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: err });
    conn.beginTransaction(async (tErr) => {
      if (tErr) {
        conn.release();
        return res.status(500).json({ error: tErr });
      }

      try {
        // 1️⃣ Validasi purchase (jika ada)
        let purchase = null;
        if (purchase_id) {
          const [p] = await queryConn(conn, "SELECT * FROM purchases WHERE id=? FOR UPDATE", [purchase_id]);
          if (!p) throw { status: 400, message: "Purchase not found" };
          purchase = p;
          if (purchase.available_qty < quantity)
            throw { status: 400, message: "Not enough available qty in purchase" };
        }

        // 2️⃣ Cari batch stok (pakai DATE_FORMAT agar tidak konversi timezone)
        let stockRow = null;
        if (medicine_stock_id) {
          const [s] = await queryConn(conn, "SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE", [medicine_stock_id]);
          if (!s) throw { status: 400, message: "Medicine stock batch not found" };
          stockRow = s;
        } else {
          const sRows = await queryConn(
            conn,
            `SELECT id, medicine_id, DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date, current_stock 
             FROM medicine_stocks 
             WHERE medicine_id=? AND expiry_date <=> ? 
             FOR UPDATE`,
            [medicine_id, expiry_date]
          );

          console.log("FIND stock result for expiry", expiry_date, sRows);

          if (sRows.length > 0) {
            stockRow = sRows[0];
          } else {
            const ins = await queryConn(
              conn,
              "INSERT INTO medicine_stocks (medicine_id, expiry_date, current_stock) VALUES (?, ?, 0)",
              [medicine_id, expiry_date]
            );
            const [newStock] = await queryConn(
              conn,
              `SELECT id, medicine_id, DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date, current_stock 
               FROM medicine_stocks 
               WHERE id=? FOR UPDATE`,
              [ins.insertId]
            );
            stockRow = newStock;
            console.log("🆕 Created new stockRow:", stockRow);
          }
        }

        // 3️⃣ Update purchase (jika ada)
        if (purchase_id) {
          await queryConn(conn, "UPDATE purchases SET available_qty = available_qty - ? WHERE id=?", [quantity, purchase_id]);
        }

        // 4️⃣ Update stok obat
        await queryConn(conn, "UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id=?", [quantity, stockRow.id]);

        // 5️⃣ Tambahkan catatan entry
        const insEntry = await queryConn(
          conn,
          `INSERT INTO entry_medicine_stocks (purchase_id, medicine_stock_id, quantity, entered_by, entered_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [purchase_id || null, stockRow.id, quantity, entered_by || null]
        );

        await commitConn(conn);
        conn.release();

        res.status(201).json({
          message: "Entry recorded successfully",
          entry_id: insEntry.insertId,
          stock_id: stockRow.id,
          expiry_date: stockRow.expiry_date,
        });
      } catch (e) {
        await rollbackConn(conn);
        conn.release();
        if (e.status) return res.status(e.status).json({ message: e.message });
        console.error(e);
        return res.status(500).json({ error: e.message || e });
      }
    });
  });
};


// LIST entries (simple join info)
exports.listEntries = (req, res) => {
    //   const sql = `
    //     SELECT e.*, p.medicine_id AS purchase_medicine_id, pr.medicine_id AS purchase_medicine_id2, pr.medicine_id,
    //            pr.medicine_id, pr.expiry_date AS purchase_expiry, pr.available_qty AS purchase_available,
    //            m.name AS medicine_name, ms.expiry_date AS stock_expiry, ms.current_stock AS stock_current,
    //            pu.name AS supplier_name
    //     FROM entry_medicine_stocks e
    //     LEFT JOIN medicine_stocks ms ON e.medicine_stock_id = ms.id
    //     LEFT JOIN medicines m ON ms.medicine_id = m.id
    //     LEFT JOIN purchases pr ON e.purchase_id = pr.id
    //     LEFT JOIN suppliers pu ON pr.supplier_id = pu.id
    //     ORDER BY e.entered_at DESC
    //   `;
    const sql = `
    SELECT e.*,
         pr.medicine_id AS purchase_medicine_id,
         pr.expiry_date AS purchase_expiry,
         pr.available_qty AS purchase_available,
         m.name AS medicine_name,
         ms.expiry_date AS stock_expiry,
         ms.current_stock AS stock_current,
         pu.name AS supplier_name
  FROM entry_medicine_stocks e
  LEFT JOIN medicine_stocks ms ON e.medicine_stock_id = ms.id
  LEFT JOIN medicines m ON ms.medicine_id = m.id
  LEFT JOIN purchases pr ON e.purchase_id = pr.id
  LEFT JOIN suppliers pu ON pr.supplier_id = pu.id
  ORDER BY e.entered_at DESC
  `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error", error: err });
        res.json(rows);
    });
};

// GET entry by id
exports.getEntryById = (req, res) => {
    const id = req.params.id;
    const sql = `
    SELECT e.*, ms.medicine_id, m.name AS medicine_name, ms.expiry_date AS stock_expiry, ms.current_stock AS stock_current,
           pr.available_qty AS purchase_available, pr.quantity AS purchase_quantity, pr.expiry_date AS purchase_expiry
    FROM entry_medicine_stocks e
    LEFT JOIN medicine_stocks ms ON e.medicine_stock_id = ms.id
    LEFT JOIN medicines m ON ms.medicine_id = m.id
    LEFT JOIN purchases pr ON e.purchase_id = pr.id
    WHERE e.id = ?
  `;
    db.query(sql, [id], (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error", error: err });
        if (!rows.length) return res.status(404).json({ message: "Entry not found" });
        res.json(rows[0]);
    });
};

// UPDATE entry: adjust purchases.available_qty and medicine_stocks.current_stock accordingly
// Logic:
// - Lock involved rows FOR UPDATE
// - Compute delta = newQuantity - oldQuantity
// - If purchase_id changed: revert old purchase.available_qty += oldQuantity (if had purchase), deduct new purchase.available_qty -= newQuantity (check enough)
// - If medicine_stock_id changed (target stock batch), reduce/increase appropriate stock.current_stock
// - If same purchase/stock, just adjust by delta with checks
exports.updateEntry = (req, res) => {
    const id = req.params.id;
    const { purchase_id, medicine_stock_id, quantity, entered_by } = req.body;
    if (!quantity) return res.status(400).json({ message: "quantity required" });

    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: err });
        conn.beginTransaction(async (tErr) => {
            if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }
            try {
                // fetch existing entry FOR UPDATE
                const existingRows = await queryConn(conn, `SELECT * FROM entry_medicine_stocks WHERE id=? FOR UPDATE`, [id]);
                if (!existingRows.length) throw { status: 404, message: "Entry not found" };
                const existing = existingRows[0];
                const oldQty = Number(existing.quantity);
                const newQty = Number(quantity);

                // If old purchase existed, restore its available_qty by oldQty (we'll later deduct if new purchase used)
                if (existing.purchase_id) {
                    await queryConn(conn, `UPDATE purchases SET available_qty = available_qty + ? WHERE id = ?`, [oldQty, existing.purchase_id]);
                }

                // If old medicine_stock exists, subtract oldQty from that stock (we will later add newQty to new target)
                if (existing.medicine_stock_id) {
                    await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock - ? WHERE id = ?`, [oldQty, existing.medicine_stock_id]);
                }

                // Now handle new purchase (if provided)
                if (purchase_id) {
                    const pRows = await queryConn(conn, `SELECT * FROM purchases WHERE id=? FOR UPDATE`, [purchase_id]);
                    if (!pRows.length) throw { status: 400, message: "Target purchase not found" };
                    const p = pRows[0];
                    if (p.available_qty < newQty) throw { status: 400, message: "Not enough available_qty in chosen purchase" };
                    await queryConn(conn, `UPDATE purchases SET available_qty = available_qty - ? WHERE id = ?`, [newQty, purchase_id]);
                }

                // Handle target stock batch: find or create
                let targetStock = null;
                if (medicine_stock_id) {
                    const sRows = await queryConn(conn, `SELECT * FROM medicine_stocks WHERE id=? FOR UPDATE`, [medicine_stock_id]);
                    if (!sRows.length) throw { status: 400, message: "Target stock batch not found" };
                    targetStock = sRows[0];
                } else {
                    // if no explicit target, use existing entry's stock batch (but we've already subtracted oldQty)
                    throw { status: 400, message: "Target medicine_stock_id is required on update" };
                }

                // Add newQty to target stock
                await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock + ? WHERE id = ?`, [newQty, targetStock.id]);

                // Update entry record
                await queryConn(conn, `UPDATE entry_medicine_stocks SET purchase_id=?, medicine_stock_id=?, quantity=?, entered_by=?, entered_at=NOW() WHERE id=?`, [purchase_id || null, medicine_stock_id, newQty, entered_by || null, id]);

                await commitConn(conn);
                conn.release();
                res.json({ message: "Entry updated successfully" });
            } catch (e) {
                await rollbackConn(conn);
                conn.release();
                if (e && e.status) return res.status(e.status).json({ message: e.message });
                return res.status(500).json({ error: e });
            }
        });
    });
};

// DELETE entry : revert effects (increase purchase.available_qty, subtract medicine_stocks.current_stock) then delete entry row
exports.deleteEntry = (req, res) => {
    const id = req.params.id;
    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: err });
        conn.beginTransaction(async (tErr) => {
            if (tErr) { conn.release(); return res.status(500).json({ error: tErr }); }
            try {
                const eRows = await queryConn(conn, `SELECT * FROM entry_medicine_stocks WHERE id=? FOR UPDATE`, [id]);
                if (!eRows.length) throw { status: 404, message: "Entry not found" };
                const e = eRows[0];

                // revert purchase.available_qty if linked
                if (e.purchase_id) {
                    await queryConn(conn, `UPDATE purchases SET available_qty = available_qty + ? WHERE id = ?`, [e.quantity, e.purchase_id]);
                }

                // subtract from medicine_stocks
                if (e.medicine_stock_id) {
                    // ensure enough current_stock to remove (should be since entry added earlier)
                    await queryConn(conn, `UPDATE medicine_stocks SET current_stock = current_stock - ? WHERE id = ?`, [e.quantity, e.medicine_stock_id]);
                }

                // delete entry row
                await queryConn(conn, `DELETE FROM entry_medicine_stocks WHERE id = ?`, [id]);

                await commitConn(conn);
                conn.release();
                res.json({ message: "Entry deleted and effects reverted" });
            } catch (e) {
                await rollbackConn(conn);
                conn.release();
                if (e && e.status) return res.status(e.status).json({ message: e.message });
                return res.status(500).json({ error: e });
            }
        });
    });
};
