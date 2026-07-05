---
read_when:
    - 你想要将 Hugging Face Inference 与 OpenClaw 搭配使用
    - 你需要 HF 令牌环境变量或 CLI 凭证选项
summary: Hugging Face Inference 设置（凭证 + 模型选择）
title: Hugging Face（推理）
x-i18n:
    generated_at: "2026-07-05T11:36:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) 在许多托管模型（DeepSeek、Llama 等）前提供一个兼容 OpenAI 的聊天补全路由器，并使用同一个 token。OpenClaw **仅使用聊天补全端点**；如需文本生成图像、嵌入或语音，请直接使用 [HF inference clients](https://huggingface.co/docs/api-inference/quicktour)。

| 属性         | 值                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 提供商 id    | `huggingface`                                                                                                               |
| 插件         | 内置（默认启用，无需安装步骤）                                                                                              |
| 凭证环境变量 | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（精细粒度 token）                                                                      |
| API          | 兼容 OpenAI（`https://router.huggingface.co/v1`）                                                                           |
| 计费         | 单个 HF token；[定价](https://huggingface.co/docs/inference-providers/pricing) 按提供商费率执行，并提供免费套餐             |

## 入门指南

<Steps>
  <Step title="Create a fine-grained token">
    前往 [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)，创建一个新的精细粒度 token。

    <Warning>
    token 必须启用 **Make calls to Inference Providers** 权限，否则 API 请求会被拒绝。
    </Warning>

  </Step>
  <Step title="Run onboarding">
    在提供商下拉菜单中选择 **Hugging Face**，然后在提示时输入你的 API key：

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    在 **Default Hugging Face model** 下拉菜单中选择一个模型。当你的 token 有效时，该列表会从 Inference API 加载；否则 OpenClaw 会显示下面的内置目录。你的选择会保存为 `agents.defaults.model.primary`：

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

将 `huggingface/deepseek-ai/DeepSeek-R1` 设为默认模型。

## 模型 ID

模型 ref 使用 `huggingface/<org>/<model>` 形式（Hub 风格 ID）。OpenClaw 的内置目录：

| 模型                         | Ref（前缀为 `huggingface/`）            |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
当你的 token 有效时，OpenClaw 还会在新手引导期间和 Gateway 网关启动时，从 **GET** `https://router.huggingface.co/v1/models` 发现任何其他模型，因此你的目录可以包含远超上述四个模型的内容。你可以在任何模型 id 后追加 `:fastest` 或 `:cheapest`；HF 的路由器会路由到匹配的推理提供商。在 [Inference Provider 设置](https://hf.co/settings/inference-providers)中设置你的默认提供商顺序。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw 使用以下方式发现模型：

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    响应采用 OpenAI 风格：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    配置了 key（新手引导、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`）后，交互式设置期间的 **Default Hugging Face model** 下拉菜单会由该端点填充。Gateway 网关启动时会重复同一个调用来刷新目录。发现的模型会与上面的内置目录合并（当 id 匹配时，用于上下文窗口和成本等元数据）。如果请求失败、未返回数据，或未设置 key，OpenClaw 只会回退到内置目录。

    在不移除提供商的情况下禁用发现：

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **来自 API 的名称：** 发现的模型在存在时会使用 API 的 `name`、`title` 或 `display_name`；否则 OpenClaw 会从模型 id 派生名称（例如 `deepseek-ai/DeepSeek-R1` 会变为 “DeepSeek R1”）。
    - **覆盖显示名称：** 在配置中为每个模型设置自定义标签：

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

    - **策略后缀：** `:fastest` 和 `:cheapest` 是 HF 路由器约定，而不是 OpenClaw 会改写的内容：该后缀会作为模型 id 的一部分原样发送，HF 的路由器会选择匹配的推理提供商。如果你希望每个后缀都有不同别名，请将每个变体作为自己的条目添加到 `models.providers.huggingface.models` 下（或添加到 `model.primary` 中）。
    - **配置合并：** `models.providers.huggingface.models` 中已有的条目（例如在 `models.json` 中）会在配置合并时保留，因此你在那里设置的任何自定义 `name`、`alias` 或模型选项都会在重启后继续保留。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN` 可供该进程使用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。

    <Note>
    OpenClaw 同时接受 `HUGGINGFACE_HUB_TOKEN` 和 `HF_TOKEN`。如果两者都已设置，`HUGGINGFACE_HUB_TOKEN` 优先。
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
    所有提供商、模型 ref 和故障转移行为的概览。
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
