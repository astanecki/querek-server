/*jshint esversion: 6 */

const routes = require('express').Router();
const mime = require('mime');
const fs = require('fs');

const utils = require('utils');

routes.get('/', (req, res) => {
    res.status(200).json({ message: 'Connected!' });
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

//TODO refactor endpoint naming - it is only for iOS
routes.get('/fitatu/:type/:version/fitatu.ipa', (req, res) => {
    var appDirPath = utils.getFilePath(req.params.type, req.params.version);

    console.log('IPA mime: ', mime.lookup(appDirPath));

    res.setHeader("Content-Type", mime.lookup(appDirPath + '/' + 'Fitatu.ipa'));
    res.sendFile(appDirPath + '/' + 'Fitatu.ipa');
});

//TODO refactor endpoint naming - it is only for Android
routes.get('/app', (req, res) => {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.query.type, req.query.version);

    console.log('Query: ', req.query);
    console.log('platformExtension: ', platformExtension);
    console.log(appDirPath);

    fs.readdir(appDirPath, (err, list) => {
        if (err) {
            console.log('List error: ', err);
        } else {
            console.log('List: ', list);

            list.forEach(file => {

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

routes.get('/application', (req, res) => {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.query.type, req.query.version);

    res.setHeader('APP-TYPE', req.query.type);
    res.setHeader('APP-VERSION', req.query.version);

    fs.readdir(appDirPath, (err, list) => {
        var isSupported = list.some(file => file.indexOf(platformExtension) > -1);

        if (isSupported) {
            res.sendFile(utils.getAbsolutePath('supported.html'));
        } else {
            res.sendFile(utils.getAbsolutePath('notSupported.html'));
        }
    });
});

// TODO test on iOS if is needed.
routes.get('/application.ipa', (req, res) => {
    var platformExtension = utils.getPlatformExtension(req.headers);
    var appDirPath = utils.getFilePath(req.query.type, req.query.version);

    console.log('Query: ', req.query);
    console.log('platformExtension: ', platformExtension);
    console.log('Applications dir: ', appDirPath);
    console.log('mime: ',     mime.lookup(appDirPath + '/Fitatu.ipa'));

    fs.readdir(appDirPath, (err, list) => {
        list.forEach(file => {
            // @example file = "Fitatu.apk"
            if (file.indexOf(platformExtension) > -1) {
                res.setHeader("Content-Type", 'text/plain');
                res.sendFile(__dirname  + '/manifest.plist');
            }
        });
    });
});

module.exports = routes;