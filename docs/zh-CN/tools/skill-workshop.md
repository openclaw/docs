---
read_when:
    - 你想让智能体通过聊天创建或更新技能
    - 你需要审查、应用、拒绝或隔离生成的技能草稿
    - 你正在配置 Skill Workshop 的审批、自主性、存储或限制
    - 你想了解在哪里审核自我学习提案
sidebarTitle: Skill Workshop
summary: 通过技能工坊审核创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-14T13:59:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7f9a223104b6335a15c853bffda4a159668db24c397656d2aadbd403eceeaa72
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用于创建和更新工作区技能的受管控路径。智能体和操作员绝不会通过此路径直接写入 `SKILL.md`，而是创建一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），仅在应用后才会成为生效技能。

Skill Workshop 仅写入工作区技能。它绝不会改动内置技能、插件技能、ClawHub 技能、额外根目录技能、托管技能、个人智能体技能或系统技能。

## 工作原理

- **提案优先：**生成的内容存储为 `PROPOSAL.md`，而不是
  `SKILL.md`。
- **应用是唯一的实时写入操作：**创建、更新和修订绝不会更改
  活跃技能。
- **限定于工作区：**创建操作以工作区的 `skills/` 根目录为目标；仅允许
  更新可写的工作区技能。
- **禁止覆盖：**如果目标技能已存在，创建操作将失败。
- **哈希绑定：**更新提案会绑定到目标的当前哈希；如果生效技能在应用前发生变化，
  提案将变为 `stale`。
- **扫描器把关：**应用操作会在写入前重新运行安全扫描器。
- **可恢复：**应用操作会在改动生效文件前写入回滚元数据。
- **界面一致：**聊天、CLI 和 Gateway 网关均调用同一服务。

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

Gateway 网关在共享状态数据库中跟踪技能的汇总使用情况。它每天会检查由 Skill Workshop 创建并应用的技能。超过 30 天未使用的技能会变为 `stale`；90 天后会变为 `archived`，并且不再包含在新智能体的技能快照中。已归档技能的文件在磁盘上保持不变。手动编写的技能绝不会受到管理；只有通过 Skill Workshop 提案创建的技能才会进入生命周期管理。

固定的技能会跳过生命周期转换。过期技能被使用并完成下一次扫描后，会恢复为 `active`。已归档技能只能通过显式恢复操作返回：

生命周期转换和恢复对新会话生效；正在运行的会话会保留其当前技能快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有管理命令都接受 `--json`。状态命令还会将确定性的重叠候选项作为建议报告；它绝不会合并技能或调用模型。

## 聊天

向智能体描述所需的技能；它会调用 `skill_workshop` 并返回提案 ID。

### 从近期工作中学习

使用 `/learn`，将当前对话或指定来源转化为一个遵循标准的技能提案：

```text
/learn
/learn docs/runbook.md 和 https://example.com/guide；重点关注恢复
```

未提供请求时，`/learn` 会要求智能体从当前对话中提炼可复用的工作流。提供请求时，智能体会将路径、URL、粘贴的笔记和对话引用视为来源，同时遵循重点、范围和命名要求。它会使用现有工具收集这些来源，然后使用 `action: "create"` 调用 `skill_workshop`。

生成的提案会保持 `pending` 状态；`/learn` 绝不会应用该提案。请通过常规审批流程或使用 `openclaw skills workshop` 审查并应用该提案。

创建：

```text
创建一个名为 morning-catchup 的技能，用于执行我的周一收件箱例行流程。
```

更新现有工作区技能：

```text
更新 trip-planning，使其在预订前也检查座位图。
```

迭代待处理提案：

```text
向我展示 morning-catchup 提案。
修订该提案，使其也标记所有注明紧急的内容。
应用 morning-catchup 提案。
```

由智能体发起的 `apply`、`reject` 和 `quarantine` 默认会显示审批提示。在受信任的环境中，将 `skills.workshop.approvalPolicy` 设置为 `"auto"` 可跳过该提示。

提示会标明提案 ID 和目标技能，并显示提案描述、支持文件数量和正文大小。审批请求会受到时限约束，以确保在智能体工具看门狗超时前完成。如果提示过期前未收到决定，生命周期操作不会运行：提案将保持待处理且不发生变化。之后可以在 Skill Workshop UI 中作出决定，或运行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。智能体不应循环重试已过期的生命周期操作。

## CLI

```bash
# 创建
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件箱跟进：分类、归档、呈现、起草、规划" \
  --proposal ./PROPOSAL.md

# 更新现有工作区技能
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 列出并检查
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 审批前修订
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 结束处理
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "重复"
openclaw skills workshop quarantine <proposal-id> --reason "需要安全审查"
```

每个子命令都接受 `--agent <id>`（目标工作区；默认先根据 cwd 推断，然后使用默认智能体）和 `--json`（结构化输出）。`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>` 和 `--evidence <text>`，用于在 `--proposal` 旁记录提案上下文。

## 提案内容

在待处理期间，提案会以 `PROPOSAL.md` 的形式存储，并包含仅供提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "每日收件箱跟进：分类、归档、呈现、起草、规划"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

应用时，Skill Workshop 会写入活跃的 `SKILL.md`，并移除仅供提案使用的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当提议的技能需要在 `PROPOSAL.md` 旁放置文件时，请使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "周五总结：统计数据、亮点、下周最重要的三项工作" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。Skill Workshop 会扫描这些文件、计算哈希并将其与提案一起存储，仅在应用时才会将它们写入生效的 `SKILL.md` 旁。

以下支持文件路径会被拒绝：绝对路径、隐藏路径段、路径遍历、重叠路径、可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的路径。

## 智能体工具

模型使用 `skill_workshop`，并且必须提供一个 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他参数根据操作而定：

| 参数                       | 使用方                                               | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；否则按名称解析待处理提案 |
| `description`              | `create`、`update`、`revise`                         | 最大 160 字节                                                        |
| `skill_name`               | `update`                                             | 现有技能名称或键名                                                   |
| `proposal_content`         | `create`、`update`、`revise`                         | 存储为 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制   |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 数组                                         |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文本上下文                                                       |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目标提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 可选                                                                 |
| `query`、`status`、`limit` | `list`                                               | 筛选/分页；`limit` 最大值为 50，默认值为 20                          |

智能体必须使用 `skill_workshop` 处理生成的技能。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，包含在 `tools.profile: "coding"` 中。如果更严格的策略隐藏了该工具，请将 `skill_workshop` 添加到活跃的 `tools.allow` 列表；如果作用域使用的配置文件没有显式 `tools.allow`，则使用 `tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构造主机端 Skill Workshop 工具，因此请从普通主机端智能体会话或 CLI 运行提案审查操作。
</Note>

## 建议的技能

OpenClaw 会在交互轮次结束时检测“下次”“记得要”之类的持久性指令以及响应式纠正，包括失败的轮次。在下一轮中，智能体会提议通过 `skill_workshop` 保存最近检测到的工作流；由用户决定是否创建提案。此内置建议本身不会创建或更改技能。启用 `skills.workshop.autonomous.enabled` 可改为直接创建待处理提案。在 Control UI 中，工坊选项卡会在页面标题中以**自我学习**开关提供相同设置，并在空提案面板上提供启用按钮。

### 扫描以往会话

无需启用自主自我学习，Control UI 也可以审查较早的工作。打开**插件 → 工坊**，然后选择**查找技能创意**。扫描会从最新的符合条件的会话开始，并审查一个有界范围内的实质性工作。它会跳过 cron、Heartbeat、钩子、子智能体、ACP、插件所有和内部审查会话，以及模型轮次少于六轮的对话。

审查器使用所选智能体配置的模型，并接收经过秘密信息脱敏且大小受限的对话记录包。它采用与经验审查相同的保守标准：必须存在具体的恢复模式或稳定的操作流程，并且该模式或流程能够在未来减少至少两次模型或工具调用。例行工作和一次性事实不应生成提案。

一次扫描最多可以创建或修订三个待处理提案。它无法应用、拒绝或隔离提案，也无法编辑生效技能。工坊会显示累计覆盖范围，例如**已审查 20 个会话 · 6 月 18 日至今天 · 发现 2 个创意**。选择**扫描更早的工作**，可从持久化的最早会话游标继续扫描。可用历史记录全部扫描完毕后，该操作会变为**扫描新工作**。

历史审查始终需要手动触发，即使
`skills.workshop.autonomous.enabled` 为 `false`。每次点击都会启动一次模型运行，
因此适用提供商的定价和数据处理条款。游标和覆盖范围计数
存储在共享的 OpenClaw 状态数据库中；转录内容不会复制
到扫描状态中。

启用自主捕获后，OpenClaw 还可以在成功完成大量工作并且整个智能体系统进入空闲状态后，执行保守审查。该隔离审查最多可以创建或
修订一个待处理提案。它无法更新正在使用的技能，也无法应用、拒绝或隔离
提案，即使 `approvalPolicy` 为 `"auto"`。

有关启用方式、适用条件、隐私和成本详情、提案阈值以及故障排查，请参阅[自我学习](/tools/self-learning)。

## 审批和自主性

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 设置                    | 默认值     | 效果                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 根据明确纠正创建待处理提案，并在空闲延迟后，根据包含可复用恢复方法或可显著节省往返操作的大量已完成工作创建待处理提案。      |
| `allowSymlinkTargetWrites` | `false`     | 允许应用操作通过工作区技能符号链接写入其真实目标，前提是该目标列在 `skills.load.allowSymlinkTargets` 中。                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在智能体发起 `apply`、`reject` 或 `quarantine` 前显示审批提示。`"auto"` 会跳过该提示（智能体仍须调用该操作）。 |
| `maxPending`               | `50`        | 限制每个工作区的待处理和已隔离提案数量（1-200）。                                                                                                          |
| `maxSkillBytes`            | `40000`     | 限制提案正文大小，以字节为单位（1024-200000）。                                                                                                                        |

自主捕获可识别预期规则（例如“从现在开始”）和响应式
纠正（例如“这不是我要求的”）。它按主题将新指令分组，每轮最多生成
三个提案，将词汇匹配项路由至现有的可写工作区技能，并在另一项纠正针对同一技能时
修订其自身的待处理提案。

对于没有明确纠正的成功大量工作，由所选
模型进行一次隔离运行，以判断已完成的轨迹是否达到保守的提案门槛。系统不会在前台模型回复前提示其进行学习。后台审查器会保留
前台运行作为提案来源，无法访问通用智能体工具，也无法做出生命周期
决策。仅当前台运行时同时报告其准确解析的模型
并且 `skill_workshop` 确实可用时，审查才会开始。因此，限制性或未知的工具策略
会以关闭方式失败，不会创建提案。

有关完整的自主审查行为和安全
模型，请参阅[自我学习](/tools/self-learning)。

无论 `maxSkillBytes` 如何设置，提案描述始终限制为 160 字节。

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

`requestRevision` 仅适用于 Gateway 网关（没有对应的 CLI 或智能体工具）：它
将自由文本修订指令转发到所属智能体的聊天会话，
而不是直接替换 `PROPOSAL.md`，供要求智能体进行
修订而不是提交字面新内容的 UI 使用。

`historyStatus` 和 `historyScan` 是 Control UI 支持方法。`historyScan`
接受 `direction: "older" | "newer"`；它始终将结果保留为待处理
提案。

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
- `proposals.json`：快速列表索引，可从提案文件夹重建。
- `PROPOSAL.md`：待处理的技能提案。
- `rollback.json`：应用操作更改实时文件前写入的恢复元数据。

## 限制

| 限制                           | 值                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                     | 160 字节                                                            |
| 提案正文                   | `skills.workshop.maxSkillBytes`（默认 40,000；硬上限 1 MiB） |
| 支持文件                   | 每个提案 64 个                                                      |
| 支持文件大小               | 每个 256 KiB，总计 2 MiB                                            |
| 待处理 + 已隔离提案 | 每个工作区 `skills.workshop.maxPending`（默认 50）              |

## 故障排查

| 问题                                        | 解决方法                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短至不超过 160 字节。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 缩短提案正文或增大 `skills.workshop.maxSkillBytes`。                                                                                                                                         |
| `Target skill changed after proposal creation` | 根据当前目标修订提案，或创建新提案。                                                                                                                                   |
| `Proposal scan failed`                         | 检查扫描器发现项，然后修订或隔离提案。                                                                                                                                           |
| `untrusted symlink target`                     | 配置 `skills.load.allowSymlinkTargets`，并仅对有意共享的技能根目录启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                  |
| `Support file paths must be under one of...`   | 将支持文件移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                |
| 提案未显示在列表中                 | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                            |
| 智能体无法调用 `skill_workshop`             | 检查当前工具策略和运行模式。`coding` 包含该工具；限制性 `tools.allow` 策略必须明确列出该工具，沙箱隔离运行则必须使用普通的主机端智能体会话或 CLI。 |

### 工具策略诊断

启用自主捕获时，`openclaw doctor` 会为默认智能体运行
`core/doctor/skill-workshop-tool-policy` 检查。如果策略
隐藏了 `skill_workshop`，警告将指出第一个排除它的配置层，
以及需要进行的准确 `allow` 或 `alsoAllow` 更改。旧版运行手册可能仍使用
`openclaw plugins inspect skill-workshop`；该命令现在会说明 Skill
Workshop 是内置功能，并在适用时输出相同的策略提示。

## 相关内容

- [Skills](/zh-CN/tools/skills)：了解加载顺序、优先级和可见性
- [自我学习](/tools/self-learning)：了解保守的运行后技能提案
- [创建技能](/zh-CN/tools/creating-skills)：了解手写 `SKILL.md`
  基础知识
- [Skills 配置](/zh-CN/tools/skills-config)：了解完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：了解 `openclaw skills` 命令
