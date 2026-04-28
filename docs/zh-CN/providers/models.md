---
read_when:
    - 你想选择一个模型提供商
    - 你想要用于 LLM 身份验证和模型选择的快速设置示例
summary: OpenClaw 支持的模型提供商（LLM）
title: 模型提供商快速开始
x-i18n:
    generated_at: "2026-04-28T00:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 15
---

# 模型提供商

OpenClaw 可以使用许多 LLM 提供商。选择一个提供商，完成身份验证，然后将默认模型设置为 `provider/model`。

## 快速开始（两步）

1. 使用提供商完成身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支持的提供商（入门集）

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

## 其他内置变体提供商

- `anthropic-vertex` - 当 Vertex 凭证可用时，隐式支持 Google Vertex 上的 Anthropic；无需单独的新手引导身份验证选项
- `copilot-proxy` - 本地 VS Code Copilot Proxy bridge；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要本地安装 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；默认模型为 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

如需查看完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障转移](/zh-CN/concepts/model-failover)
- [Models CLI](/zh-CN/cli/models)
