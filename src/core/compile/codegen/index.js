import {
    isHTMLTag
} from '../../../shared/util';
import ClassGenData from '../modules/class'
import StyleGenData from '../modules/style'
import baseDirectives from '../directives/index'
import {
    genHandlers
} from './events'
class CodegenState {
    constructor() {
        this.staticRenderFns = [];
        this.dataGenFns = [ClassGenData, StyleGenData];
        this.directives = baseDirectives;
        this.maybeComponent = (el) => !(isHTMLTag(el.tag) && !el.component);

    }

}

export function generate(ast) {
    let state = new CodegenState();
    let code = ast ? genElement(ast, state) : '_c("div")';

    return {
        render: `with(this){return ${code}}`,
        staticRenderFns: state.staticRenderFns
    }
}

function genElement(el, state) {
    // 处理静态根节点，放入静态函数组
    if (el.staticRoot && !el.staticProcessed) {
        return genStatic(el, state);
    } else if (el.for && !el.forProcessed) {
        return genFor(el, state);
    } else if (el.if && !el.ifProcessed) {
        return genIf(el, state);
    } else {
        let code;
        if (el.component) {
            code = genComponent(el.component, el, state);
        } else {
            let data;
            if (!el.plain) {
                data = genData(el, state);
            }

            const children = genChildren(el, state, true);
            code = `_c('${el.tag}'${
                data ? `,${data}` : ''
            }${
                children ? `,${children}` : ''
            })`
        }

        // todo 处理style,class
        return code;
    }
}

/**
 * 
 * @param {*} el 
 * @param {*} state 
 */
function genStatic(el, state) {
    el.staticProcessed = true;
    state.staticRenderFns.push(`with(this){ return ${genElement(el,state) }}`);
    return `_m(${state.staticRenderFns.length - 1})`;
}

/**
 * 处理带m-if的j节点
 * @param {*} el 
 * @param {*} state 
 */
function genIf(el, state) {
    el.ifProcessed = true;
    return genIfConditions(el.ifConditions.slice(), state);
}

function genIfConditions(conditions, state) {
    if (!conditions.length) {
        return '_e()'
    }
    // 拿到第一个元素
    const condition = conditions.shift();
    if (condition.exp) {
        return (
            `(${condition.exp})?${genElement(condition.block,state)}:${genIfConditions(conditions,state)}`
        )
    } else {
        return genElement(condition.block, state);
    }
}

function genFor(el, state) {
    let exp = el.for;
    let alias = el.alias;
    let iterator1 = el.iterator1 ? (`,${el.iterator1}`) : '';
    let iterator2 = el.iterator2 ? (`,${el.iterator2}`) : '';
    el.forProcessed = true;

    return (
        `_l((${exp}),` + `function(${alias}${iterator1}${iterator2}){` +
        `return ${genElement(el,state)}` +
        '})'
    )
}


function genChildren(el, state, checkSkip) {
    let children = el.children;
    if (children.length) {
        const el = children[0];
        if (children.length === 1 &&
            el.for &&
            el.tag !== 'template' &&
            el.tag !== 'slot') {
            const normalizationType = checkSkip && state.maybeComponent(el) ? `,1` : ``
            return `${genElement(el,state)}${normalizationType}`
        }
        const normalizationType = checkSkip ?
            getNormalizationType(children, state.maybeComponent) :
            0
        return `[${children.map(c => genNode(c, state)).join(',')}]${
            normalizationType ? `,${normalizationType}` : ''
        }`

    }
}

function getNormalizationType(
    children,
    maybeComponent
) {
    let res = 0
    for (let i = 0; i < children.length; i++) {
        const el = children[i]
        if (el.type !== 1) {
            continue
        }
        if (needsNormalization(el) ||
            (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
            res = 2
            break
        }
        if (maybeComponent(el) ||
            (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
            res = 1
        }
    }
    return res
}

function needsNormalization(el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode(node, state) {
    if (node.type === 1) {
        return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
        return genComment(node)
    } else {
        return genText(node)
    }
}

function genComponent(componentName, el, state) {
    let children = genChildren(el, state);
    return `_c(${componentName},${genData(el,state)}${children ? ("," + children) : ''})`
}

export function genText(text) {
    return `_v(${text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : JSON.stringify(text.text)
    })`
}

export function genComment(comment) {
    return `_e(${JSON.stringify(comment.text)})`
}

function genData(el, state) {
    let data = "{";
    const dirs = genDirectives(el, state);
    if (dirs) data += dirs + ',';

    if (el.key) {
        data += `key:${el.key}`
    }

    if (el.component) {
        data += `tag:"${el.tag}",`
    }

    for (let i = 0, l = state.dataGenFns.length; i < l; i++) {
        data += state.dataGenFns[i](el);
    }

    if (el.attrs) {
        data += `attrs:{${genProps(el.attrs)}},`
    }

    if (el.props) {
        data += `domProps:{${genProps(el.props)}},`
    }

    if (el.events) {
        data += `${genHandlers(el.events,false)},`
    }

    if (el.model) {
        data += `model:{value:${
          el.model.value
        },callback:${
          el.model.callback
        },expression:${
          el.model.expression
        }},`
    }

    // component v-model
    data = data.replace(/,$/, '') + '}';
    if (el.wrapData) {
        data = el.wrapData(data);
    }

    if (el.wrapListeners) {
        data = el.wrapListeners(data);
    }
    return data;



}

function genProps(props) {
    let res = '';
    for (let i = 0, l = props.length; i < l; i++) {
        const prop = props[i];
        res += `"${prop.name}":${prop.value},`
    }
    return res.slice(0, -1);

}

function genDirectives(el, state) {
    const dirs = el.directives;
    if (!dirs) return;
    let res = 'directives:[';
    let hasRuntime = false;
    let i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {

        dir = dirs[i];
        needRuntime = true;
        let gen = state.directives[dir.name];
        if (gen) {
            needRuntime = !!gen(el, dir);
        }
        // m-model需要拼接上render,其他指令不用
        if (needRuntime) {
            hasRuntime = true;
            res += `{name:${JSON.stringify(dir.name)},rawName:${JSON.stringify(dir.rawName)}` + `${dir.value ? 
                `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}`
                :''}` + `},`
        }

    }

    if (hasRuntime) {
        return res.slice(0, -1) + ']';
    }

}