---
read_when:
    - 你想要 Control UI 中的看板式 workboard
    - 你正在启用或禁用内置的 Workboard 插件
    - 你想在没有外部项目管理器的情况下跟踪计划中的智能体工作
summary: 用于智能体拥有的卡片和会话交接的可选仪表板 workboard
title: Workboard 插件
x-i18n:
    generated_at: "2026-06-27T02:59:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件会向
[Control UI](/zh-CN/web/control-ui) 添加一个可选的看板式面板。用它收集适合智能体处理的工作卡片、将其分配给智能体，并从一张卡片跟踪关联的后台任务、运行和仪表盘会话。

Workboard 有意保持小巧。它跟踪 OpenClaw Gateway 网关的本地运维工作；它不是 GitHub Issues、Linear、Jira 或其他团队项目管理系统的替代品。

## 默认状态

Workboard 是一个内置插件，默认禁用，除非你在插件配置中启用它。

使用以下命令启用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

然后打开仪表盘：

```bash
openclaw dashboard
```

Workboard 标签页会出现在仪表盘导航中。如果标签页可见，但插件被禁用，或被 `plugins.allow` / `plugins.deny` 阻止，则该视图会显示插件不可用状态，而不是本地卡片数据。

## 卡片包含的内容

每张卡片存储：

- 标题和备注
- 状态：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、
  `review`、`blocked` 或 `done`
- 优先级：`low`、`normal`、`high` 或 `urgent`
- 标签
- 可选的智能体 ID
- 可选的关联任务、运行、会话或来源 URL
- 可选的执行元数据，用于从卡片启动的 Codex 或 Claude 运行
- 尝试、评论、链接、证明、工件、自动化、
  附件、工作器日志、工作器协议状态、声明、诊断、
  通知、模板、归档状态和过期会话检测的紧凑元数据
- 最近的卡片事件，例如创建、移动、关联、声明、Heartbeat、
  尝试、证明、工件、诊断、通知、分派、归档、过期，
  或智能体更新变更

卡片存储在插件的 Gateway 网关状态中。它们是 Gateway 网关状态目录的本地数据，并随该 Gateway 网关的其他 OpenClaw 状态一起移动。

Workboard 会保留紧凑的逐卡片元数据，因此操作员无需打开关联会话，也能看到卡片如何在面板中流转。事件、尝试摘要、证明片段、相关链接、评论、归档标记和过期会话标记都是有意设计的本地元数据；它们不会替代会话转录或 GitHub issue 历史。

## 卡片执行和任务

未关联的卡片可以从卡片启动工作。自主启动会使用 Gateway 网关的任务跟踪智能体运行路径，然后 Workboard 将生成的任务、运行 ID 和会话键关联回卡片。启动会使用 Gateway 网关配置的默认智能体和模型。Codex 和 Claude 操作是可选的显式模型选择：

- Run Codex 或 Run Claude 会启动一个由任务支持的智能体运行，发送卡片提示，并将卡片标记为 `running`。
- Open Codex 或 Open Claude 会创建一个关联的仪表盘会话，但不会发送卡片提示或移动卡片，因此你可以手动工作，同时让它保持附加到面板。

执行元数据会在卡片上存储所选引擎、模式、模型引用、会话键、运行 ID、可用时的任务 ID，以及生命周期状态。Codex 执行使用 `openai/gpt-5.5`；Claude 执行使用
`anthropic/claude-sonnet-4-6`。

每次关联执行还会在同一卡片记录上记录尝试摘要。尝试摘要保留引擎、模式、模型、运行 ID、时间戳、状态和滚动失败计数，以便重复失败在面板上保持可见。

仪表盘会从 Gateway 网关任务账本刷新任务状态，并按任务 ID、运行 ID 或关联会话键将任务匹配回卡片。如果任务正在排队或运行，卡片生命周期会显示活动任务状态。如果任务完成、失败、超时或被取消，卡片生命周期会使用与关联会话相同的生命周期同步，转向 review 或 blocked 状态。

## 智能体协作

Workboard 还暴露可选的智能体工具，用于支持感知面板的工作流：

- `workboard_list` 会列出带有声明和诊断状态的紧凑卡片，并支持可选的面板筛选器。
- `workboard_read` 返回一张卡片，以及从备注、尝试、评论、链接、证明、工件、父级结果、最近的受派人工作和活动诊断构建的有界工作器上下文。
- `workboard_create` 创建一张卡片，并支持可选的父级、租户、Skills、面板、工作区元数据、幂等键、运行时限制和重试预算。
- `workboard_link` 将父级卡片关联到子级卡片。子级会停留在 `todo`，直到每个父级都达到 `done`；之后分派晋升会将它们移动到 `ready`。
- `workboard_claim` 为调用智能体声明一张卡片，并将 backlog、todo 或 ready 卡片移动到 `running`。
- `workboard_heartbeat` 会在较长运行期间刷新声明 Heartbeat。
- `workboard_release` 会在完成、暂停或交接后释放声明，并可将卡片移动到下一个状态。
- `workboard_complete` 和 `workboard_block` 是结构化生命周期工具，用于最终摘要、证明、工件、已创建卡片清单和阻塞原因。已创建卡片清单必须引用关联回已完成卡片的卡片，这会避免幽灵子级出现在摘要中。
- `workboard_attachment_add`、`workboard_attachment_read` 和
  `workboard_attachment_delete` 会将小型卡片附件存储在插件 SQLite 状态中，在卡片上为其建立索引，并在工作器上下文中暴露它们。
- `workboard_worker_log` 和 `workboard_protocol_violation` 会记录工作器日志行，并在自动化工作器停止且没有调用 `workboard_complete` 或 `workboard_block` 时阻塞卡片。
- `workboard_board_create`、`workboard_board_archive` 和
  `workboard_board_delete` 管理持久化的面板元数据，例如显示名称、描述、归档状态和默认工作区。
- `workboard_runs` 返回存储在卡片上的持久化运行尝试历史。
- `workboard_specify` 将粗略的 triage 或 backlog 卡片变成澄清后的 `todo` 卡片，并在卡片上记录规格摘要。
- `workboard_decompose` 将父级编排卡片展开为关联子级，继承面板和租户元数据，并可通过已创建卡片清单完成父级。
- `workboard_notify_subscribe`、`workboard_notify_list`、
  `workboard_notify_events`、`workboard_notify_advance` 和
  `workboard_notify_unsubscribe` 管理插件状态中的通知订阅。事件读取可安全重放；advance 工具会移动持久游标，以便调用方可以继续读取，而不会丢失或重复读取已完成、失败或过期的卡片事件。
- `workboard_boards`、`workboard_stats`、`workboard_promote`、
  `workboard_reassign`、`workboard_reclaim`、`workboard_comment`、
  `workboard_proof`、`workboard_unblock` 和 `workboard_dispatch` 允许智能体检查面板命名空间、查看队列统计、恢复卡住的工作、添加交接备注、附加证明或工件引用、将 blocked 工作移回 `todo`，并推动依赖晋升或过期声明清理。

已声明的卡片会拒绝来自其他智能体的智能体工具变更，除非调用方拥有 `workboard_claim` 返回的声明令牌。仪表盘操作员仍然使用常规 Gateway 网关 RPC 表面，并可以恢复或重新分配卡片。

Workboard 会将持久面板数据存储在 OpenClaw 状态目录下由插件拥有的关系型 SQLite 数据库中。面板、卡片、标签、生命周期事件、运行尝试、评论、依赖链接、证明、工件引用、附件元数据和 blob、诊断、通知、工作器日志、协议状态和订阅都会持久化到 Workboard 表中，而不是插件键值条目中。卡片导出仍会保留面板叙事，但不会内联附件 blob 内容。

在 `.28` 版本中使用过 Workboard 的安装可以运行
`openclaw doctor --fix`，将已发布的旧版插件状态命名空间
（`workboard.cards`、`workboard.boards` 和 `workboard.notify`）迁移到关系型数据库。如果存在旧版 `workboard.attachments` 命名空间，Doctor 也会迁移这些附件 blob。

Workboard 诊断基于本地卡片元数据计算。内置检查会标记等待过久的已分配卡片、缺少近期 Heartbeat 的 running 卡片、需要关注的 blocked 卡片、重复失败、没有证明的 done 卡片，以及只有松散会话链接的 running 卡片。

分派有意限定在 Gateway 网关本地。它不会生成任意操作系统进程；常规 OpenClaw 子智能体会话仍然拥有执行。分派操作会晋升依赖已就绪的卡片，在 ready 卡片上记录分派元数据，阻塞过期声明或超时运行，将面板配置的 triage 卡片标记为编排候选项，然后声明一小批 ready 卡片，并通过 Gateway 网关子智能体运行时启动工作器运行。已分配卡片使用 `agent:<id>:subagent:workboard-*` 工作器会话键；未分配卡片使用无作用域的 `subagent:workboard-*` 键，因此 Gateway 网关仍会解析配置的默认智能体。工作器会获得有界卡片上下文，以及它们通过 Workboard 工具发送 Heartbeat、完成或阻塞卡片所需的声明令牌。

### 分派工作器选择

每次分派默认最多启动三个工作器。Ready 卡片按优先级、位置和创建时间排序，然后经过筛选以避免重复的活动所有权。同一次分派只会为给定所有者或智能体启动一张卡片，并会跳过面板上已有 running 或 review 工作的所有者。

已归档卡片、具有活动声明的卡片，以及未处于 `ready` 状态的卡片不会被选择启动工作器。当过期声明、依赖晋升或超时清理适用时，它们仍可能受到分派数据侧的影响。

### 工作器提示和生命周期

工作器提示包括卡片标题、有界备注和上下文、分配的面板，以及 Workboard 工作器协议。它还包括声明所有者和声明令牌，因此工作器可以调用 `workboard_heartbeat`、`workboard_complete` 或 `workboard_block`，而不会让另一个参与者接管卡片。

当工作器成功启动时，Workboard 会在卡片上存储会话键、运行 ID、引擎、模式、模型标签、状态和工作器日志。会话键对面板和卡片是确定性的，这让重复分派会路由回同一条工作器通道，而不是创建无关会话。

如果卡片被声明后工作器无法启动，Workboard 会阻塞卡片、清除声明、记录运行启动失败，并追加一行工作器日志。该失败会显示在仪表盘、CLI JSON、智能体工具和卡片诊断中。

### 分派入口点

Ready 卡片工作器启动可以来自：

- 仪表盘分派操作
- `openclaw workboard dispatch`
- 支持命令的渠道上的 `/workboard dispatch`

当 Gateway 网关可用时，这三个入口点都会使用 Gateway 网关子智能体运行时。CLI 有一个额外的操作员回退：如果 Gateway 网关离线，或未暴露 Workboard 分派方法，并且没有提供显式 `--url` 或 `--token` 目标，它会针对本地 SQLite 状态运行仅数据分派。该回退可以晋升依赖、清理过期声明并阻塞超时运行，但不能启动工作器。

面板元数据可以包含编排设置，例如 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录编排意图，并在工作器上下文中暴露它；实际规格说明和分解仍会通过常规 Workboard 工具进行。

## CLI 和斜杠命令

该插件注册一个根 CLI 命令：

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` 会调用正在运行的 Gateway 网关，因此 worker 启动时会使用与仪表板相同的子智能体运行时。如果 Gateway 网关不可用，它会回退到仅数据派发，因此依赖提升、陈旧声明清理和超时阻塞仍可运行。身份验证、权限和验证失败仍会作为命令错误暴露，显式 `--url` 或 `--token` 目标的失败也是如此。

`/workboard` 斜杠命令支持相同的紧凑操作员路径：
`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>` 和
`/workboard dispatch`。List 和 show 是面向已授权命令发送者的读取操作。Create 和 dispatch 在聊天表面上需要所有者状态，或需要具备 `operator.write` 或 `operator.admin` 的 Gateway 网关客户端。

请参阅 [Workboard CLI](/zh-CN/cli/workboard)，了解命令标志、JSON 输出、Gateway 网关回退行为、明确的 ID 前缀处理、派发选择规则和故障排除。

## 会话生命周期同步

卡片可以链接到现有仪表板会话，也可以链接到你从卡片开始工作时创建的会话。已链接卡片会内联显示会话生命周期：运行中、陈旧、已链接空闲、完成、失败或缺失。

如果已链接会话缺失，卡片会保留链接以提供上下文，并仍提供启动控件，以便你将工作重新启动到新的仪表板会话中。如果活跃的已链接会话停止报告近期活动，Workboard 会将卡片标记为陈旧，并将该标记存为卡片元数据，直到生命周期将其清除。

你也可以在会话标签页中使用添加到 Workboard 来捕获现有仪表板会话。该卡片会链接到该会话，使用会话标签或近期用户提示作为标题，并在聊天历史可用时，根据近期用户提示和最新智能体回复初始化备注。

当卡片仍处于活跃工作状态时，Workboard 会跟随已链接会话：

- 活跃的已链接会话 -> `running`
- 已完成的已链接会话 -> `review`
- 失败、被终止、超时或中止的已链接会话 -> `blocked`

手动 review 状态优先。如果你将卡片移动到 `review`、`blocked` 或 `done`，Workboard 会停止自动移动该卡片，直到你将它移回 `todo` 或
`running`。

## 仪表板工作流

1. 在 Control UI 中打开 Workboard 标签页。
2. 创建一张包含标题、备注、优先级、标签、可选智能体和可选已链接会话的卡片。
3. 或者打开会话并为现有会话选择添加到 Workboard。
4. 在列之间拖动卡片，或聚焦卡片上的紧凑状态控件，并使用其菜单或 ArrowLeft/ArrowRight。
5. 从卡片开始工作，以创建或复用一个仪表板会话。
6. 当智能体工作时，从卡片打开已链接会话。
7. 让生命周期同步将运行中的工作移动到 review 或 blocked，然后在验收后手动将卡片移动到 done。

启动卡片会使用常规 Gateway 网关会话。Workboard 插件只存储卡片元数据和链接；对话转录、模型选择和运行生命周期仍由常规会话系统拥有。

在实时已链接卡片上使用停止来中止活跃会话运行。Workboard 会将该卡片标记为 `blocked`，使它保持可见以便后续跟进。

新卡片可以从 Workboard 模板开始，用于 bug 修复、文档、发布、PR review 或插件工作。模板会预填标题、备注、标签和优先级，所选模板 ID 会作为卡片元数据存储。

## 权限

该插件会在 `workboard.*` 命名空间下注册 Gateway 网关 RPC 方法：

- `workboard.cards.list` 需要 `operator.read`
- `workboard.cards.export` 需要 `operator.read`
- `workboard.cards.diagnostics` 需要 `operator.read`
- `workboard.cards.diagnostics.refresh` 需要 `operator.write`
- 附件 list/get 和通知事件读取需要 `operator.read`
- 通知游标推进需要 `operator.write`
- 创建、更新、移动、删除、评论、链接、依赖链接、证明、工件、附件添加/删除、worker 日志、协议违规、声明、Heartbeat、发布、完成、阻塞、解除阻塞、派发、批量和归档方法需要
  `operator.write`

以只读操作员访问权限连接的浏览器可以查看看板，但不能修改卡片。

## 配置

Workboard 目前没有插件专属配置。请使用标准插件条目启用或禁用它：

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

再次禁用它：

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 故障排除

### 标签页显示 Workboard 不可用

检查插件策略：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请将 `workboard` 添加到该允许列表。如果
`plugins.deny` 包含 `workboard`，请在启用插件前移除它。

### 卡片未保存

确认浏览器连接具备 `operator.write` 访问权限。只读操作员会话可以列出卡片，但不能创建、编辑、移动或删除它们。

### 启动卡片未打开预期会话

Workboard 会创建指向常规仪表板会话的链接。检查卡片的智能体 ID 和已链接会话，然后打开会话或聊天视图以查看实际运行状态。

### 派发未启动 worker

确认至少有一张没有活跃声明的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告仅数据派发，请启动或重启 Gateway 网关后重试。仅数据派发会更新本地看板状态，但无法启动子智能体 worker 运行。

当同一所有者或智能体的另一张卡片已在运行或等待 review 时，卡片也可能被跳过。请先完成、阻塞或释放该活跃工作，再为同一所有者派发更多工作。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
