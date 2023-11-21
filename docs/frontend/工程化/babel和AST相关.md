# AST 相关

# 什么是 AST

Abstract Syntax Tree，抽象语法树，是源代码结构的一种抽象表示

AST 可视化：[https://astexplorer.net/](https://astexplorer.net/)

# 如何生成 AST

编译器的工作流程如下：

1. 词法分析：字符流 -> 词（token）

2. 语法分析：token 流 -> 语法树

3. 语义分析：语法树 -> 节点逐一检查语意规则 -> 语法树

4. 中间代码生成：语法树 -> 中间代码

5. 中间代码优化：中间代码 -> 体积和效率优化 -> 中间代码

6. 目标代码生成：中间代码 -> 目标代码

7. 目标代码优化：目标代码 -> 利用 CPU 流水线、多核心 -> 目标代码

而 AST 发生在词法分析和语法分析这两个步骤

**词法分析**: 主要是词法单元的识别，状态机逐一接受字符，判断字符串是否和模式匹配，直到字符串结束。

**语法分析**: 验证句子可以由源语言的文法(描述程序语言构造的语法)生成，构造出一个语法分析树。

例如：实现一个能够解析加减乘除算数表达式的语法解析器，并且能够根据解析的 AST 计算结果

```ts
interface ExprAST {
  left: Number | ExprAST;
  operator: "+" | "-" | "*" | "/";
  right: ExprAST | number;
}
```

```ts
var Parser = require("jison").Parser;

const grammar = {
  lex: {
    rules: [
      ["s+", "/* skip whitespace */"],
      ["[0-9]+(?:.[0-9]+)?\b", "return 'NUMBER';"],
      ["*", "return '*';"],
      ["/", "return '/';"],
      ["-", "return '-';"],
      ["+", "return '+';"],
      ["(", "return '(';"],
      [")", "return ')';"],
      ["$", "return 'EOF';"],
    ],
  },

  bnf: {
    // 第一个产生式左边的非终结符会作为语法的起始符号
    // 遇到EOF结束时，输出结果
    // expression ——> e EOF
    expressions: [["e EOF", "console.log($1); return $1;"]],
    /**
            e ——> NUMBER |
                  e + e |
                  e - e |
                  e * e |
                  ( e ) |
                  - e
        */
    e: [
      ["NUMBER", "$$ = Number($1)"],
      ["e + e", "$$ = { left: $1, operator: '+', right: $3 }"],
      ["e - e", "$$ = { left: $1, operator: '-', right: $3 }"],
      ["e * e", "$$ = { left: $1, operator: '*', right: $3 }"],
      ["e / e", "$$ = { left: $1, operator: '/', right: $3 }"],
      [
        "- e",
        "$$ = { left: null, operator: '-', right: { left: $2, operator: null, right: null } }",
      ],
      ["( e )", "$$ = $2"],
    ],
  },

  // jison就可以比较移进与规约的选择间涉及的优先级
  operators: [
    ["left", "+", "-"],
    ["left", "*", "/"],
  ],
};

var parser = new Parser(grammar);

// 输出
parser.parse("1+2*3");
```

# AST 的前端应用场景

## 代码分析

如 eslint、prettier、jsdoc、语法提示和自动补全

## 代码转换

babel：将 ES6 转换为 ES5, 将 JSX 转换为 JS

UglifyJS：通过删除无用节点，压缩 JS 代码

模板引擎：Vue 的 SFC

# AST 在 babel 中的应用

## babel 的编译流程

parse: 词法分析 -> 语法分析

transform: 语义分析 -> 中间代码生成 -> 中间代码优化

generate: 目标代码生成

1. parse

通过@babel/parser(acore 和 acore-jsx)将输入代码转换为 AST(babel 的 AST 节点类型)

2. transform

通过@babel/traverse 提供遍历 AST 节点的能力，但是不转换代码，具体的转换逻辑交给 babel 插件实现

3. generate

通过@babel/generate 根据最新的 AST 生成目标代码

## babel 的插件类型

大体上有以下几种

`babel-plugin-transform-xx`: 处理语法转换相关的插件

`babel-plugin-syntax-xx`: 处理 API Polyfill 相关的插件

`babel-plugin-proposal-xx`: 编译正在提案中的语法和属性

此外，babel 提供了一些插件的集合，称为预设，常用预设有 `@babel/preset-env`

# babel 实战案例

## 使用 babel 修改函数名

```js
// 源代码
const hello = () => {};

// 要求修改为
const world = () => {};
```

答案：

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator");

const code = `const hello = () => {}`;

// 源码解析ast
const ast = parser.parse(code);

// 遍历ast，执行转换
traverse.default(ast, {
  Identifier(path) {
    const { node } = path;
    if (node.name === "hello") {
      node.name = "world";
    }
  },
});

// 生成
const result = generator.default(ast, {}, code);

console.log(result.code);
```

## 箭头函数转换

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator");
const types = require("@babel/types");

const code = `const sum = (a, b) => {
  console.log(this)
  return a + b;
}`;

// 源码解析ast
const ast = parser.parse(code);

function hoistFunctionEnvironment(path) {
  // 确定当前箭头函数要使用哪个地方的this
  const thisEnv = path.findParent((parent) => {
    return (
      (parent.isFunction() && !parent.isArrowFunctionExpression()) ||
      parent.isProgram()
    );
  });

  // 在副作用域放入一个_this变量
  thisEnv.scope.push({
    id: types.identifier("_this"),
    init: types.thisExpression(), // 生成this节点
  });

  // 遍历子节点
  let thisPaths = [];
  path.traverse({
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    },
  });

  // 替换
  thisPaths.forEach((thisPath) => {
    // this => _this
    thisPath.replaceWith(types.identifier("_this"));
  });
}

// 遍历ast，执行转换
traverse.default(ast, {
  ArrowFunctionExpression(path) {
    const { node } = path;

    // 提升函数环境
    hoistFunctionEnvironment(path);

    node.type = "FunctionExpression";

    if (!types.isBlockStatement(node.body)) {
      node.body = types.blockStatement([types.returnStatement(node.body)]);
    }
  },
});

// 生成
const result = generator.default(ast, {}, code);

console.log(result.code);
// 输出代码
// const _this = this;
// const sum = function (a, b) {
//   console.log(_this)
//   return a + b;
// }
```

## 给 console.log 增加当前文件名和代码位置

```js
// 源代码
console.log("hello world");

// 要求修改为
console.log("hello world", "文件名", "具体代码位置信息");
```

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator");
const types = require("@babel/types");

const code = `
console.log("hello world");
console.warn(1);
console.log(2);
console.log(3);
console.log(4);
`;

// 源码解析ast
const ast = parser.parse(code);

// 遍历ast，执行转换
traverse.default(ast, {
  CallExpression(path, state) {
    const { node } = path;
    if (types.isMemberExpression(node.callee)) {
      // 找到console
      if (node.callee.object.name === "console") {
        // 找到符合的方法名
        if (
          ["log", "info", "warn", "error"].includes(node.callee.property.name)
        ) {
          // 找到所处的行列
          const { line, column } = node.loc.start;
          node.arguments.push(types.stringLiteral(`${line}:${column}`));
          // 找到文件名
          // const filename = state.file.opts.filename;
          // 输出文件的相对路径
          // const relativeName = pathLib
          //   .relative(__dirname, filename)
          //   .replace(/\\/g, "/"); // 兼容windows
          // node.arguments.push(types.stringLiteral(relativeName));
        }
      }
    }
  },
});

// 生成
const result = generator.default(ast, {}, code);

console.log(result.code);
```

## 往每个函数作用域添加一行日志函数

源代码：

```js
//四种声明函数的方式
function sum(a, b) {
  return a + b;
}
const multiply = function (a, b) {
  return a * b;
};
const minus = (a, b) => a - b;
class Calculator {
  divide(a, b) {
    return a / b;
  }
}
```

转换后：

```js
import loggerLib from "logger";

function sum(a, b) {
  loggerLib();
  return a + b;
}
const multiply = function (a, b) {
  loggerLib();
  return a * b;
};
const minus = (a, b) => {
  loggerLib();
  return a - b;
};
class Calculator {
  divide(a, b) {
    loggerLib();
    return a / b;
  }
}
```

## 简易版 eslint: 代码中不能有 console.log

## 压缩代码

```js
function getAge() {
  var age = 12;
  console.log(age);
  var name = "zhufeng";
  console.log(name);
}
```

需要将`age`, `getAge`, `name`进行压缩

## 按需加载

```js
// 源代码
import { flatten, concat } from "lodash";
console.log(flatten, concat);

// 编译后
import flatten from "lodash/flatten";
import concat from "lodash/concat";
console.log(flatten, concat);
```

## 实现 ts 的类型校验

### 赋值场景

### 先声明再赋值场景

### 泛型场景
