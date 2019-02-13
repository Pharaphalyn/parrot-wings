const mongoose = require('mongoose');

let transactionSchema = mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    payer: {
        type: String,
        required: true,
    },
    correspondent: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

let Transaction = module.exports = mongoose.model('transaction', transactionSchema);