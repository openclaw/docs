---
read_when:
    - 你希望在工作流中加入仅输出 JSON 的 LLM 步骤
    - 你需要经过架构验证的 LLM 输出以实现自动化
summary: 用于工作流的纯 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-07-11T20:59:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一个内置的**可选插件工具**，它会执行一次仅返回 JSON 的 LLM 调用并返回结构化输出，还可选择根据 JSON Schema 验证输出。它为 Lobster 等工作流引擎提供 LLM 步骤，无需为每个工作流编写自定义 OpenClaw 代码。

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

2. 允许使用该工具：

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` 会在当前工具配置文件的基础上添加 `llm-task`，而不会限制其他核心工具。仅当你希望使用限制性允许列表模式时，才改用 `tools.allow`。

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

`allowedModels` 是由 `provider/model` 字符串组成的允许列表；对任何其他模型的请求都会被拒绝。其他所有键都是单次调用的回退值，在工具调用省略相应参数时使用。

## 工具参数

| 参数            | 类型   | 说明                                                                                                                                                    |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必填。提供给 LLM 的任务指令。                                                                                                                           |
| `input`         | any    | 可选载荷；序列化为 JSON 后追加到提示词。                                                                                                                |
| `schema`        | object | 可选 JSON Schema，解析后的输出必须通过其验证。                                                                                                          |
| `provider`      | string | 覆盖 `defaultProvider` / 智能体的默认提供商。                                                                                                           |
| `model`         | string | 覆盖 `defaultModel`；接受裸模型 ID、别名或 `provider/model` 引用（重复的提供商前缀会被自动移除）。                                                       |
| `thinking`      | string | 推理级别（例如 `low`、`medium`）；必须是解析后模型支持的级别。                                                                                          |
| `authProfileId` | string | 覆盖 `defaultAuthProfileId`。                                                                                                                           |
| `temperature`   | number | 尽力应用；并非所有提供商都会遵循此参数。                                                                                                                |
| `maxTokens`     | number | 输出 token 数量的尽力上限。                                                                                                                             |
| `timeoutMs`     | number | 运行超时时间；默认值为 `30000`。                                                                                                                       |

## 输出

返回 `details.json`（已解析并通过 Schema 验证的 JSON），以及用于指明实际运行提供商和模型的 `details.provider` 与 `details.model`。

## 示例：Lobster 工作流步骤

### 重要限制

下面的示例假定**独立版 Lobster CLI** 正在某个已为 `openclaw.invoke` 配置正确 Gateway 网关 URL 和身份验证上下文的环境中运行。

对于 OpenClaw 内置的**嵌入式** Lobster 运行器，这种嵌套 CLI 模式**目前并不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 为此流程提供受支持的桥接机制之前，请优先使用以下任一方式：

- 在 Lobster 外部直接调用 `llm-task` 工具，或
- 使用不依赖嵌套 `openclaw.invoke` 调用的 Lobster 步骤。

独立版 Lobster CLI 示例：

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

## 安全注意事项

- **仅限 JSON**：模型会收到只返回一个 JSON 值的指令，不得包含代码围栏或说明文字。
- **无工具**：底层运行已禁用工具，因此模型无法在任务执行过程中调用外部工具。
- 除非使用 `schema` 验证输出，否则应将其视为不可信内容。
- 在任何使用此输出且会产生副作用的步骤（发送、发布、执行）之前加入审批。

## 相关内容

- [推理级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
- [斜杠命令](/zh-CN/tools/slash-commands)
