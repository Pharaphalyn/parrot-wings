const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
User = require('../models/userModel');

let strategy = new LocalStrategy(
  function(email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) {   
        return done(err); }
      if (!user) {
        return done(null, false, { error: 'Incorrect username.' });
      }
      if (!isValidPassword(user, password)) {
        return done(null, false, { error: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
);

function isValidPassword(user, password) {
    console.log(user.password, password)
    return bcrypt.compareSync(password, user.password);
}

module.exports.strategy = strategy;