let maker = require('../index');

let config = {
	files: './message.svg',
	dest: './iconfont',
	optimize: true
};

maker(config, (err, res) => {
	if(!err) console.log('res: ', res);
})