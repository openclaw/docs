---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi configurare e impostare LM Studio
summary: Eseguire OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:07:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio è un'app intuitiva ma potente per eseguire modelli open-weight sul tuo hardware. Ti permette di eseguire modelli llama.cpp (GGUF) o MLX (Apple Silicon). È disponibile come pacchetto GUI o daemon headless (`llmster`). Per la documentazione sul prodotto e sulla configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

1. Installa LM Studio (desktop) o `llmster` (headless), quindi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l'app desktop oppure di eseguire il daemon usando il comando seguente:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se stai usando l'app, assicurati di avere JIT abilitato per un'esperienza fluida. Scopri di più nella [guida a JIT e TTL di LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

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

Le chiavi dei modelli LM Studio seguono il formato `author/model-name` (ad es. `qwen/qwen3.5-9b`). I riferimenti modello di OpenClaw
antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta per
un modello eseguendo `curl http://localhost:1234/api/v1/models` e controllando il campo `key`.

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

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (ad es. `qwen/qwen3.5-9b`), senza
il prefisso provider `lmstudio/`.

Per i server LM Studio autenticati, passa `--lmstudio-api-key` o imposta `LM_API_TOKEN`.
Per i server LM Studio non autenticati, ometti la chiave; OpenClaw archivia un marcatore locale non segreto.

`--custom-api-key` rimane supportato per compatibilità, ma per LM Studio è preferibile `--lmstudio-api-key`.

Questo scrive `models.providers.lmstudio` e imposta il modello predefinito su
`lmstudio/<custom-model-id>`. Quando fornisci una chiave API, la configurazione scrive anche il
profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può chiedere una lunghezza opzionale preferita del contesto di caricamento e la applica ai modelli LM Studio rilevati che salva nella configurazione.
La configurazione del Plugin LM Studio considera attendibile l'endpoint LM Studio configurato per le richieste dei modelli, inclusi host loopback, LAN e tailnet. Le origini metadata/link-local richiedono comunque un consenso esplicito. Puoi disattivarlo impostando `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configurazione

### Compatibilità dell'uso in streaming

LM Studio è compatibile con l'uso in streaming. Quando non emette un oggetto
`usage` nel formato OpenAI, OpenClaw recupera invece i conteggi dei token dai metadati in stile llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

Lo stesso comportamento per l'uso in streaming si applica a questi backend locali compatibili con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilità Thinking

Quando il discovery `/api/v1/models` di LM Studio segnala opzioni di reasoning
specifiche del modello, OpenClaw espone i valori `reasoning_effort`
compatibili con OpenAI corrispondenti nei metadati di compatibilità del modello. Le build attuali di LM Studio possono pubblicizzare opzioni UI binarie come `allowed_options: ["off", "on"]` pur rifiutando tali valori
su `/v1/chat/completions`; OpenClaw normalizza quella forma di discovery binaria in
`none`, `minimal`, `low`, `medium`, `high` e `xhigh` prima di inviare le richieste.
Le configurazioni LM Studio salvate meno recenti che contengono mappe di reasoning `off`/`on` vengono
normalizzate allo stesso modo quando il catalogo viene caricato.

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

### Caricamento del modello just-in-time

LM Studio supporta il caricamento del modello just-in-time (JIT), in cui i modelli vengono caricati alla prima richiesta. OpenClaw precarica i modelli tramite l'endpoint di caricamento nativo di LM Studio per impostazione predefinita, il che aiuta quando JIT è disabilitato. Per lasciare che JIT, TTL di inattività e comportamento di auto-evict di LM Studio gestiscano il ciclo di vita del modello, disabilita il passaggio di precaricamento di OpenClaw:

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

`lmstudio` considera automaticamente attendibile l'endpoint locale/privato configurato per le richieste di modelli protette. Anche le voci provider personalizzate/locali compatibili con OpenAI considerano attendibile l'origine `baseUrl` esatta configurata, eccetto le origini metadata/link-local; le richieste a porte private o destinazioni private diverse richiedono comunque `models.providers.<id>.request.allowPrivateNetwork: true`. Imposta `models.providers.<id>.request.allowPrivateNetwork: false` per disattivare la fiducia nell'origine esatta.

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
