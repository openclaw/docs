---
read_when:
    - 你需要工作流中的纯 JSON LLM 步骤
    - 你需要经过 schema 验证的 LLM 输出用于自动化
summary: 面向工作流的仅 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-07-05T11:47:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98856fd8ccf7181a89073cbaa939d9b303532f7fba612d7800e1b89a9d1b25ae
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一个内置的**可选插件工具**，会运行一次仅 JSON 的 LLM 调用，并返回结构化输出，也可以选择用 JSON Schema 进行验证。它让 Lobster 这样的工作流引擎获得一个 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

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

`alsoAllow` 会在活动工具配置文件之上添加 `llm-task`，而不会限制其他核心工具。只有在你想改用限制性允许列表模式时，才使用 `tools.allow`。

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是由 `provider/model` 字符串组成的允许列表；请求任何其他模型都会被拒绝。其他所有键都是按调用使用的回退值，在工具调用省略对应参数时使用。

## 工具参数

| 参数            | 类型   | 说明                                                                                                                                                   |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`        | string | 必需。给 LLM 的任务指令。                                                                                                                              |
| `input`         | any    | 可选载荷；会序列化为 JSON 并追加到提示词。                                                                                                             |
| `schema`        | object | 可选 JSON Schema，解析后的输出必须通过它验证。                                                                                                         |
| `provider`      | string | 覆盖 `defaultProvider` / agent 的默认提供商。                                                                                                          |
| `model`         | string | 覆盖 `defaultModel`；接受裸模型 ID、别名或 `provider/model` 引用（重复的提供商前缀会自动剥离）。                                                      |
| `thinking`      | string | 推理级别（例如 `low`、`medium`）；必须是解析后的模型支持的级别之一。                                                                                   |
| `authProfileId` | string | 覆盖 `defaultAuthProfileId`。                                                                                                                          |
| `temperature`   | number | 尽力而为；并非所有提供商都会遵循它。                                                                                                                   |
| `maxTokens`     | number | 对输出 token 数量的尽力而为上限。                                                                                                                      |
| `timeoutMs`     | number | 运行超时；默认值为 `30000`。                                                                                                                           |

## 输出

返回 `details.json`（已解析、通过 schema 验证的 JSON），以及用于说明实际运行内容的 `details.provider` 和 `details.model`。

## 示例：Lobster 工作流步骤

### 重要限制

下面的示例假设**独立 Lobster CLI** 运行在 `openclaw.invoke` 已经拥有正确 Gateway 网关 URL/身份验证上下文的位置。

对于 OpenClaw 内部内置的**嵌入式** Lobster 运行器，这种嵌套 CLI 模式**目前并不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 为此流程提供受支持的桥接之前，优先使用以下任一方式：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 使用不依赖嵌套 `openclaw.invoke` 调用的 Lobster 步骤。

独立 Lobster CLI 示例：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
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

## 安全说明

- **仅 JSON**：会指示模型只返回一个 JSON 值，不包含代码围栏，也不包含注释说明。
- **无工具**：底层运行会禁用工具，因此模型无法在任务中途向外调用。
- 除非你使用 `schema` 验证输出，否则应将输出视为不可信。
- 在任何会消耗此输出且有副作用的步骤（发送、发布、exec）之前放置审批。

## 相关内容

- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
- [斜杠命令](/zh-CN/tools/slash-commands)
