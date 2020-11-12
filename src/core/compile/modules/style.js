export default function genData(el){
    let data = '';
    if (el.staticStyle){
        data += `staticStyle:${el.staticStyle},`;
    }
    if (el.styleBinding){
        data += `style:(${el.styleBinding}),`
    }
    return data;
}

