import * as THREE from 'three'
import { DepthRefactor } from './lib/DepthRefactor'
var water_normal1 = require('../../images/texture/water/Water_1_M_Normal.jpg')
var water_normal2 = require('../../images/texture/water/Water_2_M_Normal.jpg')
var Shader = {
    vertexShader:`
    #define PI 3.14159265358
    uniform mat4 textureMatrix;
    uniform float uTime;
    varying vec2 vUv;
    varying vec4 coordUV;
    varying float cDistance;
    varying float yDistance;
    void main(){
        vUv = vec2(uv.x,uv.y);
        coordUV = textureMatrix * vec4(position,1.0);
        vec4 m_Position = modelMatrix * vec4(position,1.0);
        yDistance+=sin((vUv.y+ uTime/3.)*PI*2.)/8.+cos((vUv.x+uTime/12.)*PI*3.)/8.;
        m_Position.y += yDistance;
        vec4 mv_Position = viewMatrix *  m_Position;
        cDistance = -mv_Position.z;
        gl_Position = projectionMatrix * mv_Position;
    }
    `,
    fragmentShader:`
    #include <packing>
    uniform sampler2D tPerDepth;
    uniform sampler2D tOrtDepth;
    uniform sampler2D tPerColor;
    uniform sampler2D wNormal1;
    uniform sampler2D wNormal2;
    uniform mat4 textureMatrix;
    uniform float uTime;
    uniform vec3 baseColor;
    uniform vec3 deepColor;
    uniform vec4 config;
    uniform vec2 flowDirection;
    varying vec2 vUv;
    varying vec4 coordUV;
    varying float cDistance;
    varying float yDistance;
    float readDepthOrt( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = orthographicDepthToViewZ( fragCoordZ, 0.1, 2000. );
        return viewZToOrthographicDepth( viewZ, 0.1, 2000. );
    }
    float readDepthPer( sampler2D depthSampler, vec4 coord ) {
        float near = 0.1;
        float far = 2000.;
        float fragCoordZ = texture2DProj( depthSampler, coord ).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, near, far ) ;
        return viewZToPerspectiveDepth( viewZ, near, far );
        //return viewZ;
    }

    float readDepthViewZPer( sampler2D depthSampler, vec2 coord ) {
        float near = 0.1;
        float far = 2000.;
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = (1./((fragCoordZ*(1./far-1./near)+1./near)))-cDistance;
        return viewZ;
    }
    float readDepthViewZOrt(sampler2D depthSampler,vec2 coord)
    {
        float near = 0.1;
        float far = 2000.;
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        //float viewZ = (1./((fragCoordZ*(1./far-1./near)+1./near)));
        float viewZ = (fragCoordZ*(far-near)-near)+yDistance;
        return viewZ;
    }
    float perDepthGradual(float depth,float offset,vec2 uv)
    {
        float near = 0.1;
        float far = 2000.;
        float viewZ = max((readDepthViewZPer(tPerDepth,uv) - depth),near);
        return smoothstep(0.0,offset,viewZ);

    }
    float ortDepthGradual(float depth,float offset)
    {
        float near = 0.1;
        float far = 2000.;
        float viewZ = max((readDepthViewZOrt(tOrtDepth,vUv) - depth)/offset,near);
        return 1.-(1./(viewZ)-1./near)/(1./far-1./near);
    }
    void main(){
        float flowMapOffset1 = config.x;
        float flowMapOffset2 = config.y;
        float halfCycle = config.z;
        float scale = config.w;
        vec2 ortUV = vUv;
        vec3 coord = coordUV.xyz / coordUV.w;
        vec2 perUV = coord.xy;
        
        vec4 color = vec4(1.0);
        vec2 flow = flowDirection;
        flow.x *= -1.;

        vec4 normalColor1 = texture2D(wNormal1,(vUv)+flow*flowMapOffset1);
        vec4 normalColor2 = texture2D(wNormal2,(vUv)+flow*flowMapOffset2);
        float flowLerp = abs(halfCycle - flowMapOffset1)/halfCycle;
        vec4 normalColor = mix(mix(normalColor1,normalColor2,flowLerp),vec4(0.5,0.5,0.5,1.0),1.-perDepthGradual(0.,4.,perUV));
        vec3 normal = normalize(vec3(normalColor.r*2.0-1.0,normalColor.b,normalColor.g*2.0-1.0));
        vec2 uv = coord.xy+coord.z * normal.xz*0.05;
        color *= texture2D(tPerColor,uv);
        vec3 shallow = vec3(.9);
        color.rgb *= mix(mix(deepColor,baseColor,perDepthGradual(6.,20.,uv)),shallow,1.-perDepthGradual(0.,4.,uv));
        gl_FragColor = color;
    }
    `
}
export class SeaMesh extends THREE.Mesh {
    depthRef: DepthRefactor;
    depthRenderTarget: THREE.WebGLRenderTarget;
    colorRenderTarget: THREE.WebGLRenderTarget;
    textureMatrix:THREE.Matrix4 = new THREE.Matrix4();
    clock:THREE.Clock = new THREE.Clock(true);
    cycle:number;
    halfCycle:number;
    flowSpeed:number
    constructor(geometry?: THREE.Geometry|THREE.BufferGeometry, option:any = {}) {
        super(geometry)
        this.cycle = 1.5;
        this.halfCycle = this.cycle/2;
        this.flowSpeed = option.flowSpeed ||0.03;
        this.depthRef = new DepthRefactor(geometry, option);
        this.depthRenderTarget = this.depthRef.getOrthographicRenderTarget();
        this.colorRenderTarget = this.depthRef.getPerspectiveRenderTarget();
        let loader = new THREE.TextureLoader();
        this.material = new THREE.ShaderMaterial({
            vertexShader:Shader.vertexShader,
            fragmentShader:Shader.fragmentShader,
            uniforms:{
                uTime:{
                    vaule:0.0
                },
                tPerDepth:{
                    value:this.colorRenderTarget.depthTexture
                },
                tOrtDepth:{
                    value:this.depthRenderTarget.depthTexture
                },
                tPerColor:{
                    value:this.colorRenderTarget.texture
                },
                baseColor:{
                    value:new THREE.Color(0x7fffd4)
                },
                deepColor:{
                    value:new THREE.Color(0x458b74)
                },
                textureMatrix:{
                    value:this.textureMatrix
                },
                wNormal1:{
                    value:null
                },
                wNormal2:{
                    value:null
                },
                config:{
                    value:new THREE.Vector4(0,this.halfCycle,this.halfCycle,1.0)
                },
                flowDirection:{
                    value:new THREE.Vector2(1,1)
                },
            },transparent:true
        });
        loader.load(water_normal1,(tex)=>{
            tex.wrapS  = THREE.RepeatWrapping;
            tex.wrapT  = THREE.RepeatWrapping;
            let material = (<THREE.ShaderMaterial>this.material);
            material.uniforms.wNormal1.value = tex;
            material.needsUpdate = true;
        })
        loader.load(water_normal2,tex=>{
            tex.wrapS  = THREE.RepeatWrapping;
            tex.wrapT  = THREE.RepeatWrapping;
            let material = (<THREE.ShaderMaterial>this.material);
            material.uniforms.wNormal2.value = tex;
            material.needsUpdate = true;
        })
    }
    updateFlow()
    {
        let delta = this.clock.getDelta();
        var config = (<THREE.ShaderMaterial>this.material).uniforms.config;

        config.value.x+= this.flowSpeed*delta;
        config.value.y  = config.value.x + this.halfCycle;
        if(config.value.x>=this.cycle)
        {
            config.value.x = 0;
            config.value.y = this.halfCycle;
        } else if(config.value.y>=this.cycle)
        {
            config.value.y = config.value.y - this.cycle;
        }
    }
    onBeforeRender = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
        this.visible = false;
        let shaderMaterial = (<THREE.ShaderMaterial>this.material);
        this.updateFlow();
        shaderMaterial.uniforms.uTime.value = this.clock.getElapsedTime();
        shaderMaterial.needsUpdate = true;
        
        this.depthRef.matrixWorld.copy(this.matrixWorld);
        this.depthRef.beforeRender(renderer,scene,camera);
        this.textureMatrix.copy(this.depthRef.textureMatrix);
        this.visible = true;

    }
}