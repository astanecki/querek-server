/**
 * Simple server for {Querek} managing given files
 */
const mongoClient   = require('mongodb').MongoClient;
const assert        = require('assert');
const path          = require('path');
const fs            = require('fs');
const plist         = require('plist');
const mime          = require('mime');
var db;

module.exports = {
    /**
     * @function
     */
    connect: () => {
        mongoClient.connect('mongodb://localhost:2727/rest_v1', (error, mongoDb) => {
            assert.equal(null, error);

            db = mongoDb;

            console.log("Connected correctly to mongodb");
        });
    },

    /**
     * @function
     * @param app
     * @param callback
     */
    insert: (app, callback) => {
        var collection = db.collection(app.type === 'release' ? 'rel' : 'dev');

        collection.insert(app, (error, result) => {
            // runtime test for checking if there is no error
            assert.equal(error, null);

            //console.log('Versions were inserted into database');
            callback(result);
        });
    },

    /**
     * @function
     * @param type
     * @param version
     * @param callback
     */
    remove: (type, version, callback) => {
        var collection = db.collection(type === 'release' ? 'rel' : 'dev');

        console.log('DB element to remove: ', collection.find({ version: version }));

        collection.removeOne({ version: version }, (error, result) => {
            // runtime test for checking if there is no error
            assert.equal(error, null);

            if (callback) {
                callback(result);
            }
        });
    },

    /**
     * @function
     * @param callback
     */
    collect: (callback) => {
        var relCollection = db.collection('rel');
        var devCollection = db.collection('dev');

        relCollection.find({}).toArray((err, releases) => {
            assert.equal(err, null);

            devCollection.find({}).toArray((err, developers) => {
                assert.equal(err, null);

                callback({
                    release: releases,
                    developer: developers
                });
            });
        });
    }
};