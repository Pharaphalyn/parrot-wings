const bcrypt = require('bcrypt');
const config = require('../../config');

User = require('../models/userModel');
Transaction = require('../models/transactionModel');

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

exports.requireAuthentication = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {    
        return res.sendStatus(401);
    }
}

exports.logOut = function (req, res, next) {
    req.logout();
    return res.sendStatus(200);
}

exports.getInfo = function (req, res, next) {
    return res.json({name: req.user.name, balance: req.user.balance});
}

exports.getUsers = function (req, res, next) {
    User.find({}, (error, users) => {
        if (error) {
            return res.json({error: error});
        }
        
        res.send(users.map(function(user) {  
            let strippedUser = {name: user.name, id: user._id}
            return strippedUser; 
        }));
    })
}

exports.pay = function (req, res, next) {
    const payment = req.body.amount;
    const payee = req.body.payee;

    if (!payment || !payee) {
        return res.json({error: 'No payee or payment amount sent to server.'})
    }

    if (req.user.balance < payment) {
        return res.json({error: 'Not enough funds.'});
    }

    User.findOneAndUpdate({_id: payee}, {$inc : {balance: payment}}, function(error, doc){
        console.log(error);
        console.log(!!error);
        if (error) return res.json({ error: error });
        console.log('end');
        if (!doc) return res.json({error: "Wrong payee id."});
        User.findOneAndUpdate({_id: req.user._id}, {$inc : {balance: -1 * payment}}, function(error, doc){
            if (error) {
                User.findOneAndUpdate({_id: payee}, {$inc : {balance: -1 * payment}});
                return res.json({ error: error });
            }
            let transaction = new Transaction({payer: req.user._id, correspondent: payee, amount: payment, balance: doc.balance});
            transaction.save();
            return res.sendStatus(200);
        });
    });
}

exports.test = function (req, res, next) {
    res.json({message: 'It\'s almost harvesting season.'});
}

function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateName(name)
{
    var re = /^[a-zA-Z ]{2,30}$/;
    return re.test(name);
}