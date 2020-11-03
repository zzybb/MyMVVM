import {
    isHTMLTag,
    isStaticKey
} from '../../../shared/util'

/**
 * <p>sss</p>这种一个元素只有一个静态文本的节点不会被标记为静态根节点，因为优化成本大于收益
 * @param {*} node 
 */
function markStaticRoots(node) {
    if (node.type === 1) {
        if (
            node.static &&
            node.children &&
            !(node.children.length <= 1 && node.children[0].type === 3)
        ) {
            node.staticRoot = true;
            return;
        } else {
            node.staticRoot = false;
        }
        if (node.children) {
            for (let i = 0, l = node.children.length; i < l; i++) {
                markStaticRoots(node.children[i])
            }
        }
        if (node.ifConditions) {
            for (let i = 1, l = node.ifConditions.length; i < l; i++) {
                markStaticRoots(node.ifConditions[i].block)
            }
        }
    }

}

function markStatic(node) {
    node.static = isStatic(node);
    if (node.type === 1) {
        if (
            !isHTMLTag(node.tag)
        ) {
            return
        }
        if (node.children) {
            for (let i = 0, l = node.children.length; i < l; i++) {
                const child = node.children[i];
                markStatic(child);
                if (!child.static) {
                    node.static = false;
                }
            }
        }
        if (node.ifConditions) {
            for (let i = 1, l = node.ifConditions.length; i < l; i++) {
                const block = node.ifConditions[i].block
                markStatic(block)
                if (!block.static) {
                    node.static = false
                }
            }
        }
    }

}

function isStatic(node) {
    if (node.type === 2) {
        return false;
    }
    if (node.type === 3) {
        return true;
    }

    return !!(
        !node.hasBingdings &&
        !node.if && !node.for &&
        isHTMLTag(node.tag) &&
        Object.keys(node).every(isStaticKey)
    )
}

export function optimize(root) {
    if (!root) return;
    // 标记所有静态节点
    markStatic(root);
    // 标记所有静态根节点
    markStaticRoots(root);
}