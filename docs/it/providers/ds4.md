---
read_when:
    - Vuoi eseguire OpenClaw con antirez/ds4
    - Vuoi un backend locale DeepSeek V4 Flash con chiamate agli strumenti
    - Ti serve la configurazione di OpenClaw per ds4-server
summary: Esegui OpenClaw tramite ds4, un server locale compatibile con OpenAI per DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T07:24:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) esegue DeepSeek V4 Flash tramite un backend
Metal locale con un'API `/v1` compatibile con OpenAI. OpenClaw si connette a ds4
tramite la famiglia di provider generica `openai-completions`.

ds4 non è un Plugin provider incluso in OpenClaw. Configuralo in
`models.providers.ds4`, quindi seleziona `ds4/deepseek-v4-flash`.

| Proprietà   | Valore                                                    |
| ----------- | --------------------------------------------------------- |
| ID provider | `ds4`                                                     |
| Plugin      | nessuno (solo configurazione)                             |
| API         | Chat Completions compatibile con OpenAI (`openai-completions`) |
| URL di base | `http://127.0.0.1:18000/v1` (consigliato)                 |
| ID modello  | `deepseek-v4-flash`                                       |
| Chiamate agli strumenti | `tools` / `tool_calls` in stile OpenAI        |
| Ragionamento | `thinking` e `reasoning_effort` in stile DeepSeek        |

## Requisiti

- macOS con supporto Metal.
- Un checkout ds4 funzionante con `ds4-server` e il file GGUF di DeepSeek V4 Flash.
- Memoria sufficiente per il contesto scelto; valori `--ctx` maggiori allocano più
  memoria KV all'avvio del server.

<Warning>
I turni dell'agente OpenClaw includono gli schemi degli strumenti e il contesto dell'area di lavoro. Un contesto
ridotto come `--ctx 4096` può superare i test curl diretti ma non riuscire a completare le esecuzioni dell'agente con
`500 prompt exceeds context`. Usa almeno `--ctx 32768` per i test di base dell'agente e degli strumenti.
Usa `--ctx 393216` solo con memoria sufficiente e per abilitare Think Max di ds4.
</Warning>

## Avvio rapido

<Steps>
  <Step title="Start ds4-server">
    Sostituisci `<DS4_DIR>` con il percorso del checkout ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    La risposta dovrebbe includere `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Aggiungi la configurazione indicata in [Configurazione completa](#full-config), quindi esegui un controllo
    singolo del modello:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Configurazione completa

Usa questa configurazione quando ds4 è già in esecuzione su `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Mantieni `contextWindow` allineato con `ds4-server --ctx`. Mantieni `maxTokens` allineato
con `--tokens`, a meno che tu non voglia intenzionalmente che OpenClaw richieda un output inferiore
rispetto al valore predefinito del server.

## Avvio su richiesta

OpenClaw può avviare ds4 solo quando viene selezionato un modello `ds4/...`. Aggiungi
`localService` alla stessa voce del provider:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` deve essere un percorso assoluto a un eseguibile. La ricerca tramite shell e l'espansione di `~`
non vengono utilizzate. Consulta [Servizi per modelli locali](/it/gateway/local-model-services) per
tutti i campi di `localService`.

## Think Max

ds4 applica Think Max solo quando entrambe le condizioni sono vere:

- `ds4-server` viene avviato con `--ctx 393216` o un valore superiore.
- La richiesta usa `reasoning_effort: "max"` (o il campo equivalente di ds4 per il livello di ragionamento).

Se esegui un contesto così ampio, aggiorna sia i flag del server sia i metadati del modello
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Test

Controllo HTTP diretto, senza passare da OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Instradamento del modello OpenClaw (uguale al controllo dell'avvio rapido):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Test di base completo dell'agente e delle chiamate agli strumenti, con un contesto di almeno 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Risultato previsto:

- `executionTrace.winnerProvider` è `ds4`
- `executionTrace.winnerModel` è `deepseek-v4-flash`
- `toolSummary.calls` è almeno `1`
- `finalAssistantVisibleText` inizia con `tool-ok`

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 non è in esecuzione oppure non è associato all'host o alla porta indicati in `baseUrl`. Avvia
    `ds4-server`, quindi riprova:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Il valore `--ctx` configurato è troppo piccolo per il turno di OpenClaw. Aumenta
    `ds4-server --ctx`, quindi aggiorna `models.providers.ds4.models[].contextWindow`
    in modo che corrisponda. I turni completi dell'agente con gli strumenti richiedono molto più contesto rispetto a una
    richiesta curl diretta con un singolo messaggio.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 usa Think Max solo quando `--ctx` è almeno `393216` e la richiesta
    specifica `reasoning_effort: "max"`. Con contesti più piccoli viene usato il livello di ragionamento
    alto.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 presenta una fase iniziale di caricamento a freddo in Metal e di riscaldamento del modello. Imposta
    `localService.readyTimeoutMs: 300000` quando OpenClaw avvia il server su
    richiesta.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Local model services" href="/it/gateway/local-model-services" icon="play">
    Avvia i server dei modelli locali su richiesta prima delle richieste ai modelli.
  </Card>
  <Card title="Local models" href="/it/gateway/local-models" icon="server">
    Scegli e gestisci i backend dei modelli locali.
  </Card>
  <Card title="Model providers" href="/it/concepts/model-providers" icon="layers">
    Configura i riferimenti ai provider, l'autenticazione e il failover.
  </Card>
  <Card title="DeepSeek" href="/it/providers/deepseek" icon="brain">
    Comportamento nativo del provider DeepSeek e controlli del ragionamento.
  </Card>
</CardGroup>
