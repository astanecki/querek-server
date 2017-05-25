/**
 * Simple server for {kuler} managing given files
 */
var config      = require('./server.config');
var express     = require('express');
var app         = require('express')();
var mongoClient = require('mongodb').MongoClient;
var assert      = require('assert');
var http        = require('http').Server(app);

// http https = require('https');

var path        = require('path');
var io          = require('socket.io')(http);

var fs          = require('fs');
var rmdir       = require('rmdir');
var plist       = require('plist');
var mime        = require('mime');

var PORT        = config.CONNECTION.PORT;
var db;
var currentSocket;

// ******************* MONGOOSE DB *******************
function insertToDb(app, callback) {
    var collection = db.collection(app.type === 'release' ? 'rel' : 'dev');

    collection.insert(app, function(error, result) {
        // runtime test for checking if there is no error
        assert.equal(error, null);

        //console.log('Versions were inserted into database');
        callback(result);
    });
}

function removeFromDb(type, version, callback) {
    var collection = db.collection(type === 'release' ? 'rel' : 'dev');

    console.log('DB element to remove: ', collection.find({ version: version }));

    collection.removeOne({ version: version }, function(error, result) {
        // runtime test for checking if there is no error
        assert.equal(error, null);

        //console.log('Versions were inserted into database');
        callback(result);
    });
}

var findAll = function(db, callback) {
    var relCollection = db.collection('rel');
    var devCollection = db.collection('dev');

    relCollection.find({}).toArray(function(err, releases) {
        assert.equal(err, null);

        devCollection.find({}).toArray(function(err, developers) {
            assert.equal(err, null);

            callback({
                release: releases,
                developer: developers
            });
        });
    });
};

// mongoClient.connect('mongodb://localhost:2727/bet', function (error, mongoDb) {
mongoClient.connect('mongodb://dev-querek-mongo:27017/baza2', function (error, mongoDb) {
    assert.equal(null, error);

    db = mongoDb;

    console.log("Connected correctly to mongodb");
});

//******************* SOCKETS *******************
// I assume when user will try to connect, there will be defined db from mongoClient.connect
io.on('connection', function (socket) {
    console.log('A user connected');

    currentSocket = socket;

    emitAll();

    socket.on('disconnect', onDisconnect);
    socket.on('new-app', onReceivedNewApp);
    socket.on('remove-app', onRemoveApp);
    socket.on('download-app', onDownloadFile);
});

function emitAll() {
    findAll(db, function (availableVersions) {
        currentSocket.emit('availableVersions', availableVersions);
    });
}

function onDisconnect() {
    console.log('user disconnected');
}

function onReceivedNewApp(app) {
    prepareAppsDirectory('apps/' + app.type + '/' +  app.version);

    writeFiles(app);

    insertToDb(
        prepareAppForSaving(app),
        emitAll
    );
}

function onDownloadFile(app) {
    // create stream
}

function prepareAppsDirectory(dirPath) {
    var dirPathArray = dirPath.split('/');

    dirPathArray.reduce(function (prev, next) {
        if (!fs.existsSync(prev + '/' + next)) {
            fs.mkdirSync(prev + '/' + next);
        }

        return prev + '/' + next;
    });
}

function writeFiles(app) {
    config.EXTENSIONS.forEach(function (extension) {
        if (app.hasOwnProperty(extension)) {
            writeFile(app.version, app[extension].name, app[extension].base64, app.type);
        }
    });
}

function onRemoveApp(app) {
    var appDir = 'apps/' + app.type + '/' + app.version;

    console.log('onRemoveApp()', app);
    console.log('appDir: ', appDir);
    console.log('exist? ', fs.existsSync(appDir));

    if(fs.existsSync(appDir)) {
        rmdir(appDir, function (err, dirs, files) {
            console.log('Removed dirs: ', dirs);
            console.log('Removed files: ', files);
            console.log('All files removed');

            removeFromDb(app.type, app.version, emitAll);
        });
    }
}

function prepareAppForSaving(app) {
    return {
        version: app.version,
        title: app.title,
        date: app.date,
        description: app.description,
        platforms: app.platforms,
        type: app.type
    };
}


function writeFile(version, name, base64, type) {
    fs.writeFile('apps/' + type + '/' + version + '/' + name, base64, 'base64');
}

function getFilePath(type, version) {
    return __dirname + '/apps/' + type + '/' + version;
}

function getPlatformExtension(headers) {
    return headers['user-agent'].indexOf('Android') > -1 ? 'apk' : 'ipa';
}

// *******************  HANDLING PATHS *******************

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
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
    var platformExtension = getPlatformExtension(req.headers);
    var appDirPath = getFilePath(req.query.type, req.query.version);

    console.log('Query: ', req.query);
    console.log('platformExtension: ', platformExtension);
    console.log('Applications dir: ', appDirPath);

    fs.readdir(appDirPath, function (err, list) {
        list.forEach(function (file) {

            // @example file = "Fitatu.apk"
            if (file.indexOf(platformExtension) > -1) {
                console.log('file: ', file);
                // browser downloads file named "app.ipa" or "app.apk" due to endpoint name
                res.setHeader("Content-Type", mime.lookup(appDirPath + '/' + file)); //Solution!
                res.sendFile(appDirPath + '/' + file);
            }
        });
    });
});

app.get('/application', function (req, res) {
    res.setHeader('APP-TYPE', req.query.type);
    res.setHeader('APP-VERSION', req.query.version);
    res.sendFile(__dirname  + '/install.html');
});

app.get('/application.ipa', function (req, res) {

    // tutorial https://gknops.github.io/adHocGenerate/#magiclink
    // local: http://192.168.0.87:3001/xxx?type=release&version=v2.0.11&t=3
    // remote: http://www.bitart.com/WirelessAdHocDemo/WirelessAdHocDemo.plist

    var platformExtension = getPlatformExtension(req.headers);
    var appDirPath = getFilePath(req.query.type, req.query.version);

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
                            '<string>https://querek.fitatu.com/fitatu/' + type + '/' + version + '/fitatu.ipa</string>' +
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