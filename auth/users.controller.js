import UsersDAO from "../dao/users.dao.js";
import Validator from "./validation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default class UsersController {
    static async apiRegister(req, res) {
        try {
            const user = await UsersDAO.getUserByName(req.body.username);
            if(user) {
                throw new Error(`Username ${req.body.username} gia' esistente`);
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPsw = await bcrypt.hash(req.body.password, salt);
            const { error } = await UsersDAO.addUser({ ...req.body, password: hashedPsw, permessi: [] });
            if(error) {
                throw new Error(error.message);
            }
            res.redirect("/login");
        } catch(err) {
            console.log(err);
            res.redirect("/register");
        }
    }

    static async apiLogin(req, res) {
        const { error } = Validator.login(req.body);

        if(error) {
            const msg = error.details[0].message;
            console.log("postLogin - ", msg);
            res.status(400).json({ success: false, msg: msg });
            return;
        }

        const { username, password } = req.body;

        try {
            const user = await UsersDAO.getUserByName(username);
            if(!user) {
                throw new Error("Username/Password non validi.");
            }

            const isPswValid = await bcrypt.compare(password, user.password);
            if(!isPswValid) {
                throw new Error("Username/Password non validi.");
            }

            const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

            const msg = `${username} logged in.`;
            console.log(msg);
            res
              .header("auth-token", token)
              .json({
                success: true,
                msg: msg,
                data: { username: username, admin: user.admin },
              });
        } catch(err) {
            console.log(`postLogin - ${err}`);
            res.status(400).json({ success: false, msg: String(err) });
        }
    }
    
    static async getHome(req, res) {
        try {
            const { username, admin } = req.session;
            const permessiArr = await UsersDAO.getPermessi();
            console.log("getHome | users: ", permessiArr);
            const mappedPermessi = UsersController.#getMappedPermessi(permessiArr);
            console.log("getHome | permessiArr: ", mappedPermessi);
            res.render("index.ejs", { mappedPermessi, user: { username, admin } });
        } catch(err) {
            console.log(`getRoot - ${err}`);
        }
    }

    static #getMappedPermessi(users = []) {
        let mappedPermessiArr = [];
        users.forEach(({ username, permessi }) => {
          permessi.forEach((permesso) =>
            mappedPermessiArr.push({ username, date: permesso })
          );
        });
        return mappedPermessiArr;
    }

    static async postHome(req, res) {
        const { permesso } = req.body;
        const { username } = req.session;

        try {
            const { error } = await UsersDAO.pushPermessi(username, [permesso]);
            if(error) {
                throw new Error(error);
            }
            console.log(
                `Prenotazione effettuata: ${username} ha chiesto permesso per giorno ${permesso}.`
            );
        } catch(err) {
            console.log("postRoot - ", err);
        } finally {
            res.redirect("/home");
        }
    }
};