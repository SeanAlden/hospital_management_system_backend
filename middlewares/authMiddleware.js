// // middlewares/authMiddleware.js
// const jwt = require("jsonwebtoken");
// const db = require("../config/db");
// const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";

// module.exports = function (req, res, next) {
//   const auth = req.headers.authorization;
//   if (!auth) return res.status(401).json({ message: "Missing Authorization header" });
//   const parts = auth.split(" ");
//   if (parts.length !== 2) return res.status(401).json({ message: "Invalid Authorization header" });
//   const token = parts[1];

//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     // optional: check token exists in DB (ensure not logged out)
//     db.query("SELECT id, username, token FROM users WHERE id = ? LIMIT 1", [payload.id], (err, rows) => {
//       if (err) return res.status(500).json({ message: "DB error", error: err });
//       if (!rows.length) return res.status(401).json({ message: "Invalid token (user not found)" });
//       const user = rows[0];
//       if (!user.token || user.token !== token) return res.status(401).json({ message: "Invalid token (revoked)" });

//       req.user = { id: user.id, username: user.username };
//       next();
//     });
//   } catch (e) {
//     return res.status(401).json({ message: "Invalid token", error: e.message });
//   }
// };

// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";

module.exports = function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid Authorization format" });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // cek user + token di DB
    db.query(
      "SELECT id, username, email, phone, token FROM users WHERE id = ? LIMIT 1",
      [payload.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error", error: err });

        if (!rows.length) {
          return res.status(401).json({ message: "Invalid token (user not found)" });
        }

        const user = rows[0];

        if (!user.token || user.token !== token) {
          return res.status(401).json({ message: "Invalid token (revoked)" });
        }

        // simpan user di req.user agar bisa digunakan oleh controller
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone
        };

        next();
      }
    );
  } catch (e) {
    return res.status(401).json({ message: "Invalid token", error: e.message });
  }
};
