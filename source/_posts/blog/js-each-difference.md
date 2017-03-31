---
title:  JS中some(),every(),forEach(),map(),filter()区别
categories: blog
date: 2013-11-20
---

JS在1.6中为Array新增了几个方法`map()`，`filter()`，`some()`，`every()`，`forEach()`，也就是一共有这么多方法了。

刚开始接触这些倒也记得不是很清楚，在此纪录一下以加深影响。我主要从两个角度来理解和记忆吧，一个是API的使用，一个是内部实现。

####函数简述

`map()`:返回一个新的Array，每个元素为调用func的结果

`filter()`:返回一个符合func条件的元素数组

`some()`:返回一个boolean，判断是否有元素是否符合func条件

`every()`:返回一个boolean，判断每个元素是否符合func条件

`forEach()`:没有返回值，只是针对每个元素调用func

####API的区别

    function my_func(item) {
        if (item == 1) {
            console.log('t');
            return true;
        }
        console.log('f');
        return false;
    }

    // init an array
    l = [0,1,2,3,4]

    // print: f,t,f,f,f
    // return:[false, true, false, false, false]
    l.map(my_func)


    // print: f,t,f,f,f
    // return: 1
    l.filter(my_func)

    // print: f,t
    // return: true
    l.some(my_func)

    // print: f
    // return: false
    l.every(my_func)

    // print: f,t,f,f,f
    //return: undefined
    l.forEach(my_func)


####内部实现

    // From：http://developer.mozilla.org

    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };

    Array.prototype.filter = function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var res = new Array();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
            var val = this[i]; // in case fun mutates this
            if (fun.call(thisp, val, i, this))
                res.push(val);
            }
        }

        return res;
    };

    Array.prototype.some = function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this && fun.call(thisp, this[i], i, this))
            return true;
        }

        return false;
    };

    Array.prototype.every = function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this && !fun.call(thisp, this[i], i, this))
            return false;
        }

        return true;
    };

    Array.prototype.forEach = function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            fun.call(thisp, this[i], i, this);
        }
    };

好吧，已经很晚了，代码基本上能够很好的描述清楚各个函数的区别吧。
