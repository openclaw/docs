---
read_when:
    - Vuoi scegliere un fornitore di modelli
    - Vuoi esempi rapidi di configurazione per l'autenticazione LLM e la selezione del modello
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Guida rapida al provider del modello
x-i18n:
    generated_at: "2026-07-12T07:25:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Scegli un provider, esegui l'autenticazione, quindi imposta il modello predefinito nel formato `provider/model`.

## Avvio rapido (due passaggi)

1. Esegui l'autenticazione con il provider (solitamente tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider supportati (insieme iniziale)

- [Alibaba Model Studio](/it/providers/alibaba)
- [Amazon Bedrock](/it/providers/bedrock)
- [Anthropic (API + Claude CLI)](/it/providers/anthropic)
- [BytePlus (internazionale)](/it/concepts/model-providers#byteplus-international)
- [Chutes](/it/providers/chutes)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [Cohere](/it/providers/cohere)
- [ComfyUI](/it/providers/comfy)
- [DeepInfra](/it/providers/deepinfra)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [MiniMax](/it/providers/minimax)
- [Mistral](/it/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
- [NovitaAI](/it/providers/novita)
- [OpenAI (API + Codex)](/it/providers/openai)
- [OpenCode (Zen + Go)](/it/providers/opencode)
- [OpenRouter](/it/providers/openrouter)
- [Qianfan](/it/providers/qianfan)
- [Qwen](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Venice (Venice AI)](/it/providers/venice)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [xAI](/it/providers/xai)
- [Z.AI (GLM)](/it/providers/zai)

Per il catalogo completo dei provider e la configurazione avanzata, consulta
[Directory dei provider](/it/providers/index) e [Provider di modelli](/it/concepts/model-providers).

## Varianti aggiuntive dei provider

- `anthropic-vertex` - installa `@openclaw/anthropic-vertex-provider` per il supporto implicito di Anthropic su Google Vertex quando sono disponibili le credenziali Vertex; non è prevista una scelta di autenticazione separata durante l'onboarding
- `copilot-proxy` - bridge locale per VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flusso OAuth non ufficiale di Gemini CLI; richiede un'installazione locale di `gemini` (`brew install gemini-cli` oppure `npm install -g @google/gemini-cli`); modello predefinito `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` oppure `openclaw models auth login --provider google-gemini-cli --set-default`

## Argomenti correlati

- [Directory dei provider](/it/providers/index)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
- [CLI dei modelli](/it/cli/models)
