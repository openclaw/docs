---
read_when:
    - 你想让 OpenClaw 针对 antirez/ds4 运行
    - 你想要一个支持工具调用的本地 DeepSeek V4 Flash 后端
    - 你需要 ds4-server 的 OpenClaw 配置
summary: 通过 ds4（本地 DeepSeek V4 Flash OpenAI 兼容服务器）运行 OpenClaw
title: ds4
x-i18n:
    generated_at: "2026-06-27T03:03:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) 通过本地 Metal 后端提供 DeepSeek V4 Flash，并暴露 OpenAI 兼容的 `/v1` API。OpenClaw 通过通用 `openai-completions` 提供商系列连接到 ds4。

ds4 不是内置的 OpenClaw 提供商插件。请在 `models.providers.ds4` 下配置它，然后选择 `ds4/deepseek-v4-flash`。

- 提供商 ID：`ds4`
- 插件：无
- API：OpenAI 兼容的 Chat Completions（`openai-completions`）
- 建议的基础 URL：`http://127.0.0.1:18000/v1`
- 模型 ID：`deepseek-v4-flash`
- 工具调用：通过 OpenAI 风格的 `tools` 和 `tool_calls` 支持
- 推理：DeepSeek 风格的 `thinking` 和 `reasoning_effort`

## 要求

- 支持 Metal 的 macOS。
- 可用的 ds4 checkout，包含 `ds4-server` 和 DeepSeek V4 Flash GGUF 文件。
- 足够支撑你选择的上下文的内存。更大的 `--ctx` 值会在服务器启动时分配更多 KV 内存。

<Warning>
OpenClaw 智能体轮次包含工具 schema 和工作区上下文。像 `--ctx 4096` 这样很小的上下文可能通过直接 curl 测试，但在完整智能体运行中失败，并出现 `500 prompt exceeds context`。智能体和工具冒烟测试至少使用 `--ctx 32768`。只有在你有足够内存并且想要 ds4 Think Max 行为时，才使用 `--ctx 393216`。
</Warning>

## 快速开始

<Steps>
  <Step title="Start ds4-server">
    将 `<DS4_DIR>` 替换为你的 ds4 checkout 路径。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    响应应包含 `deepseek-v4-flash`。

  </Step>
  <Step title="Add the OpenClaw provider config">
    添加[完整配置](#full-config)中的配置，然后运行一次性模型检查：

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## 完整配置

当 ds4 已在 `127.0.0.1:18000` 上运行时，使用此配置。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

保持 `contextWindow` 与 `ds4-server --ctx` 值一致。保持 `maxTokens` 与 `--tokens` 一致，除非你有意让 OpenClaw 请求少于服务器默认值的输出。

## 按需启动

OpenClaw 可以只在选择 `ds4/...` 模型时启动 ds4。向同一个提供商条目添加 `localService`：

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` 必须是绝对可执行文件路径。不会使用 shell 查找和 `~` 展开。每个 `localService` 字段请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。

## Think Max

ds4 仅在两个条件都为真时应用 Think Max：

- `ds4-server` 以 `--ctx 393216` 或更高值启动。
- 请求使用 `reasoning_effort: "max"` 或等效的 ds4 effort 字段。

如果你运行这么大的上下文，请同时更新服务器标志和 OpenClaw 模型元数据：

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## 测试

从直接 HTTP 检查开始：

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

然后测试 OpenClaw 模型路由：

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

对于完整智能体和工具调用冒烟测试，请使用至少 32768 的上下文：

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

预期结果：

- `executionTrace.winnerProvider` 为 `ds4`
- `executionTrace.winnerModel` 为 `deepseek-v4-flash`
- `toolSummary.calls` 至少为 `1`
- `finalAssistantVisibleText` 以 `tool-ok` 开头

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 未运行，或未绑定到 `baseUrl` 中的主机和端口。启动 `ds4-server`，然后重试：

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    配置的 `--ctx` 对 OpenClaw 轮次来说太小。提高 `ds4-server --ctx`，然后更新 `models.providers.ds4.models[].contextWindow` 以保持匹配。带工具的完整智能体轮次所需上下文明显多于直接的单消息 curl 请求。
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 只有在 `--ctx` 至少为 `393216` 且请求要求 `reasoning_effort: "max"` 时才使用 Think Max。较小的上下文会回退到高推理。
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 有冷启动的 Metal 驻留和模型预热阶段。当 OpenClaw 按需启动服务器时，请使用 `localService.readyTimeoutMs: 300000`。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Local model services" href="/zh-CN/gateway/local-model-services" icon="play">
    在模型请求前按需启动本地模型服务器。
  </Card>
  <Card title="Local models" href="/zh-CN/gateway/local-models" icon="server">
    选择并运行本地模型后端。
  </Card>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    配置提供商引用、凭证和故障转移。
  </Card>
  <Card title="DeepSeek" href="/zh-CN/providers/deepseek" icon="brain">
    原生 DeepSeek 提供商行为和思考控制。
  </Card>
</CardGroup>
