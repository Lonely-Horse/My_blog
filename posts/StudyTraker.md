# study-traker助手项目介绍

## 一.项目背景

对于这个学习助手会被我写出来的原因，最主要的还是因为我需要一个项目用于练习我的`skill`开发能力,以及如何更好的使用`json`格式来完成和`LLM`之间的对话交流，加上我觉得写一个无头服务也挺好的，还练习了我的net/http库语法的熟悉程度，最终我决定写好一个学习助手skill,热爱后使用`dify`来完成测试，这算是我第一次尝试开发skill的尝试吧

## 二.结构设计

### 1.核心的技术栈
`net/http` `encoding/json` `os`

* **net/http**: 该库用于完成网页拉起和接口建立
* **encoding/json**: 解析json数据文件和写入json标准的文件
* **os**: 打开json文件，完成数据的流入进程序

### 2.功能设计
```text
                [用户]  --输入相关数据-->  [LLM]
                                           |
                    根据OpenAPi协议的接口内容，整理成符合要求的log日志josn
                                           |
                                           v
                                      [vaildate]
                                           |
                                  完成数据字段的评判和审核
                                           |
                                           v
                                    [HandlerPostlog]
                                           |
                            直接写入主目录下data/studylog.json文件
```

## 三.使用方法

1.源代码位置
该项目可以直接在我的博客中下载，然后如果你想要先看源码和项目详情的话，可以点击[`Study-Traker`](https://github.com/Lonely-Horse/Study_Traker)查看

2.使用方法
我们可以直接使用源码编译出对应的二进制文件，当然这一切的前提是设备具有go语言的开发环境，也可以使用`docker`来完成直接的服务挂载，我是写好了dockerfile和docker-compose了的，但是你需要根据你的实际情况进行修改，因为我的这个skill默认是依附于dify平台的，所以我使用的`networks`是dify的默认网络，如果你不进行修改的话，是无法完成代码的运行的，详情可见[`Study-Traker`](https://github.com/Lonely-Horse/Study_Traker)

## 四.项目回顾和总结

这个项目作为一个刚入门skill开发的项目来说，其实只要是写下来了，都算是比较不错了，但是这个项目的功能性其实是比较一般的，对于我的实际帮助也其实算是比较少了，只能说作为练手项目很不错，特别是对于josn字段的理解和接口共用，使用switch来评定get或者post方法，再分流到不同的函数，这样的方式，我觉得是一个不错的接口共用的解决办法，以及如何正确的拉起一个网络接口服务