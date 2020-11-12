export function mountText(vnode,container){
    const el = document.createTextNode(vnode.children);
    vnode.el = el;
    container.appendChild(el);
}