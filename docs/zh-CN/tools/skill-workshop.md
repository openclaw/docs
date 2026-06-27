---
read_when:
    - 你希望智能体通过聊天创建或更新技能
    - 你需要审核、应用、拒绝或隔离生成的技能草稿
    - 你正在配置 Skill Workshop 审批、自主性、存储或限制
sidebarTitle: Skill Workshop
summary: 通过 Skill Workshop 审阅创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-06-27T03:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

技能工作坊是 OpenClaw 用于创建和更新工作区技能的受治理路径。

智能体和操作者不会通过此路径直接写入活跃的 `SKILL.md` 文件。它们会先创建一个**提案**。提案是一个待处理草稿，包含拟议的技能内容、目标绑定、扫描器状态、哈希、支持文件元数据和回滚元数据。只有在应用后，它才会成为实时技能。

技能工作坊只写入工作区技能。它不会修改内置、插件、ClawHub、额外根目录、托管、个人智能体或系统技能。

## 工作方式

- **先提案：** 生成的技能内容会存储为 `PROPOSAL.md`，而不是 `SKILL.md`。
- **应用是唯一的实时写入：** 创建、更新和修订不会更改活跃技能。
- **限定在工作区范围：** 创建以工作区 `skills/` 根目录为目标。只允许更新可写的工作区技能。
- **不覆盖：** 如果目标技能已存在，创建会失败。
- **哈希绑定：** 更新提案会绑定到当前目标哈希；如果实时技能在应用前发生变化，提案会变为过期。
- **扫描器门控：** 应用会在写入前重新运行扫描。
- **可恢复：** 应用会在更改实时文件前写入回滚元数据。
- **一致的表面：** 聊天、CLI 和 Gateway 网关都会调用同一个技能工作坊服务。

## 生命周期

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

只有 `pending` 提案可以被修订、应用、拒绝或隔离。

## 聊天

向智能体说明你想要的技能。智能体会调用 `skill_workshop` 并返回一个提案 ID。

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

默认情况下，由智能体发起的 `apply`、`reject` 和 `quarantine` 会在运行前显示审批提示。在受信任环境中，将 `skills.workshop.approvalPolicy` 设置为 `"auto"` 可跳过该提示。

## CLI

创建新的技能提案：

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

为现有工作区技能创建更新提案：

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

列出和检查：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

在审批前修订：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

结束提案：

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## 提案内容

在待处理期间，提案会以 `PROPOSAL.md` 存储，并带有仅用于提案的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

应用时，技能工作坊会写入活跃的 `SKILL.md`，并移除仅用于提案的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当拟议技能需要放在 `PROPOSAL.md` 旁边的文件时，使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于：

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

技能工作坊会随提案一起扫描、哈希并存储支持文件。只有在应用时，它们才会写入实时 `SKILL.md` 旁边。

被拒绝的支持文件路径包括绝对路径、隐藏路径段、路径遍历、重叠路径、来自提案目录的可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的文件。

## 智能体工具

模型使用 `skill_workshop`：

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

智能体必须使用 `skill_workshop` 处理生成的技能工作。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作来创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，并包含在 `tools.profile: "coding"` 中。如果更严格的策略隐藏了它，请将 `skill_workshop` 添加到活跃的 `tools.allow` 列表，或者在作用域使用没有显式 `tools.allow` 的配置文件时使用 `tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构造宿主侧的技能工作坊工具，因此请从普通的宿主侧智能体会话或 CLI 运行提案审查操作。
</Note>

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

- `autonomous.enabled`：允许 OpenClaw 在成功轮次后，根据持久对话信号创建待处理提案。默认值：`false`。
- `allowSymlinkTargetWrites`：允许应用写入工作区技能符号链接，前提是其真实目标列在 `skills.load.allowSymlinkTargets` 中。默认值：`false`。
- `approvalPolicy: "pending"`：要求在智能体发起的 `apply`、`reject` 或 `quarantine` 前显示审批提示。
- `approvalPolicy: "auto"`：跳过该审批提示。智能体仍必须调用该动作。
- `maxPending`：限制每个工作区的待处理和已隔离提案数量。
- `maxSkillBytes`：限制提案正文大小。默认值：`40000`。

提案描述始终限制为 160 字节。

## Gateway 网关方法

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

只读方法需要 `operator.read`。修改方法需要 `operator.admin`。

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
- `PROPOSAL.md`：待处理技能提案。
- `rollback.json`：在应用更改实时文件前写入的恢复元数据。

## 限制

- 描述：160 字节。
- 提案正文：`skills.workshop.maxSkillBytes`（默认 40,000）。
- 支持文件：每个提案 64 个。
- 支持文件大小：每个 256 KB，总计 2 MB。
- 待处理和已隔离提案：每个工作区 `skills.workshop.maxPending` 个（默认 50）。

## 故障排除

| 问题                                           | 解决方法                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短到 160 字节或更少。                                                                                                                                                                    |
| `Skill proposal content is too large`          | 缩短提案正文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 针对当前目标修订提案，或创建新提案。                                                                                                                                                                        |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离提案。                                                                                                                                                                  |
| `untrusted symlink target`                     | 仅对有意共享的技能根目录配置 `skills.load.allowSymlinkTargets` 并启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                         |
| `Support file paths must be under one of...`   | 将支持文件移动到 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                     |
| 提案未显示在列表中                             | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 智能体无法调用 `skill_workshop`                | 检查活跃的工具策略和运行模式。`coding` 包含该工具；限制性的 `tools.allow` 策略必须显式列出它，而沙箱隔离运行必须使用普通宿主侧智能体会话或 CLI。 |

## 相关

- [Skills](/zh-CN/tools/skills)：了解加载顺序、优先级和可见性
- [创建技能](/zh-CN/tools/creating-skills)：了解手写 `SKILL.md` 基础
- [Skills 配置](/zh-CN/tools/skills-config)：了解完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：了解 `openclaw skills` 命令
