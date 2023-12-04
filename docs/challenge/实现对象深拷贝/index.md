# 实现对象深拷贝

## 浅拷贝的常见实现方式

1. `Object.assign({}, obj)`

2. `Array.prototype.concat([], arr)`

3. `arr.slice`

## 深拷贝的实现方式

### JSON.parse(JSON.stringify(obj))

缺点：

1. 不能拷贝`函数`和 `undefined`，如果 obj 里面有`函数`和 `undefined`，序列化会导致丢失

2. 如果 obj 里有 `NaN`，`Infinity` 和 `-Infinity`，则序列化的结果会变成 `null`

3. 如果 obj 里面有时间对象，转换过后，时间会变成字符串

4. 如果 obj 有 `RegExp`, `Error`, `Map`, `Set` 等对象，则序列化的结果将只得到空对象

5. `JSON.stringify()` 只能序列化对象的可枚举的自由属性，例如 如果 obj 中的对象是由构造函数生成的，则使用 `JSON.parse(JSON.stringify)`, 会丢弃对象的 `constructor`

6. 如果对象中存在循环引用的情况也无法正确实现深拷贝

### 终极方案手写实现

<<< ./index.js

### lodash 的 cloneDeep 方法

### Chrome 的 v98 以上版本支持 structuredClone 方法

缺点是不能拷贝函数
