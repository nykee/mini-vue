/**
 * Keep Coding!
 * Created by admin on 2018/10/29.
 */
function Compile(el, vm) {
    this.vm =vm;
    this.el =document.querySelector(el);
    this.fragment = null;
    this.init();
}
Compile.prototype ={
    init:function () {
        if(this.el){
            this.fragment =this.nodeToFragment(this.el);
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        }else {
            console.error('dom元素不存在')
        }
    },
    nodeToFragment:function (el) {
        let fragment = document.createDocumentFragment();
        let child = el.firstChild;
        while (child){
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild
        }
        return fragment
    },
    compileElement:function (el) {
        let childNodes = el.childNodes;
        let self = this;
        [].slice.call(childNodes).forEach(function (node) {
            let reg = /\{\{(.*)\}\}/;
            let text = node.textContent;

            if (self.isElementNode(node)) {
                self.compile(node);
            }
            else if(self.isTextNode(node)&&reg.test(text)){  // 判断是否是符合这种形式{{}}的指令
                self.compileText(node, reg.exec(text)[1]);
            }

            if(node.childNodes&&node.childNodes.length){
                self.compileElement(node) // 继续递归遍历子节点
            }
        })
    },
    compileEvent:function (node,vm,exp,dir) {
        let eventType =dir.split(':')[1];
        let cb = vm.methods &&vm.methods[exp];

        if(eventType&&cb){
            node.addEventListener(eventType,cb.bind(vm),false)
        }
    },
    compile:function (node) {
        let nodeAttrs = node.attributes,
            self      = this;
        Array.prototype.forEach.call(nodeAttrs, function (attr) {
            let attrName = attr.name;
            if(self.isDirective(attrName)){
                let exp = attr.value;
                let dir = attrName.substring(2);
                if(self.isEventDirective(dir)){ //事件指令
                    self.compileEvent(node,self.vm,exp,dir)

                }
                else {
                    self.compileModel(node,self.vm,exp,dir)
                }
                node.removeAttribute(attrName)

            }
        })

    },
    compileText: function(node, exp) {
        let self = this;
        let initText = this.vm[exp];
        this.updateText(node, initText);  // 将初始化的数据初始化到视图中
        new Watcher(this.vm, exp, function (value) { // 生成订阅器并绑定更新函数
            self.updateText(node, value);
        });
    },
    compileModel:function (node,vm,exp,dir) {
      let self=this,
      val=this.vm[exp];
      this.modelUpdater(node,val);
      new Watcher(this.vm,exp,function (value) {
          self.modelUpdater(node,value)
      });

      node.addEventListener('input',function (e) {
          let newValue= e.target.value;
          if(val === newValue){
              return
          }
          self.vm[exp] = newValue;
          val = newValue
      })
    },
    modelUpdater:function (node,value,oldValue) {
            node.value = (typeof value === 'undefined') ? '' :value
    },
    isDirective:function (attr) {
        return attr.indexOf('v-') ===0
    },
    isEventDirective:function (dir) {
        return dir.indexOf('on') === 0
    },
    
    updateText: function (node, value) {
        node.textContent = typeof value ==='undefined' ? '' : value;
    },
    isTextNode: function(node) {
        return node.nodeType === 3;
    },
    isElementNode:function (node) {
        return node.nodeType === 1;
    }
};