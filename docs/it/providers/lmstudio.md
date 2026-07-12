---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi installare e configurare LM Studio
summary: Esegui OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T07:27:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio esegue localmente modelli llama.cpp (GGUF) o MLX, come applicazione con interfaccia grafica oppure tramite il daemon headless `llmster`.
Per la documentazione sull'installazione e sul prodotto, consulta [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

<Steps>
  <Step title="Installa e avvia il server">
    Installa LM Studio (desktop) o `llmster` (headless), quindi avvia il server:

    ```bash
    lms server start --port 1234
    ```

    In alternativa, esegui il daemon headless:

    ```bash
    lms daemon up
    ```

    Se utilizzi l'app desktop, abilita JIT per un caricamento fluido dei modelli; consulta la
    [guida di LM Studio a JIT e TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Imposta una chiave API se l'autenticazione è abilitata">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Se l'autenticazione di LM Studio è disabilitata, lascia vuota la chiave API durante la configurazione. Consulta
    [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Esegui la configurazione iniziale">
    ```bash
    openclaw onboard
    ```

    Scegli `LM Studio`, quindi seleziona un modello quando viene richiesto `Default model`.

  </Step>
</Steps>

Per cambiare in seguito il modello predefinito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli di LM Studio usano il formato `author/model-name` (ad esempio `qwen/qwen3.5-9b`); i riferimenti ai modelli di OpenClaw
antepongono il provider: `lmstudio/qwen/qwen3.5-9b`. Per trovare la chiave esatta di un modello, esegui il
comando seguente e controlla il campo `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Configurazione iniziale non interattiva

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

In alternativa, specifica esplicitamente l'URL di base, il modello e la chiave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (ad esempio `qwen/qwen3.5-9b`), senza
il prefisso del provider `lmstudio/`. Passa `--lmstudio-api-key` (oppure imposta `LM_API_TOKEN`) per i server con autenticazione;
omettilo per i server senza autenticazione e OpenClaw memorizzerà invece un indicatore locale non segreto.
`--custom-api-key` è ancora accettato per compatibilità, ma è preferibile usare `--lmstudio-api-key`.

Questa operazione scrive `models.providers.lmstudio` e imposta il modello predefinito su `lmstudio/<custom-model-id>`.
Se si fornisce una chiave API, viene scritto anche il profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può inoltre richiedere una lunghezza preferita del contesto di caricamento e applicarla a tutti
i modelli rilevati che salva nella configurazione.

## Configurazione

### Compatibilità dell'utilizzo durante lo streaming

LM Studio non emette sempre un oggetto `usage` nel formato OpenAI nelle risposte trasmesse in streaming. OpenClaw
recupera invece i conteggi dei token dai metadati in stile llama.cpp `timings.prompt_n` / `timings.predicted_n`.
Qualsiasi endpoint compatibile con OpenAI risolto come endpoint locale (host di local loopback) utilizza lo stesso
meccanismo alternativo, che copre altri backend locali come vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
e text-generation-webui.

### Compatibilità del ragionamento

Quando il rilevamento tramite `/api/v1/models` di LM Studio segnala opzioni di ragionamento specifiche del modello, OpenClaw
espone i valori `reasoning_effort` corrispondenti (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) nei
metadati di compatibilità del modello. Alcune versioni di LM Studio presentano un'opzione binaria nell'interfaccia (`allowed_options: ["off",
"on"]`) ma rifiutano questi valori letterali in `/v1/chat/completions`; OpenClaw normalizza tale
forma binaria nella scala a sei livelli prima di inviare le richieste, anche per le configurazioni salvate in precedenza che
contengono ancora mappature di ragionamento `off`/`on`.

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

### Disabilitazione del precaricamento

LM Studio supporta il caricamento just-in-time (JIT) dei modelli, caricandoli alla prima richiesta. Per impostazione predefinita, OpenClaw
precarica i modelli tramite l'endpoint nativo di caricamento di LM Studio, una soluzione utile quando JIT è
disabilitato. Per affidare invece il ciclo di vita dei modelli a JIT, al TTL di inattività e all'espulsione automatica di LM Studio,
disabilita il passaggio di precaricamento di OpenClaw:

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

### Host LAN o tailnet

Usa l'indirizzo raggiungibile dell'host di LM Studio, mantieni `/v1` e assicurati che, su tale macchina, LM Studio sia associato
anche a interfacce diverse da local loopback:

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

`lmstudio` considera automaticamente attendibile l'endpoint configurato per le richieste ai modelli, inclusi gli host di local loopback,
LAN e tailnet, a eccezione delle origini di metadati/link-local. Qualsiasi voce di provider personalizzato/locale compatibile con OpenAI
riceve la stessa attendibilità per l'origine esatta. Le richieste verso un host privato o una porta differenti richiedono comunque
`models.providers.<id>.request.allowPrivateNetwork: true`; impostalo su `false` per rinunciare
all'attendibilità predefinita.

## Risoluzione dei problemi

### LM Studio non rilevato

Assicurati che LM Studio sia in esecuzione:

```bash
lms server start --port 1234
```

Se l'autenticazione è abilitata, imposta anche `LM_API_TOKEN`. Verifica che l'API sia raggiungibile:

```bash
curl http://localhost:1234/api/v1/models
```

### Errori di autenticazione (HTTP 401)

- Verifica che `LM_API_TOKEN` corrisponda alla chiave configurata in LM Studio.
- Consulta [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se il server non richiede l'autenticazione, lascia vuota la chiave durante la configurazione.

## Argomenti correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
