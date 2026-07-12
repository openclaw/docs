---
read_when:
    - Je wilt TaskFlows activeren of aansturen vanuit een extern systeem
    - U configureert de meegeleverde webhooks-Plugin
summary: 'Webhooks-Plugin: geauthenticeerde TaskFlow-ingang voor vertrouwde externe automatisering'
title: Webhooks-plugin
x-i18n:
    generated_at: "2026-07-12T09:17:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

De Webhooks-Plugin voegt geauthenticeerde HTTP-routes toe, zodat een vertrouwd extern
systeem (Zapier, n8n, een CI-taak, een interne service) beheerde OpenClaw
TaskFlows via HTTP kan maken en aansturen, zonder een aangepaste Plugin te schrijven.

De Plugin wordt uitgevoerd binnen het Gateway-proces. Installeer en
configureer de Plugin voor een externe Gateway op die host en start vervolgens de Gateway opnieuw. De Plugin wordt
geleverd zonder geconfigureerde routes en doet dus niets totdat u ten minste één route toevoegt.

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

| Veld           | Vereist | Standaard                     | Opmerkingen                                            |
| -------------- | -------- | ----------------------------- | ------------------------------------------------------ |
| `enabled`      | nee      | `true`                        |                                                        |
| `path`         | nee      | `/plugins/webhooks/<routeId>` | Moet uniek zijn voor alle routes.                      |
| `sessionKey`   | ja       | -                             | Sessie die eigenaar is van de gekoppelde TaskFlows.    |
| `secret`       | ja       | -                             | Platte tekenreeks of een SecretRef (hieronder).        |
| `controllerId` | nee      | `webhooks/<routeId>`          | Gebruikt als standaardcontroller voor `create_flow`.   |
| `description`  | nee      | -                             | Alleen een opmerking voor de beheerder.                |

`secret` accepteert een platte tekenreeks of een SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Elke geconfigureerde route wordt bij het opstarten geregistreerd, ongeacht of het geheim
op dat moment kan worden opgehaald. Een geheim dat niet kan worden opgehaald, schakelt de
route niet uit en slaat deze niet over: aanvragen naar de route mislukken bij de authenticatie (`401`) totdat het geheim kan worden
opgehaald. SecretRef-waarden worden bij elke aanvraag opnieuw opgehaald, zodat rotatie van het
onderliggende geheim (omgevingsvariabele, bestand of uitvoer van `exec`) zonder herstart van de
Gateway van kracht wordt.

## Beveiligingsmodel

Elke route handelt met de TaskFlow-bevoegdheden van de geconfigureerde `sessionKey`: de route
kan elke TaskFlow waarvan die sessie eigenaar is inspecteren en wijzigen. TaskFlow-toegang
verloopt altijd via `api.runtime.tasks.managedFlows.bindSession(...)`, zodat een
route nooit buiten de gekoppelde sessie kan handelen. Om de potentiële impact te beperken:

- Gebruik voor elke route een sterk, uniek geheim.
- Geef de voorkeur aan een SecretRef boven een geheim als platte tekst in de configuratie.
- Koppel routes aan de meest beperkte sessie die geschikt is voor de workflow.
- Stel alleen het specifieke Webhook-pad beschikbaar dat u nodig hebt.

Volgorde van de verwerking van aanvragen voor elk pad: controles van de HTTP-methode (alleen `POST`) en
`Content-Type: application/json`, vervolgens snelheidsbeperking met een vast tijdvenster (120
aanvragen per venster van 60 seconden per combinatie van pad en IP-adres van de client, met maximaal 4.096 bijgehouden
sleutels), daarna beperking van gelijktijdig verwerkte aanvragen (8 gelijktijdige aanvragen per sleutel, met maximaal
4.096 bijgehouden sleutels), vervolgens authenticatie met een gedeeld geheim en ten slotte het lezen van een JSON-hoofdtekst met een limiet van 256 KB en
15 seconden. Aanvragen die een eerdere controle niet doorstaan, bereiken
de latere controles nooit.

## Aanvraagindeling

Verzend `POST`-aanvragen met `Content-Type: application/json` en
`Authorization: Bearer <secret>` of `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Ondersteunde acties

| Actie              | Doel                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `create_flow`      | Maak een beheerde TaskFlow voor de sessie van de route.                     |
| `get_flow`         | Haal één TaskFlow op aan de hand van de id.                                 |
| `list_flows`       | Vermeld de TaskFlows voor de sessie van de route.                           |
| `find_latest_flow` | Haal de meest recent bijgewerkte TaskFlow op.                               |
| `resolve_flow`     | Zoek een TaskFlow op aan de hand van een niet-transparant token.            |
| `get_task_summary` | Haal het taakoverzicht voor een TaskFlow op.                                |
| `set_waiting`      | Markeer een TaskFlow als wachtend, met optionele status-/wachtgegevens.     |
| `resume_flow`      | Hervat een wachtende/geblokkeerde TaskFlow.                                 |
| `finish_flow`      | Markeer een TaskFlow als voltooid.                                          |
| `fail_flow`        | Markeer een TaskFlow als mislukt.                                           |
| `request_cancel`   | Vraag coöperatieve annulering aan.                                          |
| `cancel_flow`      | Annuleer een TaskFlow (kan `202` retourneren als onderliggende taken nog actief zijn). |
| `run_task`         | Maak een beheerde onderliggende taak binnen een bestaande TaskFlow.         |

Acties die wijzigingen aanbrengen (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) vereisen `flowId` en `expectedRevision` voor optimistische
gelijktijdigheidscontrole; een verouderde revisie retourneert `409 revision_conflict`.

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

Toegestane waarden voor `runtime`: `subagent`, `acp`. `startedAt`, `lastEventAt` en
`progressSummary` zijn alleen geldig wanneer `status` gelijk is aan `"running"`; als u ze
met een andere status verzendt, wordt `400 invalid_request` geretourneerd.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Antwoordstructuur

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

Weergaven van flows en taken bevatten nooit metagegevens over de eigenaar of sessie, zodat antwoorden
de aan de route gekoppelde `sessionKey` niet kunnen lekken. Waarden voor `code` zijn onder andere `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` en
actiespecifieke terugvalcodes (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) wanneer een wijziging wordt geweigerd om een
reden die niet door de hierboven genoemde codes wordt gedekt.

## Gerelateerd

- [Hooks](/nl/automation/hooks) - interne gebeurtenisgestuurde hooks tegenover deze HTTP-gebaseerde TaskFlow-koppeling
- [Gateway-webhooks (`hooks.*`-configuratie)](/nl/automation/cron-jobs#webhooks) - afzonderlijke algemene functie voor HTTP-eindpunten van de Gateway; niet hetzelfde als de routes van deze Plugin
- [Runtime-SDK voor Plugins](/nl/plugins/sdk-runtime)
- [CLI-webhooks](/nl/cli/webhooks)
