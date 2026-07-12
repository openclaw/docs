---
read_when:
    - 你希望为智能体任务创建隔离的分支和检出目录
    - 你正在为 Workboard 卡片配置 worktree 工作区
    - 你需要恢复或清理 OpenClaw 管理的工作树
summary: 在隔离的 Git 检出中运行智能体任务，并自动创建快照和清理
title: 托管工作树
x-i18n:
    generated_at: "2026-07-11T20:29:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

托管工作树为智能体任务提供独立的 Git 分支和检出目录，而不会在源代码仓库内放置临时目录。OpenClaw 在其状态目录下创建这些工作树，将它们记录在共享状态数据库中，并在移除前为其已跟踪内容和未忽略的未跟踪内容创建快照。

## 布局和命名

每个工作树位于：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

仓库指纹是基于规范 Git 公共目录和源 URL 计算出的 SHA-256 哈希值的前 16 个十六进制字符。提供的名称必须匹配 `[a-z0-9][a-z0-9-]{0,63}`。如果未提供名称，OpenClaw 会生成以 `wt-` 开头、后接八个随机十六进制字符的名称。

OpenClaw 在请求的基础引用处创建分支 `openclaw/<name>`。如果未提供基础引用，它会获取 `origin`，在可用时使用远程默认分支；当仓库离线或没有可用的远程仓库时，则回退到本地 `HEAD`。

## 配置忽略的文件

在源代码仓库根目录添加 `.worktreeinclude`，即可将选定的、已忽略且未跟踪的文件复制到新工作树中。该文件使用 gitignore 模式语法，每行一个模式，并支持 `#` 注释：

```gitignore
.env.local
fixtures/generated/**
```

只有 Git 报告为同时处于已忽略和未跟踪状态的文件才符合条件。已跟踪文件已通过 Git 存在，因此此步骤绝不会复制它们。OpenClaw 不会覆盖目标文件，也不会跟随符号链接目录，并且会保留所复制文件的模式。

## 运行仓库设置

如果源代码仓库中存在 `.openclaw/worktree-setup.sh` 且该文件可执行，OpenClaw 会以新工作树作为当前目录运行它。该脚本会收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零退出状态会中止创建，并移除新工作树和分支。这是仓库本地约定；OpenClaw 没有对应的配置键。

## 会话工作树

要从当前智能体的 Git 工作区启动隔离聊天并使用工作树支持的会话，请在 Control UI 的 New session 页面启用 **Worktree**（该页面还提供基础分支选择器和可选的工作树名称），或使用 iOS 上的 Chat actions 菜单，或 Android 上 New Chat 旁边的溢出操作。此选项仅适用于由 Git 支持且客户端具备该能力的智能体；无法预检该能力的客户端会改为显示 Gateway 网关错误。

编码智能体在发现当前任务范围之外且已确认的后续工作时，也可以调用 `spawn_task`。Control UI 会显示建议标签而不会启动任何操作，而由 Gateway 网关支持的 TUI 会显示包含相同操作的交互式提示。选择 **Start in worktree** 会基于建议的项目创建一个由新会话拥有的全新工作树，并将完整自足的提示作为其首轮消息发送；关闭建议不会改动仓库。建议及其 ID 是临时的，Gateway 网关重启后不会保留。

OpenClaw 仅向具有可操作 Gateway 网关 UI 的操作员会话公开这些工具。在渠道界面具备可移植的类型化任务操作约定之前，渠道会话以及本地或嵌入式 TUI 会话不会获得这些工具。

生成的托管工作树归会话所有，该会话中的每次智能体运行都会使用其检出目录。当工作区是仓库子目录时，工作树以仓库根目录为基准，而会话从其中对应的子目录运行。创建会话工作树使用该方法的 `operator.write` 权限范围，但 `.openclaw/worktree-setup.sh` 步骤仅对 `operator.admin` 调用方运行，因为它会执行仓库代码；`.worktreeinclude` 配置仍适用于所有调用方。仅当移除工作树不会造成任何损失时，删除会话才会移除该工作树。包含未提交改动的工作树或具有未推送提交的分支会被保留；每小时运行的清理任务会为闲置超过 7 天的会话工作树创建快照，并将近期会话活动视为工作树活动。已移除的工作树仍可按照下文所述从其快照恢复。

当任务面向配置的智能体工作区之外的项目时，`sessions.create` 可以在设置 `worktree: true` 的同时包含绝对路径 `cwd`。该显式主机路径需要 `operator.admin`；常规工作树聊天创建仍只需要 `operator.write`，并以配置的工作区为基准。

`sessions.create` 还接受与 `worktree: true` 一起使用的 `worktreeBaseRef` 和 `worktreeName`，用于选择基础引用和工作树名称（分支将变为 `openclaw/<name>`）；两者仍只需要 `operator.write`。创建的工作树会在创建结果中返回，并以 `worktree: { id, branch, repoRoot }` 的形式持久化到会话行中，因此会话列表可以显示检出目录和分支。删除会话时，如果保留了包含未提交改动的检出目录，则会报告为 `worktreePreserved`，而不是不作提示地将其遗留。

## 快照、清理和恢复

移除操作会先创建一个合成提交，其中包含已跟踪文件和未忽略的未跟踪文件，并将其固定在 `refs/openclaw/snapshots/<id>`。Git 忽略的文件不会进入仓库对象数据库；由 `.worktreeinclude` 选中的文件会在恢复期间再次复制。如果快照创建失败，移除操作会停止。显式强制删除可以在不创建快照的情况下继续。

OpenClaw 应用以下清理规则：

- 运行结束时，仅当 `git status --porcelain` 为空且 `git log HEAD --not --remotes --oneline` 未发现未推送提交时，才会移除工作树。否则只会释放活动锁。
- 每小时运行的清理任务会为已解锁且闲置超过 7 天的 Workboard 所有工作树和会话所有工作树创建快照并将其移除，即使工作树包含未提交改动也是如此。手动工作树绝不会被自动移除。
- 快照记录会保留 30 天以供恢复。之后，清理任务会删除快照引用和注册表行。
- 活跃的 OpenClaw 进程锁以及任何外部或无法识别的 Git 工作树锁都会保护工作树，避免其被垃圾回收。

恢复操作会在创建快照前的原始提交处重新创建 `openclaw/<name>`，然后将快照中的差异重建为未暂存的修改和未跟踪文件。这样可以避免合成快照提交进入分支历史。快照引用会继续记录，作为来源信息。

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Control UI 中 Settings 下的 **Worktrees** 页面提供相同的操作，还支持使用基础分支选择器创建工作树；该页面会显示每个工作树的所有者（手动、Workboard 或拥有该工作树的会话，并提供进入其聊天的链接），并在移除操作报告快照失败时提供强制重试选项。

## Gateway 网关方法

| 方法                 | 用途                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出活跃和可恢复的工作树记录。                                          |
| `worktrees.branches` | 列出仓库的本地和远程分支，供基础引用选择器使用。                        |
| `worktrees.create`   | 创建或复用具有指定名称的托管工作树。                                    |
| `worktrees.remove`   | 为工作树创建快照并将其移除。强制移除会报告 `snapshotError`。             |
| `worktrees.restore`  | 从快照恢复已移除的工作树。                                              |
| `worktrees.gc`       | 立即运行闲置、孤立和保留期清理。                                        |

`worktrees.list` 需要 `operator.read`，修改类方法需要 `operator.admin`。对于配置的智能体工作区，`worktrees.branches` 需要 `operator.write`；其他任何主机路径都需要 `operator.admin`（与 `sessions.create` 的 `cwd` 权限门槛一致）。它只读取现有引用，绝不会执行获取操作；仅存在于远程的分支会以带远程限定符的形式返回（`origin/feature-a`），确保返回的每个名称都可解析为基础引用。

## Workboard 工作区

内置的 [Workboard 插件](/zh-CN/plugins/workboard) 可以将卡片工作区具体化为托管工作树：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 标识源 Git 检出目录。`branch` 是可选项，并会作为基础引用。当调度开始运行卡片的工作节点时，Workboard 会创建或复用 `wb-<card-id>`，以托管检出目录作为工作目录运行子智能体，并将解析后的路径和分支写回卡片。由 Gateway 网关触发的具体化操作需要 `operator.admin`。运行结束时，仅当可以证明移除检出目录不会造成任何损失时，Workboard 才会将其移除；包含未提交改动或未推送提交的工作区会继续保留。

当前，沙箱隔离的嵌入式智能体会拒绝使用配置的智能体工作区之外的任务工作目录。在沙箱运行时支持附加检出挂载之前，请为使用 Workboard 托管工作树的卡片选择未启用沙箱隔离的目标智能体。
