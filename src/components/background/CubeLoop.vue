<template>
    <canvas id="background" ref="showCanvas"></canvas>
</template>
<style lang="scss">
#background {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import * as THREE from 'three'
import { MStateMachine, StateEvents } from '../../utile/StateMachine'
import { VignettingEffect } from '../../assets/shader/Vignetting'
import {ParticleSystem} from '../../assets/shader/ParticleSystem'
const { State, StateMachine } = MStateMachine
declare module '../../utile/StateMachine' {
    export interface StateEvents {
        update: Function
    }
}
class PopBox {
    public BoxMesh: THREE.Mesh

    public SM = new StateMachine()
    public upState = this.SM.createState('upState')
    public downState = this.SM.createState('downState')
    public bottom_idleState = this.SM.createStateAsDefault('bottom_idle')
    public top_idleState = this.SM.createState('top_idle')
    time: number = Math.random() * Math.PI * 2
    Rx: number = Math.random() * 0.9 + 0.1
    Ry: number = Math.random() * 0.9 + 0.1
    Rz: number = Math.random() * 0.9 + 0.1
    timestep: number = Math.random() * 0.9 + 0.1
    constructor(mesh: THREE.Mesh) {
        this.BoxMesh = mesh
        this.upState.on('update', (dt: number) => {
            this.BoxMesh.position.z -= dt * 2
            if (this.BoxMesh.position.z <= -2) {
                this.BoxMesh.position.z = -2
                this.SM.changeState(this.top_idleState)
            }
        })
        this.downState.on('update', (dt: number) => {
            this.BoxMesh.position.z += dt * 2
            if (this.BoxMesh.position.z >= 0) {
                this.BoxMesh.position.z = 0
                this.SM.changeState(this.bottom_idleState)
            }
        })
        this.top_idleState.on('start', () => {
            setTimeout(() => {
                this.SM.changeState(this.downState)
            }, 500)
        })
        this.BoxMesh.rotation.set(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        )
    }
    switchState() {
        if (this.SM.nowState === this.bottom_idleState) {
            this.SM.changeState(this.upState)
        }
    }

    update(dt: number) {
        //this.SM.emit('update', dt)
        if (
            this.BoxMesh.morphTargetInfluences &&
            this.BoxMesh.morphTargetInfluences.length > 0
        ) {
            this.BoxMesh.morphTargetInfluences[0] =
                ((Math.sin(this.time) + 1) / 2) * 0.92 + 0.08
        }
        this.time += dt * this.timestep
        this.BoxMesh.rotateX(dt * this.Rx)
        this.BoxMesh.rotateY(dt * this.Ry)
        this.BoxMesh.rotateZ(dt * this.Rz)
    }
}
class Background {
    constructor(canvas: HTMLCanvasElement) {
        this.Canvas = canvas
        this.Init()
    }
    Scene: THREE.Scene = new THREE.Scene()
    Camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera()
    Renderer: THREE.WebGLRenderer | null = null
    LastStamp: DOMHighResTimeStamp = 0
    EffectMaterial: THREE.ShaderMaterial | null = null
    Canvas: HTMLCanvasElement
    // LinesCtrl
    CtrlOne: THREE.Object3D | null = null
    Boxs: PopBox[] = []
    Vignetting: VignettingEffect | null = null
    PSystem:ParticleSystem | null =null;
    FrameFunc: (dt: DOMHighResTimeStamp) => void = this.Frame.bind(this)
    Init() {
        this.InitCamera()
        this.Renderer = new THREE.WebGLRenderer({ canvas: this.Canvas });
        this.Renderer.setClearColor(0xffffff);
        this.Renderer.setPixelRatio(window.devicePixelRatio);
        this.InitEffect()
        this.InitObject()
        this.InitLight()
        requestAnimationFrame(this.FrameFunc)
        addEventListener('resize', this.SetCameraAndRenderer.bind(this))
        this.SetCameraAndRenderer()
        // setInterval(() => {
        //     for (let i = 0; i < 10; i++) {
        //         let randidx = Math.floor(Math.random() * this.Boxs.length)
        //         let box = this.Boxs[randidx]
        //         if (box) {
        //             box.switchState()
        //         }
        //     }
        // }, 1000)
    }
    InitEffect() {
        if (this.Renderer)
            this.Vignetting = new VignettingEffect(this.Renderer, window.innerWidth*2, window.innerHeight*2)
    }
    InitCamera() {
        this.Camera.position.set(0, 0,-40)
        this.Camera.lookAt(0, 0, 0)
        this.Scene.add(this.Camera)
    }
    SetCameraAndRenderer() {
        this.Camera.aspect = window.innerWidth / window.innerHeight
        this.Camera.updateProjectionMatrix()
        if (this.Renderer)
            this.Renderer.setSize(window.innerWidth, window.innerHeight)
        if (this.EffectMaterial) {
            this.EffectMaterial.uniforms.Resolution.value = [
                window.innerWidth / 2,
                window.innerHeight / 2
            ]
        }
        if(this.Vignetting)
        {
            this.Vignetting.setSize(window.innerWidth*2,window.innerHeight*2);
        }
    }
    static GenerateBox(
        x: number = 0,
        y: number = 0,
        z: number = 0
    ): THREE.Mesh {
        const boxGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 2, 2, 2)
        const basicMateral = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            morphTargets: true
        })
        boxGeometry.morphAttributes.position = []
        var positions = boxGeometry.attributes.position.array
        var morphPositions = []
        for (let i = 0; i < positions.length; i += 3) {
            var n_x: number = positions[i]
            var n_y: number = positions[i + 1]
            var n_z: number = positions[i + 2]

            morphPositions.push(
                n_x *
                    Math.sqrt(
                        1 -
                            (n_y * n_y) / 2 -
                            (n_z * n_z) / 2 +
                            (n_y * n_y * n_z * n_z) / 3
                    ),
                n_y *
                    Math.sqrt(
                        1 -
                            (n_z * n_z) / 2 -
                            (n_x * n_x) / 2 +
                            (n_z * n_z * n_x * n_x) / 3
                    ),
                n_z *
                    Math.sqrt(
                        1 -
                            (n_x * n_x) / 2 -
                            (n_y * n_y) / 2 +
                            (n_x * n_x * n_y * n_y) / 3
                    )
            )
        }
        boxGeometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(
            morphPositions,
            3
        )
        const BoxMesh = new THREE.Mesh(boxGeometry, basicMateral)
        // if (BoxMesh.morphTargetInfluences) {
        //     BoxMesh.morphTargetInfluences[0] = 1
        // }
        BoxMesh.castShadow = true
        BoxMesh.receiveShadow = true
        BoxMesh.position.set(x, y, z)
        return BoxMesh
    }
    InitLight() {
        const directLight = new THREE.DirectionalLight(0xdfebff, 0.2)
        directLight.position.set(10, 10, -20)
        // directLight.castShadow = true
        // const shadowCamera = directLight.shadow.camera
        // const d = 100
        // shadowCamera.bottom = -d
        // shadowCamera.top = d
        // shadowCamera.left = -d
        // shadowCamera.right = d
        // shadowCamera.far = d
        // shadowCamera.near = 0
        //directLight.shadow.mapSize.set(1024, 1024)
        this.Scene.add(directLight)
        this.Scene.add(new THREE.AmbientLight(0x666666))
        // if (this.Renderer) {
        //     this.Renderer.shadowMap.enabled = true
        //     this.Renderer.shadowMap.type = THREE.PCFSoftShadowMap
        // }
    }
    InitObject() {
        const AllCtrl = new THREE.Group()
        for (let i = 0; i <= 40; i++) {
            const l = Math.random() * 20 + 20
            const r = Math.random() * 2 * Math.PI
            const x = Math.cos(r) * l
            const z = Math.sin(r) * l
            const y = Math.random() * 20 - 10
            const popBox = new PopBox(Background.GenerateBox(x, y, z))
            AllCtrl.add(popBox.BoxMesh)
            this.Boxs.push(popBox)
        }
        this.CtrlOne = AllCtrl
        this.Scene.add(AllCtrl)
        var system = new ParticleSystem();
        this.PSystem = system;
        var cp = this.Camera.position;
        system.position.set(cp.x,cp.y,cp.z+3);
        system.setSpawnConf({velocity:new THREE.Vector3(30,-30,1),positionRandomness:new THREE.Vector3(40,0,20),position:new THREE.Vector3(-15,12,0),lifetime:4,scale:30,count:2})
        this.Scene.add(system);
    }
    public Render(dt: number) {
        if (this.Renderer) {
            if (this.Vignetting) {
                this.Vignetting.render(this.Scene, this.Camera)
            } else {
                this.Renderer.render(this.Scene, this.Camera)
            }
        }
    }
    public Logic(dt: number) {
        this.Boxs.forEach(box => {
            box.update(dt)
        })
        if (this.CtrlOne) {
            this.CtrlOne.rotateY(dt / 10)
        }
        if(this.PSystem)
        {
            this.PSystem.spawnParticle();
            this.PSystem.update(dt);
        }
    }
    public Frame(stamp: DOMHighResTimeStamp) {
        const dt = (stamp - this.LastStamp) / 1000
        this.LastStamp = stamp
        this.Render(dt)
        this.Logic(dt)
        requestAnimationFrame(this.FrameFunc)
    }
}
@Component({ name: 'CubeLoop' })
export default class CubeLoop extends Vue {
    public mounted() {
        const showCanvas = this.$refs.showCanvas
        if (showCanvas instanceof HTMLCanvasElement) {
            const background = new Background(showCanvas)
        }
    }
}
</script>

