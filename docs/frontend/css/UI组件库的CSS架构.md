# UI 组件库的 CSS 架构

## ACSS

ACSS 模式几乎是一个样式属性就对应一个类名，类似与 tailwindcss，优点是复用性很强，维护成本很低，例如：d-flex, m-10, w-20 等。

## BEM

命名层级为`{块BLOCK}__{元素ELEMENT}--{修饰符MODIFIER}`

通过这种命名规范可以避免一些命名冲突，以及 CSS 选择器层级过多的问题。

## ITCSS

ITCSS 采用了样式的分层结构，大致有 7 层

1. Settings 层：通用样式变量，如颜色、尺寸

2. Tools 层：通用工具函数，如 mixins、function

3. Generic 层：通用基础样式，一般用于统一各个浏览器的基础样式，例如 normalize、resets 库

4. Base 层：对某些全局使用的元素进行通用的定制化样式，例如 p 标签、ul 标签

5. Objects 层：使用 OOCSS 的地方，某些结构与样式分离的专用类

6. Components 层：具体的组件，对应到组件库的每一个组件

7. Trumps 层：重写某些样式，只会影响到最具体的某一小块 DOM 元素
