import { Watcher } from "./core/observer/watcher";
import { initData,initComputed,initMethods } from "./core"
import { isValidArrayIndex,query,getOuterHTML } from './shared/util'
import { defineReactive } from './core/observer'
import {  compileToFunctions } from './core/compile/parser'
let uid = 0;
export class MVVM{
    constructor(options){
        this.$options = options;
        this._uid = uid++;
        this._watchers = [];
        callHook(this,'beforeCreate');
        if(options.data){
            initData(this,options.data);
        }

        if(options.methods){
            initMethods(this,options.methods);
        }

        if(options.computed) {
            initComputed(this,options.computed);
        }

        if(options.watch){
            initWatch(this,options.watch);
        }
        callHook(this,'created');
        if(options.el){
            this.$mount(options.el);
        }
        
    }
    /**
     * 用户自己写了render就直接用render,否则从template和el拿数据
     * @param {*} el 
     */
    $mount(el){
        let options = this.$options;
        this.$el = el = el && query(el);
        if(!options.render){
            let template = options.template;
            if(template){
                if(typeof template === 'string'){
                    if(template[0] === '#'){
                        template = idToTemplate(template)
                    }

                } else if(template.nodeType){
                    template = template.innerHTML;
                }

            }else if(el){
                template = getOuterHTML(el);
            }

            if(template){
                const render = compileToFunctions(template,this);
                options.render = render;
            }
        }

        callHook(this,'beforeMount');
    }
    /**
     * 
     * @param {*} expOrFn 
     * @param {*} cb 
     * @param {Object} options 
     *    -> {boolean} deep 对象内部值发生变化也要触发回调
     *    -> {boolean} immediate 立即以观测值的当前值触发回调 
     */
    $watch(expOrFn,cb,options){
        const vm = this;
        options = options || {};
        const watcher = new Watcher(vm,expOrFn,cb,options);
        if(options.immediate){
            const nowValue = watcher.value;
            cb.call(vm,nowValue,nowValue);
        }
        return watcher.teardown;
    }
    /**
     * 应对Object.defineProperty无法侦测新增属性的情况
     * @param {Object|Array} target 
     * @param {String | number} key 
     * @param {any} value 
     */
    $set(target,key,value){
        if(Array.isArray(target) && isValidArrayIndex(target,key)){
            target.splice(key,1,value);
            return value;
        }

        if(target.hasOwnProperty(key)){
            target[key] = value;
            return value;
        }
        
        const ob = target.__ob__;
        if(!ob){
            target[key] = value;
            return value;
        }
        defineReactive(ob.value,key,value);
        ob.dep.notify();
        return value;
    }
    $delete(target,key){
        if(Array.isArray(target) && isValidArrayIndex(target,key)){
            target.splice(key,1);
            return;
        }
        const ob = target.__ob__;
        delete target[key];
        ob && ob.dep.notify();
    }
    

}

window.MVVM = MVVM;

/**
 * 钩子函数的调用，因为没有Mixin,所以暂时不用数组存储直接调用。
 * @param {*} vm 
 * @param {*} hook 
 */
function callHook(vm,hook){
    let handler = vm.$options[hook];
    if(handler){
        handler.call(vm)
    }
}