---
read_when:
    - 你想选择一个模型提供商
    - 你想要 LLM 凭证 + 模型选择的快速设置示例
summary: OpenClaw 支持的模型提供商（大语言模型）
title: 模型提供商快速开始
x-i18n:
    generated_at: "2026-05-06T16:17:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw 可以使用许多 LLM 提供商。选择一个、完成身份验证，然后将默认
模型设置为 `provider/model`。

## 快速开始（两步）

1. 通过提供商进行身份验证（通常使用 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支持的提供商（入门集合）

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [Amazon Bedrock](/zh-CN/providers/bedrock)
- [Anthropic（API + Claude CLI）](/zh-CN/providers/anthropic)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [Chutes](/zh-CN/providers/chutes)
- [ComfyUI](/zh-CN/providers/comfy)
- [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
- [DeepInfra](/zh-CN/providers/deepinfra)
- [fal](/zh-CN/providers/fal)
- [Fireworks](/zh-CN/providers/fireworks)
- [GLM 模型](/zh-CN/providers/glm)
- [MiniMax](/zh-CN/providers/minimax)
- [Mistral](/zh-CN/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
- [OpenAI（API + Codex）](/zh-CN/providers/openai)
- [OpenCode（Zen + Go）](/zh-CN/providers/opencode)
- [OpenRouter](/zh-CN/providers/openrouter)
- [Qianfan](/zh-CN/providers/qianfan)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [StepFun](/zh-CN/providers/stepfun)
- [Synthetic](/zh-CN/providers/synthetic)
- [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
- [Venice（Venice AI）](/zh-CN/providers/venice)
- [xAI](/zh-CN/providers/xai)
- [Z.AI](/zh-CN/providers/zai)

## 其他内置提供商变体

- `anthropic-vertex` - 当 Vertex 凭证可用时，隐式支持 Google Vertex 上的 Anthropic；没有单独的新手引导身份验证选项
- `copilot-proxy` - 本地 VS Code Copilot Proxy 桥接；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要安装本地 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；默认模型 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

如需完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，
请参阅[模型提供商](/zh-CN/concepts/model-providers)。

## 相关

- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
- [Models CLI](/zh-CN/cli/models)
