import { nextTick } from './next-tick'
let has = {}
let queue = [];
let flushing = false;
let waiting = false;
export function queueWatcher(watcher) {
    const id = watcher.id;
    // 避免相同的观察者重复入队
    if (has[id] == null){
        has[id] = true;
        // flushing表示当队列没有执行更新时才会简单将观察者追加到队列的尾部。
        // 队列更新的时候也可能有东西入队伍的，比如计算属性
        if (!flushing) {
            queue.push(watcher);
        } else {

        }

        if (!waiting) {
            waiting = true;
            // todo 同步执行观察者
            nextTick(flushSchedulerQueue);
        }

    }

}

function flushSchedulerQueue (){
    flushing = true;
    let watcher,id;
    queue.sort((a,b) => a.id - b.id);
    for(let index = 0;index < queue.length;index++){
        watcher = queue[index];
        if(watcher.before){
            watcher.before()
        }
        id = watcher.id;
        has[id] = null;
        watcher.run();

    }
    resetSchedulerState()
}

function resetSchedulerState () {
    queue.length = 0
    has = {}
    waiting = flushing = false
  }