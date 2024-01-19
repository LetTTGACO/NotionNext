---
password: ''
icon: ''
创建时间: '2023-04-07T19:15:00.000Z'
date: '2021-10-12 00:00:00'
type: Post
slug: peqmq8
配置类型:
  type: string
  string: 文档
summary: 本文介绍了一个 React 中后台系统多页签方案，包括标签页功能、页面数据缓存、权限相关等功能点。同时，还涉及到路由结构和 Layout 布局组件等方面的问题。本文旨在帮助读者理解多页签实现的原理及其应用场景。
更新时间: '2023-08-26T15:22:00.000Z'
title: React 中后台系统多页签方案
category: 技术分享
tags:
  - React
status: Archived
urlname: aea49f8c-44b2-44d5-a269-c0d1ff23625d
updated: '2023-08-26 23:22:00'
---

# 引言


在中后台管理类系统中，**多页签**的需求非常普遍，用户常常需要在多个页签内跳转，比如填写表单时去查询某个列表获取一些字段信息再回到表单页面填写。这样的需求在 Vue 中使用 [keep-alive](https://v3.cn.vuejs.org/api/built-in-components.html#keep-alive) 即可实现，但是在 React 中，React Router 切换路由后就会卸载组件，而本身并没有提供类似 keep-alive 的功能，所以实现多页签的功能就会变得格外困难。我的项目也遇到了同样的问题，这里记录一下技术调研和技术选型的过程。


React 多页签 UI 本身好实现，难点是没有官方提供类似 Vue 的 keep-alive 功能，而使用 React Router，路由切换会直接卸载组件，导致无法缓存，用户的数据和行为因此丢失了。


社区上关于多页签的需求呼声也非常高，但是如 React 社区比较出名的中后台方案[Ant Design Pro](https://github.com/ant-design/ant-design-pro)也不支持该功能，至今仍然有很多[Issue](https://github.com/ant-design/ant-design-pro/issues?q=%E5%A4%9A%E9%A1%B5%E7%AD%BE%E9%9C%80%E6%B1%82)提出这类需求：


![FuCO9hJ-9X7b-OFn_NHjdjHcbZoU.png](https://image.1874.cool/1874-blog-images/c0c040e9fa554f9f3d458ed0201aed26.png)


[偏右](https://github.com/afc163)大佬早在 2017 年对此做出了回应，详见[能否提供 tab 切换模式 · Issue #220 · ant-design/ant-design-pro · GitHub](https://github.com/ant-design/ant-design-pro/issues/220)，这个 Issue 虽然关闭了，但这些年仍然活跃：


![FvCuqsZHkUWinokfvz1NcpDwc5Id.png](https://image.1874.cool/1874-blog-images/d6deb04ca839c57a45325ff55a72d874.png)


看 👎 的数量就知道，用户其实对这种回答很不买帐。再来看 2019 年偏右对这个问题的解释，稍微具体了些：


![FofX-2QeIqDSJCDnMrh_wshVNfkp.png](https://image.1874.cool/1874-blog-images/f9f84c9d813b6d7556243e9663b31792.png)


# 项目简介


所在部门的项目是一个小程序发布平台的管理后台，用于租户小程序的代码提交、提审、发布等工作流。前端客户端是 React 16.13.1，BFF 层则是 Koa2 的 Node 端，后端则是 Go。


# 需求背景


因为开发人员和测试人员会经常对小程序进行查询、提交代码、体验等等操作，有两个痛点很明显：

1. 列表查询的搜索条件会因为切换路由而消失，特别是有些筛选条件是从数据库拿的，会在数据库和网页之间来回复制粘贴，浪费时间。
2. 对于测试人员和开发人员来说，浏览器的标签页经常会开很多，如果我想多操作几个小程序，则需要又多开浏览器的标签页进行操作，本来就是 SPA 单页应用，所有的操作应该尽量在一个页面上完成。

# 方案选型


经过一番调研之后，基本的思路大概有三种：

1. 使用 Redux，数据往 store 里面怼，实现页面数据的”缓存“。
2. 改写 React Router 源码，切换路由不卸载，改为隐藏。
3. 使用社区的轮子，当时选了 GitHub 里的两个产品： [React Keeper](https://github.com/lanistor/react-keeper) 和 [react-router-cache-route](https://github.com/CJY0208/react-router-cache-route)

其实每种方案都存在一些问题，最终的选择是使用了排除法。
第一种方案的缺点是，项目本身的接入 Redux 的操作繁琐，改造侵入性比较大，不是很好的选择。
第二种的思路和 [react-router-cache-route](https://github.com/CJY0208/react-router-cache-route) 比较像，就不想重复造轮子了。
第三种选用开源方案，用社区的优秀轮子：[react-router-cache-route](https://github.com/CJY0208/react-router-cache-route)


结合目前项目的情况，不想改动点太多，所以选择了开源方案 [react-router-cache-route](https://github.com/CJY0208/react-router-cache-route)


# 方案实施


多标签页需求可以拆分为两步：

1. 实现页面数据的缓存
2. 菜单路由结合多标签 ui

## 使用[react-router-cache-route](https://github.com/CJY0208/react-router-cache-route)实现页面的数据缓存


首先遇到的第一个问题就是我目前的项目中，路由用的是配置是路由，即通过[react-router-config](https://github.com/ReactTraining/react-router)中的`renderRoutes`将配置式路由进行转换：


```javascript
function renderRoutes(routes, extraProps, switchProps) {
  if (extraProps === void 0) {
    extraProps = {};
  }

  if (switchProps === void 0) {
    switchProps = {};
  }
  // 将配置式路由生成声明式路由，生成
  // <Switch>
  // 		<Route path={} exact={}></Route>
  // </Switch>
  return routes
    ? React.createElement(
        Switch,
        switchProps,
        routes.map(function (route, i) {
          return React.createElement(Route, {
            key: route.key || i,
            path: route.path,
            exact: route.exact,
            strict: route.strict,
            render: function render(props) {
              return route.render
                ? route.render(
                    _extends({}, props, {}, extraProps, {
                      route: route,
                    })
                  )
                : React.createElement(
                    route.component,
                    _extends({}, props, extraProps, {
                      route: route,
                    })
                  );
            },
          });
        })
      )
    : null;
}

```


而[react-router-cache-route](https://github.com/CJY0208/react-router-cache-route)目前不支持配置式路由。


![Ft59aRxMoSdz4eMGTfBLOXfG3xGx.png](https://image.1874.cool/1874-blog-images/26a9e6deaa84f20ca57833c2d1f07601.png)


所以就需要对`renderRoutes`方法进行改造，在生成路由时，用他提供的 CacheRoute 替换 Route，用 CacheSwitch 替换 Switch。


```javascript
import React from "react";
import CacheRoute, { CacheSwitch } from "react-router-cache-route";

// 重写react-router-config中的renderRoutes方法
// 将react-router-dom中的Switch和Route组件替换为react-router-cache-route中的CacheSwitch和CacheRoute组件
// 用于组件的缓存，利用react-router-cache-route轮子，在切换路由时不让组件卸载，而是隐藏
export const renderRoutes = (routes, extraProps = {}, switchProps = {}) => {
  return routes
    ? React.createElement(
        CacheSwitch,
        switchProps,
        routes.map(function (route, i) {
          return React.createElement(CacheRoute, {
            key: route.key || i,
            path: route.path,
            exact: route.exact,
            strict: route.strict,
            render: function render(props) {
              return route.render
                ? route.render({ ...props, ...extraProps, route: route })
                : React.createElement(route.component, {
                    ...props,
                    ...extraProps,
                    route: route,
                  });
            },
          });
        })
      )
    : null;
};

```


## 菜单路由结合多标签 ui


ui 的逻辑参考的是[react-antd-multi-tabs-admin](https://github.com/hsl947/react-antd-multi-tabs-admin)。


### UI 界面


![FkGiH4KxP7eKbIfUMnPhEcx9n1Ml.png](https://image.1874.cool/1874-blog-images/6321a9264dafc5eb308def2ca33d2510.png)


### 功能点

1. 根据左侧菜单栏生成对应的 Tab 标签
2. 右键可以刷新、关闭、关闭其他、关闭全部
3. Tab 标签页本身可以关闭，关闭后自动切换到已打开的标签页
4. 切换标签页时保持原有的数据不会重新加载

### 思考


### 数据存储


用 store 存储标签页数据。Tab 标签页是一个全局共享，考虑到数据共享的问题，将数据存储到 store 中，并在每个页面共享。


> 可以考虑把当前打开的标签数据同步至 localstory 中，实现刷新后依然可以恢复已打开的标签页，但是目前感觉比较鸡肋，只有把表单数据一起同步才有实用价值。


### 菜单和 Tab 页同步


因为 url 已经和菜单页同步，所以获取当前菜单最方便的方式就是从 url 中获取当前的路由，然后生成标签页，当切换标签页时，直接用 history.push 的方式改变 url，此时菜单页也会跟着变。


## 实施


### 新建 tabPanes.tsx


```typescript
import React, {
  FC,
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
} from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Tabs, Alert, Dropdown, Menu } from "antd";
import Home from "@pages/miniapps";
import { getKeyName } from "@utils/routerUtils";
import { SyncOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import style from "./index.module.less";
import { CommonObjectType, RefType } from "@type/type";
import { useActions } from "@utils/hook";
import { RootState } from "@reducers/index";

const { TabPane } = Tabs;

const initPane = [
  {
    title: "代码管理",
    key: "miniapps",
    content: Home,
    closable: false,
    path: "/miniapps",
  },
];

interface Props {
  // 默认激活的Tab页
  defaultActiveKey: string;
  // 标签页的props
  panesItem: {
    title: string;
    content: Component;
    key: string;
    closable: boolean;
    path: string;
  };
  // 激活的标签页
  tabActiveKey: string;
}

// 多页签组件
const TabPanes: FC<Props> = (props) => {
  // 记录当前激活的Tab页
  const [activeKey, setActiveKey] = useState<string>("");
  // 记录当前打开的Tab页
  const [panes, setPanes] = useState<CommonObjectType[]>(initPane);
  // 记录Tab页的刷新状态
  const [isReload, setIsReload] = useState<boolean>(false);
  // 记录当前右键选中的Tab页
  const [selectedPanel, setSelectedPanel] = useState<CommonObjectType>({});
  // 用useRef记录最新的Tab页数据
  const pathRef: RefType = useRef<string>("");

  // 取出操作Tab页的action
  const { layouts } = useActions(["layouts"]);
  // 从store取出当前的Tab页列表和刷新路径
  const { curTab, reloadPath } = useSelector(
    (state: RootState) => state.layouts
  );

  // 取出props
  const { defaultActiveKey, panesItem, tabActiveKey } = props;
  // 用history进行跳转，结合react-router-cache-route会将数据进行缓存
  const history = useHistory();
  // 取出当前的path，例如/miniapps /log等
  const { pathname, search } = useLocation();
  // 可能会有带参数的情况
  const fullPath = pathname + search;

  // 记录当前打开的tab
  const storeTabs = useCallback((ps): void => {
    // 对路径进行累加，对当前打开的路径进行全存储
    const pathArr = ps.reduce(
      (prev: CommonObjectType[], next: CommonObjectType) => [
        ...prev,
        next.path,
      ],
      []
    );
    // 将数据记录到store中
    layouts.setTab(pathArr);
  }, []);

  // 从本地存储中恢复已打开的tab列表
  const initTabs = useCallback((): void => {
    const initPanes = curTab.reduce(
      (prev: CommonObjectType[], next: string) => {
        const { title, tabKey, component: Content } = getKeyName(next);
        return [
          ...prev,
          {
            title,
            key: tabKey,
            content: Content,
            closable: tabKey !== "/miniapps",
            path: next,
          },
        ];
      },
      []
    );
    // 从路由中获取当前需要打开的Tab页
    const { tabKey } = getKeyName(pathname);
    // 设置当前打开的Tab页
    setPanes(initPanes);
    // 设置当前激活的Tab页
    setActiveKey(tabKey);
  }, [pathname]);

  // 初始化页面
  useEffect(() => {
    initTabs();
  }, [initTabs]);

  // tab切换
  const onChange = (tabKey: string): void => {
    setActiveKey(tabKey);
  };

  // 移除tab
  const remove = (targetKey: string): void => {
    const delIndex = panes.findIndex((item: any) => item.key === targetKey);
    panes.splice(delIndex, 1);

    // 删除非当前tab
    if (targetKey !== activeKey) {
      const nextKey = activeKey;
      setPanes(panes);
      setActiveKey(nextKey);
      storeTabs(panes);
      return;
    }

    // 删除当前tab，地址往前推，如果前面没有tab页就往后推
    const nextPath = curTab[delIndex - 1] || curTab[delIndex + 1];
    history.push(nextPath);
    // 记录删除后的Tab页
    setPanes(panes);
    // 将数据记录到store
    storeTabs(panes);
  };

  // tab点击删除操作
  const onEdit = (targetKey: string | any, action: string) =>
    action === "remove" && remove(targetKey);

  // tab点击，激活标签页
  const onTabClick = (targetKey: string): void => {
    const { path } = panes.filter(
      (item: CommonObjectType) => item.key === targetKey
    )[0];
    history.push({ pathname: path });
  };

  // 刷新当前 tab
  const refreshTab = (): void => {
    setIsReload(true);
    setTimeout(() => {
      setIsReload(false);
    }, 1000);

    layouts.reloadTab(pathname + search);
    setTimeout(() => {
      layouts.reloadTab("null");
    }, 500);
  };

  // 关闭其他或关闭所有
  const removeAll = async (isCloseAll?: boolean) => {
    const { path, key } = selectedPanel;
    console.log("selectedPanel", path, key);
    // 关闭所有就跳转到代码管理
    // 关闭其他就跳转到右键选择的tab页上
    // 情况一：在当前激活的tab页操作关闭其他，则会保留当前的tab页；
    // 情况二：在其他未激活的Tab页操作关闭其他，则会跳转到鼠标操作的tab页
    history.push(isCloseAll ? "/miniapps" : path);

    // 当前已打开的tab页
    // 如果右键操作的不是代码管理页（miniapps），且选择的是关闭其他，则当前打开的Tab页是代码管理页+ 右键点击所在的页面
    // 否则：如果右键操作的是代码管理页（miniapps），或者选择的是关闭所有，则当前打开的Tab页是代码管理页
    const nowPanes =
      key !== "/miniapps" && !isCloseAll
        ? [...initPane, selectedPanel]
        : initPane;
    setPanes(nowPanes);
    // 如果是关闭全部，就跳转到代码管理页
    setActiveKey(isCloseAll ? "/miniapps" : key);
    storeTabs(nowPanes);
  };

  useEffect(() => {
    const newPath = pathname + search;

    // 当前的路由和上一次的一样，return
    if (!panesItem.path || panesItem.path === pathRef.current) return;

    // 保存这次的路由地址
    pathRef.current = newPath;
  });

  useEffect(() => {
    const index = panes.findIndex((_: CommonObjectType) => {
      return _.key === panesItem.key;
    });
    // 无效的新tab，return
    if (
      !panesItem.key ||
      (index > -1 && pathRef.current === panes[index].path)
    ) {
      setActiveKey(tabActiveKey);
      return;
    }

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      panes[index].path = pathRef.current;
      setPanes(panes);
      setActiveKey(tabActiveKey);
      return;
    }
    // 添加新tab并保存起来
    panes.push(panesItem);
    setPanes(panes);
    setActiveKey(tabActiveKey);
    storeTabs(panes);
  }, [panes]);

  const isDisabled = () => selectedPanel.key === "/miniapps";
  // tab右击菜单
  const menu = (
    <Menu>
      <Menu.Item
        key="1"
        onClick={() => refreshTab()}
        disabled={selectedPanel.path !== fullPath}
      >
        刷新
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={(e) => {
          e.domEvent.stopPropagation();
          remove(selectedPanel.key);
        }}
        disabled={isDisabled()}
      >
        关闭
      </Menu.Item>
      <Menu.Item
        key="3"
        onClick={(e) => {
          e.domEvent.stopPropagation();
          removeAll();
        }}
      >
        关闭其他
      </Menu.Item>
      <Menu.Item
        key="4"
        onClick={(e) => {
          e.domEvent.stopPropagation();
          removeAll(true);
        }}
        disabled={isDisabled()}
      >
        全部关闭
      </Menu.Item>
    </Menu>
  );

  const onRightClick = (e: CommonObjectType, panel: object) => {
    e.preventDefault();
    setSelectedPanel(panel);
  };

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        className={style.tabs}
        defaultActiveKey={defaultActiveKey}
        hideAdd
        onChange={onChange}
        onEdit={onEdit}
        onTabClick={onTabClick}
        type="editable-card"
      >
        {panes.map((pane: CommonObjectType) => (
          <TabPane
            closable={pane.closable}
            key={pane.key}
            tab={
              <Dropdown
                overlay={menu}
                placement="bottomLeft"
                trigger={["contextMenu"]}
              >
                <span onContextMenu={(e) => onRightClick(e, pane)}>
                  {isReload &&
                    pane.path === fullPath &&
                    pane.path !== "/401" && (
                      <SyncOutlined title="刷新" spin={isReload} />
                    )}
                  {pane.title}
                </span>
              </Dropdown>
            }
          >
            {reloadPath !== pane.path ? (
              <pane.content path={pane.path} />
            ) : (
              <div style={{ height: "100vh" }}>
                <Alert message="刷新中..." type="info" />
              </div>
            )}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default TabPanes;

```


### 新建 useTabActive 自定义 Hook


```typescript
const noNewTab = ["/login", "/"]; // 不需要新建 tab的页面
interface PanesItemProps {
  title: string;
  content: Component;
  key: string;
  closable: boolean;
  path: string;
}

export const useTabActive = () => {
  const { pathname, search } = useLocation();
  const [panesItem, setPanesItem] = useState<PanesItemProps>({
    title: "",
    // @ts-ignore
    content: null,
    key: "",
    closable: false,
    path: "",
  });
  const pathRef: RefType = useRef<string>("");
  const [tabActiveKey, setTabActiveKey] = useState<string>("miniapps");

  useEffect(() => {
    // 记录标签页
    const { tabKey, title, component: Content } = getKeyName(pathname);
    // 新tab已存在或不需要新建tab，return
    if (pathname === pathRef.current || noNewTab.includes(pathname)) {
      setTabActiveKey(tabKey);
      return;
    }
    // 记录新的路径，用于下次更新比较
    const newPath = search ? pathname + search : pathname;
    pathRef.current = newPath;
    setPanesItem({
      title,
      content: Content,
      key: tabKey,
      closable: tabKey !== "/miniapps",
      path: newPath,
    });
    setTabActiveKey(tabKey);
  }, [pathname]);

  return { panesItem, tabActiveKey };
};

```


### 将原来的 content 内容组件进行替换


```typescript
const { panesItem, tabActiveKey } = useTabActive()

<Layout.Content>
  <TabPanes
    defaultActiveKey="miniapps"
    panesItem={panesItem}
    tabActiveKey={tabActiveKey}
   />
</Layout.Content>

```


# 问题


## routes 路由重复渲染


```typescript
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { RouteConfigComponentProps } from "react-router-config";
import { renderRoutes } from "@utils/routerUtils";
import config from "@utils/config";
import { useDispatch } from "react-redux";
import Layout from "@layouts/default";
import Autho from "@components/autho";
import NotFined from "@components/errorPage/404";
import { useActions } from "@utils/hook";

// 合并路由
const routes = [
  ...require("@pages/manager_develop/router").default,
  ...require("@pages/miniapps/router").default,
  ...require("@pages/templates/router").default,
  ...require("@pages/log/router").default,
  ...require("@pages/dashboard/router").default,
  ...require("@pages/operations/router").default,
  { path: "*", exact: true, component: NotFined },
];

const loginRoute = require("@pages/login/router").default;

type RouteComponentType = React.ComponentType<RouteConfigComponentProps<any>>;

const Root: RouteComponentType = function (props) {
  const dispatch = useDispatch();
  // 取出操作Tab页的action
  const { layouts } = useActions(["layouts"]);
  window.router = props;
  window.dispatch = dispatch;

  if (!props.route) {
    return null;
  }
  // @ts-ignore
  if (props.pathname === "/") {
    window.router.history.push(config.homeUrl);
    layouts.setTab(["/miniapps"]);
  }
  // （1）这里渲染了一次
  return renderRoutes(props.route.routes);
};

export const rootRoutes = [
  {
    component: Root,
    path: "/",
    name: "首页",
    routes: [
      ...loginRoute,
      {
        // （2）这里渲染了一次
        component: (props) => (
          <Layout key="root_layout">
            {props.route && renderRoutes(props.route.routes)}
          </Layout>
        ),
        routes: [
          ...routes.map((item) => ({
            ...item,
            component: () => {
              const C = item.component;
              return (
                <Autho block="nav" funcCode={item.menuCode}>
                  <C />
                </Autho>
              );
            },
          })),
        ],
      },
    ],
  },
];

const RouterMap = () => {
  return (
    <Router basename={config.routerBaseName}>
      {/* (3)这里渲染了一次*/}
      {renderRoutes(rootRoutes)}
    </Router>
  );
};

export default RouterMap;

```


这里一共在三个地方调用了`renderRoutes(rootRoutes)`进行了组件渲染，而且`rootRoutes`的结构比较诡异：


```json
[
  {
    path: "/",
    name: "首页",
    routes: [
      {
        path: "/login",
        exact: true,
      },
      {
        routes: [
          {
            path: "/operations/error",
            exact: true,
            name: "错误日志",
            menuCode: "error",
          },
          {
            path: "/operations/errorinfo",
            name: "错误详情",
            menuCode: "errorinfo",
            exact: true,
          },
          {
            path: "/operations/performance",
            name: "性能监控",
            menuCode: "performance",
            exact: true,
          },
          {
            path: "*",
            exact: true,
          },
        ],
      },
    ],
  },
];

```


参考 cms 的路由结构：


```json
[
  {
    routes: [
      {
        path: "/",
        exact: true,
      },
      {
        path: "/register_customer",
        name: "customer",
        title: "集团客户",
        exact: true,
      },
      {
        path: "/region_customer",
        name: "customer",
        title: "区域客户",
        exact: true,
      },
      {
        path: "/user_project_visit",
        name: "customer",
        title: "项目客户",
        exact: true,
      },
      {
        path: "*",
        exact: true,
      },
    ],
  },
];

```


或者另一种嵌套结构：


```json
[
  {
    path: "/",
    name: "首页",
    routes: [
      {
        path: "/operations/error",
        exact: true,
        name: "错误日志",
        menuCode: "error",
      },
      {
        path: "/operations/errorinfo",
        name: "错误详情",
        menuCode: "errorinfo",
        exact: true,
      },
      {
        path: "/operations/performance",
        name: "性能监控",
        menuCode: "performance",
        exact: true,
      },
      {
        path: "*",
        exact: true,
      },
    ],
  },
];

```


## Layout 布局组件耦合严重


```typescript
<Layout style={{ minHeight: "100vh", height: "100%", overflow: "hidden" }}>
  <Sider
    collapsible
    collapsed={collapsed}
    onCollapse={setCollapsed}
    style={{ position: "fixed", zIndex: 100, height: "100%" }}
  >
    <div style={{ display: "flex", padding: 16 }}>
      {platforms.length && (
        <Select
          onSelect={(id) => {
            select({ ...platforms.find((item) => item.component_id === id) });
          }}
          defaultValue={component_id}
          className={styles.env}
        >
          {platforms.map((opt) => (
            <Select.Option
              key={opt.component_id}
              value={opt.component_id}
              title={opt.component_name}
            >
              {opt.component_name}
            </Select.Option>
          ))}
        </Select>
      )}
      <LogoutOutlined onClick={logout} className={styles.logut} />
    </div>
    {renderMenu()}
  </Sider>
  <Layout style={{ marginLeft: collapsed ? "80px" : "200px" }}>
    <Layout.Content>
      <TabPanes
        defaultActiveKey="miniapps"
        panesItem={panesItem}
        tabActiveKey={tabActiveKey}
      />
    </Layout.Content>
    <Footer style={{ textAlign: "center" }}>Copyright ©</Footer>
  </Layout>
</Layout>

```


可以看到，布局组件嵌套了包括小程序平台的业务组件逻辑，我这次也把 Tab 组件嵌套进去了，耦合有点强，后续维护成本高，后面考虑从路由出发，重新梳理下结构。
对比 cms 的布局组件，就具有相对高的通用性


```typescript
<div
  className="common-layout-default"
  style={{ background: props.bgColor || "#fff" }}
>
  <Header></Header>
  <div
    className="common-layouts-side-styles"
    style={{ maxWidth: props.maxWidth, minWidth: props.minWidth }}
  >
    <div className="layout-side">
      <SideNavigation></SideNavigation>
    </div>
    <div className="layout-content">{props.children}</div>
  </div>
  <Footer></Footer>
</div>

```


# 需要测试的功能点


![FkGiH4KxP7eKbIfUMnPhEcx9n1Ml.png](https://image.1874.cool/1874-blog-images/6321a9264dafc5eb308def2ca33d2510.png)


## 登录相关

- 直接输入.../login 进行登录后标签页功能
- 正常退出后重新登录后标签页功能

## 权限相关

- 无页面权限时的标签页功能
- 目前路由和标签页是全匹配新建的，只有当路由完全一致时才会新建标签页，否则会显示无权限，例如`.../p-yunke-ai-third-platform/operations/error`和`.../p-yunke-ai-third-platform/operations/error/`，多了一个`/`都不行

## 标签页功能


默认代码管理页面为默认页面，无法关闭。

- 新增标签页

	> 点击左侧菜单，如果打开的是不同的页面，则会新建 tab

- 关闭标签页
- 刷新当前页

	> 只有在当前激活的标签页才能进行刷新页面的操作

- 关闭其它标签
- 关闭全部标签

	> 规则：在当前已打开的 tab 页， 如果右键操作的不是代码管理页（miniapps），且选择的是关闭其他，则当前打开的 Tab 页是代码管理页+ 右键点击所在的页面  
	> 否则：如果右键操作的是代码管理页（miniapps），或者选择的是关闭所有，则当前保留的 Tab 页是代码管理页


## 页面数据缓存


目前支持在不同标签页切换时不会清空表单数据，但是刷新依然会清空（代码管理页面除外，单独做了刷新后依旧可以缓存数据）

