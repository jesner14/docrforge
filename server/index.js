import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { seedDatabase } from "./seed.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerDataRoutes } from "./routes/data.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const origin = process.env.CLIENT_ORIGIN || "http://localhost:2000";

app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

registerAuthRoutes(app);
registerDataRoutes(app);

async function start() {
  try {
    await seedDatabase();
    app.listen(port, () => {
      console.log(`DocForge API → http://localhost:${port}`);
      console.log(`CORS origin → ${origin}`);
    });
  } catch (err) {
    console.error("Impossible de démarrer le serveur:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

start();
