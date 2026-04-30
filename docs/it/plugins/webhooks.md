---
read_when:
    - Vuoi attivare o pilotare TaskFlows da un sistema esterno
    - Stai configurando il Plugin Webhook incluso
summary: 'Plugin Webhook: punto di ingresso TaskFlow autenticato per automazioni esterne attendibili'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-30T09:07:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook (Plugin)

Il Plugin Webhooks aggiunge route HTTP autenticate che collegano l'automazione
esterna agli OpenClaw TaskFlow.

Usalo quando vuoi che un sistema attendibile come Zapier, n8n, un job CI o un
servizio interno crei e guidi TaskFlow gestiti senza dover prima scrivere un
plugin personalizzato.

## Dove viene eseguito

Il Plugin Webhooks viene eseguito all'interno del processo Gateway.

Se il tuo Gateway è in esecuzione su un'altra macchina, installa e configura il plugin
su quell'host Gateway, quindi riavvia il Gateway.

## Configurare le route

Imposta la configurazione sotto `plugins.entries.webhooks.config`:

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

- `enabled`: facoltativo, il valore predefinito è `true`
- `path`: facoltativo, il valore predefinito è `/plugins/webhooks/<routeId>`
- `sessionKey`: sessione obbligatoria proprietaria dei TaskFlow associati
- `secret`: segreto condiviso o SecretRef obbligatorio
- `controllerId`: id controller facoltativo per i flussi gestiti creati
- `description`: nota operatore facoltativa

Input `secret` supportati:

- Stringa semplice
- SecretRef con `source: "env" | "file" | "exec"`

Se una route basata su segreto non riesce a risolvere il proprio segreto all'avvio, il plugin salta
quella route e registra un avviso invece di esporre un endpoint non funzionante.

## Modello di sicurezza

Ogni route è considerata attendibile per agire con l'autorità TaskFlow del
`sessionKey` configurato.

Questo significa che la route può ispezionare e modificare i TaskFlow di proprietà di quella sessione, quindi
dovresti:

- Usare un segreto univoco forte per ogni route
- Preferire riferimenti a segreti rispetto a segreti in testo normale inline
- Associare le route alla sessione più ristretta adatta al workflow
- Esporre solo il percorso Webhook specifico di cui hai bisogno

Il plugin applica:

- Autenticazione tramite segreto condiviso
- Protezioni su dimensione del corpo della richiesta e timeout
- Limitazione della frequenza a finestra fissa
- Limitazione delle richieste in corso
- Accesso ai TaskFlow vincolato al proprietario tramite `api.runtime.tasks.managedFlows.bindSession(...)`

## Formato della richiesta

Invia richieste `POST` con:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` o `x-openclaw-webhook-secret: <secret>`

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

Crea un TaskFlow gestito per la sessione associata alla route.

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

Il plugin rimuove intenzionalmente i metadati proprietario/sessione dalle risposte Webhook.

## Documenti correlati

- [SDK runtime Plugin](/it/plugins/sdk-runtime)
- [Panoramica di hook e Webhook](/it/automation/hooks)
- [Webhook CLI](/it/cli/webhooks)
