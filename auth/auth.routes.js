import express from "express";
import UsersCtrl from "./users.controller.js";
import verifyToken from "./verifyToken.js";

const Router = express.Router();

Router
    .route("/login")
        .post(UsersCtrl.apiLogin);

Router
    .route("/register")
        .post(verifyToken, UsersCtrl.apiRegister);

Router
    .use("/permessi", verifyToken)
    .route("/permessi")
        .get()
        .post()
        .delete();

export default Router;