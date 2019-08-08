import * as THREE from 'three'
import { BufferAttribute } from 'three';
const noiseUrl = require('../images/shader/particle/perlin-512.png')
var Shader = {
    vs:`
    uniform float uTime;
    uniform float uScale;
    uniform sampler2D tNoise;

    attribute float stime; //particle position start time
    attribute vec3 pslt; //particle size life and turbulence
    attribute vec4 pc;   //particle color
    attribute vec3 pv;   //particle Velocity

    varying vec4 vColor;
    varying float lifeLeft;
    void main()
    {
        float timeElapsed = uTime - stime;
        lifeLeft = pslt.y>0.? max(0.,1.- timeElapsed / pslt.y) : 0.;
        vColor = pc*vec4(1.,1.,1.,lifeLeft);
        if(lifeLeft>.0)
        {
            //calculate position
            vec3 startPosition = position;
            vec4 noise = texture2D(tNoise,vec2((startPosition.x)*.015+uTime*.05,
            (startPosition.y)*.015+uTime*.05));
            vec3 noiseVel = (noise.rgb - .5)*30.;
            vec3 newPosition = startPosition + (pv*1.)*timeElapsed*.1;
            newPosition = mix(newPosition,newPosition+noiseVel*(pslt.z*.5),1.-lifeLeft);
            //calculate scale
            vec4 mvPosition = modelViewMatrix * vec4(newPosition,1.);
            gl_PointSize = uScale * pslt.x;
            gl_Position = projectionMatrix * mvPosition;
        }
        else
        {
            gl_PointSize = 1.;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
        }
    }
    `,
    fs:`
    varying vec4 vColor;
    varying float lifeLeft;
    void main()
    {
        vec2 cUV = gl_PointCoord * 2. - 1.;
        vec4 color = vColor;
        color.a *= smoothstep(0.,1.,1.-sqrt(cUV.x*cUV.x + cUV.y*cUV.y)) * lifeLeft;
        gl_FragColor = color;
    }
    `
}
var ParticleMaterial:THREE.ShaderMaterial = new THREE.ShaderMaterial({
    vertexShader:Shader.vs,
    fragmentShader:Shader.fs,
    uniforms:{uTime:{value:0.0},uScale:{value:1.0},tNoise:{value:null}},
    transparent:true
});
(new THREE.ImageLoader()).load(noiseUrl,img=>{
    ParticleMaterial.uniforms.tNoise.value = img;  
});
interface spawnOption{
    position?:THREE.Vector3,
    velocity?:THREE.Vector3,
    positionRandomness?:number,
    color?:number,
    colorRandomness?:number,
    turbulence?:number,
    lifetime?:number,
    size?:number,
    sizeRandomness?:number,
    count?:number
}
function mix<T>(s:T,t:T):Required<T>
{
    for(let key in t)
    {
        if(!s[key])
        {
            s[key] = t[key];
        }
    }
    return <Required<T>>s;
}
var random = (function(){
    var i =0;
    var rand:number[] = []
    for(let f =0;f<1e5;f++)
    {
        rand.push(Math.random());
    }
    return function(){
        return i>rand.length?rand[i=0]:rand[i++];
    }})();
export  class ParticleSystem extends THREE.Object3D
{
    private static defaultSpawnOption:spawnOption = {
        position:new THREE.Vector3(0,0,0),
        velocity:new THREE.Vector3(0.2,0.2,0.4),
        positionRandomness:20,
        color:0x4e72b8,
        colorRandomness:0.2,
        turbulence:0.5,
        lifetime:3.0,
        size:30.0,
        sizeRandomness:0.2,
        count:1
    }
    particleMaxCount = 1e6;
    particlCursor = 0;
    containerCount:number = 1;
    containerPool:GPUParticleContainer[] = []
    constructor(conf?:any)
    {
        super();
        for(let i = 0;i<this.containerCount;i++)
        {
            let Container = new GPUParticleContainer(this);
            this.containerPool.push(Container);
            this.add(Container);

        }
    }
    update(dt:number)
    {
        for(let i =0;i<this.containerCount;i++)
        {
            this.containerPool[i].update(dt);
        }
    }
    spawnParticle(option?:spawnOption)
    {
        let op:spawnOption = option?option:{};
        this.containerPool[this.particlCursor].spawnParticle(mix(op,ParticleSystem.defaultSpawnOption));
        this.particlCursor = ++this.particlCursor%this.containerCount;
    }
}
var PARTICLE_DATA_OFFSET:number = 14;
export class GPUParticleContainer extends THREE.Object3D
{
    particleCount:number;
    particleCursor:number = 0;
    time:number = 0;
    drp:number = window.devicePixelRatio;
    gpuParticleSystem:ParticleSystem;
    particlePool:{offset:number,count:number,start:number,life:number}[] = []; //saved Index of particle. The count is particle count
    updatePool:{offset:number,count:number}[] = [];//The count of data count = particleCount * PARTICLE_DATA_OFFSET
    dataArray:Float32Array;
    gemotery:THREE.BufferGeometry;
    //interleaveBuffer:THREE.InterleavedBuffer;
    particleNeedUpdate:boolean = false;
    particleSystem:THREE.Points;
    particleMaterial:THREE.ShaderMaterial;
    
    constructor(particleSystem:ParticleSystem,maxParticle:number = 1e5)
    {
        super();
        this.particleCount = maxParticle;
        this.gpuParticleSystem = particleSystem;
        //generate Geometry
        this.dataArray = new Float32Array(maxParticle*PARTICLE_DATA_OFFSET);
        this.gemotery = new THREE.BufferGeometry();
        // let _dataArray = this.dataArray;
        let _pptsarray = new Float32Array(maxParticle*3);
        let _stimearray = new Float32Array(maxParticle);
        let _psltarray = new Float32Array(maxParticle*3);
        let _colorarray= new Float32Array(maxParticle*4);
        let _pvarray = new Float32Array(maxParticle*3);
        // let _index = new Uint16Array(maxParticle);
        /**
         * [p,p,p,t,pslt,pslt,pslt,pc,pc,pc,pc,pv,pv,pv]
         */
        for(let i =0;i<maxParticle;i++)
        {
            let v4 = i*4;
            let v3 = i*3;
            // _index[i] = i;
            _pptsarray[v3] = 0;
            _pptsarray[v3+1] = 0;
            _pptsarray[v3+2] = 0;

            _stimearray[i] = 0;

            _psltarray[v3] = 1;
            _psltarray[v3+1] = 0;
            _psltarray[v3+2] = 0.2;

            _colorarray[v4] = 1;
            _colorarray[v4+1] = 1;
            _colorarray[v4+2] = 1;
            _colorarray[v4+3] = 1;
            
            _pvarray[v3] = 0.0;
            _pvarray[v3+1] = 0.0;
            _pvarray[v3+2] = 0.0;
        }
        let _pptsbuffer = new THREE.BufferAttribute(_pptsarray,3);
        let _psltbuffer = new THREE.BufferAttribute(_psltarray,3);
        let _colorbuffer = new THREE.BufferAttribute(_colorarray,4);
        let _pvbuffer = new THREE.BufferAttribute(_pvarray,3);
        let _stimebuffer = new THREE.BufferAttribute(_stimearray,1);
        // let _indexbuffer = new THREE.BufferAttribute(_index,1);
        this.gemotery.addAttribute('position',_pptsbuffer);
        this.gemotery.addAttribute('stime',_stimebuffer);
        this.gemotery.addAttribute('pslt',_psltbuffer);
        this.gemotery.addAttribute('pc',_colorbuffer);
        this.gemotery.addAttribute('pv',_pvbuffer);
        // this.gemotery.setIndex(_indexbuffer);
        
        // for(let i =0;i<maxParticle*PARTICLE_DATA_OFFSET;i+=PARTICLE_DATA_OFFSET)
        // {
        //     //ppts particle position and start time offset = 5
        //     _dataArray[i] =  0; //x
        //     _dataArray[i+1] =  0;   //y
        //     _dataArray[i+2] =  0;   //z
        //     _dataArray[i+3] =  0;   //time
        //     //pslt particle scale life turbulence offset = 9
        //     _dataArray[i+4] = 1    //scale
        //     _dataArray[i+5]= 0;   //life
        //     _dataArray[i+6]= 0.2; //turbulence
        //     //pc   particle color offset = 12
        //     _dataArray[i+7]= 1;   //r
        //     _dataArray[i+8]= 1;   //g
        //     _dataArray[i+9]= 1;   //b
        //     _dataArray[i+10]= 1;   //a
        //     //pv   particle velocity offset = 16
        //     _dataArray[i+11]= 0;
        //     _dataArray[i+12]= 0;
        //     _dataArray[i+13]= 0;
        // }
        // var interleaveBuffer = new THREE.InterleavedBuffer(this.dataArray,PARTICLE_DATA_OFFSET);
        // interleaveBuffer.dynamic = true;
        // this.interleaveBuffer = interleaveBuffer;
        // this.gemotery.addAttribute('position',new THREE.InterleavedBufferAttribute(interleaveBuffer,3,0,false));
        // this.gemotery.addAttribute('stime',new THREE.InterleavedBufferAttribute(interleaveBuffer,1,3,false));
        // this.gemotery.addAttribute('pslt',new THREE.InterleavedBufferAttribute(interleaveBuffer,3,4,false));
        // this.gemotery.addAttribute('pc',new THREE.InterleavedBufferAttribute(interleaveBuffer,4,7,false));
        // this.gemotery.addAttribute('pv',new THREE.InterleavedBufferAttribute(interleaveBuffer,3,11,false));
        
        this.particleMaterial = ParticleMaterial.clone();
        this.particleSystem = new THREE.Points(this.gemotery,this.particleMaterial);
        this.add(this.particleSystem);
    }
    spawnParticle(option:Required<spawnOption>)
    {
        let {offset,allocateCount} = this.allocParticle(option.count,option.lifetime)
        let attributes = this.gemotery.attributes;
        let position = <number[]>(<THREE.BufferAttribute>attributes.position).array;
        let stime = <number[]>(<THREE.BufferAttribute>attributes.stime).array;
        let pslt = <number[]>(<THREE.BufferAttribute>attributes.pslt).array;
        let pc = <number[]>(<THREE.BufferAttribute>attributes.pc).array;
        let pv = <number[]>(<THREE.BufferAttribute>attributes.pv).array;
        let r =(option.color>>16)/255;
        let g = (option.color&&0xff00>>8)/255;
        let b = (option.color&&0xff)/255;
        for(let i = offset;i<allocateCount+offset;i++)
        {
            //set ppst
            let v3 = i*3;
            let v4 = i*4;
            position[v3] = option.position.x + (random()*option.positionRandomness*2);
            position[v3+1] =  option.position.y + (random()*option.positionRandomness*2);
            position[v3+2] = option.position.z + (random()*option.positionRandomness*2);
            stime[i] = this.time;
            //set pslt
            pslt[v3] = option.size + (random()*option.sizeRandomness);
            pslt[v3+1] = option.lifetime;
            pslt[v3+2] = option.turbulence;
            //set pc
            pc[v4] = r*(random()*option.colorRandomness);
            pc[v4+1] = g*(random()*option.colorRandomness);
            pc[v4+2] = b*(random()*option.colorRandomness);
            pc[v4+3] = 1;
            //set pv
            pv[v3] = option.velocity.x;
            pv[v3+1] = option.velocity.y;
            pv[v3+2] = option.velocity.z;
        }
        // debugger;
        // this.interleaveBuffer.set(allocArray,offset*PARTICLE_DATA_OFFSET);
        this.particleNeedUpdate = true;
    }
    /**
     * reset particle of a range
     * @param begin start position of particle
     * @param count release count of particle
     */
    releaseParticle(begin:number,count:number)
    {
        let taget = (begin+count)*PARTICLE_DATA_OFFSET;
        let bufferArray = (<BufferAttribute>this.gemotery.attributes.pslt).array
        for(let i = begin*PARTICLE_DATA_OFFSET;i<taget;i+=PARTICLE_DATA_OFFSET)
        {
            (<any[]>bufferArray)[i+5] = 0;
        }
        this.updatePool.push({offset:begin*PARTICLE_DATA_OFFSET,count:count*PARTICLE_DATA_OFFSET});
        // this.interleaveBuffer.set(_array,begin*PARTICLE_DATA_OFFSET);
        this.particleNeedUpdate = true;
    }
    //TODO: handle cursor  overflow
    /**
     * this function use for alloc particle 
     * @param count count of alloc particle
     * @param life life of alloc particle
     * @returns the offset is particle offset the allocateCount is particle count
     */
    allocParticle(count:number,life:number):{offset:number,allocateCount:number}
    {
        let blockidx = 0;
        let block = this.particlePool.find((v,idx)=>{if(v.offset>this.particleCursor){blockidx = idx;return true}return false});
        let offset = this.particleCursor;
        let allocateCount = count;
        debugger;
        if((block&&this.particleCursor+count>block.offset)||this.particleCursor+count>this.particleCount)
        {
            // let max = 0;
            // var i =1;
            // if(this.particlePool.length>1)
            // {
            //     for(;i<this.particlePool.length;i++)
            //     {
            //         let f = i-1;
            //         let n = this.particlePool[i];
            //         let l = this.particlePool[f];
            //         let difference = (n.offset+n.count)-(l.offset+l.count);
            //         if(difference>max)max = difference;
            //     }
            //     this.particleCursor = this.particlePool[i-1].offset+this.particlePool[i-1].count;
            //     count = max-1;
            // }
            // else
            // {
            //     this.particleCursor = 0;
            // }
            this.particleCursor = 0;
            offset = this.particleCursor;
            this.particlePool.push({start:this.time,offset,count,life});
            this.updatePool.push({offset:this.particleCursor*PARTICLE_DATA_OFFSET,count:count*PARTICLE_DATA_OFFSET});
            this.particleCursor+=count;
        }
        else
        {
            this.particlePool.push({start:this.time,offset,count,life});
            this.updatePool.push({offset:this.particleCursor*PARTICLE_DATA_OFFSET,count:count*PARTICLE_DATA_OFFSET});
            this.particleCursor+=count;
        }
        this.particleNeedUpdate = true;
        return {offset,allocateCount};
    }
    checkPatricle()
    {
        var v;
        for(let i = this.particlePool.length-1;i>=0;i--)
        {
            v = this.particlePool[i];
            if(this.time-v.start>v.life)
            {
                this.releaseParticle(v.offset,v.count);
                this.particlePool.splice(i,1);
            }
            this.particlePool.sort((a,b)=>a.offset-b.offset);
        }
    }
    update(dt:number)
    {
        this.time+=dt;
        this.particleMaterial.uniforms['uTime'].value = this.time;
        this.checkPatricle();
        this.geometryUpdate();
    }
    geometryUpdate()
    {
        if(this.particleNeedUpdate)
        {
            this.particleNeedUpdate = false;
            if(this.updatePool.length>0)
            {
                this.updatePool.sort((a,b)=>a.offset-b.offset);
            //     let endblock = this.updatePool[this.updatePool.length-1]
            //     let begin = this.updatePool[0].offset;
            //     let end = endblock.offset+endblock.count;
            //     this.interleaveBuffer.updateRange.offset = begin;
            //     this.interleaveBuffer.updateRange.count = end - begin;
                this.updatePool.length = 0;
                for(var item in this.gemotery.attributes)
                {


                    (<THREE.BufferAttribute>this.gemotery.attributes[item]).needsUpdate = true;

                }
            }
            
        }
    }
}