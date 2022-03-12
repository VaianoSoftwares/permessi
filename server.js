import express from "express";
import path from "path";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";

const app = express();

const __dirname = path.resolve();

// middlewares configs
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({ exposedHeaders: "auth-token" }));

// print out request endpoint url & method
app.use((req, res, next) => {
    console.log(`Request endpoint: ${req.method} ${req.url}`);
    next();
});

// static route
app.use("/api/v1/static", express.static(path.resolve(__dirname, "static")));

// routes 
app.use("/api/v1/auth", authRoutes);

// root route: render index.html
app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "static", "index.html")));

// failed request
app.get("*", (req, res) => res.status(404).send("page not found"));

export default app;