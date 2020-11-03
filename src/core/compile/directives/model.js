import {
    isHTMLTag,
    warn
} from "../../../shared/util";
import {
    addHandler,
    addProp,
    getBindingAttr
} from "../parser/helper";

export function model(el, dir) {
    const value = dir.value;
    const tag = el.tag;
    const type = el.attrsMap.type;

    if (el.component) {
        // 处理组件m-model
        genComponentModel(el,value);
    } else if (tag === 'select') {
        genSelect(el, value);
    } else if (tag === 'input' && type === 'checkbox') {
        genCheckboxModel(el, value);
    } else if (tag === 'input' && type === 'radio') {
        genRadioModel(el, value);
    } else if (tag === 'input' || tag === 'textarea') {
        genDefaultModel(el, value);
    } else if (!isHTMLTag(tag)) {
        genComponentModel(el,value);
        return false;
    } else {
        warn(`<${el.tag} m-model="${value}">: ` +
            `m-model is not supported on this element type. `)
    }

    return true;
}

/**
 * 设置change回调，调用时候为mmodel绑定的值赋值,如果
 * 绑定了m-bind:value = 'xxx' 就从_value取值。否则就从
 * value属性取值
 * @param {*} el 
 * @param {*} value 
 */
function genSelect(el, value) {
    const selectedVal = `Array.prototype.filter` +
        `.call($event.target.options,function(o){return o.selected})` +
        `.map(function(o){let val = "_value" in o ? o._value : o.value;` +
        `return val})`

    const assignment = `$event.target.multiple ? $$selectedVal : $$selectedVal[0]`;
    let code = `let $$selectedVal = ${selectedVal};`
    code = `${code}${genAssignmentCode(value,assignment)}`
    addHandler(el, 'change', code, null, true);
}

/**
 * 对input 输入框  textarea处理
 * @param {*} el 
 * @param {*} value 
 */
function genDefaultModel(el, value) {
    const type = el.attrsMap.type; {
        const value = el.attrsMap['m-bind:value'] || el.attrsMap[':value'];
        if (value) {
            const binding = el.attrsMap['m-bind:value'] ? 'm-bind:value' : ':value'
            warn(`${binding}="${value}" conflicts with m-model on the same element `)
        }

    }

    // 是否要处理预输入，默认处理，因为没有加入修饰符系统
    const needComposiion = type !== 'range';
    const event = type === 'range' ? '__r' : 'input';
    let valueExpression = `$event.target.value`;
    let code = genAssignmentCode(value, valueExpression);
    if (needComposiion) {
        code = `if($event.target.composing)return;${code}`
    }
    addProp(el, 'value', `(${value})`);
    addHandler(el, event, code, null, true);
}


function genAssignmentCode(value, assignment) {
    const res = parseModel(value);
    if (res.key === null) {
        return `${value}=${assignment}`
    } else {
        return `$set(${res.exp},${res.key},${assignment})`
    }
}

// 处理m-model="obj.val"
// 暂不处理带[]的
function parseModel(val) {
    val = val.trim();
    let len = val.length;

    // 1. m-model = "name"
    // 2. m-model = "obj[name].age"
    // 3. m-model = "obj.name.age"
    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
        let index = val.lastIndexOf('.');
        if (index > -1) {
            return {
                exp: val.slice(0, index),
                key: JSON.stringify(val.slice(index + 1))
            }
        } else {
            return {
                exp: val,
                key: null
            }
        }
    }
}

/**
 * 1.m-model绑定了一个数组，就是多选复选框
 * 2.有true-value/false-value就选用这两个，没有就选value
 * 3.单个复选框绑定到布尔值
 * Props:{
 *     'checked':'xxxxxx'
 * },
 * events:{
 *     'change':'xxx'
 * }
 * @param {*} el 
 * @param {*} value 
 */
function genCheckboxModel(el, value) {
    const valueBinding = getBindingAttr(el, 'value') || 'null';
    const trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    const falseValueBinding = getBindingAttr(el, 'false-value');
    addProp(el, 'checked', `Array.isArray(${value})` +
        `?_i(${value},${valueBinding})>-1` + (
            trueValueBinding === 'true' ? `:(${value})` : `:_q(${value},${trueValueBinding})`
        ))
    addHandler(el, 'change',
        `let $$a=${value},` +
        `$$el=$event.target,` +
        `$$c=$$el.checked?(${trueValueBinding}):(${falseValueBinding});` +
        `if(Array.isArray($$a)){` +
        `let $$v=${valueBinding},` + `$$i=_i($$a,$$v);` +
        `if($$el.checked){$$i<0&&(${genAssignmentCode(value, '$$a.concat([$$v])')})}` +
        `else{$$i>-1&&(${genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')})}` +
        `}else{${genAssignmentCode(value,'$$c')}}`, null, true)
}

function genRadioModel(el, value) {
    let valueBinding = getBindingAttr(el, 'value') || 'null';
    addProp(el, 'checked', `_q(${value},${valueBinding})`);
    addHandler(el, 'change', genAssignmentCode(value, valueBinding))
}

function genComponentModel(el,value){
    const baseValueExpression = '$$v';
    let valueExpression = baseValueExpression;
    const assignment = genAssignmentCode(value,valueExpression);
    el.model = {
        value: `(${value})`,
        expression: `"${value}"`,
        callback: `function (${baseValueExpression}) {${assignment}}`
    }
}
