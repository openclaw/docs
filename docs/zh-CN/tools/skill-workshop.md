---
read_when:
    - 你希望智能体从聊天中创建或更新一个技能
    - 你需要审查、应用、拒绝或隔离生成的 skill 草稿
    - 你正在配置 Skill Workshop 审批、自主性、存储或限制
sidebarTitle: Skill Workshop
summary: 通过 Skill Workshop 审核创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-05T11:48:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f5c2c11d4a170c98cc91cfb522a4de26e1fe76eba57da3df8072708584ce179
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用于创建和更新工作区 Skills 的受治理路径。智能体和操作员绝不会通过此路径直接写入 `SKILL.md`，而是创建一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），只有应用后才会成为生效技能。

Skill Workshop 只写入工作区 Skills。它绝不会触碰内置、插件、ClawHub、额外根目录、托管、个人智能体或系统 Skills。

## 工作原理

- **提案优先：**生成的内容会存储为 `PROPOSAL.md`，而不是 `SKILL.md`。
- **应用是唯一的生效写入：**创建、更新和修订绝不会更改已激活的 Skills。
- **限定于工作区：**创建操作目标是工作区 `skills/` 根目录；更新只允许针对可写的工作区 Skills。
- **不覆盖：**如果目标技能已存在，创建会失败。
- **哈希绑定：**更新提案会绑定到当前目标哈希；如果生效技能在应用前发生变化，提案会变为 `stale`。
- **受扫描器门禁：**应用会在写入前重新运行安全扫描器。
- **可恢复：**应用会在触碰生效文件前写入回滚元数据。
- **一致的表面：**聊天、CLI 和 Gateway 网关都会调用同一个服务。

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

向智能体说明你想要的技能；它会调用 `skill_workshop` 并返回提案 ID。

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

智能体发起的 `apply`、`reject` 和 `quarantine` 默认会显示审批提示。在受信任环境中，将 `skills.workshop.approvalPolicy` 设置为 `"auto"` 可跳过该提示。

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

每个子命令都接受 `--agent <id>`（目标工作区；默认先从 cwd 推断，然后使用默认智能体）和 `--json`（结构化输出）。`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>` 和 `--evidence <text>`，用于在 `--proposal` 旁记录提案上下文。

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

应用时，Skill Workshop 会写入已激活的 `SKILL.md`，并移除仅用于提案的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当提议的技能需要 `PROPOSAL.md` 旁边的文件时，使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。Skill Workshop 会扫描、哈希并随提案存储这些文件，然后只在应用时将它们写到生效 `SKILL.md` 旁边。

会被拒绝的支持文件路径：绝对路径、隐藏路径片段、路径遍历、重叠路径、可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的路径。

## 智能体工具

模型使用 `skill_workshop`，并带有一个必需的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他参数根据操作而适用：

| 参数                       | 使用方                                               | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；否则按名称解析待处理提案                              |
| `description`              | `create`、`update`、`revise`                         | 最多 160 字节                                                        |
| `skill_name`               | `update`                                             | 现有技能名称或键                                                     |
| `proposal_content`         | `create`、`update`、`revise`                         | 存储为 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制         |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 数组                                             |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文本上下文                                                       |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目标提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 可选                                                                 |
| `query`、`status`、`limit` | `list`                                               | 过滤/分页；`limit` 最大 50，默认 20                                  |

智能体必须使用 `skill_workshop` 处理生成的技能工作。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，并包含在 `tools.profile: "coding"` 中。如果更严格的策略隐藏了它，请将 `skill_workshop` 添加到活动的 `tools.allow` 列表，或者当作用域使用没有显式 `tools.allow` 的 profile 时，使用 `tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构造主机侧 Skill Workshop 工具，因此请从普通主机侧智能体会话或 CLI 运行提案审查操作。
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

| 设置                       | 默认值      | 作用                                                                                                                                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 允许 OpenClaw 在一次成功轮次后，根据持久对话信号创建待处理提案。                                                                                                       |
| `allowSymlinkTargetWrites` | `false`     | 允许应用操作写穿工作区技能符号链接，前提是其真实目标列在 `skills.load.allowSymlinkTargets` 中。                                                                         |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在智能体发起的 `apply`、`reject` 或 `quarantine` 前显示审批提示。`"auto"` 会跳过提示（智能体仍必须调用该操作）。 |
| `maxPending`               | `50`        | 限制每个工作区的待处理和已隔离提案数量（1-200）。                                                                                                                      |
| `maxSkillBytes`            | `40000`     | 限制提案正文大小（字节）（1024-200000）。                                                                                                                              |

提案描述始终限制为 160 字节，不受 `maxSkillBytes` 影响。

## Gateway 网关方法

| 方法                               | 作用域           |
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

`requestRevision` 仅用于 Gateway 网关（没有 CLI 或智能体工具等价项）：它会将自由文本修订说明转发到所属智能体的聊天会话，而不是直接替换 `PROPOSAL.md`，适用于让智能体修订而不是提交字面新内容的 UI。

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
- `rollback.json`：在应用更改生效文件前写入的恢复元数据。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                            | 160 字节                                                             |
| 提案正文                        | `skills.workshop.maxSkillBytes`（默认 40,000；硬上限 1 MiB）         |
| 支持文件                        | 每个提案 64 个                                                       |
| 支持文件大小                    | 每个 256 KiB，总计 2 MiB                                             |
| 待处理 + 已隔离提案             | 每个工作区 `skills.workshop.maxPending`（默认 50）                   |

## 故障排查

| 问题                                           | 解决方案                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短到 160 字节或更少。                                                                                                                                                                    |
| `Skill proposal content is too large`          | 缩短提案正文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 根据当前目标修订提案，或创建新提案。                                                                                                                                                                        |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离该提案。                                                                                                                                                                |
| `untrusted symlink target`                     | 仅对有意共享的技能根目录配置 `skills.load.allowSymlinkTargets` 并启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                         |
| `Support file paths must be under one of...`   | 将支持文件移动到 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                     |
| 提案未显示在列表中                             | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 智能体无法调用 `skill_workshop`                | 检查当前工具策略和运行模式。`coding` 包含该工具；限制性的 `tools.allow` 策略必须显式列出它，并且沙箱隔离运行必须使用普通的主机侧智能体会话或 CLI。                                                        |

## 相关内容

- [Skills](/zh-CN/tools/skills)：加载顺序、优先级和可见性
- [创建技能](/zh-CN/tools/creating-skills)：手写 `SKILL.md`
  基础知识
- [Skills 配置](/zh-CN/tools/skills-config)：完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：`openclaw skills` 命令
