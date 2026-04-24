---
read_when:
    - Vuoi eseguire OpenClaw contro un server SGLang locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli personalesizzati
summary: Esegui OpenClaw con SGLang (server self-hosted compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T08:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang può servire modelli open-source tramite un'API HTTP **compatibile con OpenAI**.
OpenClaw può collegarsi a SGLang usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da SGLang quando attivi
l'opt-in con `SGLANG_API_KEY` (qualsiasi valore funziona se il tuo server non impone autenticazione)
e non definisci una voce esplicita `models.providers.sglang`.

OpenClaw tratta `sglang` come provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'utilizzo in streaming, così i conteggi di stato/token di contesto possono aggiornarsi dalle risposte `stream_options.include_usage`.

## Per iniziare

<Steps>
  <Step title="Avvia SGLang">
    Avvia SGLang con un server compatibile con OpenAI. Il tuo base URL dovrebbe esporre
    endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). SGLang
    viene comunemente eseguito su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Imposta una chiave API">
    Qualsiasi valore funziona se sul tuo server non è configurata alcuna autenticazione:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Esegui l'onboarding o imposta direttamente un modello">
    ```bash
    openclaw onboard
    ```

    Oppure configura il modello manualmente:

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

Quando `SGLANG_API_KEY` è impostato (oppure esiste un profilo auth) e **non**
definisci `models.providers.sglang`, OpenClaw interrogherà:

- `GET http://127.0.0.1:30000/v1/models`

e convertirà gli ID restituiti in voci modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, il rilevamento automatico viene saltato e
devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang è in esecuzione su un host/porta diversi.
- Vuoi fissare valori `contextWindow`/`maxTokens`.
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
    SGLang viene trattato come backend `/v1` compatibile con OpenAI in stile proxy, non come
    endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |----------|--------|
    | Modellazione delle richieste solo OpenAI | Non applicata |
    | `service_tier`, `store` di Responses, hint di prompt-cache | Non inviati |
    | Modellazione del payload di compatibilità del reasoning | Non applicata |
    | Header di attribuzione nascosti (`originator`, `version`, `User-Agent`) | Non inseriti su base URL SGLang personalizzati |

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di autenticazione**

    Se le richieste falliscono con errori di autenticazione, imposta un vero `SGLANG_API_KEY` che corrisponda
    alla configurazione del tuo server, oppure configura esplicitamente il provider in
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per attivare il rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le voci dei provider.
  </Card>
</CardGroup>
