---
read_when:
    - 你希望智能体通过聊天创建或更新 Skill
    - 你需要审核、应用、拒绝或隔离生成的技能草稿
    - 你正在配置 Skill Workshop 的审批、自主性、存储或限制
    - 你想了解自我学习提案在哪里审核
sidebarTitle: Skill Workshop
summary: 通过 Skills Workshop 审查创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-16T12:04:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用于创建和更新工作区
Skills 的受治理路径。智能体和操作员绝不会通过此路径直接写入 `SKILL.md`
——他们创建一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），
该提案只有在应用后才会成为实际生效的 Skill。

Skill Workshop 仅写入工作区 Skills。它绝不会触及内置、
插件、ClawHub、额外根目录、托管式、个人智能体或系统 Skills。

## 工作原理

- **提案优先：**生成的内容存储为 `PROPOSAL.md`，而不是
  `SKILL.md`。
- **应用是唯一的实际写入操作：**创建、更新和修订绝不会更改
  活跃的 Skills。
- **限定于工作区：**创建操作以工作区 `skills/` 根目录为目标；仅允许更新
  可写的工作区 Skills。
- **禁止覆盖：**如果目标 Skill 已存在，创建操作将失败。
- **哈希绑定：**更新提案绑定到目标的当前哈希；如果实际生效的 Skill 在应用前发生变化，
  提案将变为 `stale`。
- **扫描器把关：**应用操作会在写入前重新运行安全扫描器。
- **可恢复：**应用操作会在修改实际文件前写入回滚元数据。
- **界面一致：**聊天、CLI 和 Gateway 网关都调用同一服务。

## 生命周期

```text
创建/更新 -> 待处理
修订      -> 待处理
应用      -> 已应用
拒绝      -> 已拒绝
隔离      -> 已隔离
目标变更  -> 已过期
```

只有 `pending` 提案可以被修订、应用、拒绝或隔离。

## 生命周期管理

Gateway 网关在共享状态数据库中跟踪汇总的 Skill 使用情况。它每天会审查一次由
Skill Workshop 创建和应用的 Skills。超过 30 天未使用的 Skills 会变为
`stale`；90 天后会变为 `archived`，并且不会包含在新的智能体 Skill
快照中。已归档的 Skill 文件在磁盘上保持不变。手动编写的 Skills 永远不会被管理；
只有通过 Skill Workshop 提案创建的 Skills 才会进入生命周期管理。

已固定的 Skills 会绕过生命周期转换。过期的 Skill 在被使用且下一次扫描运行后会恢复为
`active`。已归档的 Skills 只能通过显式恢复重新启用：

生命周期转换和恢复适用于新会话；正在运行的会话会保留其当前 Skill 快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有管理器命令都接受 `--json`。状态还会将确定性的重叠候选项仅作为建议报告；
它绝不会合并 Skills 或调用模型。

## 聊天

向智能体描述所需的 Skill；它会调用 `skill_workshop` 并返回
提案 ID。

### 从近期工作中学习

使用 `/learn` 将当前对话或指定来源转换为一个
遵循标准指导的 Skill 提案：

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

没有请求内容时，`/learn` 会要求智能体从当前对话中提炼可复用的工作流。
有请求内容时，智能体会将路径、URL、粘贴的笔记和对话引用视为来源，同时遵循重点、
范围和命名要求。它会使用现有工具收集来源，然后使用 `action: "create"`
调用 `skill_workshop`。

生成的提案会保持 `pending` 状态；`/learn` 永远不会应用它。
通过常规审批流程或使用 `openclaw skills workshop` 审查并应用该提案。

创建：

```text
创建一个名为 morning-catchup 的 Skill，用于执行我周一的收件箱例行流程。
```

更新现有工作区 Skill：

```text
更新 trip-planning，使其在预订前也检查座位图。
```

迭代修改待处理提案：

```text
向我展示 morning-catchup 提案。
修订它，使其也标记所有标为紧急的内容。
应用 morning-catchup 提案。
```

默认情况下，由智能体发起的 `apply`、`reject` 和 `quarantine`
无需额外审批提示即可运行。将 `skills.workshop.approvalPolicy` 设置为 `"pending"`，
可要求操作员在执行这些操作前进行审批。

需要审批时，提示会标明提案 ID 和目标 Skill，并显示提案描述、支持文件数量和正文大小。
审批请求有时间限制，以确保在智能体工具看门狗超时前结束。如果提示到期前未收到决定，
生命周期操作不会运行：提案将保持待处理且不发生变化。稍后可在 Skill Workshop UI
中作出决定，或运行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。智能体不应循环重试已过期的生命周期操作。

## CLI

```bash
# 创建
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件箱跟进：分类、归档、突出显示、起草、规划" \
  --proposal ./PROPOSAL.md

# 更新现有工作区 Skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 列出和检查
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 审批前修订
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 结束处理
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "重复"
openclaw skills workshop quarantine <proposal-id> --reason "需要安全审查"
```

每个子命令都接受 `--agent <id>`（目标工作区；默认先根据当前工作目录推断，
再使用默认智能体）和 `--json`（结构化输出）。
`propose-create`、`propose-update` 和 `revise` 还接受
`--goal <text>` 和 `--evidence <text>`，用于在 `--proposal` 旁记录提案上下文。

## 提案内容

在待处理期间，提案以 `PROPOSAL.md` 的形式存储，并包含仅供提案使用的
frontmatter：

```markdown
---
name: "morning-catchup"
description: "每日收件箱跟进：分类、归档、突出显示、起草、规划"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

应用时，Skill Workshop 会写入活跃的 `SKILL.md`，并移除
仅供提案使用的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当提议的 Skill 需要位于 `PROPOSAL.md` 旁的文件时，
使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "周五总结：统计数据、重点、下周最重要的三件事" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于
`assets/`、`examples/`、`references/`、`scripts/`
或 `templates/` 下。Skill Workshop 会扫描、哈希并随提案一起存储这些文件，
仅在应用时才将其写入实际生效的 `SKILL.md` 旁。

会被拒绝的支持文件路径包括：绝对路径、隐藏路径段、路径遍历、重叠路径、
可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹以外的路径。

## 智能体工具

模型使用 `skill_workshop`，并需要一个必填的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他参数根据操作而定：

| 参数                       | 使用方                                               | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`         | `create`、`inspect`、`revise` | `create` 必填；否则按名称解析待处理提案                     |
| `description`         | `create`、`update`、`revise` | 最大 160 字节                                                        |
| `skill_name`         | `update`                                   | 现有 Skill 名称或键                                                  |
| `proposal_content`         | `create`、`update`、`revise` | 存储为 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制                |
| `support_files`         | `create`、`update`、`revise` | `{ path, content }` 数组                                              |
| `goal`、`evidence` | `create`、`update`、`revise` | 自由文本上下文                                                       |
| `proposal_id`         | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目标提案                                                             |
| `reason`         | `apply`、`reject`、`quarantine` | 可选                                                                 |
| `query`、`status`、`limit` | `list` | 筛选/分页；`limit` 最大值为 50，默认值为 20               |

智能体必须使用 `skill_workshop` 处理生成的 Skill 工作。不得通过
`write`、`edit`、`exec`、shell 命令或直接文件系统操作
创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，包含在
`tools.profile: "coding"` 中。如果更严格的策略将其隐藏，请将
`skill_workshop` 添加到活跃的 `tools.allow` 列表；如果作用域使用的配置文件
没有显式的 `tools.allow`，则使用 `tools.alsoAllow: ["skill_workshop"]`。
沙箱隔离运行不会构建主机端 Skill Workshop 工具，因此请从普通的主机端
智能体会话或 CLI 运行提案审查操作。
</Note>

## 建议的 Skills

OpenClaw 会在交互轮次结束时（包括失败的轮次）检测“下次”“记得要”等持久性指令
以及响应式纠正。在下一个轮次中，智能体会提议通过 `skill_workshop` 保存最近检测到的
工作流；由用户决定是否创建提案。此内置建议本身不会创建或更改 Skill。
启用 `skills.workshop.autonomous.enabled` 可改为直接创建待处理提案。在 Control UI 中，
Workshop 选项卡在页面标题中以 **自我学习** 开关提供相同设置，并在空白提案看板上
提供启用按钮。

### 扫描过去的会话

Control UI 可以在不启用自主自我学习的情况下审查较早的工作。
打开 **Plugins → Workshop** 并选择 **Find skill ideas**。扫描会从
最新的符合条件的会话开始，并审查一个有界限的实质性工作窗口。
它会跳过 cron、heartbeat、hook、子智能体、ACP、插件所有和内部审查
会话，以及模型轮次少于六次的对话。

审查器使用所选智能体配置的模型，并接收经过密钥脱敏且大小受限的转录包。
它采用与经验审查相同的保守标准：具体的恢复模式，或可减少至少两次未来模型或工具调用的
稳定过程。例行工作和一次性事实不应生成提案。

一次扫描最多可以创建或修订三个待处理提案。它不能应用、拒绝、隔离或编辑实际生效的
Skill。Workshop 会显示累计覆盖范围，例如 **已审查 20 个会话 · 6 月 18 日至今天 ·
发现 2 个想法**。选择 **Scan earlier work** 可从已持久化的最早会话游标继续。
可用历史记录全部扫描完后，该操作会变为 **Scan new work**。

即使 `skills.workshop.autonomous.enabled` 为 `false`，历史审查也需手动执行。每次点击都会启动一次模型运行，因此提供商的定价和数据处理条款适用。游标和覆盖计数存储在 OpenClaw 共享状态数据库中；转录内容不会复制到扫描状态中。

启用自主捕获后，OpenClaw 还可以在成功完成大量工作并且整个智能体系统进入空闲状态后执行保守审查。该隔离审查最多可以创建或修订一个待处理提案。它无法更新正在使用的技能，也无法应用、拒绝或隔离提案，即使 `approvalPolicy` 为 `"auto"` 也是如此。

有关启用方式、适用条件、隐私和成本详情、提案阈值以及故障排查，请参阅[自我学习](/zh-CN/tools/self-learning)。

## 审批与自主性

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 设置                    | 默认值  | 效果                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | 根据明确的纠正创建待处理提案，并在空闲延迟后，根据已完成的大量工作中可复用的恢复方法或显著节省往返操作的内容创建待处理提案。   |
| `allowSymlinkTargetWrites` | `false`  | 允许应用操作通过工作区技能符号链接写入，但其真实目标必须列在 `skills.load.allowSymlinkTargets` 中。                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` 会跳过智能体发起的 `apply`、`reject` 或 `quarantine` 的额外提示（智能体仍必须调用该操作）。`"pending"` 需要审批。 |
| `maxPending`               | `50`     | 限制每个工作区的待处理和已隔离提案数量（1-200）。                                                                                                       |
| `maxSkillBytes`            | `40000`  | 限制提案正文的字节大小（1024-200000）。                                                                                                                     |

自主捕获可以识别前瞻性规则（例如“从现在开始”）和响应式纠正（例如“这不是我要求的”）。它按主题将新指令分组，每轮最多生成三个提案，将词汇匹配项路由到现有的可写工作区技能，并在另一项纠正针对同一技能时修订其自身的待处理提案。

对于没有明确纠正的成功且大量的工作，所选模型的一次隔离运行会判断已完成的轨迹是否达到保守的提案门槛。前台模型不会在回复前收到学习提示。后台审查器会保留前台运行作为提案来源，无法访问通用智能体工具，也无法作出生命周期决策。只有当前台运行时同时报告其准确解析后的模型以及 `skill_workshop` 确实可用时，审查才会开始。因此，受限或未知的工具策略会以关闭方式失败，并且不会创建提案。

有关完整的自主审查行为和安全模型，请参阅[自我学习](/zh-CN/tools/self-learning)。

无论 `maxSkillBytes` 的值为何，提案描述始终限制为 160 字节。

## Gateway 网关方法

| 方法                             | 权限范围            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` 仅适用于 Gateway 网关（没有对应的 CLI 或智能体工具）：对于要求智能体进行修订而非提交原样新内容的 UI，它会将自由文本修订指令转发到所属智能体的聊天会话，而不是直接替换 `PROPOSAL.md`。

`historyStatus` 和 `historyScan` 是 Control UI 支持方法。`historyScan` 接受 `direction: "older" | "newer"`；它始终将结果保留为待处理提案。

## 存储

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

默认状态目录：`~/.openclaw`。

- `proposal.json`：规范提案记录。
- `proposals.json`：快速列表索引，可从提案文件夹重新构建。
- `PROPOSAL.md`：待处理的技能提案。
- `rollback.json`：在应用操作更改实际文件之前写入的恢复元数据。

## 限制

| 限制                           | 值                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                     | 160 字节                                                            |
| 提案正文                   | `skills.workshop.maxSkillBytes`（默认 40,000；硬上限 1 MiB） |
| 支持文件                   | 每个提案 64 个                                                      |
| 支持文件大小               | 每个 256 KiB，总计 2 MiB                                            |
| 待处理 + 已隔离提案 | 每个工作区 `skills.workshop.maxPending` 个（默认 50）              |

## 故障排查

| 问题                                        | 解决方法                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短至 160 字节或更少。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 缩短提案正文或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                         |
| `Target skill changed after proposal creation` | 针对当前目标修订提案，或创建新提案。                                                                                                                                   |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离提案。                                                                                                                                           |
| `untrusted symlink target`                     | 配置 `skills.load.allowSymlinkTargets`，并且仅对有意共享的技能根目录启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                  |
| `Support file paths must be under one of...`   | 将支持文件移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                |
| 提案未显示在列表中                 | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                            |
| 智能体无法调用 `skill_workshop`             | 检查当前工具策略和运行模式。`coding` 包含该工具；受限的 `tools.allow` 策略必须明确列出该工具，沙箱隔离运行则必须使用普通的主机端智能体会话或 CLI。 |

### 工具策略诊断

启用自主捕获后，`openclaw doctor` 会为默认智能体运行 `core/doctor/skill-workshop-tool-policy` 检查。如果策略隐藏了 `skill_workshop`，警告会指出第一个将其排除的配置层，以及需要执行的确切 `allow` 或 `alsoAllow` 更改。较旧的运行手册可能仍使用 `openclaw plugins inspect skill-workshop`；该命令现在会说明 Skill Workshop 已内置，并在适用时输出相同的策略提示。

## 相关内容

- [Skills](/zh-CN/tools/skills)：了解加载顺序、优先级和可见性
- [自我学习](/zh-CN/tools/self-learning)：了解保守的运行后技能提案
- [创建技能](/zh-CN/tools/creating-skills)：了解手动编写 `SKILL.md` 的基础知识
- [Skills 配置](/zh-CN/tools/skills-config)：了解完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：了解 `openclaw skills` 命令
