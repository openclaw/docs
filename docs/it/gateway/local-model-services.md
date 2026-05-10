---
read_when:
    - Vuoi che OpenClaw avvii un server di modelli locale solo quando viene selezionato il relativo modello
    - Esegui ds4, inferrs, vLLM, llama.cpp, MLX o un altro server locale compatibile con OpenAI
    - È necessario controllare l’avvio a freddo, la disponibilità e l’arresto per inattività dei provider locali
summary: Avvia i server di modelli locali su richiesta prima delle richieste di modello di OpenClaw
title: Servizi di modelli locali
x-i18n:
    generated_at: "2026-05-10T19:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` consente a OpenClaw di avviare su richiesta un server di modelli locale di proprietà del provider. È una configurazione a livello di provider: quando il modello selezionato appartiene a quel provider, OpenClaw verifica il servizio, avvia il processo se l'endpoint non è attivo, attende che sia pronto, quindi invia la richiesta del modello.

Usalo per server locali costosi da mantenere in esecuzione tutto il giorno, oppure per configurazioni manuali in cui la selezione del modello dovrebbe bastare per avviare il backend.

## Come funziona

1. Una richiesta di modello viene risolta in un provider configurato.
2. Se quel provider ha `localService`, OpenClaw verifica `healthUrl`.
3. Se la verifica riesce, OpenClaw usa il server esistente.
4. Se la verifica fallisce, OpenClaw avvia `command` con `args`.
5. OpenClaw controlla periodicamente la disponibilità finché `readyTimeoutMs` non scade.
6. La richiesta del modello viene inviata tramite il normale trasporto del provider.
7. Se OpenClaw ha avviato il processo e `idleStopMs` è positivo, il processo viene
   arrestato dopo che l'ultima richiesta in corso è rimasta inattiva per quel tempo.

OpenClaw non installa launchd, systemd, Docker o un daemon per questo. Il server è un processo figlio del processo OpenClaw che ne ha avuto bisogno per primo.

## Forma della configurazione

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

## Campi

- `command`: percorso assoluto dell'eseguibile. La ricerca tramite shell non viene usata.
- `args`: argomenti del processo. Non vengono applicati espansione della shell, pipe, globbing o regole di quoting.
- `cwd`: directory di lavoro facoltativa per il processo.
- `env`: variabili di ambiente facoltative unite all'ambiente del processo OpenClaw.
- `healthUrl`: URL di disponibilità. Se omesso, OpenClaw aggiunge `/models` a
  `baseUrl`, quindi `http://127.0.0.1:8000/v1` diventa
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: scadenza per la disponibilità all'avvio. Predefinito: `120000`.
- `idleStopMs`: ritardo di arresto per inattività per i processi avviati da OpenClaw. `0` o
  omesso mantiene il processo attivo finché OpenClaw non esce.

## Esempio Inferrs

Inferrs è un backend `/v1` personalizzato compatibile con OpenAI, quindi la stessa API di servizio locale funziona con la voce provider `inferrs`.

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

Sostituisci `command` con il risultato di `which inferrs` sulla macchina che esegue OpenClaw.

## Esempio ds4

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## Note operative

- Un processo OpenClaw gestisce il processo figlio che ha avviato. Un altro processo OpenClaw
  che vede già attivo lo stesso URL di disponibilità lo riutilizzerà senza adottarlo.
- L'avvio è serializzato per comando del provider e set di argomenti, quindi le richieste concorrenti
  non generano server duplicati per la stessa configurazione.
- Le risposte in streaming attive mantengono un lease; l'arresto per inattività attende finché la gestione
  del corpo della risposta non è completa.
- Usa `timeoutSeconds` sui provider locali lenti in modo che gli avvii a freddo e le generazioni lunghe
  non raggiungano il timeout predefinito della richiesta del modello.
- Usa un `healthUrl` esplicito se il server espone la disponibilità in un punto diverso da `/v1/models`.

## Correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Configurazione dei modelli locali, scelte dei provider e indicazioni di sicurezza.
  </Card>
  <Card title="Inferrs" href="/it/providers/inferrs" icon="cpu">
    Esegui OpenClaw tramite il server locale Inferrs compatibile con OpenAI.
  </Card>
</CardGroup>
