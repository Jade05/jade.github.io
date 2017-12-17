## Win7: VirtualBox虚拟机安装Ubuntu详细教程 & Ubuntu下如何安装最新Node.js&npm包

### Part One: VirtualBox虚拟机安装Ubuntu详细教程
此部分可参考此文[VirtualBox虚拟机安装Ubuntu详细教程](http://www.xuzefeng.com/post/84.html)

### Part Two: Ubuntu下如何安装最新的Node.js&npm包
在Ubuntu Terminal中通过apt-get install可快速安装Node.js。安装好后，node -V 发现Node.js版本竟然是v4.2.6，虽然有点诧异，但是想着可以升级，也可通过版本管理器安装多个Node.js，就没多想，就继续安装npm，但是当Node.js和npm都安装好后，使用npm命令却报如下错误：
```
ERROR: npm is known not to run on Node.js v4.2.6 Node.js 4 is supported but the specific version you're running has a bug known to break npm.
```
问题很明朗，就是Node.js版本太低，那之前想通过npm安装Node.js版本管理器，再通过Node.js版本管理安装多个版本的Node.js的方法是行不通了。二话不说先卸载。

卸载 nodejs & npm
```
sudo apt remove nodejs npm
```
尝试第二种方法：wget获取指定版本的Node.js进行安装
```
sudo wget -qO- https://deb.nodesource.com/setup_8.x | sudo bash
```
出现Permission denied错误(如下图)。

image01.png

看错误是apt-get update获取最新软件包的时候，需要操作 /var/cache/apt/lists下的文件但是没有权限导致失败。通过chmod修改文件权限即可。
```
sudo chmod -R 777 /var/lib/apt/lists/
```
修改权限后再执行
```
sudo wget -qO- https://deb.nodesource.com/setup_8.x | sudo bash
```
即可获取到Node.js版本包，通过install安装
```
sudo apt-get install nodejs
```
命令行提示错误如下：

image02.png

gnutls_handshake() failed: Error in the pull function.但最后提示我们：maybe run apt-get update or try with --fix-missing.通过apt-update即可解决。
```
sudo apt-get update
```


另外，我还尝试过通过编译Node.js源码包安装。
```
# wget http://nodejs.org/dist/v9.3.0/node-v8.9.3.tar.gz
# tar xvf node-v8.9.3.tar.gz
# cd node-v8.9.3.tar.gz
# ./configure
# make
# make install
```
