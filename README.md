# MVVM
 MVVM是一个类Vue的框架，以学习vue源码为目的的去通过阅读vue2.5.1以及Vue3渲染器相关源码完成。API设计均与Vue2一样。
### 如何开始
1.在html文件引入dist/MVVM.js。
2.新建MVVM实例。

    let vm = new MVVM({
        el:'#app',
        data:{
    
        },
        .....
    })
### 生命周期
beforeCreat,created,beforeMount,mounted,beforeUpdate,updated,beforeDestroy,destoryed
### MVVM实例方法
$mount.$on,$emit,$off,$destory,$nextTick
### 全局API
MVVM.delete,MVVM.compile,MVVM.set,MVVM.nextTick.
### 虚拟DOM以及diff算法相关优化
虚拟DOM对于每一个元素都有相应的标记，孩子节点也有标记，用于快速对比，使用位运算加速对比过程。

vnode节点


    export const VNodeFlags = {
        ELEMENT_HTML: 1,
        ELEMENT_SVG: 1 << 1,
        COMPONENT_STATEFUL_NORMAL: 1 << 2,
        COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
        COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
        COMPONENT_FUNCTIONAL: 1 << 5,
        TEXT: 1 << 6
    }
    
    VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG;
    VNodeFlags.COMPONENT_STATEFUL =
        VNodeFlags.COMPONENT_STATEFUL_NORMAL |
        VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
        VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE
    VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL
children节点

    export const ChildrenFlags = {
        // 未知的 children 类型
        UNKNOWN_CHILDREN: 0,
        // 没有 children
        NO_CHILDREN: 1,
        // children 是单个 VNode
        SINGLE_VNODE: 1 << 1,
        // children 是多个拥有 key 的 VNode
        KEYED_VNODES: 1 << 2,
        // children 是多个没有 key 的 VNode
        NONE_KEYED_VNODES: 1 << 3
    }
    ChildrenFlags.MULTIPLE_VNODES = ChildrenFlags.KEYED_VNODES | ChildrenFlags.NONE_KEYED_VNODES
#### diff算法
采用[inferno](https://github.com/infernojs/inferno "inferno")的最长递增子序列diff算法。

## 项目结构


    |--dist
    |--example
    |--src
    |----core
    |    |--compile            #编译器代码
    |    |    |--codegen       #将AST生成render函数
    |    |    |--directives    #针对代码字符串生成中m-on,m-bind(m-bind=""),m-html等的处理代码
    |    |    |--modules       #针对代码字符串生成中class,style的处理
    |    |    |--parser        #模板编译成AST，静态优化AST代码
    |    |--observer           #响应式系统代码
    |    |--vdom               #虚拟DOM，渲染器代码
    |    |--index.js           #初始化相关代码
    |----shared                #全局工具函数库
    |    |--util.js
    |----MVVM_entry.js         #MVVM入口文件


# 参考目录

1. << 深入浅出Vue.js >> 刘博文
2. << JavaScript高级程序设计 >> Nicholas C.Zakas
3. [掘金Vue源码解析系列文章](https://juejin.im/user/3438928101376718/posts?sort=newest "掘金Vue源码解析系列文章")
4. [learnVue](https://github.com/answershuto/learnVue "learnVue")
5. [Vue2编译器](http://caibaojian.com/vue-design/art/80vue-compiler-start.html "Vue2编译器")
6. [渲染器](http://hcysun.me/vue-design/zh/essence-of-comp.html "渲染器")
