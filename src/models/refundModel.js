/*jshint esversion: 6 */
'use strict';
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();

class Refund {
    constructor(id, orderid, amount) {
        this.id = id;
        this.orderid = orderid
        this.amount = amount;
        this.banktrxid = 'Pending';
        this.estado = 'En proceso';
    }
    save(callback) {
        var result = {};
        var recId;
        console.log('this.amount:' + this.amount);
        pool.query('INSERT INTO "Refund" ' +
            '(orderid, amount, tax, status, bantrxid) VALUES($1, $2, $3, $4, $5)  RETURNING id;', [this.orderid, this.amount, 0, this.estado, this.banktrxid],
            function(err, result) {
                if (result) {
                    recId = result.rows[0].id;
                    pool.query('select * from "Refund" where id = $1', [recId], function(err, result) {
                        if (err) {
                            console.log(err);
                            callback();
                            return res.status(500).json({ success: false, data: err });
                        }
                        callback(result);
                    });
                }


            });
    }
}

class Order {
    constructor(id, orderid, amount) {
        this.id = id;
        this.ordernumber = '';
        this.orderid = orderid;
        this.amount = amount;
        this.banktrxid = '';
        this.estado = 'Pendiente';
    }
}

//module.exports = Order;


var getByOrderNum = function(order, orderNum, callback) {
    console.log('Consultando Orden ..<' + orderNum + '>');
    pool.query('select * from "Order" where ordernumber = $1', [orderNum], function(err, result) {
        if (err) {
            console.log('ERROR ' + err);
            callback();
            return;
        }
        console.log('getByOrderNum: ' + JSON.stringify(result));
        if (result.rows[0]) {
            console.log('getByOrderNum: ' + result.rows[0]);
            order.id = result.rows[0].id;
            order.ordernumber = result.rows[0].ordernumber;
            order.customerid = result.rows[0].customerid;
            order.date = result.rows[0].date;
            order.status = result.rows[0].status;
            callback(order);
        } else {
            console.log('getByOrderNum.Salio por Callback:' + JSON.stringify(result.rows));
            callback();
        }
    });

};

class Orderitem {
    constructor(id, orderid, productid, quantity, unitprice, tax, linetotal) {
        this.id = id;
        this.orderid = orderid;
        this.productid = productid;
        this.quantity = quantity;
        this.unitprice = unitprice;
        this.tax = tax;
        this.linetotal = linetotal;
    }
}

var getByLineid = function(orderline, orderid, lineid, callback) {
    console.log('Consultando Items ..<' + orderid + '> LineItem<' + lineid + '>');
    pool.query('select * from "Orderitem" where id = $1 and orderid = $2', [lineid, orderid], function(err, result) {
        if (err) {
            console.log('getByLineid.ERROR ' + err);
            callback(err);
            return;
        }
        if (result.rows[0]) {
            console.log('getByLineid: ' + JSON.stringify(result.rows[0]));
            orderline.id = result.rows[0].id;
            orderline.orderid = result.rows[0].orderid;
            orderline.productid = result.rows[0].productid;
            orderline.quantity = result.rows[0].quantity;
            orderline.unitprice = result.rows[0].unitprice;
            orderline.tax = result.rows[0].tax;
            callback(orderline);
        } else {
            console.log('getByLineid.Salio por Callback:' + JSON.stringify(result.rows));

            callback();
        }
    });

};

module.exports = {
    getByOrderNum: getByOrderNum,
    getByLineid: getByLineid,
    Refund: Refund,
    Orderitem: Orderitem,
    Order: Order
}