---
title: Python Flask中使用Decorator自动填充函数参数
date: 2017-07-13 19:55:00
tags:
- python
- decorator
- flask
---

## 前言
在写python flask的server code时, 有一个很累赘的code就是从request里面把参数取出来, 然后做校验, 比如说有这么一个api:

```python
from flask import request, route

@route('/create_user', methods=['POST'])
def create_user():
    request_args = request.get_json()
    user_name = request_args.get('first_name')
    check_user_name_format(user_name)
    email = request_args.get('email')
    check_email_format(email)
    phone = request_args.get('phone')
    check_phone_format(phone)

    ...

```
这样的code看起来就很累赘, 参数校验本就必不可少, 但是一个业务的code中如果这些都叠在一起就显得很累赘, 写着写着会发现有大量重复的code, 降低了可读性和可维护性

所以如果说有一个方式能够将request中传过来的参数转换成如下的形式, 势必结构会清晰很多.

```python
from flask import request, route

@route('/create_user', methods=['POST'])
def create_user(user_name, email, phone):
    check_user_name_format(user_name)
    check_email_format(email)
    check_phone_format(phone)

    ...

```

这里面就要用到了python的decorator了


## 目录

0. python decorator简介
0. inspect解析函数的参数列表
0. 获取request中所有参数


## python decorator简介

python的decorator比java的注解要简单得很多, 一个简单的decorator就像这样:

```python

def sum(a, b):
    return a + b

print sum(1, 2)  # 3

def add_10(func):
    def f(*args, **kwargs):
        return func(*args, **kwargs) + 10
    return f

@add_10
def sum(a, b):
    return a + b

print sum(1, 2)  # 13

```

其实一个decorator就是封装了当前的这个函数, 稍作封装, 然后返回了一个新函数

```python

def add_10(func):
    print 'the original sum method:', id(func)  # 4490474752
    print func.__name__  # sum
    def f(*args, **kwargs):
        return func(*args, **kwargs) + 10
    print 'the new method inside decorator:', id(f)  # 4490474752
    print f.__name__  # f
    return f


@add_10
def sum(a, b):
    return a + b

print 'id of sum with decorator:', id(sum)  # 4490474752
print sum.__name__  # f
```


所以上面的`add_10`decorator过后的函数已经变成了一个新的函数, 在输出中可以看到`sum`已经不是原来的那个`sum`, 而是在`add_10`中的f

## inspect获取函数的参数列表

inspect是python当中一个比较底层的library, 通过inspect可以窥探到对象的一些内置信息.

对于我们想要实现函数参数自动填充, 那么我们首先就要获得改函数的函数列表, 可以通过`inspect.getargspec`来实现.


```python
import inspect

def sum(a, b, c=10, *hello, **world):
    return a + b + c

print inspect.getargspec(sum)
# ArgSpec(args=['a', 'b', 'c'], varargs='hello', keywords='world', defaults=(10,))
```


args就是函数定义的所需要的参数列表, defaults是提供的默认值列表, 和args还是比较好对应的, 所以实际中我是这么做的:

```python
import inspect

def parse_func_args(func, args):
    f_argspec = inspect.getargspec(func)
    f_all_args = f_argspec.args
    f_optional_args_num = len(f_argspec.defaults or [])
    f_optional_args = set() if not f_optional_args_num else set(
        f_all_args[-f_optional_args_num:])
    f_required_args = set(f_all_args) - f_optional_args
    u_provided_args = set(args.keys())
    if not f_required_args.issubset(u_provided_args):
        raise Exception("Parameters '%s' missing" %
                ', '.join(f_required_args - u_provided_args))
    return {k: args[k] for k in set(f_all_args) & u_provided_args}

def sum(a, b, c=10):
    return a + b + c


print parse_func_args(sum, {'a': 1, 'b': 2})  # {'a': 1, 'b': 2}
print parse_func_args(sum, {'a': 1, 'b': 2, 'c': 3})  # {'a': 1, 'c': 3, 'b': 2}
print parse_func_args(sum, {'a': 1, 'c': 3})  # Exception: Parameters 'b' missing

```

通过`parse_func_args`可以判断request的参数和我们需要的参数是否匹配, 如果不匹配的话就不用往下跑, 如果匹配的话, 实际中只需要把参数作为一个dict往下传即可.

## 获取request中所有参数

在一个flask的request中, 参数主要分为如下几种类型

|type|e.g|position|
|---|---|---|
|url|/user/< user_id >|request.view_args|
|query string|/user?page=1|request.args|
|json body|{'email': 'abc@example.com'}|request.json|
|from body|FormData|request.form|
|file body|FormData|request.files|

所以在验证并且call我们自己的route函数之前, 就需要简单的把上面提到的参数merge起来

```python
from flask import request

def collect_request_args():
    args = dict(request.view_args)
    args.update(request.args.iteritems())
    if request.method in {'POST', 'PUT'}:
        args.update(request.files.to_dict())
        args.update(request.form.to_dict())
        if hasattr(request, 'json'):
            args.update(request.get_json() or {})
    return args
```

## 总结

OK, 基础的code已经都准备好了, 一个完整的例子如下:

```python
import inspect
import functools
from flask import Flask, request, abort

app = Flask('my-app')

def collect_request_args():
    args = dict(request.view_args)
    args.update(request.args.iteritems())
    if request.method in {'POST', 'PUT'}:
        args.update(request.files.to_dict())
        args.update(request.form.to_dict())
        if hasattr(request, 'json'):
            args.update(request.get_json() or {})
    return args


def validate_func_args(func, args):
    f_argspec = inspect.getargspec(func)
    f_all_args = f_argspec.args
    f_optional_args_num = len(f_argspec.defaults or [])
    f_optional_args = set() if not f_optional_args_num else set(
        f_all_args[-f_optional_args_num:])
    f_required_args = set(f_all_args) - f_optional_args
    u_provided_args = set(args.keys())
    if not f_required_args.issubset(u_provided_args):
        abort(400, "Parameters '%s' missing" %
                ', '.join(f_required_args - u_provided_args))
    return {k: args[k] for k in set(f_all_args) & u_provided_args}


def auto_fill_args(func):
    @functools.wraps(func)
    def f():
        args = collect_request_args()
        validate_func_args(func, args)
        return func(**args)
    return f


@app.route('/user/<int:user_id>', methods=['GET'])
@auto_fill_args
def get_user_id(user_id):
    return 'user_id is %d' % user_id


@app.route('/user/create', methods=['POST'])
@auto_fill_args
def create_user(user_name, email, phone):
    return 'user_info is %s, %s, %s' % (user_name, email, phone)

app.debug = True
app.run()
```

当然这里有一个问题的是, 中间使用了`functools.wraps`作为decorator的实现. 这个就作为之专门介绍decorator的一个讲解吧.


## 参考
0. [pyton inspect library](https://docs.python.org/2/library/inspect.html)

