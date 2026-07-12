---
read_when:
    - Vuoi attivare o gestire TaskFlow da un sistema esterno
    - Stai configurando il Plugin Webhook incluso
summary: 'Plugin Webhook: ingresso TaskFlow autenticato per automazioni esterne attendibili'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-12T07:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Il Plugin Webhook aggiunge route HTTP autenticate affinché un sistema esterno
attendibile (Zapier, n8n, un processo CI, un servizio interno) possa creare e gestire
TaskFlow OpenClaw amministrati tramite HTTP, senza scrivere un plugin personalizzato.

Il plugin viene eseguito all'interno del processo Gateway. Per un Gateway remoto, installalo e
configuralo su tale host, quindi riavvia il Gateway. Viene distribuito senza route
configurate, quindi non esegue alcuna operazione finché non aggiungi almeno una route.

## Configurare le route

Imposta la configurazione in `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Bridge TaskFlow per Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campi della route:

| Campo          | Obbligatorio | Valore predefinito            | Note                                                        |
| -------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `enabled`      | no           | `true`                        |                                                             |
| `path`         | no           | `/plugins/webhooks/<routeId>` | Deve essere univoco tra le route.                            |
| `sessionKey`   | sì           | -                             | Sessione proprietaria dei TaskFlow associati.                |
| `secret`       | sì           | -                             | Stringa semplice o SecretRef (vedi sotto).                   |
| `controllerId` | no           | `webhooks/<routeId>`          | Utilizzato come controller `create_flow` predefinito.        |
| `description`  | no           | -                             | Solo una nota per l'operatore.                               |

`secret` accetta una stringa semplice o un SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Ogni route configurata viene registrata all'avvio, indipendentemente dal fatto che il relativo segreto
sia attualmente risolvibile. Un segreto non risolvibile non disabilita né ignora la
route: le richieste inviate a essa non superano l'autenticazione (`401`) finché il segreto non può essere
risolto. I valori SecretRef vengono risolti nuovamente a ogni richiesta, pertanto la rotazione del
segreto sottostante (variabile di ambiente, file o output di un comando) ha effetto senza
riavviare il Gateway.

## Modello di sicurezza

Ogni route opera con l'autorità TaskFlow della propria `sessionKey` configurata: può
esaminare e modificare qualsiasi TaskFlow appartenente a tale sessione. L'accesso ai TaskFlow
avviene sempre tramite `api.runtime.tasks.managedFlows.bindSession(...)`, quindi una
route non può mai operare al di fuori della sessione a cui è associata. Per limitare l'impatto:

- Usa un segreto robusto e univoco per ogni route.
- Preferisci un SecretRef a un segreto in testo non cifrato incorporato.
- Associa le route alla sessione più circoscritta compatibile con il flusso di lavoro.
- Esponi solo il percorso Webhook specifico necessario.

Ordine di gestione delle richieste per ogni percorso: controlli del metodo HTTP (solo `POST`) e
di `Content-Type: application/json`, quindi limitazione della frequenza a finestra fissa (120
richieste per finestra di 60 secondi per ogni chiave percorso+IP-client, fino a 4.096 chiavi
monitorate), quindi limitazione delle richieste in corso (8 richieste simultanee per chiave, fino a
4.096 chiavi monitorate), quindi autenticazione tramite segreto condiviso, infine lettura del corpo
JSON con limite di 256 KB e timeout di 15 secondi. Le richieste che non superano un controllo precedente
non raggiungono mai quelli successivi.

## Formato della richiesta

Invia richieste `POST` con `Content-Type: application/json` e
`Authorization: Bearer <secret>` oppure `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Azioni supportate

| Azione             | Scopo                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| `create_flow`      | Crea un TaskFlow amministrato per la sessione della route.                     |
| `get_flow`         | Recupera un TaskFlow tramite ID.                                                |
| `list_flows`       | Elenca i TaskFlow della sessione della route.                                  |
| `find_latest_flow` | Recupera il TaskFlow aggiornato più di recente.                                |
| `resolve_flow`     | Risolve un TaskFlow tramite un token opaco.                                    |
| `get_task_summary` | Recupera il riepilogo delle attività di un TaskFlow.                           |
| `set_waiting`      | Contrassegna un TaskFlow come in attesa, con dati facoltativi di stato/attesa. |
| `resume_flow`      | Riprende un TaskFlow in attesa/bloccato.                                       |
| `finish_flow`      | Contrassegna un TaskFlow come completato.                                      |
| `fail_flow`        | Contrassegna un TaskFlow come non riuscito.                                    |
| `request_cancel`   | Richiede l'annullamento cooperativo.                                            |
| `cancel_flow`      | Annulla un TaskFlow (può restituire `202` se le attività figlie sono ancora attive). |
| `run_task`         | Crea un'attività figlia amministrata all'interno di un TaskFlow esistente.     |

Le azioni di modifica (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) richiedono `flowId` ed `expectedRevision` per la concorrenza
ottimistica; una revisione obsoleta restituisce `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Valori `runtime` consentiti: `subagent`, `acp`. `startedAt`, `lastEventAt` e
`progressSummary` sono validi solo quando `status` è `"running"`; inviarli
con qualsiasi altro stato restituisce `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Struttura della risposta

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Le viste dei flussi e delle attività non includono mai metadati relativi al proprietario o alla sessione, pertanto le risposte non possono
esporre la `sessionKey` associata alla route. I valori di `code` includono `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` e
codici di riserva specifici delle azioni (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) quando una modifica viene rifiutata per un
motivo non contemplato dai codici indicati sopra.

## Contenuti correlati

- [Hook](/it/automation/hooks) - hook interni basati su eventi rispetto a questo bridge TaskFlow basato su HTTP
- [Webhook del Gateway (configurazione `hooks.*`)](/it/automation/cron-jobs#webhooks) - funzionalità separata per endpoint HTTP generici del Gateway; non corrisponde alle route di questo plugin
- [SDK di runtime dei plugin](/it/plugins/sdk-runtime)
- [Webhook della CLI](/it/cli/webhooks)
