---
read_when:
    - Vuoi eseguire OpenClaw contro un server inferrs locale
    - Stai servendo Gemma o un altro modello tramite inferrs
    - Hai bisogno dei flag di compatibilità OpenClaw esatti per inferrs
summary: Eseguire OpenClaw tramite inferrs (server locale compatibile con OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T08:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) può servire modelli locali dietro un'API
compatibile con OpenAI `/v1`. OpenClaw funziona con `inferrs` tramite il percorso generico
`openai-completions`.

Attualmente `inferrs` va trattato al meglio come backend OpenAI-compatible self-hosted personalizzato,
non come un Plugin provider OpenClaw dedicato.

## Per iniziare

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
    Aggiungi una voce provider esplicita e punta a essa il tuo modello predefinito. Vedi l'esempio completo di configurazione qui sotto.
  </Step>
</Steps>

## Esempio completo di configurazione

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

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Perché requiresStringContent è importante">
    Alcuni percorsi Chat Completions di `inferrs` accettano solo
    `messages[].content` come stringa, non array strutturati di content-part.

    <Warning>
    Se le esecuzioni di OpenClaw falliscono con un errore come:

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

    OpenClaw appiattirà i content part puramente testuali in stringhe semplici prima di inviare
    la richiesta.

  </Accordion>

  <Accordion title="Avvertenza su Gemma e sullo schema degli strumenti">
    Alcune combinazioni attuali di `inferrs` + Gemma accettano piccole richieste
    dirette `/v1/chat/completions` ma continuano a fallire sui turni completi
    del runtime agente OpenClaw.

    Se succede, prova prima questo:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Questo disabilita la superficie dello schema degli strumenti di OpenClaw per il modello e può ridurre la
    pressione del prompt sui backend locali più rigidi.

    Se le piccole richieste dirette continuano a funzionare ma i normali turni agente OpenClaw continuano a
    mandare in crash `inferrs`, il problema residuo di solito è il comportamento upstream del modello/server piuttosto che il livello di trasporto di OpenClaw.

  </Accordion>

  <Accordion title="Smoke test manuale">
    Una volta configurato, testa entrambi i livelli:

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
    `inferrs` viene trattato come backend `/v1` OpenAI-compatible in stile proxy, non come endpoint OpenAI nativo.

    - Il model shaping delle richieste riservato a OpenAI nativo non si applica qui
    - Niente `service_tier`, niente `store` di Responses, niente hint di prompt cache e niente shaping del payload reasoning-compat di OpenAI
    - Le intestazioni nascoste di attribuzione OpenClaw (`originator`, `version`, `User-Agent`)
      non vengono iniettate su base URL `inferrs` personalizzati

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="curl /v1/models fallisce">
    `inferrs` non è in esecuzione, non è raggiungibile o non è in bind su
    host/porta attesi. Assicurati che il server sia avviato e in ascolto sull'indirizzo che hai
    configurato.
  </Accordion>

  <Accordion title="messages[].content si aspetta una stringa">
    Imposta `compat.requiresStringContent: true` nella voce del modello. Consulta la
    sezione `requiresStringContent` sopra per i dettagli.
  </Accordion>

  <Accordion title="Le chiamate dirette /v1/chat/completions passano ma openclaw infer model run fallisce">
    Prova a impostare `compat.supportsTools: false` per disabilitare la superficie dello schema degli strumenti.
    Consulta sopra l'avvertenza su Gemma e sullo schema degli strumenti.
  </Accordion>

  <Accordion title="inferrs continua ad andare in crash su turni agente più grandi">
    Se OpenClaw non riceve più errori di schema ma `inferrs` continua ad andare in crash sui turni agente più grandi, trattalo come una limitazione upstream di `inferrs` o del modello. Riduci
    la pressione del prompt oppure passa a un backend locale o a un modello diverso.
  </Accordion>
</AccordionGroup>

<Tip>
Per aiuto generale, consulta [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Eseguire OpenClaw contro server di modelli locali.
  </Card>
  <Card title="Risoluzione dei problemi del Gateway" href="/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debug di backend OpenAI-compatible locali che passano i probe ma falliscono le esecuzioni dell'agente.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, model ref e comportamento di failover.
  </Card>
</CardGroup>
