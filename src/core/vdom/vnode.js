import {
    isHTMLTag
} from "../../shared/util";

export class VNode {
    constructor() {
        this._isVNode = true;
        this.el = null;
        this.flags = null;
        this.tag = null;
        this.data = null;
        this.children = null;
        this.childrenFlags = null;
    }
}

export const VNodeFlags = {
    ELEMENT_HTML: 1,
    ELEMENT_SVG: 1 << 1,
    COMPONENT_STATEFUL_NORMAL: 1 << 2,
    COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 3,
    COMPONENT_FUNCTIONAL: 1 << 4,
    TEXT: 1 << 5
}

VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG;
VNodeFlags.COMPONENT_STATEFUL =
    VNodeFlags.COMPONENT_STATEFUL_NORMAL |
    VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL

export const ChildrenFlags = {
    // 未知的 children 类型
    UNKNOWN_CHILDREN: 0,
    // 没有 children
    NO_CHILDREN: 1,
    // children 是单个 VNode
    SINGLE_VNODE: 1 << 1,
    // children 是多个拥有 key 的 VNode
    KEYED_VNODES: 1 << 2,
    // children 是多个没有 key 的 VNode
    NONE_KEYED_VNODES: 1 << 3
}
ChildrenFlags.MULTIPLE_VNODES = ChildrenFlags.KEYED_VNODES | ChildrenFlags.NONE_KEYED_VNODES

export const Fragment = Symbol();

/**
 * h函数实际上就是_c，用于生产vnode
 * childrenDeep用于表示有for循环，例如_c('div',{...},[_l(...),2)
 * 这代表了_l会生产出一个数组，这样孩子数组就是嵌套的，需要扁平化处理。
 * @param {*} tag 
 * @param {*} data 
 * @param {*} children 
 * @param {*} ChildrenDeep 
 */
export function h(tag, data = null, children = null, ChildrenDeep) {
    
    if (Array.isArray(data)) {
        children = data;
        data = null
    }
    let flags = null;
    if (isHTMLTag(tag)) {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_HTML : VNodeFlags.ELEMENT_SVG;
    } else if (tag === Fragment) {
        // 没有设置这个属性
        flags = VNodeFlags.FRAGMENT;
    } else {
        if (tag !== null && !isHTMLTag(tag)) {
            flags = VNodeFlags.COMPONENT_STATEFUL_NORMAL
        }
    }

    // 确定children类型
    let childFlags = null;
    if (Array.isArray(children)) {
        if (ChildrenDeep) {
            // 数组扁平化,处理m-for的问题
            children = children.flat()
        }
        const length = children.length;
        if (length === 0) {
            childFlags = ChildrenFlags.NO_CHILDREN
        } else if (length === 1) {
            childFlags = ChildrenFlags.SINGLE_VNODE
            children = children[0]
        } else {
            // 只有多个子节点的情况下，才会为每个节点设置key
            childFlags = ChildrenFlags.KEYED_VNODES;
            children = normalizeVNodes(children);
        }
    } else if (children == null) {
        childFlags = ChildrenFlags.NO_CHILDREN
    } else if (children._isVNode) {
        childFlags = ChildrenFlags.SINGLE_VNODE;
    }



    return {
        flags,
        tag,
        data,
        key: data && data.key ? data.key : null,
        children,
        childFlags,
        _isVNode: true,
        el: null
    }
}

function normalizeVNodes(children) {
    const newChildren = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.key == null) {
            // 如果原来的 VNode 没有key，则使用竖线(|)与该VNode在数组中的索引拼接而成的字符串作为key
            child.key = '|' + i;
        }
        newChildren.push(child);
    }
    return newChildren;
}

export function createTextVNode(text) {
    return {
        _isVNode: true,
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        children: text,
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}

export const createEmptyVNode = (text = '') => {
    return {
        _isVNode: true,
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        children: text,
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}