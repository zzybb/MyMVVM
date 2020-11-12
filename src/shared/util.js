//创建一个映射并返回一个函数，以检查键是否在该映射中。
export function makeMap(str, expectsLowerCase) {
    const map = Object.create(null)
    const list = str.split(',')
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase ?
        val => map[val.toLowerCase()] :
        val => map[val]
}
export const isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template'
)

export const isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
)

export const isStaticKey = makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,staticClass,staticStyle'
)

export const isNativeEvent = makeMap(
    `abort,blur,change,click,dbclick,error,focus,keydown,keypress,` +
    `keyup,load,mousedown,mousemove,mouseout,mouseover,mouseup,reset` +
    `resize,select,submit,unload,input`
)

export function remove(arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1);
        }
    }
}


/**
 * 利用闭包可以将普通函数转换为带缓存的函数
 * @param {*} fn 
 */
export function cached(fn) {
    const cache = Object.create(null);
    return function cachedFn(str) {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    }

}

export function noop() {}
export function isFunction(obj) {
    return typeof obj === 'function'
}
export function isObject(val) {
    return (val !== null) && typeof val === 'object';
}
const bailRE = /[^\w.$]/
export function parsePath(path) {
    if (bailRE.test(path)) {
        return noop;
    }
    const segments = path.split('.')
    return function (obj) {
        for (let i = 0; i < segments.length; i++) {
            if (!obj) return
            obj = obj[segments[i]]
        }
        return obj
    }
}

export const hasPro = '__proto__' in {}
export function warn(msg) {
    console.error(`[MVVM warn]: ${msg}`)
}
export function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable,
        writable: true,
        configurable: true
    })
}

export function hasOwn(target, key) {
    return target.hasOwnProperty(key);
}

export function isValidArrayIndex(array, index) {
    return index >= 0 && (index < array.length)
}

const OBJECT_STRING = '[object Object]'
export function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === OBJECT_STRING
}

export function bind(context, cb) {
    return cb.bind(context);
}

export function query(el) {
    if (typeof el === 'string') {
        const selector = el;
        el = document.querySelector(el);
        if (!el) {
            return document.createElement('div');
        }
    }
    return el;
}

export const idToTemplate = cached(function (id) {
    let el = query(id);
    return el && el.innerHTML;
})

export function getOuterHTML(el) {
    if (el.outerHTML) {
        return el.outerHTML;
    } else { // 兼容outerHTML不能使用的情况
        let container = document.createElement('div');
        container.appendChild(el.cloneNode(true));
        return container.innerHTML;
    }
}

export function extend(target, other) {
    Object.assign(target, other)
}

export function toNumber(val) {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
}

export function looseEqual(a, b) {
    return a === b;
}

export function looseIndexOf(arr, val) {
    for (let i = 0; i < arr.length; i++) {
        if (looseEqual(arr[i], val)) return i
    }
    return -1
}

export function toString(val) {
    return val == null ?
        '' :
        typeof val === 'object' ?
        JSON.stringify(val, null, 2) :
        String(val)
}