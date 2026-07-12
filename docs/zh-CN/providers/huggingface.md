---
read_when:
    - 你想在 OpenClaw 中使用 Hugging Face Inference
    - 你需要设置 HF 令牌环境变量，或选择 CLI 身份验证方式
summary: Hugging Face Inference 设置（身份验证 + 模型选择）
title: Hugging Face（推理）
x-i18n:
    generated_at: "2026-07-11T20:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) 使用一个令牌，为众多托管模型（DeepSeek、Llama 等）提供兼容 OpenAI 的聊天补全路由器。OpenClaw **仅使用聊天补全端点**；对于文生图、嵌入或语音，请直接使用 [HF 推理客户端](https://huggingface.co/docs/api-inference/quicktour)。

| 属性         | 值                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 提供商 ID    | `huggingface`                                                                                                               |
| 插件         | 内置（默认启用，无需安装）                                                                                                  |
| 身份验证环境变量 | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（细粒度令牌）                                                                      |
| API          | 兼容 OpenAI（`https://router.huggingface.co/v1`）                                                                           |
| 计费         | 使用单个 HF 令牌；[定价](https://huggingface.co/docs/inference-providers/pricing)遵循提供商费率，并提供免费额度              |

## 入门指南

<Steps>
  <Step title="Create a fine-grained token">
    前往 [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，创建一个新的细粒度令牌。

    <Warning>
    令牌必须启用 **Make calls to Inference Providers** 权限，否则 API 请求将被拒绝。
    </Warning>

  </Step>
  <Step title="Run onboarding">
    在提供商下拉列表中选择 **Hugging Face**，然后在提示时输入你的 API 密钥：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    在 **默认 Hugging Face 模型**下拉列表中选择一个模型。当令牌有效时，该列表会从推理 API 加载；否则，OpenClaw 会显示下方的内置目录。你的选择会保存为 `agents.defaults.model.primary`：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

将 `huggingface/deepseek-ai/DeepSeek-R1` 设置为默认模型。

## 模型 ID

模型引用采用 `huggingface/<org>/<model>` 格式（Hub 风格的 ID）。OpenClaw 的内置目录如下：

| 模型                         | 引用（添加 `huggingface/` 前缀）          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
当令牌有效时，OpenClaw 还会在新手引导和 Gateway 网关启动时，通过 **GET** `https://router.huggingface.co/v1/models` 发现其他所有模型，因此你的目录可以包含远不止上述四个模型。你可以在任何模型 ID 后附加 `:fastest` 或 `:cheapest`；HF 路由器会将请求路由到匹配的推理提供商。请在 [Inference Provider settings](https://hf.co/settings/inference-providers) 中设置默认的提供商顺序。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw 使用以下请求发现模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    响应采用 OpenAI 风格：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    配置密钥后（通过新手引导、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`），交互式设置期间的**默认 Hugging Face 模型**下拉列表将由此端点填充。Gateway 网关启动时会重复执行相同调用，以刷新目录。发现的模型会与上述内置目录合并（当 ID 匹配时，内置目录用于提供上下文窗口和成本等元数据）。如果请求失败、未返回数据或未设置密钥，OpenClaw 将仅回退到内置目录。

    无需移除提供商即可禁用发现功能：

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **来自 API 的名称：**发现的模型会优先使用 API 提供的 `name`、`title` 或 `display_name`；否则，OpenClaw 会根据模型 ID 推导名称（例如，`deepseek-ai/DeepSeek-R1` 会变为“DeepSeek R1”）。
    - **覆盖显示名称：**在配置中为每个模型设置自定义标签：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **策略后缀：**`:fastest` 和 `:cheapest` 是 HF 路由器约定，并非由 OpenClaw 重写：后缀会作为模型 ID 的一部分原样发送，由 HF 路由器选择匹配的推理提供商。如果你希望为每个后缀设置不同的别名，请在 `models.providers.huggingface.models` 下将每个变体添加为单独条目（或在 `model.primary` 中设置）。
    - **配置合并：**配置合并时会保留 `models.providers.huggingface.models` 中的现有条目（例如 `models.json` 中的条目），因此你在其中设置的任何自定义 `name`、`alias` 或模型选项都会在重启后继续保留。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保该进程可以访问 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（例如，在 `~/.openclaw/.env` 中设置，或通过 `env.shellEnv` 提供）。

    <Note>
    OpenClaw 同时接受 `HUGGINGFACE_HUB_TOKEN` 和 `HF_TOKEN`。如果两者都已设置，则优先使用 `HUGGINGFACE_HUB_TOKEN`。
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Hugging Face Inference Providers 官方文档。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
