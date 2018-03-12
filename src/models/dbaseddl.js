/*jshint esversion: 6 */
var pgPool = require('../js/pgPool');
const pool = pgPool.getPool();

pool.query(
    'DROP TABLE IF EXISTS "Order";' +
    'CREATE TABLE "Order"(id SERIAL PRIMARY KEY, customerid VARCHAR(20), ordernumber VARCHAR(15), date timestamp, status VARCHAR(20), correlationid VARCHAR(50));' +
    'DROP TABLE IF EXISTS "Orderitem";' +
    'CREATE TABLE "Orderitem"(id SERIAL PRIMARY KEY, orderid SERIAL, productid SERIAL, quantity integer, unitprice money, tax money, linetotal money, status VARCHAR(20));',
    function(err, res) {
        if (err) {
            console.log('ERROR Creacion Tablas: ' + err);
        } else {
            console.log('Tablas creadas ...');
        }
    });