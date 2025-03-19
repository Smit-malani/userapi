const jwt = require('jsonwebtoken')
const JWT_Secret_KEY = "malanismit"

const verifyUser = (roles) => {
    return async (req, res, next) => {
        try {

             if (req.path == '/login' || req.path == '/register' || req.path == '/getproduct' || req.path == '/getcategory') {
                return next()
            }

            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                return res.status(400).json({ message: 'Please sign-in' })
            }
 
            let user = await jwt.verify(token, JWT_Secret_KEY)

            if (!user) {
                return res.status(400).json({ success: false, message: "Please sign in" })
            }

            req.user = user

            if (roles && roles.length > 0 && !roles.includes(user.role)) {
                console.log(user.role)
                return res.status(403).json({ message: 'You do not authorized for this action' });
            }
            next()
        }
        catch (err) {
            console.log(err)
            return res.status(401).json({ message: 'Please sign in' });
        }
    }
}

module.exports = verifyUser;