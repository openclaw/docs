---
read_when:
    - Vuoi eseguire OpenClaw usando un server inferrs locale
    - Stai esponendo Gemma o un altro modello tramite inferrs
    - Sono necessari i flag di compatibilità esatti di OpenClaw per inferrs
summary: Esegui OpenClaw tramite inferrs (server locale compatibile con OpenAI)
title: Inferisce
x-i18n:
    generated_at: "2026-05-10T19:49:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs) può servire modelli locali dietro un'API `/v1` compatibile con OpenAI. OpenClaw funziona con `inferrs` tramite il percorso generico `openai-completions`.

| Proprietà          | Valore                                                             |
| ------------------ | ------------------------------------------------------------------ |
| ID provider        | `inferrs` (personalizzato; configura in `models.providers.inferrs`) |
| Plugin             | nessuno — `inferrs` non è un provider plugin OpenClaw incluso      |
| Variabile env auth | Facoltativa. Qualsiasi valore funziona se il server inferrs non ha auth |
| API                | compatibile con OpenAI (`openai-completions`)                      |
| URL base suggerito | `http://127.0.0.1:8080/v1` (o dovunque risieda il server inferrs) |

<Note>
  Al momento è meglio trattare `inferrs` come backend autogestito personalizzato compatibile con OpenAI, non come provider plugin OpenClaw dedicato. Lo configuri tramite `models.providers.inferrs` anziché tramite un flag di scelta di onboarding. Se ti serve un vero Plugin incluso con rilevamento automatico, consulta [SGLang](/it/providers/sglang) o [vLLM](/it/providers/vllm).
</Note>

## Introduzione

<Steps>
  <Step title="Avvia inferrs con un modello">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifica che il server sia raggiungibile">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Aggiungi una voce provider OpenClaw">
    Aggiungi una voce provider esplicita e punta il tuo modello predefinito a essa. Consulta l'esempio di configurazione completo qui sotto.
  </Step>
</Steps>

## Esempio di configurazione completo

Questo esempio usa Gemma 4 su un server `inferrs` locale.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Avvio on demand

Inferrs può anche essere avviato da OpenClaw solo quando viene selezionato un modello `inferrs/...`. Aggiungi `localService` alla stessa voce provider:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` deve essere assoluto. Usa `which inferrs` sull'host Gateway e inserisci quel percorso nella configurazione. Per il riferimento completo dei campi, consulta [Servizi di modelli locali](/it/gateway/local-model-services).

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Perché requiresStringContent è importante">
    Alcune route Chat Completions di `inferrs` accettano solo `messages[].content` come stringa, non array strutturati di parti di contenuto.

    <Warning>
    Se le esecuzioni OpenClaw falliscono con un errore come:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    imposta `compat.requiresStringContent: true` nella voce del modello.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw appiattirà le parti di contenuto di solo testo in stringhe semplici prima di inviare la richiesta.

  </Accordion>

  <Accordion title="Avvertenza su Gemma e schema degli strumenti">
    Alcune combinazioni attuali di `inferrs` + Gemma accettano piccole richieste dirette a `/v1/chat/completions`, ma falliscono ancora nei turni completi del runtime agente OpenClaw.

    Se succede, prova prima questo:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Questo disabilita la superficie dello schema degli strumenti di OpenClaw per il modello e può ridurre la pressione del prompt su backend locali più rigidi.

    Se le piccole richieste dirette continuano a funzionare ma i normali turni agente OpenClaw continuano a bloccarsi dentro `inferrs`, il problema restante è di solito il comportamento del modello/server upstream anziché il livello di trasporto di OpenClaw.

  </Accordion>

  <Accordion title="Smoke test manuale">
    Dopo la configurazione, testa entrambi i livelli:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Se il primo comando funziona ma il secondo fallisce, controlla la sezione di risoluzione dei problemi qui sotto.

  </Accordion>

  <Accordion title="Comportamento in stile proxy">
    `inferrs` viene trattato come backend `/v1` compatibile con OpenAI in stile proxy, non come endpoint OpenAI nativo.

    - La formattazione delle richieste solo per OpenAI nativo non si applica qui
    - Nessun `service_tier`, nessun `store` Responses, nessun suggerimento di cache del prompt e nessuna formattazione del payload di compatibilità con il reasoning OpenAI
    - Gli header di attribuzione OpenClaw nascosti (`originator`, `version`, `User-Agent`) non vengono iniettati sugli URL base `inferrs` personalizzati

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="curl /v1/models fallisce">
    `inferrs` non è in esecuzione, non è raggiungibile o non è associato all'host/porta previsto. Assicurati che il server sia avviato e in ascolto sull'indirizzo che hai configurato.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Imposta `compat.requiresStringContent: true` nella voce del modello. Consulta la sezione `requiresStringContent` sopra per i dettagli.
  </Accordion>

  <Accordion title="Le chiamate dirette a /v1/chat/completions riescono ma openclaw infer model run fallisce">
    Prova a impostare `compat.supportsTools: false` per disabilitare la superficie dello schema degli strumenti. Consulta l'avvertenza sullo schema degli strumenti di Gemma sopra.
  </Accordion>

  <Accordion title="inferrs continua a bloccarsi su turni agente più grandi">
    Se OpenClaw non riceve più errori di schema ma `inferrs` continua a bloccarsi su turni agente più grandi, trattalo come una limitazione upstream di `inferrs` o del modello. Riduci la pressione del prompt oppure passa a un backend locale o modello diverso.
  </Accordion>
</AccordionGroup>

<Tip>
Per assistenza generale, consulta [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Esecuzione di OpenClaw con server di modelli locali.
  </Card>
  <Card title="Servizi di modelli locali" href="/it/gateway/local-model-services" icon="play">
    Avvio on demand di server di modelli locali per provider configurati.
  </Card>
  <Card title="Risoluzione dei problemi Gateway" href="/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debug di backend locali compatibili con OpenAI che superano le sonde ma falliscono nelle esecuzioni agente.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti dei modelli e comportamento di failover.
  </Card>
</CardGroup>
