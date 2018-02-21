/*jshint esversion: 6 */
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();

pool.query(
    'DROP TABLE IF EXISTS "Customer";' +
    'CREATE TABLE Customer (id SERIAL PRIMARY KEY, name VARCHAR(15), identification VARCHAR(15), email VARCHAR(30), city VARCHAR(30), address VARCHAR(30), mobile VARCHAR(30));' +
    'DROP TABLE IF EXISTS "Order";' +
    'CREATE TABLE "Order"(id SERIAL PRIMARY KEY, customerid SERIAL, ordernumber VARCHAR(15), date timestamp, status VARCHAR(20));' +
    'DROP TABLE IF EXISTS "Orderitem";' +
    'CREATE TABLE "Orderitem"(id SERIAL PRIMARY KEY, orderid SERIAL, productid SERIAL, quantity integer, unitprice money, tax money, linetotal money);' +
    'DROP TABLE IF EXISTS "Refund";' +
    'CREATE TABLE "Refund"(id SERIAL PRIMARY KEY, orderid SERIAL, amount money, tax money, bantrxid VARCHAR(30), status VARCHAR(30));' +
    'DROP TABLE IF EXISTS "ItemsToRefund";' +
    'CREATE TABLE "ItemsToRefund"(id SERIAL PRIMARY KEY, refundid SERIAL, lineitemid SERIAL, productid SERIAL, quantity integer, unitprice money, tax money, linetotal money);',
    function(err, res) {
        if (err) {
            console.log('ERROR Creacion Tablas: ' + err);
        } else {
            console.log('Tablas creadas ...');
        }
    });