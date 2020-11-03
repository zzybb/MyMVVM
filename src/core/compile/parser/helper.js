import { cached, makeMap } from '../../../shared/util'
import he from 'he'
export const dirRE = /^m-|^@|^:/
export const eventsRE = /^m-on|^@/
export const bindRE = /^:|^m-bind:/
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
export const stripParensRE = /^\(|\)$/g;
export const IfRE = /^m-if|^m-else-if|^m-else/

export function makeAttrsMap(attrs) {
    const map = {}
    for (let i = 0, l = attrs.length; i < l; i++) {
        map[attrs[i].name] = attrs[i].value
    }
    return map
}

export function getAndRemoveAttr(el,name,removeFromMap){
    let val;
    if((val = el.attrsMap[name]) != null){
        const list = el.attrsList;
        for(let i = 0,l = list.length;i < l;i++){
            if(list[i].name === name){
                list.splice(i,1);
                break;
            }
        }
    }
    if(removeFromMap){
        delete el.attrsMap[name];
    }
    return val;
}

/**
 * JSON.stringify对于属性的处理至关重要，能够区分字符串和变量！
 * test、1
 *   const fn1 = new Function('console.log(1)') ==>
 *      const fn1 = function () {
        console.log(1)
     }
 * test、2
 *   const fn2 = new Function(JSON.stringify('console.log(1)'))
 *     const fn2 = function () {
         'console.log(1)'
        }
 * @param {*} el 
 * @param {*} name 
 * @param {*} getStatic 确定要不要获取static的属性
 */
export function getBindingAttr(el,name,getStatic){
    const dynamicValue = 
    getAndRemoveAttr(el,`:${name}`) || 
    getAndRemoveAttr(el,`m-bind:${name}`)
    if(dynamicValue){
        return dynamicValue;
    } else if(getStatic !== false){
        const staticValue = getAndRemoveAttr(el,name);
        if(staticValue){
            return JSON.stringify(staticValue);
        }
    }
}

/**
 * 将元素对象添加进AST的props属性中
 * @param {*} el 
 * @param {*} name 
 * @param {*} value 
 */
export function addProp(el,name,value){
    (el.props || (el.props = [])).push({name,value});
    el.plain = false;
} 


export function addAttr(el,name,value){
    (el.attrs || (el.attrs = [])).push({name,value});
    el.plain = false;
}

export function addRawAttr(el,name,value){
    el.attrsMap[name] = value;
    el.attrsList.push({ name,value })
}

const acceptValue = makeMap('input,textarea,option,select,progress')
export function mustUseProp(tag,type,attr){
    return (
        (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
        (attr === 'selected' && tag === 'option') ||
        (attr === 'checked' && tag === 'input') ||
        (attr === 'muted' && tag === 'video')
    )
}

/**
 * 为AST添加事件
 * @param {*} el 
 * @param {*} name 
 * @param {*} value 
 * @param {*} modifiers 
 * @param {*} important 
 */
export function addHandler(
    el,
    name,
    value,
    modifiers,
    important
){
    let events = el.events || (el.events = {});
    const newHandler = {
        value: value.trim()
    }
    const handlers = events[name];
    if(Array.isArray(handlers)){
        important ? handlers.unshift(newHandler) : handlers.push(newHandler)

    }else if(handlers){
        events[name] = important ? [newHandler,handlers] : [handlers,newHandler]

    }else{
        events[name] = newHandler
    }
    el.plain = false;
}

export function addDirective(el,name,rawName,value){
    (el.directives || (el.directives = [])).push({ name, rawName, value })
    el.plain = false
}

export function isTextTag(el){
    return el.tag === 'script' || el.tag === 'style'

}


export const decodeHTMLCached = cached(he.decode)



