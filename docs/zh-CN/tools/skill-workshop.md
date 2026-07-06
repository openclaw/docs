---
read_when:
    - 你想让智能体通过聊天创建或更新技能
    - 你需要审阅、应用、拒绝或隔离生成的技能草稿
    - 你正在配置 Skills Workshop 审批、自主性、存储或限制
sidebarTitle: Skill Workshop
summary: 通过 Skill Workshop 审查创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-06T10:52:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6effd3b4fdaff4d8c087343cf67012d52663a0a8b0536677ac1de8aefc1dcc39
    source_path: tools/skill-workshop.md
    workflow: 16
---

技能工作坊是 OpenClaw 用于创建和更新工作区技能的受治理路径。智能体和操作员绝不会通过这条路径直接写入 `SKILL.md`，而是创建一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），只有在应用后才会成为实时技能。

技能工作坊只写入工作区技能。它绝不会触碰内置、插件、ClawHub、额外根目录、托管、个人智能体或系统技能。

## 工作原理

- **提案优先：**生成的内容存储为 `PROPOSAL.md`，而不是 `SKILL.md`。
- **应用是唯一的实时写入：**创建、更新和修订绝不会更改活跃技能。
- **工作区范围：**创建以工作区 `skills/` 根目录为目标；更新只允许用于可写的工作区技能。
- **不覆盖：**如果目标技能已存在，创建会失败。
- **哈希绑定：**更新提案会绑定到当前目标哈希；如果实时技能在应用前发生变化，则进入 `stale`。
- **扫描器门控：**应用会在写入前重新运行安全扫描器。
- **可恢复：**应用会在触碰实时文件前写入回滚元数据。
- **一致的表面：**聊天、CLI 和 Gateway 网关都调用同一个服务。

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

向智能体提出你想要的技能；它会调用 `skill_workshop` 并返回一个提案 ID。

### 从近期工作中学习

使用 `/learn` 将当前对话或命名来源转换为一个遵循标准指导的技能提案：

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

没有请求时，`/learn` 会要求智能体从当前对话中提炼可复用工作流。有请求时，智能体会将路径、URL、粘贴的笔记和对话引用视为来源，同时遵循重点、范围和命名要求。它会用现有工具收集来源，然后用 `action: "create"` 调用 `skill_workshop`。

生成的提案会保持 `pending`；`/learn` 绝不会应用它。通过正常审批流程或使用 `openclaw skills workshop` 审查并应用它。

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

提示会标识提案 ID 和目标技能，并显示提案描述、支持文件数量和正文大小。审批请求有界，必须在智能体工具看门狗超时前完成。如果提示过期前没有收到决定，生命周期操作不会运行：提案保持待处理且不变。稍后可在技能工作坊 UI 中决定，或运行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。智能体不应循环重试已过期的生命周期操作。

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

每个子命令都接受 `--agent <id>`（目标工作区；默认从 cwd 推断，然后使用默认智能体）和 `--json`（结构化输出）。`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>` 和 `--evidence <text>`，用于将提案上下文与 `--proposal` 一起记录。

## 提案内容

待处理期间，提案会以 `PROPOSAL.md` 存储，并带有仅用于提案的 frontmatter：

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

当提议的技能需要在 `PROPOSAL.md` 旁边放置文件时，使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。技能工作坊会扫描、哈希并随提案存储它们，然后只在应用时将它们写到实时 `SKILL.md` 旁边。

被拒绝的支持文件路径：绝对路径、隐藏路径段、路径遍历、重叠路径、可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的路径。

## 智能体工具

模型使用 `skill_workshop`，其中一个必需的 `action` 为：`create | update | revise | list | inspect | apply | reject | quarantine`。其他参数取决于操作：

| 参数                       | 使用方                                               | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` 必需；否则按名称解析待处理提案                              |
| `description`              | `create`, `update`, `revise`                         | 最大 160 字节                                                        |
| `skill_name`               | `update`                                             | 现有技能名称或键名                                                   |
| `proposal_content`         | `create`, `update`, `revise`                         | 存储为 `PROPOSAL.md`；受 `skills.workshop.maxSkillBytes` 限制         |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` 数组                                             |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 自由文本上下文                                                       |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | 目标提案                                                             |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 可选                                                                 |
| `query`, `status`, `limit` | `list`                                               | 过滤/分页；`limit` 最大 50，默认 20                                  |

智能体必须使用 `skill_workshop` 处理生成的技能工作。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作来创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，并包含在 `tools.profile: "coding"` 中。如果更严格的策略隐藏了它，请将 `skill_workshop` 添加到活跃的 `tools.allow` 列表，或在作用域使用没有显式 `tools.allow` 的配置文件时使用 `tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构造主机侧的技能工作坊工具，因此请从普通主机侧智能体会话或 CLI 运行提案审查操作。
</Note>

## 建议技能

OpenClaw 会在交互轮次结束时检测持久指令，例如“下次”“记得要”和响应式修正，包括失败的轮次。在下一轮中，智能体会提议通过 `skill_workshop` 保存最近检测到的工作流；由用户决定是否创建提案。此内置建议本身不会创建或更改技能。启用 `skills.workshop.autonomous.enabled` 可改为直接创建待处理提案。

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

| 设置                       | 默认值      | 效果                                                                                                                                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接创建待处理提案，而不是在下一轮中提议保存最近检测到的工作流。                                                                                                      |
| `allowSymlinkTargetWrites` | `false`     | 允许应用操作通过工作区技能符号链接写入，前提是其真实目标列在 `skills.load.allowSymlinkTargets` 中。                                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在智能体发起 `apply`、`reject` 或 `quarantine` 前显示审批提示。`"auto"` 会跳过提示（智能体仍必须调用该操作）。                                         |
| `maxPending`               | `50`        | 限制每个工作区的待处理和已隔离提案数量（1-200）。                                                                                                                     |
| `maxSkillBytes`            | `40000`     | 限制提案正文大小，单位为字节（1024-200000）。                                                                                                                         |

自主捕获会识别前瞻性规则（例如“从现在开始”）和响应式修正（例如“这不是我要求的”）。它会按主题将新指令分组为每轮最多三个提案，将词汇匹配路由到现有可写工作区技能，并在另一个修正针对同一技能时修订自己的待处理提案。

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

`requestRevision` 仅适用于 Gateway 网关（没有 CLI 或智能体工具等价项）：它会将自由文本修订说明转发到所属智能体的聊天会话，而不是直接替换 `PROPOSAL.md`，适用于要求智能体修订而不是提交字面新内容的 UI。

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
- `rollback.json`：在应用更改到实时文件之前写入的恢复元数据。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                            | 160 字节                                                             |
| 提案正文                        | `skills.workshop.maxSkillBytes`（默认 40,000；硬上限 1 MiB）         |
| 支持文件                        | 每个提案 64 个                                                       |
| 支持文件大小                    | 每个 256 KiB，总计 2 MiB                                             |
| 待处理 + 隔离提案               | 每个工作区 `skills.workshop.maxPending`（默认 50）                   |

## 故障排查

| 问题                                           | 解决方法                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短到不超过 160 字节。                                                                                                                                                                    |
| `Skill proposal content is too large`          | 缩短提案正文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 根据当前目标修订提案，或创建新提案。                                                                                                                                                                        |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离该提案。                                                                                                                                                                |
| `untrusted symlink target`                     | 仅针对有意共享的技能根目录配置 `skills.load.allowSymlinkTargets` 并启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                        |
| `Support file paths must be under one of...`   | 将支持文件移到 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                        |
| 提案未显示在列表中                             | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 智能体无法调用 `skill_workshop`                | 检查当前工具策略和运行模式。`coding` 包含该工具；限制性的 `tools.allow` 策略必须显式列出它，并且沙箱隔离运行必须使用普通的主机侧智能体会话或 CLI。                                                          |

### 工具策略诊断

启用自主捕获时，`openclaw doctor` 会针对默认智能体运行
`core/doctor/skill-workshop-tool-policy` 检查。如果策略
隐藏了 `skill_workshop`，警告会指出第一个排除它的配置层，以及需要做出的确切
`allow` 或 `alsoAllow` 更改。较旧的运行手册可能仍使用
`openclaw plugins inspect skill-workshop`；该命令现在会说明 Skill
Workshop 是内置的，并在适用时打印相同的策略提示。

## 相关内容

- [Skills](/zh-CN/tools/skills)，了解加载顺序、优先级和可见性
- [创建技能](/zh-CN/tools/creating-skills)，了解手写 `SKILL.md`
  基础知识
- [Skills 配置](/zh-CN/tools/skills-config)，了解完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)，了解 `openclaw skills` 命令
