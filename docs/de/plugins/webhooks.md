---
read_when:
    - Sie möchten TaskFlows von einem externen System aus auslösen oder steuern
    - Sie konfigurieren das mitgelieferte Webhook-Plugin
summary: 'Webhooks-Plugin: authentifizierter TaskFlow-Ingress für vertrauenswürdige externe Automatisierung'
title: Webhooks-Plugin
x-i18n:
    generated_at: "2026-04-30T07:09:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

Das Webhooks-Plugin fügt authentifizierte HTTP-Routen hinzu, die externe
Automatisierung an OpenClaw TaskFlows anbinden.

Verwenden Sie es, wenn ein vertrauenswürdiges System wie Zapier, n8n, ein CI-Job oder ein
interner Dienst verwaltete TaskFlows erstellen und steuern soll, ohne zuerst ein eigenes
Plugin zu schreiben.

## Wo es ausgeführt wird

Das Webhooks-Plugin läuft im Gateway-Prozess.

Wenn Ihr Gateway auf einem anderen Rechner läuft, installieren und konfigurieren Sie das Plugin auf
diesem Gateway-Host und starten Sie anschließend das Gateway neu.

## Routen konfigurieren

Legen Sie die Konfiguration unter `plugins.entries.webhooks.config` fest:

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

Routenfelder:

- `enabled`: optional, Standardwert ist `true`
- `path`: optional, Standardwert ist `/plugins/webhooks/<routeId>`
- `sessionKey`: erforderliche Sitzung, der die gebundenen TaskFlows gehören
- `secret`: erforderliches gemeinsames Geheimnis oder SecretRef
- `controllerId`: optionale Controller-ID für erstellte verwaltete Flows
- `description`: optionaler Hinweis für Betreiber

Unterstützte `secret`-Eingaben:

- Klartextzeichenfolge
- SecretRef mit `source: "env" | "file" | "exec"`

Wenn eine Route mit geheimnisgestützter Konfiguration ihr Geheimnis beim Start nicht auflösen kann, überspringt das Plugin
diese Route und protokolliert eine Warnung, anstatt einen fehlerhaften Endpunkt offenzulegen.

## Sicherheitsmodell

Jede Route gilt als vertrauenswürdig, mit der TaskFlow-Berechtigung ihres konfigurierten
`sessionKey` zu handeln.

Das bedeutet, dass die Route TaskFlows einsehen und ändern kann, die dieser Sitzung gehören. Daher
sollten Sie:

- Ein starkes, eindeutiges Geheimnis pro Route verwenden
- Geheimnisreferenzen gegenüber inline hinterlegten Klartextgeheimnissen bevorzugen
- Routen an die engste Sitzung binden, die zum Workflow passt
- Nur den spezifischen Webhook-Pfad verfügbar machen, den Sie benötigen

Das Plugin wendet Folgendes an:

- Authentifizierung über gemeinsames Geheimnis
- Schutzmechanismen für Größe und Timeout des Request-Bodys
- Rate Limiting mit festem Zeitfenster
- Begrenzung laufender Requests
- Eigentümergebundener TaskFlow-Zugriff über `api.runtime.tasks.managedFlows.bindSession(...)`

## Request-Format

Senden Sie `POST`-Requests mit:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` oder `x-openclaw-webhook-secret: <secret>`

Beispiel:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Unterstützte Aktionen

Das Plugin akzeptiert derzeit diese JSON-`action`-Werte:

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

Erstellt einen verwalteten TaskFlow für die gebundene Sitzung der Route.

Beispiel:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Erstellt eine verwaltete untergeordnete Aufgabe in einem vorhandenen verwalteten TaskFlow.

Zulässige Laufzeiten sind:

- `subagent`
- `acp`

Beispiel:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Response-Form

Erfolgreiche Responses geben Folgendes zurück:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Abgelehnte Requests geben Folgendes zurück:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Das Plugin entfernt bewusst Eigentümer- und Sitzungsmetadaten aus Webhook-Responses.

## Verwandte Dokumentation

- [Plugin-Laufzeit-SDK](/de/plugins/sdk-runtime)
- [Übersicht über Hooks und Webhooks](/de/automation/hooks)
- [CLI-Webhooks](/de/cli/webhooks)
