---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi configurare e impostare LM Studio
summary: Eseguire OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T08:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio è un’app amichevole ma potente per eseguire modelli open-weight sul tuo hardware. Ti permette di eseguire modelli llama.cpp (GGUF) oppure MLX (Apple Silicon). È disponibile come pacchetto GUI o daemon headless (`llmster`). Per documentazione di prodotto e configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

1. Installa LM Studio (desktop) oppure `llmster` (headless), poi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l’app desktop oppure il daemon con il comando seguente:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se stai usando l’app, assicurati di avere il JIT abilitato per un’esperienza fluida. Scopri di più nella [guida LM Studio JIT e TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw richiede un valore token LM Studio. Imposta `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se l’autenticazione LM Studio è disabilitata, usa qualsiasi valore token non vuoto:

```bash
export LM_API_TOKEN="placeholder-key"
```

Per i dettagli sulla configurazione dell’autenticazione LM Studio, vedi [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Esegui l’onboarding e scegli `LM Studio`:

```bash
openclaw onboard
```

5. Nell’onboarding, usa il prompt `Default model` per scegliere il tuo modello LM Studio.

Puoi anche impostarlo o cambiarlo più tardi:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli LM Studio seguono il formato `author/model-name` (es. `qwen/qwen3.5-9b`). I riferimenti modello OpenClaw antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta di un modello eseguendo `curl http://localhost:1234/api/v1/models` e guardando il campo `key`.

## Onboarding non interattivo

Usa l’onboarding non interattivo quando vuoi automatizzare la configurazione (CI, provisioning, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oppure specifica base URL o modello con chiave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (es. `qwen/qwen3.5-9b`), senza il prefisso provider `lmstudio/`.

L’onboarding non interattivo richiede `--lmstudio-api-key` (oppure `LM_API_TOKEN` nell’ambiente).
Per server LM Studio senza autenticazione, funziona qualsiasi valore token non vuoto.

`--custom-api-key` resta supportato per compatibilità, ma `--lmstudio-api-key` è preferito per LM Studio.

Questo scrive `models.providers.lmstudio`, imposta il modello predefinito su
`lmstudio/<custom-model-id>` e scrive il profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può chiedere una lunghezza di contesto di caricamento preferita opzionale e la applica ai modelli LM Studio rilevati che salva nella configurazione.

## Configurazione

### Compatibilità con l’uso in streaming

LM Studio è compatibile con l’uso in streaming. Quando non emette un oggetto
`usage` in forma OpenAI, OpenClaw recupera i conteggi dei token dai metadati in stile llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

Lo stesso comportamento si applica a questi backend locali OpenAI-compatible:

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
# Avvio tramite app desktop, oppure in modalità headless:
lms server start --port 1234
```

Verifica che l’API sia accessibile:

```bash
curl http://localhost:1234/api/v1/models
```

### Errori di autenticazione (HTTP 401)

Se la configurazione segnala HTTP 401, verifica la tua chiave API:

- Controlla che `LM_API_TOKEN` corrisponda alla chiave configurata in LM Studio.
- Per i dettagli sulla configurazione dell’autenticazione LM Studio, vedi [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Se il tuo server non richiede autenticazione, usa qualsiasi valore token non vuoto per `LM_API_TOKEN`.

### Caricamento just-in-time del modello

LM Studio supporta il caricamento just-in-time (JIT) del modello, in cui i modelli vengono caricati alla prima richiesta. Assicurati di averlo abilitato per evitare errori tipo “Model not loaded”.

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
