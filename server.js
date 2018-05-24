/*jshint esversion: 6 */

const app           = require('express')();

const config        = require('./server.config');
const bodyParser    = require('body-parser');

const mongo         = require('./src/mongo');
const routes        = require('./src/routes');

mongo.connect();

app.use(bodyParser.urlencoded({ limit: config.LIMIT, extended: true }));
app.use(bodyParser.json({ limit: config.LIMIT, extended: true }));
app.use(bodyParser.raw({ limit: config.LIMIT }));
app.use('/', routes);

app.listen(config.CONNECTION.PORT, () => {
    console.log('Server listening on port: ', config.CONNECTION.PORT);
});