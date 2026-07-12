---
read_when:
    - 你希望在 Control UI 中使用看板式工作面板
    - 你正在启用或禁用内置的 Workboard 插件
    - 你希望在不使用外部项目管理工具的情况下跟踪智能体的计划工作
summary: 可选的工作面板仪表盘，用于智能体负责的卡片和会话交接
title: Workboard 插件
x-i18n:
    generated_at: "2026-07-12T14:40:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件为 [Control UI](/zh-CN/web/control-ui) 添加了一个可选的看板式工作面板：包含适合智能体处理的工作卡片、向智能体分配任务的功能，以及返回卡片对应任务、运行和仪表板会话的链接。

Workboard 刻意保持小巧：它跟踪单个 OpenClaw Gateway 网关的本地运维工作。它不能替代 GitHub Issues、Linear、Jira 或其他团队项目管理系统。

## 启用

Workboard 已内置，但默认禁用：

1. 在 Control UI 中打开 **插件**，或使用相对于所配置 Control UI 基础路径的 `/settings/plugins`。例如，基础路径为 `/openclaw` 时，应使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 并选择 **启用**。由于 Workboard 已包含在 OpenClaw 中，因此无需执行 **安装** 操作。
3. 如果 UI 报告需要重启，请重启 Gateway 网关。

插件运行时加载后，Workboard 标签页会出现在仪表板导航中。禁用期间，该标签页不会显示在导航中。插件被禁用或被 `plugins.allow`/`plugins.deny` 阻止时，直接打开 `/workboard` 路由会显示插件不可用状态，而不是卡片数据。

等效的 CLI 工作流为：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 配置

Workboard 没有插件专属配置。使用标准插件条目启用或禁用它：

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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 卡片字段

| 字段        | 值                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`                     |
| `priority`  | `low`、`normal`、`high`、`urgent`                                                                             |
| `labels`    | 自由格式字符串                                                                                                |
| `agentId`   | 可选的已分配智能体                                                                                            |
| 关联引用    | 可选的任务、运行、会话或来源 URL                                                                              |
| `execution` | 从卡片启动的 Codex/Claude 运行的可选元数据（引擎、模式、模型、会话、运行 ID、状态）                           |

卡片还包含以下内容的紧凑元数据：尝试、评论、链接、证明、工件、自动化设置、附件、工作节点日志、工作节点协议状态、认领、诊断、通知、模板 ID、归档状态和过期会话检测，以及最近事件列表（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。借助这些元数据，操作员无需打开关联会话即可了解卡片如何在工作面板中流转；它们是本地运维上下文，不能替代会话记录或 GitHub Issue 历史记录。

卡片存储在插件自身的 Gateway 网关状态中，并与该 Gateway 网关的其余 OpenClaw 状态一起迁移（参见[存储](#storage)）。

## 从卡片开始工作

未关联的卡片可以直接启动工作：

- **运行 Codex** / **运行 Claude** 使用明确指定的引擎启动由任务跟踪的智能体运行，发送卡片提示词，并将卡片标记为 `running`。Codex 运行使用 `openai/gpt-5.6-sol`；Claude 运行使用 `anthropic/claude-sonnet-4-6`。
- **打开 Codex** / **打开 Claude** 创建一个关联的仪表板会话，但不发送卡片提示词，也不移动卡片，适用于持续关联到工作面板的手动工作。

自主启动使用 Gateway 网关由任务跟踪的智能体运行路径（除非明确选择 Codex/Claude，否则使用默认智能体和模型）；随后，Workboard 会将生成的任务、运行 ID 和会话键关联回卡片。每个关联的执行还会记录尝试摘要（引擎、模式、模型、运行 ID、时间戳、状态、滚动失败次数），使重复失败始终可见。

仪表板从 Gateway 网关任务账本刷新任务状态，并通过任务 ID、运行 ID 或关联的会话键将任务与卡片进行匹配。处于排队或运行状态的任务会使卡片生命周期保持活跃；已完成、失败、超时或取消的任务会按照与关联会话相同的同步规则，将卡片移向 `review` 或 `blocked`（参见[会话生命周期同步](#session-lifecycle-sync)）。

## 智能体工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含认领/诊断状态的紧凑卡片；可选择按看板筛选。                                                                                                                                    |
| `workboard_read`                                                                                                                                 | 返回一张卡片及有界的工作器上下文（备注、尝试、评论、链接、证明、工件、父级结果、被分配者近期工作、活动诊断）。                                                                         |
| `workboard_create`                                                                                                                               | 创建卡片，可选指定父级、租户、Skills、看板、工作区元数据、幂等键、运行时限和重试预算。                                                                                                |
| `workboard_link`                                                                                                                                 | 将父卡片链接到子卡片。所有父卡片达到 `done` 前，子卡片保持 `todo`；之后，分派提升会将其移至 `ready`。                                                                                 |
| `workboard_claim`                                                                                                                                | 为调用方智能体认领卡片；将 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                                  |
| `workboard_heartbeat`                                                                                                                            | 在较长时间的运行期间刷新认领心跳。                                                                                                                                                      |
| `workboard_release`                                                                                                                              | 在完成、暂停或移交后释放认领；可以将卡片移至下一状态。                                                                                                                                  |
| `workboard_complete` / `workboard_block`                                                                                                         | 用于最终摘要、证明、工件和已创建卡片清单（必须引用链接回已完成卡片的卡片）或阻塞原因的结构化生命周期工具。                                                                             |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 将小型卡片附件存储在插件 SQLite 状态中，在卡片上建立索引，并在工作器上下文中公开。                                                                                                      |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 记录工作器日志行；当自动化工作器停止但未调用 `workboard_complete`/`workboard_block` 时，阻塞卡片。                                                                                     |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板元数据（显示名称、描述、归档状态、默认工作区）。                                                                                                                        |
| `workboard_runs`                                                                                                                                 | 返回卡片的持久化运行尝试历史记录。                                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 将粗略的分诊/待办卡片转变为已澄清的 `todo` 卡片；在卡片上记录规格摘要。                                                                                                                |
| `workboard_decompose`                                                                                                                            | 将父级编排卡片拆分为相互链接的子卡片，并继承看板/租户元数据；可以使用已创建卡片清单完成父卡片。                                                                                        |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知订阅。事件读取支持安全重放；`advance` 移动持久游标，使调用方恢复时不会丢失或重复读取已完成/失败/过期的卡片事件。                                                               |
| `workboard_boards` / `workboard_stats`                                                                                                           | 检查看板命名空间和队列统计信息。                                                                                                                                                        |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 恢复或移交卡住的工作。                                                                                                                                                                  |
| `workboard_comment` / `workboard_proof`                                                                                                          | 添加移交备注或附加证明/工件引用。                                                                                                                                                       |
| `workboard_unblock`                                                                                                                              | 将被阻塞的工作移回 `todo`。                                                                                                                                                             |
| `workboard_dispatch`                                                                                                                             | 触发依赖提升或过期认领清理。                                                                                                                                                            |

已认领的卡片会拒绝其他智能体通过智能体工具执行的变更，除非调用方
持有 `workboard_claim` 返回的认领令牌。智能体工具或 Gateway 网关 RPC 调用返回的
每张卡片都会将 `metadata.claim.token` 脱敏为 `[redacted]`
（令牌本身仅由 `workboard_claim` 在顶层返回一次），
因此仪表板操作员和其他智能体可以检查认领状态，而永远不会
看到可用的令牌。恢复通过
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 进行，这些操作
不需要令牌。

## 分派

分派在 Gateway 网关本地执行：它不会生成任意操作系统进程。正常的
OpenClaw 子智能体会话仍负责执行。一次分派过程：

1. 提升依赖已就绪的卡片。
2. 在就绪卡片上记录分派元数据。
3. 阻塞认领已过期或运行已超时的卡片。
4. 将看板配置的分诊卡片标记为编排候选项。
5. 认领一小批就绪卡片，并通过
   Gateway 网关子智能体运行时启动工作器运行。

工作器会获得有界的卡片上下文，以及通过 Workboard 工具发送心跳、
完成或阻塞卡片所需的认领令牌。

### 工作器选择

每次分派默认启动**最多 3 个工作器**。就绪卡片先按
优先级排序，再按位置排序，最后按创建时间排序。每次分派只为每个
所有者/智能体启动一张卡片，并跳过看板上已有运行中或审核中工作的
所有者。已归档卡片、具有活动认领的卡片和状态不是 `ready` 的卡片
绝不会被选中启动工作器（但它们仍可能受分派的数据侧操作影响：
过期认领清理、依赖提升、超时清理）。

每个看板/卡片的会话键是确定性的，因此重复分派会路由
回同一个工作器通道，而不是创建无关会话：

- 已分配卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未分配卡片：`subagent:workboard-<boardId>-<cardId>`（Gateway 网关会解析
  已配置的默认智能体）

如果卡片被认领后无法启动工作器，Workboard 会阻塞该
卡片、清除认领、记录运行启动失败，并追加一行工作器
日志——可在仪表板、CLI JSON、智能体工具和卡片
诊断中查看。

### 入口点

- 仪表板分派操作
- `openclaw workboard dispatch`
- 支持命令的渠道上的 `/workboard dispatch`

当 Gateway 网关可用时，这三者都使用 Gateway 网关子智能体运行时。CLI
有一种操作员回退机制：如果 Gateway 网关调用因
连接/不可用错误（或旧版 Gateway 网关的 `unknown method` 错误）而失败，
并且没有显式的 `--url`/`--token` 目标，也未配置远程
Gateway 网关（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），CLI 会针对
本地 SQLite 状态运行仅数据分派——它可以提升依赖、
清理过期认领并阻塞超时运行，但无法启动工作器。可访问的 Gateway 网关返回的身份验证、
权限和验证失败不会被视为不可用；它们会显示为命令错误，
显式提供 `--url`/`--token` 目标时发生的任何 Gateway 网关
故障也同样如此。

看板元数据可以设置 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录此意图并
在工作器上下文中公开它；实际的规格说明/拆分仍然通过
常规 Workboard 工具运行。

## CLI 和斜杠命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "修复过期卡片生命周期" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文本输出默认隐藏已归档卡片（`--include-archived`
可覆盖此行为）；`--json` 始终包含已归档卡片，与现有脚本使用的完整卡片
契约保持一致。`show` 接受无歧义的 ID 前缀。
`list`、`create` 和 `show` 始终直接读取/写入本地插件状态。
只有 `dispatch` 会调用正在运行的 Gateway 网关，并使用上述回退机制。

有关完整标志、JSON 输出、Gateway 网关回退行为、ID 前缀处理、分派选择规则和
故障排除，请参阅 [Workboard CLI](/zh-CN/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`
和 `/workboard dispatch` 与 CLI 对应。对于任何已获授权的命令发送者，
列表和查看都是读取操作。在聊天界面上，创建和分派要求所有者状态；
对于 Gateway 网关客户端，则要求 `operator.write`/`operator.admin`。

## 会话生命周期同步

卡片可以链接到现有的仪表盘会话，也可以链接到你从卡片开始工作时创建的会话。已链接的卡片会内联显示会话生命周期：运行中、已过时、已链接但空闲、已完成、失败或缺失。你还可以在会话选项卡中使用 **添加到 Workboard** 来捕获现有会话；卡片会链接到该会话，使用会话标签或最近的用户提示作为标题，并在可用时根据最近的用户提示和最新的智能体回复预填备注。

如果链接的会话缺失，卡片会保留链接以提供上下文，并继续提供开始控件，以便在新会话中重新开始。如果活跃的链接会话停止报告近期活动，Workboard 会将卡片标记为 `stale`，并将其存储为元数据，直到生命周期将其清除。

当卡片处于活跃工作状态时，Workboard 会跟随链接会话：

| 链接会话状态                          | 卡片状态    |
| ------------------------------------- | ----------- |
| 活跃                                  | `running`   |
| 已完成                                | `review`    |
| 失败、被终止、超时或中止              | `blocked`   |

**手动审核状态优先。** 将卡片移至 `review`、`blocked` 或 `done`
会停止该卡片的自动同步，直到你将其移回 `todo` 或 `running`。

开始处理卡片会使用常规 Gateway 网关会话；Workboard 仅存储卡片元数据和链接。对话记录、模型选择和运行生命周期仍由常规会话系统负责。对实时链接的卡片使用 **停止** 可中止活跃运行——Workboard 会将该卡片标记为 `blocked`，使其保持可见，以便后续跟进。

新卡片可以从 Workboard 模板（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）开始。模板会预填标题、备注、标签和优先级；模板 ID 会存储为卡片元数据。

## 仪表盘工作流

1. 在 Control UI 中打开 Workboard 选项卡。
2. 创建一张卡片，填写标题、备注、优先级、标签、可选智能体和可选链接会话；或者打开会话，为现有会话选择 **添加到 Workboard**。
3. 在列之间拖动卡片，或者聚焦其紧凑状态控件，并使用菜单或 ArrowLeft/ArrowRight。
4. 从卡片开始工作，以创建或复用仪表盘会话。
5. 智能体工作时，从卡片中打开链接会话。
6. 让生命周期同步将运行中的工作移至 `review`/`blocked`，然后在验收后手动将卡片移至 `done`。

## 诊断

诊断根据本地卡片元数据计算。内置检查会标记：

| 类型                        | 条件                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已分配且状态为 `todo`/`backlog`/`ready` 的卡片超过 1 小时未更新。              |
| `running_without_heartbeat` | `running` 卡片超过 20 分钟没有认领 Heartbeat 或执行更新。                      |
| `blocked_too_long`          | `blocked` 卡片超过 24 小时未更新。                                             |
| `repeated_failures`         | 卡片记录的失败次数达到 2 次或更多。                                            |
| `missing_proof`             | `done` 卡片没有证明、工件或附件。                                              |
| `orphaned_session`          | `running` 卡片具有 `sessionKey`，但没有 `execution` 元数据。                   |

## 权限

Gateway 网关 RPC 方法位于 `workboard.*` 下：

| 权限范围         | 方法                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件读取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                                          |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、工作节点日志、协议违规、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

没有 RPC 方法需要 `operator.admin`。使用只读操作员访问权限连接的浏览器可以查看看板，但不能修改卡片。

## 存储

Workboard 将持久数据存储在 OpenClaw 状态目录下由插件拥有的关系型 SQLite 数据库中：看板、卡片、标签、生命周期事件、运行尝试、评论、依赖链接、证明、工件引用、附件元数据和二进制内容、诊断、通知、工作节点日志、协议状态和订阅均存储在 Workboard 表中（而不是插件键值条目中）。卡片导出会保留看板叙事，但不会内联附件的二进制内容。

在 `.28` 版本中使用过 Workboard 的安装可以运行
`openclaw doctor --fix`，将已发布的旧版插件状态命名空间
（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在时的
`workboard.attachments`）迁移到关系型数据库。

## 故障排查

**选项卡显示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请将 `workboard` 添加到其中。如果 `plugins.deny`
包含 `workboard`，请先将其移除，再启用该插件。

**卡片无法保存**

确认浏览器连接具有 `operator.write` 访问权限。只读操作员会话可以列出卡片，但不能创建、编辑、移动或删除卡片。

**开始处理卡片时未打开预期会话**

检查卡片的智能体 ID 和链接会话，然后打开会话或聊天以查看实际运行状态。

**调度未启动工作节点**

确认至少有一张没有活跃认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告仅数据调度，请启动或重启 Gateway 网关后重试——仅数据调度会更新本地看板状态，但无法启动子智能体工作节点运行。如果同一所有者或智能体的另一张卡片已在运行或等待审核，卡片也可能被跳过；在为同一所有者调度更多工作之前，请先完成、阻塞或释放该活跃工作。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
