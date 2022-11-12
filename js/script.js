(function () {
	var initPageSpeed = 35,
	initFontSize = 60,
        initContentWidth = 100,
        initMarkerPosition = 30,
	scrollDelay,
	textColor = '#ffffff',
	backgroundColor = '#141414',
	socket,
	remote,
	timer = $('.clock').timer({
		stopVal: 10000,
		onChange: function(time) {
			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', time);
			}
		}
	});

	/**
	 * Config Wrapper to add Local Storage support while maintaining
	 * support for previous cooking settings. All existing cookies will
	 * be ported over to local storage.
	 */
	var config = {
		get: function(key) {
			if (typeof localStorage !== 'undefined' && localStorage[key]) {
				return localStorage[key];
			} else if ($.cookie(key)) {
				var val = $.cookie(key);

				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(key, val);
				}

				return val;
			}
		},
		set: function(key, val) {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(key, val);
			} else {
				$.cookie(key, val);
			}
		}
	};

	window.onload = function() {
		// Check if we've been here before and made changes
		if (config.get('teleprompter_font_size')) {
			initFontSize = config.get('teleprompter_font_size');
		}
		if (config.get('teleprompter_speed')) {
			initPageSpeed = config.get('teleprompter_speed');
		}
                if (config.get('teleprompter_prompter_width')) {
			initContentWidth = config.get('teleprompter_prompter_width');
		}
                if (config.get('teleprompter_marker_position')) {
			initMarkerPosition = config.get('teleprompter_marker_position');
		}
		if (config.get('teleprompter_text')) {
			$('#teleprompter').html(config.get('teleprompter_text'));
		}
		if (config.get('teleprompter_text_color')) {
			textColor = config.get('teleprompter_text_color');
			$('#text-color').val(textColor);
			$('#text-color-picker').css('background-color', textColor);
			$('#teleprompter').css('color', textColor);
		}
		if (config.get('teleprompter_background_color')) {
			backgroundColor = config.get('teleprompter_background_color');
			$('#background-color').val(backgroundColor);
			$('#background-color-picker').css('background-color', textColor);
			$('#teleprompter').css('background-color', backgroundColor);
		} else {
			clean_teleprompter();
		}

		// Listen for Key Presses
		$('#teleprompter').keyup(update_teleprompter);
		$('body').keydown(navigate);

		// Setup GUI
		$('article').stop().animate({
			scrollTop: 0
		}, 100, 'linear', function() {
			$('article').clearQueue();
		});
		$('.marker, .overlay').fadeOut(0);
		$('article .teleprompter').css({
			'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
		});

		// Create Font Size Slider
		$('.font_size').slider({
			min: 12,
			max: 100,
			value: initFontSize,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				fontSize(true);
			},
			change: function() {
				fontSize(true);
			}
		});

		// Create Speed Slider
		$('.speed').slider({
			min: 0,
			max: 50,
			value: initPageSpeed,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				speed(true);
			},
			change: function() {
				speed(true);
			}
		});
                
                $('.prompter_width').slider({
			min: 20,
			max: 100,
			value: initContentWidth,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				prompterWidth(true);
			},
			change: function() {
				prompterWidth(true);
			}
		});
                
                $('.marker_position').slider({
			min: 20,
			max: 90,
			value: initMarkerPosition,
			orientation: "horizontal",
			range: "min",
			animate: true,
			slide: function() {
				markerPosition(true);
			},
			change: function() {
				markerPosition(true);
                                if (!$('body').hasClass('playing')) $('.marker, .overlay').fadeOut('slow');
			}
		});
                
                

		$('#text-color').change(function() {
			var color = $(this).val();
			$('#teleprompter').css('color', color);
			config.set('teleprompter_text_color', color);
		});
		$('#background-color').change(function() {
			var color = $(this).val();
			$('#teleprompter').css('background-color', color);
			config.set('teleprompter_background_color', color);
		});

		// Run initial configuration on sliders
		fontSize(false);
		speed(false);
                prompterWidth(false);
                markerPosition(false);

		// Listen for Play Button Click
		$('.button.play').click(function() {
			if ($(this).hasClass('icon-play')) {
				start_teleprompter();
			} else {
				stop_teleprompter();
			}
		});

		// Listen for FlipX Button Click
		$('.button.flipx').click(function() {

			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}
                        
			if ($('.teleprompter').hasClass('flipxy')){
                            $('.teleprompter').removeClass('flipxy').addClass('flipy');
                        }else $('.teleprompter').toggleClass('flipx');
                        
			if ($('.teleprompter').hasClass('flipx') && $('.teleprompter').hasClass('flipy')) {
                            $('.teleprompter').removeClass('flipx').removeClass('flipy').addClass('flipxy');
			}
                        
                        $('.button.flipx').toggleClass("active");
		});

		// Listen for FlipY Button Click
		$('.button.flipy').click(function() {

			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}
                        
                        if ($('.teleprompter').hasClass('flipxy')){
                            $('.teleprompter').removeClass('flipxy').addClass('flipx');
                        }else $('.teleprompter').toggleClass('flipy');
                        
			if ($('.teleprompter').hasClass('flipx') && $('.teleprompter').hasClass('flipy')) {
                            $('.teleprompter').removeClass('flipx').removeClass('flipy').addClass('flipxy');
			}
                        
                        $('.button.flipy').toggleClass("active");

			if ($('.teleprompter').hasClass('flipy')) {
				$('article').stop().animate({
					scrollTop: $(".teleprompter").height() + 100
				}, 250, 'swing', function() {
					$('article').clearQueue();
				});
			} else {
				$('article').stop().animate({
					scrollTop: 0
				}, 250, 'swing', function() {
					$('article').clearQueue();
				});
			}
		});

		// Listen for Reset Button Click
		$('.button.reset').click(function() {
			stop_teleprompter();
			timer.resetTimer();

			if (socket && remote) {
				socket.emit('clientCommand', 'updateTime', '00:00:00');
			}

			$('article').stop().animate({
				scrollTop: 0
			}, 100, 'linear', function() {
				$('article').clearQueue();
			});
		});

		// Listen for Reset Button Click
		$('.button.remote').click(function() {
			if (!socket && !remote) {
				remote_connect();
			} else {
				$('.remote-modal').css('display', 'flex');
			}
		});

		$('.close-modal').click(function() {
			$('.remote-modal').hide();
		});
                
                $('.button.upload').click(function() {
                    $('.button.upload').addClass("active");
                    //setTimeout(function(){$('.button.upload').removeClass("active");}, 2000);
                    $.post('cloud.php',   // url
                            { text: $("#teleprompter").html() }, // data to be submit
                            function(data, status, jqXHR) {// success callback
                                $('.button.upload').removeClass("active");
                             });
		});
                
                $('.button.download').click(function() {
                    load_data();
		});

		var currentRemote = config.get('remote-id');

		if (currentRemote && currentRemote.length === 6) {
			remote_connect(currentRemote);
		}
	};

	function remote_connect(currentRemote) {
		socket = io.connect('https://promptr.tv', { path: '/remote/socket.io' });
		remote = (currentRemote) ? currentRemote : random_string();

		socket.on('connect', function() {
			socket.emit('connectToRemote', 'REMOTE_' + remote);
			new QRCode(document.getElementById("qr-code"), 'https://promptr.tv/remote?id=' + remote);
			$('.remote-id').text(remote);

			if (!currentRemote) {
				$('.remote-modal').css('display', 'flex');
			}
		});

		socket.on('disconnect', function() {
			$('.button.remote').removeClass('active');
			config.set('remote-id', null);
		});

		socket.on('connectedToRemote', function () {
			config.set('remote-id', remote);
			$('.button.remote').addClass('active');
		});

		socket.on('remoteControl', function (command) {
			switch (command) {
				case 'reset':
					$('.button.reset').trigger('click');
					break;

				case 'power':
					remote_disconnect();
					break;

				case 'up':
					stop_teleprompter();
					pageScroll('up');
					break;

				case 'slower':
					var elm = $('.speed');
					var speed = elm.slider('value');

					speed -= 1;

					if (speed < 0) {
						speed = 0;
					}

					elm.slider('value', speed);
					break;

				case 'play':
					$('.button.play').trigger('click');
					break;

				case 'faster':
					var elm = $('.speed');
					var speed = elm.slider('value');

					speed += 1;

					if (speed > 50) {
						speed = 50;
					}

					elm.slider('value', speed);
					break;

				case 'down':
					stop_teleprompter();
					pageScroll('down');
					break;

				case 'hideModal':
					$('.remote-modal').hide();
					break;
			}
		});
	}

	function remote_disconnect() {
		if (socket && remote) {
			socket.disconnect();
			remote = null;
		}
	}

	function random_string() {
		var chars = "3456789ABCDEFGHJKLMNPQRSTUVWXY";
		var string_length = 6;
		var randomstring = '';

		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}

		return randomstring;
	}

	// Manage Font Size Change
	function fontSize(save) {
		initFontSize = $('.font_size').slider("value");

		$('article .teleprompter').css({
			'font-size': initFontSize + 'px',
			'line-height': Math.ceil(initFontSize * 1.5) + 'px',
			'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
		});

		$('article .teleprompter p').css({
			'padding-bottom': Math.ceil(initFontSize * 0.25) + 'px',
			'margin-bottom': Math.ceil(initFontSize * 0.25) + 'px'
		});

		$('label.font_size_label span').text('(' + initFontSize + ')');

		if (save) {
			config.set('teleprompter_font_size', initFontSize);
		}
	}

	// Manage Speed Change
	function speed(save) {
		initPageSpeed = Math.floor(50 - $('.speed').slider('value'));
		$('label.speed_label span').text('(' + $('.speed').slider('value') + ')');

		if (save) {
			config.set('teleprompter_speed', $('.speed').slider('value'));
		}
	}
                

        // Manage contetn width
	function prompterWidth(save) {
		initContentWidth = Math.floor($('.prompter_width').slider('value'));
                
                $('article .teleprompter').css({
			'width': initContentWidth + '%',
		});
                
		$('label.prompter_width_label span').text('(' + $('.prompter_width').slider('value') + '%)');

		if (save) {
			config.set('teleprompter_prompter_width', $('.prompter_width').slider('value'));
		}
	}
        
        // Manage marker position
	function markerPosition(save) {
		initMarkerPosition = Math.floor($('.marker_position').slider('value'));
                
                $('.marker').css({
			'top': 'calc('+initMarkerPosition + '% - 20px)',
		});
                
                $('.overlay .top').css({
			'height': 'calc('+initMarkerPosition + '% - 90px)',
		});
                $('.overlay .bottom').css({
			'top': 'calc('+initMarkerPosition + '% + 90px)',
		});
                
		$('label.marker_position_label span').text('(' + $('.marker_position').slider('value') + ')');

		if (save) {
                        $('.marker, .overlay').fadeIn('slow');
			config.set('teleprompter_marker_position', $('.speed').slider('value'));
		}
	}
        

	// Manage Scrolling Teleprompter
	function pageScroll(direction, offset) {
		var animate = 0;
                
        if (!offset) offset = 2;

		if (!direction) {
			direction = 'down'
			clearTimeout(scrollDelay);
			scrollDelay = setTimeout(pageScroll, initPageSpeed);
		} else {
			offset = window.screen.availHeight / 2;
			animate = 500;
		}

		if ($('.teleprompter').hasClass('flipy')) {
			$('article').stop().animate({
				scrollTop: (direction === 'down') ? '-=' + offset + 'px' : '+=' + offset + 'px'
			}, animate, 'linear', function() {
				$('article').clearQueue();
			});

			// We're at the bottom of the document, stop
			if ($("article").scrollTop() === 0) {
				stop_teleprompter();
				setTimeout(function() {
					$('article').stop().animate({
						scrollTop: $(".teleprompter").height() + 100
					}, 500, 'swing', function() {
						$('article').clearQueue();
					});
				}, 500);
			}
		} else {
			$('article').stop().animate({
				scrollTop: (direction === 'down') ? '+=' + offset + 'px' : '-=' + offset + 'px'
			}, animate, 'linear', function() {
				$('article').clearQueue();
			});

			// We're at the bottom of the document, stop
			if ($("article").scrollTop() >= (($("article")[0].scrollHeight - $(window).height()) - 100)) {
				stop_teleprompter();
				setTimeout(function() {
					$('article').stop().animate({
						scrollTop: 0
					}, 500, 'swing', function() {
						$('article').clearQueue();
					});
				}, 500);
			}
		}
	}
        
        function load_data(){
            $('.button.download').addClass("active");
            $.get('cloud.php',  // url
                function (data, textStatus, jqXHR) {  // success callback
                    $("#teleprompter").html(data);
                    $('.button.download').removeClass("active");
              });
        }

	// Listen for Key Presses on Body
	function navigate(evt) {
		var space = 32,
                    pause = 80, // letter V for letter P use 80
                    escape = 27,
                    left = 37,
                    right = 39,
                    up = 38,
                    down = 40,
                    font_up = 71,   // G char
                    font_down = 70, // F char
                    mirror_x = 88, // Y char
                    mirror_y = 89, // X char
                    width_up = 69, // E charr
                    width_down = 87, // W char
                    marker_up = 77, // M char
                    marker_down = 78, // N char
                    load_key = 76, // L char
                    speed = $('.speed').slider('value'),
                    font_size = $('.font_size').slider('value');

		// Exit if we're inside an input field
		if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter') {
			return;
		} else if (typeof evt.target.id == 'undefined' || evt.target.id != 'gui') {
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}

		// Reset GUI
		if (evt.keyCode == escape) {
			$('.button.reset').trigger('click');
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Start Stop Scrolling
		else if (evt.keyCode == space || evt.keyCode == pause /* letter v - quieter key*/) {
			$('.button.play').trigger('click');
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Decrease Speed with Left Arrow
		else if (evt.keyCode == left) {
			$('.speed').slider('value', speed - 2);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Increase Speed with Right Arrow
		else if (evt.keyCode == right) {
			$('.speed').slider('value', speed + 2);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Decrease Font Size with Minus
		else if (evt.keyCode == font_down) {
			$('.font_size').slider('value', font_size - 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Increase Font Size with Plus
		else if (evt.keyCode == font_up) {
			$('.font_size').slider('value', font_size + 1);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Move scroller down
		else if (evt.keyCode == down) {
                        $('article').scrollTop($('article').scrollTop() - font_size/4);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
		// Move scroller up
		else if (evt.keyCode == up) {
			$('article').scrollTop($('article').scrollTop() + font_size/4);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Flip text on X axis
		else if (evt.keyCode == mirror_x) {
			$('.button.flipx').trigger("click");
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Flip text on y axis
		else if (evt.keyCode == mirror_y) {
			$('.button.flipy').trigger("click");
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Prompter width up
		else if (evt.keyCode == width_up) {
			$('.prompter_width').slider('option','value', $('.prompter_width').slider('value') + 10);
                        prompterWidth(save);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Prompter width down
		else if (evt.keyCode == width_down) {
			$('.prompter_width').slider('option','value', $('.prompter_width').slider('value') - 10);
                        prompterWidth(save);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Marker position  up
		else if (evt.keyCode == marker_up) {
			$('.marker_position').slider('option','value', $('.marker_position').slider('value') + 5);
                        markerPosition(save);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Marker position down
		else if (evt.keyCode == marker_down) {
			$('.marker_position').slider('option','value', $('.marker_position').slider('value') - 5);
                        markerPosition(save);
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                // Marker position down
		else if (evt.keyCode == load_key) {
			load_data();
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
                
                
	}

	// Start Teleprompter
	function start_teleprompter() {
		if (socket && remote) {
			socket.emit('clientCommand', 'play');
		}

		$('#teleprompter').attr('contenteditable', false);
		$('body').addClass('playing');
		$('.button.play').removeClass('icon-play').addClass('icon-pause');
		//$('header h1, header nav').fadeTo('slow', 0.15);
                $('header').fadeOut('fast');
		$('.marker, .overlay').fadeIn('slow');

		timer.startTimer();

		pageScroll();
	}

	// Stop Teleprompter
	function stop_teleprompter() {
		if (socket && remote) {
			socket.emit('clientCommand', 'stop');
		}

		clearTimeout(scrollDelay);
		$('#teleprompter').attr('contenteditable', true);
		//$('header h1, header nav').fadeTo('slow', 1);
                $('header').fadeIn('fast');
		$('.button.play').removeClass('icon-pause').addClass('icon-play');
		$('.marker, .overlay').fadeOut('slow');
		$('body').removeClass('playing');

		timer.stopTimer();
	}

	// Update Teleprompter
	function update_teleprompter() {
		config.set('teleprompter_text', $('#teleprompter').html());
	}

	// Clean Teleprompter
	function clean_teleprompter() {
		var text = $('#teleprompter').html();
		text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
		text = text.replace(/@@/g, '<br>');
		text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
		text = text.replace(/<p><\/p>/g, '');

		if (text.substr(0, 3) !== '<p>') {
			text = '<p>' + text + '</p>';
		}

		$('#teleprompter').html(text);
	}
})();