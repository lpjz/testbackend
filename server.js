const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 3306; // กำหนดค่าพอร์ต

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// สร้างการเชื่อมต่อกับ MySQL
const db = mysql.createConnection({
  host: "t89yihg12rw77y6f.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "xhdg3vp59a3lqizu",
  password: "p48xhsxzoiqzvcsh",
  database: "mnw83d9ck42xsdph",
  port: "3306"
});

db.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("connected as id " + db.threadId);
});

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ตามเวลาปัจจุบันเพื่อหลีกเลี่ยงการซ้ำกัน
  }
});

const upload = multer({ storage: storage });

// Route สำหรับรับข้อมูลจากฟอร์ม
app.post("/register", upload.single("file"), (req, res) => {
  const { name, gender, age } = req.body;
  const file = req.file.filename; // ใช้ชื่อไฟล์ที่อัปโหลดมา

  // ตรวจสอบว่ามีชื่อซ้ำหรือไม่
  const checkQuery = "SELECT * FROM joinnow WHERE name = ?";
  db.query(checkQuery, [name], (err, results) => {
    if (err) {
      console.error("error checking data: " + err.stack);
      res.status(500).send("Database query failed");
      return;
    }

    if (results.length > 0) {
      // ถ้าพบชื่อซ้ำ
      res.status(400).send("You have already registered.");
    } else {
      // ตรวจสอบข้อมูลว่าครบถ้วนหรือไม่
      if (!name || !gender || !age || !file) {
        res.status(400).send("All fields are required.");
        return;
      }

      // ถ้าไม่พบชื่อซ้ำ ให้ทำการบันทึกข้อมูลใหม่
      const query =
        "INSERT INTO joinnow (name, gender, age, file) VALUES (?, ?, ?, ?)";
      db.query(query, [name, gender, age, file], (err, results) => {
        if (err) {
          console.error("error inserting data: " + err.stack);
          res.status(500).send("Database insert failed");
          return;
        }
        res.status(200).send("Data inserted successfully");
      });
    }
  });
});

// Route สำหรับดึงข้อมูลทั้งหมดจากตาราง joinnow
app.get("/admin/users", (req, res) => {
  const query = "SELECT * FROM joinnow";
  db.query(query, (err, results) => {
    if (err) {
      console.error("error fetching data: " + err.stack);
      res.status(500).send("Database fetch failed");
      return;
    }
    res.status(200).json(results);
  });
});

// Route สำหรับลบข้อมูลผู้ใช้ตาม id
app.delete("/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM joinnow WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("error deleting data: " + err.stack);
      res.status(500).send("Database delete failed");
      return;
    }
    res.status(200).send("Data deleted successfully");
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
