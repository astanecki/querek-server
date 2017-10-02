/**
 * Simple server for {Querek} managing given files
 */
var config      = require('./server.config');
var express     = require('express');
var app         = require('express')();
var assert      = require('assert');
var http        = require('http').Server(app);

var path        = require('path');
var io          = require('socket.io')(http);

var fs          = require('fs');
var plist       = require('plist');
var mime        = require('mime');

var PORT        = config.CONNECTION.PORT;

var mongoHandler = require('./src/mongoHandler');
var socketHandler = require('./src/socketHandler');
var utils = require('./src/utils');

socketHandler.startListening(io);
mongoHandler.connect();

// *******************  HANDLING PATHS *******************

app.use('/', express.static('dist'));

app.get('/', function (req, res) {
    res.send('QR Code Manager working at all');
});

app.get('/manifest.plist', function (req, res) {
    res.setHeader("Content-Type", 'text/plain');
    res.sendFile(__dirname  + '/manifest.plist');
});

app.get('/manifest/:type/:version/manifest.plist', function (req, res) {
    console.log('TYPE: ', req.params.type);
    console.log('VERSION: ', req.params.version);

    fs.writeFile(__dirname  + '/manifest.plist', generatePlist(req.params.type, req.params.version), function (err) {
        if (err) {
            console.log('ERROR: ', err);
        } else {
            console.log('There is no error');

            res.setHeader("Content-Type", 'text/plain');
            res.sendFile(__dirname  + '/manifest.plist');
        }
    });
});

app.get('/fitatu.ipa', function (req, res) {
    var path = __dirname + '/apps/release/v2.0.14/Fitatu.ipa';

    res.setHeader("Content-Type", mime.lookup(path));
    res.sendFile(path);
});

app.get('/fitatu/:type/:version/fitatu.ipa', function (req, res) {
    var appDirPath = getFilePath(req.params.type, req.params.version);

    console.log('IPA mime: ', mime.lookup(appDirPath));

    res.setHeader("Content-Type", mime.lookup(appDirPath + '/' + 'Fitatu.ipa'));
    res.sendFile(appDirPath + '/' + 'Fitatu.ipa');
});

app.get('/app', function (req, res) {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.query.type, req.query.version);

    console.log('Query: ', req.query);
    console.log('platformExtension: ', platformExtension);
    console.log('Applications dir: ', appDirPath);

    fs.readdir(appDirPath, function (err, list) {
        if (err) {
            console.log('List error: ', err);
        } else {
            console.log('List: ', list);

            list.forEach(function (file) {

                // @example file = "Fitatu.apk"
                if (file.indexOf(platformExtension) > -1) {
                    console.log('file: ', file);
                    // browser downloads file named "app.ipa" or "app.apk" due to endpoint name
                    res.setHeader("Content-Type", mime.lookup(appDirPath + '/' + file)); //Solution!
                    res.sendFile(appDirPath + '/' + file);
                }
            });
        }
    });
});

app.get('/application', function (req, res) {
    res.setHeader('APP-TYPE', req.query.type);
    res.setHeader('APP-VERSION', req.query.version);

    res.sendFile(__dirname  + '/install.html');
});

app.get('/application.ipa', function (req, res) {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.query.type, req.query.version);

    // tutorial https://gknops.github.io/adHocGenerate/#magiclink
    // local: http://192.168.0.87:3001/xxx?type=release&version=v2.0.11&t=3
    // remote: http://www.bitart.com/WirelessAdHocDemo/WirelessAdHocDemo.plist

    console.log('Query: ', req.query);
    console.log('platformExtension: ', platformExtension);
    console.log('Applications dir: ', appDirPath);
    console.log('mime: ',     mime.lookup(appDirPath + '/Fitatu.ipa'));

    fs.readdir(appDirPath, function (err, list) {
        list.forEach(function (file) {
            // @example file = "Fitatu.apk"
            if (file.indexOf(platformExtension) > -1) {
                res.setHeader("Content-Type", 'text/plain');
                res.sendFile(__dirname  + '/manifest.plist');
            }
        });
    });
});

function generatePlist(type, version) {
    var xml =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' +
        '<plist version="1.0">' +
            '<dict>' +
                '<key>items</key>' +
                '<array>' +
                    '<dict>' +
                        '<key>assets</key>' +
                        '<array>' +
                            '<dict>' +
                            '<key>kind</key>' +
                            '<string>software-package</string>' +
                            '<key>url</key>' +
                            // here server crashes while connecting variables
                            '<string>https://551530d2.ngrok.io/fitatu/' + type + '/' + version + '/fitatu.ipa</string>' +
                            // '<string>https://551530d2.ngrok.io/fitatu/release/v2.0.14/fitatu.ipa</string>' +
                            // '<string>https://551530d2.ngrok.io/fitatu.ipa</string>' +
                            '</dict>' +
                        '</array>' +
                        '<key>metadata</key>' +
                        '<dict>' +
                            '<key>bundle-identifier</key>' +
                            '<string>com.fitatu.tracker</string>' +
                            '<key>bundle-version</key>' +
                            '<string>2.0.3</string>' +
                            '<key>kind</key>' +
                            '<string>software</string>' +
                            '<key>title</key>' +
                            '<string>AppName</string>' +
                        '</dict>' +
                    '</dict>' +
                '</array>' +
            '</dict>' +
        '</plist>';

    return xml;
}

function onSuccessListeningServer() {
    console.log('QRManager listening on ' + PORT);
}

// Start listening
http.listen(PORT, onSuccessListeningServer);