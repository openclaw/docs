---
read_when:
    - Vuoi eseguire OpenClaw con un server SGLang locale
    - Vuoi endpoint /v1 compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con SGLang (server ospitato autonomamente compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:06:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang serve modelli a pesi aperti tramite un'API HTTP compatibile con OpenAI. OpenClaw si connette a SGLang usando la famiglia di provider `openai-completions` con rilevamento automatico dei modelli disponibili.

| Proprietà                 | Valore                                                       |
| ------------------------- | ------------------------------------------------------------ |
| ID provider               | `sglang`                                                     |
| Plugin                    | in bundle, `enabledByDefault: true`                          |
| Variabile env di auth     | `SGLANG_API_KEY` (qualsiasi valore non vuoto se il server non ha auth) |
| Flag di onboarding        | `--auth-choice sglang`                                       |
| API                       | compatibile con OpenAI (`openai-completions`)                |
| URL base predefinito      | `http://127.0.0.1:30000/v1`                                  |
| Segnaposto modello predefinito | `sglang/Qwen/Qwen3-8B`                                  |
| Utilizzo dello streaming  | Sì (`supportsStreamingUsage: true`)                          |
| Prezzi                    | Contrassegnato come gratuito esterno (`modelPricing.external: false`) |

OpenClaw inoltre **rileva automaticamente** i modelli disponibili da SGLang quando abiliti l'opzione con `SGLANG_API_KEY` e non definisci una voce esplicita `models.providers.sglang` — consulta [Rilevamento dei modelli (provider implicito)](#model-discovery-implicit-provider) sotto.

## Per iniziare

<Steps>
  <Step title="Avvia SGLang">
    Avvia SGLang con un server compatibile con OpenAI. Il tuo URL base deve esporre
    endpoint `/v1` (per esempio `/v1/models`, `/v1/chat/completions`). SGLang
    di solito è in esecuzione su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Imposta una chiave API">
    Qualsiasi valore funziona se sul tuo server non è configurata auth:

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

Quando `SGLANG_API_KEY` è impostata (o esiste un profilo auth) e **non**
definisci `models.providers.sglang`, OpenClaw eseguirà la query:

- `GET http://127.0.0.1:30000/v1/models`

e convertirà gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, il rilevamento automatico viene saltato e
devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang è in esecuzione su host/porta diversi.
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
  <Accordion title="Comportamento in stile proxy">
    SGLang viene trattato come backend `/v1` in stile proxy compatibile con OpenAI, non come
    endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |----------|--------|
    | Modellazione delle richieste solo OpenAI | Non applicata |
    | `service_tier`, Responses `store`, suggerimenti prompt-cache | Non inviati |
    | Modellazione del payload compatibile con reasoning | Non applicata |
    | Header di attribuzione nascosti (`originator`, `version`, `User-Agent`) | Non iniettati su URL base SGLang personalizzati |

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di auth**

    Se le richieste falliscono con errori di auth, imposta una vera `SGLANG_API_KEY` che corrisponda
    alla configurazione del tuo server, oppure configura il provider esplicitamente sotto
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per abilitare il rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo incluse le voci dei provider.
  </Card>
</CardGroup>
