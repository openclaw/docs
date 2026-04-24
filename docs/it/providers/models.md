---
read_when:
    - Vuoi scegliere un provider di modelli
    - Vuoi esempi rapidi di configurazione per auth LLM + selezione del modello
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Avvio rapido dei provider di modelli
x-i18n:
    generated_at: "2026-04-24T08:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegline uno, autenticati, poi imposta il modello predefinito
come `provider/model`.

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
- [ComfyUI](/it/providers/comfy)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [Modelli GLM](/it/providers/glm)
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
- [Z.AI](/it/providers/zai)

## Varianti provider bundled aggiuntive

- `anthropic-vertex` - supporto Anthropic implicito su Google Vertex quando sono disponibili credenziali Vertex; nessuna scelta auth separata nell'onboarding
- `copilot-proxy` - bridge locale VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flusso OAuth non ufficiale Gemini CLI; richiede un'installazione locale di `gemini` (`brew install gemini-cli` oppure `npm install -g @google/gemini-cli`); modello predefinito `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` oppure `openclaw models auth login --provider google-gemini-cli --set-default`

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/it/concepts/model-providers).

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
- [CLI models](/it/cli/models)
