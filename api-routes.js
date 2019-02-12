let router = require('express').Router();
const passport = require('passport');

router.get('/', function (req, res) {
    res.json({
        status: 'API Its Working',
        message: 'Welcome to PW crafted with love!',
    });
});

var mainController = require('./app/controllers/mainController');

router.route('/register')
    .post(mainController.new);
router.route('/login')
    .post(passport.authenticate('local'), function(req, res) {
        if (req.isAuthenticated()) {
            return res.sendStatus(200);
        } else {
            return res.sendStatus(401);
        }
      });
router.route('/test')
    .get(mainController.requireAuthentication, mainController.test);
module.exports = router;
