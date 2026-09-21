---
title: Python Basics
description: 面向已经系统学习过 Python、但一段时间未使用的开发者，通过高频语法清单、易错点、Pythonic 写法和编码练习快速恢复 Python 基础与实际编程手感。
date: 2022-09-17
categories:
  - 编程语言
tags:
  - Python
mermaid: false
published: true
toc: true
---

## 如何使用这份清单

这份清单不是 Python 入门教程，而是用于**主动回忆和查缺补漏**。

建议不要从头到尾直接阅读。对于每个知识点，先尝试不看示例写出对应代码，再检查自己是否记对。

本文以 **Python 3.14** 稳定版本为基准。重点仍然是现代 Python 3 中长期稳定、高频使用的语言特性，而不是追逐最新语法。

---

## 最基本的 Python 编码节奏

### 变量、赋值与解包

Python 的变量本质上是名字与对象之间的绑定，不需要声明类型。

```python
name = "Alice"
count = 10
ratio = 0.5
enabled = True
value = None
```

多变量赋值和解包非常常见：

```python
x, y = 10, 20
x, y = y, x

first, second, *rest = [1, 2, 3, 4, 5]
```

需要重新记住单元素 tuple 的写法：

```python
value = (1,)
```

`(1)` 只是整数 `1`。

还要注意链式赋值对于可变对象的影响：

```python
a = b = []

a.append(1)

print(b)  # [1]
```

`a` 和 `b` 指向的是同一个 list。

### 缩进与代码块

Python 使用缩进表示代码块，通常使用 4 个空格。

```python
if score >= 60:
    print("passed")
else:
    print("failed")
```

不要混用 Tab 和空格。

---

## 内置类型

### `None` 和布尔值

`None` 表示没有值。

判断是否为 `None` 时使用 `is`：

```python
if result is None:
    ...
```

而不是：

```python
if result == None:
    ...
```

Python 会将很多对象直接解释为真假。

常见假值包括：

```python
None
False
0
0.0
""
[]
()
{}
set()
```

因此实际代码经常写成：

```python
if not items:
    print("empty")
```

而不是：

```python
if len(items) == 0:
    print("empty")
```

需要特别记住：`and` 和 `or` 返回的不一定是 `bool`，而是其中一个操作数。

```python
name = user_input or "anonymous"
```

如果 `user_input` 是假值，就会得到 `"anonymous"`。

### 数字

高频数字类型：

```python
integer = 42
floating = 3.14
```

常见运算：

```python
a + b
a - b
a * b
a / b     # 真除法
a // b    # 向下取整除法
a % b
a ** b    # 幂
```

例如：

```python
7 / 2   # 3.5
7 // 2  # 3
7 % 2   # 1
```

常用转换：

```python
int("42")
float("3.14")
str(42)
```

### 字符串

字符串是不可变对象。

```python
text = "hello"
```

最需要恢复的是索引和切片：

```python
text[0]
text[-1]

text[1:4]
text[:3]
text[3:]
text[::-1]
```

切片遵循：

```text
[start:stop:step]
```

其中 `stop` 不包含在结果中。

高频字符串方法：

```python
text.strip()
text.lower()
text.upper()

text.startswith("http")
text.endswith(".py")

text.replace("old", "new")

text.split(",")
",".join(items)
```

例如：

```python
line = " Alice,20,CS "

fields = line.strip().split(",")
```

一个容易忘记的细节是：`strip()` 的参数表示要删除的**字符集合**，不是完整子字符串。

```python
"abc.txt".strip(".txt")
```

不要把它理解为“删除 `.txt` 后缀”。

需要删除明确前后缀时，可以使用：

```python
filename.removesuffix(".txt")
url.removeprefix("https://")
```

### f-string

现代 Python 中生成字符串时，优先恢复 f-string。

```python
name = "Alice"
score = 95

message = f"{name} scored {score}"
```

格式控制：

```python
pi = 3.1415926

print(f"{pi:.2f}")  # 3.14
```

调试时还可以写：

```python
count = 42

print(f"{count=}")
```

输出类似：

```text
count=42
```

旧代码中可能看到：

```python
"{} scored {}".format(name, score)
```

以及：

```python
"%s scored %d" % (name, score)
```

它们仍然存在，但恢复基础时优先熟练掌握 f-string。

---

## `list`

创建 list：

```python
numbers = [1, 2, 3]
```

索引与切片：

```python
numbers[0]
numbers[-1]

numbers[1:3]
```

高频修改操作：

```python
numbers.append(4)
numbers.extend([5, 6])
numbers.insert(0, 0)

numbers.remove(3)
value = numbers.pop()
```

判断元素：

```python
if 3 in numbers:
    ...
```

需要重点恢复 `append()` 与 `extend()` 的区别：

```python
items = [1, 2]

items.append([3, 4])
# [1, 2, [3, 4]]

items.extend([5, 6])
# [1, 2, [3, 4], 5, 6]
```

### `sort()` 和 `sorted()`

原地排序：

```python
numbers.sort()
```

返回新 list：

```python
sorted_numbers = sorted(numbers)
```

非常容易忘记：

```python
result = numbers.sort()
```

这里 `result` 是 `None`。

Python 中很多**原地修改容器的方法返回 `None`**。

降序：

```python
numbers.sort(reverse=True)
```

按照字段排序：

```python
users = [
    {"name": "Alice", "age": 22},
    {"name": "Bob", "age": 20},
]

users.sort(key=lambda user: user["age"])
```

---

## `tuple`

tuple 是不可变序列：

```python
point = (10, 20)
```

经常用于解包：

```python
x, y = point
```

函数返回多个值实际上经常就是返回 tuple：

```python
def get_position():
    return 10, 20


x, y = get_position()
```

恢复基础阶段不需要深入研究 tuple 的内部实现。

---

## `dict`

创建：

```python
user = {
    "name": "Alice",
    "age": 20,
}
```

访问：

```python
user["name"]
```

如果 key 不存在，`[]` 会产生 `KeyError`。

允许缺失时使用：

```python
age = user.get("age")
```

也可以提供默认值：

```python
country = user.get("country", "unknown")
```

添加和修改：

```python
user["age"] = 21
user["city"] = "Beijing"
```

删除：

```python
del user["city"]

age = user.pop("age")
```

遍历：

```python
for key in user:
    print(key)

for value in user.values():
    print(value)

for key, value in user.items():
    print(key, value)
```

判断 key：

```python
if "name" in user:
    ...
```

现代 Python 的 `dict` 保留插入顺序，但如果真正需要按照某个字段排序，仍然应该明确使用 `sorted()`。

---

## `set`

set 适合：

- 去重
- 快速成员判断
- 集合运算

创建：

```python
numbers = {1, 2, 3}
```

空 set 必须写成：

```python
numbers = set()
```

因为：

```python
{}
```

创建的是 dict。

高频操作：

```python
numbers.add(4)
numbers.remove(2)
numbers.discard(10)
```

`remove()` 在元素不存在时抛出异常，`discard()` 不会。

集合运算：

```python
a | b  # 并集
a & b  # 交集
a - b  # 差集
a ^ b  # 对称差集
```

成员判断：

```python
if user_id in active_users:
    ...
```

如果只是频繁执行成员查找，通常应该考虑 set，而不是反复在线性 list 中查找。

---

## 可变对象与不可变对象

常见不可变对象：

```python
int
float
bool
str
tuple
frozenset
```

常见可变对象：

```python
list
dict
set
```

理解可变性可以避免大量 Python bug。

例如：

```python
a = [1, 2]
b = a

b.append(3)

print(a)  # [1, 2, 3]
```

如果只需要创建一个浅拷贝：

```python
b = a.copy()
```

或者：

```python
b = a[:]
```

嵌套对象涉及浅拷贝和深拷贝时，可以再查 `copy` 模块。基础恢复阶段只需要知道：

**`=` 不会复制对象。**

---

## 比较与运算符

### `==` 与 `is`

`==` 比较值：

```python
a == b
```

`is` 比较是否为同一个对象：

```python
a is b
```

日常代码最重要的 `is` 用法：

```python
value is None
value is not None
```

不要用 `is` 比较普通整数或字符串的值。

### 链式比较

Python 支持：

```python
if 0 <= score <= 100:
    ...
```

比下面这种写法更自然：

```python
if score >= 0 and score <= 100:
    ...
```

### 成员判断

```python
value in container
value not in container
```

例如：

```python
if extension in {".jpg", ".png", ".webp"}:
    ...
```

### 条件表达式

Python 的三元表达式：

```python
result = "pass" if score >= 60 else "fail"
```

---

## 条件与循环

### `if` / `elif` / `else`

```python
if score >= 90:
    grade = "A"
elif score >= 60:
    grade = "B"
else:
    grade = "C"
```

### `for`

Python 的 `for` 通常直接遍历 iterable：

```python
for item in items:
    print(item)
```

不要下意识写成其他语言常见的索引循环：

```python
for i in range(len(items)):
    print(items[i])
```

除非确实需要索引。

### `range()`

```python
range(stop)
range(start, stop)
range(start, stop, step)
```

例如：

```python
for i in range(5):
    print(i)
```

得到：

```text
0
1
2
3
4
```

`stop` 不包含在范围内。

### `enumerate()`

同时需要索引和值时：

```python
for index, item in enumerate(items):
    print(index, item)
```

需要从 1 开始：

```python
for index, item in enumerate(items, start=1):
    print(index, item)
```

这是非常高频的 Pythonic 写法。

### `zip()`

并行遍历多个 iterable：

```python
names = ["Alice", "Bob"]
scores = [90, 85]

for name, score in zip(names, scores):
    print(name, score)
```

如果输入长度不同，普通 `zip()` 在最短 iterable 用完时停止。

### `break` 和 `continue`

```python
for item in items:
    if item is None:
        continue

    if item == target:
        break
```

### `while`

```python
while condition:
    ...
```

无限循环常写成：

```python
while True:
    ...
```

### 循环的 `else`

Python 的循环可以带 `else`：

```python
for item in items:
    if item == target:
        break
else:
    print("not found")
```

`else` 会在循环**没有被 `break` 中断**时执行。

语法值得认识，但实际代码中如果让逻辑变得难懂，也可以采用更显式的写法。

---

## `match` / `case`

现代 Python 支持结构化模式匹配：

```python
match status:
    case 200:
        message = "OK"
    case 404:
        message = "Not Found"
    case _:
        message = "Unknown"
```

它并不只是传统语言中的 `switch`，还可以进行解构和模式匹配。

例如：

```python
match point:
    case (0, 0):
        print("origin")
    case (x, 0):
        print(f"x={x}")
    case (0, y):
        print(f"y={y}")
    case (x, y):
        print(x, y)
```

恢复基础阶段只需要：

- 能看懂简单 `match` / `case`
- 知道 `_` 表示通配模式
- 不需要系统学习复杂 class pattern、guard 和嵌套模式

---

## 推导式

### list comprehension

普通循环：

```python
squares = []

for x in range(10):
    squares.append(x * x)
```

Python 中通常写成：

```python
squares = [x * x for x in range(10)]
```

带过滤条件：

```python
even_squares = [
    x * x
    for x in range(10)
    if x % 2 == 0
]
```

简单推导式非常 Pythonic。

但如果表达式出现多层逻辑，不要为了“一行代码”强行使用推导式。

### dict / set comprehension

dict：

```python
squares = {
    x: x * x
    for x in range(5)
}
```

set：

```python
unique_lengths = {
    len(word)
    for word in words
}
```

---

## 函数

### 基本函数定义

```python
def add(a, b):
    return a + b
```

没有明确 `return` 时函数返回 `None`：

```python
def print_message():
    print("hello")
```

### 参数传递

普通参数：

```python
def connect(host, port):
    ...
```

位置参数：

```python
connect("localhost", 8080)
```

关键字参数：

```python
connect(host="localhost", port=8080)
```

混合使用：

```python
connect("localhost", port=8080)
```

关键字参数可以显著提高复杂调用的可读性。

### 默认参数

```python
def connect(host="localhost", port=8080):
    ...
```

#### 可变默认参数陷阱

这是必须重新形成肌肉记忆的 Python 陷阱。

不要写：

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

默认参数只在函数定义时求值一次，因此多个调用会共享同一个 list。

应该写成：

```python
def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items
```

### `*args`

接收任意数量的位置参数：

```python
def total(*numbers):
    return sum(numbers)
```

`numbers` 是 tuple。

```python
total(1, 2, 3)
```

### `**kwargs`

接收任意数量的关键字参数：

```python
def print_options(**options):
    for key, value in options.items():
        print(key, value)
```

`options` 是 dict。

### 参数解包

list 或 tuple 解包：

```python
args = ["localhost", 8080]

connect(*args)
```

dict 解包：

```python
options = {
    "host": "localhost",
    "port": 8080,
}

connect(**options)
```

### keyword-only 参数

`*` 后面的参数必须按照关键字传入：

```python
def connect(host, *, timeout=10):
    ...
```

调用：

```python
connect("localhost", timeout=5)
```

这对于 API 可读性非常有用。

### positional-only 参数

`/` 前面的参数只能按照位置传入：

```python
def func(a, b, /):
    ...
```

普通应用代码中使用频率低于 keyword-only 参数。

基础恢复阶段做到“看见 `/` 能理解”即可。

### `lambda`

适合非常短的小函数：

```python
users.sort(key=lambda user: user["age"])
```

复杂逻辑应该直接定义正常函数：

```python
def get_age(user):
    return user["age"]
```

不要为了显得简洁滥用 `lambda`。

---

## 作用域

Python 名字查找可以简单记成：

```text
Local
Enclosing
Global
Built-in
```

也就是常说的 LEGB。

读取全局变量没有问题：

```python
count = 10


def print_count():
    print(count)
```

如果要在函数内部重新绑定全局名字，需要：

```python
count = 0


def increment():
    global count
    count += 1
```

嵌套函数修改外层函数变量时使用：

```python
def outer():
    count = 0

    def inner():
        nonlocal count
        count += 1

    inner()
    return count
```

实际项目中不要大量依赖可变全局状态。

---

## 类型注解

### 基础类型注解

类型注解不会自动在运行时强制检查类型，但可以帮助：

- IDE
- 静态类型检查器
- 阅读和维护代码

```python
def add(a: int, b: int) -> int:
    return a + b
```

容器类型：

```python
names: list[str] = []
scores: dict[str, int] = {}
```

允许多种类型：

```python
def parse(value: str | int) -> int:
    return int(value)
```

允许 `None`：

```python
def find_user(user_id: int) -> dict[str, str] | None:
    ...
```

恢复基础阶段不需要学习复杂泛型、Protocol、ParamSpec、TypeVar 等内容。

---

## iterable、iterator 和 generator

### iterable

可以被 `for` 遍历的对象通常称为 iterable，例如：

```python
list
tuple
str
dict
set
range
```

获取 iterator：

```python
iterator = iter(items)
```

读取下一个元素：

```python
item = next(iterator)
```

元素耗尽后会产生 `StopIteration`。

日常业务代码通常直接使用 `for`，但理解这一层对于生成器和标准库非常重要。

### generator

包含 `yield` 的函数会创建 generator：

```python
def count_up_to(limit):
    current = 1

    while current <= limit:
        yield current
        current += 1
```

使用：

```python
for number in count_up_to(3):
    print(number)
```

generator 会保存执行状态，并按需生成值。

需要特别记住：

**generator 通常只能消费一次。**

```python
numbers = (x * x for x in range(3))

print(list(numbers))
print(list(numbers))
```

第二次通常已经没有元素。

### generator expression

```python
squares = (x * x for x in range(100))
```

与 list comprehension：

```python
squares = [x * x for x in range(100)]
```

区别在于 generator expression 不会一次性创建完整 list。

例如：

```python
total = sum(x * x for x in range(1_000_000))
```

没有必要先构造一个大型 list。

---

## 常用内置函数

下面这些内置函数应该恢复到“看到问题就自然想到”的程度。

### 长度、统计与排序

```python
len(items)

min(numbers)
max(numbers)
sum(numbers)

sorted(items)
reversed(items)
```

### 遍历辅助

```python
range(...)
enumerate(...)
zip(...)
```

### 条件判断

```python
any(values)
all(values)
```

例如：

```python
if any(user.is_admin for user in users):
    ...
```

```python
if all(result.success for result in results):
    ...
```

### 类型转换

```python
int(...)
float(...)
str(...)
bool(...)

list(...)
tuple(...)
dict(...)
set(...)
```

### 类型判断

```python
isinstance(value, int)
```

一般比：

```python
type(value) is int
```

更适合普通类型判断，因为 `isinstance()` 能正确处理继承关系。

### `map()` 和 `filter()`

例如：

```python
numbers = list(map(int, strings))
```

以及：

```python
positive = list(filter(lambda x: x > 0, numbers))
```

在很多情况下，推导式更加直观：

```python
numbers = [int(value) for value in strings]

positive = [x for x in numbers if x > 0]
```

不需要为了“Pythonic”强制避免 `map()` 或 `filter()`，但复杂 `lambda` 往往会降低可读性。

---

## 文件操作

### `with open(...)`

读文本：

```python
with open("data.txt", "r", encoding="utf-8") as file:
    content = file.read()
```

逐行读取：

```python
with open("data.txt", "r", encoding="utf-8") as file:
    for line in file:
        print(line.rstrip())
```

写文件：

```python
with open("output.txt", "w", encoding="utf-8") as file:
    file.write("hello\n")
```

追加：

```python
with open("output.txt", "a", encoding="utf-8") as file:
    file.write("new line\n")
```

使用 `with` 后，即使发生异常，文件也能够被正确关闭。

### `pathlib`

现代 Python 中处理路径时，`pathlib` 通常比手工拼字符串更方便。

```python
from pathlib import Path

path = Path("data") / "input.txt"

if path.exists():
    text = path.read_text(encoding="utf-8")
```

写入：

```python
path.write_text("hello", encoding="utf-8")
```

遍历目录：

```python
for path in Path(".").iterdir():
    print(path)
```

匹配文件：

```python
for path in Path(".").glob("*.py"):
    print(path)
```

旧代码中仍然会大量遇到：

```python
import os

os.path.join(...)
os.path.exists(...)
```

这些 API 仍然有效，因此需要能看懂，但新代码中可以优先考虑 `pathlib`。

---

## 异常处理

### `try` / `except`

```python
try:
    value = int(text)
except ValueError:
    print("invalid integer")
```

应该尽量捕获具体异常，而不是：

```python
try:
    ...
except:
    ...
```

裸 `except` 会捕获比普通程序错误更多的异常，包括某些用于终止程序的异常。

如果确实需要在边界统一处理普通异常，可以使用：

```python
try:
    ...
except Exception as exc:
    ...
```

但仍然应该明确为什么需要这么做。

### 获取异常对象

```python
try:
    value = int(text)
except ValueError as exc:
    print(exc)
```

### 多种异常

```python
try:
    ...
except (TypeError, ValueError):
    ...
```

也可以分别处理：

```python
try:
    ...
except ValueError:
    ...
except OSError:
    ...
```

### `else`

```python
try:
    value = int(text)
except ValueError:
    print("invalid")
else:
    process(value)
```

`else` 只在 `try` 中没有发生异常时运行。

它可以避免把实际上不希望捕获的代码放进过大的 `try` 区域。

### `finally`

```python
try:
    ...
finally:
    cleanup()
```

无论是否发生异常都会执行。

对于文件、锁等资源，优先考虑 context manager，而不是手工依赖 `finally`。

### 主动抛出异常

```python
if age < 0:
    raise ValueError("age must be non-negative")
```

重新抛出当前异常：

```python
try:
    ...
except ValueError:
    log_error()
    raise
```

### 异常链

转换异常时：

```python
try:
    load_config()
except OSError as exc:
    raise RuntimeError("failed to load config") from exc
```

这样可以保留原始错误原因。

---

## Context Manager

最熟悉的例子是：

```python
with open("data.txt", encoding="utf-8") as file:
    ...
```

`with` 不只用于文件，也经常用于：

- 锁
- 数据库事务
- 临时资源
- 网络连接
- 测试辅助对象

基础恢复阶段只需要熟练**使用** context manager。

自己实现 `__enter__()` / `__exit__()` 可以暂时放到后面。

---

## 模块与导入

### `import`

```python
import math

print(math.sqrt(16))
```

导入指定名字：

```python
from pathlib import Path
```

别名：

```python
import numpy as np
```

避免：

```python
from module import *
```

它会污染当前命名空间，也让名字来源变得不明确。

### `__name__ == "__main__"`

```python
def main():
    print("hello")


if __name__ == "__main__":
    main()
```

当文件直接运行时：

```python
__name__ == "__main__"
```

当文件被其他模块导入时，`__name__` 是模块名。

因此实际脚本经常使用这种结构，避免 import 时自动执行程序入口逻辑。

### package

一个简单项目可能是：

```text
project/
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── utils.py
└── tests/
```

普通 package 中经常包含 `__init__.py`。

Python 还支持 namespace package，但基础恢复阶段暂时不需要深入。

相对导入、复杂包布局和发布 package 可以等到实际项目需要时再系统复习。

---

## 类

### 基本类定义

```python
class User:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"Hello, {self.name}"
```

实例化：

```python
user = User("Alice", 20)

print(user.name)
print(user.greet())
```

实例方法第一个参数通常命名为 `self`。

### 类属性与实例属性

类属性：

```python
class User:
    species = "human"
```

实例属性：

```python
class User:
    def __init__(self, name):
        self.name = name
```

特别注意不要无意中把可变对象定义为共享类属性：

```python
class Team:
    members = []
```

这样所有实例可能共享同一个 list。

通常应该写成：

```python
class Team:
    def __init__(self):
        self.members = []
```

### 继承与 `super()`

```python
class Employee(User):
    def __init__(self, name, age, company):
        super().__init__(name, age)
        self.company = company
```

基础恢复阶段掌握：

- 单继承
- 方法覆盖
- `super()`

即可。

多继承、MRO、metaclass 等内容暂时跳过。

### 常见特殊方法

建议至少认识：

```python
__init__
__repr__
__str__
__len__
__iter__
__eq__
```

例如：

```python
class User:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"User(name={self.name!r})"
```

不需要一次性记住所有 `__dunder__` 方法。

### `dataclass`

对于主要用来保存数据的简单类，可以使用：

```python
from dataclasses import dataclass


@dataclass
class User:
    name: str
    age: int
```

它可以自动生成常见方法，例如初始化和对象表示。

基础阶段只需要知道它适合简单的数据对象即可。

---

## 高频标准库

Python 标准库很大，恢复基础时没有必要逐个模块学习。

### 第一优先级

#### `pathlib`

路径和文件系统：

```python
from pathlib import Path
```

#### `json`

```python
import json

data = json.loads(text)
text = json.dumps(data)
```

文件：

```python
with open("data.json", encoding="utf-8") as file:
    data = json.load(file)
```

#### `collections`

高频结构：

```python
from collections import Counter
from collections import defaultdict
from collections import deque
```

计数：

```python
counts = Counter(words)
```

默认值 dict：

```python
groups = defaultdict(list)

for key, value in pairs:
    groups[key].append(value)
```

队列：

```python
queue = deque()

queue.append(item)
item = queue.popleft()
```

需要频繁从左端删除元素时，不要使用：

```python
list.pop(0)
```

优先考虑 `deque`。

#### `datetime`

```python
from datetime import datetime

now = datetime.now()
```

需要日期时间处理时再进一步查具体 API。

#### `sys`

常见用途：

```python
import sys

sys.argv
sys.path
sys.version
```

#### `os`

即使路径操作逐渐倾向 `pathlib`，实际代码仍然经常使用：

```python
import os

os.environ
os.getcwd()
```

### 第二优先级

#### `re`

正则表达式：

```python
import re
```

不要试图重新背完整正则语法，需要时查文档。

#### `itertools`

处理 iterator 的组合工具。

常见：

```python
from itertools import chain
```

基础恢复阶段只需要知道这个模块存在。

#### `functools`

常见：

```python
from functools import lru_cache
```

例如：

```python
from functools import lru_cache


@lru_cache
def fib(n):
    if n < 2:
        return n

    return fib(n - 1) + fib(n - 2)
```

#### `math`

```python
import math

math.sqrt(...)
math.ceil(...)
math.floor(...)
```

#### `statistics`

```python
import statistics

statistics.mean(values)
```

#### `random`

```python
import random

random.randint(1, 10)
random.choice(items)
```

不要把普通 `random` 用于安全敏感的随机数或 token。

#### `csv`

读写 CSV 文件时优先使用标准库，而不是手工 `split(",")` 解析复杂 CSV。

#### `argparse`

编写简单 CLI：

```python
import argparse
```

需要做命令行程序时再详细恢复。

#### `logging`

正式程序通常应该使用：

```python
import logging
```

而不是到处依赖 `print()` 记录运行信息。

### 基础阶段暂时跳过

暂时不需要系统学习：

```text
asyncio
multiprocessing
threading
concurrent.futures
subprocess 的复杂用法
socket
inspect
ast
importlib
contextvars
weakref
```

它们不是不重要，而是不属于最短路径的 Python 基础。

---

## Pythonic 高频写法

### 直接遍历元素

优先：

```python
for item in items:
    ...
```

确实需要索引：

```python
for index, item in enumerate(items):
    ...
```

### 同时遍历多个序列

```python
for name, score in zip(names, scores):
    ...
```

### 使用解包

```python
x, y = point
```

交换：

```python
a, b = b, a
```

### 判断空容器

```python
if not items:
    ...
```

### 判断 `None`

```python
if value is None:
    ...
```

### 使用 `in`

不要：

```python
if value == "A" or value == "B" or value == "C":
    ...
```

优先：

```python
if value in {"A", "B", "C"}:
    ...
```

### 使用 `dict.get()`

如果缺失 key 是正常情况：

```python
value = config.get("timeout", 10)
```

而不是先判断：

```python
if "timeout" in config:
    value = config["timeout"]
else:
    value = 10
```

### 字符串拼接使用 `join()`

不要在大量字符串上反复：

```python
result += value
```

需要拼接 iterable 时通常写：

```python
result = ",".join(values)
```

### 使用 context manager 管理资源

```python
with open(...) as file:
    ...
```

而不是依赖手动：

```python
file = open(...)
...
file.close()
```

### 排序使用 `key`

```python
users.sort(key=lambda user: user.age)
```

不要为了排序手工写复杂比较逻辑。

---

## 最容易忘记或写错的 Python 行为

### 可变默认参数

错误：

```python
def func(items=[]):
    ...
```

常规安全写法：

```python
def func(items=None):
    if items is None:
        items = []
```

### `sort()` 返回 `None`

```python
items.sort()
```

不要：

```python
items = items.sort()
```

### `append()` 和 `extend()` 不同

```python
items.append([1, 2])
items.extend([1, 2])
```

行为完全不同。

### `is` 不是值比较

```python
a == b
```

与：

```python
a is b
```

含义不同。

### `=` 不复制对象

```python
b = a
```

只是建立另一个名字绑定。

### list comprehension 的变量作用域

现代 Python 中，推导式内部的循环变量不会泄漏到外部作用域。

```python
values = [x * x for x in range(5)]
```

不要依赖 Python 2 时代的行为。

### 不要一边遍历容器一边随意修改它

例如删除元素时：

```python
for item in items:
    if should_remove(item):
        items.remove(item)
```

容易造成意料之外的遍历行为。

更清晰的写法往往是创建新 list：

```python
items = [
    item
    for item in items
    if not should_remove(item)
]
```

### 浮点数不能假定完全精确

```python
0.1 + 0.2 == 0.3
```

结果可能不是你直觉中的 `True`。

数值比较时可根据场景考虑：

```python
import math

math.isclose(a, b)
```

金融等精确十进制场景应进一步了解 `decimal`，但基础恢复阶段不需要展开。

---

## PEP 8 需要恢复的核心规则

不需要背诵完整 PEP 8，但下面这些应该重新形成习惯。

### 缩进

使用 4 个空格。

### 命名

变量和函数：

```python
user_name
calculate_total()
```

类：

```python
UserManager
```

常量通常：

```python
MAX_RETRIES = 3
```

### import

通常放在文件顶部。

优先：

```python
import os
import sys
```

避免：

```python
import os, sys
```

一般按照：

```text
标准库
第三方库
项目内部模块
```

分组。

### 空格

```python
x = a + b
```

而不是：

```python
x=a+b
```

函数调用：

```python
func(a, b)
```

而不是：

```python
func( a, b )
```

### `None`

使用：

```python
value is None
```

不要：

```python
value == None
```

### 布尔值

如果变量本身已经是布尔值：

```python
if enabled:
    ...
```

通常不需要：

```python
if enabled == True:
    ...
```

### 行长度

PEP 8 对代码通常建议最大 79 个字符。

实际项目可能使用自动格式化工具并采用不同限制，因此进入现有项目时应优先遵循项目已有规范。

### 可读性优先

Python 允许很多紧凑写法，但 Pythonic 并不等于“代码越短越好”。

例如一个复杂推导式：

```python
result = [
    transform(x)
    for group in groups
    for x in group
    if condition(x)
]
```

如果读起来已经困难，就应该拆成正常循环。

---

## 虚拟环境与 `pip`

### 每个项目创建独立虚拟环境

推荐在项目目录创建 `.venv`。

Linux / macOS：

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows：

```text
py -m venv .venv
.venv\Scripts\activate
```

退出：

```bash
deactivate
```

通常不要把 `.venv` 提交到 Git。

```text
.venv/
```

应加入 `.gitignore`。

### 使用 `python -m pip`

检查：

```bash
python -m pip --version
```

安装：

```bash
python -m pip install requests
```

升级：

```bash
python -m pip install --upgrade requests
```

卸载：

```bash
python -m pip uninstall requests
```

查看：

```bash
python -m pip list
```

使用 `python -m pip` 的好处是能更明确地使用当前 Python interpreter 对应的 pip。

### `requirements.txt`

安装：

```bash
python -m pip install -r requirements.txt
```

示例：

```text
requests==2.32.5
numpy==2.3.3
```

当前环境快照：

```bash
python -m pip freeze
```

保存：

```bash
python -m pip freeze > requirements.txt
```

需要理解：

`pip freeze` 输出的是**当前环境中已经安装的完整版本快照**，不等价于“经过设计的最小直接依赖列表”。

### `pyproject.toml`

现代 Python 项目通常会遇到 `pyproject.toml`。

例如：

```toml
[project]
name = "example"
version = "0.1.0"
dependencies = [
    "requests>=2",
]
```

基础阶段只需要理解：

- `pyproject.toml` 是现代 Python 项目的重要配置文件。
- `[project]` 可以声明项目元数据和运行依赖。
- `[build-system]` 用于声明构建系统。
- 各种工具也可以在 `[tool.*]` 中保存自己的配置。

暂时不需要深入研究 wheel、sdist、build backend、PyPI 发布流程。