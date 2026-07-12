---
read_when:
    - 你希望智能体通过聊天创建或更新技能
    - 你需要审核、应用、拒绝或隔离一份生成的技能草稿
    - 你正在配置 Skill Workshop 的审批、自主性、存储或限制
sidebarTitle: Skill Workshop
summary: 通过 Skill Workshop 审查创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-11T21:02:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

技能工作坊是 OpenClaw 用于创建和更新工作区技能的受控路径。智能体和操作员绝不会通过此路径直接写入 `SKILL.md`——他们会创建一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），只有应用后才会成为正式启用的技能。

技能工作坊仅写入工作区技能。它绝不会改动内置技能、插件技能、ClawHub 技能、额外根目录技能、托管技能、个人智能体技能或系统技能。

## 工作原理

- **提案优先：**生成的内容存储为 `PROPOSAL.md`，而不是
  `SKILL.md`。
- **应用是唯一的正式写入操作：**创建、更新和修订绝不会更改
  活跃技能。
- **限定于工作区：**创建操作以工作区的 `skills/` 根目录为目标；仅允许更新
  可写的工作区技能。
- **禁止覆盖：**如果目标技能已存在，创建操作会失败。
- **哈希绑定：**更新提案会绑定当前目标哈希；如果正式技能在应用前发生变化，
  提案会变为 `stale`。
- **扫描器把关：**应用操作会在写入前重新运行安全扫描器。
- **可恢复：**应用操作会在改动正式文件前写入回滚元数据。
- **界面一致：**聊天、CLI 和 Gateway 网关都调用同一服务。

## 生命周期

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

只有 `pending` 提案可以修订、应用、拒绝或隔离。

## 生命周期维护

Gateway 网关在共享状态数据库中跟踪技能的汇总使用情况。它每天会检查由技能工作坊创建并应用的技能。超过 30 天未使用的技能会变为 `stale`；90 天后会变为 `archived`，并且不会纳入新的智能体技能快照。已归档的技能文件在磁盘上保持不变。手动编写的技能绝不会被维护；只有通过技能工作坊提案创建的技能才会进入生命周期维护。

固定的技能会绕过生命周期转换。过期技能在被使用并完成下一次扫描后会恢复为 `active`。已归档技能只能通过显式恢复操作重新启用：

生命周期转换和恢复操作适用于新会话；正在运行的会话会保留其当前技能快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有维护器命令都接受 `--json`。状态命令还会将确定性的重叠候选项作为建议报告；它绝不会合并技能或调用模型。

## 聊天

向智能体描述你想要的技能；它会调用 `skill_workshop` 并返回提案 ID。

### 从近期工作中学习

使用 `/learn` 将当前对话或指定来源转换为一个遵循标准指导的技能提案：

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

不带请求时，`/learn` 会让智能体从当前对话中提炼可复用的工作流。带请求时，智能体会将路径、URL、粘贴的笔记和对话引用视为来源，同时遵循重点、范围和命名要求。它会使用现有工具收集这些来源，然后以 `action: "create"` 调用 `skill_workshop`。

生成的提案会保持 `pending`；`/learn` 绝不会应用它。请通过常规审批流程或使用 `openclaw skills workshop` 审查并应用该提案。

创建：

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

更新现有工作区技能：

```text
Update trip-planning to also check seat maps before booking.
```

迭代待处理提案：

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

默认情况下，由智能体发起的 `apply`、`reject` 和 `quarantine` 会显示审批提示。在可信环境中，将 `skills.workshop.approvalPolicy` 设置为 `"auto"` 可跳过该提示。

提示会标明提案 ID 和目标技能，并显示提案描述、支持文件数量和正文大小。审批请求会受到时限约束，以确保在智能体工具看门狗超时前完成。如果提示过期前没有收到决定，生命周期操作不会运行：提案会保持待处理且不发生变化。你可以稍后在技能工作坊界面中作出决定，或运行
`openclaw skills workshop apply|reject|quarantine <proposal-id>`。智能体不应循环重试已过期的生命周期操作。

## CLI

```bash
# Create
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Update an existing workspace skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# List and inspect
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revise before approval
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

每个子命令都接受 `--agent <id>`（目标工作区；默认先根据当前工作目录推断，然后使用默认智能体）和 `--json`（结构化输出）。`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>` 和 `--evidence <text>`，用于在 `--proposal` 之外记录提案上下文。

## 提案内容

在待处理期间，提案以 `PROPOSAL.md` 存储，其中包含仅供提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

应用时，技能工作坊会写入正式的 `SKILL.md`，并移除仅供提案使用的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当拟议技能需要在 `PROPOSAL.md` 旁包含其他文件时，请使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。技能工作坊会扫描这些文件、计算其哈希并随提案一同存储，且仅在应用时将它们写入正式 `SKILL.md` 旁边。

以下支持文件路径会被拒绝：绝对路径、隐藏路径段、路径遍历、重叠路径、可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的路径。

## 智能体工具

模型使用 `skill_workshop`，并提供一个必需的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他参数根据操作而定：

| 参数                       | 使用操作                                             | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；用于其他操作时按名称解析待处理提案                     |
| `description`              | `create`、`update`、`revise`                         | 最多 160 字节                                                        |
| `skill_name`               | `update`                                             | 现有技能名称或键                                                     |
| `proposal_content`         | `create`、`update`、`revise`                         | 存储为 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制        |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 数组                                             |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文本上下文                                                       |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目标提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 可选                                                                 |
| `query`、`status`、`limit` | `list`                                               | 筛选/分页；`limit` 最大为 50，默认为 20                              |

智能体必须使用 `skill_workshop` 处理生成式技能工作。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，包含在
`tools.profile: "coding"` 中。如果更严格的策略隐藏了它，请将
`skill_workshop` 添加到当前 `tools.allow` 列表；如果当前范围使用的配置档案没有显式 `tools.allow`，也可以使用
`tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构造宿主侧的技能工作坊工具，因此请从普通宿主侧智能体会话或 CLI 运行提案审查操作。
</Note>

## 建议的技能

当交互轮次结束时，包括失败的轮次，OpenClaw 会检测“下次”“记得”等持久性指令以及响应式纠正。在下一个轮次中，智能体会提出通过 `skill_workshop` 保存最近检测到的工作流；由用户决定是否创建提案。此内置建议本身不会创建或更改技能。启用 `skills.workshop.autonomous.enabled` 可改为直接创建待处理提案。

## 审批与自主性

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

| 设置                       | 默认值      | 效果                                                                                                                                                                  |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接创建待处理提案，而不是在下一轮提出保存最近检测到的工作流。                                                                                                        |
| `allowSymlinkTargetWrites` | `false`     | 允许应用操作通过工作区技能符号链接写入，前提是其真实目标列在 `skills.load.allowSymlinkTargets` 中。                                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在智能体发起 `apply`、`reject` 或 `quarantine` 前显示审批提示。`"auto"` 会跳过提示（智能体仍须调用该操作）。                                             |
| `maxPending`               | `50`        | 限制每个工作区的待处理和已隔离提案数量（1-200）。                                                                                                                      |
| `maxSkillBytes`            | `40000`     | 限制提案正文的字节大小（1024-200000）。                                                                                                                               |

自主捕获能够识别前瞻性规则（例如“从现在开始”）和响应式纠正（例如“这不是我要求的”）。它会按主题将新指令分组，每轮最多生成三个提案；将词汇匹配项路由到现有可写工作区技能；当另一次纠正指向同一技能时，还会修订它自己创建的待处理提案。

无论 `maxSkillBytes` 如何设置，提案描述始终限制为 160 字节。

## Gateway 网关方法

| 方法                               | 权限范围         |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` 仅适用于 Gateway 网关（CLI 或智能体工具中没有对应功能）：它会将自由文本形式的修订说明转发到所属智能体的聊天会话，而不是直接替换 `PROPOSAL.md`，供要求智能体进行修订、而非提交字面新内容的 UI 使用。

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

- `proposal.json`：规范的提案记录。
- `proposals.json`：快速列表索引，可根据提案文件夹重建。
- `PROPOSAL.md`：待处理的技能提案。
- `rollback.json`：在应用更改修改实际文件之前写入的恢复元数据。

## 限制

| 限制                   | 值                                                                   |
| ---------------------- | -------------------------------------------------------------------- |
| 描述                   | 160 字节                                                             |
| 提案正文               | `skills.workshop.maxSkillBytes`（默认 40,000；硬性上限 1 MiB）       |
| 支持文件               | 每个提案 64 个                                                       |
| 支持文件大小           | 每个 256 KiB，总计 2 MiB                                             |
| 待处理和已隔离的提案   | 每个工作区为 `skills.workshop.maxPending`（默认 50）                 |

## 故障排查

| 问题                                           | 解决方法                                                                                                                                                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短至不超过 160 字节。                                                                                                                                                                               |
| `Skill proposal content is too large`          | 缩短提案正文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                                 |
| `Target skill changed after proposal creation` | 根据当前目标修订提案，或创建新提案。                                                                                                                                                                                   |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离提案。                                                                                                                                                                             |
| `untrusted symlink target`                     | 仅针对有意共享的技能根目录配置 `skills.load.allowSymlinkTargets` 并启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                                    |
| `Support file paths must be under one of...`   | 将支持文件移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                                   |
| 提案未显示在列表中                             | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                                                   |
| 智能体无法调用 `skill_workshop`                | 检查当前工具策略和运行模式。`coding` 包含此工具；限制性的 `tools.allow` 策略必须显式列出它，并且沙箱隔离的运行必须使用普通的主机端智能体会话或 CLI。                                                                     |

### 工具策略诊断

启用自主捕获后，`openclaw doctor` 会针对默认智能体运行 `core/doctor/skill-workshop-tool-policy` 检查。如果策略隐藏了 `skill_workshop`，警告会指出第一个将其排除的配置层，以及需要进行的确切 `allow` 或 `alsoAllow` 更改。旧版运行手册可能仍使用 `openclaw plugins inspect skill-workshop`；该命令现在会说明 Skill Workshop 是内置功能，并在适用时输出相同的策略提示。

## 相关内容

- [Skills](/zh-CN/tools/skills)：了解加载顺序、优先级和可见性
- [创建技能](/zh-CN/tools/creating-skills)：了解手写 `SKILL.md` 的基础知识
- [Skills 配置](/zh-CN/tools/skills-config)：查看完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：了解 `openclaw skills` 命令
