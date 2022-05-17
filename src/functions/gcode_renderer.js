import * as THREE from 'three';

class GCodeViewModel {
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
        this.baseObject = new THREE.Mesh();

        this.motionGroup = new THREE.Group();

        this.motionGeo = new THREE.BufferGeometry();
        this.motionPositions = [];
        this.motionColors = [];
        this.motionMat = new THREE.LineBasicMaterial({
            opacity: 0.01,
            transparent: true,
            linewidth: 1,
            vertexColors: true
        });

        // this.motionIncGeo = new THREE.BufferGeometry();
        // this.motionIncPositions = [];
        // this.motionsIncColors = [];
        // this.motionIncMat = new THREE.LineBasicMaterial({
        //     opacity: 1,
        //     transparent: true,
        //     linewidth: 1,
        //     vertexColors: true
        // });

        // this.feedAllGeo = new THREE.BufferGeometry();
        // this.feedAllColors = [];
        // this.feedAllPositions = [];

        this.feedGeo = new THREE.BufferGeometry();
        this.feedPositions = [];
        this.feedColors = [];
        this.feedMat = new THREE.LineBasicMaterial({
            opacity: 0.9,
            transparent: true,
            linewidth: 2,
            vertexColors: true
        });

        this.feedIncGeo = new THREE.BufferGeometry();
        this.feedIncPositions = [];
        this.feedIncColors = [];
        this.feedIncMat = new THREE.LineBasicMaterial({
            opacity: 0.01,
            transparent: true,
            linewidth: 1,
            vertexColors: true
        });

        this.lastLine = { x: 0, y: 0, z: 0, e: 0, f: 0 };
        this.relative = false;

        this.bounds = {
            min: { x: 100000, y: 100000, z: 100000 },
            max: { x: -100000, y: -100000, z: -100000 }
        };

        this.geometryHandlers = {
            G0: (viewModel) => {
                const newLine = {};

                viewModel.code.words.forEach((word) => {
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            var p = word.letter.toLowerCase();
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

                const p1 = new THREE.Vector3(this.lastLine.x, this.lastLine.y, this.lastLine.z);
                const p2 = new THREE.Vector3(newLine.x, newLine.y, newLine.z);

                const color = new THREE.Color(0xdddddd);
                this.motionPositions.push(p1.x, p1.y, p1.z);
                this.motionPositions.push(p2.x, p2.y, p2.z);

                this.motionColors.push(color.r, color.g, color.b);
                this.motionColors.push(color.r, color.g, color.b);

                this.lastLine = newLine;

                return this.motionPositions;
            },
            G1: (viewModel) => {
                const newLine = {};

                debugger

                viewModel.code.words.forEach((word) => {
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            var p = word.letter.toLowerCase();
                            newLine[p] = this.absolute(this.lastLine[p], parseFloat(word.value));
                            break;
                        default: break;
                    }
                });

                ['x', 'y', 'z', 'e', 'f'].forEach((prop) => {
                    if (newLine[prop] === undefined) {
                        newLine[prop] = this.lastLine[prop];
                    }
                });

                var color = GCodeRenderer.feedColorsPreset[viewModel.code.index % GCodeRenderer.feedColorsPreset.length];
                var p1 = new THREE.Vector3(this.lastLine.x, this.lastLine.y, this.lastLine.z);
                var p2 = new THREE.Vector3(newLine.x, newLine.y, newLine.z);

                viewModel.vertexIndex = this.feedIncPositions.length;

                this.feedIncColors.push(color.r, color.g, color.b);
                this.feedIncColors.push(color.r, color.g, color.b);
                this.feedIncPositions.push(p1.x, p1.y, p1.z);
                this.feedIncPositions.push(p2.x, p2.y, p2.z);

                // this.feedAllPositions.push(p1.x, p1.y, p1.z);
                // this.feedAllPositions.push(p2.x, p2.y, p2.z);
                // this.feedAllColors.push(color.r, color.g, color.b);
                // this.feedAllColors.push(color.r, color.g, color.b);

                viewModel.vertexLength = this.feedIncPositions.length - viewModel.vertexIndex;

                this.lastLine = newLine;

                return this.feedIncPositions;
            },
            G2: (viewModel) => {
                const newLine = {};
                const circleParams = {}
                viewModel.code.words.forEach((word) => {
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            const p = word.letter.toLowerCase();
                            newLine[p] = this.absolute(this.lastLine[p], parseFloat(word.value));
                            break;
                        case 'I': case 'J': case 'R':
                            const c = word.letter.toLowerCase();
                            circleParams[c] = parseFloat(word.value);
                            break;
                        default: break;
                    }
                });

                ['x', 'y', 'z', 'e', 'f'].forEach((prop) => {
                    if (newLine[prop] === undefined) {
                        newLine[prop] = this.lastLine[prop];
                    }
                });

                ['i', 'j', 'r'].forEach((prop) => {
                    if (circleParams[prop] === undefined) {
                        circleParams[prop] = 0;
                    }
                })


                const start = new THREE.Vector2(this.lastLine.x, this.lastLine.y);
                const end = new THREE.Vector2(newLine.x, newLine.y)
                const center = circleParams.r !== 0
                    ? new THREE.Vector2((this.lastLine.x + newLine.x) / 2, this.lastLine.y - Math.sqrt(Math.pow(circleParams.r, 2) - Math.pow(newLine.x - ((this.lastLine.x + newLine.x) / 2), 2)))
                    : new THREE.Vector2(this.lastLine.x + circleParams.i, this.lastLine.y + circleParams.j)
                const radius = circleParams.r ? circleParams.r : center.distanceTo(start);

                let startAngle = new THREE.Vector2(start.x - center.x, start.y - center.y).angle();
                let endAngle = new THREE.Vector2(end.x - center.x, end.y - center.y).angle();
                let rotation = 0;

                if (startAngle >= endAngle) {
                    startAngle = startAngle - (2 * Math.PI);
                }

                const curve = new THREE.EllipseCurve(
                    center.x, center.y,            // ax, aY
                    radius, radius,           // xRadius, yRadius
                    startAngle, endAngle,  // aStartAngle, aEndAngle
                    true,            // aClockwise
                    rotation                 // aRotation
                );


                const pointsSize = 20 * Math.ceil(radius) - 1;

                const points = curve.getPoints(pointsSize);

                debugger


                viewModel.vertexIndex = this.feedIncPositions.length;

                for (let i = 0; i < points.length - 1; i++) {
                    const color = GCodeRenderer.feedColorsPreset[i % GCodeRenderer.feedColorsPreset.length];
                    const p1 = new THREE.Vector3(points[i].x, points[i].y, this.lastLine.z);
                    const p2 = new THREE.Vector3(points[i + 1].x, points[i + 1].y, this.lastLine.z);


                    this.feedIncColors.push(color.r, color.g, color.b);
                    this.feedIncColors.push(color.r, color.g, color.b);
                    this.feedIncPositions.push(p1.x, p1.y, p1.z);
                    this.feedIncPositions.push(p2.x, p2.y, p2.z);


                    // this.feedAllPositions.push(p1.x, p1.y, p1.z);
                    // this.feedAllPositions.push(p2.x, p2.y, p2.z);
                    // this.feedAllColors.push(color.r, color.g, color.b);
                    // this.feedAllColors.push(color.r, color.g, color.b);
                }

                viewModel.vertexLength = this.feedIncPositions.length - viewModel.vertexIndex;

                this.lastLine = newLine;

                debugger

                return this.feedIncPositions;
            },
            G3: (viewModel) => {
                const newLine = {};
                const circleParams = {}
                viewModel.code.words.forEach((word) => {
                    switch (word.letter) {
                        case 'X': case 'Y': case 'Z': case 'E': case 'F':
                            const p = word.letter.toLowerCase();
                            newLine[p] = this.absolute(this.lastLine[p], parseFloat(word.value));
                            break;
                        case 'I': case 'J': case 'R':
                            const c = word.letter.toLowerCase();
                            circleParams[c] = parseFloat(word.value);
                            break;
                        default: break;
                    }
                });

                ['x', 'y', 'z', 'e', 'f'].forEach((prop) => {
                    if (newLine[prop] === undefined) {
                        newLine[prop] = this.lastLine[prop];
                    }
                });

                ['i', 'j', 'r'].forEach((prop) => {
                    if (circleParams[prop] === undefined) {
                        circleParams[prop] = 0;
                    }
                })


                const start = new THREE.Vector2(this.lastLine.x, this.lastLine.y);
                const end = new THREE.Vector2(newLine.x, newLine.y)
                const center = circleParams.r !== 0
                    ? new THREE.Vector2((this.lastLine.x + newLine.x) / 2, this.lastLine.y - Math.sqrt(Math.pow(circleParams.r, 2) - Math.pow(newLine.x - ((this.lastLine.x + newLine.x) / 2), 2)))
                    : new THREE.Vector2(this.lastLine.x + circleParams.i, this.lastLine.y + circleParams.j)
                const radius = circleParams.r ? circleParams.r : center.distanceTo(start);

                let startAngle = new THREE.Vector2(start.x - center.x, start.y - center.y).angle();
                let endAngle = new THREE.Vector2(end.x - center.x, end.y - center.y).angle();
                let rotation = 0;

                if (startAngle >= endAngle) {
                    startAngle = startAngle - (2 * Math.PI);
                }

                const curve = new THREE.EllipseCurve(
                    center.x, center.y,            // ax, aY
                    radius, radius,           // xRadius, yRadius
                    startAngle, endAngle,  // aStartAngle, aEndAngle
                    false,            // aClockwise
                    rotation                 // aRotation
                );

                const pointsSize = 20 * Math.floor(radius) - 1;

                const points = curve.getPoints(pointsSize);

                viewModel.vertexIndex = this.feedIncPositions.length;

                for (let i = 0; i < points.length - 1; i++) {
                    const color = GCodeRenderer.feedColorsPreset[i % GCodeRenderer.feedColorsPreset.length];
                    const p1 = new THREE.Vector3(points[i].x, points[i].y, this.lastLine.z);
                    const p2 = new THREE.Vector3(points[i + 1].x, points[i + 1].y, this.lastLine.z);

                    this.feedIncColors.push(color.r, color.g, color.b);
                    this.feedIncColors.push(color.r, color.g, color.b);
                    this.feedIncPositions.push(p1.x, p1.y, p1.z);
                    this.feedIncPositions.push(p2.x, p2.y, p2.z);

                    // this.feedAllPositions.push(p1.x, p1.y, p1.z);
                    // this.feedAllPositions.push(p2.x, p2.y, p2.z);
                    // this.feedAllColors.push(color.r, color.g, color.b);
                    // this.feedAllColors.push(color.r, color.g, color.b);


                }

                viewModel.vertexLength = this.feedIncPositions.length - viewModel.vertexIndex;

                this.lastLine = newLine;

                debugger

                return this.feedIncPositions;
            }
        }; // end geometryHandlers

        this.materialHandlers = {
            G0: (viewModel) => {
                return this.motionMat;
            },
            G1: (viewModel) => {
                return this.feedMat;
            },
            G2: (viewModel) => {
                return this.feedMat;
            }
        }; // end materialHandlers

    }
    absolute(v1, v2) {
        return this.relative ? v1 + v2 : v2;
    }
    render(model) {
        this.model = model;

        this.model.codes.forEach((code) => {
            this.renderGCode(code);
        });

        this.updateLines();

        // this.feedIncPositions.setAttribute('position', new THREE.Float32BufferAttribute(this.feedAllPositions, 3));
        // this.feedIncPositions.setAttribute('color', new THREE.Float32BufferAttribute(this.feedAllColors, 3))

        // Center
        this.feedIncGeo.computeBoundingBox();
        this.bounds = this.feedIncGeo.boundingBox;

        // console.log(this.bounds)

        this.center = new THREE.Vector3(
            this.bounds.min.x + ((this.bounds.max.x - this.bounds.min.x) / 2),
            this.bounds.min.y + ((this.bounds.max.y - this.bounds.min.y) / 2),
            this.bounds.min.z + ((this.bounds.max.z - this.bounds.min.z) / 2)
        );

        this.baseObject.position.set(-this.center.x, -this.center.y, 0);
        return this;
    }
    /**
     * add viewModels as Lines to baseObject
     */
    updateLines() {

        while (this.baseObject.children.length > 0) {
            this.baseObject.remove(this.baseObject.children[0]);
        }

        this.feedIncGeo.setAttribute('position', new THREE.Float32BufferAttribute(this.feedIncPositions, 3));
        this.feedIncGeo.setAttribute('color', new THREE.Float32BufferAttribute(this.feedIncColors, 3));


        this.feedGeo.setAttribute('position', new THREE.Float32BufferAttribute(this.feedPositions, 3));
        this.feedGeo.setAttribute('color', new THREE.Float32BufferAttribute(this.feedColors, 3));

        this.motionGeo.setAttribute('position', new THREE.Float32BufferAttribute(this.motionPositions, 3));
        this.motionGeo.setAttribute('color', new THREE.Float32BufferAttribute(this.motionColors, 3));


        const motionLine = new THREE.LineSegments(this.motionGeo, this.motionMat);
        const feedLine = new THREE.LineSegments(this.feedGeo, this.feedMat);
        const feedIncLine = new THREE.LineSegments(this.feedIncGeo, this.feedIncMat);

        feedLine.frustumCulled = false;

        console.log(this.motionGroup.children)


        this.baseObject.add(motionLine);
        this.baseObject.add(feedLine);
        this.baseObject.add(feedIncLine);

        // this.baseObject.add(new THREE.Line(this.feedAllGeo, this.feedMat))
    }
    /**
     * updates this.viewModel
     * @param {Object} code 
     */
    renderGCode(code) {
        var cmd = code.words[0].letter + code.words[0].value;
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
            throw new Error(`invalid index: ${index}`);
        }

        debugger
        const vm = this.viewModels[index];
        this.feedPositions = [];
        this.feedColors = [];

        this.feedPositions = this.feedIncPositions.slice(0, vm.vertexIndex + vm.vertexLength);

        this.feedColors = this.feedIncColors.slice(0, vm.vertexIndex + vm.vertexLength);

        this.index = index;
        this.updateLines();
    }
};

GCodeRenderer.motionColorsPreset = [new THREE.Color(0xdddddd)]
GCodeRenderer.feedColorsPreset = [
    new THREE.Color(0x66ccff), // sky
    new THREE.Color(0x22bb22), // honeydew
    new THREE.Color(0xcc66ff), // lavender
    new THREE.Color(0xfffe66), // banana
    new THREE.Color(0xff6666) // salmon
]

