var ipa = ipa || {};
(function(global) {
	'use strict';

	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	// configurable settings
	var lineWidth = 10;
	var tplSize = 28;
	
	// internal state
	var lastX, lastY;
	var minX, minY, maxX, maxY;

	// buffer event processing
	var frameBuffer = [];
	function buffer(fn) {
		return function(event) {
			frameBuffer.push([fn, event]);
		};
	}
	function frame(dt) {
		for(var i in frameBuffer) {
			frameBuffer[i][0](frameBuffer[i][1]);
			delete frameBuffer[i];
		}
		window.requestAnimationFrame(frame);
	}
	window.requestAnimationFrame(frame);

	function resizeCanvas() {
		var oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx.putImageData(oldImage, 0, 0);
		ctx.lineWidth = lineWidth;
	}
	window.addEventListener('resize', buffer(resizeCanvas));

	// Canvas drawing
	function ipaTouchmove(event) {
		var x = event.layerX || event.offsetX;
		var y = event.layerY || event.offsetY;
		if(!x && !y) {
			x = event.touches[0].clientX;
			y = event.touches[0].clientY;
		}

		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(x, y);
		ctx.closePath();
		ctx.stroke();
		
		lastX = x;
		lastY = y;

		if(!minX || x < minX) { minX = x; }
		if(!maxX || x > maxX) { maxX = x; }
		if(!minY || y < minY) { minY = y; }
		if(!maxY || y > maxY) { maxY = y; }
		event.stopPropagation();
		event.preventDefault();
	}
	var bufferTouchmove = buffer(ipaTouchmove);

	function ipaTouchstart(event) {
		lastX = event.layerX || event.offsetX;
		lastY = event.layerY || event.offsetY;

		window.addEventListener('touchmove', bufferTouchmove);
		window.addEventListener('mousemove', bufferTouchmove);
		event.stopPropagation();
		event.preventDefault();
	}
	function ipaTouchend(event) {
		window.removeEventListener('mousemove', bufferTouchmove);
		event.stopPropagation();
		event.preventDefault();
	}

	canvas.addEventListener('touchstart', ipaTouchstart);
	canvas.addEventListener('mousedown', ipaTouchstart);
	
	window.addEventListener('touchend', ipaTouchend);
	window.addEventListener('mouseup', ipaTouchend);

	function resetCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		minX = maxX = minY = maxY = 0;
	}
	
	// Image processing
	function processImage() {
		var src = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var dst = document.createElement('canvas');
		dst.width = dst.height = tplSize;
		var dstCtx = dst.getContext('2d');

		// crop and resize
		dstCtx.drawImage(canvas, minX, minY, maxX - minX, maxY - minY, 0, 0, tplSize, tplSize);
		
		return dstCtx.getImageData(0, 0, tplSize, tplSize);
	}

	// Training
	var curGlyph = 0;
	var training = {
		samples: [],
		responses: []
	};
	function train(next, save) {
		if(next < 0 || next > global.glyphs.length) {
			next = curGlyph;
		}

		// save current glyph
		var addedGlyph;
		if((minX !== maxX || minY !== maxY) && save) {
			var im = processImage();
			var imData = [];
			for(var px = 0; px < im.data.length; px += 4) {
				imData.push(im.data[px + 3] > 0 ? 1 : 0);
			}

			training.samples.push(imData);
			training.responses.push(curGlyph);

			var dst = document.createElement('canvas');
			dst.width = dst.height = tplSize;
			dst.dataset.i = training.samples.length - 1;
			var dstCtx = dst.getContext('2d');
			dstCtx.putImageData(im, 0, 0);
			dst.addEventListener('click', function() {
				training.samples.splice(this.dataset.i, 1);
				training.responses.splice(this.dataset.i, 1);
				this.parentNode.removeChild(this);
			});

			if(curGlyph === next) {
				document.getElementById('training-glyph-samples').appendChild(dst);
			}
			global.glyphs[curGlyph].samples.push(dst);
		}

		if(curGlyph !== next) {
			document.getElementById('training-glyph-samples').innerHTML = '';
			for(var g in global.glyphs[next].samples) {
				document.getElementById('training-glyph-samples').appendChild(global.glyphs[next].samples[g]);
			}
		}

		document.getElementById('training-glyph').innerHTML = global.glyphs[next].glyph;
		document.getElementById('training-desc').innerHTML = global.glyphs[next].name;
		var lenStr = training.samples.length + ' samples, ' + Math.round(JSON.stringify(training).length / 1024, 2) + 'kB';
		document.getElementById('training-json-len').innerHTML = lenStr;

		curGlyph = next;
		resetCanvas();
	}

	function undoTraining() {
		training.samples.pop();
		training.responses.pop();
		train(curGlyph);
	}

	function saveTraining() {
		var json = JSON.stringify(training);
		var link = document.createElement('a');
		link.href = 'data:text/plain;charset=utf-8,' + window.encodeURIComponent(json);
		link.download = 'ipa-training.json';
		link.click();
	}

	function createButton(text, listener) {
		var btn = document.createElement('button');
		btn.innerText = text;
		btn.addEventListener('click', listener);
		return document.getElementById('training-buttons').appendChild(btn);
	}
	
	createButton('Previous', function() { train(curGlyph - 1); });
	createButton('Repeat', function() { train(curGlyph, true); });
	createButton('Continue', function() { train(curGlyph + 1, true); });
	createButton('Skip', function() { train(curGlyph + 1); });
	createButton('Reset', resetCanvas);
	createButton('Undo', undoTraining);
	createButton('Export', saveTraining);

	// initialize state
	canvas.className = 'ipa-input';
	document.body.appendChild(canvas);
	resizeCanvas();
	train(0);
})(ipa);

(function(lib) {
	'use strict';
	if(typeof module === 'undefined' || typeof module.exports === 'undefined') {
		window.ipa = lib;
	} else {
		module.exports = lib;
	}
})(ipa);
