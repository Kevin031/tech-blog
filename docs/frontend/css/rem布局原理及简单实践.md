# rem 布局原理及简单实践

说到用`rem`作为尺寸单位的布局，自然会提到`em`，先对比一下两者有什么不同

## em

1.作为其他属性单位时，代表**自身**字体大小 2.作为`font-size`单位时，代表**父元素**的字体大小

（父元素追溯到最后，是默认的 html 标签字体大小，为 16px）

举个例子，如果我们需要基于一个 960px 宽的设计稿制作一个页面时，里面的元素宽度需要经过以下计算得出

`1 / 16px * 元素原本像素 = 元素em值`

或者可以这么理解

`1 / 父元素的font-size * 需要转换的元素像素 = 元素em值`

所以算出来 960px 就是 60em，而 480px 就是 30em

**改变父元素的字体大小，子元素会等比例变化**

这种做法牵一发而动全身，当我们需要整个页面等比缩放时，只需要改变根元素的字体大小就可以了，缺点是元素宽度和字体大小同时用 em 作为单位的时候，子元素的数值**与父元素的字体大小有关**，难以计算。

## rem

1.作为非根元素属性单位时，代表**根元素**字体大小 2.作为根元素时，代表**初始**字体大小

由此可见，`rem`和`em`最大的不同就是 rem 只**与根元素字体大小有关**，计算简便一些。

以下例子证明 rem 数值与根元素有关：

```css
/* 在初始字体大小16px的前提下 */
html {
  font-size: 2rem;
} /*32px*/
p {
  font-size: 2rem;
} /*64px*/
```

## rem 布局的实现

在实际运用中，要实现元素随页面宽高而进行等比变化，需要设置 JS 监听页面的宽度变化，从而改变根元素的字体大小

`document.documentElement.style.fontSize = document.documentElement.clientWidth/100 + 'px';`

其中**100**的数值是可以自己定义的，这段代码相当于把页面可视区域分成了**100**份，每一份的宽度都为 1rem，所以如果一个元素的宽度为页面的 50%，CSS 只需要写成这样：

```css
p {
  width: 50rem;
}
```

实际开发中可以封装成以下的兼容浏览器的代码

```javascript
function remChange() {
  var resizeEvt =
    "orientationchange" in window ? "orientationchange" : "resize"; // 屏幕宽度改变的事件
  var widthProportion = function () {
    // 计算
    var doc = document.body || document.documentElement;
    var p = doc.clientWidth;
    return p / 100;
  };
  var changePage = function () {
    // 触发的函数
    document
      .getElementsByTagName("html")[0]
      .setAttribute(
        "style",
        "font-size:" + widthProportion() + "px !important"
      );
  };
  changePage(); // 初始化
  window.addEventListener(resizeEvt, changePage, false); // 监听事件
}
```

同时针对 R 屏可以采用这样的方案

```javascript
function setDPR() {
  var viewport = document.querySelector("meta[name=viewport]");
  if (window.devicePixelRatio === 1) {
    viewport.setAttribute(
      "content",
      "width=device-width,initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no"
    );
  }
  if (window.devicePixelRatio === 2) {
    // view宽度等于设备宽度，初始缩放值为0.5，允许用户最大缩放值0.5，不允许用户进行缩放
    viewport.setAttribute(
      "content",
      "width=device-width,initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5, user-scalable=no"
    );
  }
  if (window.devicePixelRatio === 3) {
    viewport.setAttribute(
      "content",
      "width=device-width,initial-scale=0.3333333333333333, maximum-scale=0.3333333333333333, minimum-scale=0.3333333333333333, user-scalable=no"
    );
  }
}
```

而 CSS 也可以采用预编译语言 less/sass/stylus 来简化计算过程，以下是 less 的例子

```javascript
@baseUeWidth: 640; /* 设计稿的宽度 */
.px2rem (@px) {
    @result: @px/@baseUeWidth * 1rem;
}
p {
    .px2rem(100); /* 在设计稿中的宽度为100px */
    width: @result;
}
```

或采用另一种形式：

```less
@baseUeWidth: 640; /* 设计稿的宽度 */
.px2rem (@name, @px) {
  @{name}: @px / @baseUeWidth * 1rem;
}
p {
  .px2rem(width, 100); /* 在设计稿中的宽度为100px */
}
```

## 总结

现在页面通常有两种布局形式：
一种是弹性布局，100%还原设计稿
另一种是响应式布局，不同的屏幕有不同的显示

显然 rem 是为弹性布局而生的，这种布局方式更适用于一些功能型的 WebApp，而内容平台则更适合采用响应式布局（媒体查询），因此 rem 也不是万能的，而 em 在字体尺寸方面也有它的优势，需要根据实际情况来选用。
