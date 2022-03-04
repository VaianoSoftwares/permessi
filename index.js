import app from "./server.js";
import mongodb from "mongodb";
import https from "https";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// dotenv config
dotenv.config();

const privateKey = fs.readFileSync(path.join("certs", "server.key"));
const certificate = fs.readFileSync(path.join("certs", "server.cert"));

const credentials = {
  key: privateKey,
  cert: certificate
};

import UsersDAO from "./dao/users.dao.js";

const MongoClient = mongodb.MongoClient;
const port = process.env.PORT || 5001;
const httpsServer = https.createServer(credentials, app);

MongoClient.connect(process.env.ACCESSI_DB_URI)
  .then(async client => {
    await UsersDAO.injectDB(client);
    httpsServer.listen(port, () => console.log(`HTTPS Server running on port ${port}.`));
  })
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });