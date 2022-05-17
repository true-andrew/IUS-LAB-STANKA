export class GCodeModel {
    constructor() {
        this.codes = [];
    }

    setSendStatus(i) {
        const newArr = this.codes;
        newArr[i].isSent = true;
        this.codes = [...newArr];
        return this;
    }

    toString() {
        const output = this.codes.map((code, idx) => {
            return <div id={idx} key={idx} className="GCode-command">{code.toString()}</div>;
        });
        return output;
    }
}

export class GCode {
    constructor() {
        this.words = [];
        this.comments = [];
        this.index = 0;
        this.isSent = false;
    }

    toString() {
        let output = "";
        if (this.comments.length > 0) {
            output = this.comments.join(' ') + "\n";
        }

        this.words.forEach(function (word) {
            output += word.toString();
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
        return this.letter + this.value + ' ';
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

        // addComments(line.match(/\((.*)\)$/g, ''));
        addComments(line.match(/\((.*?)\)/g, ''));
        addComments(line.match(/;\s?(.*)/g, ''));

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
        let lines = gcode.replace(/(N\d+)/gi, '');
        lines = lines.split('\n');
        let lineCode, n = 0;
        let current = new GCode();

        for (let i = 1; i < lines.length - 1; i++) {
            let line = lines[i].split(' ');
            if (line[0].toLowerCase() === 'g0' || line[0].toLowerCase() === 'g1') {
                let nextLine = lines[i + 1].split(' ');
                if (nextLine[0].toLowerCase() === 'g0') {
                    continue;
                } else if (nextLine[0].toLowerCase() === 'g1') {
                    continue;
                } else if (['x', 'y', 'z'].includes(nextLine[0][0])) {
                    lines[i + 1] = line[0] + ' ' + lines[i + 1];
                }
            }
        }

        for (let i = 0; i < lines.length; i++) {
            lineCode = this.parseLine(lines[i]);
            // Trying to auto-group words across multiple lines and split single lines
            // eslint-disable-next-line no-loop-func
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

