---
read_when:
    - 你希望通过 LiteLLM 代理路由 OpenClaw
    - 你需要通过 LiteLLM 实现成本跟踪、日志记录或模型路由
summary: 通过 LiteLLM Proxy 运行 OpenClaw，实现统一的模型访问和成本跟踪
title: LiteLLM
x-i18n:
    generated_at: "2026-07-11T20:53:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) 是一个开源 LLM 网关，通过统一 API 支持 100 多个模型提供商。通过 LiteLLM 路由 OpenClaw，无需更改 OpenClaw 配置，即可实现集中式成本跟踪、日志记录、设有支出限额的虚拟密钥以及后端故障转移。

## 快速开始

<Tabs>
  <Tab title="新手引导（推荐）">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    如需针对远程代理进行非交互式设置，请显式传入代理 URL：

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="手动设置">
    <Steps>
      <Step title="启动 LiteLLM 代理">
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
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 配置

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

新手引导写入的默认模型是 `litellm/claude-opus-4-6`。

## 图像生成

LiteLLM 可以通过与 OpenAI 兼容的 `/images/generations` 和 `/images/edits` 路由为 `image_generate` 工具提供后端支持。默认图像模型是 `gpt-image-2`；如需使用其他模型，请在 `agents.defaults.imageGenerationModel` 下进行配置：

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

回环 LiteLLM URL（`http://localhost:4000`、`127.0.0.1`、`::1`、`host.docker.internal`）无需全局私有网络覆盖设置即可使用。对于托管在局域网中的代理，请设置 `models.providers.litellm.request.allowPrivateNetwork: true`，因为 API 密钥会发送到该主机。

## 高级功能

<AccordionGroup>
  <Accordion title="虚拟密钥">
    为 OpenClaw 创建一个设有支出限额的专用密钥：

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
    LiteLLM 可以将模型请求路由到不同的后端。请在 LiteLLM 的 `config.yaml` 中配置：

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

    OpenClaw 会继续请求 `claude-opus-4-6`，由 LiteLLM 处理路由。

  </Accordion>

  <Accordion title="查看用量">
    ```bash
    # 密钥信息
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 支出日志
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="代理行为说明">
    - LiteLLM 默认运行于 `http://localhost:4000`。
    - OpenClaw 通过 LiteLLM 代理式、与 OpenAI 兼容的 `/v1` 端点进行连接。
    - 仅适用于原生 OpenAI 的请求构造不适用于已配置的 LiteLLM 基础 URL：不会设置 `service_tier`、Responses `store`、提示词缓存提示，也不会对 OpenAI 推理强度有效载荷进行构造。
    - OpenClaw 的隐藏归因请求头（`originator`、`version`、`User-Agent`）只会发送到已验证的原生 OpenAI 端点，因此不会注入自定义 LiteLLM 基础 URL 的请求中。
  </Accordion>
</AccordionGroup>

<Note>
有关通用提供商配置和故障转移行为，请参阅[模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="LiteLLM 文档" href="https://docs.litellm.ai" icon="book">
    LiteLLM 官方文档和 API 参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考。
  </Card>
  <Card title="Models" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
</CardGroup>
