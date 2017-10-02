var fs = require('fs');
var rmdir = require('rmdir');
var CONFIG = require('../server.config');
var mongoHandler = require('./mongoHandler');
var currentSocket;

function setCurrentSocket(socket) {
    currentSocket = socket;
}

function bindSocket(socket) {
    socket.on('disconnect', onDisconnect);
    socket.on('new-app', onReceivedNewApp);
    socket.on('remove-app', onRemoveApp);
    socket.on('download-app', onDownloadFile);
}

function emitAll() {
    mongoHandler.collect(function (availableVersions) {
        currentSocket.emit('availableVersions', availableVersions);
    }.bind(this));
}

function onDisconnect() {
    console.log('user disconnected');
}

function onReceivedNewApp(app) {
    prepareAppsDirectory('apps/' + app.type + '/' +  app.version);

    writeFiles(app);

    mongoHandler.insert(
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
        var fs = require('fs');

        if (!fs.existsSync(prev + '/' + next)) {
            fs.mkdirSync(prev + '/' + next);
        }

        return prev + '/' + next;
    });
}

function writeFiles(app) {
    CONFIG.EXTENSIONS.forEach(function (extension) {
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

            mongoHandler.remove(app.type, app.version, emitAll);
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

module.exports = {
    /**
     * @function
     * @param io
     */
    startListening: function (io) {
        console.log('startListening');

        io.on('connection', function (socket) {
            console.log('A user connected.');

            setCurrentSocket(socket);
            emitAll();
            bindSocket(socket);
        });
    }
};