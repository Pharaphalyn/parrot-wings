let express = require('express');
const passport = require('passport');
const localStrategy = require('./app/auth/strategy');
const config = require('./config');

let app = express();

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
   done(null, user);
});
 
passport.deserializeUser(function(user, done) {
   done(null, user);
});
passport.use(localStrategy.strategy);

let port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Hello World with Express'));

let apiRoutes = require("./api-routes")

let bodyParser = require('body-parser');

let mongoose = require('mongoose');

app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(bodyParser.json());

mongoose.connect(config.dbConnection);
var db = mongoose.connection;

app.use('/api', apiRoutes)

app.listen(port, function () {
     console.log("Running PW on port " + port);
});