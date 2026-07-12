---
read_when:
    - 你希望智能体通过聊天创建或更新技能
    - 你需要审核、应用、拒绝或隔离生成的技能草稿
    - 你正在配置 Skill Workshop 的审批、自主性、存储或限制
sidebarTitle: Skill Workshop
summary: 通过 Skill Workshop 审查创建和更新工作区 Skills
title: 技能工作坊
x-i18n:
    generated_at: "2026-07-12T14:48:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop 是 OpenClaw 用于创建和更新工作区 Skills 的受管控路径。智能体和操作员绝不会通过此路径直接写入 `SKILL.md`——他们创建的是一个**提案**（包含内容、目标绑定、扫描器状态、哈希和回滚元数据的待处理草稿），该提案只有在应用后才会成为实际生效的 Skills。

Skill Workshop 仅写入工作区 Skills。它绝不会触及内置、插件、ClawHub、额外根目录、托管、个人智能体或系统 Skills。

## 工作原理

- **提案优先：**生成的内容存储为 `PROPOSAL.md`，而非
  `SKILL.md`。
- **应用是唯一的实时写入操作：**创建、更新和修订绝不会更改
  活跃 Skills。
- **限定于工作区：**创建操作以工作区的 `skills/` 根目录为目标；仅允许更新
  可写的工作区 Skills。
- **禁止覆盖：**如果目标 Skills 已存在，创建将失败。
- **哈希绑定：**更新提案会绑定到目标当前的哈希；如果实际生效的 Skills 在应用前发生变化，
  提案将变为 `stale`。
- **扫描器把关：**应用会在写入前重新运行安全扫描器。
- **可恢复：**应用会在触及实际生效文件前写入回滚元数据。
- **一致的界面：**聊天、CLI 和 Gateway 网关均调用同一服务。

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

## 生命周期整理

Gateway 网关在共享状态数据库中跟踪 Skills 的汇总使用情况。它每天会检查一次由 Skill Workshop 创建并应用的 Skills。超过 30 天未使用的 Skills 会变为 `stale`；90 天后会变为 `archived`，并且不会包含在新智能体的 Skills 快照中。已归档的 Skills 文件在磁盘上保持不变。手动编写的 Skills 永远不会被整理；只有通过 Skill Workshop 提案创建的 Skills 才会进入生命周期整理。

已固定的 Skills 会绕过生命周期转换。过期的 Skills 在被使用并完成下一次扫描后会恢复为 `active`。已归档的 Skills 只能通过显式恢复来重新启用：

生命周期转换和恢复适用于新会话；正在运行的会话会保留其当前 Skills 快照。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

所有整理器命令都接受 `--json`。状态还会将确定性的重叠候选项仅作为建议报告；它绝不会合并 Skills 或调用模型。

## 聊天

向智能体说明你想要的 Skills；它会调用 `skill_workshop` 并返回提案 ID。

### 从近期工作中学习

使用 `/learn` 将当前对话或指定来源转化为一个遵循标准指引的 Skills 提案：

```text
/learn
/learn docs/runbook.md 和 https://example.com/guide；重点关注恢复
```

如果未提供请求，`/learn` 会要求智能体从当前对话中提炼可复用的工作流。如果提供了请求，智能体会将路径、URL、粘贴的笔记和对话引用视为来源，同时遵循重点、范围和命名要求。它使用现有工具收集这些来源，然后以 `action: "create"` 调用 `skill_workshop`。

生成的提案会保持 `pending`；`/learn` 绝不会应用它。通过正常审批流程或使用 `openclaw skills workshop` 审查并应用它。

创建：

```text
创建一个名为 morning-catchup 的 Skills，用于执行我的周一收件箱例行流程。
```

更新现有工作区 Skills：

```text
更新 trip-planning，使其在预订前也检查座位图。
```

迭代待处理提案：

```text
向我展示 morning-catchup 提案。
修订它，使其也标记所有被标为紧急的内容。
应用 morning-catchup 提案。
```

默认情况下，由智能体发起的 `apply`、`reject` 和 `quarantine` 会显示审批提示。在可信环境中，将 `skills.workshop.approvalPolicy` 设置为 `"auto"` 可跳过该提示。

提示会标明提案 ID 和目标 Skills，并显示提案描述、支持文件数量和正文大小。审批请求会受到时间限制，以确保在智能体工具监控器超时前完成。如果提示过期前未收到决定，生命周期操作不会运行：提案会保持待处理且不发生变化。稍后可在 Skill Workshop UI 中作出决定，或运行 `openclaw skills workshop apply|reject|quarantine <proposal-id>`。智能体不应循环重试已过期的生命周期操作。

## CLI

```bash
# 创建
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "每日收件箱跟进：分类、归档、呈现、起草、规划" \
  --proposal ./PROPOSAL.md

# 更新现有工作区 Skills
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 列出并检查
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 审批前修订
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 完成处理
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "重复"
openclaw skills workshop quarantine <proposal-id> --reason "需要安全审查"
```

每个子命令都接受 `--agent <id>`（目标工作区；默认先根据 cwd 推断，然后使用默认智能体）和 `--json`（结构化输出）。`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>` 和 `--evidence <text>`，用于在 `--proposal` 之外记录提案上下文。

## 提案内容

在待处理期间，提案存储为 `PROPOSAL.md`，并带有仅供提案使用的 frontmatter：

```markdown
---
name: "morning-catchup"
description: "每日收件箱跟进：分类、归档、呈现、起草、规划"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

应用时，Skill Workshop 会写入实际生效的 `SKILL.md`，并移除仅供提案使用的字段：`status`、提案 `version` 和提案 `date`。

## 支持文件

当提议的 Skills 除 `PROPOSAL.md` 外还需要其他文件时，请使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "周五总结：统计数据、亮点、下周最重要的三项工作" \
  --proposal-dir ./weekly-update-proposal
```

该目录必须包含 `PROPOSAL.md`。支持文件必须位于 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。Skill Workshop 会扫描这些文件、计算哈希并随提案一起存储，然后仅在应用时将它们写入实际生效的 `SKILL.md` 旁边。

以下支持文件路径会被拒绝：绝对路径、隐藏路径段、路径遍历、重叠路径、可执行文件、非 UTF-8 文本、空字节，以及标准支持文件夹之外的路径。

## 智能体工具

模型使用 `skill_workshop`，并提供一个必需的 `action`：
`create | update | revise | list | inspect | apply | reject | quarantine`。
其他参数根据操作而定：

| 参数                       | 使用方                                               | 说明                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` 必填；在其他情况下按名称解析待处理提案                      |
| `description`              | `create`、`update`、`revise`                         | 最多 160 字节                                                        |
| `skill_name`               | `update`                                             | 现有 Skills 名称或键                                                 |
| `proposal_content`         | `create`、`update`、`revise`                         | 存储为 `PROPOSAL.md`；上限由 `skills.workshop.maxSkillBytes` 决定   |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` 数组                                             |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由文本上下文                                                       |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 目标提案                                                             |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 可选                                                                 |
| `query`、`status`、`limit` | `list`                                               | 筛选/分页；`limit` 最大值为 50，默认值为 20                          |

智能体必须使用 `skill_workshop` 处理生成的 Skills。它们不得通过 `write`、`edit`、`exec`、shell 命令或直接文件系统操作来创建或更改提案文件。

<Note>
`skill_workshop` 是内置智能体工具，并包含在
`tools.profile: "coding"` 中。如果更严格的策略隐藏了它，请将
`skill_workshop` 添加到有效的 `tools.allow` 列表中；如果当前范围使用的配置文件未显式设置 `tools.allow`，也可以使用
`tools.alsoAllow: ["skill_workshop"]`。沙箱隔离运行不会构建主机侧
Skill Workshop 工具，因此请从普通的主机侧智能体会话或 CLI 运行提案审查操作。
</Note>

## 建议的 Skills

OpenClaw 会在交互轮次结束时（包括失败的轮次）检测“下次”“记住要”等持久性指令和响应式纠正。在下一轮中，智能体会提出通过 `skill_workshop` 保存最近检测到的工作流；由用户决定是否创建提案。这个内置建议本身不会创建或更改 Skills。启用 `skills.workshop.autonomous.enabled` 可改为直接创建待处理提案。

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

| 设置                       | 默认值      | 效果                                                                                                                                                                      |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 直接创建待处理提案，而不是在下一轮中提出保存最近检测到的工作流。                                                                                                          |
| `allowSymlinkTargetWrites` | `false`     | 允许应用操作通过工作区 Skills 符号链接进行写入，但其真实目标必须列在 `skills.load.allowSymlinkTargets` 中。                                                               |
| `approvalPolicy`           | `"pending"` | `"pending"` 要求在智能体发起 `apply`、`reject` 或 `quarantine` 前显示审批提示。`"auto"` 会跳过提示（智能体仍须调用该操作）。                                              |
| `maxPending`               | `50`        | 限制每个工作区中的待处理和已隔离提案数量（1-200）。                                                                                                                       |
| `maxSkillBytes`            | `40000`     | 限制提案正文的字节大小（1024-200000）。                                                                                                                                   |

自主捕获能够识别前瞻性规则（例如“从现在开始”）和响应式纠正（例如“这不是我要求的”）。它会按主题将新指令分组，每轮最多生成三个提案；将词汇匹配项路由到现有可写工作区 Skills；当另一项纠正指向同一 Skills 时，则修订其自身的待处理提案。

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

`requestRevision` 仅适用于 Gateway 网关（没有对应的 CLI 或智能体工具）：它会
将自由文本形式的修订指令转发到所属智能体的聊天会话，而不是直接替换
`PROPOSAL.md`，适用于要求智能体修订内容而非提交新的字面内容的 UI。

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
- `rollback.json`：在应用操作更改实际文件之前写入的恢复元数据。

## 限制

| 限制                            | 值                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 描述                            | 160 字节                                                             |
| 提案正文                        | `skills.workshop.maxSkillBytes`（默认 40,000；硬上限 1 MiB）         |
| 支持文件                        | 每个提案 64 个                                                       |
| 支持文件大小                    | 每个 256 KiB，总计 2 MiB                                             |
| 待处理 + 已隔离的提案           | 每个工作区为 `skills.workshop.maxPending`（默认 50）                 |

## 故障排查

| 问题                                           | 解决方法                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | 将 `description` 缩短至 160 字节或更少。                                                                                                                                                                    |
| `Skill proposal content is too large`          | 缩短提案正文，或提高 `skills.workshop.maxSkillBytes`。                                                                                                                                                      |
| `Target skill changed after proposal creation` | 根据当前目标修订提案，或创建新提案。                                                                                                                                                                        |
| `Proposal scan failed`                         | 检查扫描器发现的问题，然后修订或隔离提案。                                                                                                                                                                  |
| `untrusted symlink target`                     | 仅针对有意共享的技能根目录配置 `skills.load.allowSymlinkTargets` 并启用 `skills.workshop.allowSymlinkTargetWrites`。                                                                                        |
| `Support file paths must be under one of...`   | 将支持文件移至 `assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。                                                                                                                       |
| 提案未显示在列表中                             | 检查所选的 `--agent` 工作区和 `OPENCLAW_STATE_DIR`。                                                                                                                                                        |
| 智能体无法调用 `skill_workshop`                | 检查当前工具策略和运行模式。`coding` 包含此工具；限制性的 `tools.allow` 策略必须明确列出它，沙箱隔离运行则必须使用普通的宿主机端智能体会话或 CLI。                                                           |

### 工具策略诊断

启用自动捕获后，`openclaw doctor` 会针对默认智能体运行
`core/doctor/skill-workshop-tool-policy` 检查。如果策略隐藏了
`skill_workshop`，警告会指出第一个排除它的配置层，以及需要进行的确切
`allow` 或 `alsoAllow` 更改。较旧的运行手册可能仍使用
`openclaw plugins inspect skill-workshop`；该命令现在会说明 Skill
Workshop 是内置功能，并在适用时输出相同的策略提示。

## 相关内容

- [Skills](/zh-CN/tools/skills)：了解加载顺序、优先级和可见性
- [创建技能](/zh-CN/tools/creating-skills)：了解手动编写 `SKILL.md` 的
  基础知识
- [Skills 配置](/zh-CN/tools/skills-config)：查看完整的 `skills.workshop` 架构
- [Skills CLI](/zh-CN/cli/skills)：查看 `openclaw skills` 命令
