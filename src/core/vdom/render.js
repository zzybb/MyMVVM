import {
    VNodeFlags
} from './vnode'
import {
    mountElement,
} from './mount-helper/element'
import {
    mountText
} from './mount-helper/text'
import {
    mountFragment
} from './mount-helper/fragment'
import {
    mountComponent
} from './mount-helper/component'
import {
    patch
} from './patch'
import {
    installRenderHelper
} from './render-helper/index'
import {
    warn
} from '../../shared/util'
export function initRender(MVVM) {
    MVVM.prototype._update = function (vnode,hy) {
        const vm = this;
        let container = vm.$el;
        const prevVNode = vm._vnode;
        const parent = vm.$parent;
        let parentElm = null;
        
        if (prevVNode == null) {
            // 没有旧的VNode,只有新的VNode。第一次渲染
            if (!parent) {
                parentElm = container.parentNode;
                parentElm && parentElm.removeChild(container);
                container = parentElm;
            }else{
                container = parent;
            }
            
            if (vnode) {
                // 获取父节点,并替换成模板里的节点。
                mount(vm, vnode, container);
                vm._vnode = vnode;
                vm.$el = vnode.el;
            }
        } else {
            // 有旧的VNode，也有新的VNode.
            
            if (vnode) {
                
                patch(vm,prevVNode, hy ? null : vnode, container);
                vm._vnode = vnode;
                vm.$el = vnode.el;
            } else {
                // 有旧的但没新的，说明应该全部移除
                container.removeChild(prevVNode.el);
                vm._vnode = null;

            }
        }
    }

    MVVM.prototype._render = function () {
        const vm = this;
        const {
            render
        } = vm.$options;
        let vnode;
        try {
            vnode = render.call(vm);
        } catch (e) {
            warn(`Render Error:${e}`)
        }
        return vnode;
    }

    installRenderHelper(MVVM.prototype);
}


export function mount(vm, vnode, container,refNode) {
    const flags = vnode.flags;
    if (flags & VNodeFlags.ELEMENT) {
        // 挂载普通标签
        mountElement(vm, vnode, container,refNode)
    } else if (flags & VNodeFlags.COMPONENT) {
        // 挂载组件
        mountComponent(vm, vnode, container)
    } else if (flags & VNodeFlags.TEXT) {
        // 挂载纯文本
        mountText(vnode, container)
    } else if (flags & VNodeFlags.FRAGMENT) {
        // 挂载 Fragment
        mountFragment(vm, vnode, container)
    }
}

