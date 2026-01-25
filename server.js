require("dotenv").config();
console.log("✅ API starting...");

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const Stripe = require("stripe");
const { Resend } = require("resend");

const app = express();

app.use(cors({ origin: true, credentials: false }));

// ✅ Stripe + Resend
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-08-27.basil" });
const resend = new Resend(process.env.RESEND_API_KEY);

// 🔌 Neon pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * ✅ Webhook Stripe
 * IMPORTANTE: raw body solo aquí
 */
app.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !secret) return res.status(400).send("Missing signature or secret");

    // ✅ Verificar firma
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email =
        session.customer_details?.email ||
        session.customer_email ||
        null;

      if (email) {
        // ✅ (por ahora) manda correo simple de prueba
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Calculadora Pro <onboarding@resend.dev>",
          to: email,
          subject: "Tu acceso a Calculadora Pro está listo 🧮✨",
          html: `<p>Hola 💜</p><p>Pago recibido. (Siguiente paso: magic link 24h 🪄)</p>`
        });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ✅ JSON para el resto de rutas
app.use(express.json());

app.get("/", (req, res) => res.send("✅ Calculadora Pro API running. Usa /health"));

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now()");
    res.json({ status: "ok", db_time: r.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🚀 Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Calculadora Pro backend corriendo en http://localhost:${PORT}`));
