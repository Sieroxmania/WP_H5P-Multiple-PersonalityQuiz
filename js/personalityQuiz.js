/**
    @namespace H5P
*/
var H5P = H5P || {};



H5P.PersonalityQuiz = (function ($, EventDispatcher) {
	/**
	  A personality quiz.

	  @memberof PersonalityQuiz
	  @param {Object} params
	  @param {number} id
	  @constructor
	*/
	function PersonalityQuiz(params, id) {
		var self = this;

		self.classPrefix = 'h5p-personality-quiz-';
		self.isExtendedMode = params.resultScreen.extendedMode;
		self.resultAnimation = params.resultScreen.animation;
		self.resultTitle = params.resultScreen.displayTitle;
		self.resultDescription = params.resultScreen.displayDescription;
		self.resultImagePosition = params.resultScreen.imagePosition;
		self.progressText = params.progressText;
		self.personalities = params.personalities;
		self.numQuestions = params.questions.length;

		self.slidePercentage = 100 / self.numQuestions;

		var loadingImages = [];

		// NOTE (Emil): These constants are defined in pixels.
		var responsiveColumnThreshold = 450;
		var minimumHeight = 400;

		var canvas = {
			classname: classes('wheel'),
			width: 300,
			height: 300,
		};

		var $content = $('.h5p-content');

		var body = document.querySelector('body');
		var animation = ((body.style.animationName !== undefined) && params.animation);

		var resizeEventHandler = null;

		EventDispatcher.call(self);

		/**
		  Wrapper around H5P.getPath so as not to need id everywhere.

		  @param {string} path
		  @return {string} Full path for the resource.
		*/
		function _getPath(path) {
			return H5P.getPath(path, id);
		}

		/**
		  Prefix a classname with self.classPrefix.

		  @param {string} className
		  @param {boolean} addDot If true adds '.' to the start of the start of the class name.
		  @return {string}
		*/
		function prefix(className, addDot) {
			var prefixed = self.classPrefix + className;

			if (addDot) {
				prefixed = '.' + prefixed;
			}

			return prefixed;
		}

		/**
		  Prefixes all arguments with self.classPrefix.

		  @return {string} A string with all prefixed class names passed to the function separated by spaces.
		*/
		function classes() {
			var args = Array.prototype.slice.call(arguments);
			var classNames = 'h5p-personality-quiz';

			args.forEach(function (argument) {
				classNames += ' ' + prefix(argument);
			});

			return classNames;
		}

		/**
		  Interpolates a string, looping over the properties of variables
		  and replaces instances of '@' + property name with the value of the property.

		  @param {string} str
		  @param {Object} variables
		  @return {string}
		*/
		function interpolate(str, variables) {
			var keys = Object.keys(variables);

			keys.forEach(function (key) {
				str = str.replace('@' + key, variables[key]);
			});

			return str;
		}

		/**
		  Creates an element of 'type' and adds the attributes in the object 'attributes'.
		  In addition some general styles are added to the element.

		  @param {string} type - name of an element type.
		  @param {Object} attributes
		  @returns {jQuery} - The new button element.
		*/
		function createButton(type, attributes) {
			var $button = $('<' + type + '>', attributes);

			$button.css({
				'border-left': '5px solid #' + params.buttonColor,
				'background': 'linear-gradient(to right, #' + params.buttonColor + ' 50%, rgb(233, 239, 247) 50%)',
				'background-size': '200% 100%',
				'background-position': '100%'
			});

			return $button;
		}

		/**
		  Takes a callback and creates a listener for on the button for
		  the click event. The logic for calling the callback is determined
		  by the avilability of animation.

		  @param {jQuery} $element
		  @param {listenerCallback}
		*/
		function addButtonListener($element, callback) {
			if (animation) {
				$element.click(function () {
					$(this).addClass(prefix('button-animate'));
				});
				$element.on('animationend', function () {
					$(this).removeClass(prefix('button-animate'));
					callback();
				});
			}
			else {
				$element.click(function () {
					callback();
				});
			}
		}

		/**
		  Creates a canvas element and returns a canvas element.

		  @return {jQuery}
		*/
		function createCanvas() {
			var $wrapper = $('<div>', {
				'class': classes('wheel-container slide')
			});

			var $canvas = $('<canvas>', {
				'class': canvas.classname,
			});

			self.$canvas = $canvas;

			$wrapper.append($canvas);

			return $wrapper;
		}

		/**
		  Entry point for creating the entire personality quiz ui.

		  @param {PersonalityQuiz} quiz A personality quiz instance
		  @param {Object[]} data The params received from H5P
		  @return {jQuery}
		*/
		function createQuiz(quiz, data) {
			var $container, $slides, $bar, $title, $question, $canvas, $result;

			$container = $('<div>', { 'class': classes('container') });
			$slides    = $('<div>', { 'class': classes('slides') });
			$bar       = createProgressbar();

			if (!data.titleScreen.skip) {
				$title = createTitleCard(quiz, data.titleScreen, data.startText);
				$slides.append($title);
			}

			data.questions.forEach(function (question) {
				$question = createQuestion(quiz, question);

				$slides.append($question);
			});

			if (animation && self.resultAnimation === 'wheel') {
				$canvas = createCanvas();

				$slides.append($canvas);
			}

			$result = createResult(quiz, data.resultScreen, data.retakeText);

			$slides.append($result);
			$container.append($bar, $slides);

			quiz.$progressbar = $bar;

			if (data.titleScreen.skip) {
				quiz.$progressbar.show();
			}

			quiz.$progressText = $bar.children(prefix('progress-text', true));
			quiz.$wrapper = $container;
			quiz.$slides = $slides.children();
			quiz.$result = $result;

			return $container;
		}

		/**
		  Create a progress bar for the quiz

		  @return {jQuery}
		*/
		function createProgressbar() {
			var $bar, $text, text;

			$bar = $('<div>', { 'class': classes('progressbar') });

			$bar.css({
				'background': 'linear-gradient(to right, #' + params.progressbarColor + ' 50%, rgb(60, 62, 64) 50%)',
				'background-size': '200% 100%',
				'background-position': '100%'
			});

			$bar.hide();

			$text = $('<p>', { 'class': classes('progress-text') });

			text = interpolate(self.progressText, {
				'question': self.answered + 1,
				'total': self.numQuestions
			});

			$text.html(text);

			if (animation) {
				$bar.css('transition', 'background-position 1s');
			}

			$bar.append($text);

			return $bar;
		}

		/**
		  Create the title screen.

		  @param {PersonalityQuiz} quiz A personality quiz instance
		  @param {Object} data          The params received from H5P
		  @param {string} startText     The UI text for the start button
		  @return {jQuery}
		*/
		function createTitleCard(quiz, data, startText) {
			var $card, $content, $title, $wrapper, $startButton, path, hasImage;

			hasImage = data.image.file ? true : false;

			$card = $('<div>', { 'class': classes('title-card', 'slide', 'background') });
			$content = $('<div>', { 'class': classes('title-card-wrapper') });
			$title = $('<h2>', {
				html: data.title.text,
				'class': classes('title')
			});

			if (hasImage) {
				path = _getPath(data.image.file.path);

				$card.css('background-image', 'url(' + path + ')');
			}

			$wrapper = $('<div>', { 'class': classes('start-button-wrapper') });
			$startButton = createButton('button', {
				'class': classes('start-button', 'button'),
				'html': startText,
				'type': 'button'
			});

			addButtonListener($startButton, function () {
				quiz.trigger('personality-quiz-start');
			});

			$wrapper.append($startButton);
			$content.append($title, $wrapper);
			$card.append($content);

			return $card;
		}

		/**
		  Creates a question for the quiz.

		  @param {PersonalityQuiz} quiz
		  @param {Object} question A question instance from params
		  @return {jQuery}
		*/
		function createQuestion(quiz, question) {
			var $slide, $text, $image, $answer;
			var path, deferred, images, createAnswerButton;

			$slide = $('<div>', { 'class': classes('question', 'slide') });
			$text = $('<h2>', {
				'class': classes('question-text'),
				'html': question.text
			});

			if (question.image.file) {
				path = _getPath(question.image.file.path);

				$image = $('<img>', {
					'class': classes('question-image'),
					'src': path
				});

				deferred = $.Deferred();
				$image.on('load', function () {
					deferred.resolve();
				});
				loadingImages.push(deferred.promise());

				$slide.append($image);
			}

			$slide.append($text);

			// NOTE (Emil): We only make the answers show images if all the alternatives have images.
			images = true;
			question.answers.forEach(function (answer) { images = images && answer.image.file !== undefined; });

			createAnswerButton = images ? createImageAnswer : createAnswer;

			$answer = createAnswerButton(question.answers, quiz.answerListener);

			$slide.append($answer);

			return $slide;
		}

		/**
		  Get the number of columns per row for image answers.

		  @return {number} The number of columns based on $container width and the responseColumnThreshold.
		*/
		function getNumColumns() {
			return (self.$container.width() < responsiveColumnThreshold) ? 2 : 3;
		}

		/**
		  Add or remove rows if there are respectively too few or too many rows.

		  @param {jQuery} $container
		  @param {jQuery} $rows
		  @param {number} rowCount
		*/
		function checkRows($container, $rows, rowCount) {
			var $row, $extra;

			$extra = $rows.slice(rowCount);
			$extra.remove();

			while ($rows.length < rowCount) {
				$row = createRow();
				$container.append($row);

				$rows = $container.children();
			}
		}

		/**
		  Attaches $elements to the $rows in the $container.

		  @param {jQuery} $container
		  @param {jQuery} $elements
		  @param {number} columns decides how many elements go in each row.
		  @param {number} [height] An optional height value for the row.
		*/
		function attachRows($container, $elements, columns) {
			var $rows = $container.children(prefix('row', true));

			$rows.each(function (index) {
				var $row = $(this);
				var start = (index) * columns;
				var end = start + columns;

				$row.append($elements.slice(start, end));
			});
		}

		/**
		  Creates a list element with the 'h5p-personality-quiz-row' class.

		  @return {jQuery}
		*/
		function createRow() {
			return $('<li>', { 'class': classes('row') });
		}

		/**
		  Creates an answer with an image attached.

		  @param {Object} answer
		  @param {listenerCallback} listener
		  @return {jQuery}
		*/
		function createImageAnswer(answers, listener) {
			const columns = getNumColumns();
			const rowCount = answers.length / columns;
			const $wrapper = $('<div>').addClass('answers-wrapper');
			const $answers = $('<ul>').addClass('image-answers');
			// Set zur Speicherung einzigartiger Persönlichkeiten, wenn der erweiterte Modus aktiviert ist
			const uniquePersonalities = self.isExtendedMode ? new Set() : null;
			let hasNonDefaultMultiplier = false;
	
			$elements = answers.map(function (answer) {
			  const multiplier = (answer.multiplier !== undefined) ? answer.multiplier : 1;
			  const path = _getPath(answer.image.file.path);

			  if (multiplier !== 1) {
				hasNonDefaultMultiplier = true;
			  }
	  
			  const $answer = $('<div>', {
				'class': classes('column', 'columns-' + String(columns)),
				'data-personality': answer.personality,
			
			  });
	  
			  const $button = createButton('div', {
				'class': classes('button', 'image-answer-button'),
				'html': answer.text,
				'data-multiplier': answer.multiplier || 1
			  });
	  
			  const $image = $('<div>', {
				'class': classes('image-answer-image')
			  });
			  $image.css('background-image', 'url(' + path + ')');
	  
			  $answer.append($image, $button);
			  $answer.click(listener);
	  
			  if (self.isExtendedMode) {
				answer.personality.split(',').forEach(personality => {
				  uniquePersonalities.add(personality.trim());
				});
			  }
			  return $answer;
			});
	  
			for (let row = 0; row < rowCount; row++) {
			  const $row = createRow();
			  $answers.append($row);
			}
	  
			attachRows($answers, $elements, columns);
			$wrapper.append($answers);
	  
			if (self.isExtendedMode) {
			  uniquePersonalities.forEach(personality => {
				const personalityObj = self.personalities.find(p => p.name === personality);
				if (personalityObj) {
				  // Hier verwenden wir den Multiplier aus dem data-Attribut des ersten Antwort-Elements
				  const multiplier = parseFloat($answers.find('[data-personality*="' + personality + '"]').first().data('multiplier')) || 1;
				  personalityObj.occurrence = (personalityObj.occurrence || 0) + 1 * multiplier;
				}
			  });
			}
			$wrapper.data('hasNonDefaultMultiplier', hasNonDefaultMultiplier);
			return $wrapper;
		  }

/**
  Creates a button for the answer element.
  @param {Object} answer
  @param {listenerCallback} listener
  @return {jQuery}
*/
function createAnswer(answers, listener) {
	const $wrapper = $('<div>', {'class': classes('answers-wrapper')});
	const $answers = $('<ul>', {'class': classes('answers')});
	let hasNonDefaultMultiplier = false;
	$answers.click(listener);
	// Set zur Speicherung einzigartiger Persönlichkeiten, wenn der erweiterte Modus aktiviert ist
	const uniquePersonalities = self.isExtendedMode ? new Set() : null;
	// Iteriere über die Antworten und erstelle Buttons
	answers.forEach(function(answer) {
		const multiplier = (answer.multiplier !== undefined) ? answer.multiplier : 1;
		if (multiplier !== 1) {
			hasNonDefaultMultiplier = true;
		}
		const $answer = createButton('li', {
			'data-personality': answer.personality,
			'class': classes('button', 'answer'),
			'html': answer.text,
			'data-multiplier': answer.multiplier || 1
		});
		$answers.append($answer);
		// Sammle einzigartige Persönlichkeiten aus den Antworten
		if (self.isExtendedMode) {
			answer.personality.split(',').forEach(personality => {
				uniquePersonalities.add(personality.trim());
			});
		}
	});
	$wrapper.append($answers);
	// Aktualisiere die Vorkommensanzahl jeder einzigartigen Persönlichkeit
	if (self.isExtendedMode) {
		uniquePersonalities.forEach(personality => {
			const personalityObj = self.personalities.find(p => p.name === personality);
			if (personalityObj) {
				// Hier verwenden wir den Multiplier aus dem data-Attribut des ersten Antwort-Elements
				const multiplier = parseFloat($answers.find('[data-personality*="' + personality + '"]').first().data('multiplier')) || 1;
				personalityObj.occurrence = (personalityObj.occurrence || 0) + 1 * multiplier;
			}
		});
	}
	$wrapper.data('hasNonDefaultMultiplier', hasNonDefaultMultiplier);
	return $wrapper;
}

		/**
		  Creates the slide for showing the result at the end of the quiz.

		  @param {PersonalityQuiz} quiz A PersonalityQuiz instance
		  @param {Object} data The params received from H5P
		  @param {string} retakeText The UI text for the button to retake the quiz
		  @return {jQuery}
		*/
		function createResult(quiz, data, retakeText) {
			const $result    = $('<div>', { 'class': classes('result', 'slide')       });
			const $wrapper   = $('<div>', { 'class': classes('personality-wrapper')   });
			const $container = $('<div>', { 'class': classes('retake-button-wrapper') });
			const $button    = createButton('button', {
				'html': retakeText,
				'class': classes('button', 'retake-button'),
				'type': 'button'
			});

			addButtonListener($button, () => {
				quiz.trigger('personality-quiz-restart');
			});

			$container.append($button);
			quiz.$resultWrapper = $wrapper;
		
			$result.append($wrapper, $container);

			//Calculate new height because of new maxLenght of description
			//and Data-Visualisation in extended Mode
			quiz.on('personalityCreated', () => {
				setResultSlideHeight($result, $wrapper);
			});
			return $result;
		}

		/**
		  Sets the background image of the personality slide the the image
		  associated with the personality.

		  @param {jQuery} $result The result slide to set the background on
		  @param {jQuery} $personality - The jQuery object for the personality element
		  @param {Object} personality - The personality object containing image information.
		*/
		function setPersonalityBackgroundImage($result, $personality, personality) {
			const path = _getPath(personality.image.file.path);
			const classNames = [
				prefix('background'),
				prefix('center-personality-wrapper'),
			];

			$result.css('background-image', 'url(' + path + ')');
			$result.addClass(classNames.join(' '));

			// Überprüfe, ob $personality existiert, bevor die CSS-Klasse hinzugefügt wird
			if ($personality){
			$personality.addClass(prefix('center-personality'));
			}
		}

		/**
		  Create an element only if the passed expression evaluates to 'true'.

		  @param {boolean} expression
		  @param {string} element The tag for the element to be created.
		  @param {Object} attributes Attributes to set on the created element.
		  @return {jQuery}
		*/
		function createIf(expression, element, attributes) {
			var $element = null;

			if (expression) {
				$element = $(element, attributes);
			}

			return $element;
		}


		/**
		  Sets the height of the inline personality image.

		  @param {jQuery} $wrapper
		  @param {jQuery} $personality
		  @param {jQuery} $image
		*/
		  function setInlineImageHeight ($image, $personality, $resultWrapper) {
			var height;

			if (!$image) {
				return;
			}

			$image.hide();

			height = $resultWrapper.outerHeight() - $personality.outerHeight(true);

			// Adjust height calculation for extended mode
			if (self.isExtendedMode) {
				height = height/2; // Subtract the additional height in extended mode
			}

			$image.css({'height': 'calc(' + height + 'px - 4 * 1em)'});
			$image.show();
		}
	
		/**
		  Appends the personality information to the result slide.

		  @param {PeronalityQuiz} quiz
		  @param {Object} personality
		  @param {boolean} hasTitle
		  @param {boolean} hasImage
		  @param {boolean} hasDescription
		*/
		function appendPersonality(quiz, personality, hasTitle, hasImage, hasDescription) {
			var $personality, $title, $description, $image;
	  
			$title = createIf(hasTitle, '<h2>', { 'html': personality.name });
	  
			if (personality.image.file) {
			  $image = createIf(hasImage, '<img>', {
				'class': classes('result-image'),
				'src': _getPath(personality.image.file.path),
				'alt': personality.image.alt
			  });
			}
	  
			$description = createIf(hasDescription, '<p>', {
			  'html': personality.description
			});
	  
			// NOTE (Emil): We only create $personality element if it has at least
			// one child element.
			if (hasTitle || hasImage || hasDescription) {
			  $personality = $('<div>', { 'class': classes('personality') });
	  
			  $personality.append($title);
			  $personality.append($image);
			  $personality.append($description);
			}
	  
			quiz.$resultWrapper.append($personality);
			
			if ($personality) {
				// Trigger das Event, nachdem das Element hinzugefügt wurde
				quiz.trigger('personalityCreated');
			}
	  
			setInlineImageHeight($image, $personality, quiz.$resultWrapper);

			return $personality;
		  }

		/**
		 * Fügt Persönlichkeiten dem Quiz hinzu und zeigt das Ergebnis an.
		 *
		 * @param {Object} quiz - Das Quiz-Objekt.
		 * @param {Object} personality - Die ermittelte Persönlichkeit.
		 * @param {boolean} hasTitle - Gibt an, ob der Titel angezeigt werden soll.
		 * @param {boolean} hasImage - Gibt an, ob das Bild angezeigt werden soll.
		 * @param {boolean} hasDescription - Gibt an, ob die Beschreibung angezeigt werden soll.
		 * @return {jQuery|null} - Das jQuery-Element der Persönlichkeit oder null.
		 */
		function appendPersonalities(quiz, personality, hasTitle, hasImage, hasDescription) {
			const $resultWrapper = quiz.$resultWrapper;
			let $images = $(); // Initialisiere eine leere jQuery-Sammlung
			const ERROR_MSG = '<p>Leider ist ein Fehler bei der Zuordnung von Personalities und Antwortmöglichkeiten aufgetreten, versuchen Sie es noch einmal.</p>';
			
			const $answersWrapper = quiz.$container.find(prefix('answers-wrapper', true));
			const hasNonDefaultMultiplier = $answersWrapper.data('hasNonDefaultMultiplier');
	

			// Überprüfe, ob irgendeine Persönlichkeit Punkte hat
			const hasPoints = self.personalities.some(p => p.count > 0);
			if (!hasPoints) {
				$resultWrapper.append(ERROR_MSG);
				return null;
			}
		
			$resultWrapper.append(`<h2>${personality.name}</h2>`);
		
			// Füge das Canvas-Element für chart.js hinzu
			const $canvas = $('<canvas>', {
				'id': 'conformityChart',
				'style': 'margin-bottom: 1rem; background-color: rgba(233, 239, 247, 0.8); border-radius: 5px; padding: 1em;'
			});
			$resultWrapper.append($canvas);
		
			// Finde die Persönlichkeit mit der höchsten Punktzahl
			const maxCountPersonality = self.personalities.reduce((max, p) => p.count > max.count ? p : max, self.personalities[0]);
		
			let $personality = null; // Deklariere die $personality-Variable
		
			// Ausgabe aller Persönlichkeiten
			self.personalities.forEach((pers, index) => {
				const $image = hasImage && pers.image.file ? $('<img>', {
					'class': 'result-image',
					'src': _getPath(pers.image.file.path),
					'alt': pers.image.alt
				}) : null;
		
				if ($image) $images = $images.add($image); // Füge das Bild zur Sammlung hinzu
		
				const $title = hasTitle ? $('<h2>', { 'html': pers.name }) : null;
				const $description = hasDescription ? $('<p>', {
					'html': pers.description,
					'class': 'description'
				}) : null;
		
				if (hasTitle || hasImage || hasDescription) {
					$personality = $('<div>', {
						'class': 'personality-wrapper',
						'data-index': index,
						'style': pers === maxCountPersonality ? '' : 'display: none;'
					});
					$personality.append($title, $image, $description);
					$resultWrapper.append($personality);
				}
			});

			if ($personality) {
				// Trigger das Event, nachdem das Element hinzugefügt wurde
				quiz.trigger('personalityCreated');
			}
		
			//Indem $images auf null gesetzt wird, kann späterer Code einfach überprüfen, 
			//ob es Bilder gibt, indem er eine einfache Nullprüfung (if ($images)) durchführt, 
			//anstatt eine Längenprüfung (if ($images.length > 0)). Dies kann den Code klarer und 
			//einfacher machen.
			if ($images.length === 0) {
				$images = null;
			}

			createPersonalityChart(self.personalities, personality, hasNonDefaultMultiplier);
			setInlineImageHeight($images, $personality, $resultWrapper);
			return $personality;
		}

	/**
	 * Bestimmt die Farbe der Balken basierend auf dem Index und der Persönlichkeit.
	 *
	 * @param {number} index - Der Index des Balkens.
	 * @param {Array} labels - Die Labels der Balken.
	 * @param {Object} personality - Die ermittelte Persönlichkeit.
	 * @return {string} - Die Farbe des Balkens.
	 */
	function getBarColor(index, labels, personality) {
		const specialColor = 'rgba(255, 99, 132, 0.6)'; // Pink color for the special bar
		const defaultColor = 'rgba(75, 192, 192, 0.6)'; // Original teal color for other bars
		return labels[index][0] === personality.name ? specialColor : defaultColor;
	}

	/**
	 * Erstellt ein Plugin für die Schaltflächen.
	 *
	 * @return {Object} - Das Plugin-Objekt.
	 */
	function createButtonPlugin() {
		return {
			id: 'buttonPlugin',
			afterDraw: (chart) => {
				if (self.resultDescription) {
					const ctx = chart.ctx;
					chart.data.labels.forEach((_, index) => {
						const x = chart.scales.x.getPixelForTick(index);
						const y = chart.chartArea.bottom - 35;
						const buttonWidth = 80;
						const buttonHeight = 30;

						ctx.fillStyle = '#' + params.buttonColor;
						ctx.fillRect(x - buttonWidth / 2, y, buttonWidth, buttonHeight);

						ctx.strokeStyle = 'white';
						ctx.lineWidth = 1;
						ctx.strokeRect(x - buttonWidth / 2, y, buttonWidth, buttonHeight);

						ctx.fillStyle = 'white';
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.font = '14px Arial';
						ctx.fillText('Details', x, y + buttonHeight / 2);
					});
				}
			}
		};
	}

	/**
	 * Tooltip title callback function for chart.js tooltips.
	 *
	 * @param {Object} tooltipItems - The tooltip items.
	 * @param {Array} personalities - The array of personalities.
	 * @param {boolean} hasNonDefaultMultiplier - Whether non-default multipliers are present.
	 * @return {Array} - The array of tooltip titles.
	 */
	function tooltipTitleCallback(tooltipItems, personalities, hasNonDefaultMultiplier) {
		const index = tooltipItems[0].dataIndex;
		
		if (hasNonDefaultMultiplier){
			return [
				personalities[index].name,
			];
		} else {
			return [
				personalities[index].name,
				`Points: ${personalities[index].count}`
			];
		}
	}

	/**
		 * Creates a conformity chart using chart.js.
		 *
		 * @param {Array} personalities - The array of personality objects.
		 * @param {Object} personality - The current personality object.
		 * @param {boolean} hasNonDefaultMultiplier - Whether non-default multipliers are present.
		 * @param {Object} params - Additional parameters for customization.
	 */
	function createPersonalityChart(personalities, personality, hasNonDefaultMultiplier, params) {
		const ctx = document.getElementById('conformityChart').getContext('2d');
		// Calculate the total count 
		let totalScore;
		let labels, data;
		
		if (hasNonDefaultMultiplier) {
			totalScore = personalities.reduce((sum, p) => sum + p.count, 0);
			labels = personalities.map(p => [
				p.name,
				`Partial Points: ${p.count}`
			]);
			data = personalities.map(p => p.count);
		} else {
			// Labels und Daten vorbereiten
			labels = personalities.map(p => [
				p.name,
				`Conformity: ${Math.floor((p.count / p.occurrence) * 100)}%`,
				`Points: ${p.count} / ${p.occurrence}`
			]);
			data = personalities.map(p => (p.count * 100) / p.occurrence);
		}

		// Initialisiere das Chart
		const barChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					label: hasNonDefaultMultiplier ? `Points (Total Score: ${totalScore})` : `Conformity (%)`,
					data: data,
					backgroundColor: data.map((_, index) => getBarColor(index, labels, personality)),
					borderColor: data.map((_, index) => getBarColor(index, labels, personality).replace('0.6', '1')),
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				scales: {
					y: {
						beginAtZero: true,
						max: hasNonDefaultMultiplier ? undefined : 100,
						ticks: {
							font: { size: 12 },
							stepSize: hasNonDefaultMultiplier ? undefined : 10 // Setzt den Abstand zwischen den Ticks auf der y-Achse
						}
					}
				},
				onClick: handleBarClick,
				plugins: {
					tooltip: {
						callbacks: {
							title: tooltipItems => tooltipTitleCallback(tooltipItems, personalities, hasNonDefaultMultiplier)
						}
					}
				}
			},
			plugins: [createButtonPlugin(params)]
		});

		// Event-Listener für Canvas-Klicks hinzufügen
		ctx.canvas.addEventListener('click', event => handleButtonClick(event, barChart));
	}

		/**
		 * Handhabt Klickereignisse auf den Balken des Charts.
		 *
		 * @param {Object} event - Das Klickereignis.
		 * @param {Array} elements - Die Elemente, die geklickt wurden.
		 */
		function handleBarClick(event, elements) {
			if (elements.length > 0) {
				const index = elements[0].index;
				toggleDescription(index);
			}
		}

		/**
		 * Handhabt Klickereignisse auf die Schaltflächen im Chart.
		 *
		 * @param {Object} event - Das Klickereignis.
		 * @param {Object} chart - Das Chart-Objekt.
		 */
		function handleButtonClick(event, chart) {
			const rect = chart.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
		
			// Werte für Button-Größe
			const buttonWidth = 80;  // Gleicher Wert wie in createButtonPlugin
			const buttonHeight = 30; // Gleicher Wert wie in createButtonPlugin
		
			// Zusätzlicher Bereich um den Button herum (Vergrößerung des Klickbereichs)
			const padding = 10; 
		
			chart.data.labels.forEach((_, index) => {
				const xPosition = chart.scales.x.getPixelForTick(index);
				const yPosition = chart.chartArea.bottom - buttonHeight - padding;
		
				// Überprüfen, ob der Klick innerhalb des erweiterten Button-Bereichs liegt
				if (x >= xPosition - buttonWidth / 2 - padding &&
					x <= xPosition + buttonWidth / 2 + padding &&
					y >= yPosition - padding &&
					y <= yPosition + buttonHeight + padding) {
					toggleDescription(index);
				}
			});
		}

		/**
		 * Blendet alle Persönlichkeitsbeschreibungen aus und zeigt die Beschreibung der ausgewählten Persönlichkeit an.
		 *
		 * @param {number} index - Der Index der ausgewählten Persönlichkeit.
		 */
		function toggleDescription(index) {
			// Blendet alle Persönlichkeits-Wrapper aus
			$('.personality-wrapper').hide();

			 // Zeigt den geklickten Persönlichkeits-Wrapper an
			$('.personality-wrapper[data-index="' + index + '"]').show();
		}
	
		/**
		  The click event listener if animations are enabled.

		  @param {jQuery} $button
		  @param {Object[]} personalities The list of personalities associated with the $button
		*/
		function animatedButtonListener($button, personalities) {
			var animationClass = prefix('button-animate');
			let multiplier;
			$button.addClass(animationClass);
			$button.on('animationend', function () {
				$(this).removeClass(animationClass);
				$(this).off('animationend');
				
				multiplier = $button.data('multiplier') || 1;
				 self.trigger('personality-quiz-answer', {
					personalities: personalities,
					multiplier: multiplier
				  });

			});
		}

		/**
		  Click event handler for disabled animation option.

		  @param {jQuery}
		  @param {Object[]} personalities The personalities associated with the $button
		*/
		function nonAnimatedButtonListener($button, personalities) {
			// Zugriff auf den Multiplier-Wert
			const multiplier = $button.data('multiplier') || 1;

			self.trigger('personality-quiz-answer', {
				personalities: personalities,
				multiplier: multiplier
			  });
		}


		/**
		  Resize the questions with image answers.
		*/
		function resizeColumns($quiz) {
			var rowCount, columns;
			var $answers, $rows;

			columns = getNumColumns();

			$answers = $quiz.find(prefix('image-answers', true));
			$answers.each(function () {
				var $answer, $slide, $alternatives;

				$answer = $(this);
				$rows = $answer.children(prefix('row', true));
				$alternatives = $rows.children(prefix('column', true));

				// NOTE (Emil): Remove the answer-images from the DOM so we can
				// calculate the new column width.
				$alternatives = $alternatives.detach();

				rowCount = Math.ceil($alternatives.length / columns);

				checkRows($answer, $rows, rowCount);

				if (!$alternatives.hasClass(prefix('columns-' + columns))) {
					$alternatives.toggleClass(classes('columns-2', 'columns-3'));
				}

				attachRows($answer, $alternatives, columns);

				// NOTE (Emil): Update the selection after changes.
				$rows = $answer.children(prefix('row', true));
				$slide = $answer.parent().parent();
				var titleHeight = $slide.children(prefix('question-text', true)).outerHeight(true) || 0;
				var imageHeight = $slide.children(prefix('question-image', true)).outerHeight(true) || 0;

				var height = $slide.height() - (titleHeight + imageHeight);

				setAnswerImageHeight($rows, height / $rows.length);
			});
		}

		/**
      		Resize the result screen.
    	*/
		function resizeResult($quiz) {
			var $wrapper, $personality, $image;
			
			$wrapper = self.$resultWrapper;
			$personality = $quiz.find(prefix('personality'));
			$image = $quiz.find(prefix('result-image'));
			
			setInlineImageHeight($image, $personality, self.$resultWrapper);
		}

		/**
		  Resize event handler.

		  @param {Object} event The resize event object.
		*/
		function resize() {
			resizeColumns(self.$wrapper);
			resizeResult(self.$wrapper);
		}

		/**
		  Calculate and set the height of the slides in the quiz.

		  @param {Object} self The quiz object
		  @param {jQuery} $quiz The container for the entire quiz
		*/
		function setQuizHeight(self, $quiz) {
			var height = 0;

			self.$slides.each(function (index, element) {
				var $slide, $image;
				var h = 0;

				$slide = $(element);
				$image = $slide.children(prefix('question-image', true));

				$image.hide();

				if (this.clientHeight > height)
				{
					h = $(this).height();

					if ($image) { h = h * 1.3; }

					height = h;
				}

				$image.show();
			});

			height = Math.max(height, minimumHeight);

			$quiz.height(height);

			self.height = height;
		}

		/**
		  Set the height of all images attached to answer alternatives.

		  @param {jQuery} $quiz The root of the quiz
		*/
		function setAnswerImageHeight($rows, maxRowHeight) {
			var ratio = 9.0 / 16.0;
			var numColumns = getNumColumns();

			$rows.each(function () {
				var imageHeight, heights, width;
				var $row, $columns, $buttons, $images;

				$row = $(this);
				$columns = $row.children();

				$buttons = $columns.children(prefix('image-answer-button', true));
				$images = $columns.children(prefix('image-answer-image', true));

				width = (self.$wrapper.width() / numColumns);
				imageHeight = Math.floor(width * ratio);

				heights = $buttons.map(function (i, e) {
					var $e = $(e);

					$e.css('height', ''); // NOTE (Emil): Unset previous height calculations.

					return $e.height();
				});

				$buttons.height(Math.max.apply(null, heights));
				$images.height(imageHeight);

				// If the size of the containing box is larger than the limit set by
				// maxRowHeight we subtract the difference from the height of the image.
				if (maxRowHeight && $columns.outerHeight() > maxRowHeight) {
					imageHeight -= ($columns.outerHeight() - maxRowHeight);

					$images.height(imageHeight);
				}
			});
		}

		/**
		 * Setzt die Höhe des Ergebnisslides und des Wrappers.
		 *
		 * @param {jQuery} result - Das Ergebnis-Element.
		 * @param {jQuery} wrapper - Das Wrapper-Element.
		 */
		function setResultSlideHeight(result, wrapper) {
			const $personality = wrapper.find('.h5p-personality-quiz-personality');
			const MAX_HEIGHT = '80vh';

			if (self.isExtendedMode){
				if (result) {
					$(result[0]).css('overflow-y', 'auto');
				}

				if (wrapper) {
					$(wrapper[0]).css('height', 'auto');
				}

			} else {

				if ($personality) {
					$personality.css({
						'overflow-y': 'auto',
						'max-height': MAX_HEIGHT,
						'top': '0',
						'transform': 'none'
					});
				}
			}
		}

		  
		/**
		  Internal attach function. Creates the quiz, calculates the height
		  the quiz needs to be and starts canvas rendering if the
		  wheel of fortune animation is enabled.

		  @param {jQuery} $container
		*/
		function attach($container) {
			loadingImages = [];

			self.reset();

			var $quiz = createQuiz(self, params);

			$container.append($quiz);

			// NOTE (Emil): We only want to do the work for a resize event once.
			// Only the resize event call that survives 100 ms is called.
			$(window).resize(function () {
				clearTimeout(resizeEventHandler);
				resizeEventHandler = setTimeout(resize, 100);
			});

			// NOTE (Emil): Wait for images to load, if there are any.
			// If there aren't any images to wait for this function is called immediately.
			$.when.apply(null, loadingImages).done(function () {
				setAnswerImageHeight($quiz.find(prefix('row', true)));
				setQuizHeight(self, $quiz);

				if (animation && params.resultScreen.animation === 'wheel') {
					canvas.width = $container.width() * 0.8;
					canvas.height = $container.height();

					self.wheel = new PersonalityQuiz.WheelAnimation(
						self,
						self.personalities,
						canvas.width,
						canvas.height,
						_getPath
					);
				}

				self.trigger('resize');
			});
		}

		/**
		  Required function for interacting with H5P.

		  @param {jQuery} $container The parent element for the entire quiz.
		*/
		self.attach = function ($container) {
			if (self.$container === undefined) {
				self.$container = $container;

				attach(self.$container);
			}
		};

		/**
		  Sets the result of the personality quiz. Creates the missing
		  elements for the result screen and sets the result on the wheel
		  of fortune animation if it is enabled.

		  @param {Object} personality
		*/
		self.setResult = function (personality) {
			var $personality;
			var backgroundImage = (personality.image.file) && self.resultImagePosition === 'background';
			var inlineImage = false; // Set initial value to false

			// Überprüfe, ob mindestens eine Persönlichkeit ein Bild hat
			if (self.isExtendedMode && self.resultTitle || self.resultDescription) {
				self.personalities.some(function(pers) {
					if (pers.image.file && self.resultImagePosition === 'inline') {
						inlineImage = true;
					}
				});
			} else {
				// Im normalen Modus wird inlineImage basierend auf der einzelnen Persönlichkeit gesetzt
				inlineImage = (personality.image.file) && self.resultImagePosition === 'inline';
			}

			if (self.$canvas) {
				self.wheel.attach(self.$canvas[0]);
				self.wheel.setTarget(personality);
				self.wheel.animate();
			}
			
			// Bestimme die entsprechende Methode zum Hinzufügen der Persönlichkeiten
			$personality = self.isExtendedMode
			? appendPersonalities(self, personality, self.resultTitle, inlineImage, self.resultDescription)
			: appendPersonality(self, personality, self.resultTitle, inlineImage, self.resultDescription);
			// Setze den Hintergrundbild, falls erforderlich
			if (backgroundImage) {
				setPersonalityBackgroundImage(self.$result, $personality, personality);
			}
		};

		/**
		  Searches the personalities for the one with the highest 'count'
		  property. In the case of a tie the first element with the shared
		  highest 'count' is selected.

		  @return {Object} The result personality of the quiz
		*/
		self.calculatePersonality = function () {
			var max = self.personalities[0].count;
			var index = 0;

			self.personalities.forEach(function (personality, i) {
				if (max < personality.count) {
					max = personality.count;
					index = i;
				}
			});

			return self.personalities[index];
		};

		/**
		  Updates the progressbar. Moves the background gradient based
		  on the number of questions answered and updates the text
		  with the current question number and the question total.
		*/
		self.updateProgress = function () {
			var percentage = 100 - (self.answered) * self.slidePercentage;

			var text = interpolate(self.progressText, {
				'question': self.answered + 1,
				'total': self.numQuestions
			});

			self.$progressbar.css('background-position', String(percentage) + '%');
			self.$progressText.html(text);
		};


		/**
		  Moves to the next slide. Toggles visiblity of slides and
		  triggers 'personality-quiz-completed' event upon completion.
		*/
		self.next = function () {
			var answeredAllQuestions = (self.answered === self.numQuestions);

			var $prev = self.$slides.eq(self.index);
			var $curr = self.$slides.eq(self.index + 1);

			$prev.hide();
			$curr.show();

			self.index = self.index + 1;

			if ($curr.hasClass(prefix('question'))) {
				self.updateProgress(self.index);
			}

			if (!self.completed && answeredAllQuestions) {
				self.trigger('personality-quiz-completed');
			}
		};

		/**
		  The click event listener used for all buttons associated with an answer
		  to a question in the personality quiz.

		  @param {Object} event
		*/
		self.answerListener = function (event) {
			var $target, $button;
			var isImage, isButton, buttonListener, personalities;

			$target = $(event.target);
			$button = $target;

			isImage = $target.hasClass(prefix('image-answer-image'));
			isButton = $target.hasClass(prefix('image-answer-button'));

			buttonListener = animatedButtonListener;

			$button = isImage ? $target.siblings().eq(0) : $button;
			$target = (isButton || isImage) ? $target.parent() : $target;

			personalities = $target.attr('data-personality');

			if (personalities) {
				buttonListener  = animation ? animatedButtonListener : nonAnimatedButtonListener;

				buttonListener($button, personalities);

				$target.parent(prefix('answers')).off('click');
			}
		};

		/**
		  Zeros out all personality quiz state variables.
		*/
		self.reset = function () {
			self.personalities.map(function (e) {
				e.count = 0;
				e.occurrence = 0;
			});
			self.index = 0;
			self.answered = 0;
			self.completed = false;
		};

		/**
		  Event handler for the personality quiz start event. Makes the
		  progressbar visible and goes to the next slide.
		*/
		self.on('personality-quiz-start', function () {
			self.$progressbar.show();
			self.next();
		});

		/**
		  Event handler for the personality quiz answer event. Counts
		  up all personalities in the answer matching the given personalities.
		*/
		self.on('personality-quiz-answer', function (event) {
			if (event && event.data) {
				const { personalities, multiplier } = event.data;
				const answers = personalities.split(', ');
				answers.forEach(answer => {
					self.personalities.forEach(personality => {
						if (personality.name === answer) {
							personality.count += multiplier;
						}
					});
				});
				self.answered += 1;
			}
			self.next();
		});

		/**
		  Event handler for the personality quiz completed event. Hides
		  the progressbar, since it is no longer needed. Sets the quiz
		  as completed, calculates the personality and sets the result.
		*/
		self.on('personality-quiz-completed', function () {
			var personality = self.calculatePersonality();

			self.$progressbar.hide();
			self.completed = true;

			self.setResult(personality);

			if (animation && self.resultAnimation === 'fade-in') {
				self.$result.addClass(prefix('fade-in'));
			}
		});

		/**
		  Event handler for the animation end event for the wheel of
		  fortune animation. Sets a fade-out animation and moves
		  the quiz on to the next slide.
		*/
		self.on('wheel-animation-end', function () {
			setTimeout(function () {
				self.$canvas.addClass(prefix('fade-out'));
			}, 500);

			self.$canvas.on('animationend', self.next);
		});

		/**
		  Event handler for the quiz restart event. Empties the root
		  container for the quiz and rebuilds it.
		*/
		self.on('personality-quiz-restart', function () {
			self.$container.empty();
			attach(self.$container);
		});
	}

	PersonalityQuiz.prototype = Object.create(EventDispatcher);
	PersonalityQuiz.prototype.constructor = PersonalityQuiz;

	return PersonalityQuiz;
})(H5P.jQuery, H5P.EventDispatcher);