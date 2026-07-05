---
read_when:
    - 你想将 OpenClaw 连接到本地 inferrs 服务器
    - 你正在通过 inferrs 提供 Gemma 或其他模型
    - 你需要 inferrs 的确切 OpenClaw 兼容性标志
summary: 通过 inferrs（OpenAI 兼容的本地服务器）运行 OpenClaw
title: 推断
x-i18n:
    generated_at: "2026-07-05T11:36:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) 在兼容 OpenAI 的 `/v1` API 后面提供本地模型。OpenClaw 通过通用的 `openai-completions` 适配器与它通信。

| 属性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供商 ID          | `inferrs`（自定义；在 `models.providers.inferrs` 下配置）            |
| 插件               | 无 — 不是内置的 OpenClaw 提供商插件                                  |
| 认证环境变量       | 不需要；如果你的 inferrs 服务器没有认证，任何值都可以                |
| API                | 兼容 OpenAI（`openai-completions`）                                  |
| 建议基础 URL       | `http://127.0.0.1:8080/v1`（或你的 inferrs 服务器监听的任何位置）    |

<Note>
  `inferrs` 是自托管的自定义兼容 OpenAI 后端，不是专用的 OpenClaw 提供商插件：你需要在 `models.providers.inferrs` 下配置它，而不是选择新手引导认证选项。如需带自动发现的内置插件，请参阅 [SGLang](/zh-CN/providers/sglang) 或 [vLLM](/zh-CN/providers/vllm)。
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
    添加一个显式提供商条目，并将你的默认模型指向它。请参阅下面的配置示例。
  </Step>
</Steps>

## 完整配置示例

本地 `inferrs` 服务器上的 Gemma 4：

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

## 按需启动

只有在选择 `inferrs/...` 模型时，OpenClaw 才能自行启动 `inferrs`。将 `localService` 添加到同一个提供商条目中：

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
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

`command` 必须是绝对路径。在 Gateway 网关主机上运行 `which inferrs` 并使用该路径。完整字段参考：[本地模型服务](/zh-CN/gateway/local-model-services)。

## 高级配置

<AccordionGroup>
  <Accordion title="为什么 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由只接受字符串形式的 `messages[].content`，不接受结构化内容片段数组。

    <Warning>
    如果 OpenClaw 运行失败并显示：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    请在模型条目中设置 `compat.requiresStringContent: true`。随后 OpenClaw 会在发送请求前，将纯文本内容片段展平为普通字符串。
    </Warning>

  </Accordion>

  <Accordion title="Gemma 和工具 schema 注意事项">
    某些 `inferrs` + Gemma 组合可以接受小型直接 `/v1/chat/completions` 请求，但会在完整的 OpenClaw agent-runtime 轮次中失败。请先尝试禁用工具 schema 表面：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    这会降低对更严格本地后端的提示词压力。如果很小的直接请求仍然可用，但普通 OpenClaw agent 轮次持续在 `inferrs` 内部崩溃，请将其视为上游模型/服务器限制，而不是 OpenClaw 传输问题。

  </Accordion>

  <Accordion title="手动冒烟测试">
    配置完成后测试两层：

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

    如果第一个命令可用但第二个失败，请参阅下面的故障排查。

  </Accordion>

  <Accordion title="代理式行为">
    因为 `inferrs` 使用通用 `openai-completions` 适配器（而不是 `openai-responses`），所以仅原生 OpenAI 可用的请求整形永远不会应用：不会发送 `service_tier`、Responses `store`、提示词缓存提示，也不会发送 OpenAI reasoning-compat 载荷整形。
  </Accordion>
</AccordionGroup>

## 故障排查

<AccordionGroup>
  <Accordion title="curl /v1/models 失败">
    `inferrs` 未运行、不可访问，或没有绑定到你配置的主机/端口。确认服务器已启动并在该地址上监听。
  </Accordion>

  <Accordion title="messages[].content 预期为字符串">
    在模型条目中设置 `compat.requiresStringContent: true`（见上文）。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 调用通过，但 openclaw infer model run 失败">
    设置 `compat.supportsTools: false` 以禁用工具 schema 表面（参见上面的 Gemma 注意事项）。
  </Accordion>

  <Accordion title="inferrs 在较大的 agent 轮次中仍然崩溃">
    如果 schema 错误已经消失，但 `inferrs` 仍然在较大的 agent 轮次中崩溃，请将其视为上游 `inferrs` 或模型限制。降低提示词压力，或切换后端/模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需常规帮助，请参阅[故障排查](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    针对本地模型服务器运行 OpenClaw。
  </Card>
  <Card title="本地模型服务" href="/zh-CN/gateway/local-model-services" icon="play">
    为已配置的提供商按需启动本地模型服务器。
  </Card>
  <Card title="Gateway 网关故障排查" href="/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    调试通过探测但 agent 运行失败的本地兼容 OpenAI 后端。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
</CardGroup>
