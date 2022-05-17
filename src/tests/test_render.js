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

export class GCodeViewModel {
    constructor(code) {
        this.code = code;
        this.vertexIndex = 0;
        this.vertexLength = 0;
    }
}

export class GCodeRenderer {
    constructor() {
        this.viewModels = [];
        this.index = 0;
        this.baseObject = new THREE.Object3D();

        this.motionPoints = [];
        this.motionGeo = new THREE.BufferGeometry();
        this.motionMat = new THREE.LineBasicMaterial({
            opacity: 0.2,
            transparent: true,
            linewidth: 1,
            vertexColors: THREE.VertexColors
        });

        this.motioniIncPoints = [];
        this.motionIncGeo = new THREE.BufferGeometry();
        this.motionIncMat = new THREE.LineBasicMaterial({
            opacity: 0.2,
            transparent: true,
            linewidth: 1,
            vertexColors: THREE.VertexColors
        });

        this.feedAllPoints = [];
        this.feedAllGeo = new THREE.BufferGeometry();

        this.feedPoints = [];
        this.feedGeo = new THREE.BufferGeometry();
        this.feedMat = new THREE.LineBasicMaterial({
            opacity: 0.8,
            transparent: true,
            linewidth: 2,
            vertexColors: THREE.VertexColors
        });

        this.feedIncPoints = [];
        this.feedIncGeo = new THREE.BufferGeometry();
        this.feedIncMat = new THREE.LineBasicMaterial({
            opacity: 0.2,
            transparent: true,
            linewidth: 2,
            vertexColors: THREE.VertexColors
        });

        this.lastLine = { x: 0, y: 0, z: 0, e: 0, f: 0 };
        this.relative = false;

        this.bounds = {
            min: { x: 100000, y: 100000, z: 100000 },
            max: { x: -100000, y: -100000, z: -100000 }
        };

        this.geometryHandlers = {
            G0: (viewModel) => {
                // console.log("in g0 renderer handler " + code)

                const newLine = {};

                viewModel.code.words.forEach((word) => {
                    // TODO: handle non-numerical values
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            const p = word.letter.toLowerCase();
                            newLine[p] = this.absolute(this.lastLine[p], parseFloat(word.value));
                            break;
                        default:
                            break;
                    }
                });

                ['x', 'y', 'z', 'e', 'f'].forEach((prop) => {
                    if (newLine[prop] === undefined) {
                        newLine[prop] = this.lastLine[prop];
                    }
                });

                viewModel.vertexIndex = this.motionPoints.length;

                // var color =  new THREE.Color(GCodeRenderer.motionColors[viewModel.code.index%GCodeRenderer.motionColors.length]);
                // const color = this.motionColors[viewModel.code.index % this.motionColors.length];
                this.motionPoints.push(new THREE.Vector3(this.lastLine.x, this.lastLine.y, this.lastLine.z));
                this.motionPoints.push(new THREE.Vector3(newLine.x, newLine.y, newLine.z));

                // this.motionGeo.colors.push(color);
                // this.motionGeo.colors.push(color);

                viewModel.vertexLength = this.motionPoints.length - viewModel.vertexIndex;

                this.lastLine = newLine;

                this.motionGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(this.motionPoints), 3));

                return this.motionGeo;
            },
            G1: (viewModel) => {
                // console.log("in g1 renderer handler " + viewModel.code)
                // console.log(this.feedAllGeo.vertices)

                const newLine = {};

                viewModel.code.words.forEach((word) => {
                    // TODO: handle non-numerical values
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            const p = word.letter.toLowerCase();
                            newLine[p] = this.absolute(this.lastLine[p], parseFloat(word.value));
                            break;
                        default:
                            break;
                    }
                });

                ['x', 'y', 'z', 'e', 'f'].forEach((prop) => {
                    if (newLine[prop] === undefined) {
                        newLine[prop] = this.lastLine[prop];
                    }
                });

                // var color =  new THREE.Color(GCodeRenderer.feedColors[viewModel.code.index%GCodeRenderer.feedColors.length]);
                // const color = this.feedColors[viewModel.code.index % this.feedColors.length];
                const p1 = new THREE.Vector3(this.lastLine.x, this.lastLine.y, this.lastLine.z);
                const p2 = new THREE.Vector3(newLine.x, newLine.y, newLine.z);

                viewModel.vertexIndex = this.feedAllPoints.length;

                if (viewModel.code.index <= this.index) {
                    this.feedPoints.push(p1);
                    this.feedPoints.push(p2);
                    // this.feedGeo.colors.push(color);
                    // this.feedGeo.colors.push(color);
                    this.feedGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(this.feedPoints), 3));
                }
                else {
                    // this.feedIncGeo.colors.push(color);
                    // this.feedIncGeo.colors.push(color);
                    this.feedIncPoints.push(p1);
                    this.feedIncPoints.push(p2);
                    this.feedIncGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(this.feedIncPoints), 3));
                }

                this.feedAllPoints.push(p1);
                this.feedAllPoints.push(p2);
                // this.feedAllGeo.colors.push(color);
                // this.feedAllGeo.colors.push(color);

                viewModel.vertexLength = this.feedAllPoints.length - viewModel.vertexIndex;

                this.lastLine = newLine;


                this.feedAllGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(this.feedAllPoints), 3));

                return this.feedGeo;
            },
            G2: function (viewModel) {
            }

        } // end geometryHandlers

        this.materialHandlers = {

            G0: () => {
                return this.motionMat;
            },
            G1: () => {
                return this.feedMat;
            },
            G2: () => {
                return this.feedMat;
            }

        }

        this.motionColors = [new THREE.Color(0xdddddd)];
        this.feedColors = [new THREE.Color(0x66ccff), // sky
        new THREE.Color(0x22bb22), // honeydew
        new THREE.Color(0xcc66ff), // lavender
        new THREE.Color(0xfffe66), // banana
        new THREE.Color(0xff6666) // salmon
        ]
    }


    absolute(v1, v2) {
        return this.relative ? v1 + v2 : v2;
    }

    render(model) {
        model.codes.forEach((code) => {
            this.renderGCode(code);
        });

        this.updateLines();

        // Center
        this.feedAllGeo.computeBoundingBox();
        this.bounds = this.feedAllGeo.boundingBox;

        this.center = new THREE.Vector3(
            this.bounds.min.x + ((this.bounds.max.x - this.bounds.min.x) / 2),
            this.bounds.min.y + ((this.bounds.max.y - this.bounds.min.y) / 2),
            this.bounds.min.z + ((this.bounds.max.z - this.bounds.min.z) / 2));

        var zScale = window.innerHeight / (this.bounds.max.z - this.bounds.min.z),
            yScale = window.innerWidth / (this.bounds.max.y - this.bounds.min.y),
            xScale = window.innerWidth / (this.bounds.max.x - this.bounds.min.x),

            scale = Math.min(zScale, Math.min(xScale, yScale));

        // this.baseObject.position = this.center.multiplyScalar(-scale);
        this.baseObject.scale.multiplyScalar(scale);

        return this.baseObject;
    }

    updateLines() {
        while (this.baseObject.children.length > 0) {
            this.baseObject.remove(this.baseObject.children[0]);
        }

        var motionLine = new THREE.Line(this.motionGeo, this.motionMat);
        var feedLine = new THREE.Line(this.feedGeo, this.feedMat);
        var feedIncLine = new THREE.Line(this.feedIncGeo, this.feedIncMat);
        this.baseObject.add(motionLine);
        this.baseObject.add(feedLine);
        this.baseObject.add(feedIncLine);
    }

    renderGCode(code) {
        const cmd = code.words[0].letter + code.words[0].value;
        const viewModel = new GCodeViewModel(code);

        const geometryHandler = this.geometryHandlers[cmd] || this.geometryHandlers['default'];
        if (geometryHandler) {
            geometryHandler(viewModel);
        }
        const materialHandler = this.materialHandlers[cmd] || this.materialHandlers['default'];
        if (materialHandler) {
            materialHandler(viewModel);
        }

        if (viewModel.vertexLength > 0) {
            this.viewModels.push(viewModel);
        }
    }

    setIndex(index) {
        index = Math.floor(index);
        if (this.index === index) { return; }
        if (index < 0 || index >= this.viewModels.length) {
            throw new Error("invalid index");
        }

        const vm = this.viewModels[index];

        this.feedGeo = new THREE.BufferGeometry();

        const vertices = this.feedAllGeo.vertices.slice(0, vm.vertexIndex + vm.vertexLength);
        Array.prototype.push.apply(this.feedGeo.vertices, vertices);

        const colors = this.feedAllGeo.colors.slice(0, vm.vertexIndex + vm.vertexLength);
        Array.prototype.push.apply(this.feedGeo.colors, colors);


        this.index = index;
        this.updateLines();
    }
}


let input = document.getElementById('file');
input.addEventListener('change', (ev) => {
    let file = ev.target.files[0]
    let reader = new FileReader();
    let parser = new GCodeParser();
    let renderer = new GCodeRenderer();
    let result;

    reader.readAsText(file);

    reader.onload = () => {
        result = parser.parse(reader.result);
        renderer.render(result)
        console.log(renderer)
    }
})
// console.log(file)
