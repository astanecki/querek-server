const config = require('./server.config');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const mongo = require('mongo');
const socket = require('socket');
const routes = require('routes');


mongo.connect();

io.on('connection', socket.onConnect);

app.use('/', routes);

http.listen(config.CONNECTION.PORT, () => {
    console.log('Server listening on port: ', config.CONNECTION.PORT);
});