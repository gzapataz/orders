/*jshint esversion: 6 */

var pg = require('pg');

//Eliminar por variables de entorno
var config = {
    user: 'postgres',
    host: 'accountsvc.ctup5kmar1pe.us-east-2.rds.amazonaws.com',
    database: 'accountsvc',
    password: 'admin123',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
};

var poolPg = function() {
    var pool;
    var getPool = function() {
        if (pool) {
            console.log('SINGLETON Devuelve conexion existente');
            return pool; // Si ya hay conexion devuelve la conexion
        }
        console.log('SINGLETON Creando pool de conexion a la base de datos');
        //pool = new pg.Pool();
        pool = new pg.Pool(config);
        return pool;
    };
    return {
        getPool: getPool
    };
};
module.exports = poolPg();