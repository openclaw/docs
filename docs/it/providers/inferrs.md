---
read_when:
    - Vuoi eseguire OpenClaw con un server inferrs locale
    - Stai servendo Gemma o un altro modello tramite inferrs
    - Ti servono i flag di compatibilità esatti di OpenClaw per inferrs
summary: Esegui OpenClaw tramite inferrs (server locale compatibile con OpenAI)
title: Deduce
x-i18n:
    generated_at: "2026-07-12T07:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) espone modelli locali tramite un'API `/v1` compatibile con OpenAI. OpenClaw comunica con essa tramite l'adattatore generico `openai-completions`.

| Proprietà          | Valore                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| ID del provider    | `inferrs` (personalizzato; configurare in `models.providers.inferrs`)                |
| Plugin             | nessuno — non è un Plugin provider incluso in OpenClaw                              |
| Variabile env auth | nessuna richiesta; qualsiasi valore funziona se il server inferrs non richiede auth |
| API                | compatibile con OpenAI (`openai-completions`)                                       |
| URL base suggerito | `http://127.0.0.1:8080/v1` (o l'indirizzo su cui è in ascolto il server inferrs)     |

<Note>
  `inferrs` è un backend personalizzato, self-hosted e compatibile con OpenAI, non un Plugin provider dedicato di OpenClaw: va configurato in `models.providers.inferrs` invece di selezionare un'opzione di autenticazione durante la configurazione iniziale. Per un Plugin incluso con rilevamento automatico, consultare [SGLang](/it/providers/sglang) o [vLLM](/it/providers/vllm).
</Note>

## Guida introduttiva

<Steps>
  <Step title="Avviare inferrs con un modello">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verificare che il server sia raggiungibile">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Aggiungere una voce provider di OpenClaw">
    Aggiungere una voce esplicita per il provider e impostarla come destinazione del modello predefinito. Consultare l'esempio di configurazione seguente.
  </Step>
</Steps>

## Esempio di configurazione completa

Gemma 4 su un server `inferrs` locale:

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

## Avvio su richiesta

OpenClaw può avviare autonomamente `inferrs` solo quando viene selezionato un modello `inferrs/...`. Aggiungere `localService` alla stessa voce del provider:

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

`command` deve essere un percorso assoluto. Eseguire `which inferrs` sull'host del Gateway e utilizzare il percorso restituito. Riferimento completo dei campi: [Servizi per modelli locali](/it/gateway/local-model-services).

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Perché requiresStringContent è importante">
    Alcune route Chat Completions di `inferrs` accettano solo valori stringa in `messages[].content`, non array strutturati di parti del contenuto.

    <Warning>
    Se le esecuzioni di OpenClaw non riescono e mostrano:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    impostare `compat.requiresStringContent: true` nella voce del modello. OpenClaw convertirà quindi le parti contenenti solo testo in semplici stringhe prima di inviare la richiesta.
    </Warning>

  </Accordion>

  <Accordion title="Avvertenza su Gemma e sullo schema degli strumenti">
    Alcune combinazioni di `inferrs` e Gemma accettano piccole richieste dirette a `/v1/chat/completions`, ma non riescono a gestire turni completi del runtime dell'agente OpenClaw. Provare innanzitutto a disabilitare lo schema degli strumenti:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Ciò riduce il carico del prompt sui backend locali più restrittivi. Se le piccole richieste dirette continuano a funzionare, ma i normali turni dell'agente OpenClaw continuano a causare arresti anomali in `inferrs`, considerare il problema una limitazione a monte del modello o del server, anziché un problema del trasporto di OpenClaw.

  </Accordion>

  <Accordion title="Test rapido manuale">
    Una volta completata la configurazione, verificare entrambi i livelli:

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

    Se il primo comando funziona ma il secondo non riesce, consultare la sezione Risoluzione dei problemi seguente.

  </Accordion>

  <Accordion title="Comportamento in stile proxy">
    Poiché `inferrs` utilizza l'adattatore generico `openai-completions` (non `openai-responses`), non viene mai applicata la formattazione delle richieste specifica delle API native di OpenAI: non vengono inviati `service_tier`, il campo `store` dell'API Responses, suggerimenti per la cache dei prompt né payload di compatibilità per il ragionamento di OpenAI.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="curl /v1/models non riesce">
    `inferrs` non è in esecuzione, non è raggiungibile oppure non è associato all'host o alla porta configurati. Verificare che il server sia avviato e in ascolto su tale indirizzo.
  </Accordion>

  <Accordion title="messages[].content richiede una stringa">
    Impostare `compat.requiresStringContent: true` nella voce del modello (vedere sopra).
  </Accordion>

  <Accordion title="Le chiamate dirette a /v1/chat/completions riescono, ma openclaw infer model run non funziona">
    Impostare `compat.supportsTools: false` per disabilitare lo schema degli strumenti (consultare l'avvertenza su Gemma riportata sopra).
  </Accordion>

  <Accordion title="inferrs continua a bloccarsi nei turni più grandi dell'agente">
    Se gli errori dello schema sono stati risolti, ma `inferrs` continua a bloccarsi nei turni più grandi dell'agente, considerare il problema una limitazione a monte di `inferrs` o del modello. Ridurre il carico del prompt oppure cambiare backend o modello.
  </Accordion>
</AccordionGroup>

<Tip>
Per assistenza generale, consultare [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Tip>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Esecuzione di OpenClaw con server di modelli locali.
  </Card>
  <Card title="Servizi per modelli locali" href="/it/gateway/local-model-services" icon="play">
    Avvio su richiesta dei server di modelli locali per i provider configurati.
  </Card>
  <Card title="Risoluzione dei problemi del Gateway" href="/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Diagnosi dei backend locali compatibili con OpenAI che superano le verifiche ma non riescono a eseguire i turni degli agenti.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
</CardGroup>
