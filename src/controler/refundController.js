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
                console.log('Decodificando:' + JSON.stringify(newMsg));
                process(newMsg, req.body.ItemsToRefund, function(err, result) {
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
    }
    var post = function(req, res) {

        // Llama la orden asociada al reembolso que se desea hacer
        process(req.body, req.body.ItemsToRefund, function(err, result) {
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
    };

    function process(request, itemsToRefund, callback) {
        var order = new Accounting.Order();


        Accounting.getByOrderNum(order, request.Order.ordernumber, function(order) {
            console.log('OBJETO:' + JSON.stringify(order));
            if (order) {
                var total = 0;
                for (var item of itemsToRefund) {
                    console.log('En Items to Refund:' + JSON.stringify(itemsToRefund));
                    lineatotal = 0;
                    var orderline = new Accounting.Orderitem();
                    new Promise((resolve, reject) => {
                            Accounting.getByLineid(orderline, order.id, item.lineid, function(err, orderline) {
                                if (orderline) {
                                    console.log('if (orderline):' + JSON.stringify(orderline));
                                    console.log('orderline.unitprice:' + parseFloat(orderline.unitprice.replace(/[^0-9-.]/g, '')));
                                    console.log('orderline.tax:' + parseFloat(orderline.tax.replace(/[^0-9-.]/g, '')));
                                    console.log('orderline.quantity:' + parseFloat(orderline.quantity));
                                    console.log('item.quantity:' + parseFloat(item.quantity));


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
                            total = total + lineatotal;
                            console.log('Saliendo de promesa:' + total);
                            var refund = new Accounting.Refund(null, order.id, total);
                            refund.save(function(result) {
                                //Aqui los items y calculo del total
                                callback(result.rows[0]);
                            });
                        })
                        .catch(err => {
                            console.log('Promesa Error' + err);
                            callback(err);
                        });
                };
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