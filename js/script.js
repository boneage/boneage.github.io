/*global document, console, $, Sly, Clipboard */
/*jshint globalstrict: true*/
"use strict";

var undef = '***',
	boneage = {
		male: {hint: {}},
		female: {hint: {}}
	},
	pt = {sex: undef},
	ref = {
		male: {
			ages: [8,10,12,14,16,18,20,24,28,30,36,42,48,54,60,66,72,84,96,108,120,132,144,156,168,180,192,204,216],
			BFages: [12,18,24,30,36,42,48,54,60,66,72,84,96,108,120,132,144,156,168,180,192,204],
			BFstdevs: [2.1,2.7,4,5.4,6,6.6,7,7.8,8.4,9.1,9.3,10.1,10.8,11,11.4,10.5,10.4,11.1,12,14,15,15.4]
			// BFstdevs: [0.69,1.13,1.43,1.97,3.52,3.92,4.52,5.08,5.4,6.66,8.36,8.79,9.17,8.91,9.1,9,9.79,10.09,10.38,10.44,10.72,11.32,12.86,13.05]
		},
		female: {
			ages: [8,10,12,14,16,18,20,24,28,30,36,42,48,54,60,66,72,84,96,108,120,132,144,156,168,180,192,204,216],
			BFages: [12,18,24,30,36,42,48,54,60,66,72,84,96,108,120,132,144,156,168,180,192,204],
			BFstdevs: [2.7,3.4,4,4.8,5.6,5.5,7.2,8,8.6,8.9,9,8.3,8.8,9.3,10.8,12.3,14,14.6,12.6,11.2,15,15.4]
			// BFstdevs: [0.72,1.16,1.36,1.77,3.49,4.64,5.37,5.97,7.48,8.98,10.73,11.65,10.23,9.64,10.23,10.74,11.73,11.94,10.24,10.67,11.3,9.23,7.31]
		},
		range: {}
	},
	SlyCarousel = {},
	dp = {};

$(document).ready(function() {

	// DATE PICKER CAROUSEL
	(function datepickerInit() {
		var config = {
			years: {
				min: new Date().getFullYear() - 25,
				max: new Date().getFullYear()
			},
			// years: 6, // alternative for last 6 years from now
			// startAt: {
			// 	year: 2014,
			// 	month: 0,	// starting at 0
			// 	day: 0		// starting at 0
			// }
			// startAt: null // alternative for starting at now
		};

		// function to retrieve the selected date (try it in console)
		// selected();        // return the whole selection as a Date object
		// selected('year');  // selected year
		// selected('month'); // month, starting at 0
		// selected('day');   // day, starting at 0

		// DATE PICKER IMPLEMENTATION
		var $picker = $('.date-picker');
		var d = new Date();
		var options = {
			itemNav: 'forceCentered',
			smart: 1,
			activateMiddle: 1,
			activateOn: 'click',
			mouseDragging: 1,
			touchDragging: 1,
			releaseSwing: 1,
			startAt: 0,
			scrollBy: 1,
			speed: 100,
			elasticBounds: 1,
			easing: 'swing'
		};

		// return selected date
		dp.selected = function (type) {
			switch (type) {
				case 'year':
					return $(dp.year.items[dp.year.rel.activeItem].el).data('year') | 0;
				case 'month':
					return dp.month.rel.activeItem;
				case 'day':
					return dp.day.rel.activeItem;
			}
			return new Date(dp.selected('year'), dp.selected('month'), dp.selected('day') + 1);
		};

		// MONTH
		var $month = $picker.find('.month');
		dp.month = new Sly($month, options);

		// populate with months
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		var shortMonths = [1, 3, 5, 8, 10];
		$month.find('ul').append(months.map(dataLI('month')).join(''));

		// DAY
		var $day = $picker.find('.day');
		var $daySlidee = $day.find('ul');
		dp.day = new Sly($day, options);

		// YEAR
		var $year = $picker.find('.year');
		dp.year = new Sly($year, options);

		// populate with years
		var years = [];
		var simple = typeof config.years === 'number';
		var y = simple ? d.getFullYear() : config.years.min;
		// var y = simple ? d.getFullYear() : config.years.max;
		var max = simple ? d.getFullYear() : config.years.max;
		while (y < max + 1) years.push(y++);
		// var min = simple ? d.getFullYear() - config.years : config.years.min;
		// while (y > min) years.push(y--);
		$year.find('ul').append(years.map(dataLI('year')).join(''));

		// dynamic days
		dp.year.on('active', updateDays);
		dp.month.on('active', updateDays);

		dp.year.on('move', function() {
			boneage.preselectBoneAge();
			boneage.update();
		});
		dp.month.on('move', function() {
			boneage.preselectBoneAge();
			boneage.update();
		});
		dp.day.on('move', function() {
			boneage.preselectBoneAge();
			boneage.update();
		});

		function updateDays() {
			var month = dp.selected('month');
			var days = 31;
			if (~$.inArray(month, shortMonths)) {
				if (month === 1) days = isLeapYear(dp.selected('year')) ? 29 : 28;
				else days = 30;
			}
			var i = 0;
			var items = [];
			while (++i <= days) items.push(i);
			$daySlidee
				.empty()
				.html(items.map(dataLI('day', dp.selected('day'))).join(''));
			dp.day.reload();
		}

		// initiate sly isntances
		var initial = config.startAt;
		dp.year.init().activate($.inArray(initial ? initial.year : d.getFullYear(), years));
		dp.month.init().activate(initial ? initial.month : d.getMonth());
		dp.day.init().activate(initial ? initial.day : d.getDate() - 1);

		// HELPERS
		function isLeapYear(year) {
			return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
		}

		// returns an item to <li> string mapping function
		function dataLI(type, active) {
			return function (item, i) {
				return '<li ' +
					'data-' + type + '="' + item + '" ' +
					'class="' + (i === active ? 'active' : '') + '"' +
					'>' + item + '</li>';
			};
		}

		// expose selected function so you can try it out
		// window.selected = selected;
	})();

	// define hints for each bone age
	boneage.initHints = function() {
		var	bmh = boneage.male.hint, bfh = boneage.female.hint;

		bmh[8] =
			'Phalanges' + 
				'<ul><li>No epiphyseal ossification.</ul>' +
			'Metacarpals' +
				'<ul><li>There are now distinct individual differences in the shape and dimensions of the metacarpal shafts.</ul>' +
			'Carpals' +
				'<ul><li>Capitate and hamate ossification centers have increased in size and are closer together.' +
				'<li>The future long axis of the capitate is already established.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The flaring of the distal ends of the radius and ulna is quite pronounced.</ul>';
		bmh[10] =
			'Phalanges' + 
				'<ul><li>No epiphyseal ossification.</ul>' +
			'<b><u>Metacarpals</u></b>' +
				'<ul><li>The distal 1st metacarpal and bases of the 2nd-5th metacarpals have become relatively larger and more rounded.</ul>' +
			'Carpals' +
				'<ul><li>The surface of the capitate adjacent to the hamate has begun to flatten.</ul>';
		bmh[12] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The proximal phalanges have grown somewhat more in length than width and the distal tips of the 3rd and 4th appear to be slightly compressed laterally.</ul>' +
			'Carpals' +
				'<ul><li>Some further flattening has occurred in the hamate surface of the capitate.</ul>' +
			'Radius/Ulna' + 
				'<ul><li>Small distal radial epiphyseal ossification center may begin to appear.</ul>';
		bmh[14] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The sides of the distal ends of the 3rd and 4th proximal phalanges are now somewhat flattened.' +
				'<li>The trochlear surface of each phalanx will form later between and immediately distal to those flattened areas.' +
				'<li>The thumb distal phalanx ossification center may have an early appearance at this stage.' +
				'<li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ul>' +
			'Metacarpals' +
				'<ul><li>That portion of the base of the 2nd metacarpal which will later articulate with the capitate has begun to flatten.</ul>' +
			'Carpals' +
				'<ul><li>The flattening of the hamate surface of the capitate is now more pronounced, and the adjacent surface of the hamate has become somewhat less convex.' +
				'<li>The number and degree of maturation of the carpal bones is less useful at this stage.</ul>' +
			'Radius' +
				'<ul><li>A small ossification center is visible in the distal radial epiphysis.</ul>';
		bmh[16] = 
			'<b><u>Phalanges and Metacarpals</u></b>' +
				'<ul><li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>';
		bmh[18] =
			'<b><u>Phalanges and Metacarpals</u></b>' +
				'<ul><li>The epiphyseal ossification centers become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Radius' +
				'<ul><li>The ulnar side of the radial epiphysis is pointed and its radial side is thicker and convex.</ul>' +
			'Carpals' +
				'<ul><li>The number and degree of maturation of the carpal bones are less useful indicators at this stage.</ul>';
		bmh[20] =
			'<b><u>Phalanges and Metacarpals</u></b>' +
				'<ul><li>The epiphyseal ossification centers become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Radius' +
				'<ul><li>The ulnar side of the radial epiphysis is pointed and its radial side is thicker and convex.</ul>' +
			'Carpals' +
				'<ul><li>The number and degree of maturation of the carpal bones are less useful indicators at this stage.</ul>';		
		bmh[24] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Ossification has now begun in the epiphysis of the 5th proximal phalanx, and <b>3rd and 4th middle and distal phalanges</b>.' +
				'<li>The epiphyses of the 2nd-5th proximal phalanges are now disc-shaped and their margins are smooth.' +
				'<li>The epiphyseal ossification centers become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Carpals' +
				'<ul><li>The number and degree of maturation of the carpal bones are less useful indicators at this stage.</ul>';
		bmh[28] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Ossification has now begun in the epiphysis of the 5th proximal phalanx, and <b>3rd and 4th middle and distal phalanges</b>.' +
				'<li>The epiphyses of the 2nd-5th proximal phalanges are now disc-shaped and their margins are smooth.' +
				'<li>The epiphyseal ossification centers become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Carpals' +
				'<ul><li>The number and degree of maturation of the carpal bones are less useful indicators at this stage.</ul>';
		bmh[30] =
			'<b><u>Phalanges</u></b> and Metacarpals' +
				'<ul><li>Ossification centers are starting to become visible in the proximal phalanx of the thumb, <b>2nd middle phalanx</b>, <b>2nd and 5th distal phalanges</b>, and 1st metacarpal.' +
				'<li>The widths of the epiphyses of the 2nd-5th proximal phalanges now equals or exceeds half the width of the adjacent margins of their shafts.' +
				'<li>The epiphysis of the distal phalanx of the thumb has flattened to conform to the shape of the adjacent surface of its shaft.' +
				'<li>The epiphyseal ossification centers become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Carpals' +
				'<ul><li>The number and degree of maturation of the carpal bones are less useful indicators at this stage.</ul>';
		bmh[36] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphyses of the 2nd-4th middle phalanges have widened transversely to form disc-like structures which are thickest in the middle and taper toward each end. Their margins are smooth.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-5th metacarpals have enlarged and have become more uniformly rounded and their margins somewhat smoother.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The volar and dorsal surfaces of the radial epiphysis can now be distinguished. The volar margin is visible as a rather thick white line. Distally the thin dorsal margin of the epiphysis projects beyond the volar margin.</ul>';
		bmh[42] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphyses of the 2nd and 5th distal phalanges are now clearly visible.' +
				'<li>The corresponding epiphyses of the 3rd and 4th fingers are now disc-shaped and their margins are smooth.</ul>' +
			'Metacarpals' +
				'<ul><li>The surface of the base of the 2nd metacarpal, which will later articulate with the trapezoid, has begun to flatten.' +
				'<li>The trapezoid facet makes a wide angle with the smaller capitate facet, which forms the remainder of the proximal border of the shaft.</li>' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The lunate is much advanced in its development as compared with the other bones.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bmh[48] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>Ossification centers are now present in all of the phalangeal epiphyses.</li>' +
				'<li>The epiphyses of the 2nd and 3rd proximal phalanges are now somewhat wedge-shaped, tapering toward their ulnar ends.</li></ul>';
		bmh[54] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The articular surfaces of the 2nd and 3rd proximal phalangeal epiphyses have become slightly concave as they begin to shape to the heads of the corresponding metacarpals.' +
				'<li>The proximal phalanx of the thumb has an epiphysis which has not yet completely coalesced to form a single nodule.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-4th metacarpals now show a comparatively flattened ulnar side and a more rounded distal margin.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The ossification center of the trapezium is now a small, rounded nodule with fairly smooth margins.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The distal margin of the ulnar tip of the radial epiphysis, which will subsequently articulate with the lunate, has flattened slightly.</ul>';
		bmh[60] = bmh[54];
		bmh[66] = bmh[60];
		bmh[72] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphyses of the proximal phalanges are not yet as wide as the adjacent borders of their shafts.' +
				'<li>The future articular surfaces of the proximal epiphyses of the 4th and 5th fingers are now slightly concave.</ul>' +
			'Metacarpals' +
				'<ul><li>The base of the 2nd metacarpal is now distinctly indented in the region which will later articulate with the trapezoid.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The margins of the capitate and hamate now show beginning regional differentiation.' +
				'<li>The surface of the trapezium adjacent to the epiphysis of the 1st metacarpal has begun to flatten.' +
				'<li>The triquetrum has become more elongated, its ulnar margin somewhat less convex, and its hamate and lunate margins further flattened.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The part of the radial epiphysis from which the styloid process develops is beginning to enlarge.</ul>';
		bmh[84] =
			'<b><u>Phalanges</u></b>' +	
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.</ul>' +
			'Metacarpals' +
				'<ul><li>The proximal margin of the epiphysis of the 1st metacarpal is distinctly flattened.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The hamate surface of the capitate is now slightly concave, and the adjacent surface of the hamate has a corresponding convexity.' +
				'<li>The metacarpal margin of the hamate is now distinctly flattened.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Ulna' +
				'<ul><li>The proximal surface of the ulnar epiphysis appears flattened.</ul>';
		bmh[96] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphyses of the 2nd-5th distal phalanges are now as wide as their shafts.' +
				'<li>All middle phalangeal epiphyses and the epiphyses of the 2nd and 3rd distal phalanges have shaped further to the contours of the trochlear surfaces of the phalanges with which they articulate.</ul>' +
			'Metacarpals' +
				'<ul><li>The concavity in the base of the 2nd metacarpal adjacent to the trapezoid has become more pronounced. The ulnar portion of the base has begun to extend toward the capitate, with which it will later articulate.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.' +
			'Carpals' +
				'<ul><li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bmh[108] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The distal ends of the shafts of the 2nd and 3rd proximal phalanges have become slightly concave as their trochlear surfaces begin to differentiate.</ul>' +
			'Carpals' +
				'<ul><li>A process of the trapezium is beginning to project from its distal surface toward the base of the 2nd metacarpal.' +
				'<li>The two metacarpal articular surfaces of the capitate are beginning to differentiate.' +
				'<li>That portion of the distal margin of the hamate which will later articulate with the base of the 5th metacarpal can now be seen as a small but distinct projection.</ul>' +
			'Ulna' +
				'<ul><li>The epiphysis of the ulna has widened and thickened to form a bony plate. Its styloid process is beginning to appear.</ul>';
		bmh[120] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The more proximal part of the articular surface of the distal phalanx of the thumb is now slightly concave.' +
				'<li>The epiphyses of the 2nd-5th distal phalanges are all wider than their shafts.' +
				'<li>The epiphyses of the middle phalanges have thickened central portions, angular proximal surfaces, and relatively flattened distal margins.' +
				'<li>The epiphyses of the 2nd-5th proximal phalanges are not yet as wide as their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphysis of the 1st metacarpal has a slight indentation on its future articular surface.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>A slight indentation has appeared in the distal surface of the trapezium in the area of its future articulation with the 1st metacarpal. Its scaphoid surface has begun to flatten.' +
				'<li>The pisiform sesamoid appears.</li>' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bmh[132] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphysis of the 2nd proximal phalanx is now as wide as its shaft.' +
				'<li>The epiphyses of the 2nd-5th distal phalanges are beginning to conform in shape to that of the trochlear surfaces of their respective middle phalanges.' +
				'<li>The epiphysis of the proximal phalanx of the thumb now extends farther medially than does the corresponding border of its shaft.</ul>' +
			'Carpals' +
				'<ul><li>The articular facets of the distal row of carpals, particularly those of the capitate, have become progressively more sharply delimited.' +
				'<li>The volar and dorsal margins of the surface of the hamate which will articulate with the 4th metacarpal can now be seen.' +
				'<li>The distal tip of the hamulus of the hamate is just becoming discernible.' +
				'<li>The distal margin of the scaphoid is now somewhat flattened and its capitate articular surface distinctly concave.' +
				'<li>The future scaphoid and radial articular surfaces of the lunate now are beginning to be defined.' +
				'<li>The pisiform is now more distinct than in the preceding standard, its shadow being visible through and between the hamate and triquetrum.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bmh[144] = bmh[132];
		bmh[156] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphysis of the 3rd-5th proximal phalanges and of the 5th middle phalanx are now as wide as their shafts.' +
				'<li>The tips of the epiphyses of the 2nd-5th distal phalanges are bent slightly distally and the distal ends of the corresponding middle phalanges are now slightly concave.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-5th metacarpals are now as wide as the adjacent margins of their shafts.' +
				'<li>The radial epiphysis is now as wide as the adjacent margin of its shaft.' +
				'<li>The adductor pollicis sesamoid is now visible, just medial to the head of the 1st metacarpal.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The articular surface differentiation has progressed farther in the distal than proximal row of carpals, and is most marked in the carpal-metacarpal area.' +
				'<ul><li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bmh[168] =
			'<b><u>Phalanges</u></b> and Metacarpals' +
				'<ul><li>Epiphyseal fusion tends to occur in an orderly fashion:' +
					'<ol><li><b><u>distal phalanges</b></u> (farthest advanced in the thumb and 3rd finger)' +
					'<li>metacarpals' +
					'<li>proximal phalanges' +
					'<li>middle phalanges</ol>' +
				'<li>All of the proximal epiphyses have begun to cap their shafts.' +
				'<li>The sides of the epiphyses of the 2nd-5th metacarpals are now aligned closely with the sides of their shafts.' +
				'<li>The epiphyses of all phalanges of the 2nd-5th fingers have now begun to cap their shafts.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The distal end of the scaphoid flattens further and increases in size.' +
				'<li>The complete outline of the hamulus of the hamate can now be seen distinctly.' +
				'<li>The surface of the trapezium which articulates with the 1st metacarpal has become more concave, and the proximal borders of its dorsal and volar surfaces are now readily distinguishable.' +
				'<li>The articular surfaces of the trapezoid are now well-differentiated.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The ulnar articular surface of the radius is now flattened.' +
				'<li>Reciprocal shaping is under way in the radioulnar joint.</ul>';
		bmh[180] =
			'<b><u>Phalanges</u></b> and Metacarpals' +
				'<ul><li>Epiphyseal fusion tends to occur in an orderly fashion:' +
					'<ol><li><b><u>distal phalanges</b></u> (farthest advanced in the thumb and 3rd finger)' +
					'<li>metacarpals' +
					'<li>proximal phalanges' +
					'<li>middle phalanges</ol></ul>' +
			'Carpals' +
				'<ul><li>All carpals have now attained their early adult shape.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The epiphysis of the radius has capped its shaft.' +
				'<li>The epiphysis of the ulna is now as wide as its shaft and follows its contour closely.</ul>';
		bmh[192] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal fusion tends to occur in an orderly fashion:' +
					'<ol><li><b><u>distal phalanges</b></u> (farthest advanced in the thumb and 3rd finger)' +
					'<li>metacarpals' +
					'<li>proximal phalanges' +
					'<li>middle phalanges</ol></ul>' +
				'<li>Epiphyseal-diaphyseal fusion is well advanced in all the distal and proximal phalanges, and in the 2nd and 5th middle phalanges.' +
				'<li>Accessory sesamoids are usually visible radiographically at this stage.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-5th metacarpals have begun to fuse with their shafts.' +
				'<li>The epiphysis of the 1st metacarpal has fused with its shaft.</ul>' +
			'Carpals' +
				'<ul><li>A part of the outline of the tubercle of the scaphoid can now be seen.' +
				'<li>The flexor sesamoid can now be seen through the head of the first metacarpal, immediately lateral to the adductor sesamoid.</ul>';
		bmh[204] =
			'Phalanges' +
				'<ul><li>All of the phalangeal epiphyses have now fused with their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-5th metacarpals have now fused with their shafts.</ul>' +
			'<b><u>Radius/Ulna</u></b>' +
				'<ul><li>Fusion begins in the ulna before the radius.</ul>';
		bmh[216] = bmh[204];

		bfh[8] =
			'Phalanges' + 
				'<ul><li>No epiphyseal ossification.</ul>' +
			'Metacarpals' +
				'<ul><li>There are now distinct individual differences in the shape and dimensions of the metacarpal shafts.</li>' +
				'<li>The bases of the 3rd and 4th metacarpals are now distinctly rounded.</ul>' +
			'Carpals' +
				'<ul><li>The hamate surface of the capitate is beginning to flatten. The future long axis of the capitate is now evident.</ul>';
		bfh[10] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol></ul>' +
			'Metacarpals' +
				'<ul><li>The base of the 2nd metacarpal has begun to enlarge.</ul>' +
			'Carpals' +
				'<ul><li>The capitate is now larger and farther advanced in its development than the hamate.</ul>' +
			'Radius/Ulna' +
				'<ul><li>A small distal radial ossification center appears.</ul>';
		bfh[12] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ul>' +
			'Metacarpals' +
				'<ul><li>The capitate articular surface of the 2nd metacarpal has begun to flatten.' +
				'<li>The epiphyses of the 2nd and 3rd metacarpals and the epiphyses of the 2nd-4th proximal phalanges now contain small ossification centers.</ul>' +
			'Carpals' +
				'<ul><li>The hamate is now somewhat wedge-shaped, its proximal end being narrower than its distal end.</ul>' +
			'Radius' +
				'<ul><li>A flattened oval ossification center is now present in the distal radial epiphysis.</ul>';
		bfh[14] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ul>' +
				'<ul><li>Ossification in the epiphysis of the distal phalanx of the thumb has begun.</ul>' +
			'Metacarpals' +
				'<ul><li>Ossification has begun in the epiphysis of the 4th metacarpal.</ul>';
		bfh[16] = bfh[14];
		bfh[18] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The epiphyseal ossification centers start to become recognizable - middle finger first, 5th finger last, and generally in this order:' +
					'<ol><li>proximal phalanges' +
					'<li>metacarpals' + 
					'<li>middle phalanges' +
					'<li>distal phalanges.</ol>' +
				'<li>Ossification has begun in the epiphysis of the 5th proximal epiphysis.' +
				'<li>The epiphyses of the 2nd-5th proximal phalanges are now disc-shaped and their margins are fairly smooth.</ul>' +
			'Metacarpals' +
				'<ul><li>Ossification has begun in the epiphysis of the 5th metacarpal.</ul>';
		bfh[20] = bfh[18];
		bfh[24] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>Ossification has begun in the epiphyses of the 3rd-5th distal phalanges.' +
				'<li>The epiphyses of the 2nd-5th proximal phalanges are now more than half as wide as their shafts.' +
				'<li>Ossification has begun in the epiphysis of the proximal phalanx of the thumb.</ul>' +
			'Metacarpals' +
				'<ul><li>Ossification has begun in the epiphysis of the 1st metacarpal.' +
				'<li>The epiphyses of the 2nd-5th metacarpals are now rounded and their margins are smooth.' +
				'<li>The proximal margin of the epiphysis of the 2nd metacarpal has flattened slightly as it begins to conform to the shape of the adjacent surface of its shaft.</ul>' +
			'Carpals' +
				'<ul><li>The capitate surface of the hamate has flattened and its proximal end is distincly narrower than its distal end. Its triquetral surface has begun to flatten.' +
				'<li>Ossification has begun in the triquetrum.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The radial epiphysis now has a rounded lateral margin and a rather pointed ulnar tip.</ul>';
		bfh[28] = bfh[24];
		bfh[30] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The distal margin of the epiphysis of the distal phalanx of the thumb has flattened to conform to the shape of the adjacent surface of its shaft.' +
				'<li>The epiphyses of the 3rd and 4th distal phalanges are now disc-shaped.' +
				'<li>The epiphyses of the distal phalanx of the 2nd finger and middle phalanx of the 5th finger have small ossification centers.' +
				'<li>The epiphysis of the proximal phalanx of the thumb is disc-shaped and its margins are smooth. It is now more than half as wide as its shaft.</ul>' +
			'Metacarpals' +
				'<ul><li>The surface of the base of the 2nd metacarpal, which will later articulate with the trapezoid, has begun to flatten.' +
				'<li>The proximal surfaces of the epiphyses of the 3rd-5th metacarpals are now beginning to shape to their respective shafts.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The triquetral ossification center is rounded and its margins are fairly smooth.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The volar and dorsal surfaces of the radial epiphysis can now be distinguished. The volar margin is visible as a rather thick white line. Distally the thin dorsal margin of the epiphysis projects beyond the volar margin.</ul>';
		bfh[36] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphyses of the 2nd-4th middle phalanges are now slightly more than half as wide as their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>The epiphyses of the 2nd-5th metacarpals have enlarged and their proximal margins are flattened.' +
				'<li>The epiphysis of the 1st metacarpal is oval and its long axis is transverse.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The lunate is much advanced in its development as compared with the other bones. This ossification center is now rounded and its margins are smooth' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bfh[42] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The articular surfaces of the epiphyses of the 2nd and 3rd proximal phalanges have become slightly concave as they shape to the heads of the corresponding metacarpals.</ul>' +
			'Metacarpals' +
				'<ul><li>The ulnar, distal, and radial margins of the epiphyses of the 2nd and 3rd metacarpals are becoming dissimilar in shape as their joint surfaces begin to differentiate.' +
				'<li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>Some reciprocal shaping of the adjacent surfaces of the capitate and hamate is now apparent.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>The ulnar portion of the distal margin of the radial epiphysis flattens slightly as its lunate articular surface begins to differentiate.</ul>';
		bfh[48] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphyses of the 4th and 5th proximal phalanges are becoming slightly concave as they shape to the metacarpal heads.</ul>' +
			'Metacarpals' +
				'<ul><li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The trapezium ossification center is oval and its margins are smooth.' +
				'<li>A small indentation may now be visible in the lateral margin of the capitate.' +
				'<li>The capitate and radial surfaces of the lunate are rather flat.' +
				'<li>Ossification centers are now visible in the scaphoid and trapezoid.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
		bfh[54] = bfh[48];
		bfh[60] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphyses of the 3rd-5th distal phalanges are now as wide as their shafts.' +
				'<li>The epiphyses of the 2nd-4th middle phalanges are shaping to the contours of the trochlear surfaces of the proximal phalanges.</ul>' +
			'Metacarpals' +
				'<ul><li>The metacarpals are less reliable indicators of bone age at this stage of life.' +
				'<li>The radial, ulnar, and distal margins of the epiphyses of the 4th and 5th metacarpals are becoming dissimilar in shape as their joint surfaces begin to differentiate.</ul>' +
			'Carpals' +
				'<ul><li>The trapezoid ossification center is now rounded and its margins are fairly smooth.' +
				'<li>The surface of the trapezium which will later articulate with the 1st metacarpal has begun to flatten.' +
				'<li>The scaphoid ossification center is ovoid and its margins are still somewhat irregular.' +
				'<li>The dorsal and volar aspects of the capitate surface of the lunate are beginning to be distinguishable.' +
				'<li>The hamate surface of the triquetrum has begun to flatten, and its ulnar margin has become less convex.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Radius' +
				'<ul><li>That part of the radial epiphysis from which the styloid process develops is beginning to enlarge.</ul>';
		bfh[66] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphysis of the 3rd distal phalanx has shaped further to the contour of the trochlear surface of the middle phalanx.</ul>' +
			'Metacarpals' +
				'<ul><li>The metacarpals are less reliable indicators of bone age at this stage of life.</ul>' +
			'Carpals' +
				'<ul><li>The contiguous margins of the capitate and hamate now overlap.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
			'Radius' +
				'<ul><li>The relative enlargement of the lateral half of the radial epiphysis is now distinct.</ul>';
		bfh[72] = bfh[66];
		bfh[84] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' + 
				'<li>The epiphysis of the 5th middle phalanx is shaping to the contour of the trochlear surface of the proximal phalanx.</ul>' +
			'Metacarpals' +
				'<ul><li>The metacarpals are less reliable indicators of bone age at this stage of life.' +
				'<li>The base of the 2nd metacarpal adjacent to the trapezoid is now slightly concave.</ul>' +
			'Carpals' +
				'<ul><li>The portion of the proximal margin of the trapezium which will later articulate with the scaphoid is somewhat flattened.' +
				'<li>A similar flattening can be seen in the future capitate articular surface of the trapezoid.' +
				'<li>The capitate surface of the scaphoid is now slightly concave.' +
				'<li>As the triquetrum has elongated, its lunate surface has flattened slightly, and its distal end has become relatively narrower.' +
				'<li>The carpals are less reliable indicators of bone age at this stage of life.</ul>';
			'Radius/Ulna' +
				'<ul><li>The styloid process of the radius begins to form. Further modeling of the carpal articular surface of the radius has occurred.' +
				'<li>An ossification center is now present in the distal epiphysis of the ulna.</ul>';
		bfh[96] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The articular surface of the epiphysis of the distal phalanx of the thumb has flattened somewhat.' +
				'<li>The epiphyses of the 2nd-5th distal phalanges are shaping to the trochlear surfaces of the middle phalanges.' +
				'<li>The epiphysis of the proximal phalanx of the thumb now extends farther medially than does the corresponding border of its shaft.' +
				'<li>The articular surface on the distal ends of the shafts of the 2nd and 3rd proximal phalanges are now slightly concave.</ul>' +
			'Metacarpals' +
				'<ul><li>The portion of the base of the 2nd metacarpal which articulates with the trapezoid is now concave, and its capitate articular surface has begun to elongate.</ul>' +
			'Carpals' +
				'<ul><li>That portion of the trapezium which will later articulate with the bases of the 1st and 2nd metacarpals now forms a distinct, rounded projection. The middle of its surface which will later articulate with the 1st metacarpal is now concave.' +
				'<li>The most medial portion of the trapezium overlaps the lateral margin of the trapezoid.' +
				'<li>The scaphoid surface of the trapezoid has flattened.' +
				'<li>The outline of the volar margin of the capitate surface of the scaphoid is beginning to be discernible.' +
				'<li>The lunate has shaped further the adjacent surfaces of the capitate and radial epiphysis.' +
				'<li>The lunate surface of the triquetrum is now distinctly flattened.</ul>' +
			'Ulna' +
				'<ul><li>The ulnar epiphysis has increased in size, and its proximal margin has begun to shape to its shaft.</ul>';
		bfh[108] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphyses of the 2nd-4th proximal and middle phalanges are now as wide as their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>The proximal surfaces of the epiphyses of the 2nd-5th metacarpals are shaping further to the ends of their shafts.</ul>' +
			'Carpals' +
				'<ul><li>The metacarpal articular surfaces of the capitate are beginning to form.' +
				'<li>The portion of the hamate which will later articulate with the base of the 5th metacarpal has begun to elongate.' +
				'<li>The distal margin of the scaphoid has begun to flatten and its medial portion is elongating toward the capitate.' +
				'<li>The scaphoid and radial surfaces of the lunate are beginning to be defined.' +
				'<li>The ossification center of the pisiform can be seen volar to the triquetrum.</ul>' +
			'Ulna' +
				'<ul><li>The ulnar epiphysis has now flattened and widened to form a bony plate. Its distal margin si concave and there is a distinct styloid process.</ul>';
		bfh[120] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The developing trochlear surfaces on the distal ends of the 2nd-4th proximal phalanges now have shallow central indentations.' +
				'<li>The epiphyses of the 5th proximal and middle phalanges are now as wide as their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>An indentation has developed in the articular surface of the epiphysis of the 1st metacarpal.</ul>' +
			'Carpals' +
				'<ul><li>The distal half of the triquetrum has enlarged and its hamate surface has begun to adjust to the shape of that bone.' +
				'<li>The outline of the tip of the hamulus of the hamate is now discernible.' +
				'<li>The scaphoid and radial articular surfaces of the lunate are beginning to be defined.</ul>';
		bfh[132] =
			'<b><u>Phalanges</u></b>' +
			'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphyses of the proximal and middle phalanges of the 2nd-5th fingers and the distal phalanges of the thumb, 2nd, 4th, and 5th fingers now cap their shafts. This capping is more pronounced on the radial tips.</ul>' +
			'Metacarpals' +
				'<ul><li>As the epiphysis of the 1st metacarpal enlarges, it conforms more closely to the shape of the adjacent surface of the trapezium and to that of its own shaft.' +
				'<li>The epiphyses of the 2nd-5th metacarpals are now as wide as the distal ends of their shafts, to which they conform closely in shape.' +
				'<li>The base of the 2nd metacarpal has shaped further to the adjacent surface of the trapezoid.' +
				'<li>The adductor pollicis and flexor pollicis brevis sesamoids have begun to ossify. The flexor sesamoid can be seen through the head of the 1st metacarpal, directly opposite the adductor sesamoid.</ul>' +
			'Carpals' +
				'<ul><li>The medial half of the trapezium now projects distally toward the base of the 2nd metacarpal, with which it will later articulate.' +
				'<li>The hook of the hamulus appears as a triangular outline within the shadow of the hamate.' +
				'<li>Further reciprocal shaping has occurred in the adjacent surfaces of the capitate and scaphoid.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The proximal margin of the radial epiphysis has adjusted further to the shape of the distal end of its shaft.' +
				'<li>The ulnar epiphysis is shaping to the adjacent surface of the radius and to the radial portion of the end of its own shaft.</ul>';
		bfh[144] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.</ul>' +
			'Carpals' +
				'<ul><li>The various articular surfaces of the capitate, hamate, trapezoid, and trapezium are now well-defined.' +
				'<li>The carpals in the proximal row are only slightly less advanced in their differentiation.' +
				'<li>The definitive shape of the joint between the scaphoid, trapezoid, and trapezium is now established.' +
				'<li>The surface of the trapezium which articulates with the 1st metacarpal has become more concave.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The radial epiphysis caps its shaft and its ulnar articular surface has flattened.' +
				'<li>The epiphysis of the ulna has shaped further to the distal end of its shaft, and its styloid process has become more prominent.</ul>';
		bfh[156] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>Epiphyseal size in <b><u>distal phalanges</b></u> is most important, followed by middle phalanges, followed by proximal phalanges.' +
				'<li>The epiphysis of the distal phalanx of the thumb has begun to fuse with its shaft.' +
				'<li>Epiphyseal fusion tends to occur in an orderly fashion:' +
					'<ol><li><b><u>distal phalanges</u></b> (farthest advanced in the thumb and 3rd finger)' +
					'<li>metacarpals' +
					'<li>proximal phalanges' +
					'<li>middle phalanges</ol></ul>' +
			'Metacarpals' +
				'<ul><li>The epiphysis of the 1st metacarpal now caps its shaft.' +
				'<li>The base of the 2nd metacarpal caps the trapezoid.</ul>' +
			'Carpals' +
				'<ul><li>The form of all the carpals is now essentially adult.' +
				'<li>Accessory sesamoids are usually visible radiographically at this stage.</ul>';
		bfh[168] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>The epiphyses of all <b><u>distal phalanges</b></u> are now fused with their shafts.' +
				'<li>Fusion is almost completed in the 2nd middle phalanx, and is well advanced in the 3rd-5th middle phalanges.' +
				'<li>Fusion is now almost complete in the 2nd-4th proximal phalanges, and it is completed in the 5th proximal phalanx.' +
				'<li>Epiphyseal fusion tends to occur in an orderly fashion:' +
					'<ol><li><b><u>distal phalanges</u></b> (farthest advanced in the thumb and 3rd finger)' +
					'<li>metacarpals' +
					'<li>proximal phalanges' +
					'<li>middle phalanges</ol></ul>' +
			'Metacarpals' +
				'<ul><li>The fusion of the epiphysis of the 1st metacarpal with its shaft is now completed.' +
				'<li>Epiphyseal-diaphyseal fusion is well under way in all of the metacarpals.</ul>' +
			'Radius/Ulna' +
				'<ul><li>The epiphyseal cartilage plates of the radius and ulna are now appreciably reduced in thickness.</ul>';
		bfh[180] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>All of the phalangeal epiphyses have now fused with their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>All of the metacarpal epiphyses have now fused with their shafts.</ul>' +
			'Radius/Ulna' +
				'<ul><li>Fusion begins in the ulna before the radius.</ul>';
		bfh[192] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>All of the phalangeal epiphyses have now fused with their shafts.</ul>' +
			'Metacarpals' +
				'<ul><li>All of the metacarpal epiphyses have now fused with their shafts.</ul>' +
			'Ulna' +
				'<ul><li>Fusion in the ulna is now almost complete.</ul>';
		bfh[204] =
			'<b><u>Phalanges</u></b>' +
				'<ul><li>All of the phalangeal epiphyses have now fused with their shafts.' +
				'<li>The epiphyseal lines in the middle phalanges have been almost completely obliterated.</ul>' +
			'Metacarpals' +
				'<ul><li>All of the metacarpal epiphyses have now fused with their shafts.</ul>' +
			'Radius/Ulna' +
				'<ul><li>Fusion is now complete in the radius and ulna.</ul>';
		bfh[216] = bfh[204];
	};

	// ClipboardJS init
	(function ClipboardJSInit() {
		var clipboard = new Clipboard('#btnCopy');
		clipboard.on('success', function(e) {
			console.log(e);
		});
		clipboard.on('error', function(e) {
			console.log(e);
		});
	})();

	// preselect bone age to match chronological age, as a starting point
	boneage.preselectBoneAge = function() {
		if (SlyCarousel.initialized) {
			if (pt.sex === 'male' || pt.sex === 'female') {
				pt.getAge();
				var i, len, closestAge = null, closestAgeIndex = null;
				for (i = 0, len = ref[pt.sex].ages.length; i < len; i++) {
					if (Math.abs(pt.age - ref[pt.sex].ages[i]) < Math.abs(pt.age - closestAge) || closestAge === null) {
						closestAge = ref[pt.sex].ages[i];
						closestAgeIndex = i;
					}
				}
				SlyCarousel.activate(closestAgeIndex);
			}
		}
	};

	boneage.update = function() {
		pt.getDOB();
		ref.getToday();
		pt.getAge();
		ref.getAge();
		pt.getBoneAge();
		ref.getStDev();
		boneage.setHint();

		boneage.report =
			'<b>EXAM:</b> XR Bone Age Study<br><br>' +
			'<b>COMPARISON:</b> None.<br><br>' +
			'<b>TECHNIQUE:</b> Single frontal view of the left hand and wrist.<br><br>' +
			'<b>FINDINGS:</b><br>' +
			'Sex: ' + pt.sex + '<br>' +
			'Exam Date: ' + ref.today + '<br>' +
			'Birth Date: ' + pt.DOB + '<br>' +
			'Chronological Age: ' + strMtoY(pt.age) + '<br>' +
			'<br>' +
			// 'At a chronological age of ' + strMtoY(pt.age) +
			// 	', using the Brush Foundation data, the mean bone age for calculation is ' +
			// 	strMtoY(ref.age) +
			'For a patient of this age, one standard deviation of bone age is ' + ref.stdev +
			' months, giving a normal bone age range of ' + strMtoY(ref.range.low) +
			' to ' + strMtoY(ref.range.high) + ' (+/- 2 standard deviations).' + '<br>' +
			'<br>' +
			'By the method of Gilsanz and Ratib, the bone age is estimated to be ' +
				strMtoY(pt.boneAge) + '.<br><br>' +
			'<b>IMPRESSION:</b>' + '<br>' +
			'Chronological Age: ' + strMtoY(pt.age) + '<br>' +
			'Estimated Bone Age: ' + strMtoY(pt.boneAge) + '<br>' +
			'<br>' +
			'The estimated bone age is ' + ref.concl + '.';

		$('#taReport').html(boneage.report);
	};

	boneage.setHint = function() {
		var popover = $('#wrap').data('bs.popover');

		if (pt.sex === 'male' || pt.sex === 'female') {
			var index = ref[pt.sex].ages.indexOf(pt.boneAge);
			popover.options.content = boneage[pt.sex].hint[pt.boneAge];
			popover.options.title = pt.sex + ': ' + strMtoY(pt.boneAge) +
				'<button id="poClose" class="close" style="float:right" onclick="boneage.poHide();">&times;</button>';
			popover.setContent();
		}

		// if box is checked but popover is hidden ...
		if ($('#cbHints').is(':checked') && !$("#wrap").next('div.popover:visible').length){
			// ... then show popover
			popover.show();
		}
	};

	pt.getDOB = function() {
		pt.DOBparsed = [
			'',
			String(dp.selected('month') + 1),
			String(dp.selected('day') + 1),
			String(dp.selected('year'))
		];
		pt.DOB = pt.DOBparsed.slice(1, 4).join('/');
	};

	pt.getAge = function() {
		if (pt.DOBparsed) {
			pt.birthMonth = +pt.DOBparsed[1];
			pt.birthDay = +pt.DOBparsed[2];
			pt.birthYear = +pt.DOBparsed[3];
			pt.age = (ref.month + (12 * ref.year)) - (pt.birthMonth + (12 * pt.birthYear));
			if (ref.day - pt.birthDay > 14) pt.age += 1;
			if (ref.day - pt.birthDay < -14) pt.age -= 1;
		} else {
			pt.age = undef;
		}
	};

	pt.getBoneAge = function() {
		if (pt.sex === 'male' || pt.sex === 'female') {
			pt.boneAge = ref[pt.sex].ages[SlyCarousel.rel.centerItem];
		} else {
			pt.boneAge = undef;
		}
	};

	// get ref.age (for calculation)
	ref.getAge = function() {
		var i, len;
		if ( pt.age !== undef && (pt.sex === 'male' || pt.sex === 'female') ) {
			for (i = 0, len = ref[pt.sex].BFages.length; i < len; i++) {
				if (ref.age === undef || Math.abs(ref[pt.sex].BFages[i] - pt.age) < Math.abs(ref.age - pt.age)) {
					ref.age = ref[pt.sex].BFages[i];
				}
			}
		} else {
			ref.age = undef;
		}
	};

	ref.getToday = function() {
		var Today = new Date();
		ref.month = Today.getMonth() + 1;
		ref.day = Today.getDate();
		ref.year = Today.getFullYear();
		ref.today = ref.month + '/' + ref.day + '/' + ref.year;
	};

	ref.getStDev = function() {
		if ( isNaN(pt.boneAge) || isNaN(ref.age) ) {
			ref.concl = undef;
			ref.stdev = undef;
			ref.range = {};
			return;
		}

		ref.stdev = ref[pt.sex].BFstdevs[ ref[pt.sex].BFages.indexOf(ref.age) ];
		ref.range.low = (pt.age - (2 * ref.stdev)).toFixed(2);
		ref.range.high = (pt.age + (2 * ref.stdev)).toFixed(2);

		if (pt.boneAge < ref.range.low) {
			ref.concl = '<span class="text-primary"><strong>delayed</strong></span> (' + ( (pt.age - pt.boneAge) / ref.stdev ).toFixed(1) +
				' standard deviations below the mean)';
		} else if (pt.boneAge > ref.range.high) {
			ref.concl = '<span class="text-primary"><strong>advanced</strong></span> (' + ( (pt.boneAge - pt.age) / ref.stdev ).toFixed(1) +
				' standard deviations above the mean)';
		} else {
			ref.concl = '<strong>normal</strong>';
		}
	};

	boneage.reset = function() {
		$('#btnBoy,#btnGirl').removeClass('selected');
		pt.sex = undef;

		// reset to today's date
		var d = new Date();
		dp.month.activate(d.getMonth());
		dp.day.activate(d.getDate()-1);
		dp.year.activate(25);

		// reset RIGHT side
		$('#h2Instructions').show('slow');
		$('#prevnext').hide('slow');
		$('#divBoy, #divGirl').hide('slow');

		boneage.poHide();
		boneage.update();
		boneage.unSelectAll();
	};

	boneage.selectAll = function() {
		document.getElementById('taReport').focus();
		document.execCommand('SelectAll');
	};

	boneage.unSelectAll = function() {
		document.getElementById('taReport').focus();
		document.execCommand('unselect');
	};

	// convert age from months to years, months
	function strMtoY(ageMonths) {
		if ( ageMonths === undef || isNaN(ageMonths) ) {
			return undef;
		}
		if (ageMonths < 24) {
			return ageMonths + ' months';
		} else {
			return Math.floor(ageMonths / 12) + ' years, ' + Math.round(ageMonths % 12) + ' months';
		}
	}

	function slyInit(div) {
		var $frame = $(div),
			$wrap = $frame.parent();

		SlyCarousel = new Sly($frame, {
			horizontal: 1,
			itemNav: 'forceCentered',
			smart: 1,
			activateOn: 'click',
			activateMiddle: 1,
			mouseDragging: 1,
			touchDragging: 1,
			releaseSwing: 1,
			startAt: 0,
			scrollBar: $wrap.find('.scrollbar'),
			scrollBy: 1,
			speed: 300,
			elasticBounds: 1,
			easing: 'easeOutExpo',
			dragHandle: 1,
			dynamicHandle: 1,
			clickBar: 1
		}).init();

		SlyCarousel.on('move', function() {
			boneage.update();
		});
	}

	// when user selects sex
	$('#divSex button').click(function() {
		var sex = this.id.substr(3,4);
		$('#h2Instructions').hide('slow');
		$('#prevnext').show('slow');
		// cannot use $.hide()/show() due to block
		$('#div'+sex).css('display', 'block')
			.siblings('.frame').css('display', 'none');

		slyInit('#div'+sex);
		boneage.preselectBoneAge();

		$('#btn'+sex).addClass('selected')
			.siblings('button').removeClass('selected');

		if (sex === "Boy") pt.sex = 'male';
		if (sex === "Girl") pt.sex = 'female';

		boneage.update();
		boneage.unSelectAll();
	});

	$('#labelReport').click(function() {
		boneage.selectAll();
	});

	$('#btnReset').click(function() {
		boneage.reset();
	});

	$('#wrap').popover({
		'trigger': 'manual',
		'placement': 'left',
		'html': true,
	});

	$('#prev').click(function() {
		SlyCarousel.activate(SlyCarousel.rel.activeItem-1);
		this.blur();
	});

	$('#next').click(function() {
		SlyCarousel.activate(SlyCarousel.rel.activeItem+1);
		this.blur();
	});

	$('#cbHints').click(function() {
		if ($('#cbHints').is(':checked')) {
			$('#wrap').popover('show');
		} else {
			$('#wrap').popover('hide');
		}
	});

	boneage.poHide = function() {
		$('#wrap').popover('hide');
		$('#cbHints').attr('checked', false);
	};

	boneage.initHints();
	boneage.update();

});
