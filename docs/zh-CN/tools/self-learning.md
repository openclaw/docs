---
read_when:
    - 你希望 OpenClaw 从已完成的对话中学习可复用的流程
    - 你正在决定是否启用自主技能提议
    - 你需要了解自我学习的安全性、成本、适用条件或故障排查
sidebarTitle: Self-learning
summary: 让 OpenClaw 根据纠正内容和已完成的重要工作提出可复用的 Skills
title: 自我学习
x-i18n:
    generated_at: "2026-07-16T11:57:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

自我学习让 OpenClaw 能够将对话中的有用依据转化为待处理的
[Skill Workshop](/zh-CN/tools/skill-workshop) 提案。它不会训练模型
权重、编辑已启用的 Skills，也不会静默更改智能体行为。每个学到的
流程都会保持待处理状态，直到操作员审核并应用它。

自我学习**默认禁用**。仅当额外的
后台模型运行和对话记录审核适合你的工作区时才启用它。

## 启用自我学习

在 Control UI 中，打开 **Plugins → Workshop** 并开启 **Self-learning**。更改会
立即生效；当另一个配置写入方已更新
文件时，Control UI 会刷新配置快照并重试切换，无需重新加载
页面或 Gateway 网关。

使用 CLI：

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

或者编辑 `~/.openclaw/openclaw.json`：

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

使用以下命令再次禁用：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

禁用自我学习时，用户请求的技能创建、`/learn` 和手动 Skill Workshop 操作
仍可继续使用。

## 手动审核过去的会话

手动历史记录审核是自主捕获的保守替代方案。
在 Control UI 中打开 **Plugins → Workshop**，然后选择 **Find skill ideas**。
这不会更改 `skills.workshop.autonomous.enabled`。

每次扫描：

- 从最新的未审核会话开始，并向更早的会话推进；
- 最多审核 20 个至少包含六轮模型交互的实质性会话；
- 跳过 cron、Heartbeat、钩子、子智能体、ACP、插件所有和内部审核
  会话；
- 在将对话记录包发送给所选智能体配置的模型之前，隐去识别出的秘密信息并限制其大小；
- 采用与自主经验审核相同的高标准；并且
- 最多可以创建或修订三个待处理提案，绝不会创建已启用的 Skills。

Workshop 会报告累计会话数、日期覆盖范围和发现的想法。
选择 **Scan earlier work** 可扫描下一个更早的窗口。当游标到达
符合条件的历史记录开头时，该操作会变为 **Scan new work**。
OpenClaw 仅在共享状态数据库中持久保存游标和覆盖范围元数据；
不会创建第二份对话记录归档。

只有当 OpenClaw 能够证明会话的所有权并排除
外部钩子内容时，才会扫描这些会话。升级后，当前升级前的对话记录可以
在本地分类，但缺少每次运行来源信息且经过轮转的升级前对话记录会被跳过。
新的对话记录在轮转后仍会保留此来源信息。

手动扫描仍会产生模型提供商费用，并将符合条件的对话
内容发送给已配置的提供商。仅当此审核符合
工作区的隐私和数据处理要求时才使用它。

## OpenClaw 可以学习什么

自我学习有两条保守路径：

1. **直接指令和纠正。** OpenClaw 会检测“从现在开始”“下次”之类的持久性表述，
   以及对失败方法的纠正。
   启用自我学习后，它可以将这些信号转化为待处理提案，
   而无需等待另一个提示词。此确定性路径可以将相关
   指令分组为最多三个提案、以可写的工作区技能为目标，
   或修订它自己创建的相关待处理提案。它也会在失败的轮次后运行，
   因为它捕获的是用户指令，而不是判断任务是否完成。
2. **经验审核。** 在一次成功且内容充实的前台轮次结束后，
   OpenClaw 可以审核已完成的工作，寻找可复用的恢复技巧或
   稳定流程，使未来至少减少两次模型或工具
   往返调用。

合适的候选内容包括：

- 在工具或模型反复失败后采用的可靠恢复方法；
- 能够防止反复出现错误的不明显执行顺序约束；
- 需要反复探索才能完成的稳定多步骤工作流；或
- 可以避免未来多次调用的可复用预检流程。

对于常规的成功工作、一次性请求、
个人事实、简单偏好、暂时性环境故障、通用
建议、缺乏依据的否定性结论和秘密信息，审核器应放弃生成提案。

## 经验审核何时运行

经验审核会有意延迟执行并受到限制：

- 前台轮次必须成功完成。
- 当前轮次必须至少包含十次模型迭代。
- cron、Heartbeat、记忆、溢出、钩子、子智能体和审核会话
  会被排除。
- 前台运行必须已解析提供商和模型，并且必须实际
  有权访问 `skill_workshop`。
- OpenClaw 会在完成后等待 30 秒。同一会话中后续的前台运行完成
  会重新开始这段静默期。
- 如果仍有任何智能体或回复运行处于活动状态，审核会再等待 30 秒。
- 同一时间只运行一次经验审核。
- 延迟审核是进程本地的 Gateway 网关工作。Gateway 网关必须在
  整个空闲窗口期间保持运行；一次性的本地运行时和 CLI 支持的运行时无法保留
  足够的轨迹和工具可用性上下文来调度它。

前台回答绝不会因学习而延迟。失败或不符合条件的
轮次不会启动经验审核，但当自主功能被禁用时，仍可将用户的直接纠正
作为建议提供。

## 审核器接收什么内容

后台审核器仅接收当前轮次，内容从最近的
用户消息开始。渲染后的轨迹上限为 60,000 个字符；
必要时，OpenClaw 会保留第一条消息和最新依据，并
标记被省略的中间部分。

审核器会复用已解析的提供商和模型。如果前台
身份验证配置文件对应的身份可用，它还会复用该配置文件，并禁用模型回退。
因此，审核会在已配置的提供商上启动额外的模型运行。
当该运行检查或起草提案时，可能会发起多次提供商请求。
提供商的定价和数据处理条款与前台轮次一样适用。

启动前，OpenClaw 会重新加载当前运行时配置，并重新检查
原始对话的有效沙箱和工具策略。如果该运行处于
沙箱隔离环境中、策略不再允许 `skill_workshop`，或缺少所需的运行时事实，
审核将以失败关闭方式终止，并且不会创建任何内容。

<Warning>
  启用自我学习后，符合条件的对话内容（包括当前轮次中的工具
  输入和结果）可以发送给所选模型
  提供商进行一次额外审核。如果此类审核会违反数据处理要求，
  请勿在该工作区中启用此功能。
</Warning>

## 提案安全性

审核器在隔离的会话中运行，其工具
范围受到刻意限制：

- 它只能列出或检查 Workshop 提案，以及创建或修订一个
  待处理提案。
- 它无法更新已启用的技能、应用提案、拒绝提案、隔离
  提案、发送消息或使用通用智能体工具。
- 所有模型重试共享一次变更预算，因此一次审核最多只能创建或
  修订一个提案。
- 审核的轨迹会被视为不可信依据，而不是发送给
  后台智能体的指令。
- Skill Workshop 会扫描提案内容，并在写入提案状态之前拒绝
  识别出的明文凭据。

Workshop 的常规限制仍然适用，包括 `maxPending`、`maxSkillBytes`、
支持文件限制、扫描器检查和仅限工作区的写入操作。
`approvalPolicy: "auto"` 设置不会授予后台审核器访问
生命周期操作的权限。

## 审核学习生成的提案

自我学习生成的待处理提案与手动使用 Workshop 时相同。
应用前请检查它们：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

对于有用但尚未就绪的提案，可以修订、拒绝或隔离：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

应用是唯一会写入已启用 `SKILL.md` 的操作。有关完整的生命周期和存储
模型，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

## 配置

| 设置                                       | 默认值   | 自我学习的影响                                                                                                                    |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | 启用直接纠正捕获和延迟经验审核。                                                                                                  |
| `skills.workshop.approvalPolicy`           | `"auto"` | 控制普通智能体发起的生命周期操作的审批提示；它不会扩大后台审核器的权限。                                                          |
| `skills.workshop.maxPending`               | `50`     | 限制每个工作区中待处理和已隔离提案的数量。                                                                                        |
| `skills.workshop.maxSkillBytes`            | `40000`  | 限制提案正文的字节大小。                                                                                                          |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | 仅影响应用行为；自我学习本身写入的是提案状态，而不是已启用的技能目标。                                                            |

有关完整的架构、范围和相关技能设置，请参阅
[Skills 配置](/zh-CN/tools/skills-config#workshop-skills-workshop)。

## 故障排查

### 长时间轮次后未出现提案

检查以下所有事项：

1. 在当前 Gateway 网关配置中，`skills.workshop.autonomous.enabled` 为 `true`。
2. 该轮次成功完成，并且在最近的用户消息之后至少包含十次模型迭代。
3. 该对话是普通前台运行，而不是定时、记忆、
   钩子或子智能体运行。
4. 原始运行有权访问 `skill_workshop`，且未处于沙箱隔离环境中。
5. 系统保持空闲的时间足以执行延迟审核。
6. 长时间运行的 Gateway 网关进程在整个空闲窗口期间保持活动；
   一次性本地命令不会等待延迟审核。

符合条件的审核仍可能不生成提案。当依据未达到可复用流程的标准时，
放弃生成提案是预期结果。

### Doctor 报告 Workshop 工具被隐藏

启用自我学习时，`openclaw doctor` 会检查默认
智能体的有效工具策略是否允许 `skill_workshop`。按照报告的
`tools.allow` 或 `tools.alsoAllow` 进行更改，或者禁用自我学习。

### 出现过多低价值提案

禁用自我学习，并继续使用 `/learn` 或显式 Workshop 请求：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

禁用此功能后，待处理提案仍可审核。禁用
自我学习不会应用、拒绝或删除这些提案。

## 相关内容

- [技能工作坊](/zh-CN/tools/skill-workshop)，用于提案审查、审批和
  存储
- [创建技能](/zh-CN/tools/creating-skills)，用于手工编写的 Skills 和
  `SKILL.md` 结构
- [Skills 配置](/zh-CN/tools/skills-config)，涵盖所有 `skills.*` 设置
- [Skills CLI](/zh-CN/cli/skills)，用于工作坊和策展命令
