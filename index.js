const glob = require('glob');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Q = require('q');
const svgo = require('./node_modules/svgo/lib/svgo');
const generator = require('webfonts-generator');

const tmpdir = os.tmpdir();

let iconTmpPath = path.resolve(tmpdir, 'iconfont');
console.log(iconTmpPath);

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

	let svgOptimize = new svgo(options.svgo || {});

	if(options.optimize){
		console.log('Optimizing svg icons...');
		optimize(options.files).then( (nFiles) => {
			console.log('Optimizing done!');
			options.files = nFiles;
			console.log('Making iconfont...');
			generator(options, function (err, res) {
				console.log('Making done!');
				cleanTmp();
				Object.prototype.toString.apply(done) === '[object Function]' && done(err, res);
			});
		});
	}else {
		generator(options, function (err, res) {
			cleanTmp();
			Object.prototype.toString.apply(done) === '[object Function]' && done(err, res);
		});
	}

	function svgOptimizePromise (svgStr) {
		let defer = Q.defer();

		svgOptimize.optimize(svgStr, res => {
			if(res.error) {
				defer.reject(res.error);
			} else {
				defer.resolve(res.data);
			}
		});

		return defer.promise;
	}

	function optimize (files) {
		if(!fs.existsSync(iconTmpPath)) fs.mkdirSync(iconTmpPath);
		let defer = Q.defer();
		let tasks = [];
		let nFiles = [];
		files.forEach( file => {
			let fileName = path.basename(file);
			let svgStr = fs.readFileSync(file, 'utf8');

			tasks.push(svgOptimizePromise(svgStr).then(res => {
				let nFile = path.resolve(iconTmpPath, fileName);
				nFiles.push(nFile);
				fs.writeFileSync(nFile, res, 'utf8')
			}, err => { console.log(err); }));
		});

		Q.all(tasks).spread( _ => {
			defer.resolve(nFiles);
		}, reason => {
			defer.reject(reason);
		});

		return defer.promise;
	}
};

function cleanTmp () {
	console.log('Cleaning tmp dir...');
	fs.readdir(iconTmpPath, (err, files) => {
		if(err) {
			console.log(err);
			return;
		}

		files.forEach( file => {
			let fullPath = path.resolve(iconTmpPath, file);
			fs.unlinkSync(fullPath);
		});

		fs.rmdir(iconTmpPath, (err) => {
			if(err){
				console.log(err);
			} else {
				console.log('Tmp dir cleaned...');
			}

		})

	})
}

module.exports = iconfont;
