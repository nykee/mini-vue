function defineReactive(data, key, val){
    observe(val); //递归遍历所有子属性
    var dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable:true,
        configurable:true,
        get: function () {
            if (Dep.target) {  // 判断是否需要添加订阅者
                dep.addSub(Dep.target); // 在这里添加一个订阅者
            }
            return val;
        },
        set: function (newVal) {
            if (val === newVal) {
                return;
            }
            val =newVal;
            console.log('属性'+key+'已经被监听了，现在值为：'+newVal.toString());
        }
    })
}

Dep.target = null;
function observe(data) {
    if(!data || typeof data !=='object'){
        return
    }
    Object.keys(data).forEach(function (key) {
        defineReactive(data, key, data[key])
    })
}
function Dep () {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};


var library ={
    book1: {
        name: ''
    },
    book2: ''
};
observe(library);
// library.book1.name = 'vue权威指南';
// library.book2 = '没有此书籍';

function Watcher(vm, exp, cb) {
    this.cb =cb;
    this.vm=vm;
    this.exp=exp;
    this.value=this.get(); // 将自己添加到订阅器的操作
}
Watcher.prototype ={
    update:function () {
        this.run();
    },
    run:function () {
        var value = this.vm.data[this.exp];
        var oldVal = this.value;
        if(value!==oldVal ){
            this.value = value;
            this.cb.call(this.vm, value, oldVal)
        }
    },
    get:function () {
        Dep.target = this;  // 缓存自己
        var value=this.vm.data[this.exp]; // 强制执行监听器里的get函数
        Dep.target = null;  // 释放自己
        return value;
    }
};

function SelfVue (data, el, exp) {
    var self=this;
    this.data = data;

    Object.keys(data).forEach(function(key) {
        self.proxyKeys(key);  // 绑定代理属性
    });

    observe(data);
    el.innerHTML = this.data[exp];  // 初始化模板数据的值
    new Watcher(this, exp, function (value) {
        el.innerHTML = value;
    });
    return this;
}
SelfVue.prototype = {
    proxyKeys:function (key) {
        var self = this;
        Object.defineProperty(this, key,{
            enumerable:false,
            configurable:true,
            get:function proxyGetter() {
                return self.data[key];
            },
            set:function proxySetter(newVal) {
                self.data[key] = newVal
            }
        })
    }
};

function nodeToFragement(el) {
    var fragement = document.createDocumentFragment();
    var child = el.firstChild;
    while (child){
        // 将Dom元素移入fragment中
        fragement.appendChild(child);
        child = el.firstChild
    }
    return fragement
}
function compileElement(el) {
    var childNodes = el.childNodes;
    var self = this;
    [].slice.call(childNodes).forEach(function (node) {
        var reg = /\{\{(.*)\}\}/;
        var text = node.textContent;

        if(self.isTextNode(node)&&reg.test(text)){  // 判断是否是符合这种形式{{}}的指令
            self.compileText(node, reg.exec(text)[1]);
        }

        if(node.childNodes&&node.childNodes.length){
            self.compileElement(node) // 继续递归遍历子节点
        }
    })
}

function compileText(node,exp) {
    var self = this;
    var initText = this.vm[exp];
    this.updateText(node, initText); // 将初始化的数据初始化到视图中
    new Watcher(this.vm,exp,function (value) {  // 生成订阅器并绑定更新函数
        self.updateText(node, value)
    })
}

function (node,value) {
    node.textContent = typeof value === 'undefined' ? '' : value;
}