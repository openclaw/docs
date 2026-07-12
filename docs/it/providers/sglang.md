---
read_when:
    - Vuoi eseguire OpenClaw con un server SGLang locale
    - Vuoi endpoint `/v1` compatibili con OpenAI per i tuoi modelli
summary: Esegui OpenClaw con SGLang (server self-hosted compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T07:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang distribuisce modelli open-weight tramite un'API HTTP compatibile con OpenAI. OpenClaw si connette a SGLang utilizzando la famiglia di provider `openai-completions`, con rilevamento automatico dei modelli disponibili.

| Proprietà                       | Valore                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| ID del provider                 | `sglang`                                                             |
| Plugin                          | incluso, `enabledByDefault: true`                                    |
| Variabile di ambiente di autenticazione | `SGLANG_API_KEY` (qualsiasi valore non vuoto se il server non richiede autenticazione) |
| Flag di configurazione iniziale | `--auth-choice sglang`                                               |
| API                             | compatibile con OpenAI (`openai-completions`)                        |
| URL di base predefinito         | `http://127.0.0.1:30000/v1`                                         |
| Segnaposto del modello predefinito | `sglang/Qwen/Qwen3-8B`                                            |
| Utilizzo dello streaming        | Sì (`supportsStreamingUsage: true`)                                  |
| Prezzi                          | Contrassegnato come esterno gratuito (`modelPricing.external: false`) |

OpenClaw inoltre **rileva automaticamente** i modelli disponibili da SGLang quando si aderisce impostando `SGLANG_API_KEY`. Usa `sglang/*` in `agents.defaults.models` per mantenere dinamico il rilevamento quando configuri anche un URL di base SGLang personalizzato. Consulta [Rilevamento dei modelli (provider implicito)](#model-discovery-implicit-provider) più avanti.

## Per iniziare

<Steps>
  <Step title="Avvia SGLang">
    Avvia SGLang con un server compatibile con OpenAI. L'URL di base deve esporre
    gli endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). SGLang
    viene comunemente eseguito su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Imposta una chiave API">
    Qualsiasi valore è valido se sul server non è configurata l'autenticazione:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Esegui la configurazione iniziale o imposta direttamente un modello">
    ```bash
    openclaw onboard
    ```

    In alternativa, configura manualmente il modello:

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

Quando `SGLANG_API_KEY` è impostata (o esiste un profilo di autenticazione) e **non**
definisci `models.providers.sglang`, OpenClaw interroga:

- `GET http://127.0.0.1:30000/v1/models`

e converte gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, per impostazione predefinita OpenClaw usa i
modelli dichiarati. Aggiungi `"sglang/*": {}` a `agents.defaults.models` quando
vuoi che OpenClaw interroghi l'endpoint `/models` del provider configurato e includa
tutti i modelli SGLang pubblicizzati.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- SGLang viene eseguito su un host o una porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il server richiede una chiave API reale (o vuoi controllare le intestazioni).

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
    SGLang viene trattato come un backend `/v1` in stile proxy compatibile con OpenAI, non come un
    endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |---------------|--------|
    | Formattazione delle richieste esclusiva di OpenAI | Non applicata |
    | `service_tier`, `store` di Responses, suggerimenti per la cache dei prompt | Non inviati |
    | Formattazione del payload per la compatibilità del ragionamento | Non applicata |
    | Intestazioni di attribuzione nascoste (`originator`, `version`, `User-Agent`) | Non inserite negli URL di base SGLang personalizzati |

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di autenticazione**

    Se le richieste non riescono a causa di errori di autenticazione, imposta una `SGLANG_API_KEY` reale che corrisponda
    alla configurazione del server oppure configura esplicitamente il provider in
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per aderire al rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le voci dei provider.
  </Card>
</CardGroup>
