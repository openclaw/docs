---
read_when:
    - Vuoi attivare o pilotare i TaskFlow da un sistema esterno
    - Stai configurando il Plugin Webhook incluso
summary: 'Plugin Webhook: ingresso TaskFlow autenticato per automazioni esterne fidate'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-05-06T17:59:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Il Plugin Webhooks aggiunge route HTTP autenticate che collegano l'automazione
esterna ai TaskFlow OpenClaw.

Usalo quando vuoi che un sistema attendibile come Zapier, n8n, un job CI o un
servizio interno crei e guidi TaskFlow gestiti senza dover prima scrivere un
plugin personalizzato.

## Dove viene eseguito

Il Plugin Webhooks viene eseguito all'interno del processo Gateway.

Se il tuo Gateway viene eseguito su un'altra macchina, installa e configura il plugin
sull'host di quel Gateway, quindi riavvia il Gateway.

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
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Campi della route:

- `enabled`: facoltativo, valore predefinito `true`
- `path`: facoltativo, valore predefinito `/plugins/webhooks/<routeId>`
- `sessionKey`: sessione obbligatoria che possiede i TaskFlow collegati
- `secret`: segreto condiviso o SecretRef obbligatorio
- `controllerId`: ID controller facoltativo per i flussi gestiti creati
- `description`: nota operatore facoltativa

Input `secret` supportati:

- Stringa semplice
- SecretRef con `source: "env" | "file" | "exec"`

Se una route basata su un segreto non riesce a risolvere il proprio segreto
all'avvio, il plugin salta quella route e registra un avviso invece di esporre un
endpoint non funzionante.

## Modello di sicurezza

Ogni route è considerata attendibile per agire con l'autorità TaskFlow della
`sessionKey` configurata.

Questo significa che la route può ispezionare e modificare i TaskFlow posseduti da
quella sessione, quindi dovresti:

- Usare un segreto forte e univoco per ogni route
- Preferire i riferimenti ai segreti rispetto ai segreti in testo normale inline
- Collegare le route alla sessione più ristretta adatta al workflow
- Esporre solo il percorso Webhook specifico di cui hai bisogno

Il plugin applica:

- Autenticazione tramite segreto condiviso
- Protezioni per dimensione del corpo della richiesta e timeout
- Limitazione della frequenza a finestra fissa
- Limitazione delle richieste in corso
- Accesso TaskFlow vincolato al proprietario tramite `api.runtime.tasks.managedFlows.bindSession(...)`

## Formato della richiesta

Invia richieste `POST` con:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` oppure `x-openclaw-webhook-secret: <secret>`

Esempio:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Azioni supportate

Il plugin attualmente accetta questi valori JSON `action`:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Crea un TaskFlow gestito per la sessione collegata alla route.

Esempio:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Crea un'attività figlia gestita all'interno di un TaskFlow gestito esistente.

I runtime consentiti sono:

- `subagent`
- `acp`

Esempio:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Forma della risposta

Le risposte riuscite restituiscono:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Le richieste rifiutate restituiscono:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Il plugin rimuove intenzionalmente i metadati di proprietario/sessione dalle
risposte Webhook.

## Documentazione correlata

- [SDK runtime Plugin](/it/plugins/sdk-runtime)
- [Panoramica di hook e Webhook](/it/automation/hooks)
- [Webhook CLI](/it/cli/webhooks)
