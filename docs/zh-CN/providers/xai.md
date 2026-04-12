---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 的凭证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-12T11:08:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。

## 入门指南

<Steps>
  <Step title="创建 API 密钥">
    在 [xAI 控制台](https://console.x.ai/) 中创建一个 API 密钥。
  </Step>
  <Step title="设置你的 API 密钥">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择一个模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输方式。同一个
`XAI_API_KEY` 也可用于由 Grok 支持的 `web_search`、原生
`x_search` 以及远程 `code_execution`。
如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置的 xAI 模型提供商也会回退复用该密钥。
`code_execution` 调优配置位于 `plugins.entries.xai.config.codeExecution`。
</Note>

## 内置模型目录

OpenClaw 默认包含以下 xAI 模型家族：

| 家族 | 模型 ID |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

当较新的 `grok-4*` 和 `grok-code-fast*` ID
遵循相同的 API 形态时，该插件也会将其转发解析。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 以及 `grok-4.20-beta-*` 变体，
是当前内置目录中支持图像能力的 Grok 引用。
</Tip>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会将原生 xAI 请求重写如下：

| 源模型 | 快速模式目标 |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### 旧版兼容别名

旧版别名仍会规范化为标准内置 ID：

| 旧版别名 | 标准 ID |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成功能。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文生视频、图生视频，以及远程视频编辑/扩展流程
    - 支持 `aspectRatio` 和 `resolution`

    <Warning>
    不接受本地视频缓冲区。请为视频参考和编辑输入使用远程 `http(s)` URL。
    </Warning>

    要将 xAI 用作默认视频提供商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    请参阅 [视频生成](/zh-CN/tools/video-generation) 以了解共享工具参数、
    提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，
    用于通过 Grok 搜索 X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键名 | 类型 | 默认值 | 描述 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled` | boolean | — | 启用或禁用 x_search |
    | `model` | string | `grok-4-1-fast` | 用于 x_search 请求的模型 |
    | `inlineCitations` | boolean | — | 在结果中包含内联引用 |
    | `maxTurns` | number | — | 最大对话轮数 |
    | `timeoutSeconds` | number | — | 请求超时时间（秒） |
    | `cacheTtlMinutes` | number | — | 缓存存活时间（分钟） |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="code_execution 配置">
    内置 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，
    用于在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键名 | 类型 | 默认值 | 描述 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true`（如果密钥可用） | 启用或禁用代码执行 |
    | `model` | string | `grok-4-1-fast` | 用于代码执行请求的模型 |
    | `maxTurns` | number | — | 最大对话轮数 |
    | `timeoutSeconds` | number | — | 请求超时时间（秒） |

    <Note>
    这是远程 xAI 沙箱执行，不是本地 [`exec`](/zh-CN/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - 当前仅支持 API 密钥凭证。OpenClaw 还不支持 xAI OAuth 或设备码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 在常规 xAI 提供商路径上不受支持，
      因为它所需的上游 API 接口不同于标准 OpenClaw xAI 传输方式。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 特定的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false`
      可禁用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求前，移除不受支持的严格工具 schema 标志和推理载荷键。
    - `web_search`、`x_search` 和 `code_execution` 会作为 OpenClaw
      工具公开。OpenClaw 会在每个工具请求内启用所需的特定 xAI 内置能力，
      而不是在每次聊天轮次中附加所有原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI 插件负责，
      而不是硬编码在核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="所有提供商" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的提供商概览。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
