"use strict";

var NexusServer,
    Router = require('./Router'),
    Auth = require('./Auth'),
    express = require('express'),
    bodyParser = require('body-parser'),
    hoganExpress = require('hogan-express'),
    db = require('./Models'),
    q = require('q');

/**
 * Nexus server
 *
 * @param config
 * @constructor
 */
NexusServer = function (config) {
    var app = this.app = express();

    // Keep reference to NexusServer
    app.NexusServer = this;

    // Keep reference to configuration file
    this.config = config;

    // Setup body parser
    // Parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

    // Parse application/json
    app.use(bodyParser.json());

    // Setup authentication
    this.auth = new Auth(app);
    this.auth.setupPassport();

    // Setup view engine
    app.set('view engine', 'html');
    app.set('layout', 'layout');
    //app.enable('view cache');
    app.engine('html', hoganExpress);

    // Setup app routes
    this.router = new Router(app);
    this.router.init();
};

/**
 * Begin listening
 */
NexusServer.prototype.listen = function ()
{
    var server,
        app = this.app,
        config = this.config;

    // Connect to database and start listening
    this
        .connectToDb()
        .then(function () {
            server = app.listen(config.port || 3000, function () {
                console.log('Listening on port %d', server.address().port);
            });
    }, function (reason) {
            throw reason;
        });
};

/**
 * Create database connection
 *
 * @returns {promise|Q.promise}
 */
NexusServer.prototype.connectToDb = function ()
{
    var deferred = q.defer(),
        self = this;

    db
        .sequelize
        .sync({ force: true })
        .complete(function (err) {
            if (err) {
                deferred.reject(err);
            }

            self.auth.createDefaultUser();

            deferred.resolve();
        });

    return deferred.promise;
};

module.exports = NexusServer;
