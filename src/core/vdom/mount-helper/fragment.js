import {
    ChildrenFlags,
    createTextVNode
} from '../vnode'
import {
    mountText
} from './text';
import {
    mount
} from '../render'
export function mountFragment(vm,vnode, container) {
    const {
        children,
        childFlags
    } = vnode;
    switch (childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            mount(vm,children, container)
            break
        case ChildrenFlags.NO_CHILDREN:
            const placeholder = createTextVNode('')
            mountText(placeholder, container);
            break
        default:
            // 多个子节点，遍历挂载之
            for (let i = 0; i < children.length; i++) {
                mount(vm,children[i], container)
            }
    }
}