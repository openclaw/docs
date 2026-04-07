---
read_when:
    - Vuoi attivare o pilotare TaskFlow da un sistema esterno
    - Stai configurando il plugin Webhooks incluso
summary: 'Plugin Webhooks: ingresso TaskFlow autenticato per automazione esterna attendibile'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-07T08:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (plugin)

Il plugin Webhooks aggiunge route HTTP autenticate che collegano
l'automazione esterna ai TaskFlow di OpenClaw.

Usalo quando vuoi che un sistema attendibile come Zapier, n8n, un job CI o un
servizio interno crei e gestisca TaskFlow controllati senza dover prima scrivere un
plugin personalizzato.

## Dove viene eseguito

Il plugin Webhooks viene eseguito all'interno del processo Gateway.

Se il tuo Gateway viene eseguito su un'altra macchina, installa e configura il plugin su
quell'host Gateway, quindi riavvia il Gateway.

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
              description: "Bridge TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campi della route:

- `enabled`: facoltativo, default `true`
- `path`: facoltativo, default `/plugins/webhooks/<routeId>`
- `sessionKey`: sessione richiesta che possiede i TaskFlow associati
- `secret`: segreto condiviso o SecretRef richiesto
- `controllerId`: ID controller facoltativo per i flussi controllati creati
- `description`: nota facoltativa per l'operatore

Input `secret` supportati:

- Stringa semplice
- SecretRef con `source: "env" | "file" | "exec"`

Se una route basata su segreto non riesce a risolvere il proprio segreto all'avvio, il plugin salta
quella route e registra un avviso invece di esporre un endpoint non funzionante.

## Modello di sicurezza

Ogni route è considerata attendibile per agire con l'autorità TaskFlow del suo
`sessionKey` configurato.

Questo significa che la route può ispezionare e modificare i TaskFlow posseduti da quella sessione, quindi
dovresti:

- Usare un segreto univoco e robusto per ogni route
- Preferire riferimenti a segreti rispetto a segreti inline in testo semplice
- Associare le route alla sessione più ristretta adatta al flusso di lavoro
- Esporre solo il percorso webhook specifico di cui hai bisogno

Il plugin applica:

- Autenticazione con segreto condiviso
- Protezioni su dimensione del corpo della richiesta e timeout
- Rate limiting a finestra fissa
- Limitazione delle richieste in corso
- Accesso TaskFlow associato al proprietario tramite `api.runtime.taskFlow.bindSession(...)`

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

Crea un TaskFlow controllato per la sessione associata della route.

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

Crea un task figlio controllato all'interno di un TaskFlow controllato esistente.

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

Il plugin rimuove intenzionalmente i metadati di proprietario/sessione dalle risposte webhook.

## Documentazione correlata

- [SDK runtime dei plugin](/it/plugins/sdk-runtime)
- [Panoramica hooks e webhooks](/it/automation/hooks)
- [CLI webhooks](/cli/webhooks)
