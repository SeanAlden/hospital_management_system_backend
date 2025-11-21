// // controllers/userController.js
// const db = require("../config/db");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// // SECRET untuk JWT (jaga aman di .env pada production)
// const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";
// const TOKEN_EXPIRES_IN = "7d"; // contoh

// // helper: generate token (JWT)
// function generateToken(payload) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
// }

// // register
// exports.register = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     if (!username || !password)
//       return res.status(400).json({ message: "username and password required" });

//     // check exists
//     db.query("SELECT id FROM users WHERE username = ?", [username], async (err, rows) => {
//       if (err) return res.status(500).json({ message: "DB error", error: err });
//       if (rows.length) return res.status(400).json({ message: "Username already taken" });

//       const hash = await bcrypt.hash(password, 10);
//       db.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash], (err2, result) => {
//         if (err2) return res.status(500).json({ message: "Insert error", error: err2 });
//         res.status(201).json({ id: result.insertId, message: "User created" });
//       });
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Server error", error: e.message });
//   }
// };

// // login
// exports.login = (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) return res.status(400).json({ message: "username and password required" });

//   db.query("SELECT * FROM users WHERE username = ?", [username], async (err, rows) => {
//     if (err) return res.status(500).json({ message: "DB error", error: err });
//     if (!rows.length) return res.status(400).json({ message: "Invalid credentials" });

//     const user = rows[0];
//     const ok = await bcrypt.compare(password, user.password_hash);
//     if (!ok) return res.status(400).json({ message: "Invalid credentials" });

//     // generate token (JWT)
//     const token = generateToken({ id: user.id, username: user.username });

//     // simpan token di db (opsional) — memudahkan logout invalidasi
//     db.query("UPDATE users SET token = ? WHERE id = ?", [token, user.id], (err2) => {
//       if (err2) console.error("Failed to update token:", err2);
//       // kirim token dan user basic info
//       res.json({ token, user: { id: user.id, username: user.username } });
//     });
//   });
// };

// // logout -> invalidate token in db
// exports.logout = (req, res) => {
//   // token di header Authorization: Bearer <token>
//   const auth = req.headers.authorization;
//   if (!auth) return res.status(400).json({ message: "No token" });
//   const token = auth.split(" ")[1];

//   // set token = NULL for that user
//   db.query("UPDATE users SET token = NULL WHERE token = ?", [token], (err) => {
//     if (err) return res.status(500).json({ message: "DB error", error: err });
//     res.json({ message: "Logged out" });
//   });
// };

// // me -> validate token and return user
// exports.me = (req, res) => {
//   // middleware auth will set req.user if valid
//   if (!req.user) return res.status(401).json({ message: "Not authenticated" });
//   res.json({ id: req.user.id, username: req.user.username });
// };

// controllers/userController.js
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// SECRET untuk JWT (jaga aman di .env pada production)
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";
const TOKEN_EXPIRES_IN = "7d"; // contoh

// helper: generate token (JWT)
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

// helper: ambil user by id
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, username, email, phone, password_hash, token FROM users WHERE id = ?", [id], (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve(null);
      resolve(rows[0]);
    });
  });
}

// register
exports.register = async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username and password required" });

    // check exists (username OR email OR phone)
    db.query(
      "SELECT id, username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?",
      [username, email || "", phone || ""],
      async (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error", error: err });
        if (rows.length) {
          // cari yang konflik
          const r = rows[0];
          if (r.username === username) return res.status(400).json({ message: "Username already taken" });
          if (email && r.email === email) return res.status(400).json({ message: "Email already taken" });
          if (phone && r.phone === phone) return res.status(400).json({ message: "Phone already taken" });
          return res.status(400).json({ message: "User info conflict" });
        }

        const hash = await bcrypt.hash(password, 10);
        db.query(
          "INSERT INTO users (username, password_hash, email, phone) VALUES (?, ?, ?, ?)",
          [username, hash, email || null, phone || null],
          (err2, result) => {
            if (err2) return res.status(500).json({ message: "Insert error", error: err2 });
            res.status(201).json({ id: result.insertId, message: "User created" });
          }
        );
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// login
exports.login = (req, res) => {
  const { identifier, password } = req.body; // identifier bisa username/email/phone
  if (!identifier || !password) return res.status(400).json({ message: "identifier and password required" });

  // ambil user berdasarkan username OR email OR phone
  db.query(
    "SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?",
    [identifier, identifier, identifier],
    async (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      if (!rows.length) return res.status(400).json({ message: "Invalid credentials" });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ message: "Invalid credentials" });

      // generate token (JWT)
      const token = generateToken({ id: user.id, username: user.username });

      // simpan token di db (opsional) — memudahkan logout invalidasi
      db.query("UPDATE users SET token = ? WHERE id = ?", [token, user.id], (err2) => {
        if (err2) console.error("Failed to update token:", err2);
        // kirim token dan user basic info (sensitive fields omitted)
        res.json({
          token,
          user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
        });
      });
    }
  );
};

// logout -> invalidate token in db
exports.logout = (req, res) => {
  // token di header Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (!auth) return res.status(400).json({ message: "No token" });
  const token = auth.split(" ")[1];

  // set token = NULL for that user
  db.query("UPDATE users SET token = NULL WHERE token = ?", [token], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    res.json({ message: "Logged out" });
  });
};

// me -> validate token and return user
// Middleware auth diharapkan sudah set req.user
exports.me = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  res.json({ 
    id: req.user.id, 
    username: req.user.username, 
    email: req.user.email, 
    phone: req.user.phone 
  });
};

// update profile -> requires auth (req.user)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { username, email, phone } = req.body;
    if (!username && !email && !phone) return res.status(400).json({ message: "Nothing to update" });

    // check uniqueness: ensure no other user has the same username/email/phone
    db.query(
      "SELECT id, username, email, phone FROM users WHERE (username = ? OR email = ? OR phone = ?) AND id <> ?",
      [username || "", email || "", phone || "", req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error", error: err });
        if (rows.length) {
          const r = rows[0];
          if (r.username === username) return res.status(400).json({ message: "Username already taken" });
          if (email && r.email === email) return res.status(400).json({ message: "Email already taken" });
          if (phone && r.phone === phone) return res.status(400).json({ message: "Phone already taken" });
          return res.status(400).json({ message: "Conflict with existing user" });
        }

        db.query(
          "UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?",
          [username || req.user.username, email || req.user.email, phone || req.user.phone, req.user.id],
          (err2) => {
            if (err2) return res.status(500).json({ message: "DB error", error: err2 });
            // optionally return updated user
            res.json({ message: "Profile updated", user: { id: req.user.id, username: username || req.user.username, email: email || req.user.email, phone: phone || req.user.phone } });
          }
        );
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

// update password -> requires auth (req.user)
exports.updatePassword = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword required" });

    // ambil user (termasuk password_hash)
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.id], (err) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ message: "Password updated" });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};
