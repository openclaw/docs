---
read_when:
    - 你需要带有明确批准的确定性多步骤工作流
    - 你需要继续执行工作流，而无需重新运行先前步骤。
summary: OpenClaw 的类型化工作流运行时，支持可恢复的审批门禁。
title: 龙虾
x-i18n:
    generated_at: "2026-05-07T13:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一个工作流 shell，它让 OpenClaw 能够将多步骤工具序列作为单个确定性操作运行，并带有显式批准检查点。

Lobster 是位于分离式后台工作之上的一个创作层。若要了解高于单个任务的流程编排，请参阅 [任务流](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。若要了解任务活动账本，请参阅 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 钩子

你的助手可以构建用于管理自身的工具。提出一个工作流需求，30 分钟后你就能得到一个 CLI 加上可作为一次调用运行的管道。Lobster 正是缺失的那一环：确定性管道、显式批准，以及可恢复状态。

## 为什么需要

如今，复杂工作流需要大量来回工具调用。每次调用都会消耗 token，并且 LLM 必须编排每个步骤。Lobster 将这种编排移入类型化运行时：

- **一次调用代替多次调用**：OpenClaw 运行一次 Lobster 工具调用，并获得结构化结果。
- **内置批准**：副作用（发送电子邮件、发布评论）会暂停工作流，直到显式批准。
- **可恢复**：暂停的工作流会返回一个 token；批准后即可恢复，而无需重新运行所有内容。

## 为什么使用 DSL，而不是普通程序？

Lobster 有意保持小巧。目标不是“新的语言”，而是一个可预测、AI 友好的管道规范，内置一等批准和恢复 token。

- **内置批准/恢复**：普通程序可以提示人类，但无法在你不自行发明运行时的情况下，使用持久 token 来_暂停和恢复_。
- **确定性 + 可审计性**：管道是数据，因此易于记录、diff、重放和审查。
- **面向 AI 的受限表面**：小型语法 + JSON 管道减少“创造性”代码路径，并使验证变得现实。
- **内置安全策略**：超时、输出上限、沙箱检查和 allowlist 由运行时强制执行，而不是由每个脚本负责。
- **仍然可编程**：每个步骤都可以调用任何 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw 使用嵌入式运行器**在进程内**运行 Lobster 工作流。不会生成外部 CLI 子进程；工作流引擎在 Gateway 网关进程内执行，并直接返回 JSON 信封。
如果管道因批准而暂停，该工具会返回 `resumeToken`，以便你稍后继续。

## 模式：小型 CLI + JSON 管道 + 批准

构建会输出 JSON 的小命令，然后将它们串接成一次 Lobster 调用。（下面的示例命令名称可以替换为你自己的。）

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

AI 触发工作流；Lobster 执行步骤。批准门禁让副作用保持显式且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，请启用可选的
`llm-task` 插件工具，并从 Lobster 调用它。这会让工作流保持确定性，同时仍然允许你使用模型进行分类、摘要和起草。

启用该工具：

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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### 重要限制：嵌入式 Lobster 与 `openclaw.invoke`

内置 Lobster 插件会在 Gateway 网关内**进程内**运行工作流。在这种嵌入式模式下，`openclaw.invoke` **不会**自动继承用于嵌套 OpenClaw CLI 工具调用的 Gateway 网关 URL/认证上下文。

这意味着以下模式**目前在嵌入式运行器中并不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

仅当在已经为 `openclaw.invoke` 配置正确 Gateway 网关/认证上下文的环境中运行**独立 Lobster CLI**时，才使用下面的示例。

在独立 Lobster CLI 管道中使用它：

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

如果你目前使用嵌入式 Lobster 插件，优先选择：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 在支持的嵌入式桥接加入之前，在 Lobster 管道内使用非 `openclaw.invoke` 步骤。

有关详情和配置选项，请参阅 [LLM 任务](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行包含 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 字段的 YAML/JSON 工作流文件。在 OpenClaw 工具调用中，将 `pipeline` 设置为文件路径。

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

注意：

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传递先前步骤的输出。
- `condition`（或 `when`）可以基于 `$step.approved` 对步骤设门禁。

## 安装 Lobster

内置 Lobster 工作流在进程内运行；不需要单独的 `lobster` 二进制文件。嵌入式运行器随 Lobster 插件一起提供。

如果你需要用于开发或外部管道的独立 Lobster CLI，请从 [Lobster 仓库](https://github.com/openclaw/lobster)安装，并确保 `lobster` 位于 `PATH` 上。

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

或按智能体配置：

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

除非你打算在限制性 allowlist 模式下运行，否则避免使用 `tools.allow: ["lobster"]`。

<Note>
allowlist 对可选插件是选择加入的。`alsoAllow` 只启用指定的可选插件工具，同时保留正常的核心工具集。若要限制核心工具，请将 `tools.allow` 与你需要的核心工具或组一起使用。
</Note>

## 示例：电子邮件分诊

不使用 Lobster：

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

在工具模式下运行管道。

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

在批准后继续已暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：管道的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过此时长，则中止它（默认值：20000）。
- `maxStdoutBytes`：如果输出超过此大小，则中止工作流（默认值：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅限工作流文件）。

## 输出信封

Lobster 返回一个 JSON 信封，其中包含三种状态之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；需要 `requiresApproval.resumeToken` 才能恢复
- `cancelled` → 已显式拒绝或取消

该工具会同时在 `content`（美化 JSON）和 `details`（原始对象）中公开信封。

## 批准

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续副作用
- `approve: false` → 取消并结束工作流

使用 `approve --preview-from-stdin --limit N` 将 JSON 预览附加到批准请求，而无需自定义 jq/heredoc 粘合代码。恢复 token 现在很紧凑：Lobster 将工作流恢复状态存储在其状态目录下，并返回一个小型 token 键。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多智能体准备工作，然后运行 Lobster 管道以获得确定性批准。如果 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 为子智能体允许 `lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全

- **仅本地进程内** - 工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **无 secrets** - Lobster 不管理 OAuth；它会调用负责这些操作的 OpenClaw 工具。
- **感知沙箱** - 当工具上下文处于沙箱隔离状态时禁用。
- **已加固** - 嵌入式运行器会强制执行超时和输出上限。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分较长的管道。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保管道在工具模式下运行，并且只打印 JSON。
- **`lobster failed`** → 检查 Gateway 网关日志，查看嵌入式运行器错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具创作](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：一个“第二大脑”CLI + Lobster 管道，用于管理三个 Markdown vault（个人、伴侣、共享）。该 CLI 会为统计信息、收件箱列表和过期扫描输出 JSON；Lobster 将这些命令串接为 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个工作流都有批准门禁。AI 在可用时处理判断（分类），不可用时回退到确定性规则。

- 线程：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化和任务](/zh-CN/automation) - 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) - 所有自动化机制
- [工具概览](/zh-CN/tools) - 所有可用智能体工具
