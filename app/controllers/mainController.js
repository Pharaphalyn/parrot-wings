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

    if (req.user._id == payee) {
        return res.json({error: 'It\'s impossible to pay yourself.'});
    }

    User.findOne({_id: req.user._id}, (error, user) => {
        if (error) return res.json({ error: error });
        if (user.balance < payment) {
            return res.json({error: 'Not enough funds.'});
        }
        User.findOneAndUpdate({_id: payee}, {$inc : {balance: payment}}, function(error, payeeDoc){
            if (error) return res.json({ error: error });
            if (!payeeDoc) return res.json({error: "Wrong payee id."});
            User.findOneAndUpdate({_id: req.user._id}, {$inc : {balance: -1 * payment}}, function(error, doc){
                if (error) {
                    User.findOneAndUpdate({_id: payee}, {$inc : {balance: -1 * payment}});
                    return res.json({ error: error });
                }
                if (!doc) {
                    User.findOneAndUpdate({_id: payee}, {$inc : {balance: -1 * payment}});
                    return res.json({ error: 'Wrong user.' });
                }
                let transaction = new Transaction({payer: req.user._id, correspondent: payee, 
                                                    amount: payment,payerBalance: doc.balance - payment, 
                                                    payeeBalance: payeeDoc.balance + payment});
                transaction.save();
                return res.sendStatus(200);
            });
        });
    })
}

exports.getTransactions = function (req, res, next) {
    Transaction.find({$or: [{payer: req.user._id}, {correspondent: req.user._id}]}, (error, transactions) => {
        if (error) return res.json({ error: error });
        return res.json(transactions.map(function(transaction) {
            let balance;
            let strippedTransaction = {};
            strippedTransaction.payer = transaction.payer;
            strippedTransaction.correspondent = transaction.correspondent;
            strippedTransaction.amount = transaction.amount;
            strippedTransaction.date = transaction.date;

            if (transaction.correspondent == req.user._id) {
                balance = transaction.payeeBalance
            } else {
                balance = transaction.payerBalance
            }
            strippedTransaction.balance = balance;
            return strippedTransaction; 
        }));
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