---
read_when:
    - 你想让 OpenClaw 连接本地 inferrs 服务器运行
    - 你正在通过 inferrs 提供 Gemma 或其他模型服务
    - 你需要用于 inferrs 的确切 OpenClaw 兼容性标志
summary: 通过 inferrs 运行 OpenClaw（OpenAI 兼容的本地服务器）
title: 推断
x-i18n:
    generated_at: "2026-05-06T00:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) 可以通过兼容 OpenAI 的 `/v1` API 提供本地模型。OpenClaw 通过通用的 `openai-completions` 路径使用 `inferrs`。

| 属性               | 值                                                                 |
| ------------------ | ------------------------------------------------------------------ |
| 提供商 ID          | `inferrs`（自定义；在 `models.providers.inferrs` 下配置）          |
| 插件               | 无 — `inferrs` 不是内置的 OpenClaw 提供商插件                      |
| 身份验证环境变量   | 可选。如果你的 inferrs 服务器没有身份验证，任意值都可以             |
| API                | 兼容 OpenAI（`openai-completions`）                                |
| 建议的基础 URL     | `http://127.0.0.1:8080/v1`（或你的 inferrs 服务器所在位置）         |

<Note>
  目前最好将 `inferrs` 视为自托管的自定义 OpenAI 兼容后端，而不是专用的 OpenClaw 提供商插件。你通过 `models.providers.inferrs` 配置它，而不是通过新手引导选择标志。如果你需要真正内置且带自动发现的插件，请参阅 [SGLang](/zh-CN/providers/sglang) 或 [vLLM](/zh-CN/providers/vllm)。
</Note>

## 入门指南

<Steps>
  <Step title="使用模型启动 inferrs">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="验证服务器可访问">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="添加 OpenClaw 提供商条目">
    添加一个显式提供商条目，并将你的默认模型指向它。请参阅下面的完整配置示例。
  </Step>
</Steps>

## 完整配置示例

此示例在本地 `inferrs` 服务器上使用 Gemma 4。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="为什么 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由只接受字符串
    `messages[].content`，不接受结构化的内容片段数组。

    <Warning>
    如果 OpenClaw 运行失败并显示如下错误：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    请在你的模型条目中设置 `compat.requiresStringContent: true`。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw 会在发送请求前，将纯文本内容片段展平为普通字符串。

  </Accordion>

  <Accordion title="Gemma 和工具 schema 注意事项">
    某些当前的 `inferrs` + Gemma 组合可以接受小型直接
    `/v1/chat/completions` 请求，但仍会在完整的 OpenClaw 智能体运行时
    轮次中失败。

    如果发生这种情况，请先尝试：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    这会为该模型禁用 OpenClaw 的工具 schema 接口面，并且可以降低更严格本地后端上的提示词压力。

    如果很小的直接请求仍然可用，但普通 OpenClaw 智能体轮次继续在
    `inferrs` 内崩溃，剩余问题通常是上游模型/服务器
    行为，而不是 OpenClaw 的传输层。

  </Accordion>

  <Accordion title="手动冒烟测试">
    配置完成后，测试这两层：

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    如果第一条命令可用但第二条失败，请查看下面的故障排除部分。

  </Accordion>

  <Accordion title="代理风格行为">
    `inferrs` 被视为代理风格的 OpenAI 兼容 `/v1` 后端，而不是
    原生 OpenAI 端点。

    - 仅适用于原生 OpenAI 的请求整形不会在这里应用
    - 没有 `service_tier`、没有 Responses `store`、没有提示词缓存提示，也没有
      OpenAI reasoning 兼容载荷整形
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
      不会注入到自定义 `inferrs` 基础 URL 上

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models 失败">
    `inferrs` 未运行、不可访问，或未绑定到预期的
    主机/端口。请确保服务器已启动，并正在你配置的地址上监听。
  </Accordion>

  <Accordion title="messages[].content 预期为字符串">
    在模型条目中设置 `compat.requiresStringContent: true`。详见上面的
    `requiresStringContent` 部分。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 调用通过，但 openclaw infer model run 失败">
    尝试设置 `compat.supportsTools: false` 来禁用工具 schema 接口面。
    请参阅上面的 Gemma 工具 schema 注意事项。
  </Accordion>

  <Accordion title="inferrs 在更大的智能体轮次中仍然崩溃">
    如果 OpenClaw 不再收到 schema 错误，但 `inferrs` 在更大的
    智能体轮次中仍然崩溃，请将其视为上游 `inferrs` 或模型限制。降低
    提示词压力，或切换到其他本地后端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需一般帮助，请参阅[故障排除](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    将 OpenClaw 连接到本地模型服务器运行。
  </Card>
  <Card title="Gateway 网关故障排除" href="/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    调试直接探测通过但智能体运行失败的本地 OpenAI 兼容后端。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为概览。
  </Card>
</CardGroup>
