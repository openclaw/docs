---
read_when:
    - 你希望在 Control UI 中使用看板式工作面板
    - 你正在启用或禁用内置的 Workboard 插件
    - 你希望在不使用外部项目管理工具的情况下跟踪计划中的智能体工作
summary: 用于智能体自有卡片和会话交接的可选仪表板工作看板
title: Workboard 插件
x-i18n:
    generated_at: "2026-07-11T20:50:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件为 [Control UI](/zh-CN/web/control-ui) 添加了一个可选的看板式工作面板：适合智能体处理的工作卡片、将卡片分配给智能体，以及返回卡片所关联任务、运行和仪表板会话的链接。

Workboard 有意保持精简：它用于跟踪单个 OpenClaw Gateway 网关的本地运维工作。它不能替代 GitHub Issues、Linear、Jira 或其他团队项目管理系统。

## 启用

Workboard 已内置，但默认处于禁用状态：

1. 在 Control UI 中打开 **插件**，或使用相对于已配置 Control UI 基础路径的 `/settings/plugins`。例如，基础路径为 `/openclaw` 时，应使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 并选择 **启用**。由于 Workboard 随 OpenClaw 一同提供，因此无需执行 **安装** 操作。
3. 如果 UI 报告需要重启，请重启 Gateway 网关。

插件运行时加载后，Workboard 标签页会出现在仪表板导航栏中。禁用期间，该标签页不会显示在导航栏中。如果插件已禁用或被 `plugins.allow`/`plugins.deny` 阻止，直接打开 `/workboard` 路由会显示插件不可用状态，而不是卡片数据。

等效的 CLI 工作流程如下：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 配置

Workboard 没有插件专用配置。请使用标准插件条目启用或禁用它：

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
| 关联引用    | 可选的任务、运行、会话或来源 URL                                                                               |
| `execution` | 从卡片启动的 Codex/Claude 运行的可选元数据（引擎、模式、模型、会话、运行 ID、状态）                            |

卡片还包含精简元数据，用于记录尝试、评论、链接、证明、产物、自动化设置、附件、工作节点日志、工作节点协议状态、认领、诊断、通知、模板 ID、归档状态和过期会话检测，并附带最近事件列表（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。这些元数据让操作员无需打开关联会话即可查看卡片在面板中的流转过程；它们是本地运维上下文，不能替代会话记录或 GitHub Issue 历史记录。

卡片存储在插件自己的 Gateway 网关状态中，并会随该 Gateway 网关的其他 OpenClaw 状态一起迁移（参见[存储](#storage)）。

## 从卡片开始工作

未关联的卡片可以直接启动工作：

- **运行 Codex** / **运行 Claude** 会使用明确指定的引擎启动一个由任务跟踪的智能体运行，发送卡片提示词，并将卡片标记为 `running`。Codex 运行使用 `openai/gpt-5.6-sol`；Claude 运行使用 `anthropic/claude-sonnet-4-6`。
- **打开 Codex** / **打开 Claude** 会创建一个关联的仪表板会话，但不发送卡片提示词，也不移动卡片，适用于需要继续关联到面板的手动工作。

自主启动使用 Gateway 网关由任务跟踪的智能体运行路径（除非明确选择 Codex/Claude，否则使用默认智能体和模型）；随后 Workboard 会将生成的任务、运行 ID 和会话键关联回卡片。每个关联执行还会记录尝试摘要（引擎、模式、模型、运行 ID、时间戳、状态、滚动失败次数），使重复失败持续可见。

仪表板会从 Gateway 网关任务账本刷新任务状态，并通过任务 ID、运行 ID 或关联的会话键将任务与卡片匹配。处于排队或运行状态的任务会让卡片生命周期保持活跃；已完成、失败、超时或取消的任务会使用与关联会话相同的同步规则，将卡片转向 `review` 或 `blocked`（参见[会话生命周期同步](#session-lifecycle-sync)）。

## 智能体工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出带有认领/诊断状态的紧凑卡片；可选按看板筛选。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 返回一张卡片及有限的工作器上下文（备注、尝试、评论、链接、证明、产物、父卡片结果、受派者近期工作、活动诊断）。                               |
| `workboard_create`                                                                                                                               | 创建卡片，可选择指定父卡片、租户、技能、看板、工作区元数据、幂等键、运行时限和重试预算。                                                             |
| `workboard_link`                                                                                                                                 | 将父卡片链接到子卡片。所有父卡片达到 `done` 前，子卡片保持 `todo`；之后，调度提升会将其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 为调用方智能体认领卡片；将 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在较长时间的运行期间刷新认领 Heartbeat。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 在完成、暂停或交接后释放认领；可以将卡片移至下一状态。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用于记录最终摘要、证明、产物、已创建卡片清单（必须引用链接回已完成卡片的卡片）或阻塞原因的结构化生命周期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 在插件 SQLite 状态中存储小型卡片附件，为其建立卡片索引，并在工作器上下文中公开。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 记录工作器日志行；当自动化工作器停止但未调用 `workboard_complete`/`workboard_block` 时，阻塞该卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板元数据（显示名称、描述、归档状态、默认工作区）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 返回卡片的持久化运行尝试历史记录。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 将粗略的分流/待办卡片转化为已澄清的 `todo` 卡片；在卡片上记录规格摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 将父级编排卡片拆分为相互链接的子卡片，并继承看板/租户元数据；可使用已创建卡片清单完成父卡片。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知订阅。事件读取可安全重放；`advance` 移动持久游标，使调用方恢复时不会丢失或重复读取已完成/失败/陈旧的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 检查看板命名空间和队列统计信息。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 恢复或交接卡住的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 添加交接备注或附加证明/产物引用。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 将被阻塞的工作移回 `todo`。                                                                                                                                                         |
| `workboard_dispatch`                                                                                                                             | 触发依赖项提升或陈旧认领清理。                                                                                                                                        |

已认领的卡片会拒绝其他智能体通过智能体工具进行的变更，除非调用方
持有 `workboard_claim` 返回的认领令牌。智能体工具或 Gateway RPC 调用
返回的每张卡片都会将 `metadata.claim.token` 隐去为 `[redacted]`
（令牌本身仅由 `workboard_claim` 在顶层返回一次），
因此仪表板操作员和其他智能体可以检查认领状态，而永远不会
看到可用的令牌。恢复操作通过
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 进行，
这些操作不需要令牌。

## 调度

调度在 Gateway 网关本地执行：它不会生成任意操作系统进程。正常的
OpenClaw 子智能体会话仍负责执行。一次调度过程会：

1. 提升依赖项已就绪的卡片。
2. 在已就绪的卡片上记录调度元数据。
3. 阻塞认领已过期或运行已超时的卡片。
4. 将看板配置的分流卡片标记为编排候选项。
5. 认领一小批已就绪卡片，并通过
   Gateway 网关子智能体运行时启动工作器运行。

工作器会获得有限的卡片上下文，以及通过 Workboard 工具发送 Heartbeat、
完成或阻塞卡片所需的认领令牌。

### 工作器选择

默认情况下，每次调度**最多启动 3 个工作器**。已就绪卡片依次按
优先级、位置和创建时间排序。每次调度针对每个所有者/智能体仅启动一张卡片，
并跳过看板中已有工作处于运行或审查状态的所有者。
已归档的卡片、有活动认领的卡片以及状态不是 `ready`
的卡片绝不会被选中启动工作器（它们仍可能受调度的数据侧操作影响：
清理陈旧认领、提升依赖项、清理超时）。

每个看板/卡片的会话键是确定性的，因此重复调度会路由
回同一工作器通道，而不是创建无关的会话：

- 已分配卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未分配卡片：`subagent:workboard-<boardId>-<cardId>`（Gateway 网关解析
  已配置的默认智能体）

如果卡片被认领后无法启动工作器，Workboard 会阻塞该卡片、
清除认领、记录运行启动失败，并追加一行工作器
日志；该日志可在仪表板、CLI JSON、智能体工具和卡片
诊断中查看。

### 入口点

- 仪表板调度操作
- `openclaw workboard dispatch`
- 支持命令的渠道中的 `/workboard dispatch`

当 Gateway 网关可用时，这三种方式都使用 Gateway 网关子智能体运行时。CLI
提供一种操作员回退机制：如果 Gateway 网关调用因
连接/不可用错误而失败（或旧版 Gateway 网关返回 `unknown method` 错误），
且未指定明确的 `--url`/`--token` 目标，也未配置远程
Gateway 网关（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），CLI 会针对
本地 SQLite 状态运行仅数据调度；它可以提升依赖项、
清理陈旧认领并阻塞超时运行，但无法启动工作器。来自可访问
Gateway 网关的身份验证、权限和验证失败不会被视为不可用；
它们会作为命令错误显示。指定明确的 `--url`/`--token`
目标时发生的任何 Gateway 网关失败也同样如此。

看板元数据可以设置 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录此意图并
将其公开在工作器上下文中；实际的规格定义/拆分仍通过
常规 Workboard 工具进行。

## CLI 和斜杠命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 的文本输出默认隐藏已归档卡片（`--include-archived`
可覆盖此行为）；`--json` 始终包含已归档卡片，与现有脚本使用的完整卡片
契约一致。`show` 接受无歧义的 ID 前缀。
`list`、`create` 和 `show` 始终直接读写本地插件状态。
只有 `dispatch` 会调用正在运行的 Gateway 网关，并采用上述回退机制。

有关完整标志、JSON 输出、Gateway 网关回退行为、ID 前缀处理、
调度选择规则和故障排查，请参阅 [Workboard CLI](/zh-CN/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`
和 `/workboard dispatch` 与 CLI 对应。对于任何获得授权的命令发送者，
列表和查看都是读取操作。在聊天界面中，创建和调度要求所有者身份；
通过 Gateway 网关客户端操作时，则需要 `operator.write`/`operator.admin`。

## 会话生命周期同步

卡片可以链接到现有的仪表板会话，也可以链接到从卡片开始工作时创建的会话。已链接的卡片会内联显示会话生命周期：运行中、已过期、已链接但空闲、已完成、失败或缺失。你也可以在会话标签页中通过**添加到 Workboard**收录现有会话；卡片会链接到该会话，使用会话标签或最近的用户提示词作为标题，并在可用时使用最近的用户提示词和最新的助手响应预填备注。

如果链接的会话丢失，卡片会保留链接以提供上下文，并仍会提供启动控件，以便在全新会话中重新开始。如果活动的已链接会话停止报告近期活动，Workboard 会将卡片标记为 `stale`，并将其存储为元数据，直至生命周期将其清除。

当卡片处于活动工作状态时，Workboard 会跟随链接会话的状态：

| 已链接会话状态                        | 卡片状态    |
| ------------------------------------- | ----------- |
| 活动中                                | `running`   |
| 已完成                                | `review`    |
| 失败、被终止、超时或中止              | `blocked`   |

**手动审查状态优先。**将卡片移动到 `review`、`blocked` 或 `done` 会停止该卡片的自动同步，直到你将其移回 `todo` 或 `running`。

启动卡片会使用常规 Gateway 网关会话；Workboard 只存储卡片元数据和链接。对话记录、模型选择和运行生命周期仍由常规会话系统管理。对活动的已链接卡片使用**停止**可中止当前运行；Workboard 会将该卡片标记为 `blocked`，使其保持可见以便后续跟进。

新卡片可以从 Workboard 模板（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）开始。模板会预填标题、备注、标签和优先级；模板 ID 会存储为卡片元数据。

## 仪表板工作流程

1. 在 Control UI 中打开 Workboard 标签页。
2. 创建卡片并填写标题、备注、优先级、标签、可选智能体和可选的已链接会话；或者打开会话，为现有会话选择**添加到 Workboard**。
3. 在各列之间拖动卡片，或者聚焦其紧凑状态控件，然后使用菜单或 ArrowLeft/ArrowRight。
4. 从卡片开始工作，以创建或复用仪表板会话。
5. 智能体工作时，从卡片打开已链接的会话。
6. 让生命周期同步将运行中的工作移入 `review`/`blocked`，然后在工作获准后手动将卡片移到 `done`。

## 诊断

诊断根据本地卡片元数据计算。内置检查会标记：

| 类型                        | 条件                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已分配的 `todo`/`backlog`/`ready` 卡片超过 1 小时未更新。                       |
| `running_without_heartbeat` | `running` 卡片超过 20 分钟没有认领心跳或执行更新。                             |
| `blocked_too_long`          | `blocked` 卡片超过 24 小时未更新。                                              |
| `repeated_failures`         | 卡片记录的失败次数达到 2 次或更多。                                             |
| `missing_proof`             | `done` 卡片没有证明、产物或附件。                                               |
| `orphaned_session`          | `running` 卡片具有 `sessionKey`，但没有 `execution` 元数据。                    |

## 权限

Gateway 网关 RPC 方法位于 `workboard.*` 下：

| 权限范围         | 方法                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件列表/获取、通知事件读取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                                           |
| `operator.write` | `cards.diagnostics.refresh`、创建/更新/移动/删除/评论/链接/链接依赖项/证明/产物、添加/删除附件、工作节点日志、协议违规、认领/心跳/释放/提升/重新分配/重新认领/完成/阻塞/解除阻塞、`cards.dispatch`、`cards.bulk`、归档、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知订阅/删除/推进 |

没有 RPC 方法需要 `operator.admin`。以只读操作员权限连接的浏览器可以查看工作板，但不能修改卡片。

## 存储

Workboard 将持久数据存储在 OpenClaw 状态目录下由插件所有的关系型 SQLite 数据库中：工作板、卡片、标签、生命周期事件、运行尝试、评论、依赖链接、证明、产物引用、附件元数据和二进制内容、诊断、通知、工作节点日志、协议状态和订阅都存储在 Workboard 表中，而不是插件键值条目中。卡片导出会保留工作板叙事，但不会内联附件的二进制内容。

曾在 `.28` 版本中使用 Workboard 的安装可以运行 `openclaw doctor --fix`，将已发布的旧版插件状态命名空间（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在时的 `workboard.attachments`）迁移到关系型数据库。

## 故障排查

**标签页显示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请将 `workboard` 添加到其中。如果 `plugins.deny` 包含 `workboard`，请先将其移除，再启用插件。

**卡片无法保存**

确认浏览器连接具有 `operator.write` 权限。只读操作员会话可以列出卡片，但不能创建、编辑、移动或删除卡片。

**启动卡片后未打开预期会话**

检查卡片的智能体 ID 和已链接会话，然后打开会话或聊天以查看实际运行状态。

**分派未启动工作节点**

确认至少有一张没有活动认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告仅数据分派，请启动或重启 Gateway 网关后重试；仅数据分派会更新本地工作板状态，但无法启动子智能体工作节点运行。如果同一所有者或智能体的另一张卡片已在运行或等待审查，也可能会跳过卡片；请先完成、阻塞或释放该活动工作，再为同一所有者分派更多工作。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
