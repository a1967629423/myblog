import * as THREE from 'three';
var Shader = {
    vs: `
    varying vec2 vUv;
    void main()
    {
        vUv = vec2(uv.x,uv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fs: `
    #define pow(x) (x*x)
    #define pow3(x) (x*x*x)
    #define pow4(x) (pow(pow(x)))
    #define pow5(x) (pow3(pow(x)))
    varying vec2 vUv;
    uniform sampler2D map;
    float getMask(vec2 uv)
    {
        vec2 cUV = uv*2.-1.;
        return 1.-(pow(cUV.x*.6)+pow(cUV.y*.6));
    }
    void main()
    {
        vec4 color = vec4(1.);
        color *= texture2D(map,vUv);
        gl_FragColor = color * getMask(vUv);

    }
    `
}
export class VignettingEffect {
    private renderTaget: THREE.WebGLRenderTarget;
    private material: THREE.ShaderMaterial;
    private scene:THREE.Scene = new THREE.Scene();
    private mesh:THREE.Mesh;
    private renderer: THREE.WebGLRenderer;
    private effectCamera: THREE.OrthographicCamera  = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    constructor(renderer: THREE.WebGLRenderer, width: number = 512, height: number = 512) {
        this.renderer = renderer;
        this.renderTaget = new THREE.WebGLRenderTarget(width, height,
            { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
        this.material = new THREE.ShaderMaterial({
            vertexShader:Shader.vs,
            fragmentShader:Shader.fs,
            uniforms:{
                map:{
                    value:this.renderTaget.texture
                }
            }
        });
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);
        this.scene.add(this.mesh);
    }
    getRenderTarget():THREE.WebGLRenderTarget
    {
        return this.renderTaget;
    }
    dispose(): void {

    }
    render(scene: THREE.Scene, camera: THREE.Camera,target?: THREE.WebGLRenderTarget): void {
        if(!target)
        {
            var currentRenderTarget = this.renderer.getRenderTarget();
            scene.updateMatrixWorld();
            if(camera.parent===null) camera.updateMatrixWorld();
            this.renderer.setRenderTarget(this.renderTaget);
            this.renderer.clear();
            this.renderer.render(scene,camera);
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.scene,this.effectCamera);
            this.renderer.setRenderTarget(currentRenderTarget);

        }
        else
        {

        }
    }
    setSize(width: number, height: number): void {

    }
}