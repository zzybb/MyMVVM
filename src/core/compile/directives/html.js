import { addProp } from '../parser/helper'
export function html(el,dir){
    if(dir.value){
        addProp(el,'innerHTML',`_s(${dir.value})`)
    }
}