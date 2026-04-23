---
read_when:
    - Vuoi eseguire OpenClaw contro un server vLLM locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Eseguire OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T08:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM può servire modelli open-source (e alcuni modelli personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si collega a vLLM usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da vLLM quando scegli questa modalità con `VLLM_API_KEY` (qualsiasi valore funziona se il tuo server non impone autenticazione) e non definisci una voce esplicita `models.providers.vllm`.

OpenClaw tratta `vllm` come un provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'utilizzo in streaming, quindi i conteggi di token di stato/contesto possono aggiornarsi dalle risposte `stream_options.include_usage`.

| Proprietà        | Valore                                   |
| ---------------- | ---------------------------------------- |
| ID provider      | `vllm`                                   |
| API              | `openai-completions` (compatibile con OpenAI) |
| Auth             | Variabile d'ambiente `VLLM_API_KEY`      |
| URL di base predefinito | `http://127.0.0.1:8000/v1`         |

## Per iniziare

<Steps>
  <Step title="Avvia vLLM con un server compatibile con OpenAI">
    Il tuo URL di base dovrebbe esporre endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). vLLM comunemente viene eseguito su:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Imposta la variabile d'ambiente della chiave API">
    Qualsiasi valore funziona se il tuo server non impone autenticazione:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleziona un modello">
    Sostituisci con uno degli ID modello del tuo vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Rilevamento dei modelli (provider implicito)

Quando `VLLM_API_KEY` è impostato (oppure esiste un profilo auth) e **non** definisci `models.providers.vllm`, OpenClaw interroga:

```
GET http://127.0.0.1:8000/v1/models
```

e converte gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.vllm`, il rilevamento automatico viene saltato e devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa la configurazione esplicita quando:

- vLLM viene eseguito su un host o una porta diversi
- Vuoi fissare i valori `contextWindow` o `maxTokens`
- Il tuo server richiede una vera chiave API (oppure vuoi controllare gli header)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modello vLLM locale",
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

## Note avanzate

<AccordionGroup>
  <Accordion title="Comportamento in stile proxy">
    vLLM viene trattato come un backend `/v1` compatibile con OpenAI in stile proxy, non come un endpoint
    OpenAI nativo. Questo significa:

    | Comportamento | Applicato? |
    |----------|----------|
    | Modellazione nativa delle richieste OpenAI | No |
    | `service_tier` | Non inviato |
    | Risposte `store` | Non inviato |
    | Hint di prompt-cache | Non inviato |
    | Modellazione del payload di compatibilità del reasoning OpenAI | Non applicata |
    | Header nascosti di attribuzione OpenClaw | Non iniettati su URL di base personalizzati |

  </Accordion>

  <Accordion title="URL di base personalizzato">
    Se il tuo server vLLM viene eseguito su un host o una porta non predefiniti, imposta `baseUrl` nella configurazione esplicita del provider:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Modello vLLM remoto",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Server non raggiungibile">
    Controlla che il server vLLM sia in esecuzione e accessibile:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se vedi un errore di connessione, verifica host, porta e che vLLM sia stato avviato con la modalità server compatibile con OpenAI.

  </Accordion>

  <Accordion title="Errori di autenticazione sulle richieste">
    Se le richieste falliscono con errori di autenticazione, imposta una vera `VLLM_API_KEY` che corrisponda alla configurazione del tuo server, oppure configura il provider esplicitamente sotto `models.providers.vllm`.

    <Tip>
    Se il tuo server vLLM non impone autenticazione, qualsiasi valore non vuoto per `VLLM_API_KEY` funziona come segnale di adesione per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello rilevato">
    Il rilevamento automatico richiede che `VLLM_API_KEY` sia impostato **e** che non esista una voce di configurazione esplicita `models.providers.vllm`. Se hai definito manualmente il provider, OpenClaw salta il rilevamento e usa solo i modelli dichiarati.
  </Accordion>
</AccordionGroup>

<Warning>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Provider OpenAI nativo e comportamento del percorso compatibile con OpenAI.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
