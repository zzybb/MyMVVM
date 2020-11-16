import {
    VNodeFlags
} from '../vnode'
import {
    MVVM
} from '../../../MVVM_entry'
import {
    warn
} from '../../../shared/util'
import {
    setEvents
} from '../patch'
export function mountComponent(vm, vnode, container,refNode) {
    if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
        mountStatefulComponent(vm, vnode, container,refNode);
    } else {
        //mountFunctionalComponent(vm, vnode, container);
    }
}

// 挂载有状态组件
function mountStatefulComponent(vm, vnode, container,refNode) {
    const componentOptions = vm.$options.components[vnode.tag];
    if (componentOptions) {
        componentOptions.el = container;
        componentOptions.refNode = refNode;

        if (componentOptions.props) {
            // 设置props
            setPropsData(componentOptions, vnode);
        }
        componentOptions.parent = container;
        
        // 创建组件实例
        const instance = new MVVM(componentOptions);
        if(vnode.data && vnode.data.on){
            
            // 为组件设置自定义事件
            setEvents(instance,instance.$el,vnode.data.on)
        }
        

        instance.$parent = vm;
        instance.$vnode = vnode;
        vnode.children = instance;
        vnode.el = instance.$el;

        (vm.$children || (vm.$children = [])).push(instance);
        // instance._update = function () {
        //     if (instance._mounted) {
        //         // 拿到旧的VNode
        //         const prevVNode = instance.$vnode;
        //         const nextVNode = (instance.$vnode = instance.render());
        //         patch(prevVNode, nextVNode, prevVNode.el.parentNode);
        //         instance.$el = vnode.el = instance.$vnode.el;
        //     } else {
        //         // 获取VNode
        //         instance.$vnode = instance.render();
        //         // 挂载
        //         mount(instance, instance.$vnode, container);
        //         // el属性值，vnode是组件的外壳vnode,$vnode是组件template生成的真实vnode
        //         instance.$el = vnode.el = instance.$vnode.el;
        //         // 调用mounted钩子
        //         callHook(instance,'mounted')
        //     }
        // }
        // instance._update()

    } else {
        warn(`component <${vnode.tag}> is not found`);
    }


}

function setPropsData(options, vnode) {
    
    const props = options.props;
    const attrs = vnode.data.attrs;
    if (attrs) {
        let r = {},
            propName,
            haveData = false;
        for (let i = 0, l = props.length; i < l; i++) {
            propName = props[i];
            if (attrs[propName]) {
                haveData = true;
                r[propName] = attrs[propName]
            }
        }

        if(haveData){
            options.propsData = r;
        }
        
    }

}