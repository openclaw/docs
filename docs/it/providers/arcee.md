---
read_when:
    - Vuoi usare Arcee AI con OpenClaw
    - Ti serve la variabile d'ambiente della chiave API o la scelta di autenticazione della CLI
summary: Configurazione di Arcee AI (autenticazione + selezione del modello)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T08:16:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) fornisce accesso alla famiglia Trinity di modelli mixture-of-experts tramite un'API compatibile con OpenAI. Tutti i modelli Trinity sono concessi in licenza Apache 2.0.

I modelli Arcee AI possono essere accessibili direttamente tramite la piattaforma Arcee o tramite [OpenRouter](/it/providers/openrouter).

- Provider: `arcee`
- Auth: `ARCEEAI_API_KEY` (diretto) oppure `OPENROUTER_API_KEY` (tramite OpenRouter)
- API: compatibile con OpenAI
- URL di base: `https://api.arcee.ai/api/v1` (diretto) oppure `https://openrouter.ai/api/v1` (OpenRouter)

## Avvio rapido

1. Ottieni una chiave API da [Arcee AI](https://chat.arcee.ai/) o [OpenRouter](https://openrouter.ai/keys).

2. Imposta la chiave API (consigliato: memorizzarla per il Gateway):

```bash
# Diretto (piattaforma Arcee)
openclaw onboard --auth-choice arceeai-api-key

# Tramite OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## Esempio non interattivo

```bash
# Diretto (piattaforma Arcee)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Tramite OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## Nota sull'ambiente

Se il Gateway è in esecuzione come daemon (launchd/systemd), assicurati che `ARCEEAI_API_KEY`
(o `OPENROUTER_API_KEY`) sia disponibile per quel processo (ad esempio in
`~/.openclaw/.env` o tramite `env.shellEnv`).

## Catalogo incluso

OpenClaw attualmente include questo catalogo Arcee integrato:

| Model ref                      | Nome                   | Input | Contesto | Costo (in/out per 1M) | Note                                      |
| ------------------------------ | ---------------------- | ----- | -------- | --------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K     | $0.25 / $0.90         | Modello predefinito; reasoning abilitato  |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K     | $0.25 / $1.00         | Uso generale; 400B parametri, 13B attivi  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K     | $0.045 / $0.15        | Veloce ed economico; function calling     |

Gli stessi model ref funzionano sia per la configurazione diretta sia per quella tramite OpenRouter (ad esempio `arcee/trinity-large-thinking`).

Il preset di onboarding imposta `arcee/trinity-large-thinking` come modello predefinito.

## Funzionalità supportate

- Streaming
- Utilizzo di strumenti / function calling
- Output strutturato (modalità JSON e schema JSON)
- Thinking esteso (Trinity Large Thinking)
