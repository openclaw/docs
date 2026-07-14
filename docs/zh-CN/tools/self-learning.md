---
read_when:
    - 你希望 OpenClaw 从已完成的对话中学习可复用的流程
    - 你正在决定是否启用自主技能提议
    - 你需要了解自我学习的安全性、成本、适用条件或故障排查
sidebarTitle: Self-learning
summary: 让 OpenClaw 根据纠正内容和已完成的重要工作提出可复用的 Skills
title: 自我学习
x-i18n:
    generated_at: "2026-07-14T14:09:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b5e6de2452a6f7dfb0042d6185b09fc1fa82dcfd0bc73d4f4cf0632b7900056c
    source_path: tools/self-learning.md
    workflow: 16
---

自我学习让 OpenClaw 能够将对话中的有用依据转化为待处理的
[Skill Workshop](/zh-CN/tools/skill-workshop) 提案。它不会训练模型
权重、编辑已启用的技能，也不会静默更改智能体行为。每个学习到的
流程都会保持待处理状态，直到操作员审核并应用。

自我学习**默认禁用**。仅当你的工作区适合进行额外的
后台模型运行和对话记录审核时，才应启用。

## 启用自我学习

在 Control UI 中，打开 **插件 → Workshop**，然后开启**自我学习**。此
更改立即生效；当其他配置写入方已更新该文件时，Control UI 会刷新配置快照并
重试切换，无需重新加载页面或 Gateway 网关。

使用 CLI：

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

或编辑 `~/.openclaw/openclaw.json`：

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

禁用自我学习后，用户请求的技能创建、`/learn` 和手动 Skill Workshop 操作
仍可继续使用。

## 手动审核过去的会话

手动审核历史记录是自主捕获的保守替代方案。
在 Control UI 中打开**插件 → Workshop**，然后选择**查找技能创意**。
此操作不会更改 `skills.workshop.autonomous.enabled`。

每次扫描：

- 从最新的未审核会话开始，逐步向前回溯；
- 最多审核 20 个包含至少六轮模型交互的实质性会话；
- 跳过 cron、Heartbeat、钩子、子智能体、ACP、插件所有和内部审核
  会话；
- 在将对话记录包发送给所选智能体配置的模型之前，隐去可识别的机密并限制其大小；
- 采用与自主经验审核相同的高标准；并且
- 最多可创建或修订三个待处理提案，绝不会创建已启用的技能。

Workshop 会报告累计会话数、日期覆盖范围和发现的创意。
选择**扫描更早的工作**以处理下一个更早的时间窗口。当游标到达
符合条件的历史记录开头时，该操作会变为**扫描新工作**。
OpenClaw 仅在共享状态数据库中持久保存游标和覆盖范围元数据；
不会创建第二份对话记录归档。

只有当 OpenClaw 能够证明会话的所有权并排除外部钩子内容时，才会扫描这些会话。
升级后，可以在本地对升级前的当前对话记录进行分类，但缺少逐次运行来源信息的
已轮换升级前对话记录会被跳过。新对话记录在轮换后仍会保留此来源信息。

手动扫描仍会产生模型提供商费用，并将符合条件的对话
内容发送给已配置的提供商。仅当此类审核符合
工作区的隐私和数据处理要求时才使用。

## OpenClaw 可以学习什么

自我学习有两条保守路径：

1. **直接指示和纠正。** OpenClaw 会检测持久性措辞，
   例如“从现在开始”“下次”，以及对失败方法的纠正。
   启用自我学习后，它可以将这些信号转化为待处理提案，
   无需等待另一个提示。此确定性路径可以将相关
   指示分组为最多三个提案，以可写的工作区技能为目标，
   或修订自身相关的待处理提案。它也会在失败的轮次后运行，
   因为它捕获的是用户的指示，而不是判断任务是否完成。
2. **经验审核。** 在成功完成一个实质性的前台轮次后，
   OpenClaw 可以审核已完成的工作，以寻找可复用的恢复技巧或
   稳定流程，使未来至少减少两次模型或工具往返调用。

合适的候选内容包括：

- 在工具或模型反复失败后采用的可靠恢复方法；
- 避免了重复错误的非显而易见顺序约束；
- 需要反复探索的稳定多步骤工作流；或
- 能够避免未来多次调用的可复用预检。

对于常规的成功工作、一次性请求、个人事实、简单偏好、暂时性
环境故障、宽泛建议、无依据的否定性主张和机密，审核器应放弃生成提案。

## 经验审核何时运行

经验审核会被有意延迟并受到限制：

- 前台轮次必须成功完成。
- 当前轮次必须包含至少十次模型迭代。
- 排除 cron、Heartbeat、记忆、溢出、钩子、子智能体和审核会话。
- 前台运行必须已解析出提供商和模型，并且实际上
  有权访问 `skill_workshop`。
- OpenClaw 会在完成后等待 30 秒。同一会话中后续的前台运行完成后，
  会重新开始这一静默期。
- 如果仍有任何智能体或回复运行处于活动状态，审核将再等待 30 秒。
- 同一时间只运行一次经验审核。
- 延迟审核是进程本地的 Gateway 网关工作。Gateway 网关必须在
  整个空闲窗口期间保持运行；一次性本地运行和 CLI 支持的运行时不会保留
  足够的轨迹和工具可用性上下文来调度审核。

前台回答绝不会因学习而延迟。失败或不符合条件的
轮次不会启动经验审核，但当自主功能被禁用时，
仍可将用户的直接纠正作为建议提供。

## 审核器接收的内容

后台审核器仅接收当前轮次，起点为该轮次最近的
用户消息。渲染后的轨迹上限为 60,000 个字符；
必要时，OpenClaw 会保留第一条消息和最新依据，
并标记被省略的中间部分。

审核器会复用已解析的提供商和模型。当该身份可用时，它会复用前台运行的
身份验证配置文件，并禁用模型回退。因此，该审核会在已配置的提供商上
启动一次额外的模型运行。当审核器检查或起草提案时，该运行可能会发出
多次提供商请求。提供商的定价和数据处理条款与前台轮次相同，均适用。

开始之前，OpenClaw 会重新加载当前运行时配置，并重新检查原始对话的
有效沙箱和工具策略。如果该运行采用沙箱隔离、策略不再允许
`skill_workshop`，或缺少必需的运行时事实，
审核将采用失败关闭策略，并且不会创建任何内容。

<Warning>
  启用自我学习后，符合条件的对话内容（包括当前轮次的工具
  输入和结果）可发送给所选模型提供商进行一次额外审核。
  如果此类审核会违反数据处理要求，请勿在该工作区中启用。
</Warning>

## 提案安全性

审核器在隔离会话中运行，其工具
范围经过有意限制：

- 它只能列出或检查 Workshop 提案，并创建或修订一个
  待处理提案。
- 它不能更新已启用的技能、应用提案、拒绝提案、隔离
  提案、发送消息或使用通用智能体工具。
- 模型重试共享一次变更预算，因此一次审核最多只能创建或
  修订一个提案。
- 审核的轨迹被视为不可信依据，而不是后台智能体的指示。
- Skill Workshop 会扫描提案内容，并在写入提案状态前拒绝可识别的
  明文凭据。

Workshop 的常规限制仍然适用，包括 `maxPending`、`maxSkillBytes`、
支持文件限制、扫描器检查以及仅限工作区写入。`approvalPolicy: "auto"`
设置不会授予后台审核器访问生命周期操作的权限。

## 审核学习得到的提案

自我学习生成的待处理提案与手动使用 Workshop 时相同。
应用前请进行检查：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

对于有用但尚未准备就绪的提案，可进行修订、拒绝或隔离：

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "过于具体"
openclaw skills workshop quarantine <proposal-id> --reason "需要安全审核"
```

应用是唯一会写入已启用 `SKILL.md` 的操作。完整的生命周期和存储
模型请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

## 配置

| 设置                                       | 默认值      | 自我学习的作用                                                                                                                    |
| ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`     | 启用直接纠正捕获和延迟经验审核。                                                                                                  |
| `skills.workshop.approvalPolicy`           | `"pending"` | 控制普通智能体发起的生命周期操作的审批提示；它不会扩大后台审核器的权限。                                                          |
| `skills.workshop.maxPending`               | `50`        | 限制每个工作区的待处理和已隔离提案数量。                                                                                          |
| `skills.workshop.maxSkillBytes`            | `40000`     | 限制提案正文的字节大小。                                                                                                          |
| `skills.workshop.allowSymlinkTargetWrites` | `false`     | 仅影响应用行为；自我学习本身写入的是提案状态，而不是已启用的技能目标。                                                            |

有关完整的架构、范围和相关技能设置，请参阅
[Skills 配置](/zh-CN/tools/skills-config#workshop-skills-workshop)。

## 故障排查

### 长轮次结束后未出现提案

检查以下所有事项：

1. `skills.workshop.autonomous.enabled` 在有效的 Gateway 网关配置中为 `true`。
2. 该轮次成功完成，并且在最近一条用户消息之后包含至少十次模型迭代。
3. 该对话是普通前台运行，而不是定时、记忆、钩子或子智能体运行。
4. 原始运行有权访问 `skill_workshop`，并且未采用沙箱隔离。
5. 系统保持空闲的时间足以完成延迟审核。
6. 长时间运行的 Gateway 网关进程在整个空闲窗口期间保持活动；
   一次性本地命令不会等待延迟审核。

符合条件的审核仍可能不生成提案。当依据未达到可复用流程的标准时，
放弃生成提案是预期结果。

### Doctor 报告 Workshop 工具已隐藏

启用自我学习后，`openclaw doctor` 会检查默认
智能体的有效工具策略是否允许 `skill_workshop`。按照报告的
`tools.allow` 或 `tools.alsoAllow` 进行更改，或者禁用自我学习。

### 出现过多低价值提案

禁用自我学习，并继续使用 `/learn` 或显式的 Workshop 请求：

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

禁用该功能后，待处理提案仍可审核。禁用
自我学习不会应用、拒绝或删除这些提案。

## 相关内容

- [技能工作坊](/zh-CN/tools/skill-workshop)，用于提案审查、审批和
  存储
- [创建技能](/zh-CN/tools/creating-skills)，用于手工编写的技能和
  `SKILL.md` 结构
- [Skills 配置](/zh-CN/tools/skills-config)，用于所有 `skills.*` 设置
- [Skills CLI](/zh-CN/cli/skills)，用于工作坊和管理者命令
