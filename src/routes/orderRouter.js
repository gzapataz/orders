/*jshint esversion: 6 */
'use strict';
var express = require('express');
var pgPool = require('../js/pgPool');

const pool = pgPool.getPool();
var respOrder;

var router = function(db, cadQueue) {
    var orderRouter = express.Router();
    var orderController = require('../controler/orderController')(db, cadQueue);
    orderRouter.route('/order')
        .get(orderController.get)
        .post(orderController.post);
    orderRouter.route('/ordercompensar')
        .get(orderController.get)
        .post(orderController.post);
    return orderRouter;
};

module.exports = router;