// 观察者(发布订阅) 
class Watcher{
    constructor(vm,expr,cb){
        this.vm = vm
        this.expr = expr
        this.cb = cb
        // 默认先存放一个老值
        this.oldValue = this.get()
    }
    get(){
        let value  = CompileUtil.getValue(vm,this.expr);
        return value
    }
}
class Observer {
    constructor(data) {
        this.observer(data);
    }
    observer(data) {
        if (data && typeof data == 'object') {
            // 如果是对象
            for (const key in data) {
                this.defineReactive(data, key, data[key]);
            }
        }
    }
    defineReactive(obj, key, value) {
        this.observer(value)
        Object.defineProperty(obj, key, {
            get() {
                return value;
            },
            set: (newValue) => {
                if (newValue != value) {
                    this.observer(newValue)
                    value = newValue
                }
            }
        });
    }
}

// 编译
class Compile {
    constructor(el, vm) {
        // 1. 判断 el 属性是不是一个元素,如果不是元素则获取出来
        this.el = this.isElementNode(el) ? el : document.querySelector(el);

        this.vm = vm;
        // 2. 把当前节点的元素获取到 放到内存中
        let fragment = this.nodeFragment(this.el);
        // console.log(fragment);

        // 3. 把节点中的内容进行替换

        // 4. 用数据编译模板
        this.compile(fragment)
        // 5. 把内容塞到页面中
        this.el.appendChild(fragment)

    }
    // 判断是否是指令元素
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    // 编译元素
    compileElement(node) {
        // 属性, 数据类型是个 类属性
        let attributes = node.attributes;
        // console.log(attributes);
        [...attributes].forEach(attr => { // type="text" v-model="school.name"
            let { name, value: expr } = attr;
            // 判断是不是指令元素
            if (this.isDirective(name)) { // v-html v-model v-bind
                let [, directive] = name.split('-');
                // 需要调用不同的指令去处理
                CompileUtil[directive](node, expr, this.vm);
            }
        })
    }
    // 编译文本
    compileText(node) { // 判断当前文本节点中的内容是否包含 {{}}
        let content = node.textContent;
        // 判断有没有大括号
        if (/\{\{(.+?)\}\}/.test(content)) {
            CompileUtil['text'](node, content, this.vm);
        }

    }
    // 核心代码 用来编译内容中的 dom 节点
    compile(node) {
        let childNodes = node.childNodes;
        // console.log(childNodes);
        [...childNodes].forEach(child => {
            if (this.isElementNode(child)) {
                // 编译元素
                this.compileElement(child);
                // 如果是元素,需要把自己传进去,再去遍历自己的子节点
                this.compile(child)
            } else {
                // 编译文本
                this.compileText(child);
            }
        });

    }
    // 把节移动到内存中
    nodeFragment(node) {
        // 创建空的文档片段
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = node.firstChild) {
            // appendChild 具有移动性
            // 当把 node 中的元素添加到文档片段后,node 就会自动删除刚刚添加完的元素
            fragment.appendChild(firstChild)
        }
        return fragment;
    }
    // 判断是不是元素节点
    isElementNode(node) {
        return node.nodeType === 1;
    }
}

CompileUtil = {
    // 根据表达式取到对应的数据
    getValue(vm, expr) { // vm.$data
        return expr.split('.').reduce((data, current) => {
            return data[current]
        }, vm.$data)
    },
    /**
     * 
     * @param {当前节点} node 
     * @param {表达式} expr 
     * @param {当前实例} vm 
     */
    model(node, expr, vm) {
        // 给输入框赋值 value 属性 node.value=value
        let fn = this.updater['modelUpdater']
        let value = this.getValue(vm, expr);
        fn(node, value);
    },
    html() {
        // node.innerHtml = value
    },
    text(node, expr, vm) {
        let fn = this.updater['textUpdater'];
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getValue(vm, args[1]);
        });
        fn(node, content);
    },
    updater: {
        // 把数据插入到节点中
        modelUpdater(node, value) {
            node.value = value;
        },
        htmlUpdater() {

        },
        textUpdater(node, value) {
            node.textContent = value;
        }
    }
}

// 基类
class Vue {
    // options 传入的参数
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        // 判断根元素模板是否存在 编译模板
        if (this.$el) {
            // 把数据 转成 Object.defineProperty
            new Observer(this.$data);
            console.log(this.$data);

            new Compile(this.$el, this);
        }
    }
}
