(function (SopaDeLetras, EventDispatcher, $) {

  /**
   * WordGrid - Handles the word grid part of the game.
   * @class H5P.SopaDeLetras.WordGrid
   * @extends H5P.EventDispatcher
   * @param {Object} params Description.
   */
  SopaDeLetras.WordGrid = function (params) {
    /** @alias H5P.SopaDeLetras.WordGrid# */
    // extending the default parameter set for the grid
    this.options = params;

    EventDispatcher.call(this);

    this.createWordGrid();
  };

  SopaDeLetras.WordGrid.prototype = Object.create(EventDispatcher.prototype);
  SopaDeLetras.WordGrid.prototype.constructor = SopaDeLetras.WordGrid;

  SopaDeLetras.WordGrid.prototype.registerGridEvents = function () {
    const that = this;
    let isSelecting = false;
    let startCell = null;
    let selectedCells = [];
  
    this.$container.on('mousedown touchstart', '.grid-cell', function (e) {
      e.preventDefault();
      isSelecting = true;
      startCell = $(this);
      selectedCells = [startCell];
      that.highlightCells(selectedCells);
      that.trigger('drawStart');
    });
  
    this.$container.on('mousemove touchmove', '.grid-cell', function (e) {
      if (!isSelecting) return;
      
      const currentCell = $(this);
      if (that.isValidSelection(startCell, currentCell)) {
        selectedCells = that.getCellsBetween(startCell, currentCell);
        that.highlightCells(selectedCells);
      }
    });
  
    $(document).on('mouseup touchend', function () {
      if (isSelecting) {
        isSelecting = false;
        const word = that.getWordFromCells(selectedCells);
        const wordObject = {
          start: [parseInt(startCell.attr('data-row')), parseInt(startCell.attr('data-col'))],
          end: [parseInt(selectedCells[selectedCells.length - 1].attr('data-row')), 
                parseInt(selectedCells[selectedCells.length - 1].attr('data-col'))],
          dir: that.getDirection(startCell, selectedCells[selectedCells.length - 1])
        };
        that.trigger('drawEnd', {'markedWord': word, 'wordObject': wordObject});
      }
    });
  };
  
  SopaDeLetras.WordGrid.prototype.isValidSelection = function (start, end) {
    const startRow = parseInt(start.attr('data-row'));
    const startCol = parseInt(start.attr('data-col'));
    const endRow = parseInt(end.attr('data-row'));
    const endCol = parseInt(end.attr('data-col'));
    
    return startRow === endRow || startCol === endCol || 
           Math.abs(endRow - startRow) === Math.abs(endCol - startCol);
  };
  
  SopaDeLetras.WordGrid.prototype.getCellsBetween = function (start, end) {
    const cells = [];
    const startRow = parseInt(start.attr('data-row'));
    const startCol = parseInt(start.attr('data-col'));
    const endRow = parseInt(end.attr('data-row'));
    const endCol = parseInt(end.attr('data-col'));
    
    const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
    const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;
    
    let currentRow = startRow;
    let currentCol = startCol;
    
    while (currentRow !== endRow || currentCol !== endCol) {
      cells.push(this.$container.find(`.grid-cell[data-row="${currentRow}"][data-col="${currentCol}"]`));
      currentRow += rowStep;
      currentCol += colStep;
    }
    cells.push(end);
    return cells;
  };
  
  SopaDeLetras.WordGrid.prototype.highlightCells = function (cells) {
    this.$container.find('.grid-cell').removeClass('highlighted');
    cells.forEach(cell => cell.addClass('highlighted'));
  };
  
  SopaDeLetras.WordGrid.prototype.getWordFromCells = function (cells) {
    return cells.map(cell => cell.text()).join('');
  };
  
  SopaDeLetras.WordGrid.prototype.getDirection = function (start, end) {
    const startRow = parseInt(start.attr('data-row'));
    const startCol = parseInt(start.attr('data-col'));
    const endRow = parseInt(end.attr('data-row'));
    const endCol = parseInt(end.attr('data-col'));
  
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;
  
    if (rowDiff === 0 && colDiff > 0) return 'horizontal';
    if (rowDiff === 0 && colDiff < 0) return 'horizontalBack';
    if (rowDiff > 0 && colDiff === 0) return 'vertical';
    if (rowDiff < 0 && colDiff === 0) return 'verticalUp';
    if (rowDiff > 0 && colDiff > 0) return 'diagonal';
    if (rowDiff > 0 && colDiff < 0) return 'diagonalBack';
    if (rowDiff < 0 && colDiff > 0) return 'diagonalUp';
    if (rowDiff < 0 && colDiff < 0) return 'diagonalUpBack';
  };

  // get i th element position based on the current position for different orientations
  const orientations = {
    horizontal: function (x, y, i) {
      return {
        x: x + i,
        y: y
      };
    },
    horizontalBack: function (x, y, i) {
      return {
        x: x - i,
        y: y
      };
    },
    vertical: function (x, y, i) {
      return {
        x: x,
        y: y + i
      };
    },
    verticalUp: function (x, y, i) {
      return {
        x: x,
        y: y - i
      };
    },
    diagonal: function (x, y, i) {
      return {
        x: x + i,
        y: y + i
      };
    },
    diagonalBack: function (x, y, i) {
      return {
        x: x - i,
        y: y + i
      };
    },
    diagonalUp: function (x, y, i) {
      return {
        x: x + i,
        y: y - i
      };
    },
    diagonalUpBack: function (x, y, i) {
      return {
        x: x - i,
        y: y - i
      };
    }
  };

  /*
   * Determines if an orientation is possible given the starting square (x,y),
   * the height (h) and width (w) of the puzzle, and the length of the word (l).
   * Returns true if the word will fit starting at the square provided using
   * the specified orientation.
   */
  const checkOrientations = {
    horizontal: function (x, y, h, w, l) {
      return w >= x + l;
    },
    horizontalBack: function (x, y, h, w, l) {
      return x + 1 >= l;
    },
    vertical: function (x, y, h, w, l) {
      return h >= y + l;
    },
    verticalUp: function (x, y, h, w, l) {
      return y + 1 >= l;
    },
    diagonal: function (x, y, h, w, l) {
      return (w >= x + l) && (h >= y + l);
    },
    diagonalBack: function (x, y, h, w, l) {
      return (x + 1 >= l) && (h >= y + l);
    },
    diagonalUp: function (x, y, h, w, l) {
      return (w >= x + l) && (y + 1 >= l);
    },
    diagonalUpBack: function (x, y, h, w, l) {
      return (x + 1 >= l) && (y + 1 >= l);
    }
  };

  /*
   *  Determines the next possible valid square given the square (x,y) was ]
   *  invalid and a word lenght of (l).  This greatly reduces the number of
   *  squares that must be checked. Returning {x: x+1, y: y} will always work
   *  but will not be optimal.
   */
  const skipOrientations = {
    horizontal: function (x, y) {
      return {
        x: 0,
        y: y + 1
      };
    },
    horizontalBack: function (x, y, l) {
      return {
        x: l - 1,
        y: y
      };
    },
    vertical: function (x, y) {
      return {
        x: 0,
        y: y + 100
      };
    },
    verticalUp: function (x, y, l) {
      return {
        x: 0,
        y: l - 1
      };
    },
    diagonal: function (x, y) {
      return {
        x: 0,
        y: y + 1
      };
    },
    diagonalBack: function (x, y, l) {
      return {
        x: l - 1,
        y: x >= l - 1 ? y + 1 : y
      };
    },
    diagonalUp: function (x, y, l) {
      return {
        x: 0,
        y: y < l - 1 ? l - 1 : y + 1
      };
    },
    diagonalUpBack: function (x, y, l) {
      return {
        x: l - 1,
        y: x >= l - 1 ? y + 1 : y
      };
    }
  };

  /**
   * calcOverlap - returns the overlap if the word can be fitted with the grid parameters provided.
   * @param {string} word Word to be fitted.
   * @param {Object[]} wordGrid Grid to which word needs to be fitted.
   * @param {number} x Starting x cordinate.
   * @param {nuber} y Starting y cordinate.
   * @param {function} fnGetSquare Function to get the next grid pos as per the specified direction.
   * @return {number} Overlap value if it can be fitted , -1 otherwise.
   */
  const calcOverlap = function (word, wordGrid, x, y, fnGetSquare) {
    let overlap = 0;

    // traverse the squares to determine if the word fits
    for (let index = 0 ; index < word.length; index++) {
      const next = fnGetSquare(x, y, index);
      const square = wordGrid[next.y][next.x];
      if (square === word[index]) {
        overlap++;
      }
      else if (square !== '') {
        return -1;
      }
    }

    return overlap;
  };

  /**
   * findBestLocations - Find the best possible location for a word in the grid.
   * @param {Object[]} wordGrid
   * @param {Object} options
   * @param {string} word
   */
  const findBestLocations = function (wordGrid, options, word) {
    const locations = [];
    const height = options.height;
    const width = options.width;
    const wordLength = word.length;
    let maxOverlap = 0;

    options.orientations.forEach(function (orientation) {

      const check = checkOrientations[orientation];
      const next = orientations[orientation];
      const skipTo = skipOrientations[orientation];

      let x = 0;
      let y = 0;

      while (y < height) {
        if (check(x, y, height, width, wordLength)) {
          const overlap = calcOverlap(word, wordGrid, x, y, next);
          if (overlap >= maxOverlap || (!options.preferOverlap && overlap > -1 )) {
            maxOverlap = overlap;
            locations.push({
              x: x,
              y: y,
              orientation: orientation,
              overlap: overlap
            });
          }
          x++;
          if ( x >= width) {
            x = 0;
            y++;
          }
        }
        else {
          const nextPossible = skipTo(x, y, wordLength);
          x = nextPossible.x;
          y = nextPossible.y;
        }
      }
    });
    return locations;
  };

  /**
   * placeWordInGrid - find the best location and place the word.
   * @param {Object[]} wordGrid
   * @param {Object} options
   * @param {string} word
   */
  const placeWordInGrid = function (wordGrid, options, word) {
    const locations = findBestLocations(wordGrid, options, word);
    if (locations.length === 0) {
      return false;
    }

    const selectedLoc = locations[Math.floor(Math.random() * locations.length)];
    for (let index = 0; index < word.length; index++) {
      const next = orientations[selectedLoc.orientation](selectedLoc.x, selectedLoc.y, index);
      wordGrid[next.y][next.x] = word[index];
    }
    return true;
  };

  /**
   * fillGrid - Create an empty grid and fill it with words.
   * @param {Object[]} words Description.
   * @param {Object} options Description.
   * @return {Object[]|null} Grid array if all words can be fitted, else null.
   */
  const fillGrid = function (words, options) {
    const wordGrid = [];
    for (let i = 0; i < options.height; i++) {
      wordGrid[i] = [];
      for (let j = 0; j < options.width; j++) {
        wordGrid[i][j] = '';
      }
    }

    for (const i in words) {
      if (!placeWordInGrid(wordGrid, options, words[i])) {
        return null;
      }
    }
    return wordGrid;
  };

  /**
   * fillBlanks - fill the unoccupied spaces with blanks.
   * @param {Object[]} wordGrid
   * @param {string} fillPool
   * @return {Object[]} Resulting word grid.
   */
  const fillBlanks = function (wordGrid, fillPool) {
    for (let i = 0; i < wordGrid.length; i++) {
      for (let j = 0;j < wordGrid[0].length; j++) {
        if (!wordGrid[i][j]) {
          const randomLetter = Math.floor(Math.random() * fillPool.length);
          wordGrid[i][j] = fillPool[randomLetter];
        }
      }
    }
    return wordGrid;
  };

  /**
   * calculateCordinates - function to calculate the cordinates & grid postions at which the event occured.
   * @param {number} x X-cordinate of the event.
   * @param {number} y Y-cordinate of the event.
   * @param {number} elementSize Current element size.
   * @return {Object[]} [normalized x, normalized y, row ,col].
   */
  const calculateCordinates = function (x, y, elementSize) {
    const row1 = Math.floor(x / elementSize);
    const col1 = Math.floor(y / elementSize);
    const x_click = row1 * elementSize + (elementSize / 2);
    const y_click = col1 * elementSize + (elementSize / 2);
    return [x_click, y_click, row1, col1];
  };

  /*
   * function to  process the line drawn to find if it is a valid marking
   * in terms of possible grid directions
   * returns directional value if it is a valid marking
   * else return false
   */

  /**
   * getValidDirection - process the line drawn to find if it is a valid marking.
   * @param {number} x1 Starting x cordinate.
   * @param {number} y1 Starting y cordinate.
   * @param {number} x2 Ending x cordinate.
   * @param {number} y2 Ending y cordinate.
   * @return {Object[]|boolean} Direction array if a valid marking, false otherwise.
   */
  const getValidDirection = function (x1, y1, x2, y2) {
    const dirx = (x2 > x1) ? 1 : ((x2 < x1) ? -1 : 0);
    const diry = (y2 > y1) ? 1 : ((y2 < y1) ? -1 : 0);
    let y = y1;
    let x = x1;

    if (dirx !== 0) {
      while (x !== x2) {
        x = x + dirx;
        y = y + diry;
      }
    }
    else {
      while (y !== y2) {
        y = y + diry;
      }
    }

    if (y2 === y) {
      return [dirx, diry];
    }
    else {
      return false;
    }
  };

  /**
   * touchHandler - Mapping touchevents to corresponding mouse events.
   * @param {Object} event Description.
   */
  const touchHandler = function (event) {
    const touches = event.changedTouches;
    const  first = touches[0];
    const simulatedEvent = document.createEvent('MouseEvent');

    let type = '';
    switch (event.type) {
      case 'touchstart':
        type = 'mousedown';
        break;
      case 'touchmove':
        type = 'mousemove';
        break;
      case 'touchend':
        type = 'mouseup';
        break;
      default:
        return;
    }

    // Created and fire a simulated mouse event
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
      first.screenX, first.screenY,
      first.clientX, first.clientY, false,
      false, false, false, 0 /*left*/, null);
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  };

  SopaDeLetras.WordGrid.prototype.createWordGrid = function () {
    let wordGrid = null ;
    let attempts = 0;

    // sorting the words by length speedup the word fitting algorithm
    const wordList = this.options.vocabulary.slice(0).sort(function (a, b) {
      return (a.length < b.length);
    });

    while (!wordGrid) {
      while (!wordGrid && attempts++ < this.options.maxAttempts) {
        wordGrid = fillGrid(wordList, this.options);
      }

      // if grid cannot be formed in the current dimensions
      if (!wordGrid) {
        this.options.height++;
        this.options.width++;
        attempts = 0;
      }
    }

    // fill in empty spaces with random letters
    if (this.options.fillBlanks) {
      wordGrid = fillBlanks(wordGrid, this.options.fillPool);
    }

    // set the output puzzle
    this.wordGrid = wordGrid;
  };

  /**
   * markWord - mark the word on the output canvas (permanent).
   * @param {Object} wordParams
   */
  SopaDeLetras.WordGrid.prototype.markWord = function (wordParams) {
    const startRow = wordParams.start[2];
    const startCol = wordParams.start[3];
    const endRow = wordParams.end[2];
    const endCol = wordParams.end[3];
  
    const cells = this.getCellsBetween(
      this.$container.find(`.grid-cell[data-row="${startRow}"][data-col="${startCol}"]`),
      this.$container.find(`.grid-cell[data-row="${endRow}"][data-col="${endCol}"]`)
    );
  
    cells.forEach(cell => cell.addClass('word-found'));
  };

  /**
   * mark - mark the words if they are not found.
   * @param {Object[]} wordList
   */
  SopaDeLetras.WordGrid.prototype.mark = function (wordList) {
    const words = wordList;
    const that = this;
    const options = {
      height: this.wordGrid.length,
      width: this.wordGrid[0].length,
      orientations: this.options.orientations,
      preferOverlap: this.options.preferOverlap
    };
    const found = [];
    const notFound = [];

    words.forEach(function (word) {
      const locations = findBestLocations(that.wordGrid, options, word);
      if (locations.length > 0 && locations[0].overlap === word.length) {
        locations[0].word = word;
        found.push(locations[0]);
      }
      else {
        notFound.push(word);
      }
    });

    this.markSolution(found);
  };

  /**
   * markSolution.
   * @param {Object[]} solutions
   */
  SopaDeLetras.WordGrid.prototype.markSolution = function (solutions) {
    solutions.forEach(solution => {
      const startCell = this.$container.find(`.grid-cell[data-row="${solution.y}"][data-col="${solution.x}"]`);
      const endCell = this.$container.find(`.grid-cell[data-row="${solution.y + solution.word.length - 1}"][data-col="${solution.x + solution.word.length - 1}"]`);
      
      const wordParams = {
        start: [0, 0, solution.y, solution.x],
        end: [0, 0, solution.y + solution.word.length - 1, solution.x + solution.word.length - 1],
        directionKey: this.getDirectionKey(startCell, endCell)
      };
  
      this.markWord(wordParams);
    });
  };
  /**
   * disableGrid.
   */
  SopaDeLetras.WordGrid.prototype.disableGrid = function () {
    this.options.gridActive = false;
  };

  /**
   * enableGrid.
   */
  SopaDeLetras.WordGrid.prototype.enableGrid = function () {
    this.options.gridActive = true;
  };

  /**
   * appendTo - Placing the container for drawing the grid.
   * @param {H5P.jQuery} $container
   * @param {number} elementSize
   */
  SopaDeLetras.WordGrid.prototype.appendTo = function ($container, elementSize) {
    this.$container = $container;
    this.elementSize = elementSize;
    
    // Create the grid container
    const $grid = $('<div>', {
      class: 'puzzle-container',
      role: 'grid',
      tabindex: '0'
    }).appendTo(this.$container);
  
    // Create grid cells
    this.wordGrid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        $('<div>', {
          class: 'grid-cell',
          text: letter.toUpperCase(),
          'data-row': rowIndex,
          'data-col': colIndex
        }).appendTo($grid);
      });
    });
  
    // Set grid dimensions
    const gridWidth = this.wordGrid[0].length * elementSize;
    const gridHeight = this.wordGrid.length * elementSize;
    $grid.css({
      width: gridWidth + 'px',
      height: gridHeight + 'px',
      display: 'grid',
      gridTemplateColumns: `repeat(${this.wordGrid[0].length}, 1fr)`
    });
  
    this.registerGridEvents();
  };

  SopaDeLetras.WordGrid.prototype.resetHighlighting = function () {
    this.$container.find('.grid-cell').removeClass('highlighted word-found');
  };

  SopaDeLetras.WordGrid.prototype.registerGridEvents = function () {
  
    // Add touch event handling
    this.$container.on('touchstart', '.grid-cell', function (e) {
      e.preventDefault();
      $(this).trigger('mousedown');
    });
  
    this.$container.on('touchmove', '.grid-cell', function (e) {
      e.preventDefault();
      const touch = e.originalEvent.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.classList.contains('grid-cell')) {
        $(element).trigger('mousemove');
      }
    });
  
    $(document).on('touchend', function (e) {
      e.preventDefault();
      $(document).trigger('mouseup');
    });

    $(document).on('mouseup touchend', function () {
      if (isSelecting) {
        isSelecting = false;
        const word = that.getWordFromCells(selectedCells);
        const wordObject = {
          start: [parseInt(startCell.attr('data-row')), parseInt(startCell.attr('data-col'))],
          end: [parseInt(selectedCells[selectedCells.length - 1].attr('data-row')), 
                parseInt(selectedCells[selectedCells.length - 1].attr('data-col'))],
          dir: that.getDirectionKey(startCell, selectedCells[selectedCells.length - 1])
        };
        that.trigger('drawEnd', {'markedWord': word, 'wordObject': wordObject});
      }
    });
  };

  SopaDeLetras.WordGrid.prototype.getDirectionKey = function (start, end) {
    const direction = this.getDirection(start, end);
    const directionMap = {
      'horizontal': 'horizontal',
      'horizontalBack': 'horizontalBack',
      'vertical': 'vertical',
      'verticalUp': 'verticalUp',
      'diagonal': 'diagonal',
      'diagonalBack': 'diagonalBack',
      'diagonalUp': 'diagonalUp',
      'diagonalUpBack': 'diagonalUpBack'
    };
    return directionMap[direction];
  };

  return SopaDeLetras.WordGrid;

}) (H5P.SopaDeLetras, H5P.EventDispatcher, H5P.jQuery);
