---
read_when:
    - Vuoi scegliere un provider di modelli
    - Ti servono esempi rapidi di configurazione per l'autenticazione LLM + la selezione del modello
summary: Fornitori di modelli (LLM) supportati da OpenClaw
title: Guida rapida al provider di modelli
x-i18n:
    generated_at: "2026-04-30T09:09:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegline uno, autenticalo, quindi imposta il modello predefinito come `provider/model`.

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
- [BytePlus (internazionale)](/it/concepts/model-providers#byteplus-international)
- [Chutes](/it/providers/chutes)
- [ComfyUI](/it/providers/comfy)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [DeepInfra](/it/providers/deepinfra)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [modelli GLM](/it/providers/glm)
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

## Varianti aggiuntive di provider incluse

- `anthropic-vertex` - supporto Anthropic implicito su Google Vertex quando sono disponibili le credenziali Vertex; nessuna scelta di autenticazione separata durante l'onboarding
- `copilot-proxy` - bridge locale VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flusso OAuth non ufficiale della CLI Gemini; richiede un'installazione locale di `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modello predefinito `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` oppure `openclaw models auth login --provider google-gemini-cli --set-default`

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata, consulta [Provider di modelli](/it/concepts/model-providers).

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
- [CLI dei modelli](/it/cli/models)
