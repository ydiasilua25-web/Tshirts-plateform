const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Connexion MongoDB
mongoose.connect("mongodb://localhost:27017/tshirt_db");

// 📦 MODELS
const User = mongoose.model("User", {
  email: String,
  password: String,
  role: String,
  pointVente: String
});

const Tshirt = mongoose.model("Tshirt", {
  code: String,
  vendu: { type: Boolean, default: false }
});

const Vente = mongoose.model("Vente", {
  tshirtCode: String,
  pointVente: String,
  agent: String,
  date: { type: Date, default: Date.now }
});

// 🔐 LOGIN
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Utilisateur non trouvé");

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.status(400).send("Mot de passe incorrect");

  const token = jwt.sign({ id: user._id, role: user.role }, "SECRET");
  res.json({ token, user });
});

// 📷 SCAN QR
app.post("/scan", async (req, res) => {
  const { code, agent, pointVente } = req.body;

  const tshirt = await Tshirt.findOne({ code });
  if (!tshirt) return res.send("T-shirt invalide");

  if (tshirt.vendu) return res.send("Déjà vendu");

  tshirt.vendu = true;
  await tshirt.save();

  const vente = new Vente({
    tshirtCode: code,
    agent,
    pointVente
  });

  await vente.save();

  res.send("Vente enregistrée");
});

// 📊 GET SALES
app.get("/sales", async (req, res) => {
  const ventes = await Vente.find();
  res.json(ventes);
});

app.listen(3000, () => console.log("Serveur lancé sur port 3000"));