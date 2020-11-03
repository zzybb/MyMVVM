import { addProp } from '../parser/helper'
export function text(el,dir){
    if (dir.value){
        addProp(el,'textContent',`_s(${dir.value})`)
    }
}