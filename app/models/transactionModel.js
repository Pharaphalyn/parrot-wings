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
    payerName: {
        type: String,
        required: true,
    },
    correspondentName: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    payerBalance: {
        type: Number,
        required: true
    },
    payeeBalance: {
        type: Number,
        required: true
    }
});

let Transaction = module.exports = mongoose.model('transaction', transactionSchema);