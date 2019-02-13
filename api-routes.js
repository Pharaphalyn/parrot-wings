let router = require('express').Router();
const passport = require('passport');

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to PW.',
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
router.route('/logout')
    .post(mainController.requireAuthentication, mainController.logOut);
router.route('/info')
    .get(mainController.requireAuthentication, mainController.getInfo);
router.route('/users')
    .get(mainController.requireAuthentication, mainController.getUsers);
router.route('/pay')
    .post(mainController.requireAuthentication, mainController.pay);
router.route('/test')
    .get(mainController.requireAuthentication, mainController.test);
module.exports = router;
