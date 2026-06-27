---
read_when:
    - 你想選擇模型供應商
    - 你想要 LLM 驗證與模型選擇的快速設定範例
summary: OpenClaw 支援的模型提供者（LLM）
title: 模型提供者快速入門
x-i18n:
    generated_at: "2026-06-27T19:55:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw 可以使用許多 LLM 提供者。選擇一個、完成驗證，然後將預設
模型設為 `provider/model`。

## 快速開始（兩個步驟）

1. 使用提供者完成驗證（通常透過 `openclaw onboard`）。
2. 設定預設模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支援的提供者（起始集合）

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [Amazon Bedrock](/zh-TW/providers/bedrock)
- [Anthropic (API + Claude CLI)](/zh-TW/providers/anthropic)
- [BytePlus (International)](/zh-TW/concepts/model-providers#byteplus-international)
- [Chutes](/zh-TW/providers/chutes)
- [Cohere](/zh-TW/providers/cohere)
- [ComfyUI](/zh-TW/providers/comfy)
- [Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
- [DeepInfra](/zh-TW/providers/deepinfra)
- [fal](/zh-TW/providers/fal)
- [Fireworks](/zh-TW/providers/fireworks)
- [MiniMax](/zh-TW/providers/minimax)
- [Mistral](/zh-TW/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)
- [OpenAI (API + Codex)](/zh-TW/providers/openai)
- [OpenCode (Zen + Go)](/zh-TW/providers/opencode)
- [OpenRouter](/zh-TW/providers/openrouter)
- [Qianfan](/zh-TW/providers/qianfan)
- [Qwen](/zh-TW/providers/qwen)
- [Runway](/zh-TW/providers/runway)
- [StepFun](/zh-TW/providers/stepfun)
- [Synthetic](/zh-TW/providers/synthetic)
- [Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/zh-TW/providers/venice)
- [xAI](/zh-TW/providers/xai)
- [Z.AI (GLM)](/zh-TW/providers/zai)

## 其他提供者變體

- `anthropic-vertex` - 安裝 `@openclaw/anthropic-vertex-provider`，在可用 Vertex 認證時支援 Google Vertex 上的隱式 Anthropic；不需要另外選擇 onboard 驗證
- `copilot-proxy` - 本機 VS Code Copilot Proxy 橋接；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要本機安裝 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；預設模型 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

如需完整的提供者目錄（xAI、Groq、Mistral 等）與進階設定，
請參閱[模型提供者](/zh-TW/concepts/model-providers)。

## 相關

- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [模型命令列介面](/zh-TW/cli/models)
