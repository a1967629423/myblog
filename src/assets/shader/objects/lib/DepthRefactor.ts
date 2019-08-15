import * as THREE from 'three'
export class DepthRefactor extends THREE.Mesh{
    private ColorRenderTarget:THREE.WebGLRenderTarget;
    private DepthRenderTarget:THREE.WebGLRenderTarget;
    private virtualCamera:THREE.PerspectiveCamera;
    private virtualCamera1:THREE.OrthographicCamera;
    private refractorPlane:THREE.Plane = new THREE.Plane();
    private width:number;
    private height:number;
    public textureMatrix:THREE.Matrix4 = new THREE.Matrix4();
    public getPerspectiveRenderTarget()
    {
        return this.ColorRenderTarget;
    }
    public getOrthographicRenderTarget()
    {
        return this.DepthRenderTarget;
    }
    constructor(geometry?: THREE.Geometry | THREE.BufferGeometry | undefined,option:any={}) {
        super(geometry)
        let width = this.width = option.width|512;
        let height = this.height = option.height|512;
        let planeWidth = option.planeWidth|20;
        let planeHeight = option.planeHeight|20;
        this.ColorRenderTarget = new THREE.WebGLRenderTarget(width,height,{format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
        this.ColorRenderTarget.depthBuffer = true;
        this.ColorRenderTarget.depthTexture = new THREE.DepthTexture(width,height);
        this.DepthRenderTarget = new THREE.WebGLRenderTarget(width,height,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
        this.DepthRenderTarget.depthBuffer = true;
        this.DepthRenderTarget.depthTexture = new THREE.DepthTexture(width,height);
        if(!THREE.Math.isPowerOfTwo(width)||!THREE.Math.isPowerOfTwo(height))
        {
            this.ColorRenderTarget.texture.generateMipmaps = false;
            this.DepthRenderTarget.texture.generateMipmaps = false;
        }
        this.virtualCamera = new THREE.PerspectiveCamera();
        this.virtualCamera.matrixAutoUpdate = false;
        this.virtualCamera1 = new THREE.OrthographicCamera(-planeWidth/2,planeWidth/2,planeHeight/2,-planeHeight/2);
    }
    isvisible = (()=>{
        var refractorWorldPosition = new THREE.Vector3();
        var cameraWorldPosition = new THREE.Vector3();
        var rotationMatrix = new THREE.Matrix4();
        var view = new THREE.Vector3();
        var normal = new THREE.Vector3();
        return (camera:THREE.Camera):boolean => {
            refractorWorldPosition.setFromMatrixPosition(this.matrixWorld);
            cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
            view.subVectors(refractorWorldPosition,cameraWorldPosition);
            rotationMatrix.extractRotation(this.matrixWorld);
            normal.set(0,0,1);
            normal.applyMatrix4(rotationMatrix);
            return view.dot(normal)<0;
        }
    })();
    updateRefractorPlane = (()=>{
        var normal = new THREE.Vector3();
        var position = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();
        var scale = new THREE.Vector3();
        return ()=>{
            this.matrixWorld.decompose(position,quaternion,scale);
            normal.set(0,0,1).applyQuaternion(quaternion).normalize();

            normal.negate();
            this.refractorPlane.setFromNormalAndCoplanarPoint(normal,position);
        }
    })();
    updateTextureMatrix(camera:THREE.Camera)
    {
        this.textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );
        this.textureMatrix.multiply(camera.projectionMatrix);
        this.textureMatrix.multiply(camera.matrixWorldInverse);
        this.textureMatrix.multiply(this.matrixWorld);
    }
    updateVirtualCamera = (()=>{
        var clipPlan = new THREE.Plane();
        var clipVector = new THREE.Vector4();
        var q = new THREE.Vector4();
        var refractorWorldPosition = new THREE.Vector3();
        var rotationMatrix = new THREE.Matrix4();
        var normal = new THREE.Vector3();
        return (camera:THREE.Camera)=>{
            this.virtualCamera.matrixWorld.copy(camera.matrixWorld);
            this.virtualCamera.matrixWorldInverse.getInverse(this.virtualCamera.matrixWorld)
            this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
            this.virtualCamera.matrix.copy(camera.matrix);
            if('aspect' in (<any>camera))
            {
                this.virtualCamera.aspect = (<any>camera).aspect;
            }
            if('far' in (<any>camera))
            {
                this.virtualCamera.far = (<any>camera).far;
            }
             //这里对深度进行修正并反转使得可以通过在z处增加offset来实现clip操作
            // clipPlan.copy(this.refractorPlane);
            // clipPlan.applyMatrix4(this.virtualCamera.matrixWorldInverse);

            // clipVector.set(clipPlan.normal.x,clipPlan.normal.y,clipPlan.normal.z,clipPlan.constant);
           
            // var projectionMatrix = this.virtualCamera.projectionMatrix;
            // q.x = ( Math.sign( clipVector.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
            // q.y = ( Math.sign( clipVector.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
            // q.z = - 1.0;
            // q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

            // clipVector.multiplyScalar(2.0/clipVector.dot(q));

            // projectionMatrix.elements[2] = clipVector.x;
            // projectionMatrix.elements[ 6 ] = clipVector.y;
            // projectionMatrix.elements[ 10 ] = clipVector.z + 1.0 + offset;
            // projectionMatrix.elements[ 14 ] = clipVector.w;

            refractorWorldPosition.setFromMatrixPosition(this.matrixWorld);
            rotationMatrix.extractRotation(this.matrixWorld);
            normal.set(0,0,1);
            normal.applyMatrix4(rotationMatrix);
            normal.add(refractorWorldPosition);
            if(!this.geometry.boundingBox)
            {
                this.geometry.computeBoundingBox();
            }
            let max = this.geometry.boundingBox.max;
            let min = this.geometry.boundingBox.min;
            this.virtualCamera1.position.copy(normal);
            this.virtualCamera1.lookAt(refractorWorldPosition);
            this.virtualCamera1.right = max.x;
            this.virtualCamera1.left = min.x;
            this.virtualCamera1.top = max.y;
            this.virtualCamera1.bottom = min.y;
            this.virtualCamera1.updateMatrixWorld();
            this.virtualCamera1.updateProjectionMatrix();
        }
    })()
    render(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera)
    {
        let currentRenderTarget = renderer.getRenderTarget();
        let currentVrEnable = renderer.vr.enabled;
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
        renderer.vr.enabled = false;
        renderer.shadowMap.autoUpdate = false;

        renderer.setRenderTarget(this.DepthRenderTarget);
        renderer.clear();
        renderer.render(scene,this.virtualCamera1);
        renderer.setRenderTarget(this.ColorRenderTarget);
        renderer.clear();
        renderer.render(scene,this.virtualCamera);
        
        renderer.setRenderTarget(currentRenderTarget);
        renderer.vr.enabled = currentVrEnable;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    }
    beforeRender(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera)
    {
        if(!this.isvisible(camera))return;
        this.updateTextureMatrix(camera);
        //this.updateRefractorPlane();
        this.updateVirtualCamera(camera);
        this.render(renderer,scene,camera);
    }
}