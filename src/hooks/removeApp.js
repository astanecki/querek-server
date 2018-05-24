const fs            = require('fs');
const rmdir         = require('rmdir');

const mongo  = require('../mongo');

module.exports = function (app, callback) {
    var appDir = 'apps/' + app.type + '/' + app.version;

    console.log('onRemoveApp()', appDir);

    if(fs.existsSync(appDir) ) {
        rmdir(appDir, (err, dirs, files) => {
            console.log('removed dirs: ', dirs);
            console.log('removed files: ', files);
            console.log('All files removed');

            mongo.remove(app.type, app.version, callback);
        });
    } else {
        callback(204);
    }
};