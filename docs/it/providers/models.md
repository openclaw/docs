---
read_when:
    - Vuoi scegliere un provider di modelli
    - Vuoi esempi rapidi di configurazione per autenticazione LLM + selezione del modello
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Guida rapida ai provider di modelli
x-i18n:
    generated_at: "2026-04-05T14:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegline uno, autenticati, quindi imposta il modello predefinito
come `provider/model`.

## Guida rapida (due passaggi)

1. Autenticati con il provider (di solito tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider supportati (set iniziale)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (internazionale)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [Modelli GLM](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## Varianti aggiuntive di provider inclusi

- `anthropic-vertex` - supporto Anthropic implicito su Google Vertex quando sono disponibili credenziali Vertex; nessuna scelta di autenticazione onboarding separata
- `copilot-proxy` - bridge locale VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flusso OAuth non ufficiale di Gemini CLI; richiede un'installazione locale di `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modello predefinito `google-gemini-cli/gemini-3.1-pro-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` oppure `openclaw models auth login --provider google-gemini-cli --set-default`

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/concepts/model-providers).
