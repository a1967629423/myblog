<template>
<div class="modo-father">
    <CubeLoop></CubeLoop>
    <div>
    <div class="modo-wrapper-a">
    <div class="modo-wrapper-b">
    <a class="post-tile-a" href="" action="Click">
    <div class="modo-c">
        <div class="modo-postimg">
            <img src="../assets/images/icon/1.jpg" alt="post" class="modo-img">
        </div>
        <div class="modo-postinfo">
            <span class="modo-time" >时间</span>
            <h4 class="modo-h4">这是图片</h4>
            <span class="modo-post-description">
                简介
            </span>
        </div>
    </div>
    </a>
    </div>
    </div>
    </div>
</div>
</template>
<style lang="scss">
.modo-father{
    display: flex;
.modo-img{
    max-width: 300px;
    max-height: 200px;
    border-top-left-radius: 23px;
    border-top-right-radius: 23px;
    z-index: abs($number: 200)
    }
.modo-postimg{
    transition:width 2s;
    -webkit-transition: width 2s;
}
.modo-c{
    border-style: solid;
    border-color: black;
    position: absolute;
    margin-left: 100px;
    margin-top: 200px;
    border-style: ridge;
    border-radius: 25px;
    box-shadow: 10px 10px 10px #888888
}
.modo-postinfo{
    margin-top: 50px;
    color: rgb(122, 56, 56);
    flex-wrap: wrap;
    max-width: 300px;
    max-height: 200px;
    overflow: hidden;
    
}
// .modo-wrapper-b :hover{
//     max-width: 310px;
    
// }
.modo-c :hover{
    max-width: 310px;

}
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import CubeLoop from '../components/background/CubeLoop.vue'
@Component({name:'card',components:{ CubeLoop }})
export default class card extends Vue {}
</script>

