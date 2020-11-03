import { noop,isFunction,warn,isPlainObject,bind } from '../shared/util'
import { observe } from './observer'
import { Dep } from './observer/Dep';
import { Watcher } from './observer/watcher';
const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
}

/**
 * 1.设置$data,对function 类型的data进行处理。
 * 2.进行vm.d$ata代理
 * 3.监听data
 * @param {Vue instance} vm 
 * @param {Object|Function} data 
 */
export function initData(vm,data){
    data = vm.$data = (isFunction(data)) ? data.call(vm) : data;
    if(!isPlainObject(data)){
        warn(`data must return a object!`);
        return;
    }
    const keys = Object.keys(data);
    let i = keys.length;
    while(i--){
        proxy(vm,"$data",keys[i]);
    }
    observe(data);
}

export function initComputed(vm,computed){
    let watchers = vm._computedWatchers = Object.create(null);
    const keys = Object.keys(computed);
    for(let i = 0,l = keys.length;i < l;i++){
        let key = keys[i];
        let userDef = computed[key];
        let getter = typeof userDef === 'function' ? userDef : userDef.get;
        watchers[key] = new Watcher(vm,getter,noop,{
            lazy:true
        })

        if(!(vm.hasOwnProperty(key))){
            defineComputed(vm,key,userDef);
        }else{
            warn(`computed key ${key} has been defined in $data`)
        }
    }
}

/**
 * watch选项可以接受key的回调函数是array,string,object
 * @param {*} vm 
 * @param {*} watch 
 */
export function initWatch(vm,watch){
    const keys = Object.keys(watch);
    for(let i = 0,l = watch.length;i < l;i++){
        let key = keys[i];
        let handler = watch[key];
        if(Array.isArray(handler)){
            for(let i = 0,l = handler.length;i < l;i++){
                createWatcher(vm,key,handler[i]);
            }
        }else{
            createWatcher(vm,key,handler);
        }
    }
}

function createWatcher(vm,key,handler){
    let options;
    if(isPlainObject(handler)){
        options = handler;
        handler = options.handler;
    }
    
    /**
     * 如果回调函数直接写的方法名,就从实例上寻找
     */
    if(typeof handler === 'string'){
        handler = vm[handler];
    }

    vm.$watch(key,handler,options);

}

export function initMethods(vm,methods){
    const keys = Object.keys(methods);
    for(let i = 0,l = keys.length;i < l;i++){
        let key = keys[i];
        vm[key] = methods[key] ? bind(vm,methods[key]) : noop;
    }
}

/**
 * 会将computed属性设置到vm实例上，所以可以直接vm.xx访问，并且设置
 * 相应的getter,setter.
 * computed的属性在被get的时候才会重新计算值
 * @param {*} target | mvvm实例 
 * @param {*} key 
 * @param {*} userDef 
 */
function defineComputed(target,key,userDef){
    let set = userDef.set ? userDef.set : noop;
    Object.defineProperty(target,key,{
        enumerable:true,
        configurable:true,
        get:createComputedGetter(key),
        set
    })
}

/**
 * 只有watcher的dirty属性是true才代表数据更改过了，才要去重新计算。
 * @param {*} key 
 */
function createComputedGetter(key){
    return function(){
        let watcher = this._computedWatchers[key];
        if(watcher.dirty){
            watcher.evaluate();
        }

        // 将render Watcher 加入到需要通知的Dep
        if(Dep.target){
            watcher.depend();
        }
        return watcher.value;
    }
}

function proxy(target,sourceKey,key){
    sharedPropertyDefinition.get = function proxyGetter(){
        return target[sourceKey][key];
    }
    sharedPropertyDefinition.set = function proxySetter(newVal){
        return target[sourceKey][key] = newVal;
    }
    Object.defineProperty(target,key,sharedPropertyDefinition);
}

