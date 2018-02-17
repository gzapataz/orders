var express = require('express');
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();
var Refund = require('../models/refundModel');
var Accounting = require('../models/refundModel');
var OrderQuery = require('../models/refundModel');



var refundController = function() {
    var post = function(req, res) {

        // Llama la orden asociada al reembolso que se desea hacer
        var order = new Accounting.Order();
        console.log(JSON.stringify(req.body.Order.ordernumber));
        Accounting.getByOrderNum(order, req.body.Order.ordernumber, function(order) {
            console.log(JSON.stringify(order));
            var refund = new Accounting.Refund(null, order.id, 100);

            refund.save(function(result) {
                res.status(201);
                return res.json(result.rows[0]);
            });
        });
    };
    var getOrderById = function(req, res) {
        var varline2 = [];
        var orderLines = pool.query('SELECT OLI.* FROM "Order" AS ORD, "Orderitem" AS OLI WHERE OLI.orderid = ORD.id' +
            ' and ORD.ordernumber = $1', [req],
            function(err, recordset) {
                if (err) {
                    console.log('Error ' + err);
                }
                res = recordset.rows;

            });
    };


    //Inserta refund
    var insertRefund = function(req, res) {
        console.log('PARAM' + JSON.stringify(req));
        //var newEvento = new Evento(null, req.user.id, req.body.descripcion, req.body.fechainicio, req.body.fechafin, 'Pendiente');
        pool.query('INSERT INTO "refund" ' +
            '(orderid, amount, tax, status, bantrxid) VALUES($1, $2, $3, $4, $5)', [1, req.refund.amount, req.refund.tax, req.refund.status, req.refund.bantrxid],
            function(err, result) {
                console.log('Error ' + err);
            });
    };

    return {
        getOrderById: getOrderById,
        post: post,
        insertRefund: insertRefund
    }

}
module.exports = refundController;