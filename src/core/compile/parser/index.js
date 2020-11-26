import {
    parseHTML
} from './html-parser'
import {
    parseText
} from './text-parser'
import {
    makeAttrsMap,
    getAndRemoveAttr,
    getBindingAttr,
    addProp,
    addAttr,
    addRawAttr,
    mustUseProp,
    addHandler,
    addDirective,
    isTextTag,
    decodeHTMLCached
} from './helper'
import {
    optimize
} from './optimizer';
import {
    extend,
    warn,
    
} from '../../../shared/util'

import { generate } from '../codegen/index'


export const onRE = /^@|^m-on:/
export const dirRE = /^m-|^@|^:/
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g

export const bindRE = /^:|^m-bind:/



export function createASTElement(tag, attrs, parent) {
    return {
        type: 1,
        tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        parent,
        children: []
    }

}

function cloneASTElement(el) {
    return createASTElement(el.tag, el.attrsList.slice(), el.parent);
}

export function compileToFunctions(template, vm) {
    // 最终返回AST对象
    let root;
    // 当前元素的父级元素
    let currentParent;
    // 用于辅助生成AST的临时栈
    let stack = [];
    parseHTML(template, {
        // 开始标签的回调函数
        start(tag, attrs, unary) {
            let element = createASTElement(tag, attrs, currentParent);


            // 前置处理
            element = preTransformNode(element) || element;
            if(!element.processed){
                processFor(element);
                processIf(element);
                processElement(element);

            }


            // 第一次进入确认根节点
            if (!root) {
                root = element;
            }



            if (currentParent) {
                // 处理if节点
                if (element.elseif || element.else) {
                    processIfConditions(element, currentParent);
                } else {
                    currentParent.children.push(element);
                    element.parent = currentParent;
                }
            }

            // 不是单标签
            if (!unary) {
                currentParent = element;
                stack.push(element);
            }

        },
        // 结束标签的回调
        end() {
            stack.length -= 1;
            currentParent = stack[stack.length - 1];
        },
        // 文本内容的回调函数
        chars(text) {
            if (!currentParent) {
                return;
            }
            const children = currentParent.children;
            text = text.trim() ? 
                (isTextTag(currentParent) ? text : decodeHTMLCached(text))
                : children.length ? ' ':''

            if (text) {
                let expression;
                if (text !== ' ' && (expression = parseText(text))) {
                    children.push({
                        type: 2,
                        expression,
                        text
                    })
                } else if(text !== ' ' || !children.length || children[children.length - 1].text !== ' '){
                    children.push({
                        type: 3,
                        text,
                    })
                }
            }
        },
        comment(text) {
            currentParent.children.push({
                type: 3,
                text,
                isComment: true
            })
        }
    })
    console.log(root)
    optimize(root)
    let code = generate(root);
    console.log(code)
    
    return {
        root,
        render: code.render,
        staticRenderFns: code.staticRenderFns
    }
}

function processFor(el) {
    let exp;
    if ((exp = getAndRemoveAttr(el, 'm-for'))) {
        const res = parseFor(exp);
        if (res) {
            extend(el, res);
        } else {
            warn(`Invalid m-for expression: ${exp}`)
        }
    }
}

export function parseFor(exp) {
    const inMatch = exp.match(forAliasRE)
    if (!inMatch) return
    const res = {}
    res.for = inMatch[2].trim()
    const alias = inMatch[1].trim().replace(stripParensRE, '')
    const iteratorMatch = alias.match(forIteratorRE)
    if (iteratorMatch) {
        res.alias = alias.replace(forIteratorRE, '').trim()
        res.iterator1 = iteratorMatch[1].trim()
        if (iteratorMatch[2]) {
            res.iterator2 = iteratorMatch[2].trim()
        }
    } else {
        res.alias = alias
    }
    return res
}

function processIf(el) {
    const exp = getAndRemoveAttr(el, 'm-if')
    if (exp) {
        el.if = exp
        addIfCondition(el, {
            exp: exp,
            block: el
        })
    } else {
        if (getAndRemoveAttr(el, 'm-else') != null) {
            el.else = true
        }
        const elseif = getAndRemoveAttr(el, 'm-else-if')
        if (elseif) {
            el.elseif = elseif
        }
    }
}

function processIfConditions(el, parent) {
    const prev = findPrevElement(parent.children)
    if (prev && prev.if) {
        addIfCondition(prev, {
            exp: el.elseif,
            block: el
        })
    } else {
        warn(
            `m-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
            `used on element <${el.tag}> without corresponding m-if.`
        )
    }
}

function findPrevElement(children) {
    let i = children.length
    while (i--) {
        if (children[i].type === 1) {
            return children[i]
        } else {
            warn(`text "${children[i].text.trim()}" between m-if and m-else(-if) ` +
                `will be ignored.`)
            children.pop()
        }
    }
}

export function addIfCondition(el, condition) {
    if (!el.ifConditions) {
        el.ifConditions = []
    }
    el.ifConditions.push(condition)
}

function processKey(el) {
    const exp = getBindingAttr(el, 'key');
    if (exp) {
        el.key = exp;
    }
}

function processComponent(el) {
    let binding;
    if ((binding = getBindingAttr(el, 'is'))) {
        el.component = binding;
    }
}

function processAttrs(el) {
    const list = el.attrsList;
    // isProp标识该绑定的属性是否是原生DOM属性
    let i, l, name, rawName, value, isProp;
    for (i = 0, l = list.length; i < l; i++) {
        name = rawName = list[i].name;
        value = list[i].value;


        // 对于指令属性的处理
        if (dirRE.test(name)) {
            el.hasBindings = true;
            // todo对于修饰符的解析支持


            // 解析m-bind
            if (bindRE.test(name)) {
                name = name.replace(bindRE, '');
                isProp = false;
                if (isProp ||
                    !el.component && mustUseProp(el.tag, el.attrsMap.type, name)) {
                    addProp(el, name, value);
                } else {
                    addAttr(el, name, value);
                }

                // 解析m-on
            } else if (onRE.test(name)) {
                name = name.replace(onRE, '');
                addHandler(el, name, value, null, false)

                // 解析其他指令 m-text,m-html,m-show,m-model
            } else {
                name = name.replace(dirRE, '');
                addDirective(el, name, rawName, value);
            }




        }
        // 对于非指令属性的处理,
        // 1. 不包括key,is。因为已经在前面处理过了
        // 2. 不处理class,style,在中置处理函数中处理
        else {
            addAttr(el, name, JSON.stringify(value));
        }
    }
}

/**
 * 处理使用了m-model 且 绑定了type的input标签
 * @param {*} el 
 */
function preTransformNode(el) {
    if (el.tag === 'input') {
        const map = el.attrsMap;
        if (!map['m-model']) {
            return;
        }
        let typeBinding;
        if (map[':type'] || map['m-bind:type']) {
            typeBinding = getBindingAttr(el, 'type');
        }

        // m-bind  = "{ type: xxxx }"拿到这种形式的type
        if (!map.type && !typeBinding && map['m-bind']) {
            typeBinding = `(${map['m-bind']}).type`
        }
        
        if (typeBinding) {
            const ifCondition = getAndRemoveAttr(el, 'm-if', true);
            const ifConditionExtra = ifCondition ? `&&(${ifCondition})` : '';
            const hasElse = getAndRemoveAttr(el, 'm-else', true) != null;
            const elseIfCondition = getAndRemoveAttr(el, 'm-else-if', true);
            // 增加一个checkbox的input标签
            const branch0 = cloneASTElement(el);
            processFor(branch0);
            addRawAttr(branch0, 'type', 'checkbox');
            processElement(branch0);
            branch0.processed = true;
            branch0.if = `(${typeBinding})==='checkbox'` + ifConditionExtra;
            addIfCondition(branch0, {
                exp: branch0.if,
                block: branch0
            })

            // 增加一个radio的标签
            const branch1 = cloneASTElement(el);
            getAndRemoveAttr(branch1, 'm-for', true);
            addRawAttr(branch1, 'type', 'radio');
            processElement(branch1);
            addIfCondition(branch0, {
                exp: `(${typeBinding})==='radio'` + ifConditionExtra,
                block: branch1
            })

            // type为其他的情况
            const branch2 = cloneASTElement(el);
            getAndRemoveAttr(branch2, 'm-for', true)
            addRawAttr(branch2, ':type', typeBinding)
            processElement(branch2)
            addIfCondition(branch0, {
                exp: ifCondition,
                block: branch2
            })

            if (hasElse){
                branch0.else = true;
            } else if (elseIfCondition){
                branch0.elseif = elseIfCondition;
            }

            return branch0;

        }

    }

};

function processElement(element) {
    processKey(element);

    // m-for、m-if/m-else-if/m-else、m-once 
    // 等指令会被认为是结构化的指令(structural directives)
    // 没有这些指令就被认为该Node是纯的，静态优化会有用
    element.plain = !element.key && !element.attrsList.length
    processComponent(element)
    // 对class,style的解析(后置处理)
    transformNodeClass(element);
    transformNodeStyle(element);


    processAttrs(element)
}

function transformNodeClass(el){
    const staticClass = getAndRemoveAttr(el,'class');
    //处理静态class
    if(staticClass){
        el.staticClass = JSON.stringify(staticClass);
    }
    // 处理:class / m-bind:class
    const classBinding = getBindingAttr(el,'class',false);
    if (classBinding){
        el.classBinding = classBinding;
    }
}

function transformNodeStyle(el){
    const staticStyle = getAndRemoveAttr(el,'style');
    if(staticStyle){
        el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    }
    const styleBinding = getBindingAttr(el,'style',false);
    if (styleBinding){
        el.styleBinding = styleBinding
    }
}


/**
 * 先listDelimiter分割好分号
 * 再分割分号形成key-value值
 * @param {*} style 
 */
function parseStyleText(style){
    const res = {};

    // 分号后面不能存在一个或多个非左括号后面跟右括号
    // background: url(www.xxx.com?a=1&amp;copy=3)
    // 上面式子中的分号就不会被分割
    const listDelimiter = /;(?![^(]*\))/g;
    const propertyDelimiter = /:(.+)/
    style.split(listDelimiter).forEach(function(item){
        if(item){
            let tmp = item.split(propertyDelimiter);
            tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim()); 
        }
    })
    return res;
}