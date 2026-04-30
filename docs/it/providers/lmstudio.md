---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi impostare e configurare LM Studio
summary: Eseguire OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T09:08:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio è un'app intuitiva ma potente per eseguire modelli open-weight sul tuo hardware. Consente di eseguire modelli llama.cpp (GGUF) o MLX (Apple Silicon). È disponibile come pacchetto GUI o daemon headless (`llmster`). Per la documentazione del prodotto e della configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

1. Installa LM Studio (desktop) o `llmster` (headless), quindi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l'app desktop oppure di eseguire il daemon con il comando seguente:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se usi l'app, assicurati di avere JIT abilitato per un'esperienza fluida. Scopri di più nella [guida JIT e TTL di LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Se l'autenticazione di LM Studio è abilitata, imposta `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se l'autenticazione di LM Studio è disabilitata, puoi lasciare vuota la chiave API durante la configurazione interattiva di OpenClaw.

Per i dettagli sulla configurazione dell'autenticazione di LM Studio, vedi [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Esegui l'onboarding e scegli `LM Studio`:

```bash
openclaw onboard
```

5. Durante l'onboarding, usa il prompt `Default model` per scegliere il tuo modello LM Studio.

Puoi anche impostarlo o modificarlo in seguito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli LM Studio seguono il formato `author/model-name` (ad esempio `qwen/qwen3.5-9b`). I riferimenti ai modelli OpenClaw antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta di un modello eseguendo `curl http://localhost:1234/api/v1/models` e controllando il campo `key`.

## Onboarding non interattivo

Usa l'onboarding non interattivo quando vuoi automatizzare la configurazione tramite script (CI, provisioning, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oppure specifica l'URL di base, il modello e la chiave API opzionale:

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

Per i server LM Studio autenticati, passa `--lmstudio-api-key` oppure imposta `LM_API_TOKEN`.
Per i server LM Studio non autenticati, ometti la chiave; OpenClaw salva un marcatore locale non segreto.

`--custom-api-key` rimane supportato per compatibilità, ma `--lmstudio-api-key` è preferito per LM Studio.

Questo scrive `models.providers.lmstudio` e imposta il modello predefinito su `lmstudio/<custom-model-id>`. Quando fornisci una chiave API, la configurazione scrive anche il profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può richiedere una lunghezza di contesto di caricamento preferita opzionale e la applica ai modelli LM Studio rilevati che salva nella configurazione.
La configurazione del Plugin LM Studio considera attendibile l'endpoint LM Studio configurato per le richieste ai modelli, inclusi host loopback, LAN e tailnet. Puoi disattivare questo comportamento impostando `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configurazione

### Compatibilità dell'uso in streaming

LM Studio è compatibile con l'uso in streaming. Quando non emette un oggetto `usage` in formato OpenAI, OpenClaw recupera invece i conteggi dei token dai metadati in stile llama.cpp `timings.prompt_n` / `timings.predicted_n`.

Lo stesso comportamento dell'uso in streaming si applica a questi backend locali compatibili con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilità del thinking

Quando il discovery `/api/v1/models` di LM Studio segnala opzioni di ragionamento specifiche del modello, OpenClaw conserva quei valori nativi nei metadati di compatibilità del modello. Per i modelli di thinking binari che dichiarano `allowed_options: ["off", "on"]`, OpenClaw mappa il thinking disabilitato su `off` e i livelli `/think` abilitati su `on`, invece di inviare valori solo OpenAI come `low` o `medium`.

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

Assicurati che LM Studio sia in esecuzione. Se l'autenticazione è abilitata, imposta anche `LM_API_TOKEN`:

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
- Per i dettagli sulla configurazione dell'autenticazione di LM Studio, vedi [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se il server non richiede autenticazione, lascia vuota la chiave durante la configurazione.

### Caricamento del modello just-in-time

LM Studio supporta il caricamento dei modelli just-in-time (JIT), in cui i modelli vengono caricati alla prima richiesta. Assicurati di averlo abilitato per evitare errori 'Model not loaded'.

### Host LM Studio LAN o tailnet

Usa l'indirizzo raggiungibile dell'host LM Studio, mantieni `/v1` e assicurati che LM Studio sia vincolato oltre loopback su quella macchina:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

A differenza dei provider generici compatibili con OpenAI, `lmstudio` considera automaticamente attendibile il proprio endpoint locale/privato configurato per le richieste ai modelli protette. Anche gli ID provider loopback personalizzati come `localhost` o `127.0.0.1` sono considerati attendibili automaticamente; per ID provider personalizzati LAN, tailnet o DNS privato, imposta esplicitamente `models.providers.<id>.request.allowPrivateNetwork: true`.

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
