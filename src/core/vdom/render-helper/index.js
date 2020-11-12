
import { toNumber,looseEqual, looseIndexOf,toString } from '../../../shared/util';
import { createTextVNode, createEmptyVNode,h } from '../vnode'
import { renderList } from './render-list'
import { renderStatic } from './renderStatic'

export function installRenderHelper(target){
    target._n = toNumber;
    target._s = toString;
    target._l = renderList;
    target._q = looseEqual;
    target._i = looseIndexOf;
    target._m = renderStatic;
    //target._b = bindObjectProps;
    target._v = createTextVNode;
    target._e = createEmptyVNode;
    target._c = h;
    //target._g = bindObjectListeners
}