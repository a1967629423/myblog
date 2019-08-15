<template>
    <div class="modo-c">
        <div class="modo-postimg">
            <img alt="post" class="modo-img" src="../assets/images/icon/1.jpg" />
        </div>
        <div class="modo-postinfo">
            <span class="modo-time">时间</span>
            <h4 class="modo-h4">这是图片</h4>
            <span class="modo-post-description">简介</span>
        </div>
    </div>
</template>
<style lang="scss">
.modo-c {
    .modo-img {
        width: 100%;
    }
    position: relative;
    border-style: solid;
    border-color: black;
    border-style: ridge;
    border-radius: 25px;
    box-shadow: 10px 10px 10px #888888;
    transition: all 0.5s;
    z-index: 10;
    overflow: hidden;
    width: 300px;
    height: 400px;
    margin: 10px 5px;
    .modo-postinfo {
        margin-top: 50px;
        color: rgb(122, 56, 56);
        flex-wrap: wrap;
        width: 100%;
        height: 50%;
    }
}

// .modo-wrapper-b :hover{
//     max-width: 310px;

// }
.modo-c:hover {
    width: 500px;
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
@Component({ name: 'card', components: {} })
export default class card extends Vue {}
</script>

