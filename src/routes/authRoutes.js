var express = require('express');
var authRouter = express.Router();
var Evento = require('../js/event');
var User = require('../js/user');
var pgPool = require('../js/pgPool');
var passport = require('passport');

var pool = pgPool.getPool();
var regStatus = '';

var router = function(nav) {
    authRouter.route('/signUp')
        .post(function(req, res) {
            console.log(req.body);

            var user = {
                email: req.body.email,
                username: req.body.userName,
                password: req.body.password
            };
            pool.query('SELECT * FROM "user" WHERE email = $1;', [req.body.email],
                function(err, results) {
                    if (results.rows[0] === undefined) {
                        pool.query('INSERT INTO "user" (name, email, password) VALUES($1, $2, $3)', [user.username, user.email, user.password],
                            function(err, results) {
                                req.login(results.rows[0], function() {
                                    regStatus = 'Registro Exitoso...';
                                    res.redirect('/');
                                });
                            });
                    } else {
                        res.redirect('/auth/error');
                    }
                });
        });
    authRouter.route('/signIn')
        .post(passport.authenticate('local', {
            failureRedirect: '/'
        }), function(req, res) {
            res.redirect('/Eventos');
        });

    authRouter.route('/profile')
        .all(function(req, res, next) {
            if (!req.user) {
                res.redirect('/');
            }
            next();
        })
        .get(function(req, res) {
            res.json(req.user);
        });

    authRouter.route('/')
        .get(function(req, res) {
            res.render('index', {
                title: 'Administrador de Eventos',
                regStatus: regStatus,
            });
        });

    authRouter.route('/error')
        .get(function(req, res) {
            res.send('Error usuario ya registrado');
        });
    return authRouter;
};

module.exports = router;