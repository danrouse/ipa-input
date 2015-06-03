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

	// buffer event processing
	var frameBuffer = [];
	function buffer(fn) {
		return function(event) {
			frameBuffer.push([fn, event]);
		};
	}
	function frame() {
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

		// bresenham's line drawing algorithm
		var x1 = x;
		var y1 = y;
		var x2 = lastX || 0;
		var y2 = lastY || 0;
		var dx = Math.abs(x1 - x2);
		var dy = Math.abs(y1 - y2);
		var sx = (x1 < x2) ? 1 : -1;
		var sy = (y1 < y2) ? 1 : -1;
		var err = dx - dy;
		ctx.fillRect(x - (lineWidth / 2), y - (lineWidth / 2), lineWidth, lineWidth);
		while(!(x1 === x2 && y1 === y2)) {
			var e2 = err << 1;
			if(e2 > -dy) {
				err -= dy;
				x1 += sx;
			} else if(e2 < dx) {
				err += dx;
				y1 += sy;
			}
			ctx.fillRect(x1 - (lineWidth / 2), y1 - (lineWidth / 2), lineWidth, lineWidth);
		}
		
		lastX = x;
		lastY = y;

		event.stopPropagation();
		event.preventDefault();
	}
	var bufferTouchmove = buffer(ipaTouchmove);

	function ipaTouchend(event) {
		window.removeEventListener('touch', bufferTouchmove);
		window.removeEventListener('mousemove', bufferTouchmove);
		window.removeEventListener('touchend', ipaTouchend);
		window.removeEventListener('mouseup', ipaTouchend);
		event.stopPropagation();
		event.preventDefault();
	}
	function ipaTouchstart(event) {
		lastX = event.layerX || event.offsetX;
		lastY = event.layerY || event.offsetY;
		if(!lastX && !lastY) {
			lastX = event.touches[0].clientX;
			lastY = event.touches[0].clientY;
		}

		if(event.target === canvas) {
			window.addEventListener('touchmove', bufferTouchmove);
			window.addEventListener('mousemove', bufferTouchmove);
			window.addEventListener('touchend', ipaTouchend);
			window.addEventListener('mouseup', ipaTouchend);

			event.stopPropagation();
			event.preventDefault();
		}
	}
	canvas.addEventListener('touchstart', ipaTouchstart);
	canvas.addEventListener('mousedown', ipaTouchstart);
	
	function resetCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	// Image processing
	function generateSample() {
		//ctx.rotate((Math.random() - 0.5) * 0.25);
		var src = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var dst = document.createElement('canvas');
		dst.width = dst.height = tplSize;
		var dstCtx = dst.getContext('2d');

		var x1, x2, y1, y2;
		for(var y = 0; y < src.height; ++y) {
			for(var x = 0; x < src.width; ++x) {
				var idx = (y * src.width + x) * 4;
				var px = src.data[idx + 3];
				if(px) {
					if(!x1 || x < x1) { x1 = x; }
					if(!x2 || x > x2) { x2 = x; }
					if(!y1 || y < y1) { y1 = y; }
					if(!y2 || y > y2) { y2 = y; }
				}
			}
		}

		if(typeof x1 === 'undefined') {
			return false;
		}

		// crop and resize
		dstCtx.drawImage(canvas, x1, y1, x2 - x1, y2 - y1, 0, 0, tplSize, tplSize);
		var im = dstCtx.getImageData(0, 0, tplSize, tplSize);

		if(im) {
			var imData = [];
			var numBlack = 0;
			for(var i = 0; i < im.data.length; i += 4) {
				imData.push(im.data[i + 3] > 0 ? 1 : 0);
				numBlack += (im.data[i + 3] > 0 ? 1 : 0);
			}

			if(numBlack > 0 && numBlack < imData.length) {
				return { data: imData, canvas: dst };
			}
		}

		return false;
	}

	function initTrainingUI() {
		function createElem(tag, id, className, root) {
			var elem = document.createElement(tag);
			elem.id = id;
			elem.className = className || id;

			root = root || document.body;
			root.appendChild(elem);
			return elem;
		}
		var elemContainer = createElem('div', 'training');
		var elemGlyphContainer = createElem('div', null, 'training-glyph', elemContainer);
		var elemGlyph = createElem('h1', 'training-glyph', 'training-glyph-cur', elemGlyphContainer);
		var elemSamples = createElem('div', 'training-glyph-samples', false, elemGlyphContainer);
		var elemDesc = createElem('h2', 'training-desc', false, elemContainer);
		var elemButtons = createElem('div', 'training-buttons', false, elemContainer);
		var elemLen = createElem('p', 'training-json-len', false, elemContainer);		

		var curGlyph = 0;
		var training = {
			samples: [],
			responses: []
		};

		function train(next, save) {
			if(next < 0 || next >= global.glyphs.length) {
				next = curGlyph;
			}

			// save current glyph
			if(save) {
				var sample = generateSample();

				if(sample) {
					var matches = false;
					for(var i = 0; i < training.samples.length - 1; i++) {
						var sampleStr = JSON.stringify(training.samples[i]);
						if(sampleStr === JSON.stringify(sample.data)) {
							matches = true;
							break;
						}
					}

					if(!matches) {
						training.samples.push(sample.data);
						training.responses.push(curGlyph);

						sample.canvas.dataset.i = training.samples.length - 1;
						sample.canvas.addEventListener('click', function() {
							training.samples.splice(this.dataset.i, 1);
							training.responses.splice(this.dataset.i, 1);
							this.parentNode.removeChild(this);
						});
						global.glyphs[curGlyph].samples.push(sample.canvas);
						
						if(curGlyph === next) {
							elemSamples.appendChild(sample.canvas);
						}
					}
				}
			} else if(curGlyph !== next) {
				elemSamples.innerHTML = '';
				for(var g in global.glyphs[next].samples) {
					elemSamples.appendChild(global.glyphs[next].samples[g]);
				}
			}

			elemGlyph.innerHTML = global.glyphs[next].glyph;
			elemDesc.innerHTML = global.glyphs[next].name;
			var lenStr = training.samples.length + ' samples, ' + Math.round(JSON.stringify(training).length / 1024, 2) + 'kB';
			elemLen.innerHTML = lenStr;

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

		function trainFromFont(font, size) {
			var oldGlyph = curGlyph;
			for(var i = 0; i < global.glyphs.length; i++) {
				curGlyph = i;
				var glyph = global.glyphs[i].glyph;
				var glyphSize = ctx.measureText(glyph);

				size = (size || 100) + 'px';
				ctx.font = size + ' ' + font;
				ctx.fillText(glyph, (canvas.width / 2) - (glyphSize.width / 2), canvas.height / 2 + 50);
				//ctx.rotate((Math.random() - 0.5) * Math.PI);
				train(i + 1, true);
			}
			train(oldGlyph);
		}

		function createButton(text, listener) {
			var btn = document.createElement('button');
			btn.innerText = text;
			btn.addEventListener('click', listener);
			return elemButtons.appendChild(btn);
		}
		
		createButton('\ud83d\uddc1', function() {
			var font = window.prompt('Please enter a font name:', 'Charis SIL');
			if(font) { trainFromFont(font); }
		});
		createButton('\ud83d\uddf9', function() { train(curGlyph + 1, true); });
		createButton('\u2190', function() { train(curGlyph - 1); });
		createButton('\u2192', function() { train(curGlyph + 1); });		
		createButton('\u20e0', resetCanvas);
		createButton('\u293a', undoTraining);
		createButton('\ud83d\udcbe', saveTraining);

		train(0);

		return {
			train: train,
			trainFromFont: trainFromFont
		};
	}

	// initialize state
	canvas.className = 'ipa-input';
	document.body.appendChild(canvas);
	resizeCanvas();

	global.initTrainingUI = initTrainingUI;

	// var t = initTrainingUI();
	// t.trainFromFont('Charis SIL');
	// t.trainFromFont('Andika');
	// t.trainFromFont('Gentium Plus');
	// t.trainFromFont('Daniel');
	// t.trainFromFont('Comic Sans MS');
})(ipa);

(function(lib) {
	'use strict';
	if(typeof module === 'undefined' || typeof module.exports === 'undefined') {
		window.ipa = lib;
	} else {
		module.exports = lib;
	}
})(ipa);

ipa.initTrainingUI();
