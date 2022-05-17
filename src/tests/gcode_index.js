export class GCodeModel {
    constructor() {
        this.codes = [];
    }

    toString() {
        let output = "";
        this.codes.forEach(code => {
            output += code.toString() + "\n";
        })
        return output;
    }
}

export class GCode {
    constructor() {
        this.words = [];
        this.comments = [];
        this.index = 0;
    }

    toString() {
        let output = "";
        if (this.comments.length > 0) {
            output = this.comments.join(' ') + "\n";
        }

        this.words.forEach(function (word) {
            output += word.toString() + "\n";
        });

        return output;
    }
}

export class GWord {
    constructor(letter, value, raw) {
        this.letter = letter;
        this.value = value;
        this.raw = raw;
    }

    toString() {
        return this.letter + ":" + this.value + " (" + this.raw + ")";
    }
}

export class GCodeParser {
    constructor() {
        this.model = new GCodeModel();
    }

    parseComments(line) {
        const comments = [];

        function addComments(matches) {
            if (matches) {
                matches.forEach(function (comment) {
                    comments.push(comment);
                });
            }
        }

        addComments(line.match(/\((.*)\)$/g, ''));
        addComments(line.match(/\((.*?)\)/g, ''));
        addComments(line.match(/;(.*$)/g, ''));

        return comments;
    }

    parseWord(word) {
        if (!word.length) {
            throw new Error('Bad word format: "' + word + '"');
        }
        const letter = word[0].toUpperCase();
        let value;

        if ((letter < 'A') || (letter > 'Z')) {
            throw new Error('Unexpected command letter: ' + letter + ' from word: ' + word);
        }

        value = word.slice(1);

        return new GWord(letter, value, word);
    }

    parseLine(line) {
        let words;
        const pLine = new GCode();
        let pWord;

        pLine.comments = this.parseComments(line);
        pLine.comments.forEach(comment => {
            line = line.replace(comment, '');
        });

        words = line.trim().split(' ');

        for (let i = 0; i < words.length; i++) {
            if (!words[i] || words[i].length <= 0) {
                // console.log('skipping blank word');
                continue;
            }

            // console.log('parsing word: "' + words[i] + '"');
            try {
                pWord = this.parseWord(words[i]);
                pLine.words.push(pWord);
            }
            catch (e) {
                console.log(e.message);
            }
        }
        return pLine;
    }

    parse(gcode) {
        const lines = gcode.split('\n');
        let lineCode, n = 0;
        let current = new GCode();

        for (let i = 0; i < lines.length; i++) {
            lineCode = this.parseLine(lines[i]);

            // Trying to auto-group words across multiple lines and split single lines
            lineCode.words.forEach((word) => {
                switch (word.letter) {
                    // Detect new code group, add current group to model & start a new group
                    case 'G': case 'M':
                        if (current.words.length > 0) {
                            this.model.codes.push(current);
                            current = new GCode();
                            current.index = ++n;
                        }
                        break;
                    default: break;
                }
                current.words.push(word);
            });
        }
        this.model.codes.push(current);
        return this.model;

    }
}