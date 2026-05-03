---
read_when:
    - 你想要具有明确审批的确定性多步骤工作流
    - 你需要恢复一个工作流，而不重新运行之前的步骤
summary: 用于 OpenClaw 的类型化工作流运行时，支持可恢复的审批门禁。
title: 龙虾
x-i18n:
    generated_at: "2026-05-03T22:58:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一个工作流 shell，可让 OpenClaw 将多步工具序列作为单个确定性操作运行，并带有明确的审批检查点。

Lobster 是位于分离式后台工作之上的一个编写层。关于单个任务之上的流程编排，请参阅 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。关于任务活动账本，请参阅 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 钩子

你的助手可以构建管理自身的工具。提出一个工作流需求，30 分钟后你就能得到一个 CLI 和多条可作为一次调用运行的管道。Lobster 是缺失的一环：确定性管道、明确审批以及可恢复状态。

## 为什么

如今，复杂工作流需要许多来回的工具调用。每次调用都会消耗 token，而且 LLM 必须编排每一步。Lobster 将这种编排移入类型化运行时：

- **一次调用取代多次调用**：OpenClaw 运行一次 Lobster 工具调用，并获得结构化结果。
- **内置审批**：副作用（发送电子邮件、发表评论）会暂停工作流，直到明确审批。
- **可恢复**：暂停的工作流会返回一个 token；审批后即可恢复，而无需重新运行所有内容。

## 为什么使用 DSL 而不是普通程序？

Lobster 有意保持小巧。目标不是“新语言”，而是一个可预测、AI 友好的管道规范，并内置一等审批和恢复 token。

- **内置审批/恢复**：普通程序可以提示人类，但如果不自行发明运行时，它无法用持久 token _暂停并恢复_。
- **确定性 + 可审计性**：管道是数据，因此易于记录、比较差异、重放和审查。
- **面向 AI 的受约束表面**：很小的语法 + JSON 管道可减少“创造性”代码路径，并让验证更现实。
- **内建安全策略**：超时、输出上限、沙箱检查和 allowlist 由运行时强制执行，而不是由每个脚本自行处理。
- **仍可编程**：每一步都可以调用任意 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw 使用嵌入式 runner **进程内**运行 Lobster 工作流。不会生成外部 CLI 子进程；工作流引擎在 Gateway 网关进程内执行，并直接返回 JSON 信封。
如果管道因审批而暂停，工具会返回 `resumeToken`，以便你稍后继续。

## 模式：小型 CLI + JSON 管道 + 审批

构建使用 JSON 通信的小命令，然后将它们串成一次 Lobster 调用。（下面的示例命令名称可以替换为你自己的。）

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

如果管道请求审批，请使用 token 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行各步骤。审批关卡让副作用保持明确且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，启用可选的
`llm-task` 插件工具，并从 Lobster 调用它。这样可以保持工作流
确定性，同时仍可借助模型进行分类、总结和草拟。

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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

在管道中使用它：

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

详见 [LLM Task](/zh-CN/tools/llm-task) 了解详情和配置选项。

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

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传递前一步的输出。
- `condition`（或 `when`）可以基于 `$step.approved` 控制步骤是否执行。

## 安装 Lobster

内置 Lobster 工作流在进程内运行；不需要单独的 `lobster` 二进制文件。嵌入式 runner 随 Lobster 插件一起提供。

如果你需要独立的 Lobster CLI 用于开发或外部管道，请从 [Lobster repo](https://github.com/openclaw/lobster) 安装它，并确保 `lobster` 位于 `PATH` 中。

## 启用工具

Lobster 是一个**可选**插件工具（默认未启用）。

推荐方式（增量且安全）：

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

除非你打算在限制性 allowlist 模式下运行，否则请避免使用 `tools.allow: ["lobster"]`。

<Note>
可选插件的 allowlist 是选择启用的。`alsoAllow` 只启用指定的可选插件工具，同时保留常规核心工具集。若要限制核心工具，请将 `tools.allow` 与你想要的核心工具或分组一起使用。
</Note>

## 示例：电子邮件分流

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

用户审批 → 恢复：

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

在审批后继续暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：管道的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过此时长，则中止（默认值：20000）。
- `maxStdoutBytes`：如果输出超过此大小，则中止（默认值：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅限工作流文件）。

## 输出信封

Lobster 返回一个 JSON 信封，其中包含三种状态之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；需要 `requiresApproval.resumeToken` 才能恢复
- `cancelled` → 已明确拒绝或取消

该工具会在 `content`（格式化 JSON）和 `details`（原始对象）中公开信封。

## 审批

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续副作用
- `approve: false` → 取消并结束工作流

使用 `approve --preview-from-stdin --limit N` 可将 JSON 预览附加到审批请求，而不需要自定义 jq/heredoc 胶水代码。恢复 token 现在很紧凑：Lobster 将工作流恢复状态存储在其状态目录下，并返回一个小型 token 键。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多智能体准备工作，然后运行 Lobster 管道进行确定性审批。如果 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 允许子智能体使用 `lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全性

- **仅本地进程内** — 工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **无密钥** — Lobster 不管理 OAuth；它调用负责这些事项的 OpenClaw 工具。
- **感知沙箱** — 当工具上下文处于沙箱隔离状态时禁用。
- **已加固** — 嵌入式 runner 会强制执行超时和输出上限。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分较长的管道。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保管道以工具模式运行，并且只打印 JSON。
- **`lobster failed`** → 检查 Gateway 网关日志，查看嵌入式 runner 的错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：“第二大脑”CLI + Lobster 管道，用于管理三个 Markdown vault（个人、伴侣、共享）。该 CLI 为统计信息、收件箱列表和过期扫描输出 JSON；Lobster 将这些命令串成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个工作流都带有审批关卡。AI 可用时负责判断（分类），不可用时回退到确定性规则。

- 线程：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化与任务](/zh-CN/automation) — 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) — 所有自动化机制
- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
