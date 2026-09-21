---
title: C++ Type Traits
description: 从编译期值和类型信息出发，理解 Type Traits 如何查询、变换和选择类型，并进一步掌握 constexpr、if constexpr、Type Tag 与 Tag Dispatch 背后的编译期选择思想。
date: 2022-06-19
categories:
  - 泛型编程
tags:
  - CPP
mermaid: false
published: true
toc: true
---

## 前置知识：编译期到底知道什么

前面学习 Template 时，我们已经接触过一个重要事实：

```cpp
template<typename T>
struct Box {
};
```

当程序写出：

```cpp
Box<int> box;
```

编译器在编译阶段已经知道 Template Argument 是 `int`。

类似地：

```cpp
template<int N>
struct Buffer {
    char data[N];
};
```

对于 `Buffer<16>`，编译器在编译阶段已经知道 `N = 16`。

因此 Template 能够处理两类非常重要的编译期信息：

- 类型，例如 `int`、`double`、`int*`
- 编译期值，例如 `16`、`true`、`false`

这一阶段要解决的问题，就是如何进一步利用这些信息。

例如，如果编译器已经知道 `T`，我们自然会想问：

- `T` 是不是整数？
- `T` 是不是指针？
- `T` 和另一个类型是不是同一个类型？
- 如果 `T` 是 reference，能不能得到去掉 reference 后的类型？
- 如果某个编译期条件成立，能不能选择类型 `A`，否则选择类型 `B`？
- 如果 `T` 是指针，能不能选择一种实现，否则选择另一种实现？

这些问题共同构成了 Type Traits 和 Compile-time Programming 的基础。

本文示例主要按照 C++17 理解，因为后面会使用 `if constexpr` 和 `std::is_integral_v` 这类 C++17 写法。

## constexpr：先理解什么叫编译期值

在进入 Type Traits 之前，先需要明确什么是“编译期计算”。

`constexpr` 与 constant expression（常量表达式）密切相关，可以让变量或函数参与编译期常量求值。

最简单的是 `constexpr` 变量：

```cpp
constexpr int size = 16;

int buffer[size];
```

这里 `size` 的值必须能够在编译阶段确定。

编译器因此可以在需要编译期常量的地方使用它。

### constexpr 函数不代表每次都在编译期运行

函数也可以声明为 `constexpr`：

```cpp
constexpr int square(int x) {
    return x * x;
}
```

现在可以：

```cpp
constexpr int a = square(4);
```

这里 `a` 必须是编译期常量，因此 `square(4)` 需要参与常量求值。

但是：

```cpp
int x;
std::cin >> x;

int b = square(x);
```

这里 `x` 的值要到运行时才知道，因此 `square(x)` 可以作为普通函数调用在运行时求值。

所以不要把 `constexpr int square(int x);` 理解成：

> 这个函数一定在编译期运行。

更准确的理解是：

<mark>`constexpr` 函数允许在满足 constant evaluation 要求时参与编译期求值，但也可以用于普通运行时调用。</mark>

如果需要确认某个表达式确实能够成为编译期常量，可以使用 `static_assert`（编译期断言）：

```cpp
static_assert(square(4) == 16);
```

如果条件无法在编译阶段得到满足，程序就无法通过编译。

这为后面理解 Type Traits 很重要，因为 Type Trait 的查询结果通常就是编译期常量。

## Type Trait 是什么

Type Trait（类型特征）是一种通过 Template 在编译阶段查询或变换类型信息的工具。

例如 `std::is_integral<int>::value` 得到 `true`，而 `std::is_integral<double>::value` 得到 `false`。

这里没有创建 `int` 或 `double` 对象，也没有在运行时调用类型检查函数。

编译器已经知道这些类型，因此可以在编译阶段得到结果。

从使用目的来看，当前阶段可以把 Type Trait 分成三类：

| 类型 | 解决的问题 | 示例 |
| --- | --- | --- |
| 类型查询 | `T` 具有某种性质吗？ | `std::is_pointer<T>` |
| 类型变换 | 从 `T` 得到另一个类型 | `std::remove_reference<T>` |
| 类型选择 | 根据编译期条件选择类型 | `std::conditional<B, T, F>` |

理解这三个方向，比单独背每一个 `<type_traits>` API 更重要。

## std::integral_constant：把一个编译期值包装成类型

理解标准 Type Traits 的关键之一是 `std::integral_constant`。

它的基本形式是：

```cpp
template<class T, T Value>
struct integral_constant;
```

它做的事情可以先简单理解为：

> 把一个类型为 `T`、值为 `Value` 的编译期常量包装进一个类型中。

例如：

```cpp
using Four = std::integral_constant<int, 4>;

static_assert(Four::value == 4);
```

`Four` 是一个类型，但这个类型内部同时携带了编译期值 `4`。

于是我们拥有：

- 一个类型：`Four`
- 一个编译期值：`Four::value`

这件事看起来有些绕，但它解决了一个重要问题：

<mark>Template 擅长处理类型，因此把编译期值包装成类型后，这个值就可以自然参与 Template Specialization、Overloading 和 Dispatch。</mark>

很多用于查询类型性质的布尔 Type Trait，会以 `std::integral_constant` 这样的形式暴露编译期结果。

而 `std::remove_reference`、`std::remove_cv` 这类 Transformation Trait（类型变换 Trait）主要通过成员类型 `type` 提供结果，不应该简单理解为“所有 Type Trait 都继承自 `integral_constant`”。

### std::true_type 与 std::false_type

布尔值是 Type Traits 中最常见的查询结果，因此标准库提供了 `std::true_type` 和 `std::false_type` 两个常用类型。

它们本质上分别对应 `std::integral_constant<bool, true>` 和 `std::integral_constant<bool, false>`。

因此 `std::true_type::value` 是编译期的 `true`，而 `std::false_type::value` 是编译期的 `false`。

从 C++17 开始，还可以使用 `std::bool_constant<true>` 和 `std::bool_constant<false>`。`std::bool_constant<B>` 本质上也是基于 `std::integral_constant<bool, B>` 的别名。

这一阶段真正需要理解的是：

> `true` 和 `false` 不仅可以作为编译期值存在，还可以通过 `std::true_type` 和 `std::false_type` 表示为两个不同的类型。

后面的 Tag Dispatch 会直接利用这一点。

## 查询类型：is_same、is_integral、is_pointer 等

最容易理解的一类 Type Trait 是“询问一个关于类型的问题”。

### std::is_same

`std::is_same<T, U>` 判断两个类型是否完全相同。

例如：

```cpp
#include <type_traits>

static_assert(std::is_same<int, int>::value);
static_assert(!std::is_same<int, double>::value);
static_assert(!std::is_same<int, const int>::value);
static_assert(!std::is_same<int, int&>::value);
```

`std::is_same` 比较的是类型本身，因此 cv qualifier 和 reference 都会影响结果。

从 C++17 开始，可以使用更简洁的 `_v` 形式：

```cpp
static_assert(std::is_same_v<int, int>);
static_assert(!std::is_same_v<int, double>);
```

这里 `std::is_same_v<T, U>` 相当于更方便地访问 `std::is_same<T, U>::value`。

后文会主要使用 `_v` 形式。

### std::is_integral 与 std::is_floating_point

`std::is_integral<T>` 判断 `T` 是否属于整数类型。

例如：

```cpp
static_assert(std::is_integral_v<int>);
static_assert(std::is_integral_v<unsigned long>);
static_assert(std::is_integral_v<const int>);
static_assert(!std::is_integral_v<double>);
```

这里的 integral type 不只是 `int`，还包括 `bool`、字符类型以及各种有符号和无符号整数类型。

`std::is_floating_point<T>` 判断浮点类型：

```cpp
static_assert(std::is_floating_point_v<float>);
static_assert(std::is_floating_point_v<double>);
static_assert(std::is_floating_point_v<long double>);
static_assert(!std::is_floating_point_v<int>);
```

### std::is_pointer

`std::is_pointer<T>` 判断 `T` 是否是 pointer type：

```cpp
static_assert(std::is_pointer_v<int*>);
static_assert(std::is_pointer_v<const int*>);
static_assert(!std::is_pointer_v<int>);
static_assert(!std::is_pointer_v<int&>);
```

需要注意，它检查的是传给 Trait 的类型本身。

`int*` 是 pointer type，而 `int&` 是 reference type，两者不会因为都能间接访问对象就被视为同一类。

### std::is_reference

`std::is_reference<T>` 判断类型是不是 reference：

```cpp
static_assert(std::is_reference_v<int&>);
static_assert(std::is_reference_v<int&&>);
static_assert(!std::is_reference_v<int>);
static_assert(!std::is_reference_v<int*>);
```

它同时把 lvalue reference 和 rvalue reference 归入 reference。

### 查询型 Trait 为什么通常都有 value

`std::is_integral<T>`、`std::is_pointer<T>` 等不是返回 `bool` 的普通函数。

它们本身是类型。例如 `std::is_integral<int>` 是一个 Class Template specialization。

这类布尔查询 Trait 通常以 `std::integral_constant` 的形式暴露结果，因此可以通过 `::value` 得到编译期布尔值。

这就是为什么存在 `std::is_integral<T>::value` 以及 C++17 中更简洁的 `std::is_integral_v<T>` 两种常见写法。

## Type Trait 与 Template Specialization 的关系

Type Trait 并不是与前面学习的 Template Specialization 完全无关的一套东西。

很多 Trait 的基本思想都可以通过 Template Specialization 表达。

例如，可以自己写一个简化的 `is_same`：

```cpp
template<typename T, typename U>
struct MyIsSame : std::false_type {
};

template<typename T>
struct MyIsSame<T, T> : std::true_type {
};
```

对于 `MyIsSame<int, double>`，Primary Template 被选中，因此继承 `std::false_type`。

对于 `MyIsSame<int, int>`，Partial Specialization `MyIsSame<T, T>` 更匹配，因此继承 `std::true_type`。

于是：

```cpp
static_assert(!MyIsSame<int, double>::value);
static_assert(MyIsSame<int, int>::value);
```

这里把前面学习的知识连接起来了：

> Template Specialization 根据类型模式选择定义，而 Type Trait 可以利用这种能力，把类型之间的关系转换成编译期结果。

标准库的实际实现可以使用实现提供的其他机制，但这个简化例子足以说明 Trait 背后的基本思想。

## 类型变换：从一个类型得到另一个类型

Type Trait 不只能回答 `true` 或 `false`。

另一类 Trait 的作用是：

> 输入一个类型，得到另一个类型。

这类工具通常通过成员类型 `type` 提供结果。

## std::remove_reference

`std::remove_reference<T>` 去掉 `T` 最外层的 reference。

例如：

```cpp
using A = std::remove_reference<int&>::type;
using B = std::remove_reference<int&&>::type;
using C = std::remove_reference<int>::type;

static_assert(std::is_same_v<A, int>);
static_assert(std::is_same_v<B, int>);
static_assert(std::is_same_v<C, int>);
```

从 C++14 开始，可以使用 `_t` 形式：

```cpp
using A = std::remove_reference_t<int&>;
```

所以需要认识 `<type_traits>` 中两个很常见的命名习惯：

- `_v`：直接取得 Trait 的 `value`
- `_t`：直接取得 Trait 的 `type`

例如 `std::is_pointer_v<T>` 和 `std::remove_reference_t<T>` 分别是 `::value` 和 `::type` 的便利写法。

### remove_reference 背后的实现思想

可以写一个简化版本：

```cpp
template<typename T>
struct MyRemoveReference {
    using type = T;
};

template<typename T>
struct MyRemoveReference<T&> {
    using type = T;
};

template<typename T>
struct MyRemoveReference<T&&> {
    using type = T;
};
```

对于普通类型使用 Primary Template，而 `T&` 和 `T&&` 分别使用对应的 Partial Specialization。

因此 `MyRemoveReference<int&>::type` 得到 `int`。

这再次说明：

<mark>很多 Type Trait 本质上是在利用 Template Specialization，把类型模式匹配封装成可复用的编译期工具。</mark>

## std::remove_cv

前一阶段已经接触过 cv qualifier，也就是 `const` 和 `volatile`。

`std::remove_cv<T>` 会移除类型最外层的 cv qualifier。

例如：

```cpp
using A = std::remove_cv_t<const int>;
using B = std::remove_cv_t<const volatile int>;

static_assert(std::is_same_v<A, int>);
static_assert(std::is_same_v<B, int>);
```

需要特别注意“最外层”。

对于 `const int*`，`const` 修饰的是被指向的 `int`，而不是 pointer 本身。

因此：

```cpp
using T = std::remove_cv_t<const int*>;

static_assert(std::is_same_v<T, const int*>);
```

类型不会变成 `int*`。

但如果：

```cpp
using T = std::remove_cv_t<int* const>;

static_assert(std::is_same_v<T, int*>);
```

这里 `const` 修饰 pointer 本身，因此会被移除。

### remove_reference 与 remove_cv 经常组合

假设类型是 `const int&`。

如果希望获得基础的 `int`，可以先去掉 reference，再去掉 cv：

```cpp
using T = const int&;

using NoRef = std::remove_reference_t<T>;
using Base = std::remove_cv_t<NoRef>;

static_assert(std::is_same_v<Base, int>);
```

C++20 提供了 `std::remove_cvref` 一步完成这件事，但它不是本阶段的核心内容，知道存在即可。

## std::conditional：根据编译期条件选择类型

前面的 Trait 要么查询类型，要么变换类型。

`std::conditional` 解决另一个问题：

> 已经有一个编译期布尔条件，应该选择类型 `T` 还是类型 `F`？

基本形式是 `std::conditional<Condition, TrueType, FalseType>`。

当 `Condition` 为 `true` 时，成员类型 `type` 是 `TrueType`；否则是 `FalseType`。

例如：

```cpp
using A = std::conditional_t<true, int, double>;
using B = std::conditional_t<false, int, double>;

static_assert(std::is_same_v<A, int>);
static_assert(std::is_same_v<B, double>);
```

可以把它理解成“类型层面的条件选择”。

普通条件表达式在值之间选择，而 `std::conditional_t` 在类型之间选择。

例如，可以根据类型性质选择一个结果类型：

```cpp
template<typename T>
using NumericResult = std::conditional_t<
    std::is_integral_v<T>,
    long long,
    double
>;

static_assert(std::is_same_v<NumericResult<int>, long long>);
static_assert(std::is_same_v<NumericResult<double>, double>);
```

这个例子只用于说明“编译期条件决定类型选择”。

它没有表示所有整数运算都应该使用 `long long`，也没有表示所有其他类型都应该使用 `double`。真正的工程代码仍然需要根据具体语义决定应该选择什么类型。

`std::conditional` 的基本实现思想同样可以通过 Template Specialization 表达：

```cpp
template<bool Condition, typename TrueType, typename FalseType>
struct MyConditional {
    using type = TrueType;
};

template<typename TrueType, typename FalseType>
struct MyConditional<false, TrueType, FalseType> {
    using type = FalseType;
};
```

Primary Template 处理 `true`，针对 `false` 的 specialization 提供另一种结果。

因此 `std::conditional` 又一次把 Specialization 封装成了更方便使用的标准工具。

## 从 Type Trait 到 Compile-time Programming

现在已经有了几种能力。

可以通过 `std::is_integral_v<T>` 查询类型，可以通过 `std::remove_reference_t<T>` 变换类型，也可以通过 `std::conditional_t<Condition, A, B>` 根据条件选择类型。

这些操作都不需要等到程序运行。

编译器在实例化 Template 时就已经能够确定结果。

这就是 Compile-time Programming（编译期编程）的基本思想：

> 利用编译器已经知道的类型和常量，在编译阶段完成计算、类型选择或者实现选择。

过去很多编译期程序需要依靠 Template Specialization 和递归来完成，也就是通常所说的 Template Metaprogramming。

现代 C++ 提供了 `constexpr` 和 `if constexpr` 等机制，使大量编译期逻辑可以写得更接近普通 C++。

这一阶段不展开复杂 Template Metaprogramming，只关注如何根据类型信息做编译期选择。

## if constexpr：根据编译期条件选择代码路径

普通 `if` 表达的是运行时根据条件决定执行路径。

C++17 引入了 `if constexpr`。

它要求条件能够转换为编译期可确定的布尔值，并允许模板针对不同实例化选择不同的代码分支。

例如：

```cpp
template<typename T>
void inspect(T value) {
    if constexpr (std::is_pointer_v<T>) {
        // T 是 pointer 时选择这个分支
    } else {
        // T 不是 pointer 时选择这个分支
    }
}
```

如果调用：

```cpp
inspect(42);
```

此时 `T = int`，编译器知道 `std::is_pointer_v<int>` 是 `false`，因此当前 specialization 选择 `else` 分支。

如果：

```cpp
int value = 42;
inspect(&value);
```

此时 `T = int*`，条件为 `true`，当前 specialization 选择第一个分支。

### if constexpr 与普通 if 的关键区别

考虑：

```cpp
template<typename T>
auto get_value(T value) {
    if constexpr (std::is_pointer_v<T>) {
        return *value;
    } else {
        return value;
    }
}
```

对于 `get_value(42)`，这里 `T = int`。

表达式 `*value` 对 `int` 没有意义。

但是对于 `get_value<int>` 这个 specialization，`if constexpr` 条件为 `false`，第一个分支成为 **discarded statement（被丢弃的语句）**。

由于其中的 `*value` 依赖 Template Parameter `T`，这个被丢弃的分支不会针对当前 `T = int` 的 specialization 进行实例化，因此不会因为 `*value` 对 `int` 无效而报错。

如果换成普通 `if`：

```cpp
template<typename T>
auto get_value(T value) {
    if (std::is_pointer_v<T>) {
        return *value;
    } else {
        return value;
    }
}
```

即使 `std::is_pointer_v<T>` 的值实际上能够在编译阶段确定，这仍然是普通 `if`。

实例化 `get_value<int>` 时，`*value` 仍然需要形成有效的模板实例化代码，因此会失败。

这正是 `if constexpr` 对 Generic Programming 很重要的原因：

<mark>它能够让不同 Template Specialization 丢弃不适用于自身的 dependent 分支，从而为不同类型保留不同的有效实现。</mark>

不过，不能把 `if constexpr` 理解成“未选择的分支完全不存在”。

代码仍然需要被正常解析，而且与 Template Parameter 无关、无论任何 specialization 都必然非法的代码，不能简单依靠未选择的 `if constexpr` 分支隐藏。

## Type Tag：用类型表示编译期类别

现在换一个思路。

假设已经知道 `std::is_integral_v<T>` 可以判断 `T` 是不是整数类型。

除了直接使用 `if constexpr`，还可以把编译期类别编码成一个类型，再让 Function Overloading 根据这个类型选择实现。

例如：

```cpp
struct IntegralTag {
};

struct FloatingTag {
};
```

这样的类型可以作为 Type Tag（类型标签）。

它们通常不需要保存实际运行时数据。

这里真正重要的是：

> `IntegralTag` 和 `FloatingTag` 是两个不同的类型，因此可以参与 Overload Resolution。

例如：

- `IntegralTag` 表示整数路径
- `FloatingTag` 表示浮点路径

这种思想和 `std::true_type` / `std::false_type` 很接近。

它们都是利用不同类型表示不同编译期信息。

## Tag Dispatch：把类型信息转换成 Overload 选择

Dispatch（分派）指根据某些信息决定应该使用哪个实现。

Tag Dispatch（标签分派）就是：

> 先根据编译期信息得到一个 Type Tag，再利用 Function Overloading 选择对应实现。

例如：

```cpp
struct IntegralTag {
};

struct FloatingTag {
};

template<typename T>
void process_impl(T value, IntegralTag) {
    // 整数实现
}

template<typename T>
void process_impl(T value, FloatingTag) {
    // 浮点实现
}
```

现在需要根据 `T` 得到对应的 Tag。

可以利用前面学习的 `std::conditional`：

```cpp
template<typename T>
using NumberTag = std::conditional_t<
    std::is_integral_v<T>,
    IntegralTag,
    FloatingTag
>;
```

然后写公共入口：

```cpp
template<typename T>
void process(T value) {
    static_assert(
        std::is_integral_v<T> || std::is_floating_point_v<T>,
        "process() only supports numeric types"
    );

    process_impl(value, NumberTag<T>{});
}
```

调用：

```cpp
process(42);
process(3.14);
```

对于 `process(42)`：

1. Template Argument Deduction 得到 `T = int`。
2. `std::is_integral_v<int>` 是 `true`。
3. `NumberTag<int>` 得到 `IntegralTag`。
4. 创建 `IntegralTag{}`。
5. Overload Resolution 选择接受 `IntegralTag` 的 `process_impl()`。

对于 `double`，则得到 `FloatingTag`，从而选择另一个 overload。

这里不需要在运行时判断“类型是不是整数”。

类型在编译阶段已经确定，因此 Tag 的类型和最终 overload 也能够在编译阶段确定。

这就是 Tag Dispatch。

### Tag 本身通常没有运行时数据

`IntegralTag{}` 看起来创建了一个对象，但关键并不在于对象中保存什么数据，而在于它的类型是 `IntegralTag`。

`IntegralTag` 和 `FloatingTag` 是两个不同的类型，因此 Overload Resolution 可以据此选择不同实现。

所以 Type Tag 的核心价值是：

<mark>把编译期信息编码成类型，再利用 Template 和 Overloading 机制完成实现选择。</mark>

标准库中的 Iterator Category Tag 也是这种思想的经典应用，但这里不展开 Iterator 系统本身。

## true_type 和 false_type 本身也可以作为 Tag

既然 `std::true_type` 和 `std::false_type` 是两个不同类型，它们自然可以直接参与 Tag Dispatch。

例如：

```cpp
template<typename T>
void process_impl(T value, std::true_type) {
    // integral type
}

template<typename T>
void process_impl(T value, std::false_type) {
    // non-integral type
}
```

公共入口可以把查询结果变成对应的 bool tag：

```cpp
template<typename T>
void process(T value) {
    using Tag = std::bool_constant<std::is_integral_v<T>>;
    process_impl(value, Tag{});
}
```

如果 `T` 是 `int`，`Tag` 就是 `std::true_type`。

如果 `T` 是 `double`，`Tag` 就是 `std::false_type`。

这解释了为什么 `std::integral_constant` 不只是“把值放进一个 class 里”。

它让编译期值同时具有类型身份，因此能够参与 Template 和 Overloading。

## if constexpr 与 Tag Dispatch 有什么区别

假设仍然需要根据整数和浮点类型选择不同实现。

使用 Tag Dispatch：

```cpp
template<typename T>
void process_impl(T value, IntegralTag) {
    // integral path
}

template<typename T>
void process_impl(T value, FloatingTag) {
    // floating-point path
}

template<typename T>
void process(T value) {
    process_impl(value, NumberTag<T>{});
}
```

使用 `if constexpr` 可以直接写：

```cpp
template<typename T>
void process(T value) {
    if constexpr (std::is_integral_v<T>) {
        // integral path
    } else if constexpr (std::is_floating_point_v<T>) {
        // floating-point path
    }
}
```

两者背后的共同思想相同：

> 类型在编译阶段已经确定，因此可以根据类型性质选择不同实现。

区别主要在表达方式。

`if constexpr` 把不同路径放在同一个函数中，对于局部且简单的分支通常更加直接。

Tag Dispatch 则把不同路径拆成不同 overload。当不同实现本身比较独立，或者希望直接利用 Overload Resolution 组织实现时，这种形式仍然很有价值。

Tag Dispatch 在 C++17 的 `if constexpr` 出现之前尤其常见，但它并没有因此失去意义。

不要把两者看成完全不同的技术。它们都可以用于实现 Compile-time Dispatch。

## Compile-time Dispatch 是更大的共同思想

Compile-time Dispatch（编译期分派）并不是某一个单独的 C++ 关键字。

它描述的是一种更广泛的思想：

> 根据编译阶段已经知道的信息，在编译阶段决定最终使用哪个类型或哪份实现。

到这一阶段为止，我们实际上已经见过多种 Compile-time Dispatch。

### Template Specialization

例如：

```cpp
template<typename T>
struct Handler {
    // general
};

template<typename T>
struct Handler<T*> {
    // pointer
};
```

编译器根据 Template Argument 选择 Primary Template 或 Partial Specialization。

### std::conditional

例如 `std::conditional_t<Condition, TypeA, TypeB>` 会根据编译期布尔值选择类型。

### Tag Dispatch

编译器根据 Type Tag，通过 Overload Resolution 选择函数实现。

### if constexpr

编译器根据 constant expression，为当前 Template Specialization 选择分支，并丢弃不适用于当前实例化的分支。

这些机制语法不同，但思路是一致的。

## 把 Type Traits 和 Compile-time Programming 串起来

现在可以完整理解这一阶段真正的主线。

假设有一个 Template：

```cpp
template<typename T>
void process(T value);
```

Template Argument Deduction 首先告诉编译器：

> `T` 到底是什么类型。

有了 `T` 后，Type Traits 可以通过 `std::is_integral_v<T>`、`std::is_pointer_v<T>`、`std::is_reference_v<T>` 等查询它的性质。

这些结果都是编译期值。

如果需要改变类型，可以使用 `std::remove_reference_t<T>`、`std::remove_cv_t<T>` 等 Transformation Trait。

如果需要根据一个编译期条件选择类型，可以使用 `std::conditional_t<Condition, A, B>`。

如果需要根据类型性质选择代码实现，可以使用 `if constexpr`，或者把类型性质编码成 Type Tag，再通过 Tag Dispatch 选择 overload。

所以这些看起来分散的 API，实际上构成了一条连续的编译期处理过程：

1. Template 提供编译期类型信息。
2. Type Trait 查询或者变换这些类型。
3. Trait 产生新的编译期 `value` 或 `type`。
4. `std::conditional`、Template Specialization、Tag Dispatch 或 `if constexpr` 根据这些信息进一步做选择。
5. 编译器最终为当前 Template Arguments 形成对应的类型和实现。

一个典型例子是：

```cpp
template<typename T>
void process(T&& value) {
    using RawT = std::remove_cv_t<
        std::remove_reference_t<T>
    >;

    if constexpr (std::is_integral_v<RawT>) {
        // integral implementation
    } else if constexpr (std::is_floating_point_v<RawT>) {
        // floating-point implementation
    } else if constexpr (std::is_pointer_v<RawT>) {
        // pointer implementation
    } else {
        // other implementation
    }
}
```

这里同时用到了前面阶段和当前阶段的知识：

- `T` 来自 Template Argument Deduction。
- `std::remove_reference_t` 去掉 reference。
- `std::remove_cv_t` 去掉最外层 cv qualifier。
- `std::is_integral_v`、`std::is_floating_point_v`、`std::is_pointer_v` 查询类型性质。
- `if constexpr` 根据这些编译期性质，为当前 specialization 选择合适的实现分支。

看到这种代码时，不需要把每一个 Type Trait 当作孤立的 API。

更重要的分析方式是：

<mark>先确定编译器当前已经知道哪些类型和常量，再看代码如何把这些信息转换成新的 value、type 或 implementation selection。</mark>

这就是 Type Traits 与 Compile-time Programming 之间真正的联系。

## 参考资料

- *C++ Templates: The Complete Guide, 2nd Edition*：重点参考 Compile-Time Programming、Implementing Traits、Overloading on Type Properties，以及 Standard Type Utilities 相关内容。
- cppreference：Type traits。
- cppreference：`std::integral_constant`。
- cppreference：`std::is_same`。
- cppreference：`std::is_integral`、`std::is_floating_point`、`std::is_pointer`、`std::is_reference`。
- cppreference：`std::remove_reference`、`std::remove_cv`。
- cppreference：`std::conditional`。
- cppreference：`constexpr` specifier。
- cppreference：`if constexpr`。
- cppreference：Iterator tags，作为 Tag Dispatch 的标准库实例。