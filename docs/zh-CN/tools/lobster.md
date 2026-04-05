---
read_when:
    - 你希望使用带显式批准的确定性多步骤工作流
    - 你需要在不重新运行前面步骤的情况下恢复工作流
summary: OpenClaw 的类型化工作流运行时，带可恢复的 approval gate。
title: Lobster
x-i18n:
    generated_at: "2026-04-05T10:12:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster 是一个工作流 shell，让 OpenClaw 能够将多步骤工具序列作为单个、确定性的操作来运行，并带有显式的批准检查点。

Lobster 比脱离式后台工作高一个编写层级。关于单个任务之上的 flow 编排，请参见 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。关于任务活动账本，请参见 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 引子

你的助手可以构建用于管理它自己的工具。提出一个工作流请求，30 分钟后你就能得到一个 CLI 加上一套可通过一次调用运行的流水线。Lobster 正是缺失的那一块：确定性流水线、显式批准和可恢复状态。

## 为什么

如今，复杂工作流需要许多来回的工具调用。每次调用都会消耗 token，而且 LLM 必须编排每一个步骤。Lobster 将这种编排移入一个类型化运行时中：

- **一次调用替代多次调用**：OpenClaw 运行一次 Lobster 工具调用并得到结构化结果。
- **内置批准**：副作用操作（发送邮件、发布评论）会暂停工作流，直到明确批准。
- **可恢复**：被暂停的工作流会返回一个 token；批准后可继续，而无需重新运行所有内容。

## 为什么使用 DSL，而不是普通程序？

Lobster 是刻意保持小巧的。目标不是“创造一门新语言”，而是提供一种可预测、对 AI 友好的流水线规范，并带有一等公民级别的批准和恢复 token。

- **内置 approve/resume**：普通程序可以提示人类，但如果不由你自己发明那套运行时，它就无法使用持久 token 来_暂停并恢复_。
- **确定性 + 可审计性**：流水线是数据，因此易于记录、Diffs、重放和审查。
- **为 AI 限制表面**：微小的语法 + JSON 管道减少了“创造性”代码路径，使验证更现实。
- **内建安全策略**：超时、输出上限、沙箱检查和 allowlists 都由运行时强制执行，而不是由每个脚本各自处理。
- **仍然可编程**：每个步骤都可以调用任意 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw 会以**工具模式**启动本地 `lobster` CLI，并从 stdout 解析一个 JSON 信封。
如果流水线因等待批准而暂停，该工具会返回一个 `resumeToken`，以便你稍后继续。

## 模式：小型 CLI + JSON 管道 + 批准

构建一些使用 JSON 通信的小命令，然后把它们串联成一次 Lobster 调用。（下面的命令名仅为示例 —— 你可以替换成自己的。）

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

如果流水线请求批准，请使用该 token 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行各个步骤。approval gates 让副作用保持显式且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅限 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，请启用可选的
`llm-task` 插件工具，并从 Lobster 中调用它。这样既能保持工作流的
确定性，又能继续使用模型进行分类/摘要/起草。

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

在流水线中使用它：

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

详细信息和配置选项请参见 [LLM Task](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行 YAML/JSON 工作流文件，支持 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 字段。在 OpenClaw 工具调用中，将 `pipeline` 设置为文件路径即可。

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

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传递前一步的输出。
- `condition`（或 `when`）可根据 `$step.approved` 控制步骤是否运行。

## 安装 Lobster

请在运行 OpenClaw Gateway 网关的**同一台主机**上安装 Lobster CLI（参见 [Lobster 仓库](https://github.com/openclaw/lobster)），并确保 `lobster` 已加入 `PATH`。

## 启用该工具

Lobster 是一个**可选**插件工具（默认未启用）。

推荐方式（增量式、安全）：

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

除非你确实打算在严格 allowlist 模式下运行，否则请避免使用 `tools.allow: ["lobster"]`。

注意：对于可选插件，allowlists 是选择加入的。如果你的 allowlist 只命名了
插件工具（例如 `lobster`），OpenClaw 仍会保持核心工具启用。若要限制核心
工具，也请在 allowlist 中加入你希望保留的核心工具或工具组。

## 示例：邮件分类处理

不使用 Lobster：

```
User: "Check my email and draft replies"
→ openclaw 调用 gmail.list
→ LLM 做摘要
→ User: "draft replies to #2 and #5"
→ LLM 起草回复
→ User: "send #2"
→ openclaw 调用 gmail.send
（每天重复，且不记得哪些内容已被分类处理）
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

以工具模式运行一个流水线。

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

在批准后继续一个被暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：流水线的相对工作目录（必须保持在当前进程工作目录内）。
- `timeoutMs`：如果子进程超过该时长，则将其终止（默认：20000）。
- `maxStdoutBytes`：如果 stdout 超过该大小，则将子进程终止（默认：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅适用于工作流文件）。

## 输出信封

Lobster 会返回一个 JSON 信封，其状态有以下三种之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；恢复时需要 `requiresApproval.resumeToken`
- `cancelled` → 已被显式拒绝或取消

该工具会同时在 `content`（美化后的 JSON）和 `details`（原始对象）中暴露该信封。

## 批准

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续执行副作用
- `approve: false` → 取消并结束该工作流

使用 `approve --preview-from-stdin --limit N` 可以将 JSON 预览附加到批准请求中，而无需自定义 jq/heredoc 胶水代码。现在的恢复 token 更紧凑：Lobster 会将工作流恢复状态存储在其状态目录下，并返回一个小型 token 键。

## OpenProse

OpenProse 与 Lobster 很搭：使用 `/prose` 来编排多智能体准备工作，然后运行一个 Lobster 流水线来获得确定性批准。如果某个 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 为子智能体允许 `lobster` 工具。参见 [OpenProse](/zh-CN/prose)。

## 安全

- **仅限本地子进程** —— 插件本身不发起网络调用。
- **无密钥管理** —— Lobster 不管理 OAuth；它调用的是管理这些内容的 OpenClaw 工具。
- **感知沙箱** —— 在沙箱化工具上下文中会被禁用。
- **已加固** —— 固定可执行文件名（`PATH` 中的 `lobster`）；并强制执行超时和输出上限。

## 故障排除

- **`lobster subprocess timed out`** → 增加 `timeoutMs`，或拆分过长的流水线。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出量。
- **`lobster returned invalid JSON`** → 确保流水线以工具模式运行，并且只打印 JSON。
- **`lobster failed (code …)`** → 在终端中运行相同的流水线以检查 stderr。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例是：“second brain” CLI + Lobster 流水线，用于管理三个 Markdown 仓库（个人、伴侣、共享）。该 CLI 会为统计、收件箱列表和陈旧扫描输出 JSON；Lobster 再把这些命令串联成诸如 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 之类的工作流，并为每个工作流设置 approval gates。AI 在可用时负责判断（分类），不可用时则回退为确定性规则。

- 讨论串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关内容

- [自动化与任务](/zh-CN/automation) —— 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) —— 所有自动化机制
- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
