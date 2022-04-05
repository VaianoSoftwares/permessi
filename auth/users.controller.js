import UsersDAO from "../dao/users.dao.js";
import Validator from "./validation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default class UsersController {
  static async apiRegister(req, res) {
    try {
      const user = await UsersDAO.getUserByName(req.body.username);
      if (user) {
        throw new Error(`Username ${req.body.username} gia' esistente`);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPsw = await bcrypt.hash(req.body.password, salt);
      
      const { error } = await UsersDAO.addUser({
        ...req.body,
        password: hashedPsw,
        permessi: [],
      });
      if (error) {
        throw new Error(error.message);
      }

      const msg = `${username} registered.`;
      console.log(msg);
      res.json({ success: true, msg: msg });
    } catch (err) {
      console.log(`apiRegister - ${err}`);
      res
        .status(400)
        .json({ success: false, msg: String(err).replace("Error:", "") });
    }
  }

  static async apiLogin(req, res) {
    const { error } = Validator.login(req.body);

    if (error) {
      const msg = error.details[0].message;
      console.log("apiLogin - ", msg);
      res.status(400).json({ success: false, msg: msg });
      return;
    }

    const { username, password } = req.body;

    try {
      const user = await UsersDAO.getUserByName(username);
      if (!user) {
        throw new Error("Username/Password non validi.");
      }

      const isPswValid = await bcrypt.compare(password, user.password);
      if (!isPswValid) {
        throw new Error("Username/Password non validi.");
      }

      const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

      const msg = `${username} logged in.`;
      console.log(msg);
      res.header("auth-token", token).json({
        success: true,
        msg: msg,
        data: { username: username, admin: user.admin },
      });
    } catch (err) {
      console.log(`apiLogin - ${err}`);
      res
        .status(400)
        .json({ success: false, msg: String(err).replace("Error:", "") });
    }
  }

  static async apiGetPermessi(req, res) {
    try {
      const permessiArr = await UsersDAO.getPermessi();
      console.log("apiGetPermessi | permessiArr: ", permessiArr);
      const { month } = req.query;
      console.log("apiGetPermessi | month: ", month);
      const mappedPermessi = UsersController.#getMappedPermessi(permessiArr, month);
      console.log("apiGetPermessi | mappedPermessi: ", mappedPermessi);
      res.json({
        success: true,
        msg: "Permessi successfully gathered",
        data: mappedPermessi,
      });
    } catch (err) {
      res.json({
        success: false,
        msg: String(err).replace("Error:", ""),
        data: [],
      });
      console.log(`apiGetPermessi - ${err}`);
    }
  }

  static #getMappedPermessi(users = [], month = 0) {
    let mappedPermessiArr = [];
    users.forEach(({ username, permessi }) => {
      permessi
        .filter((permesso) => new Date(permesso).getMonth() == month)
        .forEach((permesso) =>
          mappedPermessiArr.push({ username, date: permesso })
        );
    });
    return mappedPermessiArr;
  }

  static async apiPushPermessi(req, res) {
    const { username, date } = req.body;

    try {
      const { error } = await UsersDAO.pushPermessi(username, [date]);
      if (error) {
        throw new Error(error);
      }

      const msg = `Prenotazione effettuata: ${username} ha chiesto permesso per giorno ${date}.`;
      console.log(msg);

      res.json({ success: true, msg: msg });
    } catch (err) {
      console.log("apiPostPermessi - ", err);
      res
        .status(400)
        .json({ success: false, msg: String(err).replace("Error:", "") });
    }
  }

  static async apiPullPermessi(req, res) {
    const { username, date } = req.body;

    try {
      if(!username || !date) {
        throw new Error("Impossibile annulare prenotazione: dati mancanti.");
      }
      const { error } = await UsersDAO.pullPermessi(username, [date]);
      if (error) {
        throw new Error(error);
      }

      const msg = `Prenotazione annullata: ${username} rimosso permesso per giorno ${date}.`;
      console.log(msg);

      res.json({ success: true, msg: msg });
    } catch (err) {
      console.log("apiDeletePermessi - ", err);
      res
        .status(400)
        .json({ success: false, msg: String(err).replace("Error:", "") });
    }
  }
};