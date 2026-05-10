const express = require("express");
const fs = require("fs");
const session = require("express-session");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET || "default_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // В production поставьте true и используйте HTTPS
}));

const DB_FILE = process.env.DB_FILE || "/app/data/db.json";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { printers: [], plastics: [], settings: { rejectCoef: 1.2, operatorCost: 100, markup: 1.5 } };
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Проверка авторизации
function isAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Не авторизован" });
  }
}

app.get("/api/data", (req, res) => {
  res.json(loadDB());
});

// Вход администратора
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Неверный пароль" });
  }
});

// Выход
app.post("/api/logout", (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

// Проверка статуса авторизации
app.get("/api/auth-status", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post("/api/printer", isAdmin, (req, res) => {
  const db = loadDB();
  req.body.id = Date.now().toString();
  db.printers.push(req.body);
  saveDB(db);
  res.sendStatus(200);
});

app.delete("/api/printer/:id", isAdmin, (req, res) => {
  const db = loadDB();
  db.printers = db.printers.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.sendStatus(200);
});

app.post("/api/plastic", isAdmin, (req, res) => {
  const db = loadDB();
  req.body.id = Date.now().toString();
  db.plastics.push(req.body);
  saveDB(db);
  res.sendStatus(200);
});

app.delete("/api/plastic/:id", isAdmin, (req, res) => {
  const db = loadDB();
  db.plastics = db.plastics.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.sendStatus(200);
});

app.post("/api/settings", isAdmin, (req, res) => {
  const db = loadDB();
  db.settings = req.body;
  saveDB(db);
  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));