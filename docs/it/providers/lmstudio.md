---
read_when:
    - Vuoi eseguire OpenClaw con modelli a codice aperto tramite LM Studio
    - Vuoi impostare e configurare LM Studio
summary: Esegui OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio è un'app accessibile ma potente per eseguire modelli con pesi aperti sul tuo hardware. Permette di eseguire modelli llama.cpp (GGUF) o MLX (Apple Silicon). È disponibile come pacchetto GUI o demone headless (`llmster`). Per la documentazione del prodotto e della configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

1. Installa LM Studio (desktop) o `llmster` (headless), quindi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l'app desktop oppure di eseguire il demone usando il comando seguente:

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

5. Nell'onboarding, usa il prompt `Default model` per scegliere il tuo modello LM Studio.

Puoi anche impostarlo o modificarlo in seguito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli LM Studio seguono il formato `author/model-name` (ad es. `qwen/qwen3.5-9b`). I riferimenti ai modelli OpenClaw
antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta di
un modello eseguendo `curl http://localhost:1234/api/v1/models` e controllando il campo `key`.

## Onboarding non interattivo

Usa l'onboarding non interattivo quando vuoi automatizzare la configurazione con script (CI, provisioning, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oppure specifica l'URL di base, il modello e la chiave API facoltativa:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (ad es. `qwen/qwen3.5-9b`), senza
il prefisso provider `lmstudio/`.

Per server LM Studio autenticati, passa `--lmstudio-api-key` o imposta `LM_API_TOKEN`.
Per server LM Studio non autenticati, ometti la chiave; OpenClaw salva un indicatore locale non segreto.

`--custom-api-key` rimane supportato per compatibilità, ma per LM Studio è preferibile `--lmstudio-api-key`.

Questo scrive `models.providers.lmstudio` e imposta il modello predefinito su
`lmstudio/<custom-model-id>`. Quando fornisci una chiave API, la configurazione scrive anche il
profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può chiedere una lunghezza di contesto di caricamento preferita facoltativa e la applica ai modelli LM Studio rilevati che salva nella configurazione.
La configurazione del Plugin LM Studio considera attendibile l'endpoint LM Studio configurato per le richieste ai modelli, inclusi host loopback, LAN e tailnet. Puoi disattivare questo comportamento impostando `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configurazione

### Compatibilità dell'utilizzo in streaming

LM Studio è compatibile con l'utilizzo in streaming. Quando non emette un oggetto
`usage` in stile OpenAI, OpenClaw recupera invece i conteggi dei token dai metadati
`timings.prompt_n` / `timings.predicted_n` in stile llama.cpp.

Lo stesso comportamento dell'utilizzo in streaming si applica a questi backend locali compatibili con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilità del ragionamento

Quando il rilevamento `/api/v1/models` di LM Studio segnala opzioni di ragionamento
specifiche del modello, OpenClaw espone i valori `reasoning_effort`
compatibili con OpenAI corrispondenti nei metadati di compatibilità del modello. Le build attuali di LM Studio possono pubblicizzare opzioni
UI binarie come `allowed_options: ["off", "on"]` rifiutando al contempo quei valori
su `/v1/chat/completions`; OpenClaw normalizza quella forma di rilevamento binaria in
`none`, `minimal`, `low`, `medium`, `high` e `xhigh` prima di inviare le richieste.
Le configurazioni LM Studio salvate in precedenza che contengono mappe di ragionamento `off`/`on`
vengono normalizzate allo stesso modo quando il catalogo viene caricato.

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
- Se il tuo server non richiede autenticazione, lascia vuota la chiave durante la configurazione.

### Caricamento just-in-time dei modelli

LM Studio supporta il caricamento just-in-time (JIT) dei modelli, in cui i modelli vengono caricati alla prima richiesta. OpenClaw precarica i modelli tramite l'endpoint di caricamento nativo di LM Studio per impostazione predefinita, cosa utile quando JIT è disabilitato. Per lasciare che JIT, TTL di inattività e comportamento di auto-evict di LM Studio gestiscano il ciclo di vita del modello, disabilita il passaggio di precaricamento di OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Host LM Studio LAN o tailnet

Usa l'indirizzo raggiungibile dell'host LM Studio, mantieni `/v1` e assicurati che LM Studio sia associato oltre il loopback su quella macchina:

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

A differenza dei provider generici compatibili con OpenAI, `lmstudio` considera automaticamente attendibile il proprio endpoint locale/privato configurato per le richieste ai modelli protette. Anche gli ID provider loopback personalizzati come `localhost` o `127.0.0.1` sono considerati attendibili automaticamente; per ID provider personalizzati LAN, tailnet o DNS privati, imposta esplicitamente `models.providers.<id>.request.allowPrivateNetwork: true`.

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
