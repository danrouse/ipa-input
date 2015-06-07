var ipa = ipa || {};

(function(global) {
	'use strict';

	var glyphs = global.glyphs.symbols;

	function IPACanvas(params) {
		var canvas = this.canvas = document.createElement('canvas');
		var ctx = this.ctx = this.canvas.getContext('2d');
		var strokeWidth = this.strokeWidth = 10;

		var points = this.points = [];
		var strokes = this.strokes = [];

		for(var key in params) {
			this[key] = params[key];
		}

		// private
		var width, height;
		var lastX, lastY;

		// buffer event processing for performance
		var frameBuffer = {};
		function buffer(fn) {
			return function(event) {
				frameBuffer[event.type] = [fn, event];
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

		// Canvas drawing
		function onTouchmove(event) {
			var x = event.layerX || event.offsetX;
			var y = event.layerY || event.offsetY;
			if(!x && !y) {
				x = event.touches[0].clientX;
				y = event.touches[0].clientY;
			}
			x = Math.round(x);
			y = Math.round(y);

			// bresenham's line drawing algorithm
			var x1 = x;
			var y1 = y;
			var x2 = Math.round(lastX) || 0;
			var y2 = Math.round(lastY) || 0;
			var dx = x1 - x2;
			var dy = y1 - y2;
			var m = dx / dy;
			var adx = Math.abs(dx);
			var ady = Math.abs(dy);
			var sx = (x1 < x2) ? 1 : -1;
			var sy = (y1 < y2) ? 1 : -1;
			var err = adx - ady;

			// detect overlap
			//points.push([x, y]);			

			ctx.fillRect(x - (strokeWidth / 2), y - (strokeWidth / 2), strokeWidth, strokeWidth);
			while(!(x1 === x2 && y1 === y2)) {
				var e2 = err << 1;
				if(e2 > -ady) {
					err -= ady;
					x1 += sx;
				} else if(e2 < adx) {
					err += adx;
					y1 += sy;
				}

				// var oldpx = ctx.getImageData(x1 + (dx ? (-sx * (2 + (strokeWidth / 2))) : 0), y1 + (dy ? (-sy * (2 + (strokeWidth / 2))) : 0), 1, 1).data[3];
				// if(oldpx) {
				// 	console.log('drawing over', m, dx, dy);
				// 	ctx.fillStyle = '#ff0000';
				// } else {
				// 	ctx.fillStyle = '#000000';
				// }
				//ctx.fillStyle = '#000000';
				ctx.fillRect(x1 - (strokeWidth / 2), y1 - (strokeWidth / 2), strokeWidth, strokeWidth);
				//ctx.fillStyle = '#ff0000';
				//ctx.fillRect(x1 + (dx ? (-sx * (2 + (strokeWidth / 2))) : 0), y1 + (dy ? (-sy * (2 + (strokeWidth / 2))) : 0), 2, 2);
			}
			
			lastX = x;
			lastY = y;

			event.stopPropagation();
			event.preventDefault();
		}
		var bufferedOnTouchmove = buffer(onTouchmove);

		function onTouchend(event) {
			window.removeEventListener('touch', bufferedOnTouchmove);
			window.removeEventListener('mousemove', bufferedOnTouchmove);
			window.removeEventListener('touchend', onTouchend);
			window.removeEventListener('mouseup', onTouchend);
			event.stopPropagation();
			event.preventDefault();
		}
		function onTouchstart(event) {
			lastX = event.layerX || event.offsetX;
			lastY = event.layerY || event.offsetY;
			if(!lastX && !lastY) {
				lastX = event.touches[0].clientX;
				lastY = event.touches[0].clientY;
			}

			if(event.target === canvas) {
				window.addEventListener('touchmove', bufferedOnTouchmove);
				window.addEventListener('mousemove', bufferedOnTouchmove);
				window.addEventListener('touchend', onTouchend);
				window.addEventListener('mouseup', onTouchend);

				event.stopPropagation();
				event.preventDefault();

				strokes.push([lastX, lastY]);

				onTouchmove(event);
			}
		}
		canvas.addEventListener('touchstart', onTouchstart);
		canvas.addEventListener('mousedown', onTouchstart);

		// scale and redraw on resize
		function onResize() {
			var oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
			width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
			ctx.putImageData(oldImage, 0, 0);
			ctx.lineWidth = strokeWidth;
		}
		window.addEventListener('resize', buffer(onResize));

		// public UI
		this.reset = function() {
			ctx.clearRect(0, 0, width, height);
			points = this.points = [];
			strokes = this.strokes = [];

			lastX = lastY = null;
		};

		// Converts the canvas into a cropped grayscale sample.
		// The image will be resized if dstWidth and dstHeight are provided.
		// returns { data: [pixels], canvas: DOMElement }
		this.getSample = function(dstWidth, dstHeight) {
			var src = ctx.getImageData(0, 0, width, height);
			var dst = document.createElement('canvas');
			// dst.width = dst.height = tplSize;
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
			console.log(x1, x2, y1, y2);

			if(typeof x1 === 'undefined') {
				return false;
			}

			// find larger dimension and center a square over it
			// var diff, off, excess;
			// if(x2 - x1 > y2 - y1) {
			// 	diff = (x2 - x1) - (y2 - y1);
			// 	off = diff / 2;
			// 	if(y1 < off) {
			// 		excess = off - y1;
			// 		y1 = 0;
			// 		y2 += off + excess;
			// 	} else if(y2 + off > width) {
			// 		excess = (y2 + off) - width;
			// 		y1 -= diff + excess;
			// 		y2 = width;
			// 	} else {
			// 		y1 -= diff;
			// 		y2 += diff;
			// 	}
			// } else {
			// 	diff = (y2 - y1) - (x2 - x1);
			// 	if(x1 < off) {
			// 		excess = off - x1;
			// 		x1 = 0;
			// 		x2 += off + excess;
			// 	} else if(x2 + off > height) {
			// 		excess = (x2 + off) - height;
			// 		x1 -= diff + excess;
			// 		x2 = height;
			// 	} else {
			// 		x1 -= diff;
			// 		x2 += diff;
			// 	}
			// }

			// crop to bounds of drawn character
			var srcWidth = x2 - x1;
			var srcHeight = y2 - y1;
			// resize so stroke is 1px wide
			dstWidth = Math.ceil((dstWidth || srcWidth) / strokeWidth);
			dstHeight = Math.ceil((dstHeight || srcHeight) / strokeWidth);
			dst.width = dstWidth;
			dst.height = dstHeight;
			dstCtx.drawImage(canvas, x1, y1, srcWidth, srcHeight, 0, 0, dstWidth, dstHeight);

			var im = dstCtx.getImageData(0, 0, dstWidth, dstHeight);

			if(im) {
				// convert RGBA to grayscale and count black pixels
				// all black or white image returns false
				var imData = [];
				var numBlack = 0;
				for(var i = 0; i < im.data.length; i += 4) {
					imData.push(im.data[i + 3] > 0 ? 1 : 0);
					numBlack += (im.data[i + 3] > 0 ? 1 : 0);
				}

				if(numBlack > 0 && numBlack < imData.length) {
					return {
						image: imData,
						data: { points: points, strokes: strokes },
						canvas: dst
					};
				}
			}

			return false;
		};

		canvas.className = 'ipa-input';
		onResize();
		document.body.appendChild(canvas);
	}
	
	function IPATrainingUI(ipaCanvas, mode) {
		function createElem(tag, id, className, root) {
			var elem = document.createElement(tag);
			if(id) { elem.id = id; }
			if(className || id) { elem.className = className || id; }

			root = root || document.body;
			root.appendChild(elem);
			return elem;
		}

		mode = mode || 'online';

		var elemContainer = createElem('div', 'training');
		var elemGlyphContainer = createElem('div', null, 'training-glyph', elemContainer);
		var elemGlyph = createElem('h1', 'training-glyph', 'training-glyph-cur', elemGlyphContainer);
		var elemSamples = createElem('div', 'training-glyph-samples', false, elemGlyphContainer);
		var elemDesc = createElem('h2', 'training-desc', false, elemContainer);
		var elemButtons = createElem('div', 'training-buttons', false, elemContainer);
		var elemLen = createElem('p', 'training-json-len', false, elemContainer);		

		function createButton(text, listener, parent) {
			var btn = createElem('button', null, 'training-button', parent || elemButtons);
			btn.innerText = text;
			btn.addEventListener('click', listener);
			return btn;
		}

		var curGlyph = 0;
		var dataset = {
			samples: [],
			responses: []
		};

		function saveSample() {
			var sample = ipaCanvas.getSample();

			// don't continue if sample is blank
			if(sample) {
				// perform an extremely inefficient search against the existing dataset
				// prevents dupes from saving
				var matches = false;
				for(var i = 0; i < dataset.samples.length - 1; i++) {
					var sampleStr = JSON.stringify(dataset.samples[i]);
					if(sampleStr === JSON.stringify(sample.image)) {
						matches = true;
						break;
					}
				}

				if(!matches) {
					if(mode === 'local-file') {
						var link = document.createElement('a');
						link.href = sample.canvas.toDataURL();
						link.download = 'ipa-' + glyphs[curGlyph].glyph + '-' + Date.now() + '.png';
						link.click();
					} else if(mode === 'online') {
						var xhr = new XMLHttpRequest();
						xhr.open('POST', window.location, true);
						xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
						xhr.send(JSON.stringify({
							image: sample.canvas.toDataURL(),
							glyph: glyphs[curGlyph].glyph,
							data: sample.data
						}));
					}

					dataset.samples.push(sample.image);
					dataset.responses.push(curGlyph);

					sample.canvas.dataset.i = dataset.samples.length - 1;
					sample.canvas.addEventListener('click', function() {
						dataset.samples.splice(this.dataset.i, 1);
						dataset.responses.splice(this.dataset.i, 1);
						this.parentNode.removeChild(this);
					});
					glyphs[curGlyph].samples.push(sample.canvas);
				}
			}
		}

		function step(nextGlyph) {
			nextGlyph = Math.min(Math.max(nextGlyph, 0), glyphs.length);

			elemGlyph.innerHTML = glyphs[nextGlyph].glyph;
			elemDesc.innerHTML = glyphs[nextGlyph].name;
			elemLen.innerHTML = dataset.samples.length + ' samples, ' + Math.round(JSON.stringify(dataset).length / 1024, 2) + 'kB';
			elemSamples.innerHTML = '';
			for(var g in glyphs[nextGlyph].samples) {
				elemSamples.appendChild(glyphs[nextGlyph].samples[g]);
			}

			curGlyph = nextGlyph;
			ipaCanvas.reset();
		}
		step(Math.floor(Math.random() * (glyphs.length - 1)));

		function undo() {
			dataset.samples.pop();
			dataset.responses.pop();
			ipaCanvas.reset();
			if(mode === 'online') {
				var xhr = new XMLHttpRequest();
				xhr.open('DELETE', window.location, true);
				xhr.send();
			}
		}

		createButton('Clear', ipaCanvas.reset);
		createButton('Save', function() {
			saveSample();
			step(Math.floor(Math.random() * (glyphs.length - 1)));
		});
		createButton('Oops', undo);

		return {
			dataset: dataset
		};

		/*
		function save() {
			var json = JSON.stringify(training);
			var link = document.createElement('a');
			link.href = 'data:text/plain;charset=utf-8,' + window.encodeURIComponent(json);
			link.download = 'ipa-training.json';
			link.click();
		}

		function trainFromFont(font, size) {
			var oldGlyph = curGlyph;
			for(var i = 0; i < glyphs.length; i++) {
				curGlyph = i;
				var glyph = glyphs[i].glyph;
				var glyphSize = ctx.measureText(glyph);

				size = (size || 100) + 'px';
				ctx.font = size + ' ' + font;
				ctx.fillText(glyph, (canvas.width / 2) - (glyphSize.width / 2), canvas.height / 2 + 50);
				//ctx.rotate((Math.random() - 0.5) * Math.PI);
				train(i + 1, true);
			}
			train(oldGlyph);
		}
		createButton('\u2190', function() { train(curGlyph - 1); });
		createButton('\u2192', function() { train(curGlyph + 1); });
		createButton('\u293a', undoTraining, elemButtons);
		createButton('\ud83d\udcbe', saveTraining, elemButtons);
		createButton('\ud83d\uddc1', function() {
			var font = window.prompt('Please enter a font name:', 'Charis SIL');
			if(font) { trainFromFont(font); }
		}, elemButtons);
		*/
	}

	global.IPACanvas = IPACanvas;
	global.IPATrainingUI = IPATrainingUI;
})(ipa);

(function(lib) {
	'use strict';
	if(typeof module === 'undefined' || typeof module.exports === 'undefined') {
		window.ipa = lib;
	} else {
		module.exports = lib;
	}
})(ipa);
