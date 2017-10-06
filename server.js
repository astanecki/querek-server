const config = require('./server.config');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dotenv = require('dotenv');

const mongo = require('mongoHandler');
const socket = require('socketHandler');
const routes = require('routes');

dotenv.config();
socket.startListening(io);
mongo.connect();

app.use('/', routes);

http.listen(config.CONNECTION.PORT, function () {
    console.log('Server listening on port: ', config.CONNECTION.PORT);
});