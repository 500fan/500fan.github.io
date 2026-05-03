---
title: heexo 部署到腾讯云
tags:
  - heexo
  - 腾讯云
abbrlink: a727150d
date: 2021-04-14 16:14:24
author: 目棃
img: /medias/banner/2sticker.png
top: true
cover: true
summary: 把本地Heexo部署到腾讯云服务器
categories: 帮助文档
---


> 目前就是部署完了，就等备案通过了。

<h2>一、部署环境与准备</h2>

<h3> 1.环境</h3>

本地：Windows10操作系统

腾讯云：Cenots7.6服务器

<h3>2.准备</h3>

Hexo 本地博客

Xshell 链接到你的服务器

<h2>二、云服务器配置Git</h2>

<h3>1.安装依赖库</h3>

```shell
yum install curl-devel expat-devel gettext-devel openssl-devel zlib-devel 
```

<h3>2.安装编译工具</h3>

```shell
yum install gcc perl-ExtUtils-MakeMaker package
```

<h3>3.查看git的版本</h3>

```shell
git version
```

<h3>4.删除git</h3>

```shell
yum remove git -y
```

<h3>5.下载解压最新版</h3>

```shell
cd /usr/local/src    #下载的目录
wget https://www.kernel.org/pub/software/scm/git/git-2.31.1.tar.gz    #下载最新版，可以去https://www.kernel.org/pub/software/scm/git/查看最新版本号，后面进行相应修改
tar -zxvf git-2.31.1.tar.gz        #解压到当前文件夹
```

<h3>6.编辑并安装</h3>

```shell
cd git-2.31.1    #进入文件夹
make prefix=/usr/local/git all    #编译源码
make prefix=/usr/local/git install    #安装路径
```

<h3>7.配置git的环境变量</h3>

```shell
echo 'export PATH=$PATH:/usr/local/git/bin' >> /etc/bashrc
```

<h3>8.刷新环境变量</h3>

```shell
source /etc/bashrc
```

<h3>9.查看版本号</h3>

```shell
git --version
```

<h3>10.创建git用户并且修改权限</h3>

```shell
adduser BTMuli #这里的"BTMuli"是用户名
passwd BTMuli #这里的"BTMuli"是用户名
chmod 740 /etc/sudoers
vim /etc/sudoers
# 按"i"进入编辑模式，修改为如下代码：
root    ALL=(ALL)       ALL
BTMuli  ALL=(ALL)       ALL
# 按"Esc"退出编辑，按":wq"保存
```

<h3>11.本地windows10使用Gitbash创建密钥</h3>

```shell
ssh-keygen -t rsa
```

<h3>12.将本地创建id_rsa.pub中文件复制</h3>

```shell
su BTMuli
mkdir ~/.ssh
vim ~/.ssh/authorized_keys
# 按"i"进入编辑模式，把sshkey粘贴进来
# 按"Esc"退出编辑，按":wq"保存
```

<h3>13.本地测试</h3>

```shell
ssh -v BTMuli@服务器ip
```

<h2>三、云服务器网站配置</h2>

<h3>1.创建网站目录并且设置权限</h3>

```sh
su root
mkdir /home/MyBlog
chown BTMuli:BTMuli -R /home/MyBlog
```

<h3>2.安装Nginx</h3>

```sh
yum install -y nginx
systemctl start nginx.service    #启动服务
```

<h3>3.修改Nginx配置文件</h3>

```nginx
vim /etc/nginx/nginx.conf 
# 按"i"进入编辑模式，修改为如下代码：
 38     server {
 39         listen       80 default_server;
 40         listen       [::]:80 default_server;
 41         server_name  btmuli.site;        #域名
 42         root         /home/MyBlog;        #网站目录
```

<h3>4.重启服务器</h3>

```shell
systemctl restart nginx.service
```

<h3>5.建立git仓库</h3>

```shell
su root
cd /home/BTMuli
git init --bare blog.git
chown BTMuli:BTMuli -R blog.git
```

<h3>6.同步网站根目录</h3>

```shell
vim blog.git/hooks/post-receive
# 按"i"进入编辑模式，把sshkey粘贴进来
#!/bin/sh
git --work-tree=/home/MyBlog --git-dir=/home/BTMuli/blog.git checkout -f
```

<h3>7.修改权限</h3>

```shell
chmod +x /home/BTMuli/blog.git/hooks/post-receive
```

<h3>8.在windows10本地heexo目录修改_config.yml文件</h3>

```
deploy:
  type: git
  repository: 
  	- https://github.com/BTMuli/BTMuli.github.io
  	- BTMuli@81.71.129.119:/home/BTMuli/blog.git    #用户名@服务器Ip:git仓库位置
  branch: main
```

<h3>9.在本机gitbash部署</h3>

```
hexo clean
hexo g -d
```

<h2>四、常见报错</h2>

<h3>1. <code>git-upload-pack</code>: 未找到命令</h3>

```
bash: git-upload-pack: command not found
fatal: Could not read from remote repository.
```

解决方法

```
sudo ln -s  /usr/local/git/bin/git-upload-pack  /usr/bin/git-upload-pack
```

<h3> 2.<code>git-receive-pack</code>: 未找到命令</h3>

```
bash: git-receive-pack: command not found
fatal: Could not read from remote repository.
```

解决方法

```
sudo ln -s /usr/local/git/bin/git-receive-pack  /usr/bin/git-receive-pack
```

<h3>3.无法远程连接获取</h3>

```
fatal: Could not read from remote repository.
```

解决方法

```
重试或者 删掉本地ssh公钥重新上传至服务器
```

<h3>4.key出错</h3>

```
Host key verification failed.
```

解决方法

```
ssh-keygen -R 你要访问的IP地址
```

参考文章：

+ [Hexo部署到腾讯云](http://fuchenchenle.cn/2020/08/18/hexo%E9%83%A8%E7%BD%B2%E8%85%BE%E8%AE%AF%E4%BA%91/)