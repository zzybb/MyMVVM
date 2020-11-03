let uid = 0;
export class Dep{
    constructor(){
        this.subs = [];
        this.id = uid++;
    }
    addSub(sub){
        this.subs.push(sub);
        
    }
    depend(){
        let w = Dep.target;
        if(w){
            w.addDep(this);
        }
    }
    removeSub(sub){
        remove(this.subs,sub);
    }
    notify(){
        for(let i = 0,l = this.subs.length;i < l;i++){
            this.subs[i].update();
        }
    }

}

function remove(subs,sub){
    if(subs.length){
        const index = subs.indexOf(sub);
        if(index > -1){
            subs.splice(index,1);
        }
    }
}

Dep.target = null;
let targetStack = [];
export function pushTarget(watcher){
    if(Dep.target) targetStack.push(Dep.target);
    Dep.target = watcher;
}

export function popTarget(){
    Dep.target = targetStack.pop();
}