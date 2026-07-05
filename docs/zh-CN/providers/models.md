---
read_when:
    - 你想选择一个模型提供商
    - 你想要 LLM 凭证 + 模型选择的快速设置示例
summary: OpenClaw 支持的模型提供商（大语言模型）
title: 模型提供商快速开始
x-i18n:
    generated_at: "2026-07-05T11:37:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

选择一个提供商，完成身份验证，然后将默认模型设置为 `provider/model`。

## 快速开始（两步）

1. 使用提供商完成身份验证（通常通过 `openclaw onboard`）。
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
- [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
- [Cohere](/zh-CN/providers/cohere)
- [ComfyUI](/zh-CN/providers/comfy)
- [DeepInfra](/zh-CN/providers/deepinfra)
- [fal](/zh-CN/providers/fal)
- [Fireworks](/zh-CN/providers/fireworks)
- [MiniMax](/zh-CN/providers/minimax)
- [Mistral](/zh-CN/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
- [NovitaAI](/zh-CN/providers/novita)
- [OpenAI（API + Codex）](/zh-CN/providers/openai)
- [OpenCode（Zen + Go）](/zh-CN/providers/opencode)
- [OpenRouter](/zh-CN/providers/openrouter)
- [Qianfan](/zh-CN/providers/qianfan)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [StepFun](/zh-CN/providers/stepfun)
- [Synthetic](/zh-CN/providers/synthetic)
- [Venice（Venice AI）](/zh-CN/providers/venice)
- [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
- [xAI](/zh-CN/providers/xai)
- [Z.AI (GLM)](/zh-CN/providers/zai)

如需完整的提供商目录和高级配置，请参阅
[提供商目录](/zh-CN/providers/index) 和 [模型提供商](/zh-CN/concepts/model-providers)。

## 其他提供商变体

- `anthropic-vertex` - 安装 `@openclaw/anthropic-vertex-provider`，在 Vertex 凭证可用时支持 Google Vertex 上的隐式 Anthropic；没有单独的新手引导身份验证选择
- `copilot-proxy` - 本地 VS Code Copilot Proxy 桥接；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要本地安装 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；默认模型 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

## 相关内容

- [提供商目录](/zh-CN/providers/index)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
- [模型 CLI](/zh-CN/cli/models)
