export function renderStatic(index){
    const cached = this._staticTrees || (this._staticTrees = [])
    let tree = cached[index];
    if(tree){
        return tree;
    }
    tree = cached[index] = this.$options.staticRenderFns[index].call(
        this
    )
    tree.isStatic = true;
    return tree;
}
