---
read_when:
    - Vuoi scegliere un provider di modelli
    - Vuoi esempi rapidi di configurazione per l’autenticazione LLM e la selezione del modello
summary: Fornitori di modelli (LLM) supportati da OpenClaw
title: Guida rapida al provider di modelli
x-i18n:
    generated_at: "2026-06-27T18:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw può usare molti provider LLM. Scegline uno, autenticati, quindi imposta il modello
predefinito come `provider/model`.

## Avvio rapido (due passaggi)

1. Autenticati con il provider (di solito tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider supportati (set iniziale)

- [Alibaba Model Studio](/it/providers/alibaba)
- [Amazon Bedrock](/it/providers/bedrock)
- [Anthropic (API + Claude CLI)](/it/providers/anthropic)
- [BytePlus (International)](/it/concepts/model-providers#byteplus-international)
- [Chutes](/it/providers/chutes)
- [Cohere](/it/providers/cohere)
- [ComfyUI](/it/providers/comfy)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [DeepInfra](/it/providers/deepinfra)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [MiniMax](/it/providers/minimax)
- [Mistral](/it/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
- [OpenAI (API + Codex)](/it/providers/openai)
- [OpenCode (Zen + Go)](/it/providers/opencode)
- [OpenRouter](/it/providers/openrouter)
- [Qianfan](/it/providers/qianfan)
- [Qwen](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/it/providers/venice)
- [xAI](/it/providers/xai)
- [Z.AI (GLM)](/it/providers/zai)

## Varianti aggiuntive dei provider

- `anthropic-vertex` - installa `@openclaw/anthropic-vertex-provider` per il supporto Anthropic implicito su Google Vertex quando sono disponibili le credenziali Vertex; nessuna scelta di autenticazione di onboarding separata
- `copilot-proxy` - bridge locale VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flusso OAuth non ufficiale di Gemini CLI; richiede un'installazione locale di `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modello predefinito `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` o `openclaw models auth login --provider google-gemini-cli --set-default`

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/it/concepts/model-providers).

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
- [CLI dei modelli](/it/cli/models)
