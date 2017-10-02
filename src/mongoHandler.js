/**
 * Simple server for {Querek} managing given files
 */
var mongoClient = require('mongodb').MongoClient;
var assert      = require('assert');
var path        = require('path');
var fs          = require('fs');
var plist       = require('plist');
var mime        = require('mime');
var db;

module.exports = {
    connect: function () {
        mongoClient.connect('mongodb://localhost:2727/bet', function (error, mongoDb) {
            assert.equal(null, error);

            db = mongoDb;

            console.log("Connected correctly to mongodb");
        });
    },

    insert: function (app, callback) {
        var collection = db.collection(app.type === 'release' ? 'rel' : 'dev');

        collection.insert(app, function(error, result) {
            // runtime test for checking if there is no error
            assert.equal(error, null);

            //console.log('Versions were inserted into database');
            callback(result);
        });
    },

    remove: function (type, version, callback) {
        var collection = db.collection(type === 'release' ? 'rel' : 'dev');

        console.log('DB element to remove: ', collection.find({ version: version }));

        collection.removeOne({ version: version }, function(error, result) {
            // runtime test for checking if there is no error
            assert.equal(error, null);

            //console.log('Versions were inserted into database');
            callback(result);
        });
    },

    collect: function (callback) {
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
    }
};