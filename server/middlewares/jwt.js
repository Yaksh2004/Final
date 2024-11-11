const jwt = require('jsonwebtoken');
const SECRET_KEY = 'Yaksh@Snackit'; 

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token; // Get the token from cookies

    if (!token) {
        console.log("No token Found");
        return res.redirect('/signin'); // Redirect if there's no token.
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' }); // Respond with error if token verification fails
        }
        req.user = user; // Attach the decoded user data to the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateJWT;