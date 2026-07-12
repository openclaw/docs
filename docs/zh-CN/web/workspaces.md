---
read_when:
    - 构建或重新排列工作区标签页和小组件
    - 让智能体构建工作区
    - 审查自定义微件的审批和沙箱模型
summary: Control UI 中可由 Agent 组合的工作空间
title: 工作区
x-i18n:
    generated_at: "2026-07-12T14:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

[Control UI](/zh-CN/web/control-ui) 中的 **工作区** 标签页是你和智能体共同编排的界面。标签页、小组件、它们在 12 列网格上的位置及其数据绑定都存储在同一份文档中。任何能够编辑该文档的一方都可以编排工作区：你、`openclaw workspaces` CLI，或调用 `workspace_*` 工具的智能体。

每次写入都经过同一条经过验证的路径，因此人工布局与智能体布局不会出现分歧。每次接受写入时都会递增版本并广播 `plugin.workspaces.changed`，因此智能体所做的编辑会直接显示在已经打开的浏览器中，无需重新加载。

## 启用工作区

内置的工作区插件默认处于禁用状态。在 Control UI 中打开 **插件**，找到 **工作区**，然后选择 **启用**。你也可以通过 CLI 启用它：

```sh
openclaw plugins enable workspaces
```

启用插件后会添加 **工作区** 标签页，并提供 `openclaw workspaces` CLI 和 `workspace_*` 智能体工具。禁用插件会移除这些界面和工具，但不会删除工作区数据库或小组件资源。

## 默认工作区

首次加载时，你会看到一个 **概览** 工作区：其中包含成本和令牌卡片、实例健康状况、会话、cron 状态以及活动信息流。它只是普通的工作区内容——你可以拖动、折叠、隐藏或删除它。

## 内置小组件

插件随附九个受信任的小组件，并将其呈现为第一方 UI：

`stat-card`、`markdown`、`table`、`iframe-embed`、`sessions`、`usage`、`cron`、
`instances`、`activity`。

小组件通过**绑定**声明数据，绝不会自行获取数据：

| 绑定     | 解析结果                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `static` | 存储在文档中的字面值（最大 8 KB）。                                                                          |
| `file`   | `<stateDir>/workspaces/data/` 下的 JSON、Markdown 或 CSV 文件，可以选择使用 JSON 指针缩小范围。               |
| `rpc`    | 固定允许列表中的某个只读 Gateway 网关方法，由受信任的 Control UI 解析。                                      |

`file` 绑定是将你自己的数值放入工作区的最简单方式：将 JSON 文件写入数据目录，并让 `stat-card` 指向它。

## 来源

标签页和小组件带有 `createdBy` 标记——`user`、`system` 或 `agent:<id>`——其值根据执行写入的一方设置。调用方无法提供该值，因此智能体不能将其工作标记为你的工作，并且智能体创建的小组件上的“AI”标记始终准确表示其来源。

## 自定义小组件

智能体可以使用 `workspace_widget_scaffold` 创建真正的 HTML 小组件（你也可以使用 `openclaw workspaces widget-scaffold <name>` 创建）。智能体编写的代码会被视为恶意代码：

- 脚手架生成的小组件会以**待处理**状态进入注册表。在操作员批准之前，不会创建 iframe，并且其文件的资源路由会返回 404。
- 批准与编辑布局是两个独立的决定：`workspaces.widget.approve` 需要 `operator.approvals` 权限范围，该权限范围也用于保护 Exec 审批。
- 已批准的小组件会在 `<iframe sandbox="allow-scripts">` 中呈现——绝不使用 `allow-same-origin`——因此其源是不透明的，无法访问父页面的 DOM、存储或 Cookie。
- 其资源通过 `connect-src 'none'` 提供，从而阻止 `fetch`、XHR 和 WebSocket 等脚本网络访问。它不持有任何凭据，也绝不会与 Gateway 网关通信。
- 数据只能通过带版本号的 `postMessage` 桥传递给它。自定义代码可以接收声明的 `static` 绑定，这些绑定本身就是由智能体或操作员编写的工作区值。RPC 和文件绑定仅保留在受信任的内置小组件中：浏览器允许沙箱隔离的子页面在自己的框架中导航，因此特权数据绝不会发送到智能体编写的 HTML 中。

从小组件向聊天发送提示还需要清单能力、每次调用时引用确切文本的确认，并且受速率限制约束。

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` 需要与具有 `operator.approvals` 权限范围的设备配对；从 Control UI 批准则不需要，因为浏览器已经持有该权限。

## 存储

工作区文档、自定义小组件注册表和包含 20 个条目的撤销环存储在 `<stateDir>/workspaces/workspaces.sqlite` 中。智能体编写的小组件资源保留在磁盘上的 `<stateDir>/workspaces/widgets/<name>/` 下，文件绑定数据则保留在 `<stateDir>/workspaces/data/` 下，因为智能体使用普通文件工具编写这些内容，而小组件路由会提供其原始字节。
