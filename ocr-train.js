var fs = require('fs');
// var convnetjs = require('convnetjs');
// var brain = require('brain');
var pngparse = require('pngparse');
var punycode = require('punycode');
var natural = require('natural');
var classifier = new natural.BayesClassifier();
var glyphs = require('./app/scripts/glyphs.js').glyphs;

var width = 28,
	height = 28;

// init convnet
if(typeof convnetjs !== 'undefined') {
	var layer_defs = [];
	layer_defs.push({ type: 'input', out_sx: width, out_sy: height, out_depth: 1 });
	layer_defs.push({ type: 'conv', sx: 4, filters: 16, stride: 1, pad: 2, activation: 'relu' });
	layer_defs.push({ type: 'pool', sx: 2, stride: 2 });
	layer_defs.push({ type: 'conv', sx: 5, filters: 20, stride: 1, pad: 2, activation: 'relu' });
	layer_defs.push({ type: 'pool', sx: 2, stride: 2 });
	layer_defs.push({ type: 'conv', sx: 5, filters: 20, stride: 1, pad: 2, activation: 'relu' });
	layer_defs.push({ type: 'pool', sx: 2, stride: 2 });
	layer_defs.push({ type: 'softmax', num_classes: glyphs.index.length });

	var net = new convnetjs.Net();
	net.makeLayers(layer_defs);

	var trainer = new convnetjs.SGDTrainer(net, { learning_rate: 0.0001, momentum: 0.9, batch_size: 2, l2_decay:0.0001 });
}
// var net = new brain.NeuralNetwork();


// load images
var samples = [],
	responses = [];

var files_read = 0;
var header = [];
var header_defined = false;

fs.readdir('./training/', function(err, files) {
	files_length = files.length;
	for(var i in files) {
		var match = files[i].match(/(.+)\-\d+.png$/);
		if(match) {
			(function(j, match) {
				var glyph = match[1];
				var fdata = fs.readFileSync('./training/' + match[0]);
				pngparse.parse(fdata, function(perr, data) {
					if(perr)
						throw perr

					var vol;
					if(typeof convnetjs !== 'undefined') {
						vol = new convnetjs.Vol(width, height, 1, 0.0);
					} else {
						vol = [];
					}

					for(var y = 0; y < data.height; y++) {
						for(var x = 0; x < data.width; x++) {
							var px = data.data[(y * data.width + x) * 4 + 3];
							if(typeof convnetjs !== 'undefined') {
								vol.set(x, y, 0, px > 0 ? 1 : 0);
							} else {
								vol.push(px > 0 ? 1 : 0);
							}
							if(!header_defined) {
								header.push(x + '-' + y);
							}
						}
					}
					header_defined = true;

					if(typeof convnetjs !== 'undefined') {
						samples.push([vol, glyph]);
					} else if(typeof brain !== 'undefined') {
						samples.push({ input: vol, output: glyph });
					} else {
						samples.push(vol);
						responses.push(glyph);
					}

					if(++files_read === files.length) {
						onLoadingComplete();
					}
				});
			})(i, match);
		}
	}
});

function shuffle(array, array2) {
	var i = array.length, tmp, random;
	while(0 !== i) {
		random = Math.floor(Math.random() * i--);
		tmp = array[i];
		array[i] = array[random];
		array[random] = tmp;
		if(array2) {
			tmp = array2[i];
			array2[i] = array2[random];
			array2[random] = tmp;
		}
	}
	if(array2) {
		return [array, array2];
	} else {
		return array;
	}
}

function onLoadingComplete() {
	var numSamples = samples.length;
	if(typeof convnetjs !== 'undefined') {
		var shuffled = shuffle(samples);

		for(var i in shuffled) {
			var vol = shuffled[i][0];
			var glyph = shuffled[i][1];

			trainer.train(vol, glyph);

			if(i < numSamples * 0.8) {
				trainer.train(vol, glyph);

				var progress = '' + Math.round(i / numSamples * 1000) / 10;
				if(progress.indexOf('.') === -1) { progress = progress + '.0'; }
				console.log('training', progress + '% - ', glyph);
			} else {
				var aavg = new convnetjs.Vol(1, 1, glyphs.index.length, 0.0);
				for(var j = 0; j < 4; j++) {
					var a = net.forward(convnetjs.augment(vol, 24));
					aavg.addFrom(a);
				}
				var preds = [];
				for(var k = 0; k < aavg.w.length; k++) {
					preds.push({ k: k, p: aavg.w[k] });
					preds.sort(function(a, b) { return a.p < b.p ? 1 : -1; });
				}
				console.log('validation', glyph, aavg, preds);
			}
		}
	} else if(typeof natural !== 'undefined') {
		var shuffled = shuffle(samples, responses);
		var s = shuffled[0], r = shuffled[1];
		var numClassified = 0;
		var classified = false;

		for(var i in s)  {
			if(i < numSamples * 0.8) {
				//console.log('training', i, r[i]);
				classifier.addDocument(s[i], r[i]);
			} else {
				if(!classified) {
					classifier.train();
					classified = true;
				}
				//console.log('testing', i, r[i]);
				console.log(r[i], classifier.getClassifications(s[i]));
			}
			// classifier.events.on('trainedWithDocument', function(obj) {
			// 	console.log(obj);
			// });
		}
	} else {
		var shuffled = shuffle(samples, responses);
		var s = shuffled[0], r = shuffled[1];

		header.push('glyph');
		console.log(header.join(','));
		for(var i in s) {
			var glyph = punycode.encode(r[i]);
			s[i].push('"' + glyph + '"');
			console.log(s[i].join(','));
		}
	}
}

function test_convnet(vol, glyph) {
	var result = net.forward(vol);
	var yhat = net.getPrediction();
	console.log('expected', glyph, 'got', result, yhat);
}
var train_network = function() {
	// header.push('y');
	// var output = header.join(',') + '\n';
	// for(var row in shuffle(samples)) {
	// 	output += samples[row].join(',') + '\n';
	// }
	// fs.writeFile('training.csv', output, function(err) {
	// 	if(err)
	// 		throw err
	// 	console.log('wrote training csv');
	// });

	// console.log('training network', samples.length);
	// var results = net.train(samples, {
	// 	errorThresh: 0.005,
	// 	iterations: 20000,
	// 	log: true,
	// 	logPeriod: 1,
	// 	learningRate: 0.3,
	// 	hiddenLayers: [glyphs.symbols.length * 3]
	// });
	// console.log(results);

	// // var json = JSON.stringify(net.toJSON());
	// var brain_net = net.toFunction();
	// fs.writeFile('net.js', brain_net.toString(), function(err) {
	// 	if(err) throw err
	// 	console.log('network saved to net.js');
	// });

	// var magicnet = new convnetjs.MagicNet(samples, responses, {
	// 	train_ratio: 0.7,
	// 	num_folds: 1,
	// 	num_candidates: 50,
	// 	num_epochs: 1,
	// 	ensemble_size: 20
	// });
	// magicnet.onFinishBatch(function() {
	// 	console.log('finish batch');
	// });

	// setInterval(function() {
	// 	magicnet.step();
	// }, 0);

	
}