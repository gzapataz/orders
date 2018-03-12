/*jshint esversion: 6 */
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
                var newMsg = JSON.parse(msg);
                console.log('Decodificando:' + JSON.stringify(newMsg.ItemsToRefund));
                process(newMsg, newMsg.ItemsToRefund, function(err, result) {
                    console.log(JSON.stringify(result));
                    if (result) {
                        sendQueue(cad, result);
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
    }
    var post = function(req, res) {
        console.log('URL' + JSON.stringify(req.url));
        // Llama la orden asociada al reembolso que se desea hacer
        switch (req.url) {
            case '/refund/':
                process(req.body, req.body.ItemsToRefund, function (err, result) {
                    console.log(JSON.stringify(result));
                    if (result) {
                        res.status(200).send({
                            status: 200,
                            mensaje: result
                        });
                    } else {
                        res.status(404).send({
                            status: 404,
                            mensaje: '{ "message": "No se encontro la orden o los items de la orden" }'
                        });
                    }
                });
                break;
            case '/refundcompensar/':
                console.log('req.body.correlationId:' + req.body.correlationId);
                processcompensar(req.body.correlationId, function (err, result) {
                    console.log(JSON.stringify(result));
                    if (err) {
                        res.status(404).send({
                            status: 404,
                            mensaje: '{ "message": "Error en deshacer reembolso" }'
                        });
                    }
                    if (result) {
                        res.status(200).send({
                            status: 200,
                            mensaje: result
                        });
                    } else {
                        res.status(404).send({
                            status: 404,
                            mensaje: '{ "message": "No se encontro la orden o el reembolso" }'
                        });
                    }
                });
                break;
        }
    };

    function process(request, itemsToRefund, callback) {
        var order = new Accounting.Order();
        Accounting.getByOrderNum(order, request.Order.ordernumber, function(err, order) {
            console.log('OBJETO:' + JSON.stringify(order));
            if (order) {
                var total = 0;
                for (var item of itemsToRefund) {
                    console.log('En Items to Refund:' + JSON.stringify(itemsToRefund));
                    var lineatotal = 0;
                    var orderline = new Accounting.Orderitem();
                    var myTotal = new Promise((resolve, reject) => {
                        Accounting.getByLineid(orderline, order.id, item.lineid, function(err, orderline) {
                            if (orderline) {
                                lineatotal = (parseFloat(orderline.unitprice.replace(/[^0-9-.]/g, '')) - (parseFloat(orderline.tax.replace(/[^0-9-.]/g, '')) / parseFloat(orderline.quantity))) * parseFloat(item.quantity);
                                console.log('lineatotal:' + lineatotal);
                                return resolve(lineatotal);
                            } else {
                                console.log('Error lineas de producto');
                                lineatotal = 0;
                                //return resolve(lineatotal);
                                return reject(new Error('No hay lineas de Orden'));
                            }
                        });
                    }).then(lineatotal => {
                        total += lineatotal;
                        var refund = new Accounting.Refund(null, order.id, total, request.HeaderData.correlationId);
                        console.log('Saliendo de promesa:' + JSON.stringify(refund));
                        refund.save(function(result) {
                            //Aqui los items y calculo del total
                            callback(null, result.rows[0]);
                        });
                    }).catch(err => {
                        console.log('Promesa Error' + err);
                        callback(err, null);
                    });
                };
            } else {
                callback();
            }
        });
    }

    function processcompensar(correlationid, callback) {
        var refundCancelObj = new Accounting.Refund();
        refundCancelObj.cancelCompensation(correlationid, function(err, result) {
            if (err) {
                callback (err, JSON.parse('{"compensation": "failure"}'));
            }
            if (result) {
                callback(null, JSON.parse('{"compensation": "success"}'));
            } else {
                callback ();
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
                        msgOut = msg.content;
                        db.insert({
                            "message": msg.content.toString()
                        });
                        console.log('getQueue:Contenido de la cola...' + msg.content.toString());
                        callback(msg.content.toString());
                    }, { noAck: true });

                    console.log("Connection succesful");
                });
            } catch (err) {
                console.log('Error Conectando Cola...' + err);
            }
        });
    };

    function sendQueue(cad, refund) {
        try {
            amqp.connect(cad, function(err, conn) {
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