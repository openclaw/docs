---
read_when:
    - 你需要 Control UI 中的看板式工作板
    - 你正在启用或禁用内置的 Workboard 插件
    - 你想在不使用外部项目管理工具的情况下跟踪计划中的智能体工作
summary: 可选的仪表板 Workboard，用于 Agent 拥有的卡片和会话交接
title: Workboard 插件
x-i18n:
    generated_at: "2026-07-06T21:51:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e76d9f64d6117b1a9486270e385d79334a11b2658853473beaf9fb23f8327b00
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件会向 [Control UI](/zh-CN/web/control-ui) 添加一个可选的 Kanban 风格看板：适合智能体粒度的工作卡片、分配给智能体，以及返回卡片对应任务、运行和仪表盘会话的链接。

Workboard 有意保持小巧：它跟踪一个 OpenClaw Gateway 网关的本地操作工作。它不是 GitHub Issues、Linear、Jira 或其他团队项目管理系统的替代品。

## 启用它

Workboard 已内置，但默认禁用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

启用该插件后，Workboard 标签页会出现在仪表盘导航中；禁用时，该标签页会从导航中隐藏。当插件被禁用或被 `plugins.allow`/`plugins.deny` 阻止时，直接打开 `/workboard` 路由会显示插件不可用状态，而不是卡片数据。

## 配置

Workboard 没有插件专属配置。使用标准插件条目启用/禁用它：

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

| 字段        | 取值                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | 自由格式字符串                                                                                                |
| `agentId`   | 可选的已分配智能体                                                                                            |
| 关联引用    | 可选的任务、运行、会话或源 URL                                                                                |
| `execution` | 从卡片启动的 Codex/Claude 运行的可选元数据（引擎、模式、模型、会话、运行 id、状态）                          |

卡片还会携带紧凑的元数据，用于记录尝试、评论、链接、证明、工件、自动化设置、附件、worker 日志、worker 协议状态、声明、诊断、通知、模板 id、归档状态和陈旧会话检测，并包含最近事件列表（`created`, `edited`, `moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`, `execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`, `link_added`, `proof_added`, `artifact_added`, `attachment_added`, `diagnostic`, `notification`, `dispatch`, `orchestration`, `protocol_violation`, `archived`, `unarchived`, `stale`）。这些元数据让操作员无需打开关联会话，就能看到卡片如何在看板中流转；它是本地操作上下文，不是会话转录或 GitHub issue 历史的替代品。

卡片存储在该插件自己的 Gateway 网关状态中，并会随该 Gateway 网关的其他 OpenClaw 状态一起移动（参见 [存储](#storage)）。

## 从卡片开始工作

未关联的卡片可以直接开始工作：

- **运行 Codex** / **运行 Claude** 会以显式引擎启动一个跟踪任务的智能体运行，发送卡片提示，并将卡片标记为 `running`。Codex 运行使用 `openai/gpt-5.5`；Claude 运行使用 `anthropic/claude-sonnet-4-6`。
- **打开 Codex** / **打开 Claude** 会创建一个已关联的仪表盘会话，但不发送卡片提示，也不移动卡片，用于保持挂接到看板的手动工作。

自主启动使用 Gateway 网关的跟踪任务智能体运行路径（默认智能体和模型，除非显式选择 Codex/Claude）；随后 Workboard 会把生成的任务、运行 id 和会话键关联回卡片。每个已关联执行还会记录一次尝试摘要（引擎、模式、模型、运行 id、时间戳、状态、滚动失败次数），因此重复失败会保持可见。

仪表盘会从 Gateway 网关任务账本刷新任务状态，并按任务 id、运行 id 或已关联会话键将任务匹配到卡片。排队中/运行中的任务会让卡片生命周期保持活跃；已完成、失败、超时或已取消的任务会使用与已关联会话相同的同步规则，将卡片推进到 `review` 或 `blocked`（参见 [会话生命周期同步](#session-lifecycle-sync)）。

## 智能体工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `workboard_list`                                                                                                                                 | 列出带有声明/诊断状态的紧凑卡片；可选看板过滤器。                                                                                                                                         |
| `workboard_read`                                                                                                                                 | 返回一张卡片以及有界 worker 上下文（备注、尝试、评论、链接、证明、工件、父级结果、最近的负责人工作、活动诊断）。                                                                         |
| `workboard_create`                                                                                                                               | 创建一张卡片，可附带可选父级、租户、Skills、看板、工作区元数据、幂等键、运行时限制、重试预算。                                                                                           |
| `workboard_link`                                                                                                                                 | 将父卡片链接到子卡片。子卡片会保持 `todo`，直到每个父卡片都达到 `done`，然后调度提升会将它们移动到 `ready`。                                                                              |
| `workboard_claim`                                                                                                                                | 为调用智能体声明一张卡片；将 `backlog`/`todo`/`ready` 移动到 `running`。                                                                                                                   |
| `workboard_heartbeat`                                                                                                                            | 在较长运行期间刷新声明心跳。                                                                                                                                                              |
| `workboard_release`                                                                                                                              | 在完成、暂停或移交后释放声明；可以将卡片移动到下一个状态。                                                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用于最终摘要、证明、工件和已创建卡片清单（必须引用链接回已完成卡片的卡片）或阻塞原因的结构化生命周期工具。                                                                               |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 将小型卡片附件存储在插件 SQLite 状态中，在卡片上建立索引，并暴露到 worker 上下文中。                                                                                                      |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 记录 worker 日志行，并在自动化 worker 未调用 `workboard_complete`/`workboard_block` 就停止时阻塞卡片。                                                                                    |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化看板元数据（显示名称、描述、归档状态、默认工作区）。                                                                                                                            |
| `workboard_runs`                                                                                                                                 | 返回一张卡片的持久化运行尝试历史。                                                                                                                                                        |
| `workboard_specify`                                                                                                                              | 将粗略的分诊/待办卡片转为澄清后的 `todo` 卡片；在卡片上记录规格摘要。                                                                                                                     |
| `workboard_decompose`                                                                                                                            | 将父级编排卡片展开为已关联的子卡片，并继承看板/租户元数据；可以用已创建卡片清单完成父卡片。                                                                                              |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知订阅。事件读取可安全重放；`advance` 会移动持久游标，使调用方恢复时不会丢失或重复读取已完成/失败/陈旧卡片事件。                                                                    |
| `workboard_boards` / `workboard_stats`                                                                                                           | 检查看板命名空间和队列统计信息。                                                                                                                                                          |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 恢复或移交卡住的工作。                                                                                                                                                                    |
| `workboard_comment` / `workboard_proof`                                                                                                          | 添加移交备注或附加证明/工件引用。                                                                                                                                                         |
| `workboard_unblock`                                                                                                                              | 将被阻塞的工作移回 `todo`。                                                                                                                                                               |
| `workboard_dispatch`                                                                                                                             | 触发依赖提升或陈旧声明清理。                                                                                                                                                              |

已认领的卡片会拒绝来自其他智能体的智能体工具变更，除非调用方持有 `workboard_claim` 返回的认领令牌。智能体工具或 Gateway 网关 RPC 调用返回的每张卡片都会将 `metadata.claim.token` 脱敏为 `[redacted]`（令牌本身只会由 `workboard_claim` 以顶层字段返回一次），因此仪表板操作员和其他智能体可以检查认领状态，而永远不会看到可用令牌。恢复通过 `workboard_promote`/`workboard_reassign`/`workboard_reclaim` 进行，这些操作不需要令牌。

## 调度

调度是 Gateway 网关本地的：它不会生成任意 OS 进程。正常的 OpenClaw 子智能体会话仍然拥有执行权。一次调度流程会：

1. 提升依赖已就绪的卡片。
2. 在就绪卡片上记录调度元数据。
3. 阻止过期认领或超时运行。
4. 将按看板配置的分诊卡片标记为编排候选项。
5. 认领一小批就绪卡片，并通过 Gateway 网关子智能体运行时启动 worker 运行。

Worker 会获得有界的卡片上下文，以及通过 Workboard 工具对卡片执行 heartbeat、complete 或 block 所需的认领令牌。

### Worker 选择

默认情况下，每次调度**最多启动 3 个 worker**。就绪卡片按优先级排序，然后按位置排序，再按创建时间排序。一次调度只会为每个 owner/智能体启动一张卡片，并跳过看板上已有运行中或 review 工作的 owner。已归档卡片、已有活跃认领的卡片，以及状态不是 `ready` 的卡片，永远不会被选中用于启动 worker（它们仍可能受到调度的数据侧影响：陈旧认领清理、依赖提升、超时清理）。

会话键按看板/卡片确定性生成，因此重复调度会路由回同一个 worker 通道，而不是创建无关会话：

- 已分配卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未分配卡片：`subagent:workboard-<boardId>-<cardId>`（Gateway 网关解析已配置的默认智能体）

如果卡片已被认领后无法启动 worker，Workboard 会阻止该卡片、清除认领、记录运行启动失败，并追加一条 worker 日志行 - 可在仪表板、CLI JSON、智能体工具和卡片诊断中查看。

### 入口点

- 仪表板调度操作
- `openclaw workboard dispatch`
- 支持命令的渠道上的 `/workboard dispatch`

当 Gateway 网关可用时，这三者都会使用 Gateway 网关子智能体运行时。CLI 有一个操作员回退路径：如果 Gateway 网关调用因连接/不可用错误失败（或旧版 Gateway 网关返回 `unknown method` 错误），并且没有显式的 `--url`/`--token` 目标，也没有适用的已配置远程 Gateway 网关（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），CLI 会针对本地 SQLite 状态运行仅数据调度 - 它可以提升依赖、清理陈旧认领、阻止超时运行，但不能启动 worker。来自可访问 Gateway 网关的身份验证、权限和校验失败不会被视为不可用；它们会作为命令错误浮现；当给定了显式 `--url`/`--token` 目标时，任何 Gateway 网关失败也同样如此。

看板元数据可以设置 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录此意图并在 worker 上下文中公开；实际的规格说明/分解仍通过正常的 Workboard 工具运行。

## CLI 和斜杠命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文本输出默认隐藏已归档卡片（`--include-archived` 会覆盖）；`--json` 始终包含已归档卡片，与现有脚本使用的完整卡片契约一致。`show` 接受无歧义的 ID 前缀。`list`、`create` 和 `show` 始终直接读写本地插件状态。只有 `dispatch` 会调用正在运行的 Gateway 网关，并使用上文所述的回退行为。

完整标志、JSON 输出、Gateway 网关回退行为、ID 前缀处理、调度选择规则和故障排查，请参阅 [Workboard CLI](/zh-CN/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>` 和 `/workboard dispatch` 与 CLI 对应。List 和 show 对任何已授权命令发送者都是读取操作。Create 和 dispatch 在聊天界面上需要 owner 状态，或需要具备 `operator.write`/`operator.admin` 的 Gateway 网关客户端。

## 会话生命周期同步

卡片可以链接到现有仪表板会话，也可以链接到从卡片开始工作时创建的会话。已链接卡片会内联显示会话生命周期：running、stale、linked idle、done、failed 或 missing。你也可以在 Sessions 标签页中使用 **Add to Workboard** 捕获现有会话；该卡片会链接到该会话，使用会话标签或最近的用户提示作为标题，并在可用时使用最近的用户提示加最新的助手响应填充 notes。

如果链接的会话缺失，卡片会保持链接以保留上下文，并仍提供启动控件以重启到新会话。如果一个活跃的已链接会话停止报告近期活动，Workboard 会将卡片标记为 `stale`，并将其作为元数据存储，直到生命周期清除它。

当卡片处于活跃工作状态时，Workboard 会跟随已链接会话：

| 已链接会话状态                          | 卡片状态    |
| --------------------------------------- | ----------- |
| active                                  | `running`   |
| completed                               | `review`    |
| failed、killed、timed out 或 aborted    | `blocked`   |

**手动 review 状态优先。** 将卡片移动到 `review`、`blocked` 或 `done` 会停止该卡片的自动同步，直到你将其移回 `todo` 或 `running`。

启动卡片会使用正常的 Gateway 网关会话；Workboard 只存储卡片元数据和链接。对话 transcript、模型选择和运行生命周期仍由常规会话系统拥有。对一个实时已链接卡片使用 **Stop** 可中止活跃运行 - Workboard 会将该卡片标记为 `blocked`，使其保持可见以便后续处理。

新卡片可以从 Workboard 模板（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）开始。模板会预填标题、notes、标签和优先级；模板 ID 会存储为卡片元数据。

## 仪表板工作流

1. 在 Control UI 中打开 Workboard 标签页。
2. 创建一张带有标题、notes、优先级、标签、可选智能体和可选已链接会话的卡片 - 或打开 Sessions 并为现有会话选择 **Add to Workboard**。
3. 在列之间拖动卡片，或聚焦其紧凑状态控件并使用菜单或 ArrowLeft/ArrowRight。
4. 从卡片开始工作，以创建或复用仪表板会话。
5. 在智能体工作时，从卡片打开已链接会话。
6. 让生命周期同步把运行中的工作移动到 `review`/`blocked`，然后在接受后手动将卡片移动到 `done`。

## 诊断

诊断根据本地卡片元数据计算。内置检查会标记：

| 类型                        | 条件                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已分配的 `todo`/`backlog`/`ready` 卡片超过 1 小时未更新。                     |
| `running_without_heartbeat` | `running` 卡片超过 20 分钟没有认领 heartbeat 或执行更新。                     |
| `blocked_too_long`          | `blocked` 卡片超过 24 小时未更新。                                            |
| `repeated_failures`         | 卡片跟踪的失败计数达到 2 次或更多。                                           |
| `missing_proof`             | `done` 卡片没有 proof、artifacts 或 attachments。                              |
| `orphaned_session`          | `running` 卡片有 `sessionKey`，但没有 `execution` 元数据。                    |

## 权限

Gateway 网关 RPC 方法位于 `workboard.*` 下：

| 权限范围         | 方法                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、attachment list/get、notification event reads、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                      |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、attachment add/delete、worker log、protocol violation、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、notification subscribe/delete/advance |

没有 RPC 方法需要 `operator.admin`。以只读操作员访问权限连接的浏览器可以检查看板，但不能变更卡片。

## 存储

Workboard 将持久数据存储在 OpenClaw 状态目录下由插件拥有的关系型 SQLite 数据库中：boards、cards、labels、lifecycle events、run attempts、comments、dependency links、proof、artifact references、attachment metadata and blobs、diagnostics、notifications、worker logs、protocol state 和 subscriptions 都位于 Workboard 表中（不是插件键值条目）。卡片导出会保留看板叙事，而不会内联 attachment blob 内容。

在 `.28` 版本中使用过 Workboard 的安装可以运行 `openclaw doctor --fix`，将已发布的旧版插件状态命名空间（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及如果存在的 `workboard.attachments`）迁移到关系型数据库中。

## 故障排查

**标签页显示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请向其中添加 `workboard`。如果 `plugins.deny` 包含 `workboard`，请先移除它再启用插件。

**卡片无法保存**

确认浏览器连接具有 `operator.write` 访问权限。只读操作员会话可以列出卡片，但不能创建、编辑、移动或删除卡片。

**启动卡片没有打开预期会话**

检查卡片的智能体 ID 和已链接会话，然后打开 Sessions 或 Chat 检查实际运行状态。

**调度没有启动 worker**

确认至少有一张没有活跃认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告仅数据调度，请启动或重启 Gateway 网关并重试 - 仅数据调度会更新本地看板状态，但不能启动子智能体 worker 运行。当同一 owner 或智能体的另一张卡片已经在运行或等待 review 时，卡片也可能被跳过；在为同一 owner 调度更多卡片前，请 complete、block 或 release 该活跃工作。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
