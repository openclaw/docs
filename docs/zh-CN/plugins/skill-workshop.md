---
read_when:
    - 你希望智能体将修正或可复用流程转化为工作区 Skills
    - 你正在配置程序性技能记忆
    - 你正在调试 skill_workshop 工具行为
    - 你正在决定是否启用自动创建技能
summary: 将可复用流程作为工作区 Skills 进行实验性捕获，并支持审查、批准、隔离和 Skills 热刷新
title: 技能工作坊插件
x-i18n:
    generated_at: "2026-05-07T13:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

技能工作坊是**实验性**功能。它默认禁用，它的捕获
启发式规则和审阅者提示可能会在版本之间变化，并且自动
写入只应在受信任的工作区中使用，且应先审阅 pending 模式的
输出。

技能工作坊是面向工作区技能的过程式记忆。它让智能体可以把
可复用工作流、用户纠正、来之不易的修复以及反复出现的陷阱
转化为以下位置的 `SKILL.md` 文件：

```text
<workspace>/skills/<skill-name>/SKILL.md
```

这不同于长期记忆：

- **记忆**存储事实、偏好、实体和过往上下文。
- **Skills** 存储智能体在未来任务中应遵循的可复用流程。
- **技能工作坊**是从有用轮次到持久工作区技能的桥梁，
  带有安全检查和可选审批。

当智能体学到如下流程时，技能工作坊很有用：

- 如何验证外部来源的动画 GIF 资产
- 如何替换截图资产并验证尺寸
- 如何运行仓库特定的 QA 场景
- 如何调试反复出现的提供商故障
- 如何修复过期的本地工作流笔记

它不适用于：

- “用户喜欢蓝色”这类事实
- 宽泛的自传式记忆
- 原始转录归档
- 密钥、凭证或隐藏提示文本
- 不会重复的一次性指令

## 默认状态

内置插件是**实验性**的，并且**默认禁用**，除非它在
`plugins.entries.skill-workshop` 中被显式启用。

插件清单不会设置 `enabledByDefault: true`。插件配置架构中的
`enabled: true` 默认值只会在插件条目已被选择并加载后应用。

实验性意味着：

- 插件已足够支持选择性测试和内部试用
- 提案存储、审阅者阈值和捕获启发式规则可能演进
- 建议从待审批模式开始
- 自动应用适用于受信任的个人/工作区设置，而不适用于共享或敌对的
  高频输入环境

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
- 基于阈值的审阅者通过后可以提出技能更新
- 在应用待处理提案之前，不会写入任何技能文件

只在受信任的工作区中使用自动写入：

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

`approvalPolicy: "auto"` 仍使用相同的扫描器和隔离路径。它
不会应用带有严重发现的提案。

## 配置

| 键                   | 默认值      | 范围 / 值                                   | 含义                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | 在插件条目加载后启用插件。                                           |
| `autoCapture`        | `true`      | boolean                                     | 在成功的智能体轮次后启用捕获/审阅。                                  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 将提案排队，或自动写入安全提案。                                     |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 选择显式纠正捕获、LLM 审阅者、两者，或都不启用。                     |
| `reviewInterval`     | `15`        | `1..200`                                    | 在这么多次成功轮次后运行审阅者。                                     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 在观察到这么多次工具调用后运行审阅者。                               |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 嵌入式审阅者运行的超时时间。                                         |
| `maxPending`         | `50`        | `1..200`                                    | 每个工作区保留的待处理/已隔离提案最大数量。                          |
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

技能工作坊有三种捕获路径。

### 工具建议

当模型看到可复用流程，或用户要求它保存/更新技能时，可以直接调用
`skill_workshop`。

这是最显式的路径，即使设置了 `autoCapture: false` 也可用。

### 启发式捕获

启用 `autoCapture`，并且 `reviewMode` 为 `heuristic` 或 `hybrid` 时，
插件会扫描成功轮次中的显式用户纠正短语：

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

启发式规则会从最新匹配的用户指令创建提案。它使用主题提示为常见工作流选择技能名称：

- 动画 GIF 任务 -> `animated-gif-workflow`
- 截图或资产任务 -> `screenshot-asset-workflow`
- QA 或场景任务 -> `qa-scenario-workflow`
- GitHub PR 任务 -> `github-pr-workflow`
- 兜底 -> `learned-workflows`

启发式捕获被有意设计得很窄。它用于明确的纠正和
可重复的流程笔记，而不是通用的转录摘要。

### LLM 审阅者

启用 `autoCapture`，并且 `reviewMode` 为 `llm` 或 `hybrid` 时，插件
会在达到阈值后运行一个紧凑的嵌入式审阅者。

审阅者会收到：

- 最近的转录文本，限制为最后 12,000 个字符
- 最多 12 个现有工作区技能
- 每个现有技能最多 2,000 个字符
- 仅 JSON 指令

审阅者没有工具：

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

审阅者会返回 `{ "action": "none" }` 或一个提案。`action` 字段为 `create`、`append` 或 `replace`，当已有相关技能时优先使用 `append`/`replace`；仅在没有现有技能适配时使用 `create`。

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

`append` 会添加 `section` + `body`。`replace` 会在命名技能中将 `oldText` 替换为 `newText`。

## 提案生命周期

每次生成的更新都会成为一个包含以下内容的提案：

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 可选的 `agentId`
- 可选的 `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, 或 `reviewer`
- `status`
- `change`
- 可选的 `scanFindings`
- 可选的 `quarantineReason`

提案状态：

- `pending` - 等待审批
- `applied` - 已写入 `<workspace>/skills`
- `rejected` - 被操作者/模型拒绝
- `quarantined` - 因严重扫描发现被阻止

状态按工作区存储在 Gateway 网关状态目录下：

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

待处理和隔离的提案会按技能名称和变更载荷去重。存储最多会保留 `maxPending` 个最新的待处理/隔离提案。

## 工具参考

插件会注册一个智能体工具：

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

列出另一种状态：

```json
{ "action": "list_pending", "status": "applied" }
```

有效的 `status` 值：

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

列出隔离提案。

```json
{ "action": "list_quarantine" }
```

当自动捕获似乎没有任何效果，并且日志提到 `skill-workshop: quarantined <skill>` 时使用此操作。

### `inspect`

按 ID 获取提案。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

创建提案。使用 `approvalPolicy: "pending"`（默认）时，此操作会进入队列而不是写入。

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
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

使用 `approvalPolicy: "pending"` 时，`apply: true` 仍会将提案加入队列。先审查它，然后在批准后使用 `apply` 操作。

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

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

  <Accordion title="Append to a named section">

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

  <Accordion title="Replace exact text">

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

使用 `approvalPolicy: "pending"` 时，此操作会在写入工作区技能前请求操作者批准。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` 会拒绝隔离提案：

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

在现有或拟议的技能目录中写入支持文件。

允许的顶级支持目录：

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

支持文件限定在工作区范围内、经过路径检查、受 `maxSkillBytes` 字节上限限制、会被扫描，并以原子方式写入。

## 技能写入

Skill Workshop 只会写入以下目录：

```text
<workspace>/skills/<normalized-skill-name>/
```

技能名称会被规范化：

- 转为小写
- 连续的非 `[a-z0-9_-]` 字符会变成 `-`
- 移除开头和结尾的非字母数字字符
- 最大长度为 80 个字符
- 最终名称必须匹配 `[a-z0-9][a-z0-9_-]{1,79}`

对于 `create`：

- 如果技能不存在，Skill Workshop 会写入新的 `SKILL.md`
- 如果已经存在，Skill Workshop 会把正文追加到 `## Workflow`

对于 `append`：

- 如果技能存在，Skill Workshop 会追加到请求的章节
- 如果技能不存在，Skill Workshop 会创建一个最小技能，然后追加内容

对于 `replace`：

- 技能必须已经存在
- `oldText` 必须精确存在
- 只会替换第一个精确匹配项

所有写入都是原子的，并会立即刷新内存中的 Skills 快照，因此新的或更新后的技能无需重启 Gateway 网关即可变为可见。

## 安全模型

Skill Workshop 会对生成的 `SKILL.md` 内容和支持文件运行安全扫描器。

严重发现会隔离提案：

| 规则 ID                                | 阻止满足以下情况的内容...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 要求智能体忽略先前或更高优先级的指令                   |
| `prompt-injection-system`              | 引用系统提示词、开发者消息或隐藏指令 |
| `prompt-injection-tool`                | 鼓励绕过工具权限或审批                         |
| `shell-pipe-to-shell`                  | 包含通过管道传入 `sh`、`bash` 或 `zsh` 的 `curl`/`wget`              |
| `secret-exfiltration`                  | 看起来会通过网络发送环境变量或进程环境数据                 |

警告发现会被保留，但其本身不会阻止内容：

| 规则 ID              | 警告以下情况...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | 宽泛的 `rm -rf` 风格命令    |
| `unsafe-permissions` | `chmod 777` 风格的权限使用 |

被隔离的提案：

- 保留 `scanFindings`
- 保留 `quarantineReason`
- 会出现在 `list_quarantine` 中
- 不能通过 `apply` 应用

要从被隔离的提案中恢复，请创建一个已移除不安全内容的新安全提案。不要手动编辑存储 JSON。

## 提示词指导

启用后，Skill Workshop 会注入一个简短的提示词章节，告诉智能体使用 `skill_workshop` 保存持久的流程性记忆。

该指导强调：

- 流程，而不是事实或偏好
- 用户纠正
- 不明显但成功的流程
- 反复出现的陷阱
- 通过追加或替换修复过期、单薄或错误的技能
- 在长时间工具循环或困难修复后保存可复用流程
- 简短的祈使式技能文本
- 不要转储对话记录

写入模式文本会随 `approvalPolicy` 变化：

- 待处理模式：将建议加入队列；在明确审批后使用 `apply`
- 自动模式：应用安全的工作区技能更新，除非 `apply: false` 改为加入队列

## 成本和运行时行为

启发式捕获不会调用模型。

LLM 审查会在活动或默认智能体模型上使用嵌入式运行。它基于阈值，因此默认不会在每个轮次都运行。

审查器：

- 可用时使用相同的已配置提供商和模型上下文
- 回退到运行时智能体默认值
- 有 `reviewTimeoutMs`
- 使用轻量级引导上下文
- 没有工具
- 不会直接写入任何内容
- 只能生成一个提案，该提案会经过常规扫描器以及审批或隔离路径

如果审查器失败、超时或返回无效 JSON，插件会记录一条警告或调试消息，并跳过该次审查。

## 操作模式

当用户说以下内容时使用 Skill Workshop：

- “下次做 X”
- “从现在开始，优先选择 Y”
- “确保验证 Z”
- “把这个保存为工作流”
- “这花了一段时间；记住这个过程”
- “更新这个本地技能”

好的技能文本：

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

不好的技能文本：

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

不应保存这个差版本的原因：

- 形似对话记录
- 不是祈使式
- 包含嘈杂的一次性细节
- 没有告诉下一个智能体该做什么

## 调试

检查插件是否已加载：

```bash
openclaw plugins list --enabled
```

从智能体或工具上下文检查提案数量：

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
| 未出现自动提案         | `autoCapture: false`、`reviewMode: "off"`，或未达到阈值                    | 配置、提案状态、Gateway 网关日志                                |
| 启发式未捕获             | 用户措辞未匹配纠正规则                                      | 使用显式 `skill_workshop.suggest` 或启用 LLM 审查器         |
| 审查器未创建提案    | 审查器返回 `none`、无效 JSON 或超时                                | Gateway 网关日志、`reviewTimeoutMs`、阈值                          |
| 提案未应用               | `approvalPolicy: "pending"`                                                         | `list_pending`，然后 `apply`                                         |
| 提案从待处理中消失     | 复用了重复提案、待处理上限裁剪，或已应用、拒绝或隔离 | 带状态过滤器的 `status`、`list_pending`、`list_quarantine`      |
| 技能文件存在但模型未命中它 | Skills 快照未刷新，或技能门控将其排除                            | `openclaw skills` 状态和工作区技能资格             |

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

审查器场景是有意分开的，因为它启用了 `reviewMode: "llm"` 并运行嵌入式审查器流程。

## 何时不启用自动应用

在以下情况下避免使用 `approvalPolicy: "auto"`：

- 工作区包含敏感流程
- 智能体正在处理不可信输入
- 技能在大型团队中共享
- 你仍在调优提示词或扫描器规则
- 模型经常处理恶意 Web 或电子邮件内容

先使用待处理模式。只有在审查该工作区中智能体会提议的技能类型之后，才切换到自动模式。

## 相关文档

- [Skills](/zh-CN/tools/skills)
- [插件](/zh-CN/tools/plugin)
- [测试](/zh-CN/reference/test)
