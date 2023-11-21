# Vue3 性能提升的方式

主要是通过 `AOT`，在编译时进行大量的优化，从而提高运行时效率。

## 静态提升

在模板中常常有部分内容是不带任何动态绑定的：

```html
<div>
  <!-- 需提升 -->
  <div>foo</div>
  <!-- 需提升 -->
  <div>bar</div>
  <div>{{ dynamic }}</div>
</div>
```

编译结果：

```js
import {
  createElementVNode as _createElementVNode,
  createCommentVNode as _createCommentVNode,
  toDisplayString as _toDisplayString,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from "vue";

const _hoisted_1 = /*#__PURE__*/ _createElementVNode(
  "div",
  null,
  "foo",
  -1 /* HOISTED */
);
const _hoisted_2 = /*#__PURE__*/ _createElementVNode(
  "div",
  null,
  "bar",
  -1 /* HOISTED */
);

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock("div", null, [
      _hoisted_1,
      _createCommentVNode(" hoisted "),
      _hoisted_2,
      _createCommentVNode(" hoisted "),
      _createElementVNode(
        "div",
        null,
        _toDisplayString(_ctx.dynamic),
        1 /* TEXT */
      ),
    ])
  );
}
```

`Vue` 编译器自动地会提升这部分 `vnode` 创建函数到这个模板的渲染函数之外，并在每次渲染时都使用这份相同的 vnode，渲染器知道新旧 vnode 在这部分是完全相同的，所以会完全跳过对它们的差异比对。

同时，如果某部分静态 `vnode` 在其他地方复用，也可以使用原生 `cloneNode` 来提升效率。

## 预字符串化

当有足够多连续的静态元素时，它们会被压缩为一个“静态 vnode”，其中包含的是这些节点相应的纯 HTML 字符串。

```html
<div>
  <div class="foo">foo</div>
  <div class="foo">foo</div>
  <div class="foo">foo</div>
  <div class="foo">foo</div>
  <div class="foo">foo</div>
  <div>{{ dynamic }}</div>
</div>
```

```js
import {
  createElementVNode as _createElementVNode,
  toDisplayString as _toDisplayString,
  createStaticVNode as _createStaticVNode,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from "vue";

const _hoisted_1 = /*#__PURE__*/ _createStaticVNode(
  '<div class="foo">foo</div><div class="foo">foo</div><div class="foo">foo</div><div class="foo">foo</div><div class="foo">foo</div>',
  5
);

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock("div", null, [
      _hoisted_1,
      _createElementVNode(
        "div",
        null,
        _toDisplayString(_ctx.dynamic),
        1 /* TEXT */
      ),
    ])
  );
}

// Check the console for the AST
```

## 缓存事件处理函数

避免反复创建函数，提升运行时效率

```vue
<button @click="count++"></button>
```

```js
render(ctx, _cache) {
  return createVNode('button', {
    onClick: cache[0] || (cache[0] = ($event) => (ctx.count++))
  })
}
```

## 树结构打平

`vue2` 在对比新旧树的时候，并不知道哪些节点是静态的，哪些是动态的，因此只能一层一层比较，这就浪费了大部分事件在比对静态节点上。

```vue
<div> <!-- root block -->
  <div>...</div>         <!-- 不会追踪 -->
  <div :id="id"></div>   <!-- 要追踪 -->
  <div>                  <!-- 不会追踪 -->
    <div>{{ bar }}</div> <!-- 要追踪 -->
  </div>
</div>
```

Vue3 中编译的结果会被打平为一个数组，仅包含所有动态的后代节点：

```js
export function render() {
  return (
    _openBlock(),
    _createElementBlock(
      _Fragment,
      null,
      [
        /* children */
      ],
      64 /* STABLE_FRAGMENT */
    )
  );
}
```

```
div (block root)
- div 带有 :id 绑定
- div 带有 {{ bar }} 绑定
```

这大大减少了我们在虚拟 DOM 协调时需要遍历的节点数量。模板中任何的静态部分都会被高效地略过。

## 静态类型标记（PatchFlag）

对于单个有动态绑定的元素来说，我们可以在编译时推断出大量信息：

```vue
<!-- 仅含 class 绑定 -->
<div :class="{ active }"></div>

<!-- 仅含 id 和 value 绑定 -->
<input :id="id" :value="value" />

<!-- 仅含文本子节点 -->
<div>{{ dynamic }}</div>
```

`Vue` 在 `vnode` 创建调用中直接编码了每个元素所需的更新类型

```js
createElementVNode(
  "div",
  {
    class: _normalizeClass({ active: _ctx.active }),
  },
  null,
  2 /* CLASS *
);
```

最后这个参数`2` 就是一个更新类型标记 (patch flag)

```js
if (vnode.patchFlag & PatchFlags.CLASS /* 2 */) {
  // 更新节点的 CSS class
}
```

位运算检查是非常快的。通过这样的更新类型标记，Vue 能够在更新带有动态绑定的元素时做最少的操作。同时也提高了 diff 的效率。
