---
read_when:
    - Si desidera eseguire OpenClaw con modelli open source tramite LM Studio
    - Si desidera installare e configurare LM Studio
summary: Eseguire OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T14:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio esegue localmente modelli llama.cpp (GGUF) o MLX, come applicazione con interfaccia grafica o daemon headless `llmster`.
Per la documentazione sull'installazione e sul prodotto, consultare [lmstudio.ai](https://lmstudio.ai/).

## Avvio rapido

<Steps>
  <Step title="Installare e avviare il server">
    Installare LM Studio (desktop) o `llmster` (headless), quindi avviare il server:

    ```bash
    lms server start --port 1234
    ```

    In alternativa, eseguire il daemon headless:

    ```bash
    lms daemon up
    ```

    Se si utilizza l'applicazione desktop, abilitare JIT per un caricamento fluido dei modelli; consultare la
    [guida di LM Studio a JIT e TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Impostare una chiave API se l'autenticazione è abilitata">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Se l'autenticazione di LM Studio è disabilitata, lasciare vuota la chiave API durante la configurazione. Consultare
    [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Eseguire la configurazione iniziale">
    ```bash
    openclaw onboard
    ```

    Scegliere `LM Studio`, quindi selezionare un modello alla richiesta `Default model`.

    In una nuova configurazione guidata, OpenClaw interroga innanzitutto `/api/v1/models` sull'host
    LM Studio predefinito o configurato. Un LLM esistente viene proposto tramite la
    stessa sequenza di configurazione CLI/macOS e verificato con un completamento reale prima che la relativa
    configurazione venga salvata. Il controllo automatico non scarica mai un modello e
    ignora le voci del catalogo destinate esclusivamente agli embedding.

  </Step>
</Steps>

Per cambiare in seguito il modello predefinito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli di LM Studio usano un formato `author/model-name` (ad esempio `qwen/qwen3.5-9b`); i riferimenti ai modelli di OpenClaw
antepongono il provider: `lmstudio/qwen/qwen3.5-9b`. Per trovare la chiave esatta di un modello, eseguire il
comando seguente e controllare il campo `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Configurazione iniziale non interattiva

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

In alternativa, specificare esplicitamente l'URL di base, il modello e la chiave API:

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
il prefisso del provider `lmstudio/`. Passare `--lmstudio-api-key` (oppure impostare `LM_API_TOKEN`) per i server autenticati;
ometterlo per i server non autenticati e OpenClaw memorizzerà invece un indicatore locale non segreto.
`--custom-api-key` è ancora accettato per compatibilità, ma è preferibile `--lmstudio-api-key`.

Questa operazione scrive `models.providers.lmstudio` e imposta il modello predefinito su `lmstudio/<custom-model-id>`.
Se si fornisce una chiave API, viene scritto anche il profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può inoltre richiedere una lunghezza preferita del contesto di caricamento e applicarla a tutti
i modelli rilevati che salva nella configurazione.

## Configurazione

### Compatibilità dell'utilizzo in streaming

LM Studio non emette sempre un oggetto `usage` nel formato OpenAI nelle risposte in streaming. OpenClaw
recupera invece i conteggi dei token dai metadati in stile llama.cpp `timings.prompt_n` / `timings.predicted_n`.
Qualsiasi endpoint compatibile con OpenAI risolto come endpoint locale (host loopback) utilizza lo stesso
meccanismo alternativo, che copre altri backend locali come vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
e text-generation-webui.

### Compatibilità del ragionamento

Quando il rilevamento `/api/v1/models` di LM Studio segnala opzioni di ragionamento specifiche del modello, OpenClaw
espone i valori `reasoning_effort` corrispondenti (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) nei
metadati di compatibilità del modello. Alcune build di LM Studio presentano un'opzione binaria nell'interfaccia utente (`allowed_options: ["off",
"on"]`) ma rifiutano tali valori letterali in `/v1/chat/completions`; OpenClaw normalizza questa
forma binaria nella scala a sei livelli prima di inviare le richieste, anche per le configurazioni salvate meno recenti che
contengono ancora le mappe di ragionamento `off`/`on`.

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
precarica i modelli tramite l'endpoint di caricamento nativo di LM Studio, il che risulta utile quando JIT è
disabilitato. Per affidare invece a JIT, al TTL di inattività e all'espulsione automatica di LM Studio la gestione del ciclo di vita dei modelli,
disabilitare il passaggio di precaricamento di OpenClaw:

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

Utilizzare l'indirizzo raggiungibile dell'host LM Studio, mantenere `/v1` e assicurarsi che LM Studio sia associato a un'interfaccia
diversa da quella di loopback sul computer:

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

`lmstudio` considera automaticamente attendibile l'endpoint configurato per le richieste ai modelli, inclusi gli host loopback,
LAN e tailnet (ad eccezione delle origini di metadati/link-local). Qualsiasi voce di provider personalizzato/locale compatibile con OpenAI
ottiene lo stesso livello di attendibilità per l'origine esatta. Le richieste a un host privato o a una porta differenti richiedono comunque
`models.providers.<id>.request.allowPrivateNetwork: true`; impostarlo su `false` per disattivare
l'attendibilità predefinita.

## Risoluzione dei problemi

### LM Studio non rilevato

Assicurarsi che LM Studio sia in esecuzione:

```bash
lms server start --port 1234
```

Se l'autenticazione è abilitata, impostare anche `LM_API_TOKEN`. Verificare che l'API sia raggiungibile:

```bash
curl http://localhost:1234/api/v1/models
```

### Errori di autenticazione (HTTP 401)

- Verificare che `LM_API_TOKEN` corrisponda alla chiave configurata in LM Studio.
- Consultare [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se il server non richiede l'autenticazione, lasciare vuota la chiave durante la configurazione.

## Correlati

- [Selezione del modello](/it/concepts/model-providers)
- [Ollama](/it/providers/ollama)
- [Modelli locali](/it/gateway/local-models)
