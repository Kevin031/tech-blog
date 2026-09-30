---
tags:
  - cms-import-ready
---

# 实现一个拼手气抢红包的算法

<<< ./index.js

金额在内部统一换算为整数分；每次领取都会为剩余人数至少预留一分钱，最后一人领取全部剩余金额。`openRedPackge` 保留为旧拼写的兼容方法，新代码使用 `openRedPackage`。
