/*jshint esversion: 6 */

const fs            = require('fs');
const rmdir         = require('rmdir');

const CONFIG        = require('../server.config');
const mongoHandler  = require('./mongo');
const utils         = require('./utils');

function onReceivedNewApp(app) {
    console.log('onReceivedNewApp', app.title);

    utils.createDirectoryWithPath('apps/' + app.type + '/' +  app.version);

    writeFiles(app);

    mongoHandler.insert(
        prepareAppForSaving(app),
        function (codes) {
            console.log('Available: ', codes);
        }
    );
}

function writeFiles(app) {
    console.log('writeFiles()', app.title);

    CONFIG.EXTENSIONS.forEach(function (extension) {
        if (app.hasOwnProperty(extension)) {
            writeFile(app.version, app[extension].name, app[extension].base64, app.type);
        }
    });
}

function onRemoveApp(app) {
    var appDir = 'apps/' + app.type + '/' + app.version;

    console.log('onRemoveApp()', appDir);

    if(fs.existsSync(appDir) ) {
        rmdir(appDir, (err, dirs, files) => {
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
    onReceivedNewApp: onReceivedNewApp,
    onRemoveApp: onRemoveApp
};