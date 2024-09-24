ss = {
  init: function() {
    function update(e) {
      var val = $('#input').val();
      ss.update(val);
    }
    
    this.wordlist.init(function(){
      $('body').removeClass('loading');
      $('#input').on({'keyup': update, 'change': update}).focus();
      update();
    });

    
  },
  
  update: function(rawVal) {
    var rows = rawVal.split(/\r?\n/);
    var result = [];
    var longest = 0;
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i].trim();
      if (row) {
        var thisRow = [];
        for(var j = 0; j < row.length; j++) {
          var cell = row[j].toUpperCase();
          if (cell == 'Q') {
            cell = 'Qu';
          }
          // check that we're between A and Z
          if (cell.charCodeAt(0) < 65 || cell.charCodeAt(0) > 90) {
            continue;
          }
          thisRow.push(cell);
        }
        result.push(thisRow);
        longest = Math.max(longest, row.length);
      }
    }
    ss.board.build(result);
    ss.display.updateBoard(result);
    
    ss.solveAndUpdateDebounced();
  },
  
  solveAndUpdateDebounced: $.debounce(function(){
      var words = ss.board.solve();
      ss.display.updateWords(words);
    }, 200),
  
  display: {
    updateBoard: function(rows) {
      var board = $('#board');
      board.html('');
      
      for(var i = 0; i < rows.length; i++) {
        var rowElement = $('<div/>').addClass('row');
        var row = rows[i];
        for(var j = 0; j < row.length; j++) {
          var letter = row[j];
          var letterElement = $('<div/>').addClass('letter').text(letter);
          rowElement.append(letterElement);
        }
        board.append(rowElement);
      }
    },
    updateWords: function(words) {
      var el = $('#words');
      el.html('');
      for(var i = 0; i < words.length; i++) {
        $('<li/>').text(words[i]).appendTo(el);
      }
    }
  },
  
  
  wordlist: {
    // USAGE:
    // wordlist.dict.has('TRADITIONAL')
    // wordlist.dict.hasWordsStartingWith('TRADITIO')
    
    
    // maybe we should only call init once the user starts interacting?
    // because it takes a while to initialize (1-2 seconds on chrome), 
    init: function(onSuccess) {
      $.ajax('otcwl2.txt', {dataType: 'text', success: function(wordlist){ss.wordlist.load(wordlist); onSuccess();}});

    },
    
    minWordLength: 4,
    
    load: function(wordlist) {
      var words = wordlist.split(/\r?\n/);
      
      this.dict = new this.Dictionary();
      for(var i = 0; i < words.length; i++) {
        var word = words[i].trim();
        if (word.length >= ss.wordlist.minWordLength) {
          this.dict.add(word);
        }
      }
    },
    
    Dictionary: function() {
        var words_ = {};
        
        this.add = function(word) {
          var char = word.substr(0, 1);
          if (!char) {
            this.isWord = true;
            return;
          }
          
          if (!words_[char]) {
            words_[char] = new ss.wordlist.Dictionary();
          }
          
          words_[char].add(word.substr(1));
        };
        
        this.has = function(word) {
          if (!word) {
            return this.isWord || false;
          }
          var char = word.substr(0, 1);
          
          var nextDict = words_[char];
          if (!nextDict) {
            return false;
          }
          
          return nextDict.has(word.substr(1));
        };
        
        this.hasWordsStartingWith = function(prefix) {
          if (!prefix) {
            return true;
          }

          var char = prefix.substr(0, 1);
          
          var nextDict = words_[char];
          if (!nextDict) {
            return false;
          }
          
          return nextDict.hasWordsStartingWith(prefix.substr(1));

        }

    }
  },
  
  
  board: {
    lettersById: {},
    rows: 0,
    cols: 0,
    
    
    build: function(letters) {
      // an array of arrays: rows of letters, starting from the top-left
      this.lettersById = {};
      
      for(var rowIdx = 0; rowIdx < letters.length; rowIdx++) {
        var row = letters[rowIdx];
        for(var colIdx = 0; colIdx < row.length; colIdx++) {
          var value = row[colIdx];
          var tile = new this.Letter(value, rowIdx, colIdx);
          this.lettersById[tile.id] = tile;
        }
      }
    },
    
    makeId: function(row, col) {
      return col + ',' + row;
    },
        
    Letter: function(letter, row, col) {
      this.letter = letter.toUpperCase();
      this.id = ss.board.makeId(row, col);
      this.row = row;
      this.col = col;
    },
    
    adjacentLetters: function(letter) {
      var result = [];
      for (var dx = -1; dx <= 1; dx++) {
        for(var dy = -1; dy <= 1; dy++) {
          var newId = this.makeId(letter.row + dy, letter.col + dx);
          if (newId != letter.id) {
            var newLetter = this.lettersById[newId];
            if (newLetter) {
              result.push(newLetter);
            }
          }
        }
      }
      return result;
    },
    
    
    solve: function() {
      var start = new Date();
      var result = [];
      var seenWord = {};
      function foundFunc(word) {
        // no duplicates
        if (seenWord[word]) {
          return;
        }
        seenWord[word] = true;
        result.push(word);
      }
      
      for(var letterId in this.lettersById) {
        var letter = this.lettersById[letterId];
        this.walkLetter(letter, foundFunc, {}, '');
      }
      
      var end = new Date();
      //console.log('solved in', (end.getTime() - start.getTime()) / 1000, 's');
      return result;
    },
    
    walkLetter: function(letter, foundFunc, seen, word) {
      seen[letter.id] = true;
      word = word + letter.letter;
      if (ss.wordlist.dict.hasWordsStartingWith(word)) {
        if (ss.wordlist.dict.has(word)) {
          foundFunc(word);
        }
        var adjacent = this.adjacentLetters(letter);
        for(var i = 0; i < adjacent.length; i++) {
          var adjLetter = adjacent[i];
          if (!seen[adjLetter.id]) {
            this.walkLetter(adjLetter, foundFunc, seen, word);
          }
        }
      }
      
      delete seen[letter.id];
    }
    
    
    
  }
  
}