
import Vue from 'vue'
declare module 'vue/types/vue'
{
  interface Vue
  {
    beforeCreate():void;
    created():void;
    beforeMount():void;
    mounted():void;
    beforeUpdate():void;
    updated():void;
    beforeDestory():void;
    destroyed():void;
    activated():void;
    deactivated():void;

  }
}