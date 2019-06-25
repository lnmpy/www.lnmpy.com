---
title:  几个活用vim粘贴板的配置命令
categories: blog
date: 2014-04-03
---

追求更高的效率,那么总是会去折腾一些开发工具的快捷操作或者hack了,而其中vim的操作实在是存在各种hack.或许下面的几个你就没有怎么用过:

<!-- more -->

(尽管是搜索运行之类的操作,但不用退出vim,也没有必要动用鼠标,够hack吧)

先温习一下vim的剪贴板：

 1. vim有12个粘贴板,分别是0、1、2、...、9、a、“、＋；用`:reg`命令可以查看各个粘贴板里的内容.
 2. 在vim中简单用`y`只是复制到"（双引号)粘贴板里,同样用`p`粘贴的也是这个粘贴板里的内容.
 3. 在编辑/命令模式下,`Ctrl+R`+`粘贴板id`,就可以粘贴相应的内容

#### 在shell中运行光标所在的行:
**需求：**

在用vim编写shell脚本(哪怕是博客)的过程中,有时候需要运行一两行命令.
很多人可能是用鼠标复制一下,然后再退出或者在vim中加载子shell,再粘贴运行...

在.vimrc中添加(我的leader映射成`,`)：

    nmap <leader>e <ESC>:exec ':!'.getline('.')<CR>

然后,光标移动到那特定的一行,按下`,e`,就可以直接在运行那一行的内容.

Demo:

<img src="/images/blog/vim_hack_01.gif" width="100%">


#### 在vim中运行当前行:
**需求：**
只能运行完整的一行,好像显得很不够灵活呢,有没有可以让我先在visual模式下选中一段内容再运行呢？

在.vimrc中添加(我的leader映射成`,`)：

    vmap <leader>e <ESC>:exec ':!'.<C-R>"

那么在visual模式下选中相应内容,就可以快速执行了,注意使用了系统剪贴板.(这里我没有加回车,这样更方便自己来输入特定的参数了).

Demo:

<img src="/images/blog/vim_hack_02.gif" width="100%">


#### 在vim中visual模式下,搜索选中的内容:
**需求：**
有时候需要搜索一段文字,要么是按下`/`,再老老实实的输入整个的内容,要么又是要动鼠标的节奏了..

在.vimrc中添加(我的leader映射成`,`)：

    vmap // y/<C-R>"<CR>
    vmap <leader>/ y/<C-R>"<CR>

那么在visual模式下选中,就可以快速搜索了.

Demo:

<img src="/images/blog/vim_hack_03.gif" width="100%">


PS:

 1. 截图软件是采用[ttyrec](https://github.com/mjording/ttyrec)和[ttygif](https://github.com/icholy/ttygif)来生成的.
 2. 相应的vim其实也集成到了我的[repo](https://github.com/elvismacak/elvis-repo)中(没有使用bundle)
