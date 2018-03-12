/*jshint esversion: 6 */
var express = require('express');
var bodyParser = require('body-parser');
var pgPool = require('./src/js/pgPool');
var Datastore = require('nedb'),
    db = new Datastore({ filename: './messages.db', autoload: true }),
    amqp = require('amqplib/callback_api');


var port = process.env.PORT || 5000;
var app = express();

var verNumber = '';
var cadQueue = 'amqp://test:test@' + process.env.API_QUEUE + ':5672';

console.log('COLAS: ' + cadQueue);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(allowCrossDomain);

orderRouter = require('./src/routes/orderRouter')(db, cadQueue);
app.use('/accounting/api', orderRouter);

app.listen(port, function(err) {
    console.log('Running Server on Port ' + port);
});



process.on('SIGINT', () => {
    console.log('\nCTRL+C...');
    process.exit(0);
});

process.on('exit', (code) => {
    console.log('Cerrando BD pool');
    var pool = pgPool.getPool();
    pool.end;
    console.log(`About to exit with code: ${code}`);
});