import React from "react";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing'

export default class RenderArea extends React.PureComponent {
    componentDidUpdate() {
        if (this.props.isSending && (this.props.currentCommand !== -1 && this.props.currentCommand < this.props.object3D.viewModels.length)) {
            this.props.object3D.setIndex(this.props.currentCommand);
        }
    }
    render() {
        return (
            <Canvas
                style={{ width: "75%", height: "92%" }}
                gl={{ antialias: false, autoClear: false }}
                camera={{ fov: 45, near: 0.1, far: 100000, position: [0, -100, 100], autoClear: true }}
            >
                <OrbitControls />
                <color attach="background" args={['#000000']} />
                {
                    this.props.object3D && <primitive object={this.props.object3D.baseObject}>
                    </primitive>
                }
                <EffectComposer>
                </EffectComposer>
            </Canvas >
        )
    }

}

