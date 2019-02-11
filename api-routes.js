// api-routes.js
// Initialize express router
let router = require('express').Router();
const passport = require('passport');
// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'API Its Working',
        message: 'Welcome to PW crafted with love!',
    });
});
// Import main controller
var mainController = require('./app/controllers/mainController');
// Contact routes
router.route('/register')
    .post(mainController.new);
router.route('/login')
    .post(passport.authenticate('local'));
// Export API routes
module.exports = router;
