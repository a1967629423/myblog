<template>
    <div class="index-content">
        <CubeLoop></CubeLoop>
        <div class="index-head">
            <div class="index-head-text">
                Welcome
            </div>
        </div>
        <div class="index-zuo">
        <a href=""><img src="../assets/images/icon/zuo.png"></a>
        </div>
    </div>
</template>
<style lang="scss">
.index-content
{
    text-align: center;
    .index-zuo{
        left:100%;
    }
    .index-head
    {
        position: absolute;
        width: 330px;
        height: 90px;
        bottom: 50%;
        left: 50%;
        margin-bottom: -45px;
        margin-left: -165px;
    }
    .index-head-text
    {
        display: inline;
        font-size: 80px;
    }
    min-width: 100vw;
    min-height: 100vh;
}
</style>

<script lang="ts">
import {Vue,Component} from 'vue-property-decorator'
import CubeLoop from '../components/background/CubeLoop.vue'
import testBack from '../components/background/testBack.vue'
@Component({components:{CubeLoop,testBack}})
export default class Index extends Vue
{

}
</script>
