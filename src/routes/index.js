/*jshint esversion: 6 */

const routes = require('express').Router();
const mime = require('mime');
const fs = require('fs');

const mongo = require('../mongo');
const utils = require('../utils');

const saveApp = require('../hooks/saveApp');
const removeApp = require('../hooks/removeApp');

routes.get('/', (req, res) => {
    res.status(200).json({ message: 'Connected!' });
});

routes.get('/applications', (req, res) => {
    mongo.collect(availableVersions => res.send(availableVersions));
});

routes.get('/applications/:type/:version', (req, res) => {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.params.type, req.params.version);

    console.log('GET::/applications/:type/:version', req.params);

    res.setHeader('APP-TYPE', req.params.type);
    res.setHeader('APP-VERSION', req.params.version);

    fs.readdir(appDirPath, (err, list) => {
        var isSupported = list.some(file => file.indexOf(platformExtension) > -1);

        if (isSupported) {
            res.sendFile(utils.getAbsolutePath('supported.html'));
        } else {
            res.sendFile(utils.getAbsolutePath('notSupported.html'));
        }
    });
});

routes.post('/applications/:type/:version', (req, res) => {
    console.log('POST::/applications/:', req.params);

    saveApp(req.body, function (statusCode) {
        res.sendStatus(statusCode);
    });
});

routes.delete('/applications/:type/:version', (req, res) => {
    console.log('DELETE::/applications/:type/:version', req.params);

    removeApp(req.params, function (statusCode) {
        res.sendStatus(statusCode);
    });
});

routes.get('/manifest/:type/:version/manifest.plist', (req, res) => {
    console.log('TYPE: ', req.params.type);
    console.log('VERSION: ', req.params.version);

    fs.writeFile(__dirname  + '/manifest.plist', utils.generatePlist(req.params.type, req.params.version), (err) => {
        if (err) {
            console.log('ERROR: ', err);
        } else {
            console.log('There is no error');

            res.setHeader("Content-Type", 'text/plain');
            res.sendFile(__dirname  + '/manifest.plist');
        }
    });
});

routes.get('/install/:type/:version', (req, res) => {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.params.type, req.params.version);

    console.log('IPA mime: ', mime.lookup(appDirPath));
    console.log('Params: ', req.params);
    console.log('platformExtension: ', platformExtension);
    console.log(appDirPath);

    fs.readdir(appDirPath, (err, list) => {
        if (err) {
            console.log('List error: ', err);
        } else {
            console.log('List: ', list);

            list.forEach(file => {
                if (file.indexOf(platformExtension) > -1) {
                    console.log('Sent file: ', file);

                    res.setHeader("Content-Type", mime.lookup(appDirPath + '/' + file));
                    res.sendFile(appDirPath + '/' + file);
                }
            });
        }
    });
});

module.exports = routes;