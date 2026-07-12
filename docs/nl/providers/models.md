---
read_when:
    - U wilt een modelprovider kiezen
    - Je wilt snelle installatievoorbeelden voor LLM-authenticatie en modelselectie
summary: Modelproviders (LLM's) die door OpenClaw worden ondersteund
title: Snelstart voor modelprovider
x-i18n:
    generated_at: "2026-07-12T09:20:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Kies een provider, verifieer je identiteit en stel vervolgens het standaardmodel in als `provider/model`.

## Snel aan de slag (twee stappen)

1. Verifieer je identiteit bij de provider (meestal via `openclaw onboard`).
2. Stel het standaardmodel in:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Ondersteunde providers (startselectie)

- [Alibaba Model Studio](/nl/providers/alibaba)
- [Amazon Bedrock](/nl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/nl/providers/anthropic)
- [BytePlus (internationaal)](/nl/concepts/model-providers#byteplus-international)
- [Chutes](/nl/providers/chutes)
- [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
- [Cohere](/nl/providers/cohere)
- [ComfyUI](/nl/providers/comfy)
- [DeepInfra](/nl/providers/deepinfra)
- [fal](/nl/providers/fal)
- [Fireworks](/nl/providers/fireworks)
- [MiniMax](/nl/providers/minimax)
- [Mistral](/nl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
- [NovitaAI](/nl/providers/novita)
- [OpenAI (API + Codex)](/nl/providers/openai)
- [OpenCode (Zen + Go)](/nl/providers/opencode)
- [OpenRouter](/nl/providers/openrouter)
- [Qianfan](/nl/providers/qianfan)
- [Qwen](/nl/providers/qwen)
- [Runway](/nl/providers/runway)
- [StepFun](/nl/providers/stepfun)
- [Synthetic](/nl/providers/synthetic)
- [Venice (Venice AI)](/nl/providers/venice)
- [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
- [xAI](/nl/providers/xai)
- [Z.AI (GLM)](/nl/providers/zai)

Zie voor de volledige providercatalogus en geavanceerde configuratie
[Provideroverzicht](/nl/providers/index) en [Modelproviders](/nl/concepts/model-providers).

## Aanvullende providervarianten

- `anthropic-vertex` - installeer `@openclaw/anthropic-vertex-provider` voor impliciete ondersteuning van Anthropic op Google Vertex wanneer Vertex-referenties beschikbaar zijn; geen afzonderlijke authenticatiekeuze tijdens de onboarding
- `copilot-proxy` - lokale brug naar VS Code Copilot Proxy; gebruik `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - niet-officiële OAuth-stroom voor Gemini CLI; vereist een lokale installatie van `gemini` (`brew install gemini-cli` of `npm install -g @google/gemini-cli`); standaardmodel `google-gemini-cli/gemini-3-flash-preview`; gebruik `openclaw onboard --auth-choice google-gemini-cli` of `openclaw models auth login --provider google-gemini-cli --set-default`

## Gerelateerd

- [Provideroverzicht](/nl/providers/index)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
- [CLI voor modellen](/nl/cli/models)
