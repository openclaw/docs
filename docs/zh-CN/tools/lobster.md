---
read_when:
    - 你想要具有显式审批机制的确定性多步骤工作流
    - 你需要在不重新运行前面步骤的情况下恢复工作流
summary: OpenClaw 的类型化工作流运行时，支持可恢复的审批关卡。
title: Lobster
x-i18n:
    generated_at: "2026-04-05T23:42:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster 是一个工作流 shell，让 OpenClaw 能将多步骤工具序列作为一次单一、确定性的操作来运行，并带有显式审批检查点。

Lobster 位于分离式后台工作的上一层编写层级。有关单个任务之上的流程编排，请参见 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。有关任务活动账本，请参见 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 核心亮点

你的助手可以构建管理其自身的工具。提出一个工作流需求，30 分钟后你就能得到一个 CLI 和一组能通过一次调用运行的流水线。Lobster 正是缺失的那一块：确定性流水线、显式审批和可恢复状态。

## 为什么

如今，复杂工作流需要大量来回的工具调用。每次调用都会消耗 token，而且 LLM 必须编排每一步。Lobster 将这种编排移入一个类型化运行时中：

- **一次调用代替多次调用**：OpenClaw 运行一次 Lobster 工具调用，并获得结构化结果。
- **内置审批**：带有副作用的操作（发送邮件、发布评论）会暂停工作流，直到被显式批准。
- **可恢复**：已暂停的工作流会返回一个 token；批准后可继续，而无需重新运行所有内容。

## 为什么使用 DSL，而不是普通程序？

Lobster 有意保持精简。目标不是“发明一种新语言”，而是提供一种可预测、对 AI 友好的流水线规范，并内建一等支持的审批和恢复 token。

- **内置批准/恢复机制**：普通程序可以提示人工确认，但如果没有你自己发明那套运行时，它就无法借助持久 token 实现_暂停并恢复_。
- **确定性 + 可审计性**：流水线是数据，因此容易记录、Diffs、重放和审查。
- **面向 AI 的受限表面**：精简语法 + JSON 管道可减少“创造性”代码路径，并让校验变得切实可行。
- **内建安全策略**：超时、输出上限、沙箱检查和允许列表都由运行时强制执行，而不是由每个脚本分别处理。
- **依然可编程**：每一步都可以调用任意 CLI 或脚本。如果你想用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw 使用内嵌运行器**在进程内**运行 Lobster 工作流。不会生成外部 CLI 子进程；工作流引擎在 Gateway 网关进程内执行，并直接返回一个 JSON 包装对象。
如果流水线因等待审批而暂停，工具会返回一个 `resumeToken`，这样你就可以稍后继续。

## 模式：小型 CLI + JSON 管道 + 审批

构建能输出 JSON 的小命令，然后将它们串联成一次 Lobster 调用。（下面的命令名仅作示例——可替换为你自己的命令。）

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

如果流水线请求审批，可使用 token 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行这些步骤。审批关卡让副作用保持显式且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（`llm-task`）

对于需要**结构化 LLM 步骤**的工作流，启用可选的
`llm-task` 插件工具，并从 Lobster 中调用它。这样可以让工作流保持
确定性，同时仍然可以借助模型进行分类、总结或起草。

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

有关详细信息和配置选项，请参见 [LLM Task](/zh-CN/tools/llm-task)。

## 工作流文件（`.lobster`）

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

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传递前一步的输出。
- `condition`（或 `when`）可基于 `$step.approved` 控制步骤是否执行。

## 安装 Lobster

内置的 Lobster 工作流在进程内运行；不需要单独的 `lobster` 二进制文件。内嵌运行器随 Lobster 插件一起提供。

如果你在开发或外部流水线中需要独立的 Lobster CLI，请从 [Lobster repo](https://github.com/openclaw/lobster) 安装，并确保 `lobster` 已在 `PATH` 中。

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

或者按智能体配置：

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

除非你打算在限制性允许列表模式下运行，否则请避免使用 `tools.allow: ["lobster"]`。

注意：允许列表对于可选插件是选择启用的。如果你的允许列表只列出
插件工具（如 `lobster`），OpenClaw 会保留核心工具启用状态。若要限制核心
工具，也请将你希望保留的核心工具或工具组一并加入允许列表。

## 示例：电子邮件分类处理

没有 Lobster 时：

```
User: "Check my email and draft replies"
→ openclaw 调用 gmail.list
→ LLM 进行总结
→ User: "draft replies to #2 and #5"
→ LLM 起草回复
→ User: "send #2"
→ openclaw 调用 gmail.send
（每天重复，没有关于已分类内容的记忆）
```

使用 Lobster 时：

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

返回一个 JSON 包装对象（已截断）：

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

以工具模式运行流水线。

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

在审批后继续已暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：流水线的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过该时长则中止（默认：20000）。
- `maxStdoutBytes`：如果输出超过该大小则中止（默认：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅适用于工作流文件）。

## 输出包装对象

Lobster 返回一个 JSON 包装对象，其状态有以下三种之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；恢复时需要 `requiresApproval.resumeToken`
- `cancelled` → 被显式拒绝或取消

该工具会在 `content`（美化后的 JSON）和 `details`（原始对象）中同时提供该包装对象。

## 审批

如果存在 `requiresApproval`，请检查提示并作出决定：

- `approve: true` → 恢复并继续执行带副作用的操作
- `approve: false` → 取消并结束工作流

使用 `approve --preview-from-stdin --limit N` 可将 JSON 预览附加到审批请求中，而无需自定义 `jq` / heredoc 胶水代码。恢复 token 现在更加紧凑：Lobster 会将工作流恢复状态存储在其状态目录下，并返回一个小型 token 键。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 来编排多智能体准备工作，然后运行 Lobster 流水线以进行确定性审批。如果某个 Prose 程序需要 Lobster，可通过 `tools.subagents.tools` 为子智能体允许 `lobster` 工具。请参见 [OpenProse](/zh-CN/prose)。

## 安全

- **仅限本地进程内**——工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **无密钥管理**——Lobster 不管理 OAuth；它调用的是负责管理 OAuth 的 OpenClaw 工具。
- **感知沙箱**——当工具上下文处于沙箱隔离状态时将被禁用。
- **已加固**——超时和输出上限由内嵌运行器强制执行。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分较长的流水线。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保流水线以工具模式运行，并且只输出 JSON。
- **`lobster failed`** → 检查 Gateway 网关日志中的内嵌运行器错误详情。

## 了解更多

- [Plugins](/zh-CN/tools/plugin)
- [Plugin tool authoring](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例是：一个“第二大脑” CLI + Lobster 流水线，用于管理三个 Markdown 知识库（个人、伴侣、共享）。该 CLI 会为统计信息、收件箱列表和陈旧内容扫描输出 JSON；Lobster 再将这些命令串联为 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，并为每个工作流设置审批关卡。在可用时，AI 负责判断（分类）；在不可用时，则回退到确定性规则。

- 讨论串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 调度 Lobster 工作流
- [Automation Overview](/zh-CN/automation) — 所有自动化机制
- [Tools Overview](/zh-CN/tools) — 所有可用的智能体工具
