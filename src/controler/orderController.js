/*jshint esversion: 6 */
var express = require('express');
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();
var Order = require('../models/orderModel');
var OrderQuery = require('../models/orderModel');
var amqp = require('amqplib/callback_api');


var orderController = function(db, cad) {
    var get = function(req, res) {
        var resp;
        getQueue(cad, function(msg) {
            console.log('Sali Callback:' + JSON.stringify(msg));
            if (msg) {
                console.log('Directo de la cola:' + JSON.stringify(msg));
                var newMsg = JSON.parse(msg);
                console.log('Decodificando:' + JSON.stringify(newMsg.ItemsToOrder));
                process(newMsg, newMsg.ItemsToOrder, function(err, result) {
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
            case '/order/':
                process(req.body, req.body.Items, function (err, result) {
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
            case '/ordercompensar/':
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

    function process(request, itemsToOrder, callback) {
        console.log('Datos de La Orden JSON:', JSON.stringify(request))
        var order = new Order.Order(null, request.Order.customerid, request.Order.ordernumber, request.Order.date, request.HeaderData.correlationId);
        console.log('process.creando orden:' + JSON.stringify(order));
        order.save(function(result) {
            //Aqui los items y calculo del total
            processLineItems(result.rows[0].id, itemsToOrder, function(err, itemresult) {
                callback(null, result.rows[0]);
            });
        });
    }

    function processLineItems(orderid, itemsToOrder, callback) {
        console.log('process.creando items:' + JSON.stringify(itemsToOrder));
        for (var item of itemsToOrder) {
            var orderLine = new Order.Orderitem(null, orderid, item.productid, item.quantity, item.unitprice, item.tax, item.linetotal, 'Pendiente');
            console.log('Saliendo de promesa:' + JSON.stringify(orderLine));
            orderLine.save(function(result) {
                //Aqui los items y calculo del total
                callback(null, result.rows[0]);
            });
        }
    }

    function processcompensar(correlationid, callback) {
        var orderCancelObj = new Accounting.Order();
        orderCancelObj.cancelCompensation(correlationid, function(err, result) {
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

    function sendQueue(cad, order) {
        try {
            amqp.connect(cad, function(err, conn) {
                conn.createChannel(function(err, ch) {
                    var q = 'test';
                    ch.assertQueue(q, { durable: false });
                    ch.sendToQueue(q, new Buffer(JSON.stringify(order)));
                    console.log(" [x] Sent " + order);
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
module.exports = orderController;