---
read_when:
    - 你想通过 LiteLLM 代理路由 OpenClaw
    - 你需要通过 LiteLLM 进行成本跟踪、日志或模型路由
summary: 通过 LiteLLM Proxy 运行 OpenClaw，以实现统一的模型访问和成本跟踪
title: LiteLLM
x-i18n:
    generated_at: "2026-07-05T11:36:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) 是一个开源 LLM 网关，提供统一 API，可连接 100 多个模型
提供商。通过 LiteLLM 路由 OpenClaw，无需更改 OpenClaw 配置，即可集中跟踪成本、记录日志、使用带
支出限制的虚拟密钥，并实现后端故障转移。

## 快速开始

<Tabs>
  <Tab title="新手引导（推荐）">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    对远程代理进行非交互式设置时，请显式传入代理 URL：

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="手动设置">
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

LiteLLM 可以通过 OpenAI 兼容的 `/images/generations` 和
`/images/edits` 路由支持 `image_generate` 工具。默认图像模型为 `gpt-image-2`；可在
`agents.defaults.imageGenerationModel` 下配置其他模型：

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

Loopback LiteLLM URL（`http://localhost:4000`、`127.0.0.1`、`::1`、`host.docker.internal`）无需全局私有网络覆盖即可工作。对于托管在 LAN 上的代理，请设置
`models.providers.litellm.request.allowPrivateNetwork: true`，因为 API 密钥会发送到该主机。

## 高级

<AccordionGroup>
  <Accordion title="虚拟密钥">
    为 OpenClaw 创建带支出限制的专用密钥：

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
    LiteLLM 可以将模型请求路由到不同后端。在你的 LiteLLM `config.yaml` 中配置：

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

    OpenClaw 会继续请求 `claude-opus-4-6`；LiteLLM 负责处理路由。

  </Accordion>

  <Accordion title="查看用量">
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
    - LiteLLM 默认运行在 `http://localhost:4000`。
    - OpenClaw 通过 LiteLLM 的代理式 OpenAI 兼容 `/v1` 端点连接。
    - 通过已配置的 LiteLLM base URL 时，不会应用仅原生 OpenAI 的请求整形：
      没有 `service_tier`、没有 Responses `store`、没有提示缓存提示，也没有 OpenAI 推理强度
      payload 整形。
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）只会发送到
      已验证的原生 OpenAI 端点，因此不会注入到自定义 LiteLLM base URL。
  </Accordion>
</AccordionGroup>

<Note>
有关通用提供商配置和故障转移行为，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="LiteLLM 文档" href="https://docs.litellm.ai" icon="book">
    官方 LiteLLM 文档和 API 参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
  <Card title="Models" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
</CardGroup>
