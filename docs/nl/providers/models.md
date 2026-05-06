---
read_when:
    - Je wilt een modelprovider kiezen
    - Je wilt snelle configuratievoorbeelden voor LLM-authenticatie en modelselectie
summary: Modelaanbieders (LLM's) die door OpenClaw worden ondersteund
title: Snelstartgids voor modelproviders
x-i18n:
    generated_at: "2026-05-06T18:00:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw kan veel LLM-providers gebruiken. Kies er één, authenticeer en stel vervolgens het standaardmodel in als `provider/model`.

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
- [BytePlus (Internationaal)](/nl/concepts/model-providers#byteplus-international)
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

## Aanvullende gebundelde providervarianten

- `anthropic-vertex` - impliciete Anthropic op Google Vertex-ondersteuning wanneer Vertex-referenties beschikbaar zijn; geen afzonderlijke authenticatiekeuze voor onboarding
- `copilot-proxy` - lokale VS Code Copilot Proxy-brug; gebruik `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - onofficiële Gemini CLI OAuth-flow; vereist een lokale `gemini`-installatie (`brew install gemini-cli` of `npm install -g @google/gemini-cli`); standaardmodel `google-gemini-cli/gemini-3-flash-preview`; gebruik `openclaw onboard --auth-choice google-gemini-cli` of `openclaw models auth login --provider google-gemini-cli --set-default`

Voor de volledige providercatalogus (xAI, Groq, Mistral, enzovoort) en geavanceerde configuratie,
zie [Modelproviders](/nl/concepts/model-providers).

## Gerelateerd

- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
- [Modellen-CLI](/nl/cli/models)
