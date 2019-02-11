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

function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateName(name)
{
    var re = /^[a-zA-Z ]{2,30}$/;
    return re.test(name);
}