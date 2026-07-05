---
read_when:
    - 你想在 Control UI 中使用看板式 workboard
    - 你正在启用或禁用内置的 Workboard 插件
    - 你想在没有外部项目管理工具的情况下跟踪计划中的智能体工作
summary: 可选的仪表盘 workboard，用于智能体拥有的卡片和会话交接
title: Workboard 插件
x-i18n:
    generated_at: "2026-07-05T11:33:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70ac13ef747af38e49eb49866a9bae7a06f53b8b0b5765f47d0d0cfd2d7b4bc1
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件为 [Control UI](/zh-CN/web/control-ui) 添加了一个可选的看板式工作板：面向智能体规模的工作卡、分配给智能体，以及回链到该卡片的任务、运行和仪表板会话。

Workboard 刻意保持小巧：它跟踪一个 OpenClaw Gateway 网关的本地运营工作。它不是 GitHub Issues、Linear、Jira 或其他团队项目管理系统的替代品。

## 启用它

Workboard 已内置，但默认禁用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

Workboard 标签页会显示在仪表板导航中。如果该标签页可见，但插件被禁用，或被 `plugins.allow`/`plugins.deny` 阻止，该标签页会显示插件不可用状态，而不是卡片数据。

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
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | 自由格式字符串                                                                                                |
| `agentId`   | 可选的已分配智能体                                                                                            |
| linked refs | 可选任务、运行、会话或源 URL                                                                                  |
| `execution` | 从卡片启动的 Codex/Claude 运行的可选元数据（引擎、模式、模型、会话、运行 ID、状态）                           |

卡片还携带用于尝试、评论、链接、证明、制品、自动化设置、附件、worker 日志、worker 协议状态、认领、诊断、通知、模板 ID、归档状态和陈旧会话检测的紧凑元数据，以及近期事件列表（`created`, `edited`, `moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`, `execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`, `link_added`, `proof_added`, `artifact_added`, `attachment_added`, `diagnostic`, `notification`, `dispatch`, `orchestration`, `protocol_violation`, `archived`, `unarchived`, `stale`）。这些元数据让操作员无需打开已链接会话，也能看到卡片如何在工作板中流转；它是本地运营上下文，不是会话转录或 GitHub issue 历史的替代品。

卡片存储在插件自己的 Gateway 网关状态中，并会随该 Gateway 网关其余的 OpenClaw 状态一起移动（参见 [存储](#storage)）。

## 从卡片开始工作

未链接的卡片可以直接开始工作：

- **运行 Codex** / **运行 Claude** 会启动带任务跟踪的智能体运行，使用显式引擎，发送卡片提示，并将卡片标记为 `running`。Codex 运行使用 `openai/gpt-5.5`；Claude 运行使用 `anthropic/claude-sonnet-4-6`。
- **打开 Codex** / **打开 Claude** 会创建一个已链接的仪表板会话，但不会发送卡片提示，也不会移动卡片，用于保持附加到工作板的手动工作。

自主启动使用 Gateway 网关的带任务跟踪智能体运行路径（默认智能体和模型，除非显式选择 Codex/Claude）；随后 Workboard 会把生成的任务、运行 ID 和会话键链接回卡片。每个已链接的执行还会记录一次尝试摘要（引擎、模式、模型、运行 ID、时间戳、状态、滚动失败计数），以便重复失败保持可见。

仪表板会从 Gateway 网关任务账本刷新任务状态，并按任务 ID、运行 ID 或已链接会话键将任务匹配到卡片。排队中或运行中的任务会让卡片的生命周期保持活跃；已完成、失败、超时或已取消的任务会使用与已链接会话相同的同步规则，将卡片移向 `review` 或 `blocked`（参见 [会话生命周期同步](#session-lifecycle-sync)）。

## 智能体工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出带有认领/诊断状态的紧凑卡片；可选工作板筛选器。                                                                                                                                      |
| `workboard_read`                                                                                                                                 | 返回一张卡片以及有界的 worker 上下文（备注、尝试、评论、链接、证明、制品、父级结果、近期分配对象工作、活动诊断）。                                                                       |
| `workboard_create`                                                                                                                               | 创建卡片，可带可选父级、租户、Skills、工作板、工作空间元数据、幂等键、运行时限制、重试预算。                                                                                             |
| `workboard_link`                                                                                                                                 | 将父卡片链接到子卡片。子卡片会保持 `todo`，直到每个父级都达到 `done`，然后调度提升会把它们移动到 `ready`。                                                                               |
| `workboard_claim`                                                                                                                                | 为调用智能体认领一张卡片；将 `backlog`/`todo`/`ready` 移入 `running`。                                                                                                                    |
| `workboard_heartbeat`                                                                                                                            | 在较长运行期间刷新认领心跳。                                                                                                                                                             |
| `workboard_release`                                                                                                                              | 在完成、暂停或交接后释放认领；可以将卡片移动到下一个状态。                                                                                                                               |
| `workboard_complete` / `workboard_block`                                                                                                         | 用于最终摘要、证明、制品和已创建卡片清单（必须引用链接回已完成卡片的卡片）或阻塞原因的结构化生命周期工具。                                                                              |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 在插件 SQLite 状态中存储小型卡片附件，在卡片上建立索引，并在 worker 上下文中暴露。                                                                                                       |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 记录 worker 日志行，并在自动化 worker 未调用 `workboard_complete`/`workboard_block` 就停止时阻塞卡片。                                                                                   |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化工作板元数据（显示名称、描述、归档状态、默认工作空间）。                                                                                                                       |
| `workboard_runs`                                                                                                                                 | 返回卡片的持久化运行尝试历史。                                                                                                                                                           |
| `workboard_specify`                                                                                                                              | 将粗略的分诊/积压卡片转为已澄清的 `todo` 卡片；在卡片上记录规格摘要。                                                                                                                    |
| `workboard_decompose`                                                                                                                            | 将父级编排卡片展开为已链接的子卡片，并继承工作板/租户元数据；可以使用已创建卡片清单完成父卡片。                                                                                         |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知订阅。事件读取支持安全重放；`advance` 会移动持久游标，让调用方恢复时不会丢失或重复读取已完成/失败/陈旧的卡片事件。                                                             |
| `workboard_boards` / `workboard_stats`                                                                                                           | 检查工作板命名空间和队列统计信息。                                                                                                                                                       |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 恢复或交接卡住的工作。                                                                                                                                                                   |
| `workboard_comment` / `workboard_proof`                                                                                                          | 添加交接备注或附加证明/制品引用。                                                                                                                                                        |
| `workboard_unblock`                                                                                                                              | 将被阻塞的工作移回 `todo`。                                                                                                                                                              |
| `workboard_dispatch`                                                                                                                             | 推动依赖提升或陈旧认领清理。                                                                                                                                                             |

已占用的卡片会拒绝来自其他智能体的智能体工具变更，除非调用方持有 `workboard_claim` 返回的占用令牌。智能体工具或 Gateway 网关 RPC 调用返回的每张卡片都会将 `metadata.claim.token` 脱敏为 `[redacted]`（令牌本身只会从 `workboard_claim` 以顶层字段返回一次），因此仪表板操作员和其他智能体可以检查占用状态，而永远不会看到可用的令牌。恢复通过 `workboard_promote`/`workboard_reassign`/`workboard_reclaim` 完成，它们不需要令牌。

## 调度

调度是 Gateway 网关本地的：它不会生成任意 OS 进程。正常的 OpenClaw 子智能体会话仍然拥有执行权。一次调度过程会：

1. 提升依赖已就绪的卡片。
2. 在就绪卡片上记录调度元数据。
3. 阻止已过期的占用或已超时的运行。
4. 将面板配置的分流卡片标记为编排候选项。
5. 占用一小批就绪卡片，并通过 Gateway 网关子智能体运行时启动 worker 运行。

Worker 会获得有界的卡片上下文，以及通过 Workboard 工具对卡片发送心跳、完成或阻止所需的占用令牌。

### Worker 选择

每次调度默认**最多启动 3 个 worker**。就绪卡片按优先级排序，然后按位置排序，再按创建时间排序。一次调度对每个所有者/智能体只启动一张卡片，并跳过面板上已有运行中或待审核工作的所有者。已归档卡片、有活动占用的卡片，以及状态不为 `ready` 的卡片，永远不会被选中用于启动 worker（它们仍可能受到调度的数据侧影响：清理陈旧占用、提升依赖、清理超时）。

会话键按面板/卡片确定性生成，因此重复调度会路由回同一个 worker 通道，而不是创建无关会话：

- 已分配卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未分配卡片：`subagent:workboard-<boardId>-<cardId>`（Gateway 网关会解析已配置的默认智能体）

如果卡片被占用后无法启动 worker，Workboard 会阻止该卡片、清除占用、记录运行启动失败，并追加一条 worker 日志行 - 可在仪表板、CLI JSON、智能体工具和卡片诊断中看到。

### 入口点

- 仪表板调度操作
- `openclaw workboard dispatch`
- 支持命令的渠道上的 `/workboard dispatch`

三者在 Gateway 网关可用时都会使用 Gateway 网关子智能体运行时。CLI 有一个操作员回退：如果 Gateway 网关调用因连接/不可用错误失败（或因较旧 Gateway 网关的 `unknown method` 错误失败），并且没有显式 `--url`/`--token` 目标，也没有适用的已配置远程 Gateway 网关（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），CLI 会针对本地 SQLite 状态运行仅数据调度 - 它可以提升依赖、清理陈旧占用并阻止超时运行，但无法启动 worker。来自可达 Gateway 网关的凭证、权限和验证失败不会被视为不可用；它们会作为命令错误浮现；在给出显式 `--url`/`--token` 目标时，任何 Gateway 网关失败也同样如此。

面板元数据可以设置 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录此意图，并在 worker 上下文中公开它；实际的规格化/分解仍通过正常的 Workboard 工具运行。

## CLI 和斜杠命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文本输出默认隐藏已归档卡片（`--include-archived` 会覆盖）；`--json` 始终包含已归档卡片，与现有脚本使用的完整卡片契约一致。`show` 接受无歧义的 id 前缀。`list`、`create` 和 `show` 始终直接读写本地插件状态。只有 `dispatch` 会调用正在运行的 Gateway 网关，并使用上文所述的回退。

完整标志、JSON 输出、Gateway 网关回退行为、id 前缀处理、调度选择规则和故障排查，请参阅 [Workboard CLI](/zh-CN/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>` 和 `/workboard dispatch` 与 CLI 对应。List 和 show 是面向任何已授权命令发送者的读取操作。Create 和 dispatch 在聊天表面上需要所有者状态，或需要具有 `operator.write`/`operator.admin` 的 Gateway 网关客户端。

## 会话生命周期同步

卡片可以链接到现有仪表板会话，也可以链接到你从卡片开始工作时创建的会话。已链接卡片会内联显示会话生命周期：运行中、陈旧、已链接空闲、完成、失败或缺失。你也可以从 Sessions 选项卡使用 **Add to Workboard** 捕获现有会话；该卡片会链接到该会话，使用会话标签或最近的用户提示作为标题，并在可用时使用最近的用户提示加上最新助手响应来初始化备注。

如果已链接会话缺失，卡片会保留链接以提供上下文，并仍然提供启动控件，用于重启到一个新会话。如果活动的已链接会话停止报告近期活动，Workboard 会将卡片标记为 `stale`，并将其存储为元数据，直到生命周期清除此状态。

当卡片处于活动工作状态时，Workboard 会跟随已链接会话：

| 已链接会话状态 | 卡片状态 |
| ------------------------------------- | ----------- |
| active | `running` |
| completed | `review` |
| failed、killed、timed out 或 aborted | `blocked` |

**手动审核状态优先。** 将卡片移动到 `review`、`blocked` 或 `done` 会停止该卡片的自动同步，直到你将其移回 `todo` 或 `running`。

启动卡片会使用正常的 Gateway 网关会话；Workboard 只存储卡片元数据和链接。对话转录、模型选择和运行生命周期仍由常规会话系统拥有。对实时已链接卡片使用 **Stop** 可以中止活动运行 - Workboard 会将该卡片标记为 `blocked`，使其保持可见以便后续跟进。

新卡片可以从 Workboard 模板（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）开始。模板会预填标题、备注、标签和优先级；模板 id 会存储为卡片元数据。

## 仪表板工作流

1. 在 Control UI 中打开 Workboard 选项卡。
2. 创建包含标题、备注、优先级、标签、可选智能体和可选已链接会话的卡片 - 或打开 Sessions 并为现有会话选择 **Add to Workboard**。
3. 在列之间拖动卡片，或聚焦其紧凑状态控件并使用菜单或 ArrowLeft/ArrowRight。
4. 从卡片开始工作，以创建或复用仪表板会话。
5. 在智能体工作时，从卡片打开已链接会话。
6. 让生命周期同步将运行中的工作移动到 `review`/`blocked`，然后在接受后手动将卡片移动到 `done`。

## 诊断

诊断根据本地卡片元数据计算。内置检查会标记：

| 类型 | 条件 |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready` | 已分配的 `todo`/`backlog`/`ready` 卡片超过 1 小时未更新。 |
| `running_without_heartbeat` | `running` 卡片超过 20 分钟没有占用心跳或执行更新。 |
| `blocked_too_long` | `blocked` 卡片超过 24 小时未更新。 |
| `repeated_failures` | 卡片跟踪的失败计数达到 2 次或更多。 |
| `missing_proof` | `done` 卡片没有证明、产物或附件。 |
| `orphaned_session` | `running` 卡片有 `sessionKey`，但没有 `execution` 元数据。 |

## 权限

Gateway 网关 RPC 方法位于 `workboard.*` 下：

| 权限范围 | 方法 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read` | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件读取、`boards.list`、`cards.stats`、`cards.runs` |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、worker 日志、协议违规、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

没有 RPC 方法需要 `operator.admin`。以只读操作员访问权限连接的浏览器可以检查面板，但不能变更卡片。

## 存储

Workboard 在 OpenClaw 状态目录下由插件拥有的关系型 SQLite 数据库中存储持久数据：面板、卡片、标签、生命周期事件、运行尝试、评论、依赖链接、证明、产物引用、附件元数据和 blob、诊断、通知、worker 日志、协议状态和订阅全都位于 Workboard 表中（而不是插件键值条目）。卡片导出会保留面板叙事，而不会内联附件 blob 内容。

在 `.28` 版本中使用过 Workboard 的安装可以运行 `openclaw doctor --fix`，将已发布的旧版插件状态命名空间（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及如果存在的 `workboard.attachments`）迁移到关系型数据库。

## 故障排查

**选项卡显示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请将 `workboard` 添加到其中。如果 `plugins.deny` 包含 `workboard`，请先移除它再启用该插件。

**卡片无法保存**

确认浏览器连接具有 `operator.write` 访问权限。只读操作员会话可以列出卡片，但不能创建、编辑、移动或删除它们。

**启动卡片没有打开预期会话**

检查卡片的智能体 id 和已链接会话，然后打开 Sessions 或 Chat 以检查实际运行状态。

**调度没有启动 worker**

确认至少有一张没有活动占用的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告仅数据调度，请启动或重启 Gateway 网关后重试 - 仅数据调度会更新本地面板状态，但无法启动子智能体 worker 运行。当同一所有者或智能体的另一张卡片已经在运行或等待审核时，卡片也可能被跳过；请先完成、阻止或释放该活动工作，再为同一所有者调度更多工作。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
