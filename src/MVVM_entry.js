import { Watcher } from "./core/observer/watcher";
import { initData,initComputed,initMethods, initProps } from "./core"
import { isValidArrayIndex,query,getOuterHTML,noop,warn,remove } from './shared/util'
import { defineReactive } from './core/observer'
import { compileToFunctions } from './core/compile/parser'
import { initRender } from "./core/vdom/render";
let uid = 0;


export class MVVM{
    constructor(options){
        this.$options = options;
        this._uid = uid++;
        this._watchers = [];
        this._staticTrees = null;
        this._events = Object.create(null);
        this.$parent = options.parent;
        callHook(this,'beforeCreate');
        if(options.data){
            initData(this,options.data);
        }

        if(options.propsData){
            initProps(this,options.propsData)
        }

        if(options.methods){
            initMethods(this,options.methods);
        }

        if(options.computed) {
            initComputed(this,options.computed);
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
        const vm = this;
        let options = vm.$options;
        vm.$el = el = el && query(el);
        if (el === document.body || el === document.documentElement) {
            warn(
              `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
            )
            return this
        }
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
                const { render,staticRenderFns } = compileToFunctions(template,vm);
                options.render = render;
                options.staticRenderFns = staticRenderFns;
            }
        }

        callHook(vm,'beforeMount');

        let updateComponent;
        updateComponent = () => {
            vm._update(vm._render())
        }

        new Watcher(vm,updateComponent,noop,{
            before () {
                if (vm._isMounted) {
                    callHook(vm,'beforeUpdate')
                }
            }
        },true)

        vm._isMounted = true;
        callHook(vm,'mounted')

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
    $emit(event,...args){
        const vm = this;
        let cbs = vm._events[event];
        if(cbs){
            for(let i = 0,l = cbs.length;i < l;i++){
                try{
                    cbs[i].call(vm,...args);
                } catch (e) {
                    warn(`event handler error for ${event}`)
                }

            }
        }
        return vm;
    }
    $forceUpdate(){
        const vm = this;
        if (vm._watcher){
            vm._watcher.update();
        }
    }
    $destroy(){
        const vm = this;
        if (vm._isBeingDestroyed){
            return;
        }
        callHook(vm,'beforeDestroy');
        vm._isBeingDestroyed = true;
        const parent = vm.$parent;
        if (parent && !parent._isBeingDestroyed){
            remove(parent.$children,vm)
        }
        if(vm._watcher){
            vm._watcher.teardown();
        }
        let i = vm._watchers.length;
        while(i--){
            vm._watchers[i].teardown();
        }
        vm._update(null,true);
        vm._isDestroyed = true;
        callHook(vm,'destroyed');
        vm.$off();
    }
    $on(event,callback){
        const vm = this;
        if(Array.isArray(event)){
            for(let i = 0,l = event.length;i < l;i++){
                this.$on(event[i],callback);
            }
        }else{
            (vm._events[event] || (vm._events[event] = [])).push(callback);
        }
        return vm;
    }
    $off(...arg){
        const vm = this;
        if(!arg.length){
            vm._events = Object.create(null);
            return vm;
        }

        const event = arg[0];
        const fn = arg[1];
        const cbs = vm._events[event];
        if(!cbs){
            return vm;
        }
        if(arg.length === 1){
            vm._events[event] = null;
            return vm;
        }
        if(fn){
            const cbs = vm._events[event];
            let cb;
            let i = cbs.length;
            while(i--){
                cb = cbs[i];
                if(cb === fn || cb.fn === fn){
                    cbs.splice(i,1);
                    break;
                }
            }
            
        }
        return vm;

    }
    
}

initRender(MVVM);

window.MVVM = MVVM;

/**
 * 钩子函数的调用，因为没有Mixin,所以暂时不用数组存储直接调用。
 * @param {*} vm 
 * @param {*} hook 
 */
export function callHook(vm,hook){
    let handler = vm.$options[hook];
    if(handler){
        handler.call(vm)
    }
}