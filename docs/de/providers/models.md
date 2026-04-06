---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie möchten schnelle Einrichtungsbeispiele für LLM-Authentifizierung + Modellauswahl
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Schnellstart für Modell-Provider
x-i18n:
    generated_at: "2026-04-06T03:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0314fb1c754171e5fc252d30f7ba9bb6acdbb978d97e9249264d90351bac2e7
    source_path: providers/models.md
    workflow: 15
---

# Modell-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen aus, authentifizieren Sie sich und setzen Sie dann das Standardmodell als `provider/model`.

## Schnellstart (zwei Schritte)

1. Authentifizieren Sie sich beim Provider (normalerweise über `openclaw onboard`).
2. Setzen Sie das Standardmodell:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Unterstützte Provider (Starter-Set)

- [Alibaba Model Studio](/providers/alibaba)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Amazon Bedrock](/de/providers/bedrock)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [fal](/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GLM-Modelle](/de/providers/glm)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode (Zen + Go)](/de/providers/opencode)
- [OpenRouter](/de/providers/openrouter)
- [Qianfan](/de/providers/qianfan)
- [Qwen](/de/providers/qwen)
- [Runway](/providers/runway)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/de/providers/venice)
- [xAI](/de/providers/xai)
- [Z.AI](/de/providers/zai)

## Zusätzliche gebündelte Provider-Varianten

- `anthropic-vertex` - implizite Anthropic-Unterstützung auf Google Vertex, wenn Vertex-Anmeldedaten verfügbar sind; keine separate Onboarding-Authentifizierungsoption
- `copilot-proxy` - lokale VS Code Copilot Proxy-Bridge; verwenden Sie `openclaw onboard --auth-choice copilot-proxy`

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration finden Sie unter [Modell-Provider](/de/concepts/model-providers).
