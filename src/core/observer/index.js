import { isObject,hasPro,def,hasOwn } from '../../shared/util'
import { arrayMethods } from './array';
import { Dep } from './Dep';
// Object.getOwnPropertyNames返回对象自身的枚举和不可枚举属性
// Object.keys返回自身可枚举属性
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
export class Observer{
    constructor(value){
        this.value = value;
        this.dep = new Dep();
        def(value,'__ob__',this);
        if(Array.isArray(value)){
            let augment = hasPro ? protoAugment : copyAugment;
            augment(value,arrayMethods,arrayKeys);
            this.observeArray(value);
        }else{
            this.walk(value);

        }
        
    }
    /**
     * 遍历object，调用defineReactive是因为每个属性都需要设置响应式
     * @param {*} data 
     */
    walk(data){
        const keys = Object.keys(data);
        for(let i = 0,l = keys.length;i < l;i++){
            defineReactive(data,keys[i],data[keys[i]])
        }
    }
     
    /**
     * 遍历Array,之所以调用observer是因为数组中的普通属性不需要设置响应式
     * @param {*} array 
     */
    observeArray(array){
        for(let i = 0,l = array.length;i < l;i++){
            observe(array[i])
        }
    }
}

export function observe(value){
    if(!isObject(value)){
        return;
    }
    let ob;
    // 避免循环依赖导致无限递归
    if(hasOwn(value,'__ob__')){
        ob = value.__ob__;
    } else {
        ob = new Observer(value)
    }
    return ob;

}

export function defineReactive(target,key,val){
    let childOb = observe(val);
    let dep = new Dep();
    
    Object.defineProperty(target,key,{
        enumerable: true,
        configurable: true,
        get(){
            dep.depend();
            if(childOb){ //数组才需要把dep收集到Observe中
                childOb.dep.depend();
            }
            return val;
        },
        set(newVal){
            if(val === newVal){
                return;
            }
            
            val = newVal;
            dep.notify();
        }
    })

}

function protoAugment(target,src){
    target.__proto__ = src;
}

/**
 * 当不能使用__proto__的时候，就将利用defineProperty将原来数组的方法定位到拦截器
 */
function copyAugment(target,src,keys){
    for(let i = 0,l = keys.length;i < l;i++){
        const key = keys[i];
        def(target,key,src[key]);
    }
}