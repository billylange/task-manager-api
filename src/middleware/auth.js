const jwt = require('jsonwebtoken');
const User = require('../models/user');
const jwtSecret = process.env.JWT_SECRET;

// Check that every request is authorized
const auth = async (req, res, next) => {
  try {
    // Grab token and check it is valid and linked to user profile
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    if (!user) {
      // User not authorized
      throw new Error();
    }

    // User OK, save profile details to request
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate."});
  }
}

module.exports = auth;