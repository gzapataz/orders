var express = require('express');
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();
var Refund = require('../models/refundModel');
var Accounting = require('../models/refundModel');
var OrderQuery = require('../models/refundModel');
var amqp = require('amqplib/callback_api');

var refundController = function(db, cad) {
    var get = function(req, res) {
        var resp;
        getQueue(cad, function(msg) {
            console.log('Sali Callback:' + JSON.stringify(msg));
            if (msg) {
                console.log('Directo de la cola:' + JSON.stringify(msg));
                process(docs[0], function(result) {
                    console.log(JSON.stringify(result));
                    if (result) {
                        sendQueue(result);
                        res.send({
                            status: 200,
                            mensaje: result
                        });
                    } else {
                        res.send({
                            status: 404,
                            mensaje: '{ "message": "No se encontro la orden" }'
                        });
                    }
                });
            }
        });


        db.find({}, function(err, docs) {
            process(docs[0], function(result) {
                console.log(JSON.stringify(result));
                if (result) {
                    sendQueue(result);
                    res.send({
                        status: 200,
                        mensaje: result
                    });
                } else {
                    res.send({
                        status: 404,
                        mensaje: '{ "message": "No se encontro la orden" }'
                    });
                }
            });
        });
    }
    var post = function(req, res) {

        // Llama la orden asociada al reembolso que se desea hacer
        process(req.body, function(result) {
            console.log(JSON.stringify(result));
            if (result) {
                res.send({
                    status: 200,
                    mensaje: result
                });
            } else {
                res.send({
                    status: 404,
                    mensaje: '{ "message": "No se encontro la orden" }'
                });
            }
        });
    };

    function process(request, callback) {
        var order = new Accounting.Order();
        Accounting.getByOrderNum(order, request.Order.ordernumber, function(order) {
            console.log('OBJETO:' + JSON.stringify(order));
            if (order) {
                var refund = new Accounting.Refund(null, order.id, 100);
                refund.save(function(result) {
                    callback(result.rows[0]);
                });
            } else {
                callback();
            }
        });
    }

    function getQueue(cad, callback) {
        var msgOut;
        amqp.connect(cad, function(err, conn) {
            try {
                console.log('Conectando Cola...2');
                conn.createChannel(function(err, ch) {
                    var q = 'test';
                    ch.assertQueue(q, { durable: false });
                    ch.consume(q, function(msg) {
                        //message 
                        console.log('Consumiendo de la cola...' + msg.content.toString());
                        msgOut = msgmsg.content;
                        db.insert({
                            "message": msg.content.toString()
                        });
                        console.log('getQueue:Contenido de la cola...' + msg.content.toString());
                        callback(msgOut);
                    }, { noAck: true });

                    console.log("Connection succesful");
                });
            } catch (err) {
                console.log('Error Conectando Cola...' + err);
            }
        });
    };

    function sendQueue(refund) {
        try {
            amqp.connect('amqp://test:test@' + process.env.API_QUEUE + ':5672', function(err, conn) {
                conn.createChannel(function(err, ch) {
                    var q = 'test';
                    ch.assertQueue(q, { durable: false });
                    ch.sendToQueue(q, new Buffer(JSON.stringify(refund)));
                    console.log(" [x] Sent " + refund);
                });
            });
        } catch (err) {
            console.log('Error enviando cola ' + err);
        }
    }

    return {
        post: post,
        get: get
    }

}
module.exports = refundController;