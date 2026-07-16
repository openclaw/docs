---
read_when:
    - 你希望在 Control UI 中使用看板式工作板
    - 你正在启用或禁用内置的 Workboard 插件
    - 你希望在不使用外部项目管理工具的情况下跟踪计划中的智能体工作
summary: 可选的工作台仪表板，用于智能体负责的卡片和会话交接
title: Workboard 插件
x-i18n:
    generated_at: "2026-07-16T11:54:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 插件为 [Control UI](/zh-CN/web/control-ui) 添加了一个可选的看板式工作面板：适合智能体处理的工作卡片、将工作分配给智能体，以及返回卡片对应任务、运行和仪表板会话的链接。

Workboard 有意保持小巧：它跟踪一个 OpenClaw Gateway 网关的本地运维工作。它不能替代 GitHub Issues、Linear、Jira 或其他团队项目管理系统。

## 启用插件

Workboard 已内置，但默认禁用：

1. 在 Control UI 中打开 **插件**，或使用相对于已配置 Control UI 基础路径的 `/settings/plugins`。例如，基础路径为 `/openclaw` 时，使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 并选择 **Enable**。由于 Workboard 随 OpenClaw 一同提供，因此不需要执行 **Install** 操作。
3. 如果 UI 提示需要重启，请重启 Gateway 网关。

插件运行时加载后，Workboard 标签页会出现在仪表板导航中。禁用时，该标签页不会显示在导航中。如果插件已禁用或被 `plugins.allow`/`plugins.deny` 阻止，直接打开 `/workboard` 路由将显示插件不可用状态，而不是卡片数据。

等效的 CLI 工作流如下：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 配置

Workboard 没有插件专用配置。使用标准插件条目启用或禁用它：

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
| 关联引用 | 可选的任务、运行、会话或源 URL                                                                                 |
| `execution` | 从卡片启动的 Codex/Claude 运行的可选元数据（引擎、模式、模型、会话、运行 ID、状态） |

卡片还包含精简元数据，用于记录尝试、评论、链接、证明、工件、自动化设置、附件、工作节点日志、工作节点协议状态、认领、诊断、通知、模板 ID、归档状态和过期会话检测，以及近期事件列表（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。这些元数据让操作员无需打开关联会话，即可查看卡片在面板中的流转过程；它们是本地运维上下文，不能替代会话记录或 GitHub Issue 历史记录。

插件和 Control UI 使用同一个 Workboard 卡片契约。因此，仪表板刷新时会保留工作区来源和权限、认领状态、诊断操作及通知序列号，而不是投影一个较小的仅供 UI 使用的卡片副本。在两个表面都支持未知的诊断类型、诊断严重程度和通知类型之前，这些类型会被忽略；绝不会将它们改写为其他有效状态。

打开的仪表板会根据 `plugin.workboard.changed` 失效事件进行更新。每个事件仅包含存储纪元和修订号；随后 UI 会通过常规 `operator.read` RPC 重新读取规范卡片。多个修订会合并为一次后续读取。拖动、编辑或写入卡片时，Workboard 会推迟该读取，并在本地交互完成后恢复。重新连接时始终会执行规范重载。系统不会定期轮询完整卡片，且 **Refresh** 仍可用于手动恢复。

存在多个面板时，工具栏会包含由持久化面板元数据支持的 **Board** 筛选器，而不是仅依据当前可见的卡片。因此，空面板和已归档面板仍可选择。没有显式面板 ID 的卡片属于规范的 `default` 面板。所选面板存储在 `?board=` 查询参数中，因此经过筛选的 Workboard URL 可以加入书签或共享；选择 **All boards** 会移除该参数。

卡片存储在插件自身的 Gateway 网关状态中，并会随该 Gateway 网关的其余 OpenClaw 状态一起迁移（请参阅[存储](#storage)）。

## 从卡片开始工作

未关联的卡片可以直接开始工作：

- **Run Codex** / **Run Claude** 会使用显式引擎启动一个由任务跟踪的智能体运行，发送卡片提示词，并将卡片标记为 `running`。Codex 运行使用 `openai/gpt-5.6-sol`；Claude 运行使用 `anthropic/claude-sonnet-4-6`。
- **Open Codex** / **Open Claude** 会创建一个关联的仪表板会话，但不会发送卡片提示词或移动卡片，适用于需要保持关联到面板的手动工作。

自主启动使用 Gateway 网关的任务跟踪型智能体运行路径（默认使用默认智能体和模型，除非明确选择 Codex/Claude）；随后，Workboard 会将生成的任务、运行 ID 和会话键关联回卡片。每次关联执行还会记录尝试摘要（引擎、模式、模型、运行 ID、时间戳、状态、滚动失败次数），确保重复失败始终可见。

仪表板会从 Gateway 网关任务账本刷新任务状态，并通过任务 ID、运行 ID 或关联会话键将任务与卡片匹配。处于排队或运行状态的任务会使卡片的生命周期保持活跃；已完成、失败、超时或取消的任务会使用与关联会话相同的同步规则，将卡片移向 `review` 或 `blocked`（请参阅[会话生命周期同步](#session-lifecycle-sync)）。

## 智能体工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含认领/诊断状态的紧凑卡片；可选按看板筛选。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 返回一张卡片及有界的工作器上下文（备注、尝试、评论、链接、证明、工件、父项结果、被分配者近期工作、活动诊断）。                               |
| `workboard_create`                                                                                                                               | 创建卡片，可选择指定父项、租户、技能、看板、工作区元数据、幂等键、运行时限和重试预算。                                                             |
| `workboard_link`                                                                                                                                 | 将父卡片链接到子卡片。所有父项达到 `done` 之前，子项保持为 `todo`；之后，分派提升会将其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 为调用方智能体认领卡片；将 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在较长的运行期间刷新认领心跳。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 在完成、暂停或交接后释放认领；可以将卡片移至下一状态。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用于最终摘要、证明、工件和已创建卡片清单（必须引用链接回已完成卡片的卡片）或阻塞原因的结构化生命周期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 将小型卡片附件存储在插件 SQLite 状态中，在卡片上建立索引，并在工作器上下文中公开。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 记录工作器日志行，并在自动化工作器停止但未调用 `workboard_complete`/`workboard_block` 时阻塞卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板元数据（显示名称、描述、归档状态、默认工作区）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 返回卡片的持久化运行尝试历史记录。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 将粗略的分类整理/待办卡片转变为已澄清的 `todo` 卡片；在卡片上记录规范摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 将父编排卡片拆分为相互链接的子项，并继承看板/租户元数据；可以使用已创建卡片清单完成父项。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知订阅。事件读取可安全重放；`advance` 会移动持久游标，使调用方恢复读取时不会遗漏或重复读取已完成/失败/过期的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 检查看板命名空间和队列统计信息。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 恢复或交接停滞的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 添加交接备注或附加证明/工件引用。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 将被阻塞的工作移回 `todo`。                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | 将卡片移至另一状态；已认领的卡片要求调用方具有智能体认领权限范围。                                                                                                      |
| `workboard_dispatch`                                                                                                                             | 在不启动工作器的情况下触发依赖提升或过期认领清理；工作器启动使用 Gateway 网关或斜杠命令分派。                                                        |

除非调用方持有 `workboard_claim` 返回的认领令牌，否则已认领的卡片会拒绝其他智能体通过智能体工具进行的变更。智能体工具或 Gateway 网关 RPC 调用返回的每张卡片都会将 `metadata.claim.token` 隐去为 `[redacted]`（令牌本身仅由 `workboard_claim` 在顶层返回一次），因此仪表板操作员和其他智能体可以检查认领状态，但永远无法看到可用的令牌。恢复通过
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 进行，这些操作不需要令牌。

## 分派

分派在 Gateway 网关本地进行：它不会生成任意操作系统进程。执行仍由常规的 OpenClaw 子智能体会话负责。一次分派轮次：

1. 提升依赖已就绪的卡片。
2. 在就绪卡片上记录分派元数据。
3. 阻塞认领已过期或运行已超时的卡片。
4. 将看板配置的分类整理卡片标记为编排候选项。
5. 认领一小批就绪卡片，并通过
   Gateway 网关子智能体运行时启动工作器运行。

工作器会获得有界的卡片上下文，以及通过 Workboard 工具发送心跳、完成或阻塞卡片所需的认领令牌。

工作区路径遵循调用方现有的文件系统权限。具有 `operator.write` 的 Gateway 网关客户端可以使用已配置的智能体工作区；`operator.admin` 客户端可以使用主机上的其他检出目录。沙箱隔离的智能体工具使用其沙箱工作区访问权限，而未进行沙箱隔离且仅限工作区的工具使用其已配置的工作区根目录。分配工作区时，Workboard 会记录该权限，并在分派时再次与当前调用方的权限取交集，因此持久化卡片无法扩大后续调用方的访问权限。对于显式指定了主机工作区但未记录权限的旧卡片，必须重新保存该工作区，之后才能进行完整主机分派；没有主机路径的卡片会在首次分派时采用当前调用方的权限。

仅当工作区绑定分派的目录或 Git 检出目录的仓库根目录与目标智能体工作区完全匹配时，才会接受该目录。工作树请求会被限定到该目录，并持久化为目录工作区，因此主机不会具体化检出目录或执行仓库设置代码。目标工作器必须为该确切工作区使用可写且非共享的 Docker 沙箱，不得使用提升权限的执行、持久化的主机/节点 Exec 覆盖，也不得使用未经分类的插件和 MCP 工具。Workboard 会枚举其已注册工具，而不是信任 `workboard_*` 前缀；如果热 Docker 容器的实时挂载/配置哈希已过期，分派会被拒绝。分派会报告不兼容的目标策略，而不是启动约束较少的工作器。
完整主机分派可以面向本地其他检出目录，并保留常规的托管工作树设置。

工作区权限不会创建第二套卡片生命周期权限模型。可以变更 Workboard 卡片的调用方能够在每个界面上手动将其移至相同状态；只读工作区访问权限仅会阻止需要写入权限的工作器分派。

### 工作器选择

默认情况下，每次轮次启动的工作器**最多为 3 个**。就绪卡片首先按优先级排序，其次按位置排序，最后按创建时间排序。每次轮次针对每个所有者/智能体只启动一张卡片，并跳过看板上已有正在运行或审核中工作的所有者。已归档的卡片、具有活动认领的卡片，以及状态不是 `ready` 的卡片绝不会被选中启动工作器（它们仍可能受分派的数据处理部分影响：过期认领清理、依赖提升和超时清理）。

会话键按看板/卡片确定性生成，因此重复分派会路由回同一工作器通道，而不是创建无关会话：

- 已分配的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未分配的卡片：`subagent:workboard-<boardId>-<cardId>`（Gateway 网关会解析
  已配置的默认智能体）

如果卡片被认领后无法启动工作器，Workboard 会阻塞该卡片、清除认领、记录运行启动失败，并追加一条工作器日志行——可在仪表板、CLI JSON、智能体工具和卡片诊断中查看。

### 入口点

- 控制面板调度操作
- `openclaw workboard dispatch`
- 在支持命令的渠道上使用 `/workboard dispatch`

当 Gateway 网关可用时，这三种方式都使用 Gateway 网关的子智能体运行时。CLI 有一种操作员回退机制：如果 Gateway 网关调用因连接/不可用错误（或旧版 Gateway 网关的 `unknown method` 错误）而失败，并且没有指定显式的 `--url`/`--token` 目标，也没有配置远程 Gateway 网关（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），CLI 会针对本地 SQLite 状态执行纯数据调度——它可以提升依赖项、清理过期认领并阻止超时运行，但无法启动工作进程。可访问的 Gateway 网关返回的身份验证、权限和验证失败不会被视为不可用，而是作为命令错误显示；指定显式的 `--url`/`--token` 目标时，任何 Gateway 网关故障也会作为命令错误显示。

看板元数据可以设置 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 会记录此意图并将其公开到工作进程上下文中；实际的规范制定/任务分解仍通过常规 Workboard 工具运行。

## CLI 和斜杠命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文本输出默认隐藏已归档卡片（可用 `--include-archived` 覆盖）；`--json` 始终包含已归档卡片，与现有脚本使用的完整卡片契约一致。`show` 和 `move` 接受无歧义的 ID 前缀。`list`、`create`、`show` 和 `move` 始终直接读写本地插件状态。只有 `dispatch` 会调用正在运行的 Gateway 网关，并采用上述回退机制。

有关完整标志、JSON 输出、Gateway 网关回退行为、ID 前缀处理、调度选择规则和故障排查，请参阅 [Workboard CLI](/zh-CN/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、`/workboard move <card-id> --status <status>` 和 `/workboard dispatch` 与 CLI 对应。对于任何获得授权的命令发送者，列表和查看属于读取操作。在聊天界面上，创建、移动和调度需要所有者身份；或者需要具有 `operator.write`/`operator.admin` 的 Gateway 网关客户端。操作员手动移动卡片时，使用与控制面板拖放相同的认领覆盖行为。其工作树访问权限仍遵循上述相同的工作区边界。

## 会话生命周期同步

卡片可以链接到现有控制面板会话，也可以链接到从卡片开始工作时创建的会话。已链接的卡片会内联显示会话生命周期：正在运行、过期、已链接但空闲、已完成、失败或缺失。还可以在会话选项卡中使用 **添加到 Workboard** 捕获现有会话；卡片会链接到该会话，使用会话标签或最近的用户提示作为标题，并在可用时使用最近的用户提示及最新的助手响应初始化备注。

如果链接的会话缺失，卡片会保留链接以提供上下文，并仍会提供启动控件，以便在新会话中重新开始。如果处于活动状态的链接会话停止报告近期活动，Workboard 会将卡片标记为 `stale`，并将其存储为元数据，直到生命周期将其清除。

卡片处于活动工作状态时，Workboard 会跟随链接会话：

| 链接会话状态                          | 卡片状态 |
| ------------------------------------- | ----------- |
| 活动                                  | `running`   |
| 已完成                                | `review`    |
| 失败、被终止、超时或中止              | `blocked`   |

**手动审核状态优先。** 将卡片移动到 `review`、`blocked` 或 `done` 会停止该卡片的自动同步，直到将其移回 `todo` 或 `running`。

启动卡片使用常规 Gateway 网关会话；Workboard 仅存储卡片元数据和链接。对话记录、模型选择和运行生命周期仍由常规会话系统管理。在实时链接卡片上使用 **停止** 可中止活动运行——Workboard 会将该卡片标记为 `blocked`，使其保持可见以便后续处理。

新卡片可以从 Workboard 模板（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）开始。模板会预填标题、备注、标签和优先级；模板 ID 会存储为卡片元数据。

## 控制面板工作流

1. 在 Control UI 中打开 Workboard 选项卡。
2. 创建包含标题、备注、优先级、标签、可选智能体和可选链接会话的卡片；也可以打开会话，然后为现有会话选择 **添加到 Workboard**。
3. 在各列之间拖动卡片，或聚焦其紧凑状态控件并使用菜单或 ArrowLeft/ArrowRight。拖动期间，源卡片会变暗，可放置的列会显示轮廓。
4. 从卡片开始工作，以创建或复用控制面板会话。
5. 智能体工作期间，从卡片打开链接的会话。
6. 让生命周期同步将正在运行的工作移动到 `review`/`blocked`，然后在验收后手动将卡片移动到 `done`。

## 诊断

诊断根据本地卡片元数据计算。内置检查会标记：

| 类型                        | 条件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已分配的 `todo`/`backlog`/`ready` 卡片超过 1 小时未更新。             |
| `running_without_heartbeat` | `running` 卡片超过 20 分钟没有认领心跳或执行更新。 |
| `blocked_too_long`          | `blocked` 卡片超过 24 小时未更新。                                   |
| `repeated_failures`         | 卡片跟踪的失败次数达到 2 次或更多。                                |
| `missing_proof`             | `done` 卡片没有证明、工件或附件。                          |
| `orphaned_session`          | `running` 卡片有 `sessionKey`，但没有 `execution` 元数据。                |

## 权限

Gateway 网关 RPC 方法位于 `workboard.*` 下：

| 权限范围            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件列表/获取、通知事件读取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、创建/更新/移动/删除/评论/链接/链接依赖项/证明/工件、附件添加/删除、工作进程日志、协议违规、认领/心跳/释放/提升/重新分配/重新认领/完成/阻止/解除阻止、`cards.dispatch`、`cards.bulk`、归档、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知订阅/删除/推进 |

没有 RPC 方法要求 `operator.admin`。使用只读操作员访问权限连接的浏览器可以查看看板，但不能修改卡片。管理员权限范围会扩大可接受的 Workboard 主机路径，但不会改变可用方法。

## 存储

Workboard 将持久数据存储在 OpenClaw 状态目录下由插件所有的关系型 SQLite 数据库中：看板、卡片、标签、生命周期事件、运行尝试、评论、依赖链接、证明、工件引用、附件元数据和二进制大对象、诊断、通知、工作进程日志、协议状态及订阅全都存放在 Workboard 表中（而非插件键值条目中）。卡片导出会保留看板叙事，但不会内联附件二进制大对象的内容。

在 `.28` 版本中使用过 Workboard 的安装可以运行 `openclaw doctor --fix`，将已发布的旧版插件状态命名空间（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在时的 `workboard.attachments`）迁移到关系型数据库。

## 故障排查

**选项卡提示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果配置了 `plugins.allow`，请将 `workboard` 添加到其中。如果 `plugins.deny` 包含 `workboard`，请在启用插件前将其移除。

**卡片无法保存**

确认浏览器连接具有 `operator.write` 访问权限。只读操作员会话可以列出卡片，但无法创建、编辑、移动或删除卡片。

**启动卡片后未打开预期会话**

检查卡片的智能体 ID 和链接会话，然后打开会话或聊天以检查实际运行状态。

**调度未启动工作进程**

确认至少有一张没有活动认领的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果 CLI 报告纯数据调度，请启动或重启 Gateway 网关后重试——纯数据调度会更新本地看板状态，但无法启动子智能体工作进程运行。如果同一所有者或智能体的另一张卡片已在运行或等待审核，卡片也可能被跳过；请先完成、阻止或释放该活动工作，再为同一所有者调度更多工作。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Workboard CLI](/zh-CN/cli/workboard)
- [插件](/zh-CN/tools/plugin)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [会话](/zh-CN/concepts/session)
