---
title:  Textual UML
categories: blog
date: 2014-01-11
---


## 闲扯
code reading是门技术活，比必须理解别人的"语无伦次"，别人的"方言"，别人的"头脑发热"。好的程序员就像好的作家一样，那代码看起来，如行云流水，完全没有那种骂娘的念头，因为你看了觉得他有脑子。（这里顺便mark一下，中科院的[COS](http://zh.wikipedia.org/wiki/%E4%B8%AD%E5%9B%BD%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F)，国耻啊，切记）。

<!-- more -->

但不管是好的代码，坏的代码，总有你需要整理的地方，整理一下便于理清思路。画流程图，是个很好的手段，只是可惜了，制作那些看着很舒服的类图，时序图是多么的繁琐。你要我用鼠标一个一个去拖那些UML还不如要了我的命呢。

继续坚持我的原则：可以懒，但必须懒得有个性。

作为一个合格的程序员来看，全手工的去画图是不合理的。懒得花时间去折腾那玩意，画图，呵呵，代码来画岂不是最合适不过的。

<small>
 顺便说下TEX的诞生:
 TEX的诞生，就是为了解决书籍排版的无奈的。想想，当你要更改其中一个页码，然后要一个一个地去修改页码，调整布局，加引用，调整公式图表等等，这个会让人疯的。。应该有不少人在完成各种论文的时候，都是采用这种蛮力法。Tex的诞生可谓提高了一部分生产力，其区别就像在用牛耕地的原始社会中突然出现了一辆现代化的农用机车。(不过，学习这种机车可不是那么一般人能够简单摸索出来的，Tex的难度更甚于此)
</small>

也就是说，要找一个DSL的语言来生成UML图吗([顺便扯下，UML是不是DSL呢](http://stackoverflow.com/questions/10518286/is-uml-a-domain-specific-language-dsl))？

找了半天，有这么个网站可以比较好的介绍当前有那些UML工具，[textual版本的UML工具](http://modeling-languages.com/uml-tools/#textual)，当然他也有很多其他的图形化工具。（网站有段时间打不开，翻了墙也打不开，为了确保在你看到这个文章的时候也可以用）

## 各种Textual UML工具
### [yUml](yuml.me)
由yuml.me提供，免费的http接口可以使用，结合[yuml](https://github.com/wandernauta/yuml)命令行工具，可以很快的在vim下面编写完。语法最为简单，功能倒也不弱。学习曲线相当的低呀，语法直接看官网的几个demo就搞定了。

优点：
1.学习曲线低
2.基本功能都有
3.图形话做得不错
4.支持多种格式导出
缺点：
1.免费的只提供线上接口，商业版收费
2.功能太少了点，图片不支持自定义
3.不能识别现有代码，需要自己重新编写DSL。只能小范围的用用

**Demo:**

    [Customer]<>-orders*>[Order]
    [Order]++-0..*>[LineItem]
    [Order]-[note:Aggregate root.]

<img src="http://yuml.me/0b63c209" alt="yuml">


### [UML Graph](http://www.umlgraph.org)
依赖Graphviz，开源力作，不过，是java的阵营。。如果你懂java，想生成个简单的图图框框之类的，速度也是很快的。

优点：
1.学习曲线也低，如果你懂java的话
2.功能比较强大
3.图形话很简洁，不过很geek，一个程序猿要个那么好的图干啥（不是自嘲）
4.支持多种格式导出
缺点：
1.只支持java。同时若要完美的展示，必须现有的javadoc符合一定的格式才行
2.编写起来太麻烦了，需要从一开始就书写符合规范的javadoc才行

**Demo:**

    /*
    * Schema model
    * UML User Guide p. 112
    */

    /**
    * @opt operations
    * @opt attributes
    * @opt types
    * @hidden
    */
    class UMLOptions {}

    /* Define some types we use */
    /** @hidden */
    class Name {}
    /** @hidden */
    class Number {}

    /**
    * @has 1..* Member * Student
    * @composed 1..* Has 1..* Department
    */
    class School {
            Name name;
            String address;
            Number phone;
            void addStudent() {}
            void removeStudent() {}
            void getStudent() {}
            void getAllStudents() {}
            void addDepartment() {}
            void removeDepartment() {}
            void getDepartment() {}
            void getAllDepartments() {}
    }

    /**
    * @has 1..* AssignedTo 1..* Instructor
    * @assoc 1..* - 1..* Course
    * @assoc 0..* - "0..1 chairperson" Instructor
    */
    class Department {
            Name name;
            void addInstructor() {}
            void removeInstructor() {}
            void getInstructor() {}
            void getAllInstructors() {}
    }

    /**
    * @assoc * Attends * Course
    */
    class Student {
            Name name;
            Number studentID;
    }

    class Course {
            Name name;
            Number courseID;
    }

    /**
    * @assoc 1..* Teaches * Course
    */
    class Instructor {
            Name name;
    }

<img src="http://www.umlgraph.org/doc/schema.gif" alt="uml graph">


### [TextUML Toolkit](http://sourceforge.net/apps/mediawiki/textuml/index.php)
与其他的相比，这个倒还提供一个IDE(基于Eclipse)，

优点：
1.学习曲线也低，语法长得像java
2.功能比较强大
3.图片基本可以实时的显示，IDE整合得不错
4.支持多种格式导出
缺点：
1.长得像java，但它不是java。。需要自己从头编写
2.IDE啊，太重量级了吧，尽管你还是跨平台的

    package payment;

    class PaymentMethod
    end;

    class Cheque specializes PaymentMethod
    end;

    class Paypal specializes PaymentMethod
    end;

    class CreditCard specializes PaymentMethod
    end;

    class Visa specializes CreditCard
    end;

    class AmericanExpress specializes CreditCard
    end;

    class Diners specializes CreditCard
    end;

    end.

<img src="http://sourceforge.net/apps/mediawiki/textuml/nfs/project/t/te/textuml/6/6e/Tutorial-generalization.png" alt="TextUML Toolkit">

### [MetaUML](http://metauml.sourceforge.net)
几年没更新了，再加上语法也有点太冗余了，这个与现有的主流语言太迥异了，而且


    Class.A("Point")
        ("+x: int",
            "+y: int") ();

    Class.B("Circle")
        ("radius: int")
        ("+getRadius(): int",
            "+setRadius(r: int):void");

    topToBottom(45)(A, B);

    drawObjects(A, B);

    clink(aggregationUni)(A, B)

<img src="http://metauml.sourceforge.net/old/images/class.png" alt="metauml">

### [MODSL](https://code.google.com/p/modsl)
哇，超级干练的语法，你看看就知道了，用这个来整理下代码是奇快无比的。直接将原来的代码copy过来稍作修改就可以了。看看下面的demo就知道了，相当简练。当然，其功能并不强大，只能称得上一个简单的。而且，好几点没有更新了，功能也一直维持在几个基本的功能。

优点：
1.简练，上手容易。
2.可以作为一个Eclipse插件存在的，操作配置比较简单
缺点：
1.只支持类图和序列图
2.生成的图片
3.由内容编译生成图片略微麻烦了一点。没有直接提供原生的工具

    collaboration diagram Sample {
        Main->Lexer.tokenize();
        Main->Parser.parse();
        Main->GraphLayout.apply();
        GraphLayout->SugiyamaLayout.apply();
        GraphLayout->NodeLabelLayout.apply();
        GraphLayout->EdgeLabelLayout.apply();
        Main->RenderVisitor.apply(graph);
        RenderVisitor->Graph.visit();
    }

<img src="http://modsl.googlecode.com/files/collab_sample.png" alt="modsl">


### [PlantUML](http://plantuml.sourceforge.net/)
功能极其强大，底层基于java。下载了个plant-uml的jar包之后，只用执行

    java -jar plantuml.jar your_plantuml_file

就会生成对应的png文件，速度很快的

优点:
1.功能真的很强大，基本上只有这一个支持像if-else这样的判断分支
2.使用起来也很方便，直接一个jar包就可以搞定了
3.图片的样式看起来听不错的
4.资源支持相当丰富，不管是插件，还是文档还是demo都很多
缺点:
1.语法看着有点纠结，真心是独立的DSL
2.需要安装java的

    @startuml
    (*)  --> "check input"
    If "input is verbose" then
    --> [Yes] "turn on verbosity"
    --> "run command"
    else
    --> "run command"
    Endif
    -->(*)
    @enduml

<img src="http://plantuml.sourceforge.net/imgp/activity_004.png"/>



## 总结
总体感觉，还是plantuml比较好，支持的功能特性最多，非常有助于使用其来好好的整理下代码的结构与流程，很接近原生的`思维导图`，所以个人感觉也可以用来制作思维导图的工具，文本式的生成，比鼠标拖来拖去效率高太多了。
当然，如果有一个特定的工具能够将特定的代码转换成需要的DSL语言就非常美妙了。
