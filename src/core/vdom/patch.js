import {
    callHook
} from "../../MVVM_entry";
import {
    mount
} from "./render";
import {
    ChildrenFlags,
    VNodeFlags
} from "./vnode";
import {
    isPlainObject,
    isNativeEvent
} from '../../shared/util'

export function patch(vm, prevVNode, nextVNode, container) {
    const nextFlags = nextVNode.flags;
    const prevFlags = prevVNode.flags;

    // 检查新旧 VNode 的类型是否相同，如果类型不同，则直接调用 replaceVNode 函数替换 VNode
    // 如果新旧 VNode 的类型相同，则根据不同的类型调用不同的比对函数
    if (prevFlags !== nextFlags) {
        replaceVNode(vm, prevVNode, nextVNode, container);
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        patchElement(vm, prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        patchComponent(vm, prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        patchText(prevVNode, nextVNode)
    }
    // } else if (nextFlags & VNodeFlags.FRAGMENT) {
    //     // todo : 暂时没有设计fragment!
    //     patchFragment(vm, prevVNode, nextVNode, container)
    // }
}

/**
 * 将新节点挂载到旧节点前面(regNode就是旧节点即prevVNode.el)
 * 移除掉旧节点
 * @param {*} vm 
 * @param {*} prevVNode 
 * @param {*} nextVNode 
 * @param {*} container 
 */
function replaceVNode(vm, prevVNode, nextVNode, container) {
    mount(vm, nextVNode, container,prevVNode.el);
    container.removeChild(prevVNode.el);
}

/**
 * 更新元素节点
 * @param {*} prevVnode 
 * @param {*} nextVNode 
 * @param {*} container 
 */
function patchElement(vm, prevVNode, nextVNode, container) {
    if (prevVNode.tag !== nextVNode.tag) {
        replaceVNode(vm, prevVNode, nextVNode, container);
        return;
    }
    // 注意这时候要让nextVNode.el 也引用该元素
    const el = (nextVNode.el = prevVNode.el);
    // 拿到 新旧VNodeData
    const prevData = prevVNode.data;
    const nextData = nextVNode.data;
    // 新的VNodeData存在时才更新
    if (nextData) {
        for (let key in nextData) {
            if (key !== 'staticClass' && key !== 'staticStyle') {
                const prevValue = prevData[key];
                const nextValue = nextData[key];
                patchData(vm, el, key, prevValue, nextValue);
            }
        }
    }
    if (prevData) {
        // 将不存在于新VNodeData中的数据删除
        for (let key in prevData) {
            const prevValue = prevData[key];
            if ((key !== 'staticClass' && key !== 'staticStyle') && prevValue && (nextData && !nextData.hasOwnProperty(key))) {
                patchData(vm, el, key, prevValue, null)
            }
        }
    }


    // 调用patchChildren 函数递归更新子节点(同层    级比较)
    patchChildren(
        vm,
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        el
    )
}

/**
 * 有新数据没有旧数据是第一次插入
 * @param {*} el 
 * @param {*} key 
 * @param {*} prevValue 
 * @param {*} nextValue 
 */
export function patchData(vm, el, key, prevValue, nextValue) {

    switch (key) {
        case 'staticClass':
            setClass(el, nextValue);
            break;
        case 'staticStyle':
            setStyle(el, nextValue);
            break;
        case 'style':

            if (nextValue) {
                nextValue = normalizeStyle(nextValue);
                setStyle(el, nextValue);
            }
            if (prevValue) {
                prevValue = normalizeStyle(prevValue);
                for (let k in prevValue) {
                    if (!nextValue || !nextValue.hasOwnProperty(k)) {
                        el.style[k] = ''
                    }
                }
            }

            break;

        case 'class':
            if (nextValue) {
                nextValue = normalizeClass(nextValue);
                setClass(el, nextValue);
            } else {
                el.className = '';
            }
            break;
        case 'domProps':
            for (let domKey in nextValue) {
                el[domKey] = nextValue[domKey];
            }
            break
        case 'attrs':
            for (let domKey in nextValue) {
                el.setAttribute(domKey, nextValue[domKey])
            }
            break;
        case 'on':
            if (prevValue) {
                for (let i in prevValue) {
                    el.removeEventListener(i, prevValue[i])
                }
            }

            if (nextValue) {
                setEvents(vm, el, nextValue)
            }
            break;
        case 'directives':
            setDirectives(vm, el, nextValue)
            break;
        default:

            el.setAttribute(key, nextValue)
    }

}

function patchChildren(
    vm,
    prevChildFlags,
    nextChildFlags,
    prevChildren,
    nextChildren,
    container
) {
    switch (prevChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    patch(vm, prevChildren, nextChildren, container)
                    break;
                case ChildrenFlags.NO_CHILDREN:
                    container.removeChild(prevChildren.el)
                    break;
                default:
                    container.removeChild(prevChildren.el)
                    // 遍历新的多个子节点，逐个挂载到容器中
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(vm, nextChildren[i], container)
                    }
                    break;
            }
            break;
        case ChildrenFlags.NO_CHILDREN:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    mount(vm, nextChildren, container)
                    break;
                case ChildrenFlags.NO_CHILDREN:
                    break;
                default:
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(vm, nextChildren[i], container)
                    }
                    break;
            }
            break;
        default:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    for (let i = 0; i < prevChildren.length; i++) {
                        container.removeChild(prevChildren[i].el)
                    }
                    mount(vm, nextChildren, container)
                    break;
                case ChildrenFlags.NO_CHILDREN:
                    for (let i = 0; i < prevChildren.length; i++) {
                        container.removeChild(prevChildren[i].el)
                    }
                    break;
                default:
                    // diff算法

                    // for (let i = 0; i < prevChildren.length; i++) {
                    //     if (prevChildren[i].flags === VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
                    //         patchComponent(vm,prevChildren[i],nextChildren[i],container)
                    //         continue;
                    //     } 
                    //     container.removeChild(prevChildren[i].el)
                    // }
                    // // 遍历新的子节点，将其全部添加
                    // for (let i = 0; i < nextChildren.length; i++) {
                    //     if (prevChildren[i].flags === VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
                    //         continue;
                    //     }
                    //     mount(vm, nextChildren[i], container)
                    // }
                    //vueDiff(vm, prevChildren, nextChildren, container)
                    infernoDiff(vm, prevChildren, nextChildren, container)

                    break;
            }
            break;
    }
}



/**
 * vue使用的diff算法
 * @param {*} vm 
 * @param {*} prevChildren 
 * @param {*} nextChildren 
 * @param {*} container 
 */
function vueDiff(vm, prevChildren, nextChildren, container) {
    
    let oldStartIdx = 0;
    let oldEndIdx = prevChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = nextChildren.length - 1;
    let oldStartVNode = prevChildren[oldStartIdx];
    let oldEndVNode = prevChildren[oldEndIdx];
    let newStartVNode = nextChildren[newStartIdx];
    let newEndVNode = nextChildren[newEndIdx];
    let oldMap = {};

    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        oldMap[prevChildren[i].key] = i
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (!oldStartVNode) {
            oldStartVNode = prevChildren[++oldStartIdx]
        } else if (!oldEndVNode) {
            oldEndVNode = prevChildren[--oldEndIdx]
        } else if (oldStartVNode.key === newStartVNode.key) {
            patch(vm, oldStartVNode, newStartVNode, container)
            // 更新索引，指向下一个位置
            oldStartVNode = prevChildren[++oldStartIdx]
            newStartVNode = nextChildren[++newStartIdx]
        } else if (oldEndVNode.key === newEndVNode.key) {
            // 两个都在末位是不需要移动的
            patch(vm, oldEndVNode, newEndVNode, container)
            // 更新索引，指向下一个位置
            oldEndVNode = prevChildren[--oldEndIdx]
            newEndVNode = nextChildren[--newEndIdx]

        } else if (oldStartVNode.key === newEndVNode.key) {
            patch(vm, oldStartVNode, newEndVNode, container)
            // 将 oldStartVNode.el 移动到 oldEndVNode.el 的后面，也就是 oldEndVNode.el.nextSibling 的前面
            container.insertBefore(
                oldStartVNode.el,
                oldEndVNode.el.nextSibling
            )
            // 更新索引，指向下一个位置
            oldStartVNode = prevChildren[++oldStartIdx]
            newEndVNode = nextChildren[--newEndIdx]

        } else if (oldEndVNode.key === newStartVNode.key) {
            patch(vm, oldEndVNode, newStartVNode, container);
            container.insertBefore(oldEndVNode.el, oldStartVNode.el);
            oldEndVNode = prevChildren[--oldEndIdx];
            newStartVNode = nextChildren[++newStartIdx];
        } else {

            const idxInOld = oldMap[newStartVNode.key];
            if (idxInOld) {
                const vnodeToMove = prevChildren[idxInOld];
                patch(vm, vnodeToMove, newStartVNode, container);
                container.insertBefore(vnodeToMove.el, oldStartVNode.el);
                prevChildren[idxInOld] = undefined;
            } else {
                
                mount(vm, newStartVNode, container, oldStartVNode.el)
            }
            newStartVNode = nextChildren[++newStartIdx];
        }
    }


    if (oldEndIdx < oldStartIdx) {
        

        // 添加新节点
        for (let i = newStartIdx; i <= newEndIdx; i++) {
            mount(vm, nextChildren[i], container, oldStartVNode ? oldStartVNode.el : null)
        }
    } else if (newEndIdx < newStartIdx) {
        
        // 移除操作
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
            prevChildren[i] ? container.removeChild(prevChildren[i].el) : ''
        }
    }
}

/**
 * 最长递增子序列diff算法
 * @param {*} vm 
 * @param {*} prevChildren 
 * @param {*} nextChildren 
 * @param {*} container 
 */
function infernoDiff(vm, prevChildren, nextChildren, container) {

    let j = 0;
    let prevVNode = prevChildren[j];
    let nextVNode = nextChildren[j];
    let prevEnd = prevChildren.length - 1;
    let nextEnd = nextChildren.length - 1;
    outer: {
        while (prevVNode.key === nextVNode.key) {
            patch(vm, prevVNode, nextVNode, container);
            j++;
            if (j > prevEnd || j > nextEnd) {
                break outer
            }
            prevVNode = prevChildren[j];
            nextVNode = nextChildren[j];
        }

        prevVNode = prevChildren[prevEnd];
        nextVNode = nextChildren[nextEnd];
        while (prevVNode.key === nextVNode.key) {
            patch(vm, prevVNode, nextVNode, container);
            prevEnd--;
            nextEnd--;
            if (j > prevEnd || j > nextEnd) {
                break outer
            }
            prevVNode = prevChildren[prevEnd];
            nextVNode = nextChildren[nextEnd];
        }
    }

    
    if (j > prevEnd && j <= nextEnd) {

        const nextPos = nextEnd + 1;
        const refNode =
            nextPos < nextChildren.length ? nextChildren[nextPos].el : null;
        while (j <= nextEnd) {
            mount(vm, nextChildren[j++], container, refNode);
        }
    } else if (j > nextEnd) {
        while (j <= prevEnd) {
            container.removeChild(prevChildren[j++].el);
        }
    } else {
        const nextLeft = nextEnd - j + 1;
        const source = [];
        for (let i = 0; i < nextLeft; i++) {
            source.push(-1);
        }
        const prevStart = j;
        const nextStart = j;
        let moved = false
        let pos = 0;

        // 构建索引表
        const keyIndex = {}
        for (let i = nextStart; i <= nextEnd; i++) {
            keyIndex[nextChildren[i].key] = i
        }

        // patched 表示已经更新过的节点数量。
        let patched = 0;
        for (let i = prevStart; i <= prevEnd; i++) {
            const prevVNode = prevChildren[i];
            if (patched < nextLeft) {
                const k = keyIndex[prevVNode.key];
                if (typeof k !== 'undefined') {
                    nextVNode = nextChildren[k]
                    // patch 更新
                    patch(vm, prevVNode, nextVNode, container)
                    patched++;
                    // 更新 source 数组
                    source[k - nextStart] = i
                    // 判断是否需要移动
                    if (k < pos) {
                        moved = true
                    } else {
                        pos = k
                    }


                } else {
                    // 没找到，说明旧节点在新 children 中已经不存在了，应该移除
                    container.removeChild(prevVNode.el)
                }

            } else {
                container.removeChild(prevNode.el);
            }

        }

        if (moved) {
            const seq = lis(source);
            let j = seq.length - 1;
            for (let i = nextLeft - 1; i >= 0; i--) {
                if (source[i] === -1) {
                    
                    const pos = i + nextStart;
                    const nextVNode = nextChildren[pos];
                    const nextPos = pos + 1;
                    mount(
                        vm,
                        nextVNode,
                        container,
                        nextPos < nextChildren.length ?
                        nextChildren[nextPos].el :
                        null
                    )

                } else if (i !== seq[j]) {
                    // 说明该节点需要移动
                    // 该节点在新 children 中的真实位置索引
                    const pos = i + nextStart
                    const nextVNode = nextChildren[pos]
                    // 该节点下一个节点的位置索引
                    const nextPos = pos + 1
                    // 移动
                    container.insertBefore(
                        nextVNode.el,
                        nextPos < nextChildren.length ?
                        nextChildren[nextPos].el :
                        null
                    )

                } else {
                    // 当 i === seq[j] 时，说明该位置的节点不需要移动
                    // 并让 j 指向下一个位置
                    j--;
                }
            }
        } else {
            // 确定有没有要新添加的元素,即在没有需要移动元素的情况下，要遍历有没有要添加的新元素
            for (let i = 0; i < source.length; i++) {
                if (source[i] === -1) {
                    const pos = i + nextStart
                    const nextVNode = nextChildren[pos];
                    const nextPos = pos + 1;
                    mount(vm, nextVNode, container, nextPos < nextChildren.length ?
                        nextChildren[nextPos].el : null)
                }
            }
        }
    }

}

/**
 * 求解最长递增子序列，返回数组形式的索引值
 * @param {*} list 
 */
function lis(list) {
    let dp = [1];
    let ends = [list[0]];
    let maxIndex = 0;
    let maxNum = 1;

    for (let i = 1, l = list.length; i < l; i++) {
        let leftIndex = getLeftIndex(list[i]);
        if(leftIndex === -1){
            ends.push(list[i]);
            dp[i] = ends.length;
        }else{
            ends[leftIndex] = list[i];
            dp[i] = leftIndex + 1;
        }
        
        if(dp[i] > maxNum){
            maxNum = dp[i];
            maxIndex = i;
        }
    }
    

    function generateLIS() {
        let res = [maxIndex];
        for (let i = maxIndex; i >= 0; i--) {
            if ((list[i] < list[maxIndex]) && (dp[i] + 1 === dp[maxIndex])) {
                res.unshift(i)
                maxIndex = i;
            }
        }
        return res;
    }

    function getLeftIndex(aim){
        let left = 0;
        let right = ends.length - 1;
        let mid = 0;
        while( left < right ){
            mid = left + ((right - left) >> 1);
            if(aim === ends[mid]){
                return mid;
            }else if(ends[mid] < aim){
                left = mid + 1;
            }else{
                right = mid - 1;
            }
        }
        return ends[left] >= aim ? left : -1;
    }

    return generateLIS();
}

function patchText(prevVNode, nextVNode) {
    const el = (nextVNode.el = prevVNode.el);
    if (nextVNode.children !== prevVNode.children) {
        el.nodeValue = nextVNode.children;
    }
}

function patchFragment(prevVNode, nextVNode, container) {
    patchChildren(
        prevVNode.childFlags, // 旧片段的子节点类型
        nextVNode.childFlags, // 新片段的子节点类型
        prevVNode.children, // 旧片段的子节点
        nextVNode.children, // 新片段的子节点
        container
    )

    switch (nextVNode.childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            nextVNode.el = nextVNode.children.el;
            break;
        case ChildrenFlags.NO_CHILDREN:
            nextVNode.el = prevVNode.el;
            break;
        default:
            nextVNode.el = nextVNode.children[0].el;
    }
}

function patchComponent(vm, prevVNode, nextVNode, container) {

    if (nextVNode.tag !== prevVNode.tag) {
        replaceVNode(vm, prevVNode, nextVNode, container)
    } else if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        // 获取组件实例
        const instance = (nextVNode.children = prevVNode.children);
        nextVNode.el = prevVNode.el;
        updateProps(instance, nextVNode);
        
    }
}

function updateProps(instance, vnode) {
    const attrs = vnode.data.attrs;
    for (let key in attrs) {
        instance[key] = attrs[key];
    }
}


export function normalizeStyle(styleObj) {
    if (Array.isArray(styleObj)) {
        let pre = Object.create(null);
        for (let i = 0, l = styleObj.length; i < l; i++) {
            Object.assign(pre, styleObj[i]);
        }
    }
    return styleObj;
}

export function normalizeClass(classObj) {
    if (Array.isArray(classObj)) {
        classObj = classObj.join(" ");

    } else if (isPlainObject(classObj)) {
        let pre = '';
        for (let className in classObj) {
            classObj[className] ? pre += (" " + className) : '';
        }
        classObj = pre.slice(1);
    }
    return classObj;
}

function setClass(el, classStr) {
    const hasPlainClass = el.className === '';
    if (hasPlainClass) {
        el.className = classStr
    } else {
        el.className = `${el.className} ${classStr}`
    }
}

function setStyle(el, styleObj) {
    for (let i in styleObj) {
        el.style[i] = styleObj[i];
    }
}
export function setEvents(vm, el, eventObj) {
    const keys = Object.keys(eventObj);
    for (let i = 0, l = keys.length; i < l; i++) {
        const event = keys[i];
        if (!isNativeEvent(event)) {
            
            if (!vm._events) {
                vm._events = {}
            }
            if (!vm._events[event]) {
                vm._events[event] = [];
            }

            let list = vm._events[event];
            for (let i = 0, l = list.length; i < l; i++) {
                if (list[i] === eventObj[event]) {
                    return;
                }
            }




            vm._events[event].push(eventObj[event]);
        } else {
            el.addEventListener(event, eventObj[event]);
        }

    }
}

/**
 * 处理m-show,m-model
 */
function setDirectives(vm, el, dirs) {
    if (Array.isArray(dirs)) {
        
        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            if (dir.name === 'model') {
                el.addEventListener('compositionstart', function ($event) {

                    $event.target.composing = true;
                })
                el.addEventListener('compositionend', function ($event) {
                    if (!$event.target.composing) {
                        return
                    }
                    $event.target.composing = false;
                    trigger($event.target, 'input');
                })
            } else if (dir.name === 'show') {
                el.style.visibility = dir.value ? 'visible' : 'hidden';
            }
        }
    }
}

function trigger(el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
}