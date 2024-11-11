const { User } = require("../db/index")

async function userMiddleware(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    const findUser = await User.findOne({email: email, password: password});
    try {
        if (findUser){
            next();
        } else {
            res.json({
                message : "User Not Found"
            })
        }       
    } catch (error) {
        res.json({
            message: "Something is Wrong with the Database"
        })
    }
}

module.exports = userMiddleware;