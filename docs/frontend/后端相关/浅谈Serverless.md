# 浅谈 Serverless 和 DDD

## Serverless

### 🌟 是什么

Serverless 直译为“无服务器”，但是容易被误解，并不是说代码运行就不需要在服务器上跑了。

它的意思是，未来的开发，**无需关注**服务器这种比较底层的设施，代码将会直接跑起来。这些资源将变得不可见。

### 几个缩写

IaaS: 基础设施即服务，比如服务器的购买、搭建，与虚拟化、容器等技术息息相关

PaaS: 平台即服务，比如操作系统、虚拟机，以及在其之上的业务弱相关的基础组件

SaaS: 软件即服务，一般是集中式部署的服务提供者

目前大部分公司业务发展到这个阶段，以下是未来的发展趋势

BaaS: 后端即服务，公司为移动应用开发者整合云后端的边界服务

FaaS: 功能即服务，函数服务化，和 Severless 密切相关，提供了更加细分和抽象的服务化能力

### 一些变化

在这种模式下，很多职业都将产生变化。

运维工程师：被淘汰，只需要操作配置后台，就能获取稳定、安全、便宜的主机

后端开发：需求变小，不再需要复杂的逻辑，只需要关注业务逻辑

前端开发：向全栈发展，利用丰富的前后端模块拼接应用

在时代的浪潮中，个体总是容易被抛弃的，我们毫无疑问已经进入了终身学习的年代

### 未来的程序员

平台开发工程师：搭建云 Severless 平台，保证基础设施的完善

插件功能工程师：按照平台的规则开发相应的功能，享受售卖的提成

业务开发工程师：从海量的功能组件中，寻找积木，搭建产品

借助 AI 的能力，有可能业务开发工程师也会被淘汰，由产品经理直接通过对话式编程生产页面

Serverless 一旦普及，会把大部分工程师带向不归路

但是由于各大厂商并不是共同体，他们会自己定规范，相互竞争和攻击，也有另一个可能性：

天下大势，分久必合，合久必分，大厂的霸道可能会造成众叛亲离，造成一定程度上的技能回归

## DDD

- Domain-Driven Design：领域驱动设计，是一种软件设计方法

- 例如电商网站：

- **领域**：商品、用户、订单，每个方面都有各自的规则和特点

- **模型**：需要建立一个模型，来把这些业务映射成计算机能理解的代码，比如创建表示商品的类或属性

- **战略设计**：在电商业务中可能有很多的子系统，比如商品管理、用户管理，战略设计能帮助我们划分这些子系统，确保他们的独立和协同

- **战术设计**：每个子系统内部需要考虑具体的实现，例如购物车、订单的流转，涉及到具体的业务实现

- **模式**：领域驱动设计引入了通用的设计模式，比如聚合，把商品和他的库存信息、评价信息组合成一个整体，更方便读取、管理和操作。

- **持续演进**：领域驱动设计强调持续的沟通和调整，确保系统能适应变化

- 通过领域驱动设计，我们可以更清晰地理解业务，有针对性地构建如软件系统，从而提高系统的质量和可维护性
