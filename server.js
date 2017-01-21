/**
 * Simple server for Querek managing given files
 */
var config      = require('./server.config');
var app         = require('express')();
var mongoClient = require('mongodb').MongoClient;
var assert      = require('assert');
var http        = require('http').Server(app);
var path        = require('path');
var io          = require('socket.io')(http);

var fs          = require('fs');
var rmdir       = require('rmdir');

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

mongoClient.connect('mongodb://localhost:2727/bet', function (error, mongoDb) {
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

    if(fs.existsSync(appDir) ) {
        rmdir(appDir, function (err, dirs, files) {
            console.log('removed dirs: ', dirs);
            console.log('removed files: ', files);
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
    fs.writeFile(
        'apps/' + type + '/' + version + '/' + name,
        base64,
        'base64'
    );
}

function getFilePath(type, version) {
    return __dirname + '/apps/' + type + '/' + version;
}

function getPlatformExtension(headers) {
    return headers['user-agent'].indexOf('Android') > -1 ? 'apk' : 'ipa';
}

// *******************  HANDLING PATHS *******************
app.get('/', function (req, res) {
    res.send('QR Code Manager working at all');
});

app.get('/app', function (req, res) {
    var platformExtension = getPlatformExtension(req.headers);
    var appDirPath = getFilePath(req.query.type, req.query.version);

    fs.readdir(appDirPath, function (err, list) {
        list.forEach(function (file) {
            // @example file = "Fitatu.apk"
            if (file.indexOf(platformExtension) > -1) {
                // browser downloads file named "app.ipa" or "app.apk" due to endpoint name
                res.sendFile(appDirPath + '/' + file);
            }
        });
    });
});

function onSuccessListeningServer() {
    console.log('QRManager listening on ' + PORT);
}

// Start listening
http.listen(PORT, onSuccessListeningServer);