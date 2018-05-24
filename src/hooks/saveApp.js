const fs            = require('fs');
const rmdir         = require('rmdir');

const CONFIG        = require('../../server.config');
const mongo  = require('../mongo');
const utils         = require('../utils');

function writeFiles(app) {
    console.log('writeFiles()', app.title);

    CONFIG.EXTENSIONS.forEach(function (extension) {
        if (app.hasOwnProperty(extension)) {
            writeFile(app.version, app[extension].name, app[extension].base64, app.type);
        }
    });
}

function writeFile(version, name, base64, type) {
    fs.writeFile('apps/' + type + '/' + version + '/' + name, base64, 'base64');
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

module.exports = function (app, callback) {
    console.log('onReceivedNewApp', app.title);

    utils.createDirectoryWithPath('apps/' + app.type + '/' +  app.version);

    writeFiles(app);

    mongo.insert(prepareAppForSaving(app), callback);
};