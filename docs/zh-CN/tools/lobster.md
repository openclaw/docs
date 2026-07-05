---
read_when:
    - 你需要带有显式审批的确定性多步骤工作流
    - 你需要继续一个工作流，而不重新运行之前的步骤
summary: OpenClaw 的类型化工作流运行时，带可恢复的审批门控。
title: 龙虾
x-i18n:
    generated_at: "2026-07-05T11:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 将多步骤工具流水线作为一次确定性的工具调用运行，并带有
显式审批检查点和恢复令牌。它位于分离后台工作之上一层：如需编排跨多个分离任务的流程，
请参阅 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）；如需任务
活动账本，请参阅 [后台任务](/zh-CN/automation/tasks)。

## 原因

没有 Lobster 时，多步骤作业意味着许多往返工具调用，
模型需要编排每一步。Lobster 将这种编排移入一个类型化
运行时：

- **一次调用替代多次调用**：单个 Lobster 工具调用会返回整个流水线的结构化
  结果。
- **内置审批**：副作用（发送、发布、删除）会暂停工作流，
  直到获得显式批准。
- **可恢复**：暂停的工作流会返回一个令牌；批准并恢复时无需
  重新运行之前的步骤。

Lobster 是一个小型、受约束的 DSL，而不是通用脚本语言：
approve/resume 是一个持久的内置原语；流水线是数据（易于
记录、对比、重放、审查）；极小的语法限制了“创造性”代码路径，因此
验证保持现实可行；超时、输出上限、沙箱检查和
允许列表由运行时强制执行，而不是由每个脚本执行。每个步骤仍然可以
调用任何 CLI 或脚本。如果你想要更丰富的编写语言，可以从其他工具
生成 `.lobster` 文件。

没有 Lobster 时，重复的邮件分诊看起来像这样：

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

使用 Lobster 时，同一个作业是一次调用，会暂停等待审批并恢复：

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

OpenClaw 使用内置的 `@clawdbot/lobster` 包作为嵌入式运行器，
**进程内**运行 Lobster 工作流。不会生成外部 `lobster`
子进程；工具调用会直接返回一个 JSON 信封。如果
流水线暂停等待审批，该信封会携带一个恢复令牌（或一个短
审批 ID），以便你稍后继续。

## 启用

Lobster 是一个**可选**插件工具，默认未启用。它以内置形式发布，
因此不需要单独安装步骤，只需允许该工具：

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

<Note>
`alsoAllow` 会在活动工具配置之上添加 `lobster`，
而不会限制其他核心工具。仅当你想改用限制性
允许列表模式时，才使用 `tools.allow`。
</Note>

对于沙箱隔离的工具上下文，该工具会被完全禁用。

如果你需要用于开发或外部流水线的独立 Lobster CLI
（在嵌入式 Gateway 网关运行器之外），请从
[Lobster 仓库](https://github.com/openclaw/lobster)安装它，并将 `lobster` 放到
`PATH` 上。

## 模式：小型 CLI + JSON 管道 + 审批

构建会读写 JSON 的小命令，然后将它们串成一次 Lobster 调用。
（下面是示例命令名称，请替换成你自己的。）

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

对于工作流内的**结构化 LLM 步骤**，请启用可选的
`llm-task` 插件工具，并从 Lobster 调用它：

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

内置 Lobster 插件在 Gateway 网关内部**进程内**运行工作流。
在该嵌入式模式下，`openclaw.invoke` **不会**自动继承用于嵌套 OpenClaw CLI 工具调用的
Gateway 网关 URL/认证上下文。

这意味着以下模式**目前在嵌入式运行器中并不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

仅当在 `openclaw.invoke` 已配置正确 Gateway 网关/认证上下文的环境中
运行**独立 Lobster CLI** 时，才使用下面的示例。

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

如果你今天使用嵌入式 Lobster 插件，请优先选择以下任一方式：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 在添加受支持的嵌入式桥接之前，在 Lobster 流水线内使用非
  `openclaw.invoke` 步骤。

有关详细信息和配置选项，请参阅 [LLM Task](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行包含 `name`、`args`、`steps`、`env`、
`condition` 和 `approval` 字段的 YAML/JSON 工作流文件。在工具
调用中将 `pipeline` 设置为文件路径。

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
- `condition`（或 `when`）可以基于 `$step.approved` 门控步骤。

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

| 字段             | 默认值      | 说明                                                                                                         |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | 必填        | 内联流水线字符串，或以 `.lobster`/`.yaml`/`.yml`/`.json` 结尾的工作流文件路径。                              |
| `cwd`            | Gateway 网关 cwd | 相对工作目录；必须解析到 Gateway 网关工作目录内部（绝对路径会被拒绝）。                                      |
| `timeoutMs`      | `20000`     | 如果超出该值，则中止运行。                                                                                  |
| `maxStdoutBytes` | `512000`    | 如果捕获的 stdout 或 stderr 超过此大小，则中止运行。                                                        |
| `argsJson`       | -           | 工作流文件的参数 JSON 字符串（对内联流水线会被忽略）。                                                      |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` 接受 `token`（来自 `requiresApproval` 的完整恢复令牌）
或 `approvalId`（来自同一对象的短 ID），使用暂停的
运行返回的任一项即可。`approve` 为必填。

### 托管 Task Flow 模式

在 `run` 上传入 `flowControllerId` 和 `flowGoal`（或在
`resume` 上传入 `flowId` 和 `flowExpectedRevision`）会通过插件
运行时的托管 [Task Flow](/zh-CN/automation/taskflow) API 驱动该调用，而不是返回
裸信封：OpenClaw 会创建或恢复持久流程记录，将
Lobster 信封应用到它（审批时为 `waiting`，完成时为 `succeeded`/`failed`），
并返回 `{ ok, envelope, flow, mutation }`。此模式需要
绑定的 Task Flow 运行时，适用于需要在 Gateway 网关重启之间保留
持久流程状态的插件/控制器代码，而不是典型的临时 Agent 使用场景。

## 输出信封

Lobster 返回一个 JSON 信封，包含以下三种状态之一：

- `ok` - 成功完成
- `needs_approval` - 已暂停；`requiresApproval` 携带 `resumeToken` 和一个
  短 `approvalId`，二者任一都可恢复运行
- `cancelled` - 被显式拒绝或取消

该工具会同时在 `content`（美化 JSON）和 `details`
（原始对象）中暴露信封。

## 审批

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` - 恢复并继续副作用
- `approve: false` - 取消并完成工作流

使用 `approve --preview-from-stdin --limit N` 可将 JSON 预览附加到
审批请求，而无需自定义 jq/heredoc 粘合代码。恢复状态会存储为
Lobster 状态目录下的小型 JSON 文件（默认为 `~/.lobster/state`，
可用 `LOBSTER_STATE_DIR` 覆盖）；令牌本身只编码指向该状态的
指针，而不是完整流水线状态。

## OpenProse

OpenProse 与 Lobster 配合良好：使用 `/prose` 编排多 Agent
准备，然后运行 Lobster 流水线以实现确定性审批。如果 Prose
程序需要 Lobster，请通过 `tools.subagents.tools` 为子智能体允许
`lobster` 工具。请参阅 [OpenProse](/zh-CN/prose)。

## 安全

- **仅本地进程内** - 工作流在 Gateway 网关进程内执行；插件本身不会发起
  网络调用。
- **无密钥** - Lobster 不管理 OAuth；它会调用负责这些工作的 OpenClaw 工具。
- **感知沙箱** - 当工具上下文被沙箱隔离时禁用。
- **已加固** - 嵌入式运行器会强制执行超时和输出上限。

## 故障排查

| 错误                                                          | 原因 / 修复                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 流水线超过了 `timeoutMs`。增大该值或拆分流水线。                                |
| `lobster stdout exceeded maxStdoutBytes`（或 `stderr`）       | 捕获的输出超过了上限。提高 `maxStdoutBytes` 或减少输出。                        |
| `run --args-json must be valid JSON`                          | `argsJson`（工作流文件运行）解析失败。修复 JSON 字符串。                        |
| `lobster runtime failed`（或其他 `runtime_error` 消息）       | 嵌入式运行时返回了错误信封。查看 Gateway 网关日志了解详情。                     |

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例：一个“第二大脑”CLI + Lobster 流水线，用于管理三个
Markdown 知识库（个人、伴侣、共享）。CLI 会为统计信息、收件箱列表和过期扫描输出 JSON；Lobster 将这些命令串联成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和
`shared-task-sync` 等工作流，每个工作流都有审批门禁。可用时由 AI 处理判断
（分类），不可用时则回退到确定性规则。

- 线程：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化](/zh-CN/automation) - 所有自动化机制
- [工具概览](/zh-CN/tools) - 所有可用的 agent 工具
