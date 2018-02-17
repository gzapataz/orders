/*jshint esversion: 6 */
var express = require('express');
var bodyParser = require('body-parser');
var pgPool = require('./src/js/pgPool');

var port = process.env.PORT || 5000;
var app = express();

var verNumber = '';

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

refundRouter = require('./src/routes/refundRouter')();
app.use('/accounting/api', refundRouter);

app.listen(port, function(err) {
    console.log('Running Server on Port ' + port);
});