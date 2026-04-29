---
read_when:
    - Je wilt TaskFlows activeren of aansturen vanuit een extern systeem
    - Je configureert de meegeleverde webhooks-Plugin
summary: 'Webhooks-Plugin: geauthenticeerde TaskFlow-ingang voor vertrouwde externe automatisering'
title: Webhooks-Plugin
x-i18n:
    generated_at: "2026-04-29T23:07:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

De Webhooks-Plugin voegt geauthenticeerde HTTP-routes toe die externe
automatisering aan OpenClaw TaskFlows koppelen.

Gebruik deze wanneer je wilt dat een vertrouwd systeem zoals Zapier, n8n, een CI-taak of een
interne service beheerde TaskFlows maakt en aanstuurt zonder eerst een aangepaste
Plugin te schrijven.

## Waar het draait

De Webhooks-Plugin draait binnen het Gateway-proces.

Als je Gateway op een andere machine draait, installeer en configureer je de Plugin op
die Gateway-host en herstart je daarna de Gateway.

## Routes configureren

Stel de configuratie in onder `plugins.entries.webhooks.config`:

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

Routevelden:

- `enabled`: optioneel, standaard `true`
- `path`: optioneel, standaard `/plugins/webhooks/<routeId>`
- `sessionKey`: vereiste sessie die eigenaar is van de gekoppelde TaskFlows
- `secret`: vereist gedeeld geheim of SecretRef
- `controllerId`: optionele controller-id voor gemaakte beheerde flows
- `description`: optionele opmerking voor operators

Ondersteunde `secret`-invoer:

- Platte tekenreeks
- SecretRef met `source: "env" | "file" | "exec"`

Als een route met een geheim het geheim niet kan oplossen bij het opstarten, slaat de Plugin
die route over en logt een waarschuwing in plaats van een kapot eindpunt bloot te stellen.

## Beveiligingsmodel

Elke route wordt vertrouwd om te handelen met de TaskFlow-bevoegdheid van de geconfigureerde
`sessionKey`.

Dit betekent dat de route TaskFlows die eigendom zijn van die sessie kan inspecteren en wijzigen, dus
je moet:

- Een sterk uniek geheim per route gebruiken
- Geheime verwijzingen verkiezen boven inline geheimen in platte tekst
- Routes koppelen aan de smalste sessie die bij de workflow past
- Alleen het specifieke Webhook-pad blootstellen dat je nodig hebt

De Plugin past toe:

- Authenticatie met gedeeld geheim
- Beveiligingen voor aanvraagbodygrootte en time-outs
- Rate limiting met vast venster
- Beperking van lopende aanvragen
- Eigenaargebonden TaskFlow-toegang via `api.runtime.tasks.managedFlows.bindSession(...)`

## Aanvraagindeling

Stuur `POST`-aanvragen met:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` of `x-openclaw-webhook-secret: <secret>`

Voorbeeld:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Ondersteunde acties

De Plugin accepteert momenteel deze JSON-waarden voor `action`:

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

Maakt een beheerde TaskFlow voor de gekoppelde sessie van de route.

Voorbeeld:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Maakt een beheerde onderliggende taak binnen een bestaande beheerde TaskFlow.

Toegestane runtimes zijn:

- `subagent`
- `acp`

Voorbeeld:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Antwoordvorm

Geslaagde antwoorden retourneren:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Afgewezen aanvragen retourneren:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

De Plugin verwijdert bewust eigenaar-/sessiemetadata uit Webhook-antwoorden.

## Gerelateerde documentatie

- [Plugin runtime SDK](/nl/plugins/sdk-runtime)
- [Overzicht van hooks en Webhooks](/nl/automation/hooks)
- [CLI-Webhooks](/nl/cli/webhooks)
