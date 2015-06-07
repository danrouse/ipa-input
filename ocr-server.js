var fs = require('fs');
var glob = require('glob');

var express = require('express');
var app = express();

var pngparse = require('pngparse');

app.use(require('body-parser').json());
app.use(require('cors')());
app.use(require('limits')({
	enable: true,
	file_uploads: true,
	post_max_size: 1048576
}));
app.use(express.static('./dist'));

function error(req, res, data) {
	res.send('error');
	console.log(req.ip, 'error', data.join(' '));
}
function success(req, res, data) {
	res.send('success');
	console.log(req.ip, data.join(' '));
}

// main handler, POST to /
// postdata { image: [base64], data: { points, strokes }, glyph: 'unicode' }
app.post('/', function(req, res) {
	var ipStripped = req.ip.replace(/\./g, '_');
	var timestamp = Math.floor(Date.now());
	var glyph = req.body.glyph;
	var image = req.body.image;
	var points = req.body.points;
	var nameFields = [
		req.body.glyph,
		timestamp,
		ipStripped
	];

	var imageData = image.replace(/^data:image\/png;base64,/, '');
	var imageBuffer = new Buffer(imageData, 'base64');
	var imageName = './training/' + nameFields.join('-');

	pngparse.parse(imageBuffer, function(err, pngData) {
		var w = pngData.width;
		var h = pngData.height;
		var black = 0;
		var pixels = [];

		// convert RGBA to binary B/W
		for(var y = 0; y < h; y++) {
			for(var x = 0; x < w; x++) {
				var px = pngData.data[(y * w + x) * 4 + 3];
				pixels.push(Math.ceil(px / 255));
				if(px > 0) {
					black += 1;
				}
			}
		}

		black = black / pixels.length;

		fs.writeFile(imageName + '.png', imageBuffer, function(err) {
			if(err) {
				error(req, res, [err]);
			} else {
				success(req, res, ['received', glyph, timestamp]);
			}
		});
	});
});

app.delete('/', function(req, res) {
	var ipStripped = req.ip.replace(/\./g, '_');

	// find most recent file by this IP
	glob('./training/*-' + ipStripped + '.png', function(err, files) {
		if(err || !files.length) {
			error(req, res, [err || 'no files to delete']);
		} else {
			// sort by timestamp
			files.sort(function(a, b) {
				var matchA = a.match(/\-(\d+)\-\d+\_/);
				var matchB = b.match(/\-(\d+)\-\d+\_/);
				var timeA = parseInt(matchA[1]);
				var timeB = parseInt(matchB[1]);
				return timeB - timeA;
			});

			// nuke it
			fs.unlink(files[0], function(uerr) {
				if(uerr) {
					error(req, res, [err || 'unlink error']);
				} else {
					success(req, res, ['deleted', files[0]]);
				}
			});
		}
	});
});

app.listen(3000, function() {
	console.log('Listening on port 3000');
});