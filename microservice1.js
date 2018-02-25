var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
	amqp           = require('amqplib/callback_api');

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(allowCrossDomain);

// API routers
var datos = express.Router();

//Service to send message
datos.get('/microservicio1/:message', function(req, res) {	
	amqp.connect('amqp://test:test@' + process.env.API_QUEUE + ':5672', function(err, conn) {
        conn.createChannel(function(err, ch) {
            	var q = 'test';
            	ch.assertQueue(q, {durable: false});
            	ch.sendToQueue(q, new Buffer(JSON.stringify(req.params.message)));
            	console.log(" [x] Sent " + req.params.message);
            	res.send({
				version: 1,
				mensaje: "Microservice sent: " + JSON.parse(req.params.message),
				success: true
			});
        });
    });    
});

datos.post('/microservicio1/refund', function(req, res) {
    amqp.connect('amqp://test:test@' + process.env.API_QUEUE + ':5672', function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = 'test';
	    console.log('Mensaje a Enviar:', JSON.stringify(req.body));
            ch.assertQueue(q, { durable: false });
            ch.sendToQueue(q, new Buffer(JSON.stringify(req.body)));
            console.log(" [x] Sent " + JSON.stringify(req.body));
            res.send({
                version: 1,
                mensaje: "Microservice sent: " + JSON.stringify(req.body), success: true
            });
        });
    });
});


app.use('/', datos);

// Start Server
app.listen(3010, function(){
	console.log("Server running on http://localhost:3010");
});
