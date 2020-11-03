// 设置了g会更新RegExp对象上的lastIndex！
const tagRE = /\{\{((?:.|\n)+?)\}\}/g;
export function parseText(text){
    
    if(!tagRE.test(text)){   
        return;
    }
    const tokens = [];
    //因为之前使用过lastIndex所以regExp上的lastIndex就变为11了，这个时候重新匹配要重置lastIndex;
    let lastIndex = tagRE.lastIndex = 0;
    let match,index;
    while((match = tagRE.exec(text))){
        
        index = match.index;
        // 先把{{ 前面的文本加入到tokens中
        if(index > lastIndex){
            tokens.push(JSON.stringify(text.slice(lastIndex,index)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index + match[0].length;
    }

    if(lastIndex < text.length){
        tokens.push(JSON.stringify(text.slice(lastIndex)));
    }
    return tokens.join("+");
}