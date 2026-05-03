---
title: Hexo Matery 修改导航菜单名称教程
date: 2026-04-16 16:00:00
tags: [Hexo, 主题配置, 导航菜单]
categories: 技术教程
summary: 修改 Hexo Matery 主题导航栏菜单项的显示名称，以将 /musics/ 页面的菜单名从 Musics 改为 liuyan 为例。
---

## 一、导航菜单配置位置

文件：`themes/hexo-theme-matery/_config.yml`，顶部 `menu` 配置段。

```yaml
menu:
  Index:
    url: /
    icon: fas fa-home
  About:
    icon: fas fa-user-circle
    children:
      - name: liuyan          # ← 菜单显示名称（修改此处）
        url: /musics           # ← 页面路径（不变）
        icon: fas fa-music     # ← 图标（不变）
```

---

## 二、修改方法

### 2.1 修改位置

`themes/hexo-theme-matery/_config.yml` 第 27 行：

```yaml
# 修改前
- name: Musics

# 修改后
- name: liuyan
```

### 2.2 仅改 name 字段

| 字段 | 作用 | 是否修改 |
|------|------|---------|
| `name` | 导航栏显示的文字 | 改为 `liuyan` |
| `url` | 点击后跳转的路径 | 不改，仍为 `/musics` |
| `icon` | 菜单项图标 | 不改，仍为 `fas fa-music` |

`name` 只影响导航栏显示文字，不影响页面路径和功能。

---

## 三、Matery 菜单结构说明

### 3.1 一级菜单

```yaml
menu:
  Index:             # ← 一级菜单名
    url: /           # ← 链接
    icon: fas fa-home
```

一级菜单直接显示在导航栏，点击跳转。

### 3.2 二级下拉菜单

```yaml
menu:
  About:                    # ← 父菜单名（悬停展开下拉）
    icon: fas fa-user-circle
    children:               # ← 子菜单列表
      - name: liuyan        #    子项显示名
        url: /musics        #    子项链接
        icon: fas fa-music   #    子项图标
      - name: about
        url: /about
        icon: fas fa-paste
```

`children` 下的每个 `- name:` 都是一个下拉菜单项。

### 3.3 字段对照表

| 字段 | 位置 | 作用 |
|------|------|------|
| `menu.键名` | 一级菜单 | 导航栏直接显示的文字 |
| `children[].name` | 二级菜单 | 下拉菜单中显示的文字 |
| `url` | 通用 | 点击跳转的路径 |
| `icon` | 通用 | Font Awesome 图标类名 |

---

## 四、其他常见修改示例

### 改菜单名称

```yaml
# 把 "about" 改成 "关于我"
- name: 关于我
  url: /about
  icon: fas fa-paste
```

### 改菜单图标

图标来自 [Font Awesome](https://fontawesome.com/icons)，替换 `icon` 值即可：

```yaml
# 把音乐图标改成评论图标
- name: liuyan
  url: /musics
  icon: fas fa-comments    # 原来是 fas fa-music
```

### 添加新菜单项

在 `children` 下新增一个 `- name:` 块：

```yaml
About:
  icon: fas fa-user-circle
  children:
    - name: liuyan
      url: /musics
      icon: fas fa-music
    - name: text              # ← 新增
      url: /text              # ← 新增
      icon: fas fa-file-alt   # ← 新增
```

### 删除菜单项

直接删除对应的 `- name:` 整块即可。

---

## 五、注意事项

1. **name 与 url 是独立的**：改 `name` 不需要改 `url`，页面路径不受影响
2. **name 支持中文**：可以写 `name: 留言` 或任意文字
3. **修改后需重启**：`_config.yml` 修改后需重新运行 `hexo s` 才能生效
4. **缩进必须用空格**：YAML 不允许 Tab 缩进，必须用空格，且层级对齐
