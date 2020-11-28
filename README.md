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


### 组件系统以及事件相关
只支持局部组件注册，props父传子以及组件上自定义事件

### 指令系统
支持m-on(@),m-bind(:),m-model(非组件)，m-for,m-html,m-text,m-show,m-if/m-else-if/m-else

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

# XSS防范相关
以下总结了几种XSS相关的安全漏洞，包括本框架是如何对其进行防范的。
- 在 HTML 中内嵌的文本中，恶意内容以 script 标签形成注入。
   例子：
```javascript

    <div id="blog-posts-events-demo">
            <p> {{ test }}</p>
    </div>
    let vm = new MVVM({
        data:{
           test:"<script>alert('XSS')<\/script>"
        }
    })
```
上面代码中，test可能是用户输入的内容，MVVM创建文本节点的方式为createTextNode,他不会将HTML标签解释执行，而是以纯文本
的形式进行解释。
- 在内联的 JavaScript 中，拼接的数据突破了原本的限制（字符串，变量，方法名等）。
针对内联script标签，MVVM放弃解析这类标签，并给出该标签不能出现在模板中的控制台提示。

- 在标签属性中，恶意内容包含引号，从而突破属性值的限制，注入其他属性或者标签。
例子:

```javascript
<div id="blog-posts-events-demo">
        <input type="text" :value="test">     
</div>
		
let vm = new MVVM({
	data:{
		test: `"><script>alert('1')<\/script>`
	}
})
```
在一些实现中，会把value拼接到属性上，变成这样：
```html
<input type="text" value=""><script>alert('XSS');</script>">
```
这样就可以进行注入了。对于这类可能的漏洞，MVVM的m-bind绑定值(非实例属性绑定)是使用setArrtibute进行设置，该函数会将参数转换为字符串。

- 在标签的 href、src 等属性中，包含 javascript: 等可执行代码。
例子：
```javascript
<div id="blog-posts-events-demo">
        <a href="javascript:alert('1')">aa</a>
</div>
```
这种情况下依然会执行脚本，MVVM的做法是针对href以及src属性，判断值的开头是不是"javascript:"，如果是则控制台提示并替换为"#"。

- 在 onload、onerror、onclick 等事件中，注入不受控制代码。

- 在 style 属性和标签中，包含类似 background-image:url("javascript:..."); 的代码（新版本浏览器已经可以防范）。
- 在 style 属性和标签中，包含类似 expression(...) 的 CSS 表达式代码（新版本浏览器已经可以防范）。


# 参考目录

1. << 深入浅出Vue.js >> 刘博文
2. << JavaScript高级程序设计 >> Nicholas C.Zakas
3. [掘金Vue源码解析系列文章](https://juejin.im/user/3438928101376718/posts?sort=newest "掘金Vue源码解析系列文章")
4. [learnVue](https://github.com/answershuto/learnVue "learnVue")
5. [Vue2编译器](http://caibaojian.com/vue-design/art/80vue-compiler-start.html "Vue2编译器")
6. [渲染器](http://hcysun.me/vue-design/zh/essence-of-comp.html "渲染器")
