export function on(el,dir){
    el.wrapListeners = (code) => `_g(${code},${dir.value})`
}