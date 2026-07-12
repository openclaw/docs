---
read_when:
    - 构建或重新排列工作区标签页和小组件
    - 让智能体构建工作区
    - 审查自定义组件的审批和沙箱模型
summary: Control UI 中可由 Agent 组合的工作空间
title: 工作区
x-i18n:
    generated_at: "2026-07-11T21:03:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

**工作区**标签页位于 [Control UI](/zh-CN/web/control-ui) 中，是你与智能体共同布置的界面。标签页、微件、它们在 12 列网格上的位置以及数据绑定都存储在同一份文档中。任何能够编辑该文档的主体都可以编排工作区：你、`openclaw workspaces` CLI，或调用 `workspace_*` 工具的智能体。

每次写入都通过同一条经过验证的路径，因此人工设置的布局与智能体设置的布局不会产生偏差。每次接受写入后都会递增版本号并广播 `plugin.workspaces.changed`，因此智能体所做的编辑无需重新加载，就会出现在已打开的浏览器中。

## 启用工作区

内置的工作区插件默认禁用。在 Control UI 中打开 **插件**，找到 **工作区**，然后选择 **启用**。你也可以通过 CLI 启用它：

```sh
openclaw plugins enable workspaces
```

启用插件后会添加 **工作区** 标签页，并提供 `openclaw workspaces` CLI 和 `workspace_*` 智能体工具。禁用插件会移除这些界面和工具，但不会删除工作区数据库或微件资源。

## 默认工作区

首次加载时，你会获得一个**概览**工作区，其中包含成本和令牌卡片、实例健康状况、会话、定时任务状态以及活动动态。它只是普通的工作区内容，你可以拖动、折叠、隐藏或删除它。

## 内置微件

插件随附九个受信任的微件，并将其渲染为第一方界面：

`stat-card`、`markdown`、`table`、`iframe-embed`、`sessions`、`usage`、`cron`、
`instances`、`activity`。

微件通过**绑定**声明数据，绝不会自行获取数据：

| 绑定     | 解析结果                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `static` | 存储在文档中的字面值（最大 8 KB）。                                                                                 |
| `file`   | `<stateDir>/workspaces/data/` 下的 JSON、Markdown 或 CSV 文件，可以选择通过 JSON 指针缩小范围。                     |
| `rpc`    | 固定只读 Gateway 网关方法允许列表中的一个方法，由受信任的 Control UI 解析。                                         |

`file` 绑定是将自定义数值放入工作区的最简单方式：将 JSON 文件写入数据目录，并让 `stat-card` 指向该文件。

## 来源信息

标签页和微件带有 `createdBy` 标记，其值为 `user`、`system` 或 `agent:<id>`，具体取决于写入者。调用方无法提供该值，因此智能体不能将自己的工作标记为由你创建；智能体创建的微件上的“AI”标识始终准确反映其来源。

## 自定义微件

智能体可以使用 `workspace_widget_scaffold` 创建真正的 HTML 微件（你也可以使用 `openclaw workspaces widget-scaffold <name>` 创建）。智能体编写的代码会被视为不可信代码：

- 新建框架的微件会以**待处理**状态进入注册表。在操作员批准之前，不会创建 iframe，其文件的资源路由也会返回 404。
- 批准微件与编辑布局是两个独立的决定：`workspaces.widget.approve` 要求具备 `operator.approvals` 权限范围，该权限范围也用于保护 Exec 审批。
- 已批准的微件会在 `<iframe sandbox="allow-scripts">` 中渲染，绝不使用 `allow-same-origin`，因此其来源不透明，且无法访问父页面的 DOM、存储或 Cookie。
- 其资源使用 `connect-src 'none'` 提供，从而阻止 `fetch`、XHR 和 WebSockets 等脚本网络访问。它不持有任何凭据，也绝不与 Gateway 网关通信。
- 数据只能通过带版本的 `postMessage` 桥传递给它。自定义代码可以接收已声明的 `static` 绑定，这些值本身已经是由智能体或操作员写入的工作区值。RPC 和文件绑定仅用于受信任的内置微件：浏览器允许沙箱隔离的子页面在自己的框架中导航，因此特权数据绝不会传入智能体编写的 HTML。

从微件向聊天发送提示词还需要清单中声明相应能力、每次调用时引用确切文本进行确认，并且会受到速率限制。

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` 需要使用具备 `operator.approvals` 权限范围的已配对设备；从 Control UI 批准则不需要，因为浏览器已经持有该权限范围。

## 存储

工作区文档、自定义微件注册表以及包含 20 个条目的撤销环都存储在 `<stateDir>/workspaces/workspaces.sqlite` 中。智能体编写的微件资源保存在磁盘上的 `<stateDir>/workspaces/widgets/<name>/` 下，文件绑定数据则保存在 `<stateDir>/workspaces/data/` 下，因为智能体使用普通文件工具编写这些内容，而微件路由负责提供其字节数据。
