---
read_when:
    - 你希望智能体将更正或可复用流程转化为工作区技能
    - 你正在配置程序性技能记忆
    - 你正在调试 skill_workshop 工具的行为
    - 你正在决定是否启用自动技能创建
summary: 以实验性方式将可复用流程捕获为工作区 Skills，支持审查、批准、隔离和 Skills 热刷新
title: 技能工作坊插件
x-i18n:
    generated_at: "2026-05-06T03:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

技能工作坊是**实验性**功能。它默认禁用，其捕获启发式规则和审核器提示词可能会在版本之间变化，并且自动写入应仅在受信任的工作区中使用，且应先审核 pending 模式的输出。

技能工作坊是工作区技能的过程性记忆。它让智能体将可复用工作流、用户纠正、来之不易的修复和反复出现的陷阱转换为以下位置下的 `SKILL.md` 文件：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这不同于长期记忆：

- **记忆**存储事实、偏好、实体和过去上下文。
- **Skills** 存储智能体在未来任务中应遵循的可复用流程。
- **技能工作坊**是从有用轮次到持久工作区技能的桥梁，带有安全检查和可选审批。

当智能体学习到如下流程时，技能工作坊很有用：

- 如何验证外部来源的动画 GIF 资产
- 如何替换截图资产并验证尺寸
- 如何运行特定仓库的 QA 场景
- 如何调试反复出现的提供商故障
- 如何修复过期的本地工作流备注

它不适用于：

- “用户喜欢蓝色”这类事实
- 宽泛的自传式记忆
- 原始转录归档
- 密钥、凭据或隐藏提示文本
- 不会重复的一次性指令

## 默认状态

内置插件是**实验性**的，并且**默认禁用**，除非在 `plugins.entries.skill-workshop` 中显式启用。

插件清单未设置 `enabledByDefault: true`。插件配置 schema 内部的 `enabled: true` 默认值仅在该插件条目已被选择并加载后才适用。

实验性意味着：

- 该插件足以支持选择性测试和自用
- 提案存储、审核器阈值和捕获启发式规则可能会演进
- pending 审批是推荐的起始模式
- 自动应用适用于受信任的个人/工作区设置，不适用于共享或敌意输入密集型环境

## 启用

最小安全配置：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

使用此配置时：

- `skill_workshop` 工具可用
- 显式的可复用纠正会作为待处理提案排队
- 基于阈值的审核器执行可提出技能更新
- 在应用待处理提案之前，不会写入任何技能文件

仅在受信任的工作区中使用自动写入：

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` 仍使用相同的扫描器和隔离路径。它不会应用带有严重发现的提案。

## 配置

| 键                   | 默认值      | 范围 / 值                                   | 含义                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | 在插件条目加载后启用该插件。                                         |
| `autoCapture`        | `true`      | boolean                                     | 在成功的智能体轮次后启用捕获/审核。                                  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 将提案排队，或自动写入安全提案。                                     |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 选择显式纠正捕获、LLM 审核器、两者，或都不使用。                     |
| `reviewInterval`     | `15`        | `1..200`                                    | 在这么多次成功轮次后运行审核器。                                     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 在观察到这么多次工具调用后运行审核器。                               |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 嵌入式审核器运行的超时时间。                                         |
| `maxPending`         | `50`        | `1..200`                                    | 每个工作区保留的最大待处理/隔离提案数。                              |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成的技能/支持文件最大大小。                                        |

推荐配置档：

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## 捕获路径

技能工作坊有三条捕获路径。

### 工具建议

当模型发现可复用流程，或用户要求它保存/更新技能时，可以直接调用 `skill_workshop`。

这是最显式的路径，即使使用 `autoCapture: false` 也有效。

### 启发式捕获

当启用 `autoCapture` 且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，插件会扫描成功轮次中的显式用户纠正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

启发式规则会基于最新匹配的用户指令创建提案。它使用主题提示为常见工作流选择技能名称：

- 动画 GIF 任务 -> `animated-gif-workflow`
- 截图或资产任务 -> `screenshot-asset-workflow`
- QA 或场景任务 -> `qa-scenario-workflow`
- GitHub PR 任务 -> `github-pr-workflow`
- 兜底 -> `learned-workflows`

启发式捕获有意保持狭窄范围。它面向明确纠正和可重复流程备注，而不是通用转录摘要。

### LLM 审核器

当启用 `autoCapture` 且 `reviewMode` 为 `llm` 或 `hybrid` 时，插件会在达到阈值后运行紧凑的嵌入式审核器。

审核器会收到：

- 最近的转录文本，限制为最后 12,000 个字符
- 最多 12 个现有工作区技能
- 每个现有技能中最多 2,000 个字符
- 仅 JSON 指令

审核器没有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

审核器返回 `{ "action": "none" }` 或一个提案。`action` 字段为 `create`、`append` 或 `replace` - 当相关技能已存在时，优先使用 `append`/`replace`；仅在没有现有技能匹配时使用 `create`。

`create` 示例：

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` 会添加 `section` + `body`。`replace` 会在指定技能中将 `oldText` 替换为 `newText`。

## 提案生命周期

每次生成的更新都会变成包含以下内容的提案：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 可选 `agentId`
- 可选 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`：`tool`、`agent_end` 或 `reviewer`
- `status`
- `change`
- 可选 `scanFindings`
- 可选 `quarantineReason`

提案状态：

- `pending` - 等待批准
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 已被操作员/模型拒绝
- `quarantined` - 被严重扫描器发现阻止

状态按工作区存储在 Gateway 网关状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待处理和隔离的提案会按技能名称和变更
载荷去重。存储会保留最新的待处理/隔离提案，最多
`maxPending` 个。

## 工具参考

该插件注册一个智能体工具：

```text
skill_workshop
```

### `status`

按状态统计当前工作区的提案数量。

```json
{ "action": "status" }
```

结果结构：

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

列出待处理提案。

```json
{ "action": "list_pending" }
```

要列出另一种状态：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出隔离的提案。

```json
{ "action": "list_quarantine" }
```

当自动捕获看起来没有任何效果，并且日志提到
`skill-workshop: quarantined <skill>` 时使用此项。

### `inspect`

按 id 获取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建提案。使用 `approvalPolicy: "pending"`（默认）时，它会排队而不是写入。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="强制安全写入（apply: true）">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="在自动策略下强制待处理（apply: false）">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="追加到指定章节">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="替换精确文本">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

应用待处理提案。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 会拒绝隔离的提案：

```text
quarantined proposal cannot be applied
```

### `reject`

将提案标记为已拒绝。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

在现有或拟议的技能目录内写入支持文件。

允许的顶层支持目录：

- `references/`
- `templates/`
- `scripts/`
- `assets/`

示例：

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

支持文件限定在工作区范围内、经过路径检查、按 `maxSkillBytes` 限制字节数、经过扫描，并以原子方式写入。

## Skill 写入

Skill Workshop 仅写入以下目录：

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名称会被规范化：

- 转为小写
- 连续的非 `[a-z0-9_-]` 字符会变为 `-`
- 移除开头/结尾的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果该 skill 不存在，Skill Workshop 会写入新的 `SKILL.md`
- 如果已存在，Skill Workshop 会将正文追加到 `## Workflow`

对于 `append`：

- 如果该 skill 存在，Skill Workshop 会追加到请求的章节
- 如果不存在，Skill Workshop 会创建一个最小 skill，然后追加内容

对于 `replace`：

- 该 skill 必须已存在
- `oldText` 必须完全存在
- 只会替换第一个完全匹配项

所有写入都是原子操作，并会立即刷新内存中的 Skills 快照，因此新的或更新后的 skill 可以在无需重启 Gateway 网关的情况下变为可见。

## 安全模型

Skill Workshop 对生成的 `SKILL.md` 内容和支持文件有安全扫描器。

严重发现会隔离提案：

| 规则 ID                                | 阻止满足以下条件的内容...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 指示智能体忽略先前/更高优先级的指令                   |
| `prompt-injection-system`              | 引用系统提示、开发者消息或隐藏指令 |
| `prompt-injection-tool`                | 鼓励绕过工具权限/审批                         |
| `shell-pipe-to-shell`                  | 包含将 `curl`/`wget` 通过管道传入 `sh`、`bash` 或 `zsh` 的内容              |
| `secret-exfiltration`                  | 看起来会通过网络发送环境变量/进程环境数据                 |

警告发现会被保留，但其本身不会阻止：

| 规则 ID              | 警告对象...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | 宽泛的 `rm -rf` 风格命令    |
| `unsafe-permissions` | `chmod 777` 风格的权限用法 |

被隔离的提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 出现在 `list_quarantine` 中
- 无法通过 `apply` 应用

要从被隔离的提案恢复，请创建一个移除了不安全内容的新安全提案。不要手动编辑存储 JSON。

## 提示指导

启用后，Skill Workshop 会注入一个简短的提示章节，告诉智能体使用 `skill_workshop` 保存持久的流程记忆。

该指导强调：

- 流程，而不是事实/偏好
- 用户修正
- 不明显但成功的流程
- 反复出现的陷阱
- 通过追加/替换来修复过时/薄弱/错误的 skill
- 在长时间工具循环或困难修复后保存可复用流程
- 简短的祈使式 skill 文本
- 不要转储会话记录

写入模式文本会随 `approvalPolicy` 变化：

- 待处理模式：排队建议；仅在明确批准后应用
- 自动模式：在明确可复用时应用安全的工作区 skill 更新

## 成本和运行时行为

启发式捕获不会调用模型。

LLM 审查会在活动/默认智能体模型上使用嵌入式运行。它基于阈值，因此默认不会在每个轮次运行。

审查器：

- 在可用时使用相同的已配置提供商/模型上下文
- 回退到运行时智能体默认值
- 有 `reviewTimeoutMs`
- 使用轻量级启动上下文
- 没有工具
- 不直接写入任何内容
- 只能发出一个提案，并且该提案会走正常的扫描器和审批/隔离路径

如果审查器失败、超时或返回无效 JSON，插件会记录警告/调试消息，并跳过该次审查。

## 操作模式

当用户说以下内容时，使用 Skill Workshop：

- “下次，做 X”
- “从现在开始，优先选择 Y”
- “确保验证 Z”
- “把这保存为工作流”
- “这花了一些时间；记住这个流程”
- “更新本地 skill 来处理这个”

好的 skill 文本：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

差的 skill 文本：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

不应保存差版本的原因：

- 形似会话记录
- 不是祈使式
- 包含嘈杂的一次性细节
- 没有告诉下一个智能体要做什么

## 调试

检查插件是否已加载：

```bash
openclaw plugins list --enabled
```

从智能体/工具上下文检查提案数量：

```json
{ "action": "status" }
```

检查待处理提案：

```json
{ "action": "list_pending" }
```

检查被隔离的提案：

```json
{ "action": "list_quarantine" }
```

常见症状：

| 症状                               | 可能原因                                                                        | 检查                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 工具不可用                   | 插件条目未启用                                                         | `plugins.entries.skill-workshop.enabled` 和 `openclaw plugins list` |
| 没有出现自动提案         | `autoCapture: false`、`reviewMode: "off"` 或未达到阈值                    | 配置、提案状态、Gateway 网关日志                                |
| 启发式未捕获             | 用户措辞未匹配修正模式                                      | 使用显式 `skill_workshop.suggest` 或启用 LLM 审查器         |
| 审查器未创建提案    | 审查器返回了 `none`、无效 JSON 或超时                                | Gateway 网关日志、`reviewTimeoutMs`、阈值                          |
| 提案未应用               | `approvalPolicy: "pending"`                                                         | `list_pending`，然后 `apply`                                         |
| 提案从待处理中消失     | 重用了重复提案、达到最大待处理数后被修剪，或已应用/拒绝/隔离 | 带状态过滤器的 `status`、`list_pending`、`list_quarantine`      |
| Skill 文件存在但模型漏掉它 | Skill 快照未刷新，或 skill 门控将其排除                            | `openclaw skills` 状态和工作区 skill 资格             |

相关日志：

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA 场景

仓库支持的 QA 场景：

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

运行确定性覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

运行审查器覆盖：

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

审查器场景有意分开，因为它启用 `reviewMode: "llm"` 并执行嵌入式审查器流程。

## 何时不要启用自动应用

在以下情况下避免使用 `approvalPolicy: "auto"`：

- 工作区包含敏感流程
- 智能体正在处理不可信输入
- Skills 在大型团队中共享
- 你仍在调优提示或扫描器规则
- 模型经常处理敌意网页/电子邮件内容

先使用待处理模式。只有在审查该工作区中智能体提出的 Skills 类型后，才切换到自动模式。

## 相关文档

- [Skills](/zh-CN/tools/skills)
- [插件](/zh-CN/tools/plugin)
- [测试](/zh-CN/reference/test)
