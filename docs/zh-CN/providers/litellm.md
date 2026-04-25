---
read_when:
    - 你想通过 LiteLLM 代理来路由 OpenClaw
    - 你需要通过 LiteLLM 实现成本跟踪、日志记录或模型路由
summary: 通过 LiteLLM Proxy 运行 OpenClaw，以实现统一的模型访问和成本跟踪
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:12:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) 是一个开源的 LLM 网关，为 100 多家模型提供商提供统一的 API。通过 LiteLLM 路由 OpenClaw，以获得集中式成本跟踪、日志记录，以及在不更改 OpenClaw 配置的情况下切换后端的灵活性。

<Tip>
**为什么将 LiteLLM 与 OpenClaw 搭配使用？**

- **成本跟踪** — 精确查看 OpenClaw 在所有模型上的花费
- **模型路由** — 无需更改配置，即可在 Claude、GPT-4、Gemini、Bedrock 之间切换
- **虚拟密钥** — 为 OpenClaw 创建带有支出限制的密钥
- **日志记录** — 完整的请求/响应日志，便于调试
- **故障回退** — 如果你的主要提供商宕机，则自动故障转移

</Tip>

## 快速开始

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快的方式完成可用的 LiteLLM 设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全控制安装和配置。

    <Steps>
      <Step title="启动 LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="将 OpenClaw 指向 LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        就这样。OpenClaw 现在会通过 LiteLLM 进行路由。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

### 环境变量

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 配置文件

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 高级配置

### 图像生成

LiteLLM 也可以通过与 OpenAI 兼容的 `/images/generations` 和 `/images/edits` 路由，为 `image_generate` 工具提供支持。在 `agents.defaults.imageGenerationModel` 下配置一个 LiteLLM 图像模型：

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

诸如 `http://localhost:4000` 这样的 loopback LiteLLM URL 无需全局私有网络覆盖即可工作。对于局域网上托管的代理，请设置 `models.providers.litellm.request.allowPrivateNetwork: true`，因为 API 密钥将被发送到配置的代理主机。

<AccordionGroup>
  <Accordion title="虚拟密钥">
    为 OpenClaw 创建一个带支出限制的专用密钥：

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    将生成的密钥用作 `LITELLM_API_KEY`。

  </Accordion>

  <Accordion title="模型路由">
    LiteLLM 可以将模型请求路由到不同的后端。在你的 LiteLLM `config.yaml` 中进行配置：

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw 会继续请求 `claude-opus-4-6` —— 路由由 LiteLLM 处理。

  </Accordion>

  <Accordion title="查看用量">
    检查 LiteLLM 的仪表板或 API：

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="代理行为说明">
    - LiteLLM 默认运行在 `http://localhost:4000`
    - OpenClaw 通过 LiteLLM 的代理式、与 OpenAI 兼容的 `/v1` 端点进行连接
    - 原生仅限 OpenAI 的请求整形不适用于通过 LiteLLM 的场景：没有 `service_tier`、没有 Responses `store`、没有提示缓存提示，也没有 OpenAI 推理兼容负载整形
    - 在自定义 LiteLLM base URL 上，不会注入隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）
  </Accordion>
</AccordionGroup>

<Note>
有关通用提供商配置和故障转移行为，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    LiteLLM 官方文档和 API 参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
</CardGroup>
