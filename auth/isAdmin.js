const isAdmin = (req, res, next) => {
    const { username, admin } = req.body;
    if(admin === true) next();
    else {
        const msg = `Permessi utente ${username} insufficienti.`;
        console.log("isAdmin | ", msg);
        res.status(401).json({ success: false, msg: msg });
    }
};
export default isAdmin;