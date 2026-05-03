---
read_when:
    - 你需要带有明确审批的确定性多步骤工作流
    - 你需要在不重新运行先前步骤的情况下恢复工作流
summary: OpenClaw 的类型化工作流运行时，带可恢复的审批门禁。
title: 龙虾
x-i18n:
    generated_at: "2026-05-03T22:55:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1a81fddd11fa36f4ce3b3f0bce35f5a7e90300e225027331965bdfdc8919532
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一个工作流 shell，可让 OpenClaw 将多步工具序列作为单个确定性操作运行，并带有明确的批准检查点。

Lobster 是位于分离式后台工作之上的一个创作层。若要了解高于单个任务的流程编排，请参阅[任务流](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。若要了解任务活动账本，请参阅 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 钩子

你的助手可以构建用于管理自身的工具。提出一个工作流需求，30 分钟后你就会得到一个 CLI 加上能作为一次调用运行的管道。Lobster 就是缺失的那一环：确定性管道、明确批准，以及可恢复状态。

## 为什么

如今，复杂工作流需要大量来回工具调用。每次调用都会消耗 token，并且 LLM 必须编排每一步。Lobster 将这种编排移入一个类型化运行时：

- **一次调用替代多次调用**：OpenClaw 运行一次 Lobster 工具调用并获得结构化结果。
- **内置批准**：副作用（发送电子邮件、发表评论）会暂停工作流，直到获得明确批准。
- **可恢复**：暂停的工作流会返回一个 token；批准后即可恢复，无需重新运行所有内容。

## 为什么使用 DSL 而不是普通程序？

Lobster 有意保持小巧。目标不是“一个新语言”，而是一个可预测、AI 友好的管道规格，并以批准和恢复 token 作为一等能力。

- **批准/恢复是内置的**：普通程序可以提示人工确认，但除非你自己发明这套运行时，否则它无法使用持久 token 来_暂停和恢复_。
- **确定性 + 可审计性**：管道是数据，因此很容易记录、比较差异、重放和审查。
- **面向 AI 的受限表面**：小型语法 + JSON 管道减少了“创意型”代码路径，并让验证变得现实。
- **内置安全策略**：超时、输出上限、沙箱检查和允许列表由运行时强制执行，而不是由每个脚本各自处理。
- **仍然可编程**：每一步都可以调用任意 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw 使用嵌入式 runner **进程内**运行 Lobster 工作流。不会生成外部 CLI 子进程；工作流引擎在 Gateway 网关进程内执行，并直接返回 JSON 信封。
如果管道因批准而暂停，该工具会返回 `resumeToken`，方便你之后继续。

## 模式：小型 CLI + JSON 管道 + 批准

构建会输出 JSON 的小命令，然后将它们串联成一次 Lobster 调用。（下面的示例命令名可替换为你自己的。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

如果管道请求批准，请使用 token 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行步骤。批准门禁让副作用保持明确且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，请启用可选的
`llm-task` 插件工具，并从 Lobster 调用它。这样既能保持工作流确定性，
又仍然可以用模型进行分类、总结或起草。

启用工具：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

在管道中使用：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

详情和配置选项请参阅 [LLM 任务](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行带有 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 字段的 YAML/JSON 工作流文件。在 OpenClaw 工具调用中，将 `pipeline` 设置为文件路径。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

说明：

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传递先前步骤的输出。
- `condition`（或 `when`）可以根据 `$step.approved` 为步骤设置门禁。

## 安装 Lobster

内置 Lobster 工作流以进程内方式运行；不需要单独的 `lobster` 二进制文件。嵌入式 runner 随 Lobster 插件一起提供。

如果你需要用于开发或外部管道的独立 Lobster CLI，请从 [Lobster repo](https://github.com/openclaw/lobster) 安装，并确保 `lobster` 位于 `PATH` 中。

## 启用工具

Lobster 是一个**可选**插件工具（默认未启用）。

推荐方式（增量、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或按 agent 配置：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

除非你打算以限制性允许列表模式运行，否则请避免使用 `tools.allow: ["lobster"]`。

<Note>
允许列表对于可选插件是选择启用的。`alsoAllow` 只启用指定的可选插件工具，同时保留正常核心工具集。若要限制核心工具，请将 `tools.allow` 与你需要的核心工具或工具组一起使用。
</Note>

## 示例：电子邮件分诊

没有 Lobster：

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

使用 Lobster：

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

返回一个 JSON 信封（已截断）：

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

用户批准 → 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

一个工作流。确定性。安全。

## 工具参数

### `run`

以工具模式运行管道。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

使用参数运行工作流文件：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

批准后继续暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：管道的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过此时长则中止（默认：20000）。
- `maxStdoutBytes`：如果输出超过此大小则中止（默认：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅限工作流文件）。

## 输出信封

Lobster 返回带有三种状态之一的 JSON 信封：

- `ok` → 成功完成
- `needs_approval` → 已暂停；需要 `requiresApproval.resumeToken` 才能恢复
- `cancelled` → 已明确拒绝或取消

该工具会同时在 `content`（格式化 JSON）和 `details`（原始对象）中公开信封。

## 批准

如果存在 `requiresApproval`，请检查提示并作出决定：

- `approve: true` → 恢复并继续副作用
- `approve: false` → 取消并最终完成工作流

使用 `approve --preview-from-stdin --limit N` 将 JSON 预览附加到批准请求，无需自定义 jq/heredoc 粘合代码。恢复 token 现在很紧凑：Lobster 会在其状态目录下存储工作流恢复状态，并返回一个小型 token 键。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多 agent 准备工作，然后运行 Lobster 管道以获得确定性批准。如果 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 为子 agent 允许 `lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全

- **仅本地进程内**——工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **无机密管理**——Lobster 不管理 OAuth；它调用负责这些操作的 OpenClaw 工具。
- **感知沙箱**——当工具上下文处于沙箱隔离状态时会禁用。
- **加固**——嵌入式 runner 会强制执行超时和输出上限。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分过长的管道。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保管道以工具模式运行，并且只打印 JSON。
- **`lobster failed`** → 查看 Gateway 网关日志，获取嵌入式 runner 错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具创作](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：“第二大脑”CLI + Lobster 管道，用于管理三个 Markdown vault（个人、伴侣、共享）。CLI 会为统计信息、收件箱列表和陈旧扫描输出 JSON；Lobster 将这些命令串联成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个工作流都带有批准门禁。当 AI 可用时，它负责判断（分类）；不可用时，则回退到确定性规则。

- 线程：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化与任务](/zh-CN/automation) — 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) — 所有自动化机制
- [工具概览](/zh-CN/tools) — 所有可用 agent 工具
