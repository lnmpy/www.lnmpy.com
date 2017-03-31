---
title:  清除Kindle Lirary
categories: blog
date: 2013-12-09
---

## Mark it!!

网上搜了下，出来的基本上是都是[js书签版本](1)，而且支持IE。。。我就懒得折腾下那个IE了，直接开Chrome的开发工具台(右键`审核元素`，进入`控制台`即可)。再粘贴以下内。

当然和那个脚本一样，一次只能删一页，搞完再自己刷新吧。等有空再弄一个插件吧。思路是嵌入脚本利用localStorage来记录刷新次数。

    jQuery('tr[asin]').each(function(i,e){
        console.log(jQuery(e).attr('asin'));
        jQuery.post('https://www.amazon.com/gp/digital/fiona/du/fiona-delete.html',
    {'contentName':jQuery(e).attr('asin'),'loanId':'','sid':'你的sid','isAjax':1,'category':'kindle_pdoc','orderID':'undefined'});
    })

## 相关资料
 1. [Zhihu](http://www.zhihu.com/question/20246215)
