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
class Background{
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
    }
    InitCamera() {
        this.Camera.position.set(0, 0, -1)
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
        let testGeometry = new THREE.BufferGeometry();
        testGeometry.addAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0,0]),3))
        this.Scene.add(new THREE.Points(testGeometry,new THREE.PointsMaterial({size:1,transparent:true,color:0xd5bca1})))
    }
    public Render(dt: number) {
        if (this.Renderer) {
             this.Renderer.render(this.Scene, this.Camera)
        }
    }
    public Logic(dt: number) {
        if (this.CtrlOne) {
            this.CtrlOne.rotateY(dt / 10)
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
@Component({ name: 'testBack' })
export default class testBack extends Vue {
    public mounted() {
        const showCanvas = this.$refs.showCanvas
        if (showCanvas instanceof HTMLCanvasElement) {
            const background = new Background(showCanvas)
        }
    }
}
</script>