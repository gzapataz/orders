/*jshint esversion: 6 */
var express = require('express');
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();
var Refund = require('../models/refundModel');
var Accounting = require('../models/refundModel');
var OrderQuery = require('../models/refundModel');
var amqp = require('amqplib/callback_api');


var refundbalanceController = function(db, cad) {
    var post = function(req, res) {

        process(req.body.correlationid, function (err, result) {
            console.log(JSON.stringify(result));
            if (result) {
                res.send({
                    status: 200,
                    mensaje: result
                });
            } else {
                res.send({
                    status: 404,
                    mensaje: '{ "message": "No se encontro la orden o los items de la orden" }'
                });
            }
        });
    }


    function processcompensar(correlationid, itemsToRefund, callback) {
        var refundCancelObj = new Accounting.Refund();
        refundCancelOb.cancelCompensation(correlationid, function(err, result){
            console.log('CANCELADO');
        });
    }

    return {
        post: post
    }
}
module.exports = refundbalanceController;
