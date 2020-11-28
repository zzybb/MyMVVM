import {
    patchData
} from '../patch'
import {
    ChildrenFlags
} from '../vnode'
import {
    mount
} from '../render'
/**
 * value,checked,selected,innerHTML,textContent需要使用property方式设置
 * 属性
 * @param {*} vnode 
 * @param {*} container 
 */
export function mountElement(vm,vnode, container,refNode) {
    
    const newElement = document.createElement(vnode.tag);
    vnode.el = newElement;
    // 获取VNodeData
    const data = vnode.data;
    if (data) {
        for (let key in data) {
            patchData(vm,newElement,key,null,data[key])
        }
    }

    // 递归挂载子节点
    const childFlags = vnode.childFlags;
    const children = vnode.children;
    // 检测如果没有子节点则无需递归挂载
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            // 如果是单个子节点则调用 mount 函数挂载
            mount(vm,children, newElement)
        } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
            // 如果是多个子节点则遍历并调用 mount 函数挂载
            for (let i = 0; i < children.length; i++) {
                mount(vm,children[i], newElement)
            }
        }
    }

    refNode ? container.insertBefore(newElement,refNode): container.appendChild(newElement);
}

export function setClass(el, classObj) {
    // 静态class
    let haveClass = el.className === '';
    if (Array.isArray(classObj)) {
        classObj = classObj.join(" ");
    } else if (isPlainObject(classObj)) {
        let pre = '';
        for (let className in classObj) {
            classObj[className] ? pre += (" " + className) : '';
        }
        classObj = pre.slice(1);
    }

    if (!haveClass) {
        el.className = classObj;
    } else {
        el.className = `${el.className} ${classObj}`;
    }
}

export function setStyle(el, styleObj) {
    if (Array.isArray(styleObj)) {
        let pre = Object.create(null);
        for (let i = 0, l = styleObj.length; i < l; i++) {
            Object.assign(pre, styleObj[i]);
        }
        styleObj = pre;
    }

    if (isPlainObject(styleObj)) {
        for (let styleName in styleObj) {
            el.style[styleName] = styleObj[styleName];
        }
    }

}
