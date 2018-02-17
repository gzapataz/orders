/*jshint esversion: 6 */
'use strict';
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();

class Refund {
    constructor(id, orderid, amount) {
        this.id = id;
        this.orderid = orderid
        this.amount = amount;
        this.banktrxid = '';
        this.estado = 'Pendiente';
    }
    save(callback) {
        var result = {};
        var recId;
        pool.query('INSERT INTO "Refund" ' +
            '(orderid, amount, tax, status, bantrxid) VALUES($1, $2, $3, $4, $5)  RETURNING id;', [this.orderid, this.amount, 0, this.status, ''],
            function(err, result) {
                if (result) {
                    recId = result.rows[0].id;
                    pool.query('select * from "Refund" where id = $1', [recId], function(err, result) {
                        if (err) {
                            callback();
                            console.log(err);
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
    pool.query('select * from "Order" where ordernumber = $1', [orderNum], function(err, result) {
        if (err) {
            done(err);
            callback();
            console.log(err);
            return res.status(500).json({ success: false, data: err });
        }
        order.id = result.rows[0].id;
        order.ordernumber = result.rows[0].ordernumber;
        order.customerid = result.rows[0].customerid;
        order.date = result.rows[0].date;
        order.status = result.rows[0].status;
        callback(order);
    });

};

module.exports = {
        getByOrderNum: getByOrderNum,
        Refund: Refund,
        Order: Order
    }
    //module.exports = getByOrderNum;
    //module.exports = Refund;