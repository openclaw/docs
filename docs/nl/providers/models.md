---
read_when:
    - Je wilt een modelprovider kiezen
    - Je wilt snelle configuratievoorbeelden voor LLM-authenticatie + modelselectie
summary: Modelaanbieders (LLM's) die door OpenClaw worden ondersteund
title: Snelstart voor modelprovider
x-i18n:
    generated_at: "2026-04-29T23:11:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Modelproviders

OpenClaw kan veel LLM-providers gebruiken. Kies er een, authenticeer en stel vervolgens het standaardmodel in als `provider/model`.

## Snel aan de slag (twee stappen)

1. Authenticeer met de provider (meestal via `openclaw onboard`).
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
- [BytePlus (internationaal)](/nl/concepts/model-providers#byteplus-international)
- [Chutes](/nl/providers/chutes)
- [ComfyUI](/nl/providers/comfy)
- [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
- [DeepInfra](/nl/providers/deepinfra)
- [fal](/nl/providers/fal)
- [Fireworks](/nl/providers/fireworks)
- [GLM-modellen](/nl/providers/glm)
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
- [Z.AI](/nl/providers/zai)

## Aanvullende meegeleverde providervarianten

- `anthropic-vertex` - impliciete Anthropic-ondersteuning op Google Vertex wanneer Vertex-inloggegevens beschikbaar zijn; geen afzonderlijke onboarding-authenticatiekeuze
- `copilot-proxy` - lokale VS Code Copilot Proxy-bridge; gebruik `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - onofficiële Gemini CLI OAuth-flow; vereist een lokale `gemini`-installatie (`brew install gemini-cli` of `npm install -g @google/gemini-cli`); standaardmodel `google-gemini-cli/gemini-3-flash-preview`; gebruik `openclaw onboard --auth-choice google-gemini-cli` of `openclaw models auth login --provider google-gemini-cli --set-default`

Zie [modelproviders](/nl/concepts/model-providers) voor de volledige providercatalogus (xAI, Groq, Mistral, enzovoort) en geavanceerde configuratie.

## Gerelateerd

- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
- [Models CLI](/nl/cli/models)
