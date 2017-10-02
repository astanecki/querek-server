/**
 *
 */
module.exports = {
    /**
     *
     * @param type
     * @param version
     * @returns {string}
     */
    getFilePath: function (type, version) {
        return __dirname + '/apps/' + type + '/' + version;
    },

    /**
     *
     * @param headers
     * @returns {string}
     */
    getPlatformExtension: function (headers) {
        return headers['user-agent'].indexOf('Android') > -1 ? 'apk' : 'ipa';
    }
};