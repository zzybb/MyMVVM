import { warn } from '../../shared/util'
let callbacks = [];
let pending = false;

function flushCallbacks (){
    pending = false;
    // 之所以需要copy一个数组，是因为在执行callbaks里的函数时
    // 可能会有新的nextTick任务加入，这时候如果不复制，会重新把callbaks
    // 原来执行过的函数又添加进依次微队列。
     
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0;i < copies.length;i++){
        copies[i]();
    }
}

let microTimerFunc;
const p = Promise.resolve();
microTimerFunc = () => {
    p.then(flushCallbacks)
}

export function nextTick (cb,ctx){
    let _resolve;
    callbacks.push(() => {
        if(cb){
            
                cb.call(ctx);
            
                

            
        } else if (_resolve){
            _resolve(ctx);
        }
    })

    if (!pending) {
        pending = true;
        microTimerFunc()
    }

    if(!cb && typeof Promise !== 'undefined'){
        return new Promise(resolve => {
            _resolve = resolve;
        })
    }


}