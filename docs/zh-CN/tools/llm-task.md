---
read_when:
    - 你希望在工作流中加入一个仅输出 JSON 的 LLM 步骤
    - 你需要为自动化获取经过模式验证的 LLM 输出
summary: 用于工作流的纯 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-07-12T14:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一个内置的**可选插件工具**，它运行一次仅返回 JSON 的
LLM 调用并返回结构化输出，还可选择根据 JSON Schema 进行验证。它让 Lobster 等工作流引擎无需为每个工作流编写自定义
OpenClaw 代码，即可添加 LLM 步骤。

## 启用

1. 启用插件：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 允许该工具：

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` 会在当前工具配置之上添加 `llm-task`，而不会
限制其他核心工具。仅当你需要限制性的
允许列表模式时，才改用 `tools.allow`。

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是由 `provider/model` 字符串组成的允许列表；任何请求
其他模型的调用都会被拒绝。其他所有键都是逐次调用的回退值，在
工具调用省略相应参数时使用。

## 工具参数

| 参数            | 类型   | 说明                                                                                                                                                 |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必需。提供给 LLM 的任务指令。                                                                                                                        |
| `input`         | any    | 可选负载；序列化为 JSON 并附加到提示词中。                                                                                                          |
| `schema`        | object | 可选的 JSON Schema，解析后的输出必须通过其验证。                                                                                                     |
| `provider`      | string | 覆盖 `defaultProvider` / 智能体的默认提供商。                                                                                                        |
| `model`         | string | 覆盖 `defaultModel`；接受裸模型 ID、别名或 `provider/model` 引用（重复的提供商前缀会被自动移除）。                                                    |
| `thinking`      | string | 推理级别（例如 `low`、`medium`）；必须是解析出的模型支持的级别。                                                                                     |
| `authProfileId` | string | 覆盖 `defaultAuthProfileId`。                                                                                                                        |
| `temperature`   | number | 尽力支持；并非所有提供商都会采用此参数。                                                                                                             |
| `maxTokens`     | number | 输出 token 数量的尽力限制。                                                                                                                          |
| `timeoutMs`     | number | 运行超时时间；默认值为 `30000`。                                                                                                                     |

## 输出

返回 `details.json`（已解析并通过 schema 验证的 JSON），以及用于说明
实际运行所用提供商和模型的 `details.provider` 和 `details.model`。

## 示例：Lobster 工作流步骤

### 重要限制

以下示例假定**独立版 Lobster CLI** 在
`openclaw.invoke` 已具有正确 Gateway 网关 URL/身份验证上下文的环境中运行。

对于 OpenClaw 内置的**嵌入式** Lobster 运行器，这种嵌套 CLI
模式**目前并不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 为此流程提供受支持的桥接机制之前，请优先选择：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 使用不依赖嵌套 `openclaw.invoke` 调用的 Lobster 步骤。

独立版 Lobster CLI 示例：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "根据输入的电子邮件，返回意图和回复草稿。",
  "thinking": "low",
  "input": {
    "subject": "你好",
    "body": "你能帮忙吗？"
  },
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

## 安全注意事项

- **仅限 JSON**：模型会收到仅返回 JSON 值的指令，不包含代码
  围栏，也不包含说明。
- **无工具**：底层运行已禁用工具，因此模型无法在
  任务执行过程中调用外部工具。
- 除非使用 `schema` 验证输出，否则应将其视为不可信内容。
- 在任何使用此输出且会产生副作用的步骤（发送、发布、执行）之前
  安排审批。

## 相关内容

- [推理级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
- [斜杠命令](/zh-CN/tools/slash-commands)
