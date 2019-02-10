// api-routes.js
// Initialize express router
let router = require('express').Router();
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
router.route('/users')
    .get(mainController.index)
    .post(mainController.new);
router.route('/users/:user_id')
    .get(mainController.view)
    .patch(mainController.update)
    .put(mainController.update)
    .delete(mainController.delete);
// Export API routes
module.exports = router;
