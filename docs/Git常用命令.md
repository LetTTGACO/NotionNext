---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2020-03-01 00:00:00'
type: Post
slug: vkdsce
配置类型:
  type: string
  string: 文档
summary: ''
更新时间: '2023-08-26T15:24:00.000Z'
title: Git常用命令
category: 学习笔记
tags:
  - Git
status: Archived
urlname: 51cd7a47-863b-49a3-8064-8797159d298e
updated: '2023-08-26 23:24:00'
---

记录学习一下每天都在使用的 Git 操作命令，以加快工作效率、应对意外情况的发生为目标。


![FlWMWzIX9WE7PW-7eyeq8uaEJ_3p.png](https://image.1874.cool/1874-blog-images/26936a5098a8e3a4adb69aa9f5981f2f.png)


```text
  - Workspace：工作区
  - Index / Stage：暂存区
  - Repository：仓库区（或本地仓库）
  - Remote：远程仓库
```


# git stash


`git stash`的应用场景有以下几种情况，我都遇到过，以往我都是把代码复制出来再改 BUG，今天才发现这么做简直很蠢 QAQ。

- 发现有一个类是多余的，想删掉它又担心以后需要查看它的代码，想保存它但又不想增加一个脏的提交。这时就可以考虑`git stash`。
- 使用 git 的时候，我们往往使用分支（branch）解决任务切换问题，例如，我们往往会建一个自己的分支去修改和调试代码, 如果别人或者自己发现原有的分支上有个不得不修改的 bug，我们往往会把完成一半的代码`commit`提交到本地仓库，然后切换分支去修改 bug，改好之后再切换回来。这样的话往往 log 上会有大量不必要的记录。其实如果我们不想提交完成一半或者不完善的代码，但是却不得不去修改一个紧急 Bug，那么使用`git stash`就可以将你当前未提交到本地（和服务器）的代码推入到 Git 的栈中，这时候你的工作区间和上一次提交的内容是完全一样的，所以你可以放心的修 Bug，等到修完 Bug，提交到服务器上后，再使用`git stash apply`将以前一半的工作应用回来。
- 经常有这样的事情发生，当你正在进行项目中某一部分的工作，里面的东西处于一个比较杂乱的状态，而你想转到其他分支上进行一些工作。问题是，你不想提交进行了一半的工作，否则以后你无法回到这个工作点。解决这个问题的办法就是`git stash`命令。储藏(stash)可以获取你工作目录的中间状态——也就是你修改过的被追踪的文件和暂存的变更——并将它保存到一个未完结变更的堆栈中，随时可以重新应用。

`git stash`会把所有未提交的修改（包括暂存的和非暂存的）都保存起来，用于后续恢复当前工作目录。 比如下面的中间状态，通过 git stash 命令推送一个新的储藏，当前的工作目录就干净了。而且`git stash`是本地存储，并不会推送到服务器。


```bash
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html
no changes added to commit (use "git add" and/or "git commit -a")

$ git stash
Saved working directory and index state WIP on master: e4f060f add readme

$ git status
On branch master
nothing to commit, working tree clean
```


## git stash save


实际应用中推荐给每个 stash 加一个 message，用于记录版本，使用`git stash save`取代`git stash`命令。


```bash
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")

$ git stash save '改了index的标题'
Saved working directory and index state On master: 改了index的标题

$ git status
On branch master
nothing to commit, working tree clean

$ git stash list
stash@{0}: On master: 改了index的标题
stash@{1}: WIP on master: e4f060f add readme
stash@{2}: WIP on master: e4f060f add readme
```


## git stash apply


git stash apply 用于将缓存堆栈中的 stash 恢复到工作目录中，但并不删除 stash 拷贝。也可以使用`git stash apply stash@{1}` 指定恢复某个`stash`，不加参数默认最近的一个 stash，即`git stash apply stash@{0}`


```bash
$ git stash list
stash@{0}: On master: 改了index的标题
stash@{1}: WIP on master: e4f060f add readme
stash@{2}: WIP on master: e4f060f add readme

$ git stash apply stash@{1}
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")
```


## git stash pop


和`apply`作用类似，这个指令可以将缓存堆栈中的第一个`stash`删除，并将对应修改应用到当前的工作目录下。


```bash
$ git stash list
stash@{0}: WIP on master: e4f060f add readme
stash@{1}: On master: 改了index的标题
stash@{2}: WIP on master: e4f060f add readme
stash@{3}: WIP on master: e4f060f add readme

$ git stash pop
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (91bfd4fd55e0e3f90a480dfc5bebe0394a393860)

$ git stash list
stash@{0}: On master: 改了index的标题
stash@{1}: WIP on master: e4f060f add readme
stash@{2}: WIP on master: e4f060f add readme
```


## git stash drop


用于移除缓存堆栈中的第一个`stash`，也可以指定删除某一个`stash`


```bash
$ git stash list
stash@{0}: WIP on master: e4f060f add readme
stash@{1}: On master: 改了index的标题
stash@{2}: WIP on master: e4f060f add readme
stash@{3}: WIP on master: e4f060f add readme

$ git stash drop
Dropped refs/stash@{0} (22b04ba90a37fb36d5f8e7228e7d8cee324a148b)

$ git stash list
stash@{0}: On master: 改了index的标题
stash@{1}: WIP on master: e4f060f add readme
stash@{2}: WIP on master: e4f060f add readme

$ git stash drop stash@{2}
Dropped stash@{2} (33d9570595f16bc5f4a07247551377e10a0a6ce1)

$ git stash  list
stash@{0}: On master: 改了index的标题
stash@{1}: WIP on master: e4f060f add readme
```


## git stash show


用于查看最近一个或者指定`stash`的 diff，貌似用到的不多，记录下。`git stash show -p`可以查看特定`stash`的全部`diff`以及更人性化一点，


```text
$ git stash  list
stash@{0}: WIP on master: e4f060f add readme
stash@{1}: On master: 改了index的标题
stash@{2}: WIP on master: e4f060f add readme

$ git stash show
 index.html | 6 +++---
 1 file changed, 3 insertions(+), 3 deletions(-)

$ git stash show stash@{2}
 index.html | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git stash show -p
diff --git a/index.html b/index.html
index 79c2914..47be827 100644
--- a/index.html
+++ b/index.html
@@ -5,9 +5,9 @@
......
```


## git stash branch


这条命令会根据最近的 `stash` 创建一个新的分支，然后删除最近的 `stash`（和 `stash pop` 一样）。如果你需要某个 `stash`，你可以指明 `stash id`。


```text
# git_learning (master)
$ git stash
Saved working directory and index state WIP on master: e4f060f add readme

# git_learning (master)
$ git stash list
stash@{0}: WIP on master: e4f060f add readme

# git_learning (master)
$ git stash branch testbranch
# 或者指定id
#$ git stash branch testbranch stash@{0}
Switched to a new branch 'testbranch'
On branch testbranch
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (e943a81398f2f01a2d64b227488af67a49b78e57)

# git_learning (testbranch)
$ git stash list
# 无,被删除了
```


## 小结


默认情况下，`git stash`会缓存下列文件：

- 添加到暂存区的修改（`staged changes`）
- Git 跟踪的但并未添加到暂存区的修改（`unstaged changes`），即`git add` 但未 `git commit`

但不会缓存一下文件：

- 在工作目录中新的文件（`untracked files`）
- 被忽略的文件（`ignored files`）

`git stash`命令提供了参数用于缓存上面两种类型的文件。使用`-u`或者`--include-untracked`可以缓存`stash untracked`文件。使用`-a`或者`--all`命令可以 stash 当前目录下的所有修改。


# git checkout


## 基础用法


`checkout`最常用的用法莫过于对于工作分支的切换了： `git checkout branchName`只是将项目切换到任意分支，不创建分支。 除非再`git clone` 一个新的项目后，因为只会默认在本地创建一个`master`分支，这个时候想要切换到远程分支的话，一般是创建该分支的本地分支并切换到该分支。


```text
创建新分支：git branch branchName

切换到新分支：git checkout branchName
```


但是大多数情况下都是创建分支的时候切换分支。所以以上语句可以合成一句话： `git checkout -b branchName`


## 进阶


要想更深入的了解`checkout`，我们需要了解`checkout`的作用机制。该命令的主要关联目标其实是`.git` 文件夹下的`HEAD`文件。 我们可以看到`HEAD`头文件是一个引用，指向的是当前的分支，如果变更分支，该`HEAD`会变更。


```text
# git_learning (master)
$ cd .git/

# git_learning/.git (GIT_DIR!)
$ ls
COMMIT_EDITMSG  description  gitk.cache  hooks/  info/  objects/   refs/
config          FETCH_HEAD   HEAD        index   logs/  ORIG_HEAD

# git_learning/.git (GIT_DIR!)
$ cat HEAD
ref: refs/heads/master

# git_learning/.git (GIT_DIR!)
$ cd refs/heads/

# git_learning/.git/refs/heads (GIT_DIR!)
$ ls
111  master  new_branch  testbranch

# git_learning/.git/refs/heads (GIT_DIR!)
$  cat master
e4f060f544371c8adab70af931ba008024bdc2e1

# git_learning (master)
$ git checkout 111
Switched to branch '111'

# git_learning (111)
$ cat .git/HEAD
ref: refs/heads/111
```


……持续记录中 QAQ

