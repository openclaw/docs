---
read_when:
    - Vuoi eseguire OpenClaw con un server SGLang locale
    - Vuoi endpoint /v1 compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con SGLang (server ospitato autonomamente compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang serve modelli open-weight tramite un'API HTTP compatibile con OpenAI. OpenClaw si connette a SGLang usando la famiglia di provider `openai-completions` con rilevamento automatico dei modelli disponibili.

| Proprietà                 | Valore                                                       |
| ------------------------- | ------------------------------------------------------------ |
| ID provider               | `sglang`                                                     |
| Plugin                    | incluso, `enabledByDefault: true`                            |
| Variabile env di auth     | `SGLANG_API_KEY` (qualsiasi valore non vuoto se il server non ha auth) |
| Flag di onboarding        | `--auth-choice sglang`                                       |
| API                       | compatibile con OpenAI (`openai-completions`)                |
| URL di base predefinito   | `http://127.0.0.1:30000/v1`                                  |
| Segnaposto modello predefinito | `sglang/Qwen/Qwen3-8B`                                  |
| Uso dello streaming       | Sì (`supportsStreamingUsage: true`)                          |
| Prezzi                    | Contrassegnato come esterno gratuito (`modelPricing.external: false`) |

OpenClaw **rileva automaticamente** anche i modelli disponibili da SGLang quando aderisci impostando `SGLANG_API_KEY`. Usa `sglang/*` in `agents.defaults.models` per mantenere dinamico il rilevamento quando configuri anche un URL di base SGLang personalizzato. Vedi [Rilevamento dei modelli (provider implicito)](#model-discovery-implicit-provider) sotto.

## Per iniziare

<Steps>
  <Step title="Start SGLang">
    Avvia SGLang con un server compatibile con OpenAI. Il tuo URL di base dovrebbe esporre
    endpoint `/v1` (per esempio `/v1/models`, `/v1/chat/completions`). SGLang
    viene comunemente eseguito su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Set an API key">
    Qualsiasi valore funziona se sul server non è configurata auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Run onboarding or set a model directly">
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

Quando `SGLANG_API_KEY` è impostato (o esiste un profilo auth) e **non**
definisci `models.providers.sglang`, OpenClaw interrogherà:

- `GET http://127.0.0.1:30000/v1/models`

e convertirà gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, OpenClaw usa per impostazione predefinita
i modelli che hai dichiarato. Aggiungi `"sglang/*": {}` a `agents.defaults.models` quando
vuoi che OpenClaw interroghi l'endpoint `/models` di quel provider configurato e includa
tutti i modelli SGLang pubblicizzati.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang viene eseguito su un host/porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il tuo server richiede una vera chiave API (o vuoi controllare gli header).

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
            name: "Local SGLang Model",
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
  <Accordion title="Proxy-style behavior">
    SGLang viene trattato come backend `/v1` compatibile con OpenAI in stile proxy, non come
    endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |----------|--------|
    | Modellazione delle richieste solo OpenAI | Non applicata |
    | `service_tier`, Responses `store`, suggerimenti prompt-cache | Non inviati |
    | Modellazione del payload compatibile con il reasoning | Non applicata |
    | Header di attribuzione nascosti (`originator`, `version`, `User-Agent`) | Non iniettati sugli URL di base SGLang personalizzati |

  </Accordion>

  <Accordion title="Troubleshooting">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di auth**

    Se le richieste falliscono con errori di auth, imposta una vera `SGLANG_API_KEY` che corrisponda
    alla configurazione del tuo server, oppure configura esplicitamente il provider sotto
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per aderire al rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le voci provider.
  </Card>
</CardGroup>
