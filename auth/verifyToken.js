import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const token = req.header("auth-token");
    if(!token) {
        res.status(401).json({ success: false, msg: "Access denied." });
    }

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch(err) {
        console.log(`auth - Invalid Token. ${err}`);
    }
}

export default auth;