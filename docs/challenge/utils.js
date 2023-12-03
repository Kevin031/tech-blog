/**
 * 小数相加
 */
function floatAdd(a, b) {
  const getFloatLength = (num) => {
    try {
      return num.toString().split(".")[1].length;
    } catch {
      return 0;
    }
  };
  let m = Math.max(getFloatLength(a), getFloatLength(b)) * 10;
  if (m === 0) return a + b;
  return (a * m + b * m) / m;
}

/**
 * 数组去重
 */
function arraySet(target) {
  return target.filter((num, index) => {
    return target.indexOf(num) === index;
  });
}

/**
 * 数组拍扁
 */
function arrayFlat(target) {
  return target.reduce((a, b) => {
    return a.concat(Array.isArray(b) ? arrayFlat(b) : b);
  }, []);
}

/**
 * 手写reduce
 */
function arrayReduce(arr, handler, initialVal) {
  let result = initialVal;
  for (let i = 0; i < arr.length; i++) {
    result = handler(result, arr[i]);
  }
  return result;
}

/**
 * 快速排序
 */
function arraySort(target) {
  let result = [...target];
  function sort(arr, start, end) {
    // 记录中心轴的数字
    const base = arr[start];
    let left = start;
    let right = end;
    while (left < right) {
      // 先移动右指针
      while (arr[right] >= base && left < right) {
        right--;
      }
      // 到这一步说明右指针数字小于中心轴，此时右指针空置
      arr[left] = arr[right];
      // 开始移动左指针
      while (arr[left] < base && left < right) {
        left++;
      }
      // 到这一步说明左指针数字大于中心轴，此时左指针空置
      arr[right] = arr[left];
      // continue // 进入下一轮循环
    }
    // 循环结束是left===right
    arr[left] = base;
    return left; // 返回此时的指针位置
  }
  function quickSort(arr, start, end) {
    if (start < end) {
      const mid = sort(arr, start, end);
      // 对左边排一次
      quickSort(arr, 0, mid);
      // 对右边排一次
      quickSort(arr, mid + 1, end);
    }
  }
  quickSort(result, 0, result.length - 1);
  return result;
}

/**
 * 数字千分位分割
 * @param {*} price
 */
function priceFormat(price) {
  if (typeof price !== "number") {
    price = Number(price);
  }
  return price
    .toString()
    .split("")
    .reverse()
    .map((item, idx) => {
      if (idx > 0 && idx % 3 === 0) {
        return item + ",";
      } else {
        return item;
      }
    })
    .reverse()
    .join("");
}

/**
 * 下划线转驼峰
 * @param {string} str
 */
function camelCase(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (char === "_") {
      let nextChar = str[i + 1].toUpperCase();
      result += nextChar;
      i++;
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 颜色hex转rgb
 */
function hexToRgb(str) {
  let reg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  if (!reg.test(str)) {
    throw new Error("无效的颜色值" + str);
  }
  let color = str.toLowerCase();
  if (color.length === 4) {
    let standardColor = "#";
    for (let i = 1; i < color.length; i++) {
      standardColor += color[i] + color[i];
    }
    color = standardColor;
  }
  const colorChange = [];
  for (let i = 1; i < color.length; i += 2) {
    let hex = color.slice(i, i + 2);
    let num = parseInt("0x" + hex);
    colorChange.push(num);
  }
  return `rgb(${colorChange[0]}, ${colorChange[1]}, ${colorChange[2]})`;
}

/**
 * 获取url参数
 */
function getQueryString(url) {
  let query = url.split("?")[1];
  if (!query) return {};

  let result = {};
  let blocks = query.split("&");
  for (let i = 0; i < blocks.length; i++) {
    let [key, value] = blocks[i].split("=");
    result[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return result;
}

/**
 * 防抖
 */
function debounced(fn, wait = 1000, immediate) {
  let timer = null;
  let callNow = false;
  return function (...args) {
    const context = this;

    if (timer) {
      clearTimeout(timer);
    }

    if (immediate) {
      callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      callNow && fn.call(context, ...args);
    } else {
      timer = setTimeout(() => {
        fn.call(context, ...args);
      }, wait);
    }
  };
}

/**
 * 节流
 */
function throttled(fn, wait = 1000) {
  let timer = null;
  return function (...args) {
    const context = this;
    if (timer) {
      return;
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        fn.call(context, ...args);
      }, wait);
    }
  };
}

function instanceOf(left, right) {
  let proto = Object.getPrototypeOf(left);
  let prototype = right.prototype;
  while (true) {
    if (!proto) return false; // 追溯到根
    if (proto === prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
}

function promiseSyncList(list, max = 1) {
  let index = 1;

  function runTask(i) {
    let task = list[i];
    task().then(() => {
      index++;
      if (index < list.length) {
        // 后list.length - max条采用队列的方式
        runTask(task);
      }
    });
  }

  function start() {
    for (let i = 0; i < max; i++) {
      // 前max条并发
      runTask(i);
    }
  }
  start();
}

function curry(fn, ...args) {
  args = args || [];
  let context = this;
  return function (...currentArgs) {
    if (currentArgs.length) {
      args = args.concat(currentArgs);
      return curry.call(context, fn, ...args);
    } else {
      return fn.call(context, ...args);
    }
  };
}

/**
 * React
 * @param {*} root
 */
function createFiberRoot(root) {
  function createFiberNode(node) {
    return {
      type: node.tag,
      props: {
        ...(node.props || {}),
        children: node.children,
      },
      child: null,
      parent: null,
      sibling: null,
    };
  }
  function reconcilerChildren(wipFiber, elements) {
    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
      let element = elements[index];
      let newFiber = {
        ...createFiberNode(element),
        parent: wipFiber,
      };
      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element) {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
      index++;
    }
  }
  function reconcile(fiber) {
    if (!fiber.dom) {
      // fiber.dom = createDom(fiber)
    }
    reconcilerChildren(fiber, fiber.props.children);
    return fiber;
  }
  // function performUnitWork() {}
  const fiber = createFiberNode(root);
  // constperformUnitWork();
  return reconcile(fiber);
}

module.exports = {
  floatAdd,
  arraySet,
  arrayFlat,
  arrayReduce,
  arraySort,
  priceFormat,
  camelCase,
  hexToRgb,
  getQueryString,
  debounced,
  throttled,
  instanceOf,
  curry,
  createFiberRoot,
};
