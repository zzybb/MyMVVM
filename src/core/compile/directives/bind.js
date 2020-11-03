export function bind(el,dir){
    el.wrapData = function(code){
        return `_b(${code},'${el.tag}',${dir.value})`
    }
}