/*jshint esversion: 6 */
'use strict';
var express = require('express');
var refund = require('../buslogic/refundBLog');
var pgPool = require('../js/pgPool');

const pool = pgPool.getPool();
var respRefund;

var router = function() {
    var refundRouter = express.Router();
    var refundController = require('../controler/refundController')();
    refundRouter.route('/refund')
        .post(refundController.post);
    return refundRouter;
};

module.exports = router;