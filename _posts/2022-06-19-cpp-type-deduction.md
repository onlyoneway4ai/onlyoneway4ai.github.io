---
title: C++ Type Deduction
description: 从表达式的 value category 和引用规则出发，串联 Template Argument Deduction、auto、decltype、reference collapsing、forwarding reference、std::move、std::forward 与 perfect forwarding，建立分析现代 C++ 类型推导代码的统一方法。
date: 2022-06-19
categories:
  - 泛型编程
tags:
  - CPP
mermaid: false
published: true
toc: true
---

## 先区分声明类型、表达式类型与 Value Category

理解现代 C++ 类型推导之前，首先要把几个容易混在一起的概念分开。

变量声明可以包含 reference，例如：

```cpp
int x = 10;
int& lref = x;
int&& rref = 20;
```

这里 `x`、`lref`、`rref` 分别具有自己的声明类型。

但是在代码中使用 `x`、`lref` 或 `rref` 时，我们面对的是**表达式**。表达式具有自己的 type，同时还具有独立的 **value category**。

<mark>变量的声明类型与表达式的 value category 是两个不同维度。</mark>

这一点尤其重要：

```cpp
int&& rref = 20;
```

`rref` 的声明类型包含 rvalue reference，但表达式 `rref` 本身是 lvalue。

后面理解 `T&&`、`std::move`、`std::forward` 和 perfect forwarding，都依赖这个区别。

## Value Category 决定表达式如何参与引用绑定

现代 C++ 的基础 value category 有：

- lvalue（Left Value，左值）
- xvalue（eXpiring Value，将亡值）
- prvalue（Pure Rvalue，纯右值）

其中 lvalue 和 xvalue 属于 glvalue（Generalized Left Value，泛左值），xvalue 和 prvalue 属于 rvalue（Right Value，右值）。

当前阶段不需要展开完整的 value category 体系，只需要准确理解这三种与引用和类型推导直接相关的情况。

### lvalue

lvalue 通常表示具有 identity、之后仍然可以通过某种方式找到的对象。

例如：

```cpp
int x = 10;

x = 20;
```

表达式 `x` 是 lvalue。

命名变量是最重要的一类 lvalue。<mark>即使变量声明为 rvalue reference，通过它的名字形成的表达式仍然是 lvalue</mark>：

```cpp
int&& ref = 10;

ref = 20;
```

这里 `ref` 的声明类型包含 `&&`，但表达式 `ref` 是 lvalue。

### prvalue

prvalue 通常用于产生值或者初始化对象。

例如字面量 `42` 和临时对象表达式 `std::string{"hello"}` 都是典型的 prvalue。

如果函数按值返回对象：

```cpp
std::string make_string() {
    return "hello";
}
```

调用表达式 `make_string()` 通常也是 prvalue。

### xvalue

xvalue 是一种 glvalue，因此仍然具有 identity，但表示其资源可以被重用。

最常见的例子是：

```cpp
std::string text = "hello";
std::move(text);
```

表达式 `std::move(text)` 是 xvalue。

日常所说的 rvalue 包括 prvalue 和 xvalue，因此分析现代 C++ 代码时，单纯说“这是右值”有时还不够精确。

几个常见表达式可以整理为：

| 表达式 | Value category |
| --- | --- |
| 命名变量 `x` | lvalue |
| 字面量 `42` | prvalue |
| 临时对象 `Type{}` | prvalue |
| `std::move(x)` | xvalue |
| 命名的 rvalue reference 变量 `ref` | lvalue |

## Reference 决定什么 Value Category 可以绑定

与当前主题最相关的 reference 形式是：

- `T&`：lvalue reference
- `T&&`：rvalue reference

### Lvalue Reference

普通 lvalue reference 可以绑定 lvalue：

```cpp
int x = 10;
int& ref = x;
```

非 `const` lvalue reference 不能直接绑定普通 rvalue：

```cpp
// int& ref = 10;  // error
```

### const Lvalue Reference

`const T&` 可以绑定 lvalue，也可以绑定 rvalue：

```cpp
int x = 10;

const int& a = x;
const int& b = 10;
```

因此只读函数参数经常使用 `const T&`。

### Rvalue Reference

普通 rvalue reference 可以绑定 rvalue：

```cpp
int&& a = 10;

int x = 10;
int&& b = std::move(x);
```

但不能直接绑定普通 lvalue：

```cpp
int x = 10;

// int&& ref = x;  // error
```

这里再次体现了类型和表达式 category 的区别：

```cpp
int&& ref = 10;
```

`ref` 的声明类型包含 rvalue reference，但随后表达式 `ref` 仍然是 lvalue。

## Template Argument Deduction 是类型推导的基础

Function Template 调用时，编译器会根据函数参数形式和调用实参推导 Template Argument。

考虑：

```cpp
template<typename T>
void f(T param);
```

调用 `f(expr)` 时，编译器需要根据 parameter type `T` 和实际 argument `expr` 推导 `T`。

不同的 parameter type 会产生不同的 deduction 结果。

### 按值参数 T

考虑：

```cpp
template<typename T>
void f(T param);
```

调用：

```cpp
int x = 10;
const int cx = 20;
const int& rx = cx;

f(x);
f(cx);
f(rx);
```

三个调用中，`T` 都会被推导为 `int`。

对于这种按值 parameter：

- argument 的 reference 属性不属于最终推导出的 `T`
- top-level `const` 和 `volatile` 会被忽略

因为 `param` 本身是函数内部的新对象。

这里必须区分 top-level `const` 与被指向对象的 `const`：

```cpp
const int value = 10;
const int* ptr = &value;

f(ptr);
```

这里 `T` 是 `const int*`。`const` 修饰的是指针指向的 `int`，不是 `ptr` 对象自身的 top-level qualifier，因此不会被去掉。

### 参数 T&

如果参数是：

```cpp
template<typename T>
void f(T& param);
```

那么实参本身的 cv qualifier 可以成为 `T` 的一部分：

```cpp
int x = 10;
const int cx = 20;

f(x);   // T = int
f(cx);  // T = const int
```

因此第二个调用的最终参数类型是 `const int&`。

### 参数 const T&

如果参数本身已经写成：

```cpp
template<typename T>
void f(const T& param);
```

那么：

```cpp
const int x = 10;
f(x);
```

推导得到 `T = int`，最终 parameter type 是 `const int&`。

<mark>因此分析 Template Argument Deduction 时，不能只看实参类型，还必须先确认 parameter type 的形式。</mark>

## auto 使用与 Template Argument Deduction 相近的规则

普通 `auto` deduction 与 Function Template 的类型推导规则高度相似。

例如：

```cpp
const int x = 10;
const int& ref = x;

auto a = x;
auto b = ref;
```

`a` 和 `b` 都是 `int`。

可以把普通 `auto` 类比为按值模板参数 `T`：reference 和 top-level `const` 不会成为最终的 `auto` 类型。

### auto& 与 const auto&

如果声明是：

```cpp
const int x = 10;

auto& ref = x;
```

则 `ref` 是 `const int&`。

这与 `T&` 形式的 Template Argument Deduction 类似。

`const auto&` 则类似于 `const T&`：

```cpp
int x = 10;

const auto& a = x;
const auto& b = 42;
```

它既能绑定 lvalue，也能绑定 rvalue。

### auto&&

`auto&&` 具有特殊的重要性：

```cpp
int x = 10;

auto&& a = x;
auto&& b = 10;
```

最终：

- `a` 是 `int&`
- `b` 是 `int&&`

这里需要结合后面的 forwarding reference deduction 与 reference collapsing 才能完整解释。

`auto&&` 在这种需要推导 `auto` 的场景中通常是 forwarding reference。

但 brace-enclosed initializer list 是特殊情况：

```cpp
auto&& values = {1, 2, 3};
```

这种情况下不按照普通 forwarding reference 的规则理解。

### Brace Initialization 是 auto 的特殊规则

例如：

```cpp
auto values = {1, 2, 3};
```

`values` 会被推导为 `std::initializer_list<int>`。

但普通 Function Template：

```cpp
template<typename T>
void f(T value);
```

不能仅凭：

```cpp
// f({1, 2, 3});  // 普通 T deduction 无法直接完成
```

得到相同的推导结果。

因此 <mark>brace-enclosed initializer list 的规则不能用来概括普通 `auto` 和 Template Argument Deduction</mark>。

## decltype 同时观察声明类型和 Value Category

`auto` 通常用于根据 initializer 推导一个适合变量声明的类型。

`decltype` 的规则不同。它有两种需要明确区分的情况。

### 未加括号的名字和成员访问

如果 `decltype` 的 operand 是未加括号的 id-expression，或者未加括号的 class member access expression，结果通常直接是所命名 entity 的声明类型。

例如：

```cpp
const int x = 10;
int value = 20;
int& ref = value;

struct Data {
    double number;
};

Data data;
```

那么：

- `decltype(x)` 是 `const int`
- `decltype(ref)` 是 `int&`
- `decltype(data.number)` 是 `double`

这里并不是根据这些表达式的 value category 添加 `&` 或 `&&`，而是使用 `decltype` 对这类语法形式的特殊规则。

### 其他表达式根据 Value Category 决定结果

对于其他表达式，如果表达式本身的 type 是 `T`：

| Value category | `decltype(expression)` |
| --- | --- |
| lvalue | `T&` |
| xvalue | `T&&` |
| prvalue | `T` |

最经典的区别是：

```cpp
int x = 10;

using A = decltype(x);
using B = decltype((x));
```

`A` 是 `int`。

而 `(x)` 不再属于前面那种未加括号 id-expression 的特殊形式，因此按照一般表达式规则处理。表达式 `(x)` 仍然是 lvalue，所以 `B` 是 `int&`。

<mark>`decltype(x)` 与 `decltype((x))` 可能得到不同类型，不是因为括号改变了 `x` 的 value category，而是因为 `decltype` 使用了不同规则。</mark>

同理：

- `decltype(std::move(x))` 是 `int&&`，因为 `std::move(x)` 是 xvalue
- `decltype(42)` 是 `int`，因为 `42` 是 prvalue

## decltype(auto) 使用 decltype 的推导规则

C++14 引入了 `decltype(auto)`。

虽然名字中包含 `auto`，但它并不是普通 `auto` deduction，而是按照 `decltype` 的规则推导声明类型。

例如：

```cpp
int x = 10;

auto a = x;
decltype(auto) b = x;
decltype(auto) c = (x);
```

结果是：

- `a`：`int`
- `b`：`int`
- `c`：`int&`

`c` 使用的是 `decltype((x))` 的规则，因此保留了 lvalue reference。

### 保留函数返回的 Reference

例如：

```cpp
int value = 10;

int& get_value() {
    return value;
}
```

如果包装函数写成：

```cpp
auto wrapper() {
    return get_value();
}
```

普通 `auto` 返回类型 deduction 得到 `int`，reference 不会被保留。

如果写成：

```cpp
decltype(auto) wrapper() {
    return get_value();
}
```

返回类型则是 `int&`。

因此 `decltype(auto)` 适合需要保留返回表达式 reference 属性的场景。

但这也意味着必须更加注意返回表达式本身：

```cpp
decltype(auto) bad() {
    int value = 10;

    // return (value);  // 会推导成 int&，返回后形成悬空引用
}
```

## Reference Collapsing

模板 deduction、`auto` 和 type alias 可能间接形成 reference 与 reference 的组合。

例如，当 `T` 本身被推导为 `int&` 时：

```cpp
T&&
```

在类型替换过程中会形成类似 `int& &&` 的组合。

C++ 使用 **Reference Collapsing** 得到最终 reference type：

| 中间组合 | 最终结果 |
| --- | --- |
| `T& &` | `T&` |
| `T& &&` | `T&` |
| `T&& &` | `T&` |
| `T&& &&` | `T&&` |

可以记住：

<mark>只要组合中出现 lvalue reference `&`，collapse 后就是 `&`；只有两个 `&&` 组合时结果才仍然是 `&&`。</mark>

Reference Collapsing 本身不复杂。

真正关键的问题是：为什么 Template Argument Deduction 有时会让 `T` 本身成为 reference type？

答案就在 Forwarding Reference。

## Forwarding Reference 记录调用者的 Value Category

最典型的 Forwarding Reference 出现在 Function Template 中：

```cpp
template<typename T>
void f(T&& param) {
}
```

这里的 `T&&` 是 forwarding reference，因为满足以下两个要求：

- `T` 是当前函数模板需要从调用中推导的类型参数
- parameter 的形式正好是 cv-unqualified `T&&`

`auto&&` 在需要推导 `auto` 的普通初始化场景中也具有相同性质，但 brace-enclosed initializer list 等情况存在特殊规则。

### 传入 lvalue

```cpp
int x = 10;
f(x);
```

`x` 是 `int` 类型的 lvalue。

对于 forwarding reference，如果传入类型 `U` 的 lvalue，`T` 会被推导为 `U&`。

因此这里：

`T = int&`。

把它代回 `T&&` 后，类型计算得到 `int& &&`，再经过 Reference Collapsing 得到 `int&`。

所以实际 parameter type 是 `int&`。

### 传入 const lvalue

```cpp
const int x = 10;
f(x);
```

这里 `T = const int&`。

代入后得到 `const int& &&`，collapse 后是 `const int&`。

### 传入 rvalue

```cpp
f(10);
```

`10` 是 prvalue。

此时 `T` 推导为 `int`，参数类型直接成为 `int&&`。

因此：

| 实参 | 推导得到的 `T` | `T&&` 替换后 | 最终参数类型 |
| --- | --- | --- | --- |
| `int` lvalue | `int&` | `int& &&` | `int&` |
| `const int` lvalue | `const int&` | `const int& &&` | `const int&` |
| `int` rvalue | `int` | `int&&` | `int&&` |

这套 deduction 规则与 Reference Collapsing 结合，使一个表面写作 `T&&` 的 parameter 同时能够接受 lvalue 和 rvalue。

## 并不是所有 T&& 都是 Forwarding Reference

看到 `&&` 不能直接判断它是 forwarding reference。

普通函数参数：

```cpp
void f(int&& value);
```

没有 Template Argument Deduction，因此只是普通 rvalue reference。

下面也不是 forwarding reference：

```cpp
template<typename T>
void f(const T&& value);
```

因为形式是 `const T&&`，不是 cv-unqualified `T&&`。

再看 Class Template：

```cpp
template<typename T>
struct Wrapper {
    void set(T&& value);
};
```

对于：

```cpp
Wrapper<int> wrapper;
```

类模板参数 `T` 已经确定为 `int`。调用 `set()` 时不会重新根据函数 argument 推导这个 `T`，因此 `set()` 的 parameter 就是普通的 `int&&`。

如果成员函数自己引入新的模板参数：

```cpp
template<typename T>
struct Wrapper {
    template<typename U>
    void set(U&& value) {
    }
};
```

这里 `U` 会在每次 `set()` 调用时重新 deduction，因此 `U&&` 可以成为 forwarding reference。

所以判断 `T&&` 时，最重要的问题不是“有没有 `&&`”，而是：

<mark>这个类型参数是否正在根据当前这次初始化或函数调用进行 deduction，并且形式是否满足 forwarding reference 的要求？</mark>

## std::move 只改变 Value Category

`std::move` 的名字非常容易造成误解。

考虑：

```cpp
std::string source = "hello";
std::string target = std::move(source);
```

`std::move` 本身并不负责把字符串资源从 `source` 搬到 `target`。

其核心行为可以概念化为：

```cpp
static_cast<std::remove_reference_t<T>&&>(object)
```

也就是去除传入类型中的 reference 后，把表达式转换成对应类型的 rvalue reference。

转换结果是 xvalue。

因此 `std::move(source)` 的含义更接近：

> 把 `source` 表达成一个允许其资源被重用的 xvalue。

随后：

```cpp
std::string target = std::move(source);
```

会进行正常的 overload resolution。如果选择了 `std::string` 的 move constructor，真正的资源转移由 move constructor 的实现完成。

<mark>`std::move` 本身不执行 move；它执行的是类型转换。</mark>

### 为什么命名的 Rvalue Reference 仍可能需要 std::move

考虑：

```cpp
void consume(std::string&& value) {
    use(value);
}
```

虽然 `value` 的声明类型包含 `std::string&&`，但表达式 `value` 是 lvalue。

因此 `use(value)` 会把它作为 lvalue 传递。

如果函数明确希望无条件把 `value` 当作可移动对象继续传递，可以写：

```cpp
void consume(std::string&& value) {
    use(std::move(value));
}
```

此时 `std::move(value)` 是 xvalue。

### std::move 不保证最终发生 Move

例如：

```cpp
const std::string source = "hello";
std::string target = std::move(source);
```

`std::move(source)` 会保留 `const`，因此结果类似 `const std::string&&`。

典型 move constructor 接受的是：

```cpp
std::string(std::string&&);
```

它不能绑定 `const std::string&&`。

如果同时存在接受 `const std::string&` 的 copy constructor，overload resolution 通常会选择 copy constructor。

所以：

<mark>`std::move` 只把表达式转换成 xvalue，并不保证最终一定调用 move operation。</mark>

## std::forward 恢复 Forwarding Reference 记录的信息

`std::move` 是无条件地把表达式转换成适合移动的 xvalue。

`std::forward` 的目标不同：

> 调用者传入 lvalue，就继续向下一层传递 lvalue；调用者传入 rvalue，就继续传递 rvalue。

典型代码是：

```cpp
template<typename T>
void wrapper(T&& param) {
    target(std::forward<T>(param));
}
```

这里 `std::forward` 使用之前 deduction 得到的 `T`。

它的核心可以理解为根据 `T` 执行类似 `static_cast<T&&>(param)` 的转换，而最终结果还会受到 Reference Collapsing 的影响。

### 调用者传入 lvalue

```cpp
int x = 10;
wrapper(x);
```

Forwarding Reference deduction 得到 `T = int&`。

因此参数最终是 `int&`。

虽然表达式 `param` 本身仍然是 lvalue，但 `std::forward<int&>(param)` 中的 `T&&` 会形成 `int& &&`，collapse 后仍为 `int&`。

最终传给 `target()` 的仍然是 lvalue。

### 调用者传入 rvalue

```cpp
wrapper(10);
```

此时 `T = int`，parameter type 是 `int&&`。

表达式 `param` 仍然是 lvalue，但是 `std::forward<int>(param)` 会把它转换成 `int&&`，产生 xvalue。

因此下一层函数重新收到 rvalue。

可以整理为：

| 调用者实参 | `T` | Parameter type | 表达式 `param` | `std::forward<T>(param)` |
| --- | --- | --- | --- | --- |
| lvalue | `U&` | `U&` | lvalue | lvalue |
| const lvalue | `const U&` | `const U&` | lvalue | const lvalue |
| rvalue | `U` | `U&&` | lvalue | xvalue |

其中最容易忘记的是：

<mark>不管 parameter 的声明类型最终是 `U&` 还是 `U&&`，通过变量名使用 `param` 时，它都是 lvalue expression。</mark>

## 为什么不能直接传 param，也不能一律 std::move

假设存在两个 overload：

```cpp
#include <iostream>
#include <string>

void consume(const std::string& value) {
    std::cout << "lvalue\n";
}

void consume(std::string&& value) {
    std::cout << "rvalue\n";
}
```

如果 wrapper 直接传 parameter：

```cpp
template<typename T>
void wrapper(T&& param) {
    consume(param);
}
```

那么 `param` 是命名变量，因此始终是 lvalue expression。

即使调用：

```cpp
wrapper(std::string{"hello"});
```

进入 `wrapper()` 后，`consume(param)` 仍然会收到 lvalue。

如果改成：

```cpp
template<typename T>
void wrapper(T&& param) {
    consume(std::move(param));
}
```

又会走向另一个极端。

无论调用者原来传入 lvalue 还是 rvalue，`std::move(param)` 都把它转换成 xvalue。

例如：

```cpp
std::string text = "hello";
wrapper(text);
```

调用者传入的是 lvalue，但 wrapper 可能把 `text` 的资源移动走。

所以三种方式的区别是：

| 写法 | 结果 |
| --- | --- |
| `consume(param)` | 始终把命名 parameter 当作 lvalue |
| `consume(std::move(param))` | 始终转换成 xvalue |
| `consume(std::forward<T>(param))` | 保留调用者原来的 lvalue / rvalue 属性 |

这正是 Perfect Forwarding 需要 `std::forward` 的原因。

## Perfect Forwarding 如何把这些规则串起来

典型的 forwarding wrapper 是：

```cpp
template<typename T>
void wrapper(T&& param) {
    consume(std::forward<T>(param));
}
```

分析下面的调用：

```cpp
std::string text = "hello";
wrapper(text);
```

首先，表达式 `text` 是 lvalue。

因为 parameter 是 forwarding reference，Template Argument Deduction 得到 `T = std::string&`。

代入 `T&&` 后形成 `std::string& &&`，经过 Reference Collapsing 得到 `std::string&`。

因此 `param` 的 parameter type 是 `std::string&`。

进入函数之后，表达式 `param` 本身仍然是 lvalue。

最后 `std::forward<std::string&>(param)` 根据 `T` 恢复为 lvalue，因此下一层函数收到 lvalue。

再看：

```cpp
wrapper(std::string{"hello"});
```

调用 argument 是 prvalue，因此 `T = std::string`。

参数类型成为 `std::string&&`。

进入函数后，表达式 `param` 仍然是 lvalue。

`std::forward<std::string>(param)` 再把这个表达式转换成 xvalue，因此下一层函数收到 rvalue。

Perfect Forwarding 的核心可以概括为：

<mark>Forwarding Reference 通过 Template Argument Deduction 记录调用者传入的是 lvalue 还是 rvalue，std::forward 再利用这个推导结果恢复原来的 value category。</mark>

Perfect Forwarding 并不意味着所有 C++ 表达式都能无条件完美转发。brace-enclosed initializer list、overloaded function name 等场景存在额外限制，这些不属于当前阶段的核心。

## decltype(auto) 可以继续保留返回类型信息

Forwarding Reference 和 `std::forward` 主要解决函数参数如何向下一层传递的问题。

如果 wrapper 还需要把内部函数的返回值继续返回，则可能需要考虑返回类型中的 reference 信息。

例如：

```cpp
int value = 10;

int& get() {
    return value;
}
```

下面的 wrapper：

```cpp
auto call() {
    return get();
}
```

返回类型是 `int`。

如果希望保留 `get()` 返回的 `int&`：

```cpp
decltype(auto) call() {
    return get();
}
```

返回类型就是 `int&`。

因此两套机制解决的问题不同：

- `T&&` 与 `std::forward<T>` 用于保留和恢复调用参数的 value category
- `decltype(auto)` 可以用于保留返回表达式推导出的 reference 信息

## 看到 T&& 时应该怎样一步步分析

面对：

```cpp
template<typename T>
void f(T&& value);
```

不要直接判断“这是 rvalue reference”。

应该按照固定顺序分析。

1. **判断 `T&&` 是否是 Forwarding Reference。** 检查 `T` 是否由当前调用进行 deduction，以及形式是否是满足条件的 cv-unqualified template parameter `T&&`。

2. **判断调用 argument 的 Value Category。** 例如 `x` 是 lvalue，`10` 是 prvalue，`std::move(x)` 是 xvalue。

3. **进行 Template Argument Deduction。** 对 forwarding reference，类型 `U` 的 lvalue 会令 `T` 推导为 `U&`；rvalue 通常令 `T` 推导为 `U`。

4. **把推导出的 `T` 代回 parameter type。** 如果 `T = int&`，则 `T&&` 在类型计算中形成 `int& &&`。

5. **执行 Reference Collapsing。** `int& &&` collapse 成 `int&`。

6. **进入函数后重新分析表达式。** 即使 parameter type 是 `int&&`，命名表达式 `value` 本身仍然是 lvalue。

7. **分析 `std::move` 或 `std::forward`。** `std::move(value)` 无条件把表达式转换成适当类型的 xvalue；`std::forward<T>(value)` 则根据之前推导出的 `T` 保留调用者原来的 lvalue / rvalue 属性。

只要按照这个顺序分析，就不需要凭 `&&` 的表面形式猜最终类型。

## 用一个例子检查完整推导过程

下面的例子把当前阶段最重要的规则集中起来：

```cpp
#include <iostream>
#include <utility>

struct Widget {
};

void use(const Widget&) {
    std::cout << "lvalue\n";
}

void use(Widget&&) {
    std::cout << "rvalue\n";
}

template<typename T>
void relay(T&& value) {
    // value 是命名变量，因此表达式 value 始终是 lvalue。
    // std::forward 根据 deduction 得到的 T 恢复调用者原来的 value category。
    use(std::forward<T>(value));
}

int main() {
    Widget w;
    const Widget cw;

    relay(w);
    // T = Widget&
    // parameter type: Widget& && -> Widget&
    // forward 后仍为 lvalue

    relay(cw);
    // T = const Widget&
    // parameter type: const Widget&
    // forward 后仍为 const lvalue

    relay(Widget{});
    // T = Widget
    // parameter type: Widget&&
    // 命名的 value 是 lvalue
    // forward 后恢复为 xvalue

    relay(std::move(w));
    // std::move(w) 是 xvalue
    // T = Widget
    // parameter type: Widget&&
    // forward 后仍为 xvalue
}
```

分析这类代码时，可以依次确定表达式的 value category，进行 Template Argument Deduction，得到 `T`，代回 parameter type 并执行 Reference Collapsing，再分析命名 parameter 表达式本身的 value category，最后判断 `std::move` 或 `std::forward` 如何影响下一次函数调用。

这条推导过程把 `auto`、`decltype`、`T&&`、Reference Collapsing、`std::move`、`std::forward` 和 Perfect Forwarding 连接成了同一套现代 C++ 类型系统。

## 参考资料

- Scott Meyers, *Effective Modern C++*，重点参考 Type Deduction、`auto`、`decltype`、rvalue reference、`std::move`、`std::forward` 与 perfect forwarding 相关内容。
- cppreference：Value categories。
- cppreference：Reference declaration、Reference collapsing 与 Forwarding references。
- cppreference：Template argument deduction。
- cppreference：Placeholder type specifiers (`auto`)。
- cppreference：`decltype` specifier。
- cppreference：`std::move`。
- cppreference：`std::forward`。