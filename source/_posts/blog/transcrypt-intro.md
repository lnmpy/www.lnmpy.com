---
title: Transcrypt --- Encrypt Git
date: 2016-09-29 16:55:52
tags:
- transcrypt
- git-encrypt
- git
---

## 背景

在代码里面经常会有些敏感信息, 如db的配置, api-key等. 明文将这些信息保存在代码中肯定是不安全的, 如果将其统一/逐个保存在跟code无关的地方中, 也会存在着不安全, 缺乏版本控制及使用麻烦的问题.

最好的方式就是, 将这个文件encrypt, 只有配置了能decrypt的key, 才能解开这些配置信息.

[git-crypt](https://github.com/AGWA/git-crypt)和[Transcrypt](https://github.com/elasticdog/transcrypt)就是用来做这件事情, 前者需要单独编译安装, 后者只是一个独立的python shell脚本. So, 这里选择的就是后者.

其他的特性可以参考其Github README的介绍, 如OpenSSL.

## 下载/安装
```shell
# 从github上下载原文件
wget https://raw.githubusercontent.com/elasticdog/transcrypt/master/transcrypt && chmod +x transcrypt
mv transcrypt /usr/local/bin

# 或者mac下使用Homebrew安装
brew install transcrypt
```

## 配置

### encrypt新的repo

```shell
cd <path-to-your-repo>/
transcrypt

# 可以看到repo encrypt的状态, 包括密码, 还会提示你如何decrypt一个已有的repo
transcrypt --display
```

> 按照提示来, 中间会要求输入你的密码, 这个密码最后也会出现在`.git/config`中, 也就是说只有.git中配置了相关的信息, 才能够正确的decrypt.

执行完之后, 它会创建一个`.gitattributes`文件(如果没有的话), 里面用来指定哪些文件是被encrypt的. pattern匹配文件, 匹配模式和.gitignore一样.

默认内容是:
```
$ cat .gitattributes
#pattern  filter=crypt diff=crypt
```

假设有一个`secret.yml`文件需要被encrypt, 只需要执行, 很简单吧
```
echo 'secret.yml filter=crypt diff=crypt' >> .gitattributes
git add .gitattributes secret.yml

# commit时文件会自动被encrypt
git commit
```

commit后可以执行下面的命令
```
# 列出当前哪些文件被encrypt
transcrypt --list

# 查看文件被decrypt之前的raw data
transcrypt -s secret.yml

# rekey 更换密码同时
transcrypt -r
```

至此, 完整的code repo中的敏感信息就已经完全的保存了

### decrypt已有的repo

如果要decrypt一个repo, 只需要执行下面这句即可
```
cd <path-to-your-repo>/
transcrypt -c aes-256-cbc -p 'your-password'
```



## 原理

### .gitattributes
> 如果你了解`.gitattributes`就可以忽略这段内容, 也可以直接参考https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes

git可以指定自定义的文件属性, 那么这个文件在被执行相应操作时可以执行特定的逻辑
比如:

- `pattern-file diff=func`
  diff=func: 在执行`git diff`时先执行func后在去执行真正的diff, 这个可以用来diff word文档(使用docx2txt转换成txt)
- `pattern-file export-ignore`
  export-ignore: 在执行`git archive`时忽略该文件(夹)

### .git/config
其实他就加下了下面这段配置, 主要是定义了crypt的filter和diff, 这个在`.gitattributes`中被用到
```conf
[filter "crypt"]
    clean = \"$(git rev-parse --show-toplevel)\"/.git/crypt/clean %f
    smudge = \"$(git rev-parse --show-toplevel)\"/.git/crypt/smudge
[diff "crypt"]
    textconv = \"$(git rev-parse --show-toplevel)\"/.git/crypt/textconv
[merge]
	renormalize = true
[alias]
	ls-crypt = "!git ls-files | git check-attr --stdin filter | awk 'BEGIN { FS = \":\" }; /crypt$/{ print $1 }'"
```

## 参考
0. [Transcrypt](https://github.com/elasticdog/transcrypt)
0. [Customizing-Git-Git-Attributes](https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes)
