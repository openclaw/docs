---
read_when:
    - 你需要为一项智能体任务使用隔离的分支和 checkout
    - 你正在使用工作树工作区配置 Workboard 卡片
    - 你需要还原或清理 OpenClaw 管理的工作树
summary: 在隔离的 git 检出中运行 agent 任务，并自动创建快照和清理
title: 托管工作树
x-i18n:
    generated_at: "2026-07-06T10:49:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d0933ab3d3bf7235fa42365fd2db9f20e7e78192fb378c5ea0776ab10a9152
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

托管工作树为智能体任务提供自己的 git 分支和检出，而不会在源代码仓库内放置临时目录。OpenClaw 会在其状态目录下创建它们，将其记录到共享状态数据库中，并在移除前快照其已跟踪内容和未被忽略的未跟踪内容。

## 布局和名称

每个工作树位于：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

仓库指纹是基于规范 git 公共目录和 origin URL 计算的 SHA-256 哈希的前 16 个十六进制字符。提供的名称必须匹配 `[a-z0-9][a-z0-9-]{0,63}`。如果没有名称，OpenClaw 会生成 `wt-` 后跟八个随机十六进制字符。

OpenClaw 会在请求的基础引用处创建分支 `openclaw/<name>`。如果没有基础引用，它会拉取 `origin`，在可用时使用远程默认分支，并在仓库离线或没有可用远程时回退到本地 `HEAD`。

## 预置被忽略文件

在源代码仓库根目录添加 `.worktreeinclude`，以将选定的被忽略、未跟踪文件复制到新的工作树中。该文件使用 gitignore 模式语法，每行一个模式，并支持 `#` 注释：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 报告为同时被忽略且未跟踪的文件才符合条件。已跟踪文件已经通过 git 存在，绝不会在此步骤中复制。OpenClaw 不会覆盖目标文件，也不会跟随符号链接目录，并且会保留复制文件的模式。

## 运行仓库设置

如果源代码仓库中存在 `.openclaw/worktree-setup.sh` 且可执行，OpenClaw 会以新工作树作为当前目录运行它。脚本会收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零退出码会中止创建，并移除新的工作树和分支。这是仓库本地契约；没有对应的 OpenClaw 配置键。

## 会话工作树

使用 **在工作树中新建聊天** 从活跃智能体的 git 工作区启动隔离聊天：使用 Control UI 侧边栏中的辅助新聊天操作、iOS 上的聊天操作菜单，或 Android 上新聊天旁边的溢出操作。该操作仅适用于由 git 支撑且客户端具备该能力的智能体；无法预检的客户端会改为显示 Gateway 网关错误。

生成的托管工作树归会话所有，该会话中的每次智能体运行都会使用它的检出。当工作区是仓库子目录时，工作树会锚定在仓库根目录，会话会从其中匹配的子目录运行。会话工作树创建使用该方法的 `operator.write` 权限范围，但 `.openclaw/worktree-setup.sh` 步骤仅会为 `operator.admin` 调用方运行，因为它会执行仓库代码；`.worktreeinclude` 预置仍适用于每个调用方。删除会话时，仅在无损的情况下才会移除工作树。脏工作树或包含未推送提交的分支会保持可用；每小时清理会在会话工作树闲置 7 天后为其创建快照，并将最近的会话活动视为工作树活动。已移除的工作树仍可按下文所述从其快照中恢复。

## 快照、清理和恢复

移除会先创建一个包含已跟踪文件和未被忽略的未跟踪文件的合成提交，并将其固定在 `refs/openclaw/snapshots/<id>`。被 git 忽略的文件会从仓库对象数据库中排除；由 `.worktreeinclude` 选中的文件会在恢复期间再次复制。如果快照创建失败，移除会停止。显式强制删除可以在没有快照的情况下继续。

OpenClaw 应用以下清理规则：

- 在运行结束时，只有当 `git status --porcelain` 为空且 `git log HEAD --not --remotes --oneline` 未发现未推送提交时，它才会移除工作树。否则它只会释放活动锁。
- 每小时清理会为解锁且由 Workboard 和会话拥有、闲置超过 7 天的工作树创建快照并移除它们，即使它们是脏的。手动工作树绝不会被自动移除。
- 快照记录在 30 天内保持可恢复。随后清理会删除快照引用和注册表行。
- 活跃的 OpenClaw 进程锁以及任何外部或未识别的 git 工作树锁都会保护工作树免于垃圾回收。

恢复会在原始快照前提交处重新创建 `openclaw/<name>`，然后将快照差异重建为未暂存修改和未跟踪文件。这会使合成快照提交不进入分支历史。快照引用仍会作为来源记录保留。

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Control UI **工作树** 页面提供相同的列表、删除、恢复和清理操作。

## Gateway 网关方法

| 方法                | 用途                                      |
| ------------------- | ----------------------------------------- |
| `worktrees.list`    | 列出活跃和可恢复的工作树记录。            |
| `worktrees.create`  | 创建或复用具名托管工作树。                |
| `worktrees.remove`  | 为工作树创建快照并移除它。                |
| `worktrees.restore` | 从快照恢复已移除的工作树。                |
| `worktrees.gc`      | 立即运行闲置、孤立和保留期清理。          |

`worktrees.list` 需要 `operator.read`。变更方法需要 `operator.admin`。

## Workboard 工作区

内置的 [Workboard 插件](/zh-CN/plugins/workboard) 可以将卡片工作区具体化为托管工作树：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 标识源 git 检出。`branch` 是可选的，并会成为基础引用。当派发启动卡片的 worker 时，Workboard 会创建或复用 `wb-<card-id>`，以托管检出作为工作目录运行子智能体，并将解析后的路径和分支写回卡片。由 Gateway 网关触发的具体化需要 `operator.admin`。在运行结束时，Workboard 仅在可证明无损的情况下移除检出；脏工作或未推送提交会保持可用。

沙箱隔离的嵌入式智能体目前会拒绝配置的智能体工作区之外的任务工作目录。在沙箱运行时支持增量检出挂载之前，请为 Workboard 托管工作树卡片使用未沙箱隔离的目标智能体。
