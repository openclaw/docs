---
read_when:
    - Vuoi eseguire OpenClaw contro un server SGLang locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con SGLang (server self-hosted compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T08:35:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang può servire modelli open-source tramite un'API HTTP **compatibile con OpenAI**.
OpenClaw può connettersi a SGLang usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da SGLang quando attivi
questa modalità con `SGLANG_API_KEY` (qualsiasi valore funziona se il tuo server non impone autenticazione)
e non definisci una voce esplicita `models.providers.sglang`.

OpenClaw tratta `sglang` come un provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'utilizzo in streaming, così i conteggi dei token di stato/contesto possono aggiornarsi dalle risposte `stream_options.include_usage`.

## Per iniziare

<Steps>
  <Step title="Avvia SGLang">
    Avvia SGLang con un server compatibile con OpenAI. Il tuo URL base deve esporre
    endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). SGLang
    in genere gira su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Imposta una chiave API">
    Qualsiasi valore funziona se sul tuo server non è configurata autenticazione:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Esegui l'onboarding o imposta direttamente un modello">
    ```bash
    openclaw onboard
    ```

    Oppure configura manualmente il modello:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Rilevamento dei modelli (provider implicito)

Quando `SGLANG_API_KEY` è impostato (oppure esiste un profilo di autenticazione) e **non**
definisci `models.providers.sglang`, OpenClaw interrogherà:

- `GET http://127.0.0.1:30000/v1/models`

e convertirà gli ID restituiti in voci modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, il rilevamento automatico viene saltato e
devi definire manualmente i modelli.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang gira su host/porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il tuo server richiede una vera chiave API (oppure vuoi controllare gli header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modello SGLang locale",
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

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento in stile proxy">
    SGLang viene trattato come un backend `/v1` compatibile con OpenAI in stile proxy, non come
    un endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |----------|--------|
    | Model shaping solo OpenAI | Non applicato |
    | `service_tier`, `store` di Responses, hint per prompt-cache | Non inviati |
    | Payload shaping di compatibilità con il reasoning | Non applicato |
    | Header nascosti di attribuzione (`originator`, `version`, `User-Agent`) | Non iniettati su URL base SGLang personalizzati |

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di autenticazione**

    Se le richieste falliscono con errori di autenticazione, imposta un vero `SGLANG_API_KEY` che corrisponda
    alla configurazione del tuo server, oppure configura esplicitamente il provider sotto
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per attivare il rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le voci provider.
  </Card>
</CardGroup>
