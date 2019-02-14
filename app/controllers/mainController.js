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
        return res.status(400).json({
            error: 'Name is required.'
        })
    }
    if (!validateName(user.name)) {
        return res.status(400).json({
            error: 'Please, provide a valid name (only letters and space).'
        })
    }
    if (req.body.email) {
        user.email = req.body.email;
    } else {
        return res.status(400).send({
            error: 'Email is required.'
        })
    }
    if (!validateEmail(user.email)) {
        return res.status(400).send({
            error: 'Please, provide a valid email.'
        })
    }

    if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, config.saltRounds);
    } else {
        return res.status(500).json({
            error: 'Password is required.'
        })
    }
    user.balance = 500;
    user.save(function (err) {
        if (err) { 
            if (err.name === 'MongoError' && err.code === 11000) {
                return res.status(500).json({
                    error: 'User with this email already exists.',
                });
            } else if (err.name === 'ValidationError'){
                return res.status(500).json({
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
    User.findOne({_id: req.user._id}, (error, user) => {
        if (error) return res.status(500).json({ error: error });  
        return res.json({name: user.name, balance: user.balance});
    });
}

exports.getUsers = function (req, res, next) {
    User.find({}, (error, users) => {
        if (error) {
            return res.status(400).json({error: error});
        }
        
        res.send(users.map(function(user) {  
            let strippedUser = {name: user.name, id: user._id, email: user.email};
            return strippedUser; 
        }));
    })
}

exports.pay = function (req, res, next) {
    const payment = req.body.amount;
    const payee = req.body.payee;

    if (!payment || !payee) {
        return res.status(400).json({error: 'No payee or payment amount sent to server.'})
    }

    if (isNaN(payment)) {
        return res.status(400).json({error: 'Invalid payment amount.'});
    }

    if (req.user._id == payee) {
        return res.status(400).json({error: 'It\'s impossible to pay yourself.'});
    }

    User.findOne({_id: req.user._id}, (error, user) => {
        if (error) return res.status(500).json({ error: error });
        if (user.balance < payment) {
            return res.status(400).json({error: 'Not enough funds.'});
        }
        User.findOneAndUpdate({_id: payee}, {$inc : {balance: payment}}, function(error, payeeDoc){
            if (error) return res.status(400).json({ error: error });
            if (!payeeDoc) return res.status(400).json({error: "Wrong payee id."});
            User.findOneAndUpdate({_id: req.user._id}, {$inc : {balance: -1 * payment}}, function(error, doc){
                if (error) {
                    User.findOneAndUpdate({_id: payee}, {$inc : {balance: -1 * payment}});
                    return res.status(400).json({ error: 'Can\'t find this user.'});
                }
                if (!doc) {
                    User.findOneAndUpdate({_id: payee}, {$inc : {balance: -1 * payment}});
                    return res.status(400).json({ error: 'Wrong user.' });
                }
                let transaction = new Transaction({payer: req.user._id, correspondent: payee, 
                                                    payerName: req.user.name, correspondentName: payeeDoc.name,
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
            strippedTransaction.id = transaction._id;
            strippedTransaction.payer = transaction.payer;
            strippedTransaction.correspondent = transaction.correspondent;
            strippedTransaction.payerName = transaction.payerName;
            strippedTransaction.correspondentName = transaction.correspondentName;
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

function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateName(name)
{
    var re = /^[a-zA-Z ]{2,30}$/;
    return re.test(name);
}