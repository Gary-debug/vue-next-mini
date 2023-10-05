var Vue = (function (exports) {
    'use strict';

    // 用于将 {{ Interpolation }} 值转换为显示的字符串
    var toDisplayString = function (val) {
        return String(val);
    };

    var isArray = Array.isArray;
    var isObject = function (val) {
        return val !== null && typeof val === 'object';
    };
    /**
     * 对比两个数据是否发生改变
     * @param value
     * @param oldValue
     * @returns
     */
    var hasChanged = function (value, oldValue) {
        return !Object.is(value, oldValue);
    };
    var isFunction = function (val) {
        return typeof val === 'function';
    };
    var extend = Object.assign;
    var EMPTY_OBJ = {};
    var isString = function (val) { return typeof val === 'string'; };
    var onRe = /^on[^a-z]/;
    // 是否 on 开头
    var isOn = function (key) { return onRe.test(key); };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    // 根据 effects 生成 dep 实例
    var createDep = function (effects) {
        var dep = new Set(effects);
        return dep;
    };

    /**
     * 1. key：响应性对象
     * 2. value：Map 对象
     *  1. key：响应性对象的指定属性
     *  2. value：指定对象的指定属性的执行函数
     */
    var targetMap = new WeakMap();
    function effect(fn, options) {
        // 生成 ReactiveEffect 实例
        var _effect = new ReactiverEffect(fn);
        if (options) {
            extend(_effect, options);
        }
        if (!options || !options.lazy) {
            // 执行 run 函数
            _effect.run();
        }
    }
    var activeEffect;
    // 响应性触发依赖时的执行类
    var ReactiverEffect = /** @class */ (function () {
        function ReactiverEffect(fn, scheduler) {
            if (scheduler === void 0) { scheduler = null; }
            this.fn = fn;
            this.scheduler = scheduler;
        }
        ReactiverEffect.prototype.run = function () {
            // 为 activeEffect 赋值
            activeEffect = this;
            // 执行 fn 函数
            return this.fn();
        };
        ReactiverEffect.prototype.stop = function () {
        };
        return ReactiverEffect;
    }());
    /**
     * 收集依赖
     * @param target
     * @param key
     */
    function track(target, key) {
        // 如果不存在执行函数，则直接 return
        if (!activeEffect)
            return;
        // 尝试从 targetMap 中，根据 target 获取 map
        var depsMap = targetMap.get(target);
        // 如果获取到的 map 不存在，则生成新的 map 对象，并把该对象赋值给对应的 value
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key);
        if (!dep) {
            // 为指定 map 指定 key，设置回调函数
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    /**
     * 利用dep依次跟踪指定key的所有effect
     */
    function trackEffects(dep) {
        dep.add(activeEffect);
    }
    /**
     * 触发依赖
     * @param target
     * @param key
     * @param newValue
     */
    function trigger(target, key, newValue) {
        // 根据 target 获取存储的 map 实例
        var depsMap = targetMap.get(target);
        // 如果 map 不存在，则直接 return
        if (!depsMap)
            return;
        // 根据key，从 depsMap 中取出 value，该 value 是一个 ReactiveEffect
        var dep = depsMap.get(key);
        // 如果 effect 不存在，则直接return
        if (!dep) {
            return;
        }
        triggerEffects(dep);
    }
    /**
     * 依次触发dep中保存的依赖
     * @param dep
     */
    function triggerEffects(dep) {
        var e_1, _a, e_2, _b;
        // 把 dep 构建为一个数组
        var effects = isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            // 先执行计算属性effects
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                if (effect_1.computed) {
                    triggerEffect(effect_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            // 再触发所有非计算属性依赖
            for (var effects_2 = __values(effects), effects_2_1 = effects_2.next(); !effects_2_1.done; effects_2_1 = effects_2.next()) {
                var effect_2 = effects_2_1.value;
                if (!effect_2.computed) {
                    triggerEffect(effect_2);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (effects_2_1 && !effects_2_1.done && (_b = effects_2.return)) _b.call(effects_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    /**
     * 触发指定依赖
     * @param effect
     */
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }

    // getter 回调方法
    var get = createGetter();
    // 创建 getter 回调方法
    function createGetter() {
        return function get(target, key, receiver) {
            var res = Reflect.get(target, key, receiver);
            // 依赖收集
            track(target, key);
            return res;
        };
    }
    // setter 回调方法
    var set = createSetter();
    // 创建 setter 回调方法
    function createSetter() {
        return function set(target, key, value, receiver) {
            var res = Reflect.set(target, key, value, receiver);
            // 依赖触发
            trigger(target, key);
            return res;
        };
    }
    var mutableHandlers = {
        get: get,
        set: set,
    };

    // 响应性 Map 缓存对象，key：target，value：proxy
    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        // 如果该实例已经被代理，则直接读取
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // 未被代理则生成proxy实例
        var proxy = new Proxy(target, baseHandlers);
        proxy["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] = true;
        // 缓存代理对象
        proxyMap.set(target, proxy);
        return proxy;
    }
    // 将指定数据变为 reactive 数据
    var ToReactive = function (value) {
        return isObject(value) ? reactive(value) : value;
    };
    function isReactive(value) {
        return !!(value && value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]);
    }

    function ref(value) {
        return createRef(value, false);
    }
    // 创建 RefImpl 实例
    function createRef(rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this.__v_isRef = true;
            // 原始数据
            this._rawValue = value;
            // 如果 __v_isShallow 为 true，则 value 不会被转化为 reactive 数据，即如果当前 value 为复杂数据类型，则会失去响应性。对应官方文档 shallowRef ：https://cn.vuejs.org/api/reactivity-advanced.html#shallowref
            this._value = __v_isShallow ? value : ToReactive(value);
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            // 实例的 getter 行为：ref.value
            get: function () {
                trackRefValue(this);
                return this._value;
            },
            // 实例的 setter 行为：ref.value = xxx
            set: function (newVal) {
                if (hasChanged(newVal, this._rawValue)) {
                    // 更新原始数据
                    this._rawValue = newVal;
                    // 更新 .value 的值
                    this._value = ToReactive(newVal);
                    // 触发依赖
                    triggerRefValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    /**
     * 收集依赖
     * @param ref
     */
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    /**
     * 触发依赖
     */
    function triggerRefValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }
    /**
     * 是否是ref
     * @param r
     * @returns
     */
    function isRef(r) {
        return !!(r && r.__v_ifRef === true);
    }

    // 计算属性类
    var ComputedRefImpl = /** @class */ (function () {
        function ComputedRefImpl(getter) {
            var _this = this;
            this.dep = undefined;
            this.__v_isRef = true;
            this._dirty = true; // 脏变量，为 false 时表示需要触发依赖。为 true 时表示需要重新执行 run 方法，获取数据。
            this.effect = new ReactiverEffect(getter, function () {
                // 判断当前脏的状态，如果为 false，表示需要触发依赖
                if (!_this._dirty) {
                    _this._dirty = true;
                    triggerRefValue(_this);
                }
            });
            this.effect.computed = this;
        }
        Object.defineProperty(ComputedRefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this);
                // 判断当前脏的状态，如果为 true，表示需要重新执行 run，获取最新数据
                if (this._dirty) {
                    this._dirty = false;
                    // 执行 run 函数
                    this._value = this.effect.run();
                }
                // 返回计算之后的真实值
                return this._value;
            },
            enumerable: false,
            configurable: true
        });
        return ComputedRefImpl;
    }());
    // 计算属性
    function computed(getterOrOptions) {
        var getter;
        var onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
        }
        var Cref = new ComputedRefImpl(getter);
        return Cref;
    }

    // 对应 promise 的 pending 状态
    var isFlushPending = false;
    // promise.resolve()
    var resolvedPromise = Promise.resolve();
    // 代执行的任务队列
    var pendingPreFlushCbs = [];
    // 队列预处理函数
    function queuePreFlushCb(cb) {
        queueCb(cb, pendingPreFlushCbs);
    }
    // 队列处理函数
    function queueCb(cb, pendingQueue) {
        // 将所有的回调函数，放入队列中
        pendingQueue.push(cb);
        queueFlush();
    }
    // 依次执行队列中的函数
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            resolvedPromise.then(flushJobs);
        }
    }
    // 回调函数，处理队列
    function flushJobs() {
        isFlushPending = false;
        flushPreFlushCbs();
    }
    // 循环进行队列的处理
    function flushPreFlushCbs() {
        if (pendingPreFlushCbs.length) {
            // 去重
            var activePreFlushCbs = __spreadArray([], __read(new Set(pendingPreFlushCbs)), false);
            // 清空旧数据
            pendingPreFlushCbs.length = 0;
            // 循环处理
            for (var i = 0; i < activePreFlushCbs.length; i++) {
                activePreFlushCbs[i]();
            }
        }
    }

    /**
     * 指定的 watch 函数
     * @param source 监听的响应性数据
     * @param cb cb 回调函数
     * @param options 配置项
     * @returns
     */
    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, _a) {
        var _b = _a === void 0 ? EMPTY_OBJ : _a, immediate = _b.immediate, deep = _b.deep;
        // 触发 getter 的指定函数
        var getter;
        if (isReactive(source)) {
            // 指定 getter
            getter = function () { return source; };
            deep = true;
        }
        else {
            getter = function () { };
        }
        // 存在回调函数和deep
        if (cb && deep) {
            var baseGetter_1 = getter;
            getter = function () { return traverse(baseGetter_1()); };
        }
        // 旧值
        var oldValue = {};
        // job 执行方法
        var job = function () {
            if (cb) {
                // watch(source, cb)
                var newValue = effect.run();
                if (deep || hasChanged(newValue, oldValue)) {
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
        };
        // 调度器
        var scheduler = function () { return queuePreFlushCb(job); };
        var effect = new ReactiverEffect(getter, scheduler);
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = effect.run();
            }
        }
        else {
            effect.run();
        }
        return function () {
            effect.stop();
        };
    }
    // 依次执行 getter，从而触发依赖收集
    function traverse(value, seen) {
        if (!isObject(value)) {
            return value;
        }
        seen = seen || new Set();
        seen.add(value);
        for (var key in value) {
            traverse(value[key], seen);
        }
        return value;
    }

    // 规范化 class 类，处理 class 的增强
    function normalizeClass(value) {
        var res = '';
        // 判断是否为 string，如果是 string 就不需要专门处理
        if (isString(value)) {
            res = value;
        }
        // 额外的数组增强。官方案例：https://cn.vuejs.org/guide/essentials/class-and-style.html#binding-to-arrays
        else if (isArray(value)) {
            // 循环得到数组中的每个元素，通过 normalizeClass 方法进行迭代处理
            for (var i = 0; i < value.length; i++) {
                var normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        // 额外的对象增强。官方案例：https://cn.vuejs.org/guide/essentials/class-and-style.html#binding-html-classes
        else if (isObject(value)) {
            // for in 获取到的所有的 key，这里的 key(name) 即为类名。value 为 boolean 值
            for (var name_1 in value) {
                // 把 value 当作 boolean 来看，拼接 name
                if (value[name_1]) {
                    res += name_1 + ' ';
                }
            }
        }
        return res.trim();
    }

    var Fragment = Symbol('Fragment');
    var Text = Symbol('Text');
    var Comment = Symbol('comment');
    function isVnode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    function createVNode(type, props, chilren) {
        var shapeFlag = isString(type)
            ? 1 /* ShapeFlags.ELEMENT */
            : isObject(type)
                ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                : 0;
        if (props) {
            // 处理 class
            var klass = props.class; props.style;
            if (klass && !isString(klass)) {
                props.class = normalizeClass(klass);
            }
        }
        return createBaseVNode(type, props, chilren, shapeFlag);
    }
    function createBaseVNode(type, props, children, shapeFlag) {
        var vnode = {
            __v_isVNode: true,
            type: type,
            props: props,
            shapeFlag: shapeFlag,
            key: (props === null || props === void 0 ? void 0 : props.key) || null
        };
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        var type = 0;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') ;
        else if (isFunction(children)) ;
        else {
            // children 为 string
            children = String(children);
            // 为 type 指定 Flags
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
        // 修改 vnode 的 children
        vnode.children = children;
        // 按位或赋值
        vnode.shapeFlag |= type;
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    // 创建注释节点
    function createCommentVNode(text) {
        return createVNode(Comment, null, text);
    }

    function h(type, propsOrChildren, children) {
        // 获取参数长度
        var l = arguments.length;
        // 如果只传递了两个参数，那么第二个参数可能是 props，也可能是 children
        if (l === 2) {
            // 如果第二个参数是对象，但不是数组。则第二个参数有两种可能性：1. VNode 2. 普通的 props
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                // 如果是 VNode，则第二个参数代表了 children
                if (isVnode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                // 如果不是 VNode，则第二个参数代表了 props
                return createVNode(type, propsOrChildren);
            }
            // 如果第二个参数不是单纯的 object，则第二个参数代表了 props
            else {
                return createVNode(type, null, propsOrChildren);
            }
        }
        // 如果传递了三个或以上的参数，则第二个参数一定代表 props
        else {
            // 如果参数在三个以上，则从第二个参数开始，把后续所有参数都作为 children
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            // 如果传递的参数只有三个，则 children 是单纯的 children
            else if (l === 3 && isVnode(children)) {
                children = [children];
            }
            // 触发 createVNode 方法，创建 VNode 实例
            return createVNode(type, propsOrChildren, children);
        }
    }

    // 解析 render 函数的返回值
    function renderComponentRoot(instance) {
        var vnode = instance.vnode, render = instance.render, _a = instance.data, data = _a === void 0 ? {} : _a;
        var result;
        try {
            // 解析到状态组件
            if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 获取到 result 返回值，如果 render 中使用了 this，则需要修改 this 指向
                result = normalizeVNode(render.call(data, data));
            }
        }
        catch (error) {
            console.error(error);
        }
        return result;
    }
    // 标准化 VNode
    function normalizeVNode(child) {
        if (typeof child === 'object') {
            return cloneIfMounted(child);
        }
        else {
            return createVNode(Text, null, String(child));
        }
    }
    function cloneIfMounted(child) {
        return child;
    }

    function injectHook(type, hook, target) {
        // 将 hook 注册到组件实例中
        if (target) {
            target[type] = hook;
            return hook;
        }
    }
    var createHook = function (lifecycle) {
        return function (hook, target) { return injectHook(lifecycle, hook, target); };
    };
    var onBeforeMount = createHook("bm" /* LifecycleHooks.BEFORE_MOUNT */);
    var onMounted = createHook("m" /* LifecycleHooks.MOUNTED */);

    var uid = 0;
    var compile$1 = null;
    // 创建组件实例
    function createComponentInstance(vnode) {
        var type = vnode.type;
        var instance = {
            uid: uid++,
            vnode: vnode,
            type: type,
            subTree: null,
            effect: null,
            update: null,
            render: null,
            // 生命周期相关
            isMounted: false,
            bc: null,
            c: null,
            bm: null,
            m: null // mounted
        };
        return instance;
    }
    // 规范化组件实例数据
    function setupComponent(instance) {
        // 为 render 赋值
        var setupResult = setupStatefulComponent(instance);
        return setupResult;
    }
    function setupStatefulComponent(instance) {
        var Component = instance.type;
        var setup = Component.setup;
        // 存在 setup，则直接获取 setup 函数的返回值即可
        if (setup) {
            var setupResult = setup();
            handleSetupResult(instance, setupResult);
        }
        else {
            // 获取组件实例
            finishComponentSetup(instance);
        }
    }
    function handleSetupResult(instance, setupResult) {
        // 存在 setupResult，并且它是一个函数，则 setupResult 就是需要渲染的 render
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        }
        finishComponentSetup(instance);
    }
    function finishComponentSetup(instance) {
        var Component = instance.type;
        // 组件不存在 render 时，才需要重新赋值
        if (!instance.render) {
            // 存在编辑器，并且组件中不包含 render 函数，同时包含 template 模版，则直接使用编辑器进行编辑，得到 render 函数
            if (compile$1 && !Component.render) {
                if (Component.template) {
                    // 这里就是 runtime 模块和 compile 模块结合点
                    var template = Component.template;
                    Component.render = compile$1(template);
                }
            }
            // 为 render 赋值
            instance.render = Component.render;
        }
        // 改变 options 中的 this 指向
        applyOptions(instance);
    }
    function registerRuntimeCompiler(_compile) {
        compile$1 = _compile;
    }
    function applyOptions(instance) {
        var _a = instance.type, dataOptions = _a.data, beforeCreate = _a.beforeCreate, created = _a.created, beforeMount = _a.beforeMount, mounted = _a.mounted;
        // hooks
        if (beforeCreate) {
            callHook(beforeCreate, instance.data);
        }
        // 存在 data 选项时
        if (dataOptions) {
            // 触发 dataOptions 函数，拿到 data 对象
            var data = dataOptions();
            // 如果拿到的 data 是一个对象
            if (isObject(data)) {
                // 则把 data 包装成 reactive 的响应性数据，赋值给 instance
                instance.data = reactive(data);
            }
        }
        // hooks
        if (created) {
            callHook(created, instance.data);
        }
        function registerLifecycleHook(regiser, hook) {
            regiser(hook === null || hook === void 0 ? void 0 : hook.bind(instance.data), instance);
        }
        // 注册 hooks
        registerLifecycleHook(onBeforeMount, beforeMount);
        registerLifecycleHook(onMounted, mounted);
    }
    // 触发 hooks
    function callHook(hook, proxy) {
        hook.bind(proxy)();
    }

    function createAppAPI(render) {
        return function createapp(rootComponent, rootProps) {
            if (rootProps === void 0) { rootProps = null; }
            var app = {
                _component: rootComponent,
                _container: null,
                // 挂载方法
                mount: function (rootContainer) {
                    // 直接通过 createVNode 方法构建 vnode
                    var vnode = createVNode(rootComponent, rootProps, null);
                    // 通过 render 函数进行挂载
                    render(vnode, rootContainer);
                }
            };
            return app;
        };
    }

    // 对外暴露创建渲染器的方法
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    /**
     * 生成 render 渲染器
     * @param options 兼容性操作配置对象
     * @returns
     */
    function baseCreateRenderer(options) {
        // 解构 options，获取所有的兼容性方法
        var hostInsert = options.insert, hostPatchProp = options.patchProp, hostCreateElement = options.createElement, hostSetElementText = options.setElementText, hostRemove = options.remove, hostCreateText = options.createText, hostSetText = options.setText, hostCreateComment = options.createComment;
        // 组件的打补丁操作
        var processComponent = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 挂载
                mountComponent(newVNode, container, anchor);
            }
        };
        // Fragment 的打补丁操作
        var processFragment = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 挂载操作
                mountChildren(newVNode.children, container, anchor);
            }
            else {
                // 更新操作
                patchChildren(oldVNode, newVNode, container, anchor);
            }
        };
        // Text 的打补丁操作
        var processText = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 挂载操作
                newVNode.el = hostCreateText(newVNode.children);
                hostInsert(newVNode.el, container, anchor);
            }
            else {
                // 更新操作
                var el = (newVNode.el = oldVNode.el);
                if (newVNode.children !== oldVNode.children) {
                    hostSetText(el, newVNode.children);
                }
            }
        };
        // Comment 的打补丁操作
        var processCommentNode = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 生成节点
                newVNode.el = hostCreateComment(newVNode.children || '');
                // 挂载
                hostInsert(newVNode.el, container, anchor);
            }
            else {
                // 无更新
                newVNode.el = oldVNode.el;
            }
        };
        // Element 的打补丁操作
        var processElement = function (oldVNode, newVNode, container, anchor) {
            if (oldVNode == null) {
                // 挂载操作
                mountElement(newVNode, container, anchor);
            }
            else {
                // 更新操作
                patchElement(oldVNode, newVNode);
            }
        };
        var mountComponent = function (initialVNode, container, anchor) {
            // 生成组件实例
            initialVNode.component = createComponentInstance(initialVNode);
            // 浅拷贝，绑定同一块内存空间
            var instance = initialVNode.component;
            // 标准化组件实例数据
            setupComponent(instance);
            // 设置组件渲染
            setupRenderEffect(instance, initialVNode, container, anchor);
        };
        // 设置组件渲染
        var setupRenderEffect = function (instance, initialVnode, container, anchor) {
            // 组件挂载和更新的方法
            var componentUpdateFn = function () {
                // 当前处于 mounted 之前，即执行挂载逻辑
                if (!instance.isMounted) {
                    // 获取 hook
                    var bm = instance.bm, m = instance.m;
                    // beforeMount hook
                    if (bm) {
                        bm();
                    }
                    // 从 render 中获取需要渲染的内容
                    var subTree = (instance.subTree = renderComponentRoot(instance));
                    // 通过 patch 对 subTree进行打补丁。即：渲染组件
                    patch(null, subTree, container, anchor);
                    // mounted hook
                    if (m) {
                        m();
                    }
                    // 把组件根节点的 el，作为组件的 el
                    initialVnode.el = subTree.el;
                    // 修改 mounted 状态
                    instance.isMounted = true;
                }
                else {
                    var next = instance.next, vnode = instance.vnode;
                    if (!next) {
                        next = vnode;
                    }
                    // 获取下一次的 subTree
                    var nextTree = renderComponentRoot(instance);
                    // 保存对应的 subTree，以便进行更新操作
                    var prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    // 通过 patch 进行更新操作
                    patch(prevTree, nextTree, container, anchor);
                    // 更新 next
                    next.el = nextTree.el;
                }
            };
            // 创建包含 scheduler 的 effect 实例
            var effect = (instance.effect = new ReactiverEffect(componentUpdateFn, function () { return queuePreFlushCb(update); }));
            // 生成 update 函数
            var update = (instance.update = function () { return effect.run(); });
            // 触发 update 函数，本质上触发的事 componentUpdateFn
            update();
        };
        // element 的挂载操作
        var mountElement = function (vnode, container, anchor) {
            var type = vnode.type, props = vnode.props, shapeFlag = vnode.shapeFlag;
            // 1. 创建element
            var el = (vnode.el = hostCreateElement(type));
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 2. 设置文本
                hostSetElementText(el, vnode.children);
            }
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 设置 Array 子节点
                mountChildren(vnode.children, el, anchor);
            }
            // 3. 设置 props
            if (props) {
                // 遍历 props 对象
                for (var key in props) {
                    hostPatchProp(el, key, null, props[key]);
                }
            }
            // 4. 插入
            hostInsert(el, container, anchor);
        };
        // element 的更新操作
        var patchElement = function (oldVNode, newVNode) {
            // 获取指定的 el
            var el = (newVNode.el = oldVNode.el);
            // 新旧 props
            var oldProps = oldVNode.props || EMPTY_OBJ;
            var newProps = newVNode.props || EMPTY_OBJ;
            // 更新子节点
            patchChildren(oldVNode, newVNode, el, null);
            // 更新 props
            patchProps(el, newVNode, oldProps, newProps);
        };
        // 挂载子节点
        var mountChildren = function (children, container, anchor) {
            if (isString(children)) {
                children = children.split('');
            }
            for (var i = 0; i < children.length; i++) {
                var child = (children[i] = normalizeVNode(children[i]));
                patch(null, child, container, anchor);
            }
        };
        // 为子节点打补丁
        var patchChildren = function (oldVNode, newVNode, container, anchor) {
            // 旧节点的 children
            var c1 = oldVNode && oldVNode.children;
            // 旧节点的 prevShapeFlag
            var prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0;
            // 新节点的 children
            var c2 = newVNode && newVNode.children;
            // 新节点的 shapeFlag
            var shapeFlag = newVNode.shapeFlag;
            // 新节点是TEXT_CHILDREN
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 新旧子节点不同
                if (c2 !== c1) {
                    // 挂载新子节点的文本
                    hostSetElementText(container, c2);
                }
            }
            else {
                // 旧节点是ARRAY_CHILDREN
                if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // 新节点也是ARRAY_CHILDREN
                    if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                        // TODO: diff
                        patchKeyedChildren(c1, c2, container, anchor);
                    }
                }
                else {
                    // 旧节点是TEXT_CHILDREN
                    if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                        // 删除旧节点的text
                        hostSetElementText(container, '');
                    }
                }
            }
        };
        // diff
        var patchKeyedChildren = function (oldChildren, newChildren, container, parentAnchor) {
            // 索引
            var i = 0;
            // 新的子节点的长度
            var newChildrenLength = newChildren.length;
            // 旧的子节点最大下标
            var oldChildrenEnd = oldChildren.length - 1;
            // 新的子节点最大下标
            var newChildrenEnd = newChildrenLength - 1;
            // 1. 自前向后的 diff 对比。经过该循环之后，从前开始的相同 vnode 将被处理
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVNode = oldChildren[i];
                var newVNode = normalizeVNode(newChildren[i]);
                // 如果 oldVNode 和 newVNode 被认为是同一个 vnode，则直接 patch 即可
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, null);
                }
                // 如果不是同一个 vnode，则直接跳出循环
                else {
                    break;
                }
                i++;
            }
            // 2. 自后向前的 diff 对比。经过该循环之后，从后开始的相同 vnode 将被处理
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVNode = oldChildren[oldChildrenEnd];
                var newVNode = newChildren[newChildrenEnd];
                if (isSameVNodeType(oldVNode, newVNode)) {
                    patch(oldVNode, newVNode, container, null);
                }
                else {
                    break;
                }
                oldChildrenEnd--;
                newChildrenEnd--;
            }
            // 3. 新节点多于旧节点
            if (i > oldChildrenEnd) {
                if (i <= newChildrenEnd) {
                    var nextPos = newChildrenEnd + 1;
                    var anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor;
                    while (i <= newChildrenEnd) {
                        patch(null, normalizeVNode(newChildren[i]), container, anchor);
                        i++;
                    }
                }
            }
            // 4. 旧节点多于新节点
            else if (i > newChildrenEnd) {
                while (i <= oldChildrenEnd) {
                    unmount(oldChildren[i]);
                    i++;
                }
            }
            // 5. 乱序的 diff 比对
            else {
                // 旧子节点的开始索引：oldChildrenStart
                var oldStartIndex = i;
                // 新子节点的开始索引：newChildrenStart
                var newStartIndex = i;
                // 5.1 创建一个 <key（新节点的 key）:index（新节点的位置）> 的 Map 对象 keyToNewIndexMap。通过该对象可知：新的 child（根据 key 判断指定 child） 更新后的位置（根据对应的 index 判断）在哪里
                var keyToNewIndexMap = new Map();
                // 通过循环为 keyToNewIndexMap 填充值（s2 = newChildrenStart; e2 = newChildrenEnd）
                for (i = newStartIndex; i <= newChildrenEnd; i++) {
                    // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
                    var nextChild = normalizeVNode(newChildren[i]);
                    // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
                    if (nextChild.key != null) {
                        // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2 循环 oldChildren ，并尝试进行 patch（打补丁）或 unmount（删除）旧节点
                var j 
                // 记录已经修复的新节点数量
                = void 0;
                // 记录已经修复的新节点数量
                var patched = 0;
                // 新节点待修补的数量 = newChildrenEnd - newChildrenStart + 1
                var toBePatched = newChildrenEnd - newStartIndex + 1;
                // 标记位：节点是否需要移动
                var moved = false;
                // 配合 moved 进行使用，它始终保存当前最大的 index 值
                var maxNewIndexSoFar = 0;
                // 创建一个 Array 的对象，用来确定最长递增子序列。它的下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
                // 但是，需要特别注意的是：oldIndex 的值应该永远 +1 （ 因为 0 代表了特殊含义，他表示《新节点没有找到对应的旧节点，此时需要新增新节点》）。即：旧节点下标为 0， 但是记录时会被记录为 1
                var newIndexToOldIndexMap = new Array(toBePatched);
                // 遍历 toBePatched ，为 newIndexToOldIndexMap 进行初始化，初始化时，所有的元素为 0
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点，如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
                for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
                    // 获取旧节点
                    var prevChild = oldChildren[i];
                    // 如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
                    if (patched >= toBePatched) {
                        // 所有的节点都已经更新完成，剩余的旧节点全部删除即可
                        unmount(prevChild);
                        continue;
                    }
                    // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
                    var newIndex 
                    // 旧节点的 key 存在时
                    = void 0;
                    // 旧节点的 key 存在时
                    if (prevChild.key != null) {
                        // 根据旧节点的 key，从 keyToNewIndexMap 中可以获取到新节点对应的位置
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        // 旧节点的 key 不存在（无 key 节点）
                        // 那么我们就遍历所有的新节点，找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》，如果能找到，那么 newIndex = 该新节点索引
                        for (j = newStartIndex; j <= newChildrenEnd; j++) {
                            // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
                            if (newIndexToOldIndexMap[j - newStartIndex] === 0 &&
                                isSameVNodeType(prevChild, newChildren[j])) {
                                // 如果能找到，那么 newIndex = 该新节点索引
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
                    if (newIndex === undefined) {
                        // 此时，直接删除即可
                        unmount(prevChild);
                    }
                    // 没有进入 if，则表示：当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
                    else {
                        // 为 newIndexToOldIndexMap 填充值：下标表示：《新节点的下标（newIndex），不计算已处理的节点。即：n-c 被认为是 0》，元素表示：《对应旧节点的下标（oldIndex），永远 +1》
                        // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
                        newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1;
                        // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
                        if (newIndex >= maxNewIndexSoFar) {
                            // 持续递增
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            // 没有递增，则需要移动，moved = true
                            moved = true;
                        }
                        // 打补丁
                        patch(prevChild, newChildren[newIndex], container, null);
                        // 自增已处理的节点数量
                        patched++;
                    }
                }
                // 5.3 针对移动和挂载的处理
                // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
                var increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : [];
                // j >= 0 表示：初始值为 最长递增子序列的最后下标
                // j < 0 表示：《不存在》最长递增子序列。
                j = increasingNewIndexSequence.length - 1;
                // 倒序循环，以便我们可以使用最后修补的节点作为锚点
                for (i = toBePatched - 1; i >= 0; i--) {
                    // nextIndex（需要更新的新节点下标） = newChildrenStart + i
                    var nextIndex = newStartIndex + i;
                    // 根据 nextIndex 拿到要处理的 新节点
                    var nextChild = newChildren[nextIndex];
                    // 获取锚点（是否超过了最长长度）
                    var anchor = nextIndex + 1 < newChildrenLength
                        ? newChildren[nextIndex + 1].el
                        : parentAnchor;
                    // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
                    if (newIndexToOldIndexMap[i] === 0) {
                        // 挂载新节点
                        patch(null, nextChild, container, anchor);
                    }
                    // moved 为 true，表示需要移动
                    else if (moved) {
                        // j < 0 表示：不存在 最长递增子序列
                        // i !== increasingNewIndexSequence[j] 表示：当前节点不在最后位置
                        // 那么此时就需要 move （移动）
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor);
                        }
                        else {
                            // j 随着循环递减
                            j--;
                        }
                    }
                }
            }
        };
        // 移动节点到指定位置
        var move = function (vnode, container, anchor) {
            var el = vnode.el;
            hostInsert(el, container, anchor);
        };
        var patchProps = function (el, vnode, oldProps, newProps) {
            if (oldProps !== newProps) {
                // 新的prop新增
                for (var key in newProps) {
                    var next = newProps[key];
                    var prev = oldProps[key];
                    if (next !== prev) {
                        hostPatchProp(el, key, prev, next);
                    }
                }
                // 删除存在于旧的的prop不存在新的prop
                if (oldProps !== EMPTY_OBJ) {
                    for (var key in oldProps) {
                        if (!(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null);
                        }
                    }
                }
            }
        };
        var patch = function (oldVNode, newVNode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVNode === newVNode) {
                return;
            }
            // 判断是否为相同类型节点
            if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
                unmount(oldVNode);
                oldVNode = null;
            }
            var type = newVNode.type, shapeFlag = newVNode.shapeFlag;
            switch (type) {
                case Text:
                    processText(oldVNode, newVNode, container, anchor);
                    break;
                case Comment:
                    processCommentNode(oldVNode, newVNode, container, anchor);
                    break;
                case Fragment:
                    processFragment(oldVNode, newVNode, container, anchor);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVNode, newVNode, container, anchor);
                    }
                    else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                        processComponent(oldVNode, newVNode, container, anchor);
                    }
            }
        };
        var unmount = function (vnode) {
            hostRemove(vnode.el);
        };
        var render = function (vnode, container) {
            if (vnode == null) {
                // TODO：卸载
                if (container._vnode) {
                    unmount(container._vnode);
                }
            }
            else {
                // 打补丁
                patch(container._vnode || null, vnode, container);
            }
            container._vnode = vnode;
        };
        return {
            render: render,
            createApp: createAppAPI(render)
        };
    }
    // 获取最长递增子序列下标
    function getSequence(arr) {
        // 对数组的浅拷贝
        var p = arr.splice();
        var result = [0];
        var i, j, u, v, c;
        var len = arr.length;
        for (i = 0; i < len; i++) {
            var arrI = arr[i];
            if (arrI !== 0) {
                // result最后的元素，最大值
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                // 初始下标
                u = 0;
                // 最终下标
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    var doc = document;
    var nodeOps = {
        insert: function (child, parent, anchor) {
            parent.insertBefore(child, anchor || null);
        },
        createElement: function (tag) {
            var el = doc.createElement(tag);
            return el;
        },
        setElementText: function (el, text) {
            el.textContent = text;
        },
        remove: function (child) {
            var parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        createText: function (text) { return doc.createTextNode(text); },
        setText: function (node, text) {
            node.nodeValue = text;
        },
        createComment: function (text) { return doc.createComment(text); }
    };

    // 为 class 打补丁
    function patchClass(el, value) {
        if (value === null) {
            el.removeAttribute('class');
        }
        else {
            el.className = value;
        }
    }

    // 通过 DOM Properties 指定属性
    function patachDOMProp(el, key, value) {
        try {
            el[key] = value;
        }
        catch (e) {
        }
    }

    /**
     * 通过 setAttribute 设置属性
     * @param el
     * @param key
     * @param value
     */
    function patchAttr(el, key, value) {
        if (value === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    }

    // 为 style 属性进行打补丁
    function patchStyle(el, prev, next) {
        // 获取 style 对象
        var style = el.style;
        // 判断新的样式是否为纯字符串
        var isCssString = isString(next);
        if (next && !isCssString) {
            // 新样式挂载
            for (var key in next) {
                setStyle(style, key, next[key]);
            }
            // 清理旧样式
            if (prev && !isString(prev)) {
                for (var key in prev) {
                    if (next[key] == null) {
                        setStyle(style, key, '');
                    }
                }
            }
        }
    }
    // 赋值样式
    function setStyle(style, name, val) {
        style[name] = val;
    }

    // 为 event 事件进行打补丁
    function patchEvent(el, rawName, prevValue, nextValue) {
        // vei = vue event invokers
        var invokers = el._vei || (el._vei = {});
        // 是否存在缓存事件
        var existingInvoker = invokers[rawName];
        // 如果当前事件存在缓存，并且存在新的事件行为，则判定为更新操作。直接更新 invoker 的 value 即可
        if (nextValue && existingInvoker) {
            // patch
            existingInvoker.value = nextValue;
        }
        else {
            // 获取用于 addEventListener || removeEventListener 的事件名
            var name_1 = parseName(rawName);
            if (nextValue) {
                // add
                var invoker = (invokers[rawName] = createInvoker(nextValue));
                el.addEventListener(name_1, invoker);
            }
            else if (existingInvoker) {
                // remove
                el.removeEventListener(name_1, existingInvoker);
                // 删除缓存
                invokers[rawName] = undefined;
            }
        }
    }
    // 直接返回剔除 on，其余转化为小写的事件名即可
    function parseName(name) {
        return name.slice(2).toLowerCase();
    }
    // 生成invoker 函数
    function createInvoker(initialValue) {
        var invoker = function (e) {
            invoker.value && invoker.value();
        };
        // value 为真实的事件行为
        invoker.value = initialValue;
        return invoker;
    }

    // 为 prop 进行打补丁操作
    var patchProp = function (el, key, prevValue, nextValue) {
        if (key === 'class') {
            patchClass(el, nextValue);
        }
        else if (key === 'style') {
            patchStyle(el, prevValue, nextValue);
        }
        else if (isOn(key)) {
            patchEvent(el, key, prevValue, nextValue);
        }
        else if (shouldSetAsProp(el, key)) {
            patachDOMProp(el, key, nextValue);
        }
        else {
            patchAttr(el, key, nextValue);
        }
    };
    function shouldSetAsProp(el, key) {
        // 各种边缘情况处理
        if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
            return false;
        }
        // 表单元素的表单属性是只读的，必须设置为属性 attribute
        if (key === 'form') {
            return false;
        }
        // <input list> 必须设置为属性 attribute
        if (key === 'list' && el.tagName === 'INPUT') {
            return false;
        }
        // <textarea type> 必须设置为属性 attribute
        if (key === 'type' && el.tagName === 'TEXTAREA') {
            return false;
        }
        return key in el;
    }

    var renderer;
    var rendererOptions = extend({ patchProp: patchProp }, nodeOps);
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    var render = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = ensureRenderer()).render.apply(_a, __spreadArray([], __read(args), false));
    };
    // 创建并生成 app 实例
    var createApp = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var app = (_a = ensureRenderer()).createApp.apply(_a, __spreadArray([], __read(args), false));
        // 获取到 mount 挂载方法
        var mount = app.mount;
        // 对该方法进行重构，标准化 container，再重新触发 mount 进行挂载
        app.mount = function (containerOrSelector) {
            var container = normalizeContainer(containerOrSelector);
            if (!container) {
                console.error('容器必须存在');
                return;
            }
            mount(container);
        };
        return app;
    };
    // 标准化 container 容器
    function normalizeContainer(container) {
        if (isString(container)) {
            var res = document.querySelector(container);
            return res;
        }
        return container;
    }

    // 创建解析器上下文
    function createParserContext(content) {
        return {
            source: content
        };
    }
    // 生成 root 节点
    function createRoot(children) {
        return {
            type: 0 /* NodeTypes.ROOT */,
            children: children,
            loc: {}
        };
    }
    // 基础的 parse 方法，生成 AST
    function baseParse(content) {
        // 创建 parser 对象，为解析器的上下文对象
        var context = createParserContext(content);
        var children = parseChildren(context, []);
        return createRoot(children);
    }
    function parseChildren(context, ancestors) {
        var nodes = [];
        /**
           * 循环解析所有 node 节点，可以理解为对 token 的处理。
           * 例如：<div>hello world</div>，此时的处理顺序为：
           * 1. <div
           * 2. >
           * 3. hello world
           * 4. </
           * 5. div>
           */
        while (!isEnd(context, ancestors)) {
            var s = context.source;
            var node = void 0;
            if (startsWith(s, '{{')) {
                node = parseInterpolation(context);
            }
            else if (s[0] === '<') {
                if (/[a-z]/i.test(s[1])) {
                    node = parseElement(context, ancestors);
                }
            }
            // node 不存在意味着上面两个 if 都没有进入，那么此时的 token 为文本节点
            if (!node) {
                node = parseText(context);
            }
            pushNode(nodes, node);
        }
        return nodes;
    }
    function parseInterpolation(context) {
        // {{ xx }}
        var _a = __read(['{{', '}}'], 2), open = _a[0], close = _a[1];
        advanceBy(context, open.length);
        // 获取插值表达式中间的值
        var closeIndex = context.source.indexOf(close, open.length);
        var preTrimContent = parseTextData(context, closeIndex);
        var content = preTrimContent.trim();
        advanceBy(context, close.length);
        return {
            type: 5 /* NodeTypes.INTERPOLATION */,
            content: {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                isStatic: false,
                content: content
            }
        };
    }
    // 解析 Element 元素。例如：<div>
    function parseElement(context, ancestors) {
        // 先处理开始标签
        var element = parseTag(context, 0 /* TagType.Start */);
        // 处理子节点
        ancestors.push(element);
        var chilren = parseChildren(context, ancestors);
        ancestors.pop();
        // 为子节点赋值
        element.children = chilren;
        // 最后处理结束标签
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context, 1 /* TagType.End */);
        }
        return element;
    }
    // 解析标签
    function parseTag(context, type) {
        // 通过正则获取标签名
        var match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
        // 标签名字
        var tag = match[1];
        advanceBy(context, match[0].length);
        // 属性和指令的处理
        advanceSpaces(context);
        var props = parseAttributes(context, type);
        // 判断是否为自关闭标签，例如<img />
        var isSelfClosing = startsWith(context.source, '/>');
        // 继续对模版进行解析处理，是自动标签则处理两个字符 />，不是则处理一个字符 >
        advanceBy(context, isSelfClosing ? 2 : 1);
        return {
            type: 1 /* NodeTypes.ELEMENT */,
            tag: tag,
            tagType: 0 /* ElementTypes.ELEMENT */,
            children: [],
            props: props
        };
    }
    // 前进非固定步数
    function advanceSpaces(context) {
        var match = /^[\t\r\n\f ]+/.exec(context.source);
        if (match) {
            advanceBy(context, match[0].length);
        }
    }
    // 解析属性与指令
    function parseAttributes(context, type) {
        // 解析之后的 props 数组
        var props = [];
        // 属性名数组
        var attributeNames = new Set();
        // 循环解析，直到解析到标签结束（'>' || '/>'）为止
        while (context.source.length > 0 &&
            !startsWith(context.source, '>') &&
            !startsWith(context.source, '/>')) {
            // 具体某一条属性的解析
            var attr = parseAttribute(context, attributeNames);
            // 添加属性
            if (type === 0 /* TagType.Start */) {
                props.push(attr);
            }
            advanceSpaces(context);
        }
        return props;
    }
    // 处理指定指令，返回指令节点
    function parseAttribute(context, nameSet) {
        // 获取属性名称。例如：v-if
        var match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
        var name = match[0];
        // 添加当前的处理属性
        nameSet.add(name);
        advanceBy(context, name.length);
        // 获取属性值
        var value = undefined;
        // 解析模版，并拿到对应的属性值节点
        if (/^[\t\r\n\f ]*=/.test(context.source)) {
            advanceSpaces(context);
            advanceBy(context, 1);
            advanceSpaces(context);
            value = parseAttributeValue(context);
        }
        // v- 指令
        if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
            // 获取指令名称
            var match_1 = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
            var dirName = match_1[1];
            return {
                type: 7 /* NodeTypes.DIRECTIVE */,
                name: dirName,
                exp: value && {
                    type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                    content: value.content,
                    isStatic: false,
                    loc: {}
                },
                art: undefined,
                modifiers: undefined,
                loc: {}
            };
        }
        return {
            type: 6 /* NodeTypes.ATTRIBUTE */,
            name: name,
            value: value && {
                type: 2 /* NodeTypes.TEXT */,
                content: value.content,
                loc: {}
            },
            loc: {}
        };
    }
    // 获取属性 (attr) 的 value
    function parseAttributeValue(context) {
        var content = '';
        // 判断是单引号还是双引号
        var quote = context.source[0];
        var isQuoted = quote === "\"" || quote === "'";
        // 引号处理
        if (isQuoted) {
            advanceBy(context, 1);
            // 获取结束的 index
            var endIndex = context.source.indexOf(quote);
            // 获取指令的值
            if (endIndex === -1) {
                content = parseTextData(context, context.source.length);
            }
            else {
                content = parseTextData(context, endIndex);
                advanceBy(context, 1);
            }
        }
        return {
            content: content,
            isQuoted: isQuoted,
            loc: {}
        };
    }
    function pushNode(nodes, node) {
        nodes.push(node);
    }
    // 解析文本
    function parseText(context) {
        /**
           * 定义普通文本结束的标记
           * 例如：hello world </div>，那么文本结束的标记就为 <
           * PS：这也意味着如果你渲染了一个 <div> hell<o </div> 的标签，那么你将得到一个错误
           */
        var endTokens = ['<', '{{'];
        // 计算普通文本结束的位置
        var endIndex = context.source.length;
        // 计算精准的 endIndex，计算的逻辑为：从 context.source 中分别获取 '<', '{{' 的下标，取最小值为 endIndex
        for (var i = 0; i < endTokens.length; i++) {
            var index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endIndex > index) {
                endIndex = index;
            }
        }
        // 获取处理的文本内容
        var content = parseTextData(context, endIndex);
        return {
            type: 2 /* NodeTypes.TEXT */,
            content: content
        };
    }
    // 从指定位置获取给定长度的文本数据
    function parseTextData(context, length) {
        // 获取指定的文本数据
        var rawText = context.source.slice(0, length);
        // 继续对模版进行解析处理
        advanceBy(context, length);
        return rawText;
    }
    // 判断是否为结束节点
    function isEnd(context, ancestors) {
        var s = context.source;
        // 解析是否为结束标签
        if (startsWith(s, '</')) {
            for (var i = ancestors.length - 1; i >= 0; i++) {
                if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                    return true;
                }
            }
        }
        return !s;
    }
    /**
     * 判断当前是否为《标签结束的开始》。比如 </div> 就是 div 标签结束的开始
     * @param source 模板。例如：</div>
     * @param tag 标签。例如：div
     * @returns
     */
    function startsWithEndTagOpen(source, tag) {
        return (startsWith(source, '</') &&
            source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
            /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
    }
    // 是否以指定文本开头
    function startsWith(source, searchString) {
        return source.startsWith(searchString);
    }
    /**
     * 前进一步。多次调用，每次调用都会处理一部分的模板内容
     * 以 <div>hello world</div> 为例
     * 1. <div
     * 2. >
     * 3. hello world
     * 4. </div
     * 5. >
     */
    function advanceBy(context, numberOfCharacters) {
        // template 模版源
        var source = context.source;
        // 去除开始部分的无效数据
        context.source = source.slice(numberOfCharacters);
    }

    // 单个元素的根节点
    function isSingleElementRoot(root, child) {
        var children = root.children;
        return children.length === 1 && child.type === 1 /* NodeTypes.ELEMENT */;
    }

    var _a;
    var CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
    var CREATE_VNODE = Symbol('createVnode');
    var TO_DISPLAY_STRING = Symbol('toDisplayString');
    var CREATE_COMMENT = Symbol('createCommentVNode');
    var helperNameMap = (_a = {},
        // 在 renderer 中，通过 export { createVNode as createElementVNode }
        _a[CREATE_ELEMENT_VNODE] = 'createElementVNode',
        _a[CREATE_VNODE] = 'createVnode',
        _a[TO_DISPLAY_STRING] = 'toDisplayString',
        _a[CREATE_COMMENT] = 'createCommentVNode',
        _a);

    // 创建 transform 上下文
    function createTransformContext(root, _a) {
        var _b = _a.nodeTransforms, nodeTransforms = _b === void 0 ? [] : _b;
        var context = {
            // options
            nodeTransforms: nodeTransforms,
            // state
            root: root,
            helpers: new Map(),
            currentNode: root,
            parent: null,
            childIndex: 0,
            // methods
            helper: function (name) {
                var count = context.helpers.get(name) || 0;
                context.helpers.set(name, count + 1);
                return name;
            },
            replaceNode: function (node) {
                context.parent.children[context.childIndex] = context.currentNode = node;
            }
        };
        return context;
    }
    /**
     * 根据 AST 生成 JavaScript AST
     * @param root AST
     * @param options 配置对象
     */
    function transform(root, options) {
        // 创建 transform 上下文
        var context = createTransformContext(root, options);
        // 按照深度优先依次处理 node 节点转化
        traverseNode(root, context);
        createRootCodegen(root);
        root.helpers = __spreadArray([], __read(context.helpers.keys()), false);
        root.components = [];
        root.directives = [];
        root.imports = [];
        root.temps = [];
        root.cached = [];
    }
    /**
     * 遍历转化节点，转化的过程一定要是深度优先的（即：孙 -> 子 -> 父），因为当前节点的状态往往需要根据子节点的情况来确定。
     * 转化的过程分为两个阶段：
     * 1. 进入阶段：存储所有节点的转化函数到 exitFns 中
     * 2. 退出阶段：执行 exitFns 中缓存的转化函数，且一定是倒叙的。因为只有这样才能保证整个处理过程是深度优先的
     */
    function traverseNode(node, context) {
        // 通过上下文记录当前正在处理的 node 节点
        context.currentNode = node;
        // 获取当前所有 node 节点的 transform 方法
        var nodeTransforms = context.nodeTransforms;
        // 存储转化函数的数组
        var exitFns = [];
        // 循环获取节点的 transform 方法，缓存到 exitFns 中
        for (var i_1 = 0; i_1 < nodeTransforms.length; i_1++) {
            var onExit = nodeTransforms[i_1](node, context);
            if (onExit) {
                // 指令的 transforms 返回为 数组，所以需要解构
                if (isArray(onExit)) {
                    exitFns.push.apply(exitFns, __spreadArray([], __read(onExit), false));
                }
                else {
                    exitFns.push(onExit);
                }
            }
            // 因为触发了 replaceNode，可能会导致 context.currentNode 发生变化，所以需要在这里校正
            if (!context.currentNode) {
                // 节点已删除
                return;
            }
            else {
                // 节点更换
                node = context.currentNode;
            }
        }
        // 继续转化子节点
        switch (node.type) {
            case 10 /* NodeTypes.IF_BRANCH */:
            case 1 /* NodeTypes.ELEMENT */:
            case 0 /* NodeTypes.ROOT */:
                traverseChildren(node, context);
                break;
            // 处理插值表达式 {{}}
            case 5 /* NodeTypes.INTERPOLATION */:
                context.helper(TO_DISPLAY_STRING);
                break;
            // v-if 指令处理
            case 9 /* NodeTypes.IF */:
                for (var i_2 = 0; i_2 < node.branches.length; i_2++) {
                    traverseNode(node.branches[i_2], context);
                }
                break;
        }
        // 在退出时执行 transform
        context.currentNode = node;
        var i = exitFns.length;
        while (i--) {
            exitFns[i]();
        }
    }
    // 循环处理子节点
    function traverseChildren(parent, context) {
        parent.children.forEach(function (node, index) {
            context.parent = parent;
            context.childIndex = index;
            traverseNode(node, context);
        });
    }
    // 生成 root 节点下的 codegen
    function createRootCodegen(root) {
        var children = root.children;
        // 目前仅支持单个根节点
        if (children.length === 1) {
            var child = children[0];
            if (isSingleElementRoot(root, child) && child.codegenNode) {
                var codegenNode = child.codegenNode;
                root.codegenNode = codegenNode;
            }
        }
    }
    /**
     * 针对于指令的处理
     * @param name 正则。匹配具体的指令
     * @param fn 指令的具体处理方法，通常为闭包函数
     * @returns 返回一个闭包函数
     */
    function createStructuralDirectiveTransform(name, fn) {
        var matches = isString(name) ? function (n) { return n === name; } : function (n) { return name.test(n); };
        return function (node, context) {
            if (node.type === 1 /* NodeTypes.ELEMENT */) {
                var props = node.props;
                // 存储转化函数的数组
                var exitFns = [];
                // 遍历所有的 props
                for (var i = 0; i < props.length; i++) {
                    var prop = props[i];
                    // 仅处理指令，并且该指令要匹配指定的正则
                    if (prop.type === 7 /* NodeTypes.DIRECTIVE */ && matches(prop.name)) {
                        // 删除结构指令以避免无限递归
                        props.splice(i, 1);
                        i--;
                        // fn 会返回具体的指令函数
                        var onExit = fn(node, prop, context);
                        // 存储到数组中
                        if (onExit)
                            exitFns.push(onExit);
                    }
                }
                // 返回包含所有函数的数组
                return exitFns;
            }
        };
    }

    function createVNodeCall(context, tag, props, children) {
        if (context) {
            context.helper(CREATE_ELEMENT_VNODE);
        }
        return {
            type: 13 /* NodeTypes.VNODE_CALL */,
            tag: tag,
            props: props,
            children: children
        };
    }
    // 创建条件表达式的节点
    function createConditionalExpression(test, consequent, alternate, newline) {
        if (newline === void 0) { newline = true; }
        return {
            type: 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */,
            test: test,
            consequent: consequent,
            alternate: alternate,
            newline: newline,
            loc: {}
        };
    }
    // 创建简单的表达式节点
    function createSimpleExpression(content, isStatic) {
        return {
            type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
            loc: {},
            content: content,
            isStatic: isStatic
        };
    }
    // 创建对象属性节点
    function createObjectProperty(key, value) {
        return {
            type: 16 /* NodeTypes.JS_PROPERTY */,
            loc: {},
            key: isString(key) ? createSimpleExpression(key, true) : key,
            value: value
        };
    }
    // 创建调用表达式的节点
    function createCallExpression(callee, args) {
        return {
            type: 14 /* NodeTypes.JS_CALL_EXPRESSION */,
            loc: {},
            callee: callee,
            arguments: args
        };
    }

    // 对 element 节点的转化方法
    var transformElement = function (node, context) {
        return function postTransformElement() {
            node = context.currentNode;
            // 仅处理 ELEMENT 类型
            if (node.type !== 1 /* NodeTypes.ELEMENT */) {
                return;
            }
            var tag = node.tag;
            var vnodeTag = "\"".concat(tag, "\"");
            var vnodeProps = [];
            var vnodeChildren = node.children;
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    };

    function isText(node) {
        return node.type === 5 /* NodeTypes.INTERPOLATION */ || node.type === 2 /* NodeTypes.TEXT */;
    }
    // 返回 vnode 生成函数
    function getVNodeHelper(ssr, isComponent) {
        return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
    }
    // 返回 vnode节点
    function getMemoedVNodeCall(node) {
        return node;
    }

    // 将相邻的文本节点和表达式合并成一个表达式
    var transformText = function (node, context) {
        if (node.type === 0 /* NodeTypes.ROOT */ ||
            node.type === 1 /* NodeTypes.ELEMENT */ ||
            node.type === 11 /* NodeTypes.FOR */ ||
            node.type === 10 /* NodeTypes.IF_BRANCH */) {
            return function () {
                // 获取所有的子节点
                var children = node.children;
                // 当前容器
                var currentContainer;
                // 循环处理所有的子节点
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (isText(child)) {
                        for (var j = i + 1; j < children.length; j++) {
                            var next = children[j];
                            // 当前节点 child 和下一个节点 next 都是 Text 节点
                            if (isText(next)) {
                                if (!currentContainer) {
                                    // 生成一个复合表达式节点
                                    currentContainer = children[i] = createCompundExpression([child], child.loc);
                                }
                                // 在当前节点 child 和下一个节点 next 中间，插入"+"号
                                currentContainer.children.push(" + ", next);
                                // 把下一个删除
                                children.splice(j, 1);
                                j--;
                            }
                            // 当前节点 child 是 Text 节点，下一个节点 next 不是 Text 节点，则把 currentContainer 置空即可
                            else {
                                currentContainer = undefined;
                                break;
                            }
                        }
                    }
                }
            };
        }
    };
    // return hello {{ msg }} 复合表达式
    function createCompundExpression(children, loc) {
        return {
            type: 8 /* NodeTypes.COMPOUND_EXPRESSION */,
            loc: loc,
            children: children
        };
    }

    var aliasHelper = function (s) { return "".concat(helperNameMap[s], ": _").concat(helperNameMap[s]); };
    function createCodegenContext(ast) {
        var context = {
            code: '',
            runtimeGlobalName: 'Vue',
            source: ast.loc.source,
            indentLevel: 0,
            isSSR: false,
            // 需要触发的方法，关联 JavaScript AST 中的 helpers
            helper: function (key) {
                return "_".concat(helperNameMap[key]);
            },
            // 插入代码
            push: function (code) {
                context.code += code;
            },
            // 新的一行
            newline: function () {
                newline(context.indentLevel);
            },
            // 控制缩进 + 换行
            indent: function () {
                newline(++context.indentLevel);
            },
            // 控制缩进 + 换行
            deindent: function () {
                newline(--context.indentLevel);
            }
        };
        function newline(n) {
            context.code += '\n' + "  ".repeat(n);
        }
        return context;
    }
    // 根据 JavaScript AST 生成
    function generate(ast) {
        // 生成上下文 context
        var context = createCodegenContext(ast);
        // 获取 code 拼接方法
        var push = context.push, newline = context.newline, indent = context.indent, deindent = context.deindent;
        // 生成函数的前置代码：const _Vue = Vue
        genFunctionPreamble(context);
        // 创建方法名称
        var functionName = "render";
        // 创建方法参数
        var args = ['_ctx', '_cache'];
        var signature = args.join(', ');
        // 利用方法名称和参数拼接函数声明
        push("function ".concat(functionName, "(").concat(signature, ") {"));
        // 缩进 + 换行
        indent();
        // 增加 with 触发
        push("with (_ctx) {");
        indent();
        // 明确使用到的方法。如：createVNode
        var hasHelpers = ast.helpers.length > 0;
        if (hasHelpers) {
            push("const { ".concat(ast.helpers.map(aliasHelper).join(', '), " } = _Vue"));
            push('\n');
            newline();
        }
        // 最后拼接 return 的值
        newline();
        push("return ");
        // 处理 return 结果。
        if (ast.codegenNode) {
            genNode(ast.codegenNode, context);
        }
        else {
            push("null");
        }
        // with 结尾
        deindent();
        push('}');
        // 收缩缩进 + 换行
        deindent();
        push('}');
        return {
            ast: ast,
            code: context.code
        };
    }
    // 生成 "const _Vue = Vue\n\nreturn "
    function genFunctionPreamble(context) {
        var push = context.push, runtimeGlobalName = context.runtimeGlobalName, newline = context.newline;
        var VueVinding = runtimeGlobalName;
        push("const _Vue = ".concat(VueVinding, "\n"));
        newline();
        push("return ");
    }
    // 区分节点进行处理
    function genNode(node, context) {
        switch (node.type) {
            case 1 /* NodeTypes.ELEMENT */:
            case 9 /* NodeTypes.IF */:
                genNode(node.codegenNode, context);
                break;
            case 13 /* NodeTypes.VNODE_CALL */:
                genVNodeCall(node, context);
                break;
            case 2 /* NodeTypes.TEXT */:
                genText(node, context);
                break;
            // 复合表达式处理
            case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
                genExpression(node, context);
                break;
            // 表达式处理
            case 5 /* NodeTypes.INTERPOLATION */:
                genInterpolation(node, context);
                break;
            // {{}} 处理
            case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
                genCompoundExpression(node, context);
                break;
            // JS调用表达式的处理
            case 14 /* NodeTypes.JS_CALL_EXPRESSION */:
                genCallExpression(node, context);
                break;
            // JS条件表达式的处理
            case 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */:
                genConditionalExpression(node, context);
                break;
        }
    }
    // JS 调用表达式的处理
    function genCallExpression(node, context) {
        var push = context.push, helper = context.helper;
        var callee = isString(node.callee) ? node.callee : helper(node.callee);
        push(callee + "(", node);
        genNodeList(node.arguments, context);
        push(")");
    }
    /**
     * JS条件表达式的处理。
     * 例如：
     *  isShow
            ? _createElementVNode("h1", null, ["你好，世界"])
            : _createCommentVNode("v-if", true),
     */
    function genConditionalExpression(node, context) {
        var test = node.test, alternate = node.alternate, consequent = node.consequent, needNewLine = node.newline;
        var push = context.push, indent = context.indent, deindent = context.deindent, newline = context.newline;
        if (test.type === 4 /* NodeTypes.SIMPLE_EXPRESSION */) {
            // 写入变量
            genExpression(test, context);
        }
        needNewLine && indent();
        context.indentLevel++;
        needNewLine || push(" ");
        push("? ");
        // 写入满足条件的处理逻辑
        genNode(consequent, context);
        context.indentLevel--;
        needNewLine && newline();
        needNewLine || push(" ");
        push(": ");
        // 判断 else 的类型是否也为 JS_CONDITIONAL_EXPRESSION
        var isNested = alternate.type === 19 /* NodeTypes.JS_CONDITIONAL_EXPRESSION */;
        // 不是则缩进
        if (!isNested) {
            context.indentLevel++;
        }
        // 写入 else（不满足条件）的处理逻辑
        genNode(alternate, context);
        if (!isNested) {
            context.indentLevel--;
        }
        needNewLine && deindent();
    }
    // 复合表达式处理
    function genCompoundExpression(node, context) {
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (isString(child)) {
                context.push(child);
            }
            else {
                genNode(child, context);
            }
        }
    }
    // 表达式处理
    function genExpression(node, context) {
        var content = node.content, isStatic = node.isStatic;
        context.push(isStatic ? JSON.stringify(content) : content, node);
    }
    // {{}} 处理
    function genInterpolation(node, context) {
        var push = context.push, helper = context.helper;
        push("".concat(helper(TO_DISPLAY_STRING), "("));
        genNode(node.content, context);
        push(')');
    }
    // 处理 Text 节点
    function genText(node, context) {
        context.push(JSON.stringify(node.content), node);
    }
    // 处理 VNODE_CALL 节点
    function genVNodeCall(node, context) {
        var push = context.push, helper = context.helper;
        var tag = node.tag, props = node.props, children = node.children, patchFlag = node.patchFlag, dynamicProps = node.dynamicProps; node.directives; node.isBlock; node.disableTracking; var isComponent = node.isComponent;
        var callHelper = getVNodeHelper(context.isSSR, isComponent);
        push(helper(callHelper) + "(", node);
        var args = genNullableArgs([tag, props, children, patchFlag, dynamicProps]);
        genNodeList(args, context);
        push(')');
    }
    function genNullableArgs(args) {
        var i = args.length;
        while (i--) {
            if (args[i] != null)
                break;
        }
        return args.slice(0, i + 1).map(function (arg) { return arg || "null"; });
    }
    // 处理参数的填充
    function genNodeList(nodes, context) {
        var push = context.push; context.newline;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (isString(node)) {
                push(node);
            }
            else if (isArray(node)) {
                genNodeListAsArray(node, context);
            }
            else {
                genNode(node, context);
            }
            if (i < nodes.length - 1) {
                push(", ");
            }
        }
    }
    function genNodeListAsArray(nodes, context) {
        context.push('[');
        genNodeList(nodes, context);
        context.push(']');
    }

    /**
     * transformIf === exitFns。内部保存了所有 v-if、v-else、else-if 的处理函数
     */
    var transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, function (node, dir, context) {
        return processIf(node, dir, context, function (ifNode, branch, isRoot) {
            var key = 0;
            return function () {
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
                }
            };
        });
    });
    /**
     * v-if 的转化处理
     */
    function processIf(node, dir, context, processCodegen) {
        // 仅处理 v-if
        if (dir.name === 'if') {
            // 创建 branch 属性
            var branch = createIfBranch(node, dir);
            // 生成 if 指令节点，包含 branches
            var ifNode = {
                type: 9 /* NodeTypes.IF */,
                loc: node.loc,
                branches: [branch]
            };
            // 切换 currentVNode，即：当前处理节点为 ifNode
            context.replaceNode(ifNode);
            // 生成对应的 codegen 属性
            if (processCodegen) {
                return processCodegen(ifNode, branch, true);
            }
        }
    }
    // 创建 if 指令的 branch 属性节点
    function createIfBranch(node, dir) {
        return {
            type: 10 /* NodeTypes.IF_BRANCH */,
            loc: node.loc,
            condition: dir.exp,
            children: [node]
        };
    }
    // 生成分支节点的 codegenNode
    function createCodegenNodeForBranch(branch, keyIndex, context) {
        if (branch.condition) {
            return createConditionalExpression(branch.condition, createChildrenCodegenNode(branch, keyIndex), 
            // 以注释的形式展示 v-if
            createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', 'true']));
        }
        else {
            return createChildrenCodegenNode(branch, keyIndex);
        }
    }
    // 创建指定子节点的 codegen
    function createChildrenCodegenNode(branch, keyIndex) {
        var keyProperty = createObjectProperty("key", createSimpleExpression("".concat(keyIndex), false));
        var children = branch.children;
        var firstChild = children[0];
        var ret = firstChild.codegenNode;
        var vnodeCall = getMemoedVNodeCall(ret);
        injectProp(vnodeCall, keyProperty);
        return ret;
    }
    // 填充 props
    function injectProp(node, prop) {
        var propsWithInjection;
        var props = node.type === 13 /* NodeTypes.VNODE_CALL */ ? node.props : node.arguments[2];
        if (props === null || isString(props)) {
            propsWithInjection = createObjectExpression([prop]);
        }
        if (node.type === 13 /* NodeTypes.VNODE_CALL */) {
            node.props = propsWithInjection;
        }
    }
    // 创建对象表达式节点
    function createObjectExpression(properties) {
        return {
            type: 15 /* NodeTypes.JS_OBJECT_EXPRESSION */,
            loc: {},
            properties: properties
        };
    }

    function baseCompile(template, options) {
        if (options === void 0) { options = {}; }
        /**
         * template.trim() 简单处理两侧空格，比如：
         * template: `
            <div>
              hello world,
                <h1 v-if="isShow">
                {{ msg }}
              </h1>
            </div>
            `
         */
        var ast = baseParse(template.trim());
        transform(ast, extend(options, {
            nodeTransforms: [transformElement, transformText, transformIf]
        }));
        console.log(ast);
        return generate(ast);
    }

    function compile(template, options) {
        return baseCompile(template, options);
    }

    function compileToFunction(template, options) {
        var code = compile(template, options).code;
        var render = new Function(code)();
        return render;
    }
    registerRuntimeCompiler(compileToFunction);

    exports.Comment = Comment;
    exports.Fragment = Fragment;
    exports.Text = Text;
    exports.compile = compileToFunction;
    exports.computed = computed;
    exports.createApp = createApp;
    exports.createCommentVNode = createCommentVNode;
    exports.createElementVNode = createVNode;
    exports.effect = effect;
    exports.h = h;
    exports.queuePreFlushCb = queuePreFlushCb;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.toDisplayString = toDisplayString;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map
