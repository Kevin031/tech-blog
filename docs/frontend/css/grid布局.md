# grid 布局

目前 web 开发主流的布局方式为：block 和 flex，它们都是一维的布局，定义了元素在一条线上的排布方式，而新增的 grid 布局是二维的布局方式。

在火狐浏览器下，可以通过几行代码实现瀑布流布局，但是兼容性不好

```css
.container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* 兼容性不好 */
  grid-template-rows: masonry;
  grid-gap: 10px;
}
```

而在 Chrome 浏览器上可以根据别的属性实现，先了解一下 grid 的具体用法

## 未定义格子占位时的表现

```css
.container-1 {
  background-color: #eee;
  width: 500px;
  height: 500px;
  display: grid;
  grid-template-rows: 100px 100px 100px 100px 100px;
  grid-template-columns: 100px 100px 100px 100px 100px;

  .cell-1 {
    background-color: blue;
  }
  .cell-2 {
    background-color: yellow;
  }
}
```

<div class="container-1">
  <div class="cell-1"></div>
  <div class="cell-2"></div>
</div>

<style lang="less">
  .container-1 {
    background-color: #eee;
    width: 500px;
    height: 500px;
    display: grid;
    grid-template-rows: 100px 100px 100px 100px 100px;
    grid-template-columns: 100px 100px 100px 100px 100px;

    .cell-1 {
      background-color: blue;
    }
    .cell-2 {
      background-color: yellow;
    }
  }
</style>

## 定义格子占位后

```css
.container-2 {
  background-color: #eee;
  width: 500px;
  height: 500px;
  display: grid;
  grid-template-rows: 100px 100px 100px 100px 100px;
  grid-template-columns: 100px 100px 100px 100px 100px;

  .cell-1 {
    background-color: blue;
    grid-row: 1 / 3;
    /* 占据1-3行 */
    grid-column: 1 / 3;
    /* 占据1-3列 */
    /* 可以简写为: grid-area: 1 / 1 / 3 / 3; */
  }
  .cell-2 {
    background-color: yellow;
    grid-row: 2 / 4;
    /* 占据2-4行 */
    grid-column: 3 / 6;
    /* 占据3-6列 */
  }
}
```

<div class="container-2">
  <div class="cell-1"></div>
  <div class="cell-2"></div>
</div>

<style lang="less">
  .container-2 {
    background-color: #eee;
    width: 500px;
    height: 500px;
    display: grid;
    grid-template-rows: 100px 100px 100px 100px 100px;
    grid-template-columns: 100px 100px 100px 100px 100px;

    .cell-1 {
      background-color: blue;
      grid-row: 1 / 3;
      grid-column: 1 / 3;
    }
    .cell-2 {
      background-color: yellow;
      grid-row: 2 / 4;
      grid-column: 3 / 6;
    }
  }
</style>

## 使用 span 关键字延伸

```css
.cell-1 {
  background-color: blue;
  grid-row: 1 / span 3;
  /* 占据1延伸3行 */
  grid-column: 1 / span 3;
  /* 占据1延伸3列 */
  /* 可以简写为: grid-area: 1 / 1 / 3 / 3; */
}
```

## grid line 命名

```less
.container-4 {
  background-color: #eee;
  width: 540px;
  height: 540px;
  display: grid;
  grid-template-rows: [X1] 100px [X2] 100px [X3] 100px [X4] 100px [X5] 100px;
  grid-template-columns: [Y1] 100px [Y2] 100px [Y3] 100px [Y4] 100px [Y5] 100px;
  grid-template-areas:
    "header header header header header"
    "nav main main main main"
    "nav main main main main"
    "nav main main main main"
    ". footer footer footer .";
  row-gap: 10px;
  column-gap: 10px;
  .header {
    background-color: blue;
    grid-area: header;
  }
  .nav {
    background-color: yellow;
    grid-area: nav;
  }
  .main {
    background-color: orange;
    grid-area: main;
  }
  .footer {
    background-color: black;
    grid-area: footer;
  }
}
```

<div class="container-4">
  <div class="header"></div>
  <div class="nav"></div>
  <div class="main"></div>
  <div class="footer"></div>
</div>

<style lang="less">
.container-4 {
  background-color: #eee;
  width: 500px;
  height: 500px;
  display: grid;
  grid-template-rows: [X1] 100px [X2] 100px [X3] 100px [X4] 100px [X5] 100px;
  grid-template-columns: [Y1] 100px [Y2] 100px [Y3] 100px [Y4] 100px [Y5] 100px;
  grid-template-areas:
    "header header header header header"
    "nav main main main main"
    "nav main main main main"
    "nav main main main main"
    ". footer footer footer .";
  /* row-gap: 10px;
  column-gap: 10px; */
  .header {
    background-color: blue;
    grid-area: header;
  }
  .nav {
    background-color: yellow;
    grid-area: nav;
  }
  .main {
    background-color: orange;
    grid-area: main;
  }
  .footer {
    background-color: black;
    grid-area: footer;
  }
}
</style>

## fr 和 repeat

上述例子可以进行如下优化

```css
.container-4 {
  ...
  grid-template-rows: 3fr 1fr 1fr 1fr 1fr;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr;
}
```

表示行列空间按容器进行等分，增加这个数字则增加相应的权重。

而对于重复性的书写，可以通过 repeat 来简写

repeat 的第一个参数为重复次数，第二个参数为重复的内容

上述代码可以改造为

```css
.container-4 {
  ...
  grid-template-rows: 3fr repeat(4, 1fr);
  grid-template-columns: 3fr repeat(4, 1fr);
}
```

## 瀑布流实现

需要再引入 2 个概念

```css
.container {
  display: grid;
  grid-auto-rows: minmax(1px, 1px);
  grid-template-columns: repeat(3, 1fr);
}
```

grid-auto-rows 表示将行按 1px 为单位进行自动等分

而子容器需要指定占据的行数，这个需要渲染后通过 DOM 操作计算出来

```vue
<template>
  <div class="container">
    <div
      v-for="let item in list"
      :style="`grid-row-end: span ${item.height + 8}; height: ${
        item.height
      }px;`"
    ></div>
  </div>
</template>
```
