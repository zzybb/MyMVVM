const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/
export function genHandlers(events, isNative) {
    let res = isNative ? 'nativeOn:{' : 'on:{';
    for (const name in events) {
        res += `"${name}":${genHandler(name, events[name])},`
    }
    return res.slice(0, -1) + '}'
}

/**
 * 1. 方法可以写函数表达式 () => / function () {}
 * 2. 方法可以写简单路径@click="method"
 * 3. 可以直接写调用函数，并且将$events传递进去 @click="say('Hi',$events)"
 * 4. simplePathRE匹配 method,method.name.xx,method[xxx],method[0]
 * @param {*} name 
 * @param {*} handler 
 */
function genHandler(name, handler) {
    if (!handler) {
        return 'function(){}';
    }
    if (Array.isArray(handler)) {
        return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`
    }

    const isMethodPath = simplePathRE.test(handler.value)
    const isFunctionExpression = fnExpRE.test(handler.value)

    if (!handler.modifiers) {

        if (isMethodPath || isFunctionExpression) {
            return handler.value
        }
        return `function($event){${handler.value}}`
    }
}