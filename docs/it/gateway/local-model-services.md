---
read_when:
    - Vuoi che OpenClaw avvii un server locale per modelli solo quando il relativo modello è selezionato
    - Esegui ds4, inferrs, vLLM, llama.cpp, MLX o un altro server locale compatibile con OpenAI
    - Devi controllare l'avvio a freddo, la disponibilità e l'arresto in inattività per i provider locali
summary: Avvia server di modelli locali su richiesta prima delle richieste di modello di OpenClaw
title: Servizi di modelli locali
x-i18n:
    generated_at: "2026-06-27T17:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` consente a OpenClaw di avviare su richiesta un
server di modelli locale di proprietà del provider. È una configurazione a livello di provider:
quando il modello selezionato appartiene a quel provider, OpenClaw verifica il servizio,
avvia il processo se l'endpoint non è attivo, attende che sia pronto, quindi invia la
richiesta del modello.

Usalo per server locali costosi da mantenere in esecuzione tutto il giorno, oppure per
configurazioni manuali in cui la selezione del modello deve bastare per avviare il backend.

## Come funziona

1. Una richiesta di modello viene risolta in un provider configurato.
2. Se quel provider ha `localService`, OpenClaw verifica `healthUrl`.
3. Se la verifica riesce, OpenClaw usa il server esistente.
4. Se la verifica non riesce, OpenClaw avvia `command` con `args`.
5. OpenClaw controlla periodicamente lo stato di readiness finché `readyTimeoutMs` non scade.
6. La richiesta del modello viene inviata tramite il normale trasporto del provider.
7. Se OpenClaw ha avviato il processo e `idleStopMs` è positivo, il processo viene
   arrestato dopo che l'ultima richiesta in corso è rimasta inattiva per quel periodo.

OpenClaw non installa launchd, systemd, Docker o un demone per questo. Il server è
un processo figlio del processo OpenClaw che ne ha avuto bisogno per primo.

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
- `args`: argomenti del processo. Non vengono applicate espansione della shell, pipe,
  globbing o regole di quoting.
- `cwd`: directory di lavoro facoltativa per il processo.
- `env`: variabili d'ambiente facoltative unite all'ambiente del processo OpenClaw.
- `healthUrl`: URL di readiness. Se omesso, OpenClaw aggiunge `/models` a
  `baseUrl`, quindi `http://127.0.0.1:8000/v1` diventa
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: scadenza per la readiness all'avvio. Predefinito: `120000`.
- `idleStopMs`: ritardo di arresto per inattività per i processi avviati da OpenClaw. `0` o
  l'omissione mantiene il processo attivo finché OpenClaw non esce.

## Esempio Inferrs

Inferrs è un backend `/v1` personalizzato compatibile con OpenAI, quindi la stessa API
di servizio locale funziona con la voce provider `inferrs`.

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

Sostituisci `command` con il risultato di `which inferrs` sulla macchina che esegue
OpenClaw.

## Esempio ds4

Per la configurazione completa, le indicazioni sul dimensionamento del contesto e i comandi
di verifica, consulta [ds4](/it/providers/ds4).

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

## Note operative

- Un processo OpenClaw gestisce il figlio che ha avviato. Un altro processo OpenClaw
  che vede lo stesso URL di stato già attivo lo riutilizzerà senza adottarlo.
- L'avvio è serializzato per comando del provider e insieme di argomenti, quindi le richieste
  concorrenti non generano server duplicati per la stessa configurazione.
- Le risposte in streaming attive mantengono un lease; l'arresto per inattività attende che
  la gestione del corpo della risposta sia completa.
- Usa `timeoutSeconds` sui provider locali lenti, in modo che gli avvii a freddo e le generazioni
  lunghe non raggiungano il timeout predefinito della richiesta del modello.
- Usa un `healthUrl` esplicito se il server espone la readiness in un punto diverso da
  `/v1/models`.

## Correlati

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Configurazione dei modelli locali, scelte dei provider e indicazioni di sicurezza.
  </Card>
  <Card title="Inferrs" href="/it/providers/inferrs" icon="cpu">
    Esegui OpenClaw tramite il server locale compatibile con OpenAI di inferrs.
  </Card>
</CardGroup>
