---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - Hai bisogno del percorso di setup OAuth o con chiave API
    - Vuoi conoscere il modello predefinito, gli alias o il comportamento di rilevamento
summary: Setup di Chutes (OAuth o chiave API, rilevamento modelli, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T14:01:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) espone cataloghi di modelli open-source tramite un'API
compatibile con OpenAI. OpenClaw supporta sia OAuth via browser sia l'autenticazione
diretta con chiave API per il provider bundled `chutes`.

- Provider: `chutes`
- API: compatibile con OpenAI
- URL di base: `https://llm.chutes.ai/v1`
- Autenticazione:
  - OAuth tramite `openclaw onboard --auth-choice chutes`
  - Chiave API tramite `openclaw onboard --auth-choice chutes-api-key`
  - Variabili d'ambiente runtime: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Avvio rapido

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw avvia il flusso browser localmente oppure mostra un flusso con URL + incolla del redirect
su host remoti/headless. I token OAuth si aggiornano automaticamente tramite i profili auth di OpenClaw.

Override OAuth facoltativi:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### Chiave API

```bash
openclaw onboard --auth-choice chutes-api-key
```

Ottieni la tua chiave su
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Entrambi i percorsi di autenticazione registrano il catalogo Chutes bundled e impostano il modello predefinito
su `chutes/zai-org/GLM-4.7-TEE`.

## Comportamento di rilevamento

Quando l'autenticazione Chutes è disponibile, OpenClaw interroga il catalogo Chutes con quella
credenziale e usa i modelli rilevati. Se il rilevamento fallisce, OpenClaw torna
a un catalogo statico bundled così onboarding e avvio continuano comunque a funzionare.

## Alias predefiniti

OpenClaw registra anche tre alias di comodità per il catalogo Chutes bundled:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Catalogo starter integrato

Il catalogo fallback bundled include riferimenti Chutes correnti come:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Note

- Guida OAuth e requisiti dell'app di redirect: [Documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
- Il rilevamento tramite chiave API e OAuth usa entrambi lo stesso ID provider `chutes`.
- I modelli Chutes vengono registrati come `chutes/<model-id>`.
