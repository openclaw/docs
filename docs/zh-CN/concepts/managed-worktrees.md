---
read_when:
    - 你希望为智能体任务使用隔离的分支和检出目录
    - 你正在为 Workboard 卡片配置 worktree 工作区
    - 你需要恢复或清理 OpenClaw 管理的工作树
summary: 在隔离的 Git 检出中运行智能体任务，并自动创建快照和清理
title: 托管工作树
x-i18n:
    generated_at: "2026-07-14T13:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f9923f427be2afb507a5296c221b6ca6d2ae03a7a8c92f30755cf15b92c6806
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

托管工作树为智能体任务提供独立的 git 分支和检出目录，而无需在源代码仓库内放置临时目录。OpenClaw 会在其状态目录下创建这些工作树，将其记录在共享状态数据库中，并在移除前为其中已跟踪及未被忽略的未跟踪内容创建快照。

## 布局和名称

每个工作树位于：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

仓库指纹是基于规范化 git 公共目录和源 URL 计算出的 SHA-256 哈希值的前 16 个十六进制字符。提供的名称必须匹配 `[a-z0-9][a-z0-9-]{0,63}`。如果未提供名称，OpenClaw 会生成 `wt-`，后跟八个随机十六进制字符。

OpenClaw 会在请求的基础引用处创建分支 `openclaw/<name>`。如果未提供基础引用，它会获取 `origin`，在可用时使用远程默认分支；当仓库离线或没有可用的远程仓库时，则回退到本地 `HEAD`。

## 置备被忽略的文件

在源代码仓库根目录添加 `.worktreeinclude`，即可将选定的被忽略未跟踪文件复制到新工作树中。该文件使用 gitignore 模式语法，每行一个模式，并支持 `#` 注释：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 报告为同时被忽略且未跟踪的文件才符合条件。已跟踪文件已通过 git 存在，绝不会由此步骤复制。OpenClaw 不会覆盖目标文件或跟随符号链接目录，并会保留所复制文件的模式。

## 运行仓库设置

如果源代码仓库中存在 `.openclaw/worktree-setup.sh` 且该文件可执行，OpenClaw 会以新工作树作为当前目录运行它。脚本会收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零退出码会中止创建，并移除新工作树和分支。这是仓库本地约定；OpenClaw 没有用于此功能的配置键。

## 会话工作树

若要从当前智能体的 git 工作区启动隔离聊天并使用工作树支持的会话，请在 Control UI 的“新建会话”页面启用**工作树**（该页面还提供基础分支选择器和可选的工作树名称），或者使用 iOS 上的“聊天操作”菜单，或 Android 上“新建聊天”旁边的更多操作。此选项仅适用于由 git 支持且客户端具备该能力的智能体；无法预检此能力的客户端会改为显示 Gateway 网关错误。

编码智能体在发现当前任务之外已确认的后续工作时，也可以调用 `spawn_task`。Control UI 会显示建议标签而不启动任何内容，而由 Gateway 网关支持的 TUI 会显示包含相同操作的交互式提示。选择**在工作树中启动**会从建议的项目创建一个由新会话拥有的工作树，并将自包含提示作为其第一个轮次发送；关闭建议不会修改仓库。建议及其 ID 是临时的，不会在 Gateway 网关重启后保留。

OpenClaw 仅向具有可操作 Gateway 网关 UI 的操作员会话提供这些工具。在渠道会话以及本地/嵌入式 TUI 会话拥有可移植的类型化任务操作约定之前，它们不会收到这些工具。

生成的托管工作树由会话拥有，该会话中的每次智能体运行都会使用其检出目录。当工作区是仓库子目录时，工作树会锚定在仓库根目录，而会话则从其中对应的子目录运行。会话工作树创建使用该方法的 `operator.write` 权限范围，但仓库检出钩子和 `.openclaw/worktree-setup.sh` 步骤仅对 `operator.admin` 调用方运行，因为它们会执行仓库代码；`.worktreeinclude` 置备仍适用于所有调用方。只有在能够无损完成时，删除会话才会移除工作树。脏工作树或包含未推送提交的分支会继续保留；每小时清理会在会话工作树空闲 7 天后为其创建快照，并将近期会话活动视为工作树活动。已移除的工作树仍可按下文所述从其快照恢复。

当任务的目标项目不是已配置的 Agent 工作区时，`sessions.create` 可同时包含绝对 `cwd` 和 `worktree: true`。该显式主机路径需要 `operator.admin`；普通工作树聊天创建仍使用 `operator.write`，并继续锚定到已配置的工作区。

`sessions.create` 还接受 `worktreeBaseRef` 和 `worktreeName`，与 `worktree: true` 一起用于选择基础引用和工作树名称（分支将变为 `openclaw/<name>`）；两者仍位于 `operator.write`。创建的工作树会在创建结果中返回，并以 `worktree: { id, branch, repoRoot }` 持久化到会话行中，因此会话列表可以显示检出目录和分支。删除会话时，如果保留了脏检出目录，会将其报告为 `worktreePreserved`，而不是静默遗留。

## 快照、清理和恢复

移除操作首先会创建一个包含已跟踪文件和未被忽略的未跟踪文件的合成提交，并将其固定在 `refs/openclaw/snapshots/<id>`。被 git 忽略的文件不会进入仓库对象数据库；由 `.worktreeinclude` 选定的文件会在恢复期间再次复制。如果快照创建失败，移除操作会停止。显式强制删除可以在没有快照的情况下继续执行。

OpenClaw 应用以下清理规则：

- 运行结束时，仅当 `git status --porcelain` 为空且 `git log HEAD --not --remotes --oneline` 未发现未推送提交时，才会移除工作树。否则只会释放活动锁。
- 每小时清理会为已解锁且空闲超过 7 天、由 Workboard 或会话拥有的工作树创建快照并将其移除，即使工作树为脏状态也是如此。手动工作树绝不会被自动移除。
- 配置 `worktrees.cleanup.maxCount` 或 `worktrees.cleanup.maxTotalSizeGb` 后，清理还会按最近活动时间从最久远开始，为 Workboard 和会话拥有的工作树创建快照并将其移除，直到总数量和磁盘大小符合限制。所有托管工作树都会计入总量，但手动工作树及其他受保护的工作树绝不会因限制而被驱逐，因此在出现符合条件的工作树之前，限制可能会一直处于超出状态。设为 0 或未设置会禁用相应限制。
- 快照记录在 30 天内可恢复。此后，清理会删除快照引用和注册表行。
- OpenClaw 活跃进程锁以及任何外部或无法识别的 git 工作树锁都会保护工作树免遭垃圾回收。

恢复操作会在创建快照前的原始提交处重新创建 `openclaw/<name>`，然后将快照差异重建为未暂存修改和未跟踪文件。这样可以避免合成快照提交进入分支历史。快照引用会继续作为来源记录保留。

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Settings 下的 Control UI **工作树**页面提供相同的操作，还支持使用基础分支选择器创建工作树；该页面会显示每个工作树的所有者（手动、Workboard 或拥有它的会话，并提供进入其聊天的链接），并在移除操作报告快照失败时提供强制重试。其**清理**部分可编辑[配置参考](/zh-CN/gateway/configuration-reference#worktrees)中所述的 `worktrees.cleanup` 保留限制。

## Gateway 网关方法

| 方法                 | 用途                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出活跃及可恢复的工作树记录。                                          |
| `worktrees.branches` | 列出仓库的本地和远程分支，供基础引用选择器使用。                        |
| `worktrees.create`   | 创建或复用具名托管工作树。                                              |
| `worktrees.remove`   | 为工作树创建快照并将其移除。强制移除会报告 `snapshotError`。 |
| `worktrees.restore`  | 从快照恢复已移除的工作树。                                              |
| `worktrees.gc`       | 立即运行空闲、孤立和保留策略清理。                                      |

`worktrees.list` 需要 `operator.read`，修改类方法需要 `operator.admin`。对于已配置的 Agent 工作区，`worktrees.branches` 需要 `operator.write`；其他任何主机路径都需要 `operator.admin`（与 `sessions.create` cwd 门槛一致）。它只读取现有引用，绝不会执行获取操作；仅存在于远程的分支会以远程限定名称返回（`origin/feature-a`），因此每个返回的名称都可以解析为基础引用。

## Workboard 工作区

内置的 [Workboard 插件](/zh-CN/plugins/workboard)可以将卡片工作区具体化为托管工作树：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 标识源 git 检出目录。`branch` 是可选项，并会成为基础引用。对于拥有完整主机权限的调用方，Workboard 会创建或复用 `wb-<card-id>`，以托管检出目录作为工作目录运行子智能体，并将解析后的路径和分支写回卡片。Gateway 网关客户端需要 `operator.admin` 才能执行完整主机具体化。运行结束时，只有在能够证明无损的情况下，Workboard 才会移除检出目录；脏工作或未推送提交会继续保留。

对于受工作区约束的调用方，`path` 和仓库根目录必须与目标 Agent 工作区完全匹配。随后，Workboard 会直接在该目录中运行，并记录目录工作区，而不是在主机上具体化托管工作树。目标必须对同一工作区使用可写且非共享的 Docker 沙箱，其活跃容器哈希必须与请求的挂载和策略匹配，并且不得开放提升权限的执行、主机控制、主机范围会话、持久化主机/节点执行，或未分类的插件和 MCP 工具。如果目标策略或活跃容器的权限范围更广，调度将使卡片保持未认领状态，并报告不兼容状态。
