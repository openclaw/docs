---
read_when:
    - 你需要具有明确审批机制的确定性多步骤工作流
    - 你需要恢复一个工作流，而无需重新运行之前的步骤
summary: OpenClaw 的类型化工作流运行时，支持可恢复的审批关卡。
title: 龙虾
x-i18n:
    generated_at: "2026-07-11T21:01:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 将多步骤工具流水线作为一次确定性的工具调用运行，并提供明确的审批检查点和恢复令牌。它位于分离式后台工作的上一层：如需跨多个分离任务编排流程，请参阅[任务流](/zh-CN/automation/taskflow)（`openclaw tasks flow`）；如需查看任务活动账本，请参阅[后台任务](/zh-CN/automation/tasks)。

## 原因

如果不使用 Lobster，多步骤作业就需要进行多次往返工具调用，并由模型编排每个步骤。Lobster 将这种编排移入类型化运行时：

- **一次调用取代多次调用**：单次 Lobster 工具调用会返回整个流水线的结构化结果。
- **内置审批**：副作用操作（发送、发布、删除）会暂停工作流，直到获得明确批准。
- **可恢复**：暂停的工作流会返回令牌；批准后即可恢复，无需重新运行先前步骤。

Lobster 是一种小型、受限的 DSL，而不是通用脚本语言：批准/恢复是一种持久的内置原语；流水线以数据形式存在（便于记录、比较差异、重放和审查）；精简的语法限制了“创造性”代码路径，使验证保持切实可行；超时、输出上限、沙箱检查和允许列表由运行时统一强制执行，而不是由每个脚本自行处理。每个步骤仍可调用任意 CLI 或脚本——如果你希望使用功能更丰富的创作语言，可以通过其他工具生成 `.lobster` 文件。

如果不使用 Lobster，重复执行的电子邮件分类流程如下：

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

使用 Lobster 后，同一作业只需一次调用，它会暂停以等待审批，随后恢复：

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## 工作原理

OpenClaw 使用内置的 `@clawdbot/lobster` 软件包作为嵌入式运行器，**在进程内**运行 Lobster 工作流。系统不会生成外部 `lobster` 子进程；工具调用会直接返回 JSON 信封。如果流水线暂停以等待审批，该信封会携带恢复令牌（或简短审批 ID），以便你稍后继续执行。

## 启用

Lobster 是一个**可选**插件工具，默认不启用。它已内置提供，因此无需单独安装——只需允许使用该工具：

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

<Note>
`alsoAllow` 会在当前工具配置文件的基础上添加 `lobster`，而不会限制其他核心工具。只有在你希望改用限制性允许列表模式时，才应使用 `tools.allow`。
</Note>

在沙箱隔离的工具上下文中，该工具会被完全禁用。

如果你需要独立的 Lobster CLI 用于开发或外部流水线（不使用嵌入式 Gateway 网关运行器），请从 [Lobster 仓库](https://github.com/openclaw/lobster)安装，并将 `lobster` 添加到 `PATH`。

## 模式：小型 CLI + JSON 管道 + 审批

构建使用 JSON 通信的小型命令，然后将它们串联为一次 Lobster 调用。（以下命令名称仅为示例——请替换为你自己的命令。）

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

如果流水线请求审批，请使用令牌恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

如需在工作流中使用**结构化 LLM 步骤**，请启用可选的 `llm-task` 插件工具，并从 Lobster 调用它：

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

内置的 Lobster 插件会在 Gateway 网关内**以进程内方式**运行工作流。在这种嵌入式模式下，`openclaw.invoke` **不会**自动继承用于嵌套 OpenClaw CLI 工具调用的 Gateway 网关 URL/身份验证上下文。

这意味着以下模式**目前无法在嵌入式运行器中可靠运行**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

仅当你在已为 `openclaw.invoke` 配置正确 Gateway 网关/身份验证上下文的环境中运行**独立 Lobster CLI** 时，才使用以下示例。

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

如果你目前使用的是嵌入式 Lobster 插件，请优先选择以下任一方式：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 在添加受支持的嵌入式桥接之前，在 Lobster 流水线内使用不依赖 `openclaw.invoke` 的步骤。

有关详细信息和配置选项，请参阅 [LLM 任务](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行包含 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 字段的 YAML/JSON 工作流文件。在工具调用中将 `pipeline` 设置为文件路径。

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
- `condition`（或 `when`）可以根据 `$step.approved` 决定是否执行步骤。

## 工具参数

### `run`

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

| 字段             | 默认值          | 说明                                                                                                               |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | 必填            | 内联流水线字符串，或以 `.lobster`/`.yaml`/`.yml`/`.json` 结尾的工作流文件路径。                                    |
| `cwd`            | Gateway 当前目录 | 相对工作目录；解析后必须位于 Gateway 网关工作目录内（绝对路径会被拒绝）。                                          |
| `timeoutMs`      | `20000`         | 超过此时间后中止运行。                                                                                             |
| `maxStdoutBytes` | `512000`        | 捕获的 stdout 或 stderr 超过此大小后中止运行。                                                                     |
| `argsJson`       | -               | 工作流文件的参数 JSON 字符串（内联流水线会忽略此项）。                                                             |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` 接受 `token`（来自 `requiresApproval` 的完整恢复令牌）或 `approvalId`（来自同一对象的简短 ID）——使用暂停运行所返回的任意一种即可。必须提供 `approve`。

### 托管 Task Flow 模式

在 `run` 中传入 `flowControllerId` 和 `flowGoal`（或在 `resume` 中传入 `flowId` 和 `flowExpectedRevision`），会让调用通过插件运行时托管的[任务流](/zh-CN/automation/taskflow) API 执行，而不是返回裸信封：OpenClaw 会创建或恢复持久化流程记录，将 Lobster 信封应用到该记录（审批时为 `waiting`，完成时为 `succeeded`/`failed`），并返回 `{ ok, envelope, flow, mutation }`。此模式需要绑定 Task Flow 运行时，适用于需要在 Gateway 网关重启后仍保留持久流程状态的插件/控制器代码，而不适用于常规的临时智能体操作。

## 输出信封

Lobster 返回带有以下三种状态之一的 JSON 信封：

- `ok`——成功完成
- `needs_approval`——已暂停；`requiresApproval` 包含 `resumeToken` 和简短的 `approvalId`，两者都可以用于恢复运行
- `cancelled`——已明确拒绝或取消

该工具会同时通过 `content`（格式化 JSON）和 `details`（原始对象）提供信封。

## 审批

如果存在 `requiresApproval`，请检查提示并作出决定：

- `approve: true`——恢复并继续执行副作用操作
- `approve: false`——取消并结束工作流

使用 `approve --preview-from-stdin --limit N` 可以将 JSON 预览附加到审批请求，而无需自定义 jq/heredoc 拼接逻辑。恢复状态会以小型 JSON 文件的形式存储在 Lobster 状态目录下（默认为 `~/.lobster/state`，可通过 `LOBSTER_STATE_DIR` 覆盖）；令牌本身仅编码指向该状态的指针，而不包含完整的流水线状态。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多智能体准备工作，然后运行 Lobster 流水线以实现确定性审批。如果 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 为子智能体允许使用 `lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全性

- **仅限本地进程内执行**——工作流在 Gateway 网关进程内执行；插件本身不会发起网络调用。
- **不管理密钥**——Lobster 不管理 OAuth；它调用负责此功能的 OpenClaw 工具。
- **感知沙箱状态**——当工具上下文处于沙箱隔离状态时禁用。
- **经过加固**——嵌入式运行器会强制执行超时和输出上限。

## 故障排查

| 错误                                                          | 原因/修复方法                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 流水线超过了 `timeoutMs`。请增大该值或拆分流水线。                               |
| `lobster stdout exceeded maxStdoutBytes`（或 `stderr`）       | 捕获的输出超过了上限。请增大 `maxStdoutBytes` 或减少输出。                       |
| `run --args-json must be valid JSON`                          | `argsJson`（工作流文件运行）解析失败。请修复 JSON 字符串。                       |
| `lobster runtime failed`（或其他 `runtime_error` 消息）       | 嵌入式运行时返回了错误信封。请检查 Gateway 网关日志以了解详情。                  |

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：一个“第二大脑” CLI + Lobster 流水线，用于管理三个 Markdown 知识库（个人、伴侣、共享）。CLI 会输出统计信息、收件箱列表和陈旧内容扫描结果的 JSON；Lobster 将这些命令串联为 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个工作流都设有审批关卡。AI 可用时负责需要判断的任务（分类），不可用时则回退到确定性规则。

- 讨论串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关内容

- [自动化](/zh-CN/automation) - 所有自动化机制
- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
