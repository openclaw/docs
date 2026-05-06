---
read_when:
    - 您想要選擇模型提供者
    - 你想要 LLM 驗證 + 模型選擇的快速設定範例
summary: OpenClaw 支援的模型提供者（大型語言模型）
title: 模型供應商快速入門
x-i18n:
    generated_at: "2026-05-06T18:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw 可以使用許多 LLM 供應商。選擇一個供應商、完成驗證，然後將預設
模型設定為 `provider/model`。

## 快速開始（兩個步驟）

1. 使用供應商驗證（通常透過 `openclaw onboard`）。
2. 設定預設模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支援的供應商（入門集合）

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [Amazon Bedrock](/zh-TW/providers/bedrock)
- [Anthropic（API + Claude CLI）](/zh-TW/providers/anthropic)
- [BytePlus（國際版）](/zh-TW/concepts/model-providers#byteplus-international)
- [Chutes](/zh-TW/providers/chutes)
- [ComfyUI](/zh-TW/providers/comfy)
- [Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
- [DeepInfra](/zh-TW/providers/deepinfra)
- [fal](/zh-TW/providers/fal)
- [Fireworks](/zh-TW/providers/fireworks)
- [GLM 模型](/zh-TW/providers/glm)
- [MiniMax](/zh-TW/providers/minimax)
- [Mistral](/zh-TW/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
- [OpenAI（API + Codex）](/zh-TW/providers/openai)
- [OpenCode（Zen + Go）](/zh-TW/providers/opencode)
- [OpenRouter](/zh-TW/providers/openrouter)
- [Qianfan](/zh-TW/providers/qianfan)
- [Qwen](/zh-TW/providers/qwen)
- [Runway](/zh-TW/providers/runway)
- [StepFun](/zh-TW/providers/stepfun)
- [Synthetic](/zh-TW/providers/synthetic)
- [Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
- [Venice（Venice AI）](/zh-TW/providers/venice)
- [xAI](/zh-TW/providers/xai)
- [Z.AI](/zh-TW/providers/zai)

## 其他內建供應商變體

- `anthropic-vertex` - 當 Vertex 認證可用時，隱含支援 Google Vertex 上的 Anthropic；沒有獨立的導覽驗證選項
- `copilot-proxy` - 本機 VS Code Copilot Proxy 橋接器；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要本機安裝 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；預設模型 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

如需完整供應商目錄（xAI、Groq、Mistral 等）和進階設定，
請參閱[模型供應商](/zh-TW/concepts/model-providers)。

## 相關

- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [模型 CLI](/zh-TW/cli/models)
