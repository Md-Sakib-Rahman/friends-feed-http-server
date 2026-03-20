const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if(!token){
            return res.status(401).json({message: 'No token provided'});
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.id }
        next();
    }catch(err){
        console.error("error from auth middleware", err);
        return res.status(401).json({message: 'Invalid token'});
    }
}

module.exports = auth;