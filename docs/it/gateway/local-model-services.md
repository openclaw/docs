---
read_when:
    - Vuoi che OpenClaw avvii un server di modelli locale solo quando è selezionato come provider del modello o degli embedding
    - Esegui ds4, inferrs, vLLM, llama.cpp, MLX o un altro server locale compatibile con OpenAI
    - Devi controllare l'avvio a freddo, lo stato di disponibilità e l'arresto per inattività dei provider locali
summary: Avvia server di modelli locali su richiesta prima delle richieste di modelli ed embedding di OpenClaw
title: Servizi di modelli locali
x-i18n:
    generated_at: "2026-07-12T07:03:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` avvia su richiesta un server locale di modelli gestito dal provider. Quando una richiesta di modello o di embedding seleziona quel provider, OpenClaw verifica l'endpoint di integrità, avvia il processo se non è in esecuzione, attende che sia pronto e quindi invia la richiesta. Usalo per evitare di mantenere in esecuzione tutto il giorno costosi server locali.

## Funzionamento

1. Una richiesta di modello o di embedding viene risolta in un provider configurato.
2. Se tale provider dispone di `localService`, OpenClaw verifica `healthUrl`.
3. Se la verifica ha esito positivo, OpenClaw utilizza il server già in esecuzione.
4. Se la verifica ha esito negativo, OpenClaw avvia `command` con `args`.
5. OpenClaw interroga periodicamente l'endpoint di integrità fino alla scadenza di `readyTimeoutMs`.
6. La richiesta viene inoltrata tramite il normale trasporto per modelli o embedding.
7. Se OpenClaw ha avviato il processo ed è impostato `idleStopMs`, arresta il processo quando, dopo l'ultima richiesta in corso, è trascorso il periodo di inattività specificato.

A questo scopo OpenClaw non installa launchd, systemd, Docker né alcun demone. Il server è un normale processo figlio del processo OpenClaw che ne ha avuto bisogno per primo.

L'avvio viene serializzato per ciascun provider configurato e ciascun insieme di comando, argomenti e variabili di ambiente, quindi richieste simultanee di chat ed embedding per lo stesso servizio non avviano server duplicati. Ogni richiesta mantiene la propria concessione fino al completamento della gestione della risposta, pertanto l'arresto per inattività attende la conclusione di tutte le richieste di modello ed embedding in corso. Gli alias dei provider configurati rimangono distinti: due alias possono puntare a host GPU diversi senza essere accorpati sotto lo stesso ID dell'adattatore Ollama, LM Studio o compatibile con OpenAI.

Se un altro processo OpenClaw dispone già di un server integro allo stesso `healthUrl`, questo processo lo riutilizza senza prenderlo in gestione (ogni processo gestisce esclusivamente il processo figlio che ha avviato personalmente). I log di avvio e uscita includono porzioni finali limitate e oscurate dell'output del processo figlio, oltre a dettagli sulle tempistiche e sull'uscita; i valori delle variabili di ambiente configurate non vengono mai riportati.

## Struttura della configurazione

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Imposta `timeoutSeconds` nella voce del provider (non in `localService`), affinché avvii a freddo lenti e generazioni prolungate non raggiungano il timeout predefinito delle richieste di modello. Imposta esplicitamente `healthUrl` quando il server espone lo stato di disponibilità in un percorso diverso da `/models` nell'URL di base.

## Campi

| Campo            | Obbligatorio | Descrizione                                                                                                                               |
| ---------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | sì           | Percorso assoluto dell'eseguibile. Nessuna ricerca nel PATH della shell.                                                                  |
| `args`           | no           | Argomenti del processo. Nessuna espansione della shell, pipe, globbing o interpretazione delle virgolette.                                |
| `cwd`            | no           | Directory di lavoro del processo.                                                                                                         |
| `env`            | no           | Variabili di ambiente unite a quelle dell'ambiente del processo OpenClaw, con precedenza su queste ultime.                                |
| `healthUrl`      | no           | URL di disponibilità. Il valore predefinito è `baseUrl` con l'aggiunta di `/models` (`http://127.0.0.1:8000/v1` diventa `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | no           | Scadenza per la disponibilità all'avvio. Valore predefinito: `120000`.                                                                    |
| `idleStopMs`     | no           | Ritardo di arresto per inattività di un processo avviato da OpenClaw. `0` o l'omissione del campo lo mantiene in esecuzione fino all'uscita di OpenClaw. |

## Esempio con Inferrs

Inferrs è un backend `/v1` personalizzato compatibile con OpenAI, quindi la stessa API `localService` funziona con una voce provider `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Sostituisci `command` con il risultato di `which inferrs` sulla macchina che esegue OpenClaw. Configurazione completa di inferrs: [Inferrs](/it/providers/inferrs).

## Esempio con ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Configurazione completa, dimensionamento del contesto e comandi di verifica: [ds4](/it/providers/ds4).

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Configurazione dei modelli locali, scelta dei provider e indicazioni di sicurezza.
  </Card>
  <Card title="Inferrs" href="/it/providers/inferrs" icon="cpu">
    Esegui OpenClaw tramite il server locale inferrs compatibile con OpenAI.
  </Card>
</CardGroup>
