---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie möchten Beispiele für die schnelle Einrichtung von LLM-Authentifizierung und Modellauswahl
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Schnellstart für Modell-Provider
x-i18n:
    generated_at: "2026-07-12T15:43:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Wählen Sie einen Provider aus, authentifizieren Sie sich und legen Sie dann das Standardmodell als `provider/model` fest.

## Schnellstart (zwei Schritte)

1. Authentifizieren Sie sich beim Provider (normalerweise über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Unterstützte Provider (Einstiegsauswahl)

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [Cohere](/de/providers/cohere)
- [ComfyUI](/de/providers/comfy)
- [DeepInfra](/de/providers/deepinfra)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NovitaAI](/de/providers/novita)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode (Zen + Go)](/de/providers/opencode)
- [OpenRouter](/de/providers/openrouter)
- [Qianfan](/de/providers/qianfan)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Venice (Venice AI)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [xAI](/de/providers/xai)
- [Z.AI (GLM)](/de/providers/zai)

Den vollständigen Provider-Katalog und Informationen zur erweiterten Konfiguration finden Sie im
[Provider-Verzeichnis](/de/providers/index) und unter [Modell-Provider](/de/concepts/model-providers).

## Zusätzliche Provider-Varianten

- `anthropic-vertex` – installieren Sie `@openclaw/anthropic-vertex-provider` für implizite Anthropic-Unterstützung auf Google Vertex, wenn Vertex-Anmeldedaten verfügbar sind; keine separate Authentifizierungsoption beim Onboarding
- `copilot-proxy` – lokale VS Code Copilot Proxy-Bridge; verwenden Sie `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` – inoffizieller OAuth-Ablauf für die Gemini CLI; erfordert eine lokale `gemini`-Installation (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`); Standardmodell `google-gemini-cli/gemini-3-flash-preview`; verwenden Sie `openclaw onboard --auth-choice google-gemini-cli` oder `openclaw models auth login --provider google-gemini-cli --set-default`

## Verwandte Themen

- [Provider-Verzeichnis](/de/providers/index)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
- [Modell-CLI](/de/cli/models)
