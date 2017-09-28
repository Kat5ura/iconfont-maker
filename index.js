const glob = require('glob');
const generator = require('webfonts-generator');

let iconfont = function (options, done) {
    let files = options.files;

    if (!files || !files.length) {
        throw (new Error('You need to specify icon files'));
    }

    if (Object.prototype.toString.apply(files) === '[object String]') {
        files = [files];
    }

    if (!Array.isArray(files)) {
        throw (new Error('Files options only accept String or Array'));
    }

    let allFiles = [];
    files.forEach((item) => {
        try {
            let res = glob.sync(item);
            allFiles = [...allFiles, ...res];
        } catch (error) {
            throw (error)
        }
    });

    options.files = allFiles.filter((file) => {
        let reg = /\.svg$/ig;
        return reg.test(file);
    });

    generator(options, function (err, res) {
        if (err) {
            console.log('Fail!', err);
        } else {
            console.log('Done!');
            Object.prototype.toString.apply(done) === '[object Function]' && done(res);
        }
    });
};

module.exports = iconfont;
