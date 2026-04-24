---
read_when:
    - "Vuoi eseguire OpenClaw contro un server vLLM locale\tRTLUanalysis to=final code:  true"
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Eseguire OpenClaw con vLLM (server locale compatibile con OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T08:59:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM può servire modelli open-source (e alcuni modelli personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si connette a vLLM usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da vLLM quando fai opt-in con `VLLM_API_KEY` (qualsiasi valore va bene se il tuo server non applica auth) e non definisci una voce esplicita `models.providers.vllm`.

OpenClaw tratta `vllm` come provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'usage in streaming, così i conteggi di stato/contesto dei token possono aggiornarsi dalle risposte `stream_options.include_usage`.

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| ID provider      | `vllm`                                   |
| API              | `openai-completions` (compatibile con OpenAI) |
| Auth             | variabile d'ambiente `VLLM_API_KEY`      |
| Base URL predefinito | `http://127.0.0.1:8000/v1`            |

## Per iniziare

<Steps>
  <Step title="Avvia vLLM con un server compatibile con OpenAI">
    Il tuo base URL dovrebbe esporre endpoint `/v1` (per esempio `/v1/models`, `/v1/chat/completions`). vLLM gira comunemente su:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Imposta la variabile d'ambiente della chiave API">
    Qualsiasi valore va bene se il tuo server non applica auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleziona un modello">
    Sostituisci con uno dei tuoi ID modello vLLM:

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

Usa una configurazione esplicita quando:

- vLLM gira su un host o una porta diversi
- vuoi fissare i valori di `contextWindow` o `maxTokens`
- il tuo server richiede una vera chiave API (oppure vuoi controllare gli header)

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
            name: "Local vLLM Model",
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
    vLLM viene trattato come backend `/v1` compatibile con OpenAI in stile proxy, non come endpoint
    OpenAI nativo. Questo significa:

    | Behavior | Applied? |
    |----------|----------|
    | Request shaping nativo OpenAI | No |
    | `service_tier` | Non inviato |
    | `store` di Responses | Non inviato |
    | Suggerimenti di prompt-cache | Non inviati |
    | Payload shaping di compatibilità OpenAI per il reasoning | Non applicato |
    | Header di attribuzione nascosti di OpenClaw | Non iniettati su base URL personalizzati |

  </Accordion>

  <Accordion title="Base URL personalizzato">
    Se il tuo server vLLM gira su host o porta non predefiniti, imposta `baseUrl` nella configurazione esplicita del provider:

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
                name: "Remote vLLM Model",
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

    Se vedi un errore di connessione, verifica host, porta e che vLLM sia stato avviato in modalità server compatibile con OpenAI.

  </Accordion>

  <Accordion title="Errori auth sulle richieste">
    Se le richieste falliscono con errori auth, imposta una vera `VLLM_API_KEY` che corrisponda alla configurazione del tuo server, oppure configura esplicitamente il provider sotto `models.providers.vllm`.

    <Tip>
    Se il tuo server vLLM non applica auth, qualsiasi valore non vuoto per `VLLM_API_KEY` funziona come segnale di opt-in per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello rilevato">
    Il rilevamento automatico richiede che `VLLM_API_KEY` sia impostato **e** che non esista una voce di configurazione esplicita `models.providers.vllm`. Se hai definito manualmente il provider, OpenClaw salta il rilevamento e usa solo i modelli da te dichiarati.
  </Accordion>
</AccordionGroup>

<Warning>
Per ulteriore aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Provider OpenAI nativo e comportamento del percorso compatibile con OpenAI.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riuso delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
