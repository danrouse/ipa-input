var ipa = ipa || {};

(function(global) {
	'use strict';
	var Glyph = function(glyph, name) {
		this.glyph = glyph;
		this.name = name || '';
		this.samples = [];
	};
	var glyphs = [
		new Glyph('a'), new Glyph('b'), new Glyph('c'), new Glyph('d'), new Glyph('e'), new Glyph('f'), new Glyph('g'), new Glyph('h'), new Glyph('i'), new Glyph('j'), new Glyph('k'), new Glyph('l'), new Glyph('m'), new Glyph('n'), new Glyph('o'), new Glyph('p'), new Glyph('q'), new Glyph('r'), new Glyph('s'), new Glyph('t'), new Glyph('u'), new Glyph('v'), new Glyph('w'), new Glyph('x'), new Glyph('y'), new Glyph('z'),
		new Glyph('\u0251', 'open back unrounded'),	// ɑ
		new Glyph('\u0250', 'open-mid schwa'),	// ɐ
		new Glyph('\u0252', 'open back rounded'),	// ɒ
		new Glyph('\u00E6', 'raised open front unrounded'),	// æ
		new Glyph('\u0253', 'vd bilabial implosive'),	// ɓ
		new Glyph('\u0299', 'vd bilabial trill'),	// ʙ
		new Glyph('\u03B2', 'vd bilabial fricative'),	// β
		new Glyph('\u0254', 'open-mid back rounded'),	// ɔ
		new Glyph('\u0255', 'vl alveolopalatal fricative'),	// ɕ
		new Glyph('\u00E7', 'vl palatal fricative'),	// ç
		new Glyph('\u0257', 'vd alveolar implosive'),	// ɗ
		new Glyph('\u0256', 'vd retroflex plosive'),	// ɖ
		new Glyph('\u00F0', 'vd dental fricative'),	// ð
		new Glyph('\u02A4', 'vd postalveolar affricate'),	// ʤ
		new Glyph('\u0259', 'schwa'),	// ə
		new Glyph('\u0258', 'close-mid schwa'),	// ɘ
		new Glyph('\u025A', 'rhotacized schwa'),	// ɚ
		new Glyph('\u025B', 'open-mid front unrounded'),	// ɛ
		new Glyph('\u025C', 'open-mid central'),	// ɜ
		new Glyph('\u025D', 'rhotacized open-mid central'),	// ɝ
		new Glyph('\u025E', 'open-mid central rounded'),	// ɞ
		new Glyph('\u025F', 'vd palatal plosive'),	// ɟ
		new Glyph('\u0284', 'vd palatal implosive'),	// ʄ
		new Glyph('\u0261', 'vd velar plosive'),	// ɡ
		new Glyph('\u0260', 'vd velar implosive'),	// ɠ
		new Glyph('\u0262', 'vd uvular plosive'),	// ɢ
		new Glyph('\u029B', 'vd uvular implosive'),	// ʛ
		new Glyph('\u0266', 'vd glottal fricative'),	// ɦ
		new Glyph('\u0267', 'vl multiple-place fricative'),	// ɧ
		new Glyph('\u0127', 'vl pharyngeal fricative'),	// ħ
		new Glyph('\u0265', 'labial-palatal approximant'),	// ɥ
		new Glyph('\u029C', 'vl epiglottal fricative'),	// ʜ
		new Glyph('\u0268', 'close central unrounded'),	// ɨ
		new Glyph('\u026A', 'lax close front unrounded'),	// ɪ
		new Glyph('\u029D', 'vd palatal fricative'),	// ʝ
		new Glyph('\u026D', 'vd retroflex lateral'),	// ɭ
		new Glyph('\u026C', 'vl alveolar lateral fricative'),	// ɬ
		new Glyph('\u026B', 'velarized vd alveolar lateral'),	// ɫ
		new Glyph('\u026E', 'vd alveolar lateral fricative'),	// ɮ
		new Glyph('\u029F', 'vd velar lateral'),	// ʟ
		new Glyph('\u0271', 'vd labiodental nasal'),	// ɱ
		new Glyph('\u026F', 'close back unrounded'),	// ɯ
		new Glyph('\u0270', 'velar approximant'),	// ɰ
		new Glyph('\u014B', 'vd velar nasal'),	// ŋ
		new Glyph('\u0273', 'vd retroflex nasal'),	// ɳ
		new Glyph('\u0272', 'vd palatal nasal'),	// ɲ
		new Glyph('\u0274', 'vd uvular nasal'),	// ɴ
		new Glyph('\u00F8', 'front close-mid rounded'),	// ø
		new Glyph('\u0275', 'rounded schwa'),	// ɵ
		new Glyph('\u0278', 'vl bilabial fricative'),	// ɸ
		new Glyph('\u03B8', 'vl dental fricative'),	// θ
		new Glyph('\u0153', 'front open-mid rounded'),	// œ
		new Glyph('\u0276', 'front open rounded'),	// ɶ
		new Glyph('\u0298', 'bilabial click'),	// ʘ
		new Glyph('\u0279', 'vd (post)alveolar approximant'),	// ɹ
		new Glyph('\u027A', 'vd alveolar lateral flap'),	// ɺ
		new Glyph('\u027E', 'vd alveolar tap'),	// ɾ
		new Glyph('\u027B', 'vd retroflex approximant'),	// ɻ
		new Glyph('\u0280', 'vd uvular trill'),	// ʀ
		new Glyph('\u0281', 'vd uvular fricative'),	// ʁ
		new Glyph('\u027D', 'vd retroflex flap'),	// ɽ
		new Glyph('\u0282', 'vl retroflex fricative'),	// ʂ
		new Glyph('\u0283', 'vl postalveolar fricative'),	// ʃ
		new Glyph('\u0288', 'vl retroflex plosive'),	// ʈ
		new Glyph('\u02A7', 'vl postalveolar affricate'),	// ʧ
		new Glyph('\u0289', 'close central rounded'),	// ʉ
		new Glyph('\u028A', 'lax close back rounded'),	// ʊ
		new Glyph('\u028B', 'vd labiodental approximant'),	// ʋ
		new Glyph('\u2C71', 'voiced labiodental flap'),	// ⱱ
		new Glyph('\u028C', 'open-mid back unrounded'),	// ʌ
		new Glyph('\u0263', 'vd velar fricative'),	// ɣ
		new Glyph('\u0264', 'close-mid back unrounded'),	// ɤ
		new Glyph('\u028D', 'vl labial-velar fricative'),	// ʍ
		new Glyph('\u03C7', 'vl uvular fricative'),	// χ
		new Glyph('\u028E', 'vd palatal lateral'),	// ʎ
		new Glyph('\u028F', 'lax close front rounded'),	// ʏ
		new Glyph('\u0291', 'vd alveolopalatal fricative'),	// ʑ
		new Glyph('\u0290', 'vd retroflex fricative'),	// ʐ
		new Glyph('\u0292', 'vd postalveolar fricative'),	// ʒ
		new Glyph('\u0294', 'glottal plosive'),	// ʔ
		new Glyph('\u02A1', 'vd epiglottal plosive'),	// ʡ
		new Glyph('\u0295', 'vd pharyngeal fricative'),	// ʕ
		new Glyph('\u02A2', 'vd epiglottal fricative'),	// ʢ
		new Glyph('\u01C0', 'dental click'),	// ǀ
		new Glyph('\u01C1', 'alveolar lateral click'),	// ǁ
		new Glyph('\u01C2', 'alveolar click'),	// ǂ
		new Glyph('\u01C3', 'retroflex click')	// ǃ
	];

	global.glyphs = glyphs;
})(ipa);

(function(lib) {
	'use strict';
	if(typeof module === 'undefined' || typeof module.exports === 'undefined') {
		window.ipa = lib;
	} else {
		module.exports = lib;
	}
})(ipa);
