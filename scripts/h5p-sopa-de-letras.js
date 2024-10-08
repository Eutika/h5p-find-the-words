H5P.SopaDeLetras = (function ($, UI) {
  const ELEMENT_MIN_SIZE = 32; // PX
  const ELEMENT_MAX_SIZE = 64; // PX
  const MARGIN = 8; //PX
  const VOCABULARY_INLINE_WIDTH = 200;// PX

  /**
   * SopaDeLetras.
   * @class H5P.SopaDeLetras
   * @extends H5P.EventDispatcher
   * @param {Object} options
   * @param {number} id
   * @param {Object} extras
   */
  function SopaDeLetras(options, id, extras) {
    /** @alias H5P.SopaDeLetras# */
    this.id = id;
    this.extras = extras;
    this.numFound = 0;
    this.isAttempted = false;
    this.isGameStarted = false;
  
    // Ensure options is an object
    options = options || {};
  
    // Ensure wordList exists and is an array
    options.wordList = Array.isArray(options.wordList) ? options.wordList : [];
  
    // Only take the unique words
    const vocabulary = options.wordList.map(item => (item && item.word) || '').filter(Boolean);
    const wordIcons = options.wordList.reduce((acc, item) => {
      if (item && item.word && item.icon) {
        acc[item.word] = {
          path: H5P.getPath(item.icon.path, this.id),
        };
      }
      return acc;
    }, {});
  
    this.options = H5P.jQuery.extend(true, {
      vocabulary: vocabulary,
      height: 5,
      width: 5,
      fillBlanks: true,
      maxAttempts: 5,
      l10n: {
        wordListHeader: 'Find the words'
      }
    }, options);

    H5P.EventDispatcher.call(this);

    this.gridParams = {
      height: this.options.height,
      width: this.options.width,
      orientations: filterOrientations(options.behaviour.orientations),
      fillBlanks: this.options.fillBlanks,
      maxAttempts: this.options.maxAttempts,
      preferOverlap: options.behaviour.preferOverlap,
      vocabulary: this.options.vocabulary,
      gridActive: true,
      fillPool: this.options.behaviour.fillPool
    };

    this.grid = new SopaDeLetras.WordGrid(this.gridParams);
    this.vocabulary = new SopaDeLetras.Vocabulary(
      vocabulary,
      wordIcons,
      this.options.vocabulary,
      this.options.behaviour.showVocabulary,
      this.options.l10n.wordListHeader
    );
    this.registerDOMElements();

    // responsive functionality
    this.on('resize', function () {
      const currentSize = this.elementSize;
      const currentVocMod = this.isVocModeBlock;
      this.calculateElementSize();
      this.setVocabularyMode();

      if (this.elementSize !== currentSize) {
        this.$puzzleContainer.empty();
        this.grid.appendTo(this.$puzzleContainer, this.elementSize );
        this.grid.drawGrid(MARGIN);

        // If there are already marked elements on the grid mark them
        if (!this.grid.options.gridActive) {
          this.grid.enableGrid();
          this.grid.mark(this.vocabulary.getFound());
          this.grid.disableGrid();
          this.grid.mark(this.vocabulary.getSolved());
        }
        else {
          this.grid.mark(this.vocabulary.getFound());
        }

        this.registerGridEvents();
      }

      // vocabulary adjustments on resize
      if (this.options.behaviour.showVocabulary) {
        if (currentVocMod !== this.isVocModeBlock ) {
          this.vocabulary.setMode(this.isVocModeBlock);
          if (this.isVocModeBlock) {
            this.$puzzleContainer.removeClass('puzzle-inline').addClass('puzzle-block');
          }
          else {
            //initial update has to be done manually
            this.$playArea.css({'width': parseInt(this.$gameContainer.width()) + VOCABULARY_INLINE_WIDTH});
            this.$puzzleContainer.removeClass('puzzle-block').addClass('puzzle-inline');
          }
        }
      }

      // Make the playarea just to fit its content
      if (! this.isVocModeBlock) {
        this.$playArea.css({'width': parseInt(this.$gameContainer.width()) + 2});
      }
      else {
        this.$playArea.css({'width': parseInt(this.$puzzleContainer.width()) + 2});
      }
    });
  }

  SopaDeLetras.prototype = Object.create(H5P.EventDispatcher.prototype);
  SopaDeLetras.prototype.constructor = SopaDeLetras;

  // private and all prototype function goes there

  /**
   * filterOrientations - Mapping of directions from semantics to those used by algorithm.
   * @param {Object} directions
   * @return {Object[]}
   */
  const filterOrientations = function (directions) {
    return Object.keys(directions).filter(function (key) {
      return directions[key];
    });
  };

  /**
   * registerDOMElements.
   */
  SopaDeLetras.prototype.registerDOMElements = function () {
    const that = this;

    this.$playArea = $('<div />', {
      class: 'h5p-play-area'
    });

    this.$taskDescription = $('<div />', {
      class: 'h5p-task-description',
      html: this.options.taskDescription,
      tabIndex: 0,
    });

    // timer part
    this.$timer = $('<div/>', {
      class: 'time-status',
      tabindex: 0,
      html: '<span role="term" ><em class="fa fa-clock-o" ></em>' +
        this.options.l10n.timeSpent + '</span >:' +
        '<span role="definition"  class="h5p-time-spent" >0:00</span>'
    });
    this.timer = new SopaDeLetras.Timer(this.$timer.find('.h5p-time-spent'));

    // counter part
    const counterText = that.options.l10n.found
      .replace('@found', '<span class="h5p-counter">0</span>')
      .replace('@totalWords', '<span><strong>' + this.vocabulary.words.length + '</strong></span>');

    this.$counter = $('<div/>', {
      class: 'counter-status',
      tabindex: 0,
      html: '<div role="term"><span role="definition">' + counterText + '</span></div>'
    });
    this.counter = new SopaDeLetras.Counter(this.$counter.find('.h5p-counter'));

    // feedback plus progressBar
    this.$feedback = $('<div/>', {
      class: 'feedback-element',
      tabindex: '0'
    });
    this.$progressBar = UI.createScoreBar(this.vocabulary.words.length, 'scoreBarLabel');

    // buttons section
    that.$submitButton = that.createButton('submit', 'check', that.options.l10n.check, that.gameSubmitted);
    if (this.options.behaviour.enableShowSolution) {
      this.$showSolutionButton = this.createButton('solution', 'eye', this.options.l10n.showSolution, that.showSolutions);
    }
    if (this.options.behaviour.enableRetry) {
      this.$retryButton = this.createButton('retry', 'undo', this.options.l10n.tryAgain, that.resetTask);
    }

    // container elements
    this.$gameContainer = $('<div class="game-container"/>');
    this.$puzzleContainer = $('<div class="puzzle-container puzzle-inline" tabIndex="0" role="grid" />');
    this.$vocabularyContainer = $('<div class="vocabulary-container" tabIndex="0" />');
    this.$footerContainer = $('<div class="footer-container" />');
    this.$statusContainer = $('<div />', {
      class: 'game-status',
      'aria-label': 'game-status',
      role: 'group',
      tabindex: '0'
    });
    this.$feedbackContainer = $('<div class="feedback-container"/>');
    this.$buttonContainer = $('<div class="button-container" />');
  };

  /**
   * createButton - creating all buttons used in this game.
   * @param {string} name Buttonname.
   * @param {string} icon Fa icon name.
   * @param {string} param Button text parameter.
   * @param {function} callback Callback function.
   * @return {H5P.JoubelUI.Button} Joubel ui button object.
   */
  SopaDeLetras.prototype.createButton = function (name, icon, param, callback) {
    const cfunction = callback.bind(this);
    return UI.createButton({
      title: name,
      click: cfunction,
      html: '<span><i class="fa fa-' + icon + '" aria-hidden="true"></i></span>' + param
    });
  };

  /**
   * calculateElementSize - calculate the grid element size according to the container width.
   */
  SopaDeLetras.prototype.calculateElementSize = function () {
    const containerWidth = this.$container.width();
    const gridCol = this.grid.wordGrid[0].length;
    const gridMaxWidth = gridCol * ELEMENT_MAX_SIZE + 2 * MARGIN;
    const gridElementStdSize = (containerWidth - 2 * MARGIN) / gridCol;

    if (gridMaxWidth < containerWidth) {
      this.elementSize = ELEMENT_MAX_SIZE;
    }
    else if (gridElementStdSize > ELEMENT_MIN_SIZE) {
      this.elementSize = gridElementStdSize;
    }
    else {
      this.elementSize = ELEMENT_MAX_SIZE;
    }
  };

  /**
   * setVocabularyMode - set vocabulary mode (either inline or block).
   */
  SopaDeLetras.prototype.setVocabularyMode = function () {
    const gridCol = this.grid.wordGrid[0].length;
    this.isVocModeBlock = (this.$container.width() - (gridCol * this.elementSize + 2 * MARGIN) > VOCABULARY_INLINE_WIDTH) ? false : true;
  };

  /**
   * gameSubmitted - callback function for check button.
   */
  SopaDeLetras.prototype.gameSubmitted = function () {
    const totalScore = this.vocabulary.words.length;
    const scoreText = this.options.l10n.score
      .replace('@score', this.numFound)
      .replace('@total', totalScore);

    this.timer.stop();
    this.$progressBar.setScore(this.numFound);
    this.$feedback.html(scoreText);
    this.$submitButton = this.$submitButton.detach();
    this.grid.disableGrid();

    if (totalScore !== this.numFound) {
      if (this.options.behaviour.enableShowSolution) {
        this.$showSolutionButton.appendTo(this.$buttonContainer);
      }
    }

    if (this.options.behaviour.enableRetry) {
      this.$retryButton.appendTo(this.$buttonContainer);
    }

    this.$feedbackContainer.addClass('feedback-show'); //show feedbackMessage
    this.$feedback.focus();

    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);

    this.trigger('resize');
  };

  /**
   * showSolutions - call back function for show solution button.
   */
  SopaDeLetras.prototype.showSolutions = function () {
    this.grid.disableGrid();
    this.grid.mark(this.vocabulary.getNotFound());
    this.vocabulary.solveWords();
    this.$showSolutionButton.detach();
    this.$vocabularyContainer.focus();
    this.trigger('resize');
  };

  /**
   * resetTask - resetting the game.
   */
  SopaDeLetras.prototype.resetTask = function () {
    this.numFound = 0;
    this.timer.reset();
    this.counter.reset();
    this.$progressBar.reset();
    this.$puzzleContainer.empty();
    this.vocabulary.reset();

    if (this.$showSolutionButton) {
      this.$showSolutionButton.detach();
    }

    this.$retryButton.detach();
    this.$feedbackContainer.removeClass('feedback-show');

    this.grid = new SopaDeLetras.WordGrid(this.gridParams);
    this.grid.appendTo(this.$puzzleContainer, this.elementSize);
    this.grid.drawGrid(MARGIN);
    this.grid.enableGrid();
    this.registerGridEvents();

    this.$submitButton.appendTo(this.$buttonContainer);
    this.$puzzleContainer.focus();

    this.trigger('resize');
  };

  /**
   * Check whether user is able to play the game.
   * @return {boolean}
   */
  SopaDeLetras.prototype.getAnswerGiven = function () {
    return this.isAttempted;
  };

  /**
   *  getScore - Return the score obtained.
   * @return {number}
   */
  SopaDeLetras.prototype.getScore = function () {
    return this.numFound;
  };

  /**
   * Turn the maximum possible score that can be obtained.
   * @return {number}
   */
  SopaDeLetras.prototype.getMaxScore = function () {
    return this.vocabulary.words.length;
  };

  /**
   * getXAPIData - Get xAPI data.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   * @return {Object} xApi data statement
   */
  SopaDeLetras.prototype.getXAPIData = function () {
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  /**
   * addQuestionToXAPI - Add the question to the definition part of an xAPIEvent.
   * @param {H5P.XAPIEvent} xAPIEvent
   */
  SopaDeLetras.prototype.addQuestionToXAPI = function (xAPIEvent) {
    const definition = xAPIEvent.getVerifiedStatementValue(
      ['object', 'definition']
    );
    definition.description = {
      'en-US': this.options.taskDescription
    };
    definition.type =
      'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';
    definition.correctResponsesPattern = [];
    definition.correctResponsesPattern[0] = this.vocabulary.words.join([',']);
  };

  /**
   * Add the response part to an xAPI event.
   * @param {H5P.XAPIEvent} xAPIEvent
   */
  SopaDeLetras.prototype.addResponseToXAPI = function (xAPIEvent) {
    const maxScore = this.getMaxScore();
    const score = this.getScore();
    const success = (score === maxScore);
    const response = this.vocabulary.getFound().join('[,]');

    xAPIEvent.setScoredResult(score, maxScore, this, true, success);
    xAPIEvent.data.statement.result.response = response;
  };

  /**
   * registerGridEvents.
   */
  SopaDeLetras.prototype.registerGridEvents = function () {
    const that = this;

    this.grid.on('drawStart', function () {
      if (!that.isGameStarted) {
        that.timer.play();
        that.triggerXAPI('interacted');
        that.isGameStarted = true;
      }
    });

    this.grid.on('drawEnd', function (event) {
      that.isAttempted = true;
      if (that.vocabulary.checkWord(event.data['markedWord'])) {
        that.numFound++;
        that.counter.increment();
        that.grid.markWord(event.data['wordObject']);
        if (that.numFound === that.vocabulary.words.length) {
          that.gameSubmitted();
        }
      }
    });
  };

  /**
   * attach - main attach function.
   * @param {H5P.jQuery} $container Description.
   */
  SopaDeLetras.prototype.attach = function ($container) {
    this.$container = $container.addClass('h5p-sopa-de-letras');
    this.triggerXAPI('attempted');

    if (this.grid) {
      this.calculateElementSize();
      this.grid.appendTo(this.$puzzleContainer, this.elementSize );
      this.$puzzleContainer.appendTo(this.$gameContainer);
      if (this.options.behaviour.showVocabulary) {
        this.setVocabularyMode();
        this.vocabulary.appendTo(this.$vocabularyContainer, this.isVocModeBlock);
        this.$vocabularyContainer.appendTo(this.$gameContainer);
      }
    }

    this.$timer.appendTo(this.$statusContainer);
    this.$counter.appendTo(this.$statusContainer);

    this.$feedback.appendTo(this.$feedbackContainer);
    this.$progressBar.appendTo(this.$feedbackContainer);

    this.$submitButton.appendTo(this.$buttonContainer);

    //append status and feedback and button containers to footer
    this.$statusContainer.appendTo(this.$footerContainer);
    this.$feedbackContainer.appendTo(this.$footerContainer);
    this.$buttonContainer.appendTo(this.$footerContainer);

    //append description , cards and footer to main container.
    this.$taskDescription.appendTo(this.$playArea);
    this.$gameContainer.appendTo(this.$playArea);
    this.$footerContainer.appendTo(this.$playArea);
    this.$playArea.appendTo(this.$container);

    this.grid.drawGrid(MARGIN);
    this.registerGridEvents();
    this.trigger('resize');
  };

  return SopaDeLetras;

}) (H5P.jQuery, H5P.JoubelUI);
