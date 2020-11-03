import {
    warn
} from "../../../shared/util";

const attribute = /^\s*([^\s"'<>\\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const comment = /^<!--/
const ncname = `[a-zA-Z_][\\w\\-\\.]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\/${qnameCapture}[^>]*>`);
const doctype = /^<!DOCTYPE [^>]+>/i;

let special = makeMap("script,style,textarea");

function makeMap(str) {
    let obj = {},
        items = str.split(",");
    for (let i = 0, l = items.length; i < l; i++) {
        obj[items[i]] = true;
    }
    return obj;
}

/**textStart > 0代表标签之前文本
 * textStart < 0代表没有标签(纯文本)
 * textStart === 0代表以标签开头 {
 *     注释：<!--
 *     开始标签：<div
 *     结束标签: </div
 * }
 *    
 * 
 * @param {*} html 
 * @param {*} options 
 */

export function parseHTML(template, options) {
    let checkStack = [];
    let html = template;
    let index = 0;
    let lastTag = null;
    checkStack.last = function () {
        return this[this.length - 1];
    }
    while (html) {
        lastTag = checkStack.last() && checkStack.last().lowerCaseTag;
        // 确定标签是不是纯文本，如果是纯文本就把标签内全部当作文本处理 
        if (!lastTag || !special[lastTag]) {
            
            let textStart = html.indexOf('<');
            if (textStart === 0) {
                // 匹配注释并截取
                if (html.match(comment)) {
                    const commentEnd = html.indexOf('-->');
                    if (commentEnd >= 0) {
                        options.shouldkeepComment &&
                            options.comment(html.substring(4, commentEnd));
                    }
                    advance(commentEnd + 3);
                    continue;
                }
                // 针对<!DOCTYPE
                let doctypeMatch = html.match(doctype);
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length);
                    continue;
                }


                //'<'的索引是0，说明一定能够是开始标签
                let startTagMatch = parseStartTag();
                if (startTagMatch) {
                    handleStartTag(startTagMatch);
                    continue;
                }
                let endTagMatch = html.match(endTag);
                if (endTagMatch) {
                    advance(endTagMatch[0].length);
                    parseEndTag(endTagMatch[1]);
                    continue;
                }
            }
            let text, rest, next;
            // 标签前面有文本
            if (textStart >= 0) {
                rest = html.slice(textStart);
                // while循环处理1<2</div>这种<可能作为文本的情况
                while (
                    !endTag.test(rest) &&
                    !startTagOpen.test(rest) &&
                    !comment.test(rest)
                ) {
                    next = rest.indexOf('<', 1);
                    if (next < 0) break;
                    textStart += next;
                    rest = html.slice(textStart);
                }
                text = html.substring(0, textStart);
                advance(textStart);
            }

            // 整个html全是文本
            if (textStart < 0) {
                text = html;
                html = '';
            }

            if (options.chars && text) {
                options.chars(text);
            }

        }else{
            const stackedTag = lastTag;
            const regStackedTag =  new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)',"i");
            html = html.replace(regStackedTag,function(all,text){
                if(options.chars){
                    options.chars(text)
                }
                return ''
            })
            parseEndTag(stackedTag)
        }
    }

    function advance(n) {
        index += n;
        html = html.substring(n);
    }

    /**
     * 处理匹配开始标签的属性
     * 把当前元素添加到checkStack中
     * @param {*} match 匹配到开始标签的结果 
     */
    function handleStartTag(match) {
        
        let tagName = match.tagName;
        let unaryTag = match.isUnary;
        let attrs = [];

        attrs.length = match.attrs.length;
        for (let i = 0; i < attrs.length; i++) {
            attrs[i] = {
                name: match.attrs[i][1],
                value: match.attrs[i][3] || match.attrs[i][4] || match.attrs[i][5] || ''
            }
        }

        let isUnary = isUnaryTag(tagName) || !!unaryTag;
        if (!isUnary) {
            checkStack.push({
                tag: tagName,
                attrs,
                lowerCaseTag: tagName.toLowerCase()
            })
        }
        // 通过回调函数调用

        options.start && options.start(tagName, attrs, isUnary)

    }

    /**
     * 处理开始标签，如果确实是开始标签，返回标签名，以及属性
     */
    function parseStartTag() {
        let start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            advance(start[0].length);
            let end, attr;
            // 截取属性
            while (!(end = html.match(startTagClose)) &&
                (attr = html.match(attribute))) {
                advance(attr[0].length);
                match.attrs.push(attr)
            }
            //去掉开始标签尖角号
            if (end) {
                match.isUnary = !!end[1];
                match.end = index;
                advance(end[0].length);
                return match;
            }
        }

    }

    /**
     * 处理结束标签
     * @param {*} tagName 
     */
    function parseEndTag(tagName) {
        let lowerCaseTagName = tagName.toLowerCase();
        if (checkStack.length &&
            checkStack.last().lowerCaseTag === lowerCaseTagName) {
            checkStack.pop();
            options.end && options.end();
        } else {
            warn(`tag </${tagName}> can not find startTag`)
        }

    }

    function isUnaryTag(tagName) {
        const unaryTag = 'area,base,br,col,embed,frame,hr,img,input,' +
            'isindex,keygen,link,meta,param,source,track,wbr';
        return unaryTag.split(",").indexOf(tagName) >= 0;
    }


}