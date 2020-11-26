import { isObject, parsePath,warn } from '../../shared/util'
import { Dep,popTarget,pushTarget } from './Dep';
import { queueWatcher } from './scheduler';
let uid = 0;
export class Watcher{
    constructor(vm,expOrFn,cb,options,isRenderWatcher){
        this.vm = vm;
        this.deps = [];
        this.depIds = new Set();
        this.expression = expOrFn.toString();
        if (isRenderWatcher) {
            vm._watcher = this
        }
        if(options){
            this.deep = !!options.deep;
            this.dirty = this.lazy = !!options.lazy
            this.before = options.before;
            this.sync = !!options.sync;
        }else{
            this.deep = this.dirty = this.lazy = false;
        }
        vm._watchers.push(this);
        this.cb = cb;
        this.id = ++uid;
        if(typeof expOrFn === 'function'){
            this.getter = expOrFn;
        }else{
            this.getter = parsePath(expOrFn); 
        }
        this.value = this.lazy ? undefined : this.get();
    }
    get(){
        pushTarget(this);
        let value;
            try{
                value = this.getter.call(this.vm,this.vm);
            }catch (e) {
                warn(`watcher callback run is error`)

            }
            
            
            if(this.deep){
                traverse(value)
            }
        popTarget();
        return value;
    }
    /**
     * 
     * @param {*} dep | Dep的实例 
     */
    addDep(dep){
        const id = dep.id;
        if(!this.depIds.has(id)){
            this.depIds.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }
    /**
     * lazy代表computed Watcher,这个Watcher不是立即更新值，而是标志这个值是改变过的，当被get的时候再计算。
     */
    update(){
        if(this.lazy){
            this.dirty = true;
        }else if(this.sync){
            this.run();
        }else{
            
            queueWatcher(this);
        }
    }
    run(){
        // 之所以用this.get()获取值而不是直接调用this.getter()是因为如果在watcher之后调用set,则需要将新加入的数据也监听这个watcher
        const oldValue = this.value;
        this.value = this.get();
        this.cb.call(this.vm,this.value,oldValue);
    }
    /**
     * 针对计算属性进行求值的函数，需要设置dirty值
     */
    evaluate(){
        this.value = this.get();
        this.dirty = false;
    }
    depend(){
        for(let i = 0,l = this.deps.length;i < l;i++){
            this.deps[i].depend(Dep.target);
        }
        
    }
    teardown(){
        for(let i = 0,l = this.deps.length;i < l;i++){
            const id = this.deps[i].id;
            this.deps[i].removeSub(this);
            this.deps.splice(i,1);
            this.depIds.delete(id);
        }
    }
}

const seenObjects = new Set();
function traverse(val){
    _traverse(val,seenObjects);
    seenObjects.clear();
}

function _traverse(val,seen){
    if(!isObject(val)){
        return;
    }
    const isA = Array.isArray(val);
    // 如果该值是响应式的，就可以收集该watcher
    if(val.__ob__){
        const depId = val.__ob__.dep.id;
        if(seen.has(depId)){
            return;
        }
        seen.add(depId);
    }

    if(isA){
        for(let i = 0,l = val.length;i < l;i++){
            _traverse(val[i],seen);
        }
    }else{
        let keys = Object.keys(val);
        for(let i = 0,l = keys.length;i < l;i++){
            _traverse(val[keys[i]],seen);
        }
    }
}

