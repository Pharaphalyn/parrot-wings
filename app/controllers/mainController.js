const bcrypt = require('bcrypt');
const config = require('../../config');

User = require('../models/userModel');

exports.index = function (req, res) {
    User.get(function (err, users) {
        if (err) {
            res.json({
                status: "error",
                message: err,
            });
        }
        res.json({
            status: "success",
            message: "Users retrieved successfully",
            data: users
        });
    });
};

exports.new = function (req, res) {
    var user = new User();
    
    user.name = req.body.name;
    if (req.body.name) {
        user.name = req.body.name;
    } else {
        return res.json({
            error: 'Name is required.'
        })
    }
    if (!validateName(user.name)) {
        return res.json({
            error: 'Please, provide a valid name (only letters and space).'
        })
    }
    if (req.body.email) {
        user.email = req.body.email;
    } else {
        return res.json({
            error: 'Email is required.'
        })
    }
    if (!validateEmail(user.email)) {
        return res.json({
            error: 'Please, provide a valid email.'
        })
    }

    if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, config.saltRounds);
    } else {
        return res.json({
            error: 'Password is required.'
        })
    }
    user.balance = 500;
    user.save(function (err) {
        if (err) { 
            if (err.name === 'MongoError' && err.code === 11000) {
                return res.json({
                    error: 'User with this email already exists.',
                });
            } else if (err.name === 'ValidationError'){
                return res.json({
                    error: 'All fields are required.'
                });
            }
        }
        res.sendStatus(200);
    });
};
// Handle view user info
exports.view = function (req, res) {
    User.findById(req.params.user_id, function (err, user) {
        if (err)
            res.send(err);
        res.json({
            message: 'User details loading..',
            data: user
        });
    });
};
// Handle update user info
exports.update = function (req, res) {
User.findById(req.params.user_id, function (err, user) {
        if (err)
            res.send(err);
user.name = req.body.name ? req.body.name : user.name;
        user.gender = req.body.gender;
        user.email = req.body.email;
        user.phone = req.body.phone;
// save the user and check for errors
        user.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'User Info updated',
                data: user
            });
        });
    });
};
// Handle delete user
exports.delete = function (req, res) {
    User.remove({
        _id: req.params.user_id
    }, function (err, user) {
        if (err)
            res.send(err);
res.json({
            status: "success",
            message: 'User deleted'
        });
    });
};

function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateName(name)
{
    var re = /^[a-zA-Z ]{2,30}$/;
    return re.test(name);
}