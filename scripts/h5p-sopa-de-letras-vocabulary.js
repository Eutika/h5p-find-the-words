(function (SopaDeLetras, EventDispatcher, $) {

  /**
   * Vocabulary - Handles the vocabulary part.
   * @class H5P.SopaDeLetras.Vocabulary
   * @param {Object} params
   * @param {boolean} showVocabulary
   */
  SopaDeLetras.Vocabulary = function (params, showVocabulary, header, wordIcons) {
    /** @alias H5P.SopaDeLetras.Vocabulary# */
    this.words = params;
    this.header = header;
    this.showVocabulary = showVocabulary;
    this.wordIcons = wordIcons;
    this.wordsFound = [];
    this.wordsNotFound = [];
    this.wordsSolved = [];
  };

  SopaDeLetras.Vocabulary.prototype = Object.create(EventDispatcher.prototype);
  SopaDeLetras.Vocabulary.prototype.constructor = SopaDeLetras.Vocabulary;

  /**
   * appendTo - appending vocabulary to the play area.
   * @param {H5P.jQuery} $container
   * @param {string} isModeBlock Either in inline/block mode.
   */
  SopaDeLetras.Vocabulary.prototype.appendTo = function ($container, isModeBlock) {
    let output = '<div class="vocHeading"><em class="fa fa-book fa-fw"></em>' +
      this.header + '</div><ul role="list" tabindex="0">';
    this.words.forEach((element) => {
      const identifierName = element.replace(/ /g, '');
      const iconHtml = this.wordIcons[element] ? 
        `<img src="${this.wordIcons[element].path}" alt="Icon for ${element}" class="word-icon">` : '';
      output += `<li role="presentation"><div role="listitem" aria-label="${identifierName} not found" id="${identifierName}" class="word">
        ${iconHtml}<em class="fa fa-check"></em>${element}</div></li>`;
    });
    output += '</ul>';

    $container.html(output);
    $container.addClass('vocabulary-container');
    this.$container = $container;
    this.setMode(isModeBlock);
  };

  /**
   * setMode - set the vocabularies.
   * @param {string} mode
   */
  SopaDeLetras.Vocabulary.prototype.setMode = function (isModeBlock) {
    this.$container
      .toggleClass('vocabulary-block-container', isModeBlock)
      .toggleClass('vocabulary-inline-container', !isModeBlock);
  };

  /**
   * checkWord - if the marked word belongs to the vocabulary as not found.
   * @param {string} word
   */
  SopaDeLetras.Vocabulary.prototype.checkWord = function (word) {
    const reverse = word.split('').reverse().join('');
    const originalWord = (this.words.indexOf(word) !== -1) ? word : ( this.words.indexOf(reverse) !== -1) ? reverse : null;

    if (!originalWord || this.wordsFound.indexOf(originalWord) !== -1) {
      return false;
    }

    this.wordsFound.push(originalWord);
    if (this.showVocabulary) {
      const idName = originalWord.replace(/ /g, '');
      this.$container.find('#' + idName).addClass('word-found').attr('aria-label', idName + ' found');
    }

    return true;
  };

  /**
   * reset - reset the vocabulary upon game resetting.
   */
  SopaDeLetras.Vocabulary.prototype.reset = function () {
    this.wordsFound = [];
    this.wordsNotFound = this.words;
    if (this.showVocabulary) {
      this.$container.find('.word').each(function () {
        $(this).removeClass('word-found').removeClass('word-solved').attr('aria-label', $(this).attr('id') + ' not found');
      });
    }
  };

  /**
   * solveWords - changes on vocabulary upon showing the solution.
   */
  SopaDeLetras.Vocabulary.prototype.solveWords = function () {
    const that = this;
    that.wordsSolved = that.wordsNotFound;
    if (that.showVocabulary) {
      that.wordsNotFound.forEach(function (word) {
        const idName = word.replace(/ /g, '');
        that.$container.find('#' + idName).addClass('word-solved').attr('aria-label', idName + ' solved');
      });
    }
  };

  /**
   * getNotFound - return the list of words that are not found yet.
   * @return {Object[]}
   */
  SopaDeLetras.Vocabulary.prototype.getNotFound = function () {
    const that = this;
    this.wordsNotFound = this.words.filter(function (word) {
      return (that.wordsFound.indexOf(word) === -1);
    });
    return this.wordsNotFound;
  };

  /**
   * getFound - returns the words found so far.
   * @return {Object[]}
   */
  SopaDeLetras.Vocabulary.prototype.getFound = function () {
    const that = this;
    return this.words.filter(function (word) {
      return (that.wordsFound.indexOf(word) !== -1);
    });
  };

  /**
   * getSolved - get the words solved by the game by show solution feature.
   * @return {Object[]}
   */
  SopaDeLetras.Vocabulary.prototype.getSolved = function () {
    const that = this;
    return this.words.filter(function (word) {
      return (that.wordsSolved.indexOf(word) !== -1);
    });
  };

  return SopaDeLetras.Vocabulary;

}) (H5P.SopaDeLetras, H5P.EventDispatcher, H5P.jQuery);
