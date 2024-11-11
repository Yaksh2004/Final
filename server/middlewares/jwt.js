const jwt = require('jsonwebtoken');
const SECRET_KEY = 'Yaksh@Snackit'; 

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token; 
    if (!token) {
        return res.redirect('/signin'); 
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' }); 
        }
        req.user = user; 
        next(); 
    });
};

module.exports = authenticateJWT;