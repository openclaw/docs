---
read_when:
    - 您想要選擇模型提供者
    - 你想要快速設定大型語言模型驗證與模型選擇的範例
summary: OpenClaw 支援的模型供應商（大型語言模型）
title: 模型供應商快速入門
x-i18n:
    generated_at: "2026-07-11T21:42:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

選擇供應商、完成驗證，然後將預設模型設定為 `provider/model`。

## 快速開始（兩個步驟）

1. 向供應商進行驗證（通常透過 `openclaw onboard`）。
2. 設定預設模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支援的供應商（入門清單）

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [Amazon Bedrock](/zh-TW/providers/bedrock)
- [Anthropic（API + Claude 命令列介面）](/zh-TW/providers/anthropic)
- [BytePlus（國際版）](/zh-TW/concepts/model-providers#byteplus-international)
- [Chutes](/zh-TW/providers/chutes)
- [Cloudflare AI 閘道](/zh-TW/providers/cloudflare-ai-gateway)
- [Cohere](/zh-TW/providers/cohere)
- [ComfyUI](/zh-TW/providers/comfy)
- [DeepInfra](/zh-TW/providers/deepinfra)
- [fal](/zh-TW/providers/fal)
- [Fireworks](/zh-TW/providers/fireworks)
- [MiniMax](/zh-TW/providers/minimax)
- [Mistral](/zh-TW/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
- [NovitaAI](/zh-TW/providers/novita)
- [OpenAI（API + Codex）](/zh-TW/providers/openai)
- [OpenCode（Zen + Go）](/zh-TW/providers/opencode)
- [OpenRouter](/zh-TW/providers/openrouter)
- [Qianfan](/zh-TW/providers/qianfan)
- [Qwen](/zh-TW/providers/qwen)
- [Runway](/zh-TW/providers/runway)
- [StepFun](/zh-TW/providers/stepfun)
- [Synthetic](/zh-TW/providers/synthetic)
- [Venice（Venice AI）](/zh-TW/providers/venice)
- [Vercel AI 閘道](/zh-TW/providers/vercel-ai-gateway)
- [xAI](/zh-TW/providers/xai)
- [Z.AI（GLM）](/zh-TW/providers/zai)

如需完整的供應商目錄與進階設定，請參閱
[供應商目錄](/zh-TW/providers/index)與[模型供應商](/zh-TW/concepts/model-providers)。

## 其他供應商變體

- `anthropic-vertex` - 安裝 `@openclaw/anthropic-vertex-provider`，即可在具備 Vertex 憑證時支援 Google Vertex 上的隱式 Anthropic；不提供獨立的初始設定驗證選項
- `copilot-proxy` - 本機 VS Code Copilot Proxy 橋接器；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini 命令列介面 OAuth 流程；需要在本機安裝 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；預設模型為 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

## 相關內容

- [供應商目錄](/zh-TW/providers/index)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [模型命令列介面](/zh-TW/cli/models)
