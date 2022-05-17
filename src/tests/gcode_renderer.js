import * as THREE from 'three';

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