(function() {
	'use strict';

	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	// configurable settings
	var lineWidth = 3;
	
	// internal state
	var isDrawing = false;
	var lastX, lastY;

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
		canvas.width = document.documentElement.clientWidth / 2;
		canvas.height = document.documentElement.clientHeight / 2;
		ctx.putImageData(oldImage, 0, 0);
		ctx.lineWidth = lineWidth;
	}
	//window.addEventListener('resize', buffer(resizeCanvas));
	
	function ipaTouchmove(event) {
		var x = event.layerX || event.offsetX;
		var y = event.layerY || event.offsetY;

		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(x, y);
		ctx.closePath();
		ctx.stroke();
		
		lastX = x;
		lastY = y;
		event.stopPropagation();
	}
	var bufferTouchmove = buffer(ipaTouchmove);

	function ipaTouchstart(event) {
		lastX = event.layerX || event.offsetX;
		lastY = event.layerY || event.offsetY;

		canvas.addEventListener('touchmove', bufferTouchmove);
		canvas.addEventListener('mousemove', bufferTouchmove);
		event.stopPropagation();
	}
	function ipaTouchend(event) {
		canvas.removeEventListener('mousemove', bufferTouchmove);
		event.stopPropagation();
	}

	canvas.addEventListener('touchstart', ipaTouchstart);
	canvas.addEventListener('mousedown', ipaTouchstart);
	
	window.addEventListener('touchend', ipaTouchend);
	window.addEventListener('mouseup', ipaTouchend);
	

	// initialize state
	canvas.className = 'ipa-input';
	document.body.appendChild(canvas);
	resizeCanvas();

})();
