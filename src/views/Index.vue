<template>
    <div class="index-content">
        
        <link
            href="//netdna.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
            rel="stylesheet"
        /> <CubeLoop></CubeLoop>
        <div class="card-container">
            <card></card>
            <card></card>
            <card></card>
            <card></card>
        </div>
       
        <div class="index-head">
            <div class="index-head-text">Welcome</div>
        </div>
        <div class="index-arrowfather">
            <div class="index-arrow" id="arrow1">
                <a class="index-d1" href="#">
                    <i class="fa fa-angle-double-right fa-3x"></i>
                </a>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.index-arrowfather {
    position: absolute;
    width: 100%;
    .index-d1 {
        color: rgb(128, 123, 123);
    }
    .index-arrow {
        right: 30px;
        position: absolute;
        top: 50vh;
        transform: translate(-50%, -50%);
    }
}
.card-container
{
    display: flex;
    position: absolute;
    width: 100%;
    justify-content: center;
}
.index-content {
    text-align: center;
    .index-head {
        position: absolute;
        width: 330px;
        height: 90px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .index-head-text {
        display: inline;
        font-size: 80px;
    }
    min-width: 100vw;
    min-height: 100vh;
}
</style>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import CubeLoop from '../components/background/CubeLoop.vue'
import testBack from '../components/background/testBack.vue'
import card from '../components/Card.modul.vue'
@Component({ components: { CubeLoop, testBack ,card} })
export default class Index extends Vue {}
</script>
