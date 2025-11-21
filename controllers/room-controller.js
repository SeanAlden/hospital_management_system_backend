const db = require("../config/db");

// Tambah Room
exports.addRoom = (req, res) => {
  const { room_number, type, status, rate_per_day } = req.body;
  const sql = "INSERT INTO rooms (room_number, type, status, rate_per_day) VALUES (?, ?, ?, ?)";
  const values = [room_number, type, status, rate_per_day];

  db.query(sql, values, (err, result) => {
    if (err) return res.json({ message: "Error: " + err });
    return res.json({ success: "Room added successfully" });
  });
};

// Get All Rooms
exports.getAllRooms = (req, res) => {
  const sql = "SELECT * FROM rooms";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Server error" });
    return res.json(result);
  });
};

// Get Room by ID
exports.getRoomById = (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM rooms WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Server error" });
    return res.json(result);
  });
};

// Edit Room
exports.editRoom = (req, res) => {
  const id = req.params.id;
  const { room_number, type, status, rate_per_day } = req.body;
  const sql = "UPDATE rooms SET room_number=?, type=?, status=?, rate_per_day=? WHERE id=?";
  const values = [room_number, type, status, rate_per_day, id];

  db.query(sql, values, (err, result) => {
    if (err) return res.json({ message: "Error: " + err });
    return res.json({ success: "Room updated successfully" });
  });
};

// Delete Room
exports.deleteRoom = (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM rooms WHERE id=?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error: " + err });
    return res.json({ success: "Room deleted successfully" });
  });
};
