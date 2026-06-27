---
read_when:
    - Je wilt een modelprovider kiezen
    - Je wilt snelle installatievoorbeelden voor LLM-authenticatie + modelselectie
summary: Modelproviders (LLM's) ondersteund door OpenClaw
title: Snelstart voor modelprovider
x-i18n:
    generated_at: "2026-06-27T18:13:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw kan veel LLM-providers gebruiken. Kies er een, authenticeer en stel vervolgens het standaardmodel in als `provider/model`.

## Snelstart (twee stappen)

1. Authenticeer bij de provider (meestal via `openclaw onboard`).
2. Stel het standaardmodel in:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Ondersteunde providers (startset)

- [Alibaba Model Studio](/nl/providers/alibaba)
- [Amazon Bedrock](/nl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/nl/providers/anthropic)
- [BytePlus (International)](/nl/concepts/model-providers#byteplus-international)
- [Chutes](/nl/providers/chutes)
- [Cohere](/nl/providers/cohere)
- [ComfyUI](/nl/providers/comfy)
- [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
- [DeepInfra](/nl/providers/deepinfra)
- [fal](/nl/providers/fal)
- [Fireworks](/nl/providers/fireworks)
- [MiniMax](/nl/providers/minimax)
- [Mistral](/nl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
- [OpenAI (API + Codex)](/nl/providers/openai)
- [OpenCode (Zen + Go)](/nl/providers/opencode)
- [OpenRouter](/nl/providers/openrouter)
- [Qianfan](/nl/providers/qianfan)
- [Qwen](/nl/providers/qwen)
- [Runway](/nl/providers/runway)
- [StepFun](/nl/providers/stepfun)
- [Synthetic](/nl/providers/synthetic)
- [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/nl/providers/venice)
- [xAI](/nl/providers/xai)
- [Z.AI (GLM)](/nl/providers/zai)

## Extra providervarianten

- `anthropic-vertex` - installeer `@openclaw/anthropic-vertex-provider` voor impliciete ondersteuning voor Anthropic op Google Vertex wanneer Vertex-referenties beschikbaar zijn; geen afzonderlijke onboarding-authenticatiekeuze
- `copilot-proxy` - lokale VS Code Copilot Proxy-bridge; gebruik `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - onofficiële OAuth-flow van Gemini CLI; vereist een lokale `gemini`-installatie (`brew install gemini-cli` of `npm install -g @google/gemini-cli`); standaardmodel `google-gemini-cli/gemini-3-flash-preview`; gebruik `openclaw onboard --auth-choice google-gemini-cli` of `openclaw models auth login --provider google-gemini-cli --set-default`

Zie [Modelproviders](/nl/concepts/model-providers) voor de volledige providercatalogus (xAI, Groq, Mistral, enz.) en geavanceerde configuratie.

## Gerelateerd

- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
- [Modellen-CLI](/nl/cli/models)
