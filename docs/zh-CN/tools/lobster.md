---
read_when:
    - 你想要带有显式审批的确定性多步骤工作流
    - 你需要在不重新运行先前步骤的情况下恢复工作流
summary: 用于 OpenClaw 的类型化工作流运行时，带有可恢复的审批门禁。
title: 龙虾
x-i18n:
    generated_at: "2026-05-12T01:00:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lobster 是一个工作流 shell，让 OpenClaw 能将多步骤工具序列作为单个、确定性的操作运行，并带有明确的审批检查点。

Lobster 是高于分离式后台工作的一个编写层。对于单个任务之上的流程编排，请参阅 [任务流](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。对于任务活动台账，请参阅 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 钩子

你的助手可以构建管理自身的工具。提出一个工作流需求，30 分钟后你就会拥有一个 CLI 以及可作为一次调用运行的流水线。Lobster 是缺失的那块拼图：确定性流水线、明确审批和可恢复状态。

## 为什么

如今，复杂工作流需要多次来回工具调用。每次调用都会消耗 token，并且 LLM 必须编排每个步骤。Lobster 将这种编排移入类型化运行时：

- **一次调用，而不是多次**：OpenClaw 运行一次 Lobster 工具调用并获得结构化结果。
- **内置审批**：副作用（发送邮件、发布评论）会暂停工作流，直到明确批准。
- **可恢复**：暂停的工作流会返回一个 token；批准后即可恢复，无需重新运行所有内容。

## 为什么使用 DSL 而不是普通程序？

Lobster 有意保持小巧。目标不是“一个新语言”，而是一个可预测、AI 友好的流水线规范，具备一等审批和恢复 token。

- **内置批准/恢复**：普通程序可以提示人工操作，但它无法在不由你自行发明运行时的情况下，使用持久 token _暂停并恢复_。
- **确定性 + 可审计性**：流水线是数据，因此易于记录、差异比较、重放和审查。
- **面向 AI 的受限表面**：极小语法 + JSON 管道减少“创造性”代码路径，并让验证更现实。
- **内置安全策略**：超时、输出上限、沙箱检查和允许列表由运行时强制执行，而不是由每个脚本执行。
- **仍然可编程**：每个步骤都可以调用任意 CLI 或脚本。如果你需要 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作方式

OpenClaw 使用嵌入式 runner **进程内**运行 Lobster 工作流。不会生成外部 CLI 子进程；工作流引擎在 Gateway 网关进程内执行，并直接返回 JSON 信封。
如果流水线为审批而暂停，工具会返回 `resumeToken`，让你之后继续。

## 模式：小型 CLI + JSON 管道 + 审批

构建使用 JSON 通信的小命令，然后将它们串成一次 Lobster 调用。（下面的示例命令名称请替换为你自己的名称。）

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

如果流水线请求审批，请使用 token 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行步骤。审批门让副作用明确且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，启用可选的
`llm-task` 插件工具并从 Lobster 调用它。这样既能保持工作流
确定性，也能让你使用模型进行分类、总结或起草。

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

内置 Lobster 插件会在 Gateway 网关内**进程内**运行工作流。在这种嵌入式模式下，`openclaw.invoke` **不会**自动为嵌套的 OpenClaw CLI 工具调用继承 Gateway 网关 URL/认证上下文。

这意味着此模式**目前在嵌入式 runner 中不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

仅当你在 **独立 Lobster CLI** 中运行，并且环境中的 `openclaw.invoke` 已配置正确的 Gateway 网关/认证上下文时，才使用下面的示例。

在独立 Lobster CLI 流水线中使用：

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

如果你今天使用的是嵌入式 Lobster 插件，请优先选择：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 在添加受支持的嵌入式桥接之前，在 Lobster 流水线内使用非 `openclaw.invoke` 步骤。

有关详情和配置选项，请参阅 [LLM Task](/zh-CN/tools/llm-task)。

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
- `condition`（或 `when`）可以根据 `$step.approved` 控制步骤是否执行。

## 安装 Lobster

内置 Lobster 工作流会进程内运行；不需要单独的 `lobster` 二进制文件。嵌入式 runner 随 Lobster 插件一起提供。

如果你需要独立 Lobster CLI 用于开发或外部流水线，请从 [Lobster 仓库](https://github.com/openclaw/lobster)安装，并确保 `lobster` 位于 `PATH` 上。

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

或按 Agent 配置：

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

除非你打算在受限允许列表模式下运行，否则避免使用 `tools.allow: ["lobster"]`。

<Note>
允许列表对于可选插件是选择启用的。`alsoAllow` 只启用命名的可选插件工具，同时保留正常的核心工具集。若要限制核心工具，请将 `tools.allow` 与你需要的核心工具或分组一起使用。
</Note>

## 示例：邮件分流

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

带参数运行工作流文件：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

在审批后继续暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：流水线的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过此时长则中止（默认：20000）。
- `maxStdoutBytes`：如果输出超过此大小则中止（默认：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅限工作流文件）。

## 输出信封

Lobster 返回一个 JSON 信封，其中包含三种状态之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；需要 `requiresApproval.resumeToken` 才能恢复
- `cancelled` → 明确拒绝或取消

该工具会在 `content`（美化后的 JSON）和 `details`（原始对象）中公开该信封。

## 审批

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续副作用
- `approve: false` → 取消并结束工作流

使用 `approve --preview-from-stdin --limit N` 可将 JSON 预览附加到审批请求，无需自定义 jq/heredoc 粘合逻辑。恢复 token 现在很紧凑：Lobster 会将工作流恢复状态存储在其状态目录下，并返回一个小型 token key。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多 Agent 准备工作，然后运行 Lobster 流水线来进行确定性审批。如果 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 允许子智能体使用 `lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全

- **仅本地进程内** - 工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **无密钥** - Lobster 不管理 OAuth；它调用负责 OAuth 的 OpenClaw 工具。
- **感知沙箱** - 当工具上下文被沙箱隔离时禁用。
- **已加固** - 嵌入式 runner 会强制执行超时和输出上限。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分较长的流水线。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保流水线以工具模式运行，并且只打印 JSON。
- **`lobster failed`** → 检查 Gateway 网关日志以获取嵌入式 runner 错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：一个“第二大脑”CLI + Lobster 流水线，用于管理三个 Markdown vault（个人、伴侣、共享）。CLI 会为统计信息、收件箱列表和陈旧内容扫描输出 JSON；Lobster 会将这些命令串联成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个工作流都带有审批门。AI 在可用时负责判断（分类），不可用时则回退到确定性规则。

- 主题帖：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化](/zh-CN/automation) - 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) - 所有自动化机制
- [工具概览](/zh-CN/tools) - 所有可用的 agent 工具
