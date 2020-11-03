export default function genData(el){
    let data = '';
    if (el.staticClass){
        data += `staticClass:${el.staticClass},`
    }
    if (el.classBinding){
        data += `class:${el.classBinding},`
    }
    return data;
}