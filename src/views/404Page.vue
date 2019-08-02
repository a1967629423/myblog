<template>
    <div class="content">
        <CubeLoop></CubeLoop>
        <div class="head">"404"</div>
        <div class="description">
            <h1 class="en">Not found</h1>
            <h2 class="ch">您所访问的地址不存在</h2>
        </div>
        <div class="footer">
            <div class="introduce">
                <p>
                    "Powered by"
                    <a href="www.cdlk.tk">CDLK.TK</a>
                </p>
            </div>
            <div class="action">
                <a href="javascript:history.go(-1)">返回上一页</a>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
$baseFontColor: rgb(130, 130, 130);
$descFontColor: $baseFontColor * rgb(1.35, 1.01, 1.01);
@mixin text-shadow($range: 4px) {
    text-shadow: 0px 0px $range rgba(0, 0, 0, 0.663);
}
@mixin radius-button($radius: 4px) {
    padding: 6px 20px;
    margin: 6px;
    border: 1px solid $descFontColor;
    border-radius: $radius;
}
a,
a:link,
a:visited {
    color: $descFontColor;
}
html,
body {
    width: 100%;
}
body {
    padding-top: 100px;
}
.content {
    text-align: center;
    .head {
        display: inline;
        font-size: 120px;
        font-family: 'Roboto-regular';
        color: $baseFontColor;
        @include text-shadow();
    }
    .description {
        padding-top: 30px;
        .en {
            font-size: 30px;
            color: $descFontColor;
            @include text-shadow();
        }
        .ch {
            font-size: 14px;
            color: $descFontColor;
            @include text-shadow();
        }
    }
    .footer {
        @include text-shadow(1px);
        display: flex;
        flex-direction: column-reverse;
        position: absolute;
        bottom: 20px;
        width: 100%;
        .action {
            a {
                @include radius-button();
                width: 120px;
                margin: 0 auto;
                text-decoration: none;
            }
            a:active
            {
                background-color:$descFontColor * rgb(0.4,0.4,0.4);
            }
        }
        .introduce {
            padding-top: 30px;
            color: $descFontColor;
        }
    }
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import CubeLoop from '../components/background/CubeLoop.vue'
@Component({ name: 'Page404', components: { CubeLoop } })
export default class Page404 extends Vue {}
</script>

