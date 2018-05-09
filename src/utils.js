/*jshint esversion: 6 */

const path = require('path');
const fs = require('fs');

module.exports = {

    getFilePath: (type, version) => {
        return path.join(__dirname, '../', '/apps/' + type + '/' + version);
    },

    getAbsolutePath: fileName => {
        return path.join(__dirname, fileName);
    },

    getPlatformExtension: headers => {
        return headers['user-agent'].indexOf('Android') > -1 ? 'apk' : 'ipa';
    },

    createDirectoryWithPath: dirPath => {
        var dirPathArray = dirPath.split('/');

        dirPathArray.reduce((prev, next) => {
            if (!fs.existsSync(prev + '/' + next)) {
                fs.mkdirSync(prev + '/' + next);
            }

            return prev + '/' + next;
        });
    },

    generatePlist: (type, version) => {
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
            '<string>https://NGROK_HTTPS_ADDRESS/install/' + type + '/' + version + '/install.ipa</string>' +
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
};