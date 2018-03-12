/*jshint esversion: 6 */
'use strict';
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();

class Order {
    constructor(id, customerid, ordernumber, datenow, correlationid) {
        this.id = id;
        this.customerid = customerid;
        this.ordernumber = ordernumber;
        this.date = datenow;
        this.status = 'Pendiente';
        this.correlationid = correlationid
    }
    save(callback) {
        var result = {};
        var recId;
        console.log('Creando Orden ...');
        pool.query('INSERT INTO "Order" ' +
            '(customerid, ordernumber, date, status, correlationid) VALUES($1, $2, $3, $4, $5)  RETURNING id;', [this.customerid, this.ordernumber, this.date, this.status, this.correlationid],
            function(err, result) {
                if (err) {
                    console.log('Entro a Error' + err);
                    callback();
                }
                if (result) {
                    console.log('BUSCAR Objet : ');
                    recId = result.rows[0].id;
                    console.log('BUSCAR Objet: ' + recId);
                    pool.query('select * from "Order" where id = $1', [recId], function(err, result) {
                        if (err) {
                            console.log('RETORNANDO EN:' + err);
                            callback();
                        }
                        console.log('Inicnado Callback: ' + JSON.stringify(result));
                        callback(result);
                    });
                }
                else {
                    console.log('RESULT VACIO:');
                    callback();
                }
            });
    }
    cancelCompensation(correlationid, callback) {
        console.log('cancelCompensation.req.body.correlationId:' + correlationid);
        var query = 'update "Order" set status = \'Cancelado\' where correlationid = \'' + correlationid + '\'';
        pool.query(query, function(err, result) {
            if (err) {
                console.log('ERROR:' + err);
                callback(err, null);
            }
            console.log('DATAORDER:' + JSON.stringify(result));
            if (result.rowCount > 0) {
                callback(null, result);
            } else {
                console.log('ERROR NO DATA:' + err);
                callback(err, null);
            }
        });
    }
}


var getByOrderNum = function(order, orderNum, callback) {
    console.log('Consultando Orden ..<' + orderNum + '>');
    pool.query('select * from "Order" where ordernumber = $1', [orderNum], function(err, result) {
        if (err) {
            console.log('ERROR ' + err);
            callback(err, null);
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
            callback(null, order);
        } else {
            console.log('getByOrderNum.Salio por Callback:' + JSON.stringify(result.rows));
            callback();
        }
    });

};

class Orderitem {
    constructor(id, orderid, productid, quantity, unitprice, tax, linetotal, status) {
        this.id = id;
        this.orderid = orderid;
        this.productid = productid;
        this.quantity = quantity;
        this.unitprice = unitprice;
        this.tax = tax;
        this.linetotal = linetotal;
        this.status = status;
    }
    save(callback) {
        var result = {};
        var recId;
        pool.query('INSERT INTO "Orderitem" ' +
            '(orderid, productid, quantity, unitprice, tax, linetotal, status) VALUES($1, $2, $3, $4, $5, $6, $7)  RETURNING id;', [this.orderid, this.productid, this.quantity, this.unitprice, this.tax, this.linetotal, this.status],
            function(err, result) {
                if (err) {
                    console.log(err);
                    callback();
                }
                if (result) {
                    recId = result.rows[0].id;
                    console.log('BUSCAR Objet: ' + recId);
                    pool.query('select * from "Orderitem" where id = $1', [recId], function(err, result) {
                        if (err) {
                            console.log(err);
                            callback();
                            return res.status(500).json({ success: false, data: err });
                        }
                        console.log('Inicnado Callback: ' + JSON.stringify(result));
                        callback(result);
                    });
                }
            });
    }
}



var getByLineid = function(orderline, orderid, lineid, callback) {
    console.log('Consultando Items ..<' + orderid + '> LineItem<' + lineid + '>');
    pool.query('select * from "Orderitem" where id = $1 and orderid = $2', [lineid, orderid], function(err, result) {
        if (err) {
            console.log('getByLineid.ERROR ' + err);
            callback(err, null);
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
            callback(null, orderline);
        } else {
            console.log('getByLineid.Salio por Callback:' + JSON.stringify(result.rows));

            callback();
        }
    });

};

module.exports = {
    getByOrderNum: getByOrderNum,
    getByLineid: getByLineid,
    Order: Order,
    Orderitem: Orderitem,
}