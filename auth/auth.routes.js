import express from "express";
import UsersCtrl from "./users.controller.js";
import verifyToken from "./verifyToken.js";
import isAdmin from "./isAdmin.js";

const Router = express.Router();

Router
    .route("/login")
        .post(UsersCtrl.apiLogin);

Router
    .route("/register")
        .post(verifyToken, isAdmin, UsersCtrl.apiRegister);

Router
    .use("/permessi", verifyToken)
    .get("/permessi", UsersCtrl.apiGetPermessi)
    .post("/permessi/push", UsersCtrl.apiPushPermessi)
    .post("/permessi/pull", UsersCtrl.apiPullPermessi);

export default Router;