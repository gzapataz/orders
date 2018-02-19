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

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

amqp.connect('amqp://test:test@' + process.env.API_QUEUE + ':5672', function(err, conn) {
    try {
        conn.createChannel(function(err, ch) {
            var q = 'test';
            ch.assertQueue(q, { durable: false });
            ch.consume(q, function(msg) {
                //message 
                db.insert({
                    "message": msg.content.toString()
                });
            }, { noAck: true });

            console.log("Connection succesful");
        });
    } catch (err) {

    }
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(allowCrossDomain);

refundRouter = require('./src/routes/refundRouter')(db);
app.use('/accounting/api', refundRouter);

app.listen(port, function(err) {
    console.log('Running Server on Port ' + port);
});