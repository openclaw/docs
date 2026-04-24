---
read_when:
    - Vuoi attivare o pilotare TaskFlow da un sistema esterno
    - Stai configurando il Plugin Webhook incluso
summary: 'Plugin Webhook: ingresso TaskFlow autenticato per automazione esterna trusted'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-24T08:55:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Plugin Webhook

Il Plugin Webhook aggiunge route HTTP autenticate che collegano l’automazione esterna a TaskFlow di OpenClaw.

Usalo quando vuoi che un sistema trusted come Zapier, n8n, un job CI o un
servizio interno crei e piloti TaskFlow gestiti senza prima scrivere un Plugin
personalizzato.

## Dove viene eseguito

Il Plugin Webhook viene eseguito all’interno del processo Gateway.

Se il tuo Gateway gira su un’altra macchina, installa e configura il Plugin su
quell’host Gateway, poi riavvia il Gateway.

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

- `enabled`: opzionale, predefinito `true`
- `path`: opzionale, predefinito `/plugins/webhooks/<routeId>`
- `sessionKey`: sessione obbligatoria che possiede i TaskFlow associati
- `secret`: segreto condiviso obbligatorio o SecretRef
- `controllerId`: ID controller opzionale per i flussi gestiti creati
- `description`: nota opzionale per l’operatore

Input `secret` supportati:

- Stringa plaintext
- SecretRef con `source: "env" | "file" | "exec"`

Se una route supportata da segreto non riesce a risolvere il proprio segreto all’avvio, il Plugin salta
quella route e registra un avviso invece di esporre un endpoint rotto.

## Modello di sicurezza

Ogni route è trusted per agire con l’autorità TaskFlow della propria
`sessionKey` configurata.

Questo significa che la route può ispezionare e mutare i TaskFlow posseduti da quella sessione, quindi
dovresti:

- Usare un segreto unico e forte per ogni route
- Preferire riferimenti a segreti invece di segreti plaintext inline
- Associare le route alla sessione più stretta che si adatta al workflow
- Esporre solo il percorso webhook specifico di cui hai bisogno

Il Plugin applica:

- Autenticazione con segreto condiviso
- Guardrail su dimensione del body della richiesta e timeout
- Rate limiting a finestra fissa
- Limitazione delle richieste in-flight
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

Il Plugin attualmente accetta questi valori JSON `action`:

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

Crea un’attività figlia gestita dentro un TaskFlow gestito esistente.

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

Il Plugin rimuove intenzionalmente i metadati di proprietario/sessione dalle risposte webhook.

## Documentazione correlata

- [SDK runtime Plugin](/it/plugins/sdk-runtime)
- [Panoramica hook e Webhook](/it/automation/hooks)
- [CLI Webhook](/it/cli/webhooks)
