---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi configurare e impostare LM Studio
summary: Eseguire OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T08:35:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio è un'app semplice ma potente per eseguire modelli open-weight sul tuo hardware. Ti consente di eseguire modelli llama.cpp (GGUF) o MLX (Apple Silicon). È disponibile come pacchetto GUI o come daemon headless (`llmster`). Per la documentazione su prodotto e configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

1. Installa LM Studio (desktop) oppure `llmster` (headless), quindi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l'app desktop oppure di eseguire il daemon con il seguente comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se stai usando l'app, assicurati di avere JIT abilitato per un'esperienza fluida. Scopri di più nella [guida JIT e TTL di LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw richiede un valore token LM Studio. Imposta `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se l'autenticazione LM Studio è disabilitata, usa qualsiasi valore token non vuoto:

```bash
export LM_API_TOKEN="placeholder-key"
```

Per i dettagli sulla configurazione dell'autenticazione LM Studio, vedi [Autenticazione LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Esegui l'onboarding e scegli `LM Studio`:

```bash
openclaw onboard
```

5. Durante l'onboarding, usa il prompt `Default model` per scegliere il tuo modello LM Studio.

Puoi anche impostarlo o modificarlo in seguito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi modello LM Studio seguono il formato `author/model-name` (ad esempio `qwen/qwen3.5-9b`). I model ref OpenClaw antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta di un modello eseguendo `curl http://localhost:1234/api/v1/models` e guardando il campo `key`.

## Onboarding non interattivo

Usa l'onboarding non interattivo quando vuoi automatizzare la configurazione (CI, provisioning, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oppure specifica URL di base o modello con chiave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (ad esempio `qwen/qwen3.5-9b`), senza il prefisso provider `lmstudio/`.

L'onboarding non interattivo richiede `--lmstudio-api-key` (oppure `LM_API_TOKEN` nell'env).
Per server LM Studio senza autenticazione, funziona qualsiasi valore token non vuoto.

`--custom-api-key` resta supportato per compatibilità, ma `--lmstudio-api-key` è preferito per LM Studio.

Questo scrive `models.providers.lmstudio`, imposta il modello predefinito su
`lmstudio/<custom-model-id>` e scrive il profilo auth `lmstudio:default`.

La configurazione interattiva può chiedere una lunghezza di contesto di caricamento preferita facoltativa e la applica ai modelli LM Studio rilevati che salva nella configurazione.

## Configurazione

### Compatibilità dell'utilizzo in streaming

LM Studio è compatibile con l'utilizzo in streaming. Quando non emette un oggetto `usage`
in formato OpenAI, OpenClaw recupera i conteggi dei token dai metadati in stile llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

Lo stesso comportamento si applica a questi backend locali compatibili con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Configurazione esplicita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Risoluzione dei problemi

### LM Studio non rilevato

Assicurati che LM Studio sia in esecuzione e di aver impostato `LM_API_TOKEN` (per server senza autenticazione, funziona qualsiasi valore token non vuoto):

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Verifica che l'API sia accessibile:

```bash
curl http://localhost:1234/api/v1/models
```

### Errori di autenticazione (HTTP 401)

Se la configurazione segnala HTTP 401, verifica la tua chiave API:

- Controlla che `LM_API_TOKEN` corrisponda alla chiave configurata in LM Studio.
- Per i dettagli sulla configurazione dell'autenticazione LM Studio, vedi [Autenticazione LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se il tuo server non richiede autenticazione, usa qualsiasi valore token non vuoto per `LM_API_TOKEN`.

### Caricamento just-in-time del modello

LM Studio supporta il caricamento just-in-time (JIT) dei modelli, in cui i modelli vengono caricati alla prima richiesta. Assicurati di averlo abilitato per evitare errori di tipo "Model not loaded".
