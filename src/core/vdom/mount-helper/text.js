/**
 * 文本可能导致XSS攻击，对于文本内容都是使用node.textContent和createTextNode来将文本不解释为HTML标签
 * @param {*} vnode 
 * @param {*} container 
 */
export function mountText(vnode,container){
    
    const el = document.createTextNode(vnode.children);
    vnode.el = el;
    container.appendChild(el);
}