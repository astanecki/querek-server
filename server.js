/*jshint esversion: 6 */

const config = require('./server.config');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const mongo = require('./src/mongo');
const socket = require('./src/socket');
const routes = require('./src/routes');

mongo.connect();

io.on('connection', socket.onConnect);

app.use(bodyParser.urlencoded({ limit: config.LIMIT, extended: true }));
app.use(bodyParser.json({ limit: config.LIMIT, extended: true }));
app.use(bodyParser.raw({ limit: config.LIMIT }));
app.use('/', routes);

http.listen(config.CONNECTION.PORT, () => {
    console.log('Server listening on port: ', config.CONNECTION.PORT);
});