---
read_when:
    - Sie möchten TaskFlows aus einem externen System auslösen oder steuern
    - Sie konfigurieren das gebündelte Webhooks-Plugin
summary: 'Webhooks-Plugin: authentifizierter TaskFlow-Eingang für vertrauenswürdige externe Automatisierung'
title: Webhooks-Plugin
x-i18n:
    generated_at: "2026-07-24T04:51:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Das Webhooks-Plugin fügt authentifizierte HTTP-Routen hinzu, sodass ein vertrauenswürdiges externes
System (Zapier, n8n, ein CI-Job, ein interner Dienst) verwaltete OpenClaw-TaskFlows
über HTTP erstellen und steuern kann, ohne ein benutzerdefiniertes Plugin zu schreiben.

Das Plugin wird innerhalb des Gateway-Prozesses ausgeführt. Bei einem Remote-Gateway installieren und
konfigurieren Sie es auf diesem Host und starten Sie anschließend das Gateway neu. Es wird ohne konfigurierte
Routen ausgeliefert und bleibt daher wirkungslos, bis Sie mindestens eine Route hinzufügen.

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

| Feld           | Erforderlich | Standardwert                  | Hinweise                                      |
| -------------- | ------------ | ----------------------------- | --------------------------------------------- |
| `enabled`      | nein         | `true`                        |                                               |
| `path`         | nein         | `/plugins/webhooks/<routeId>` | Muss über alle Routen hinweg eindeutig sein.  |
| `sessionKey`   | ja           | -                             | Sitzung, der die gebundenen TaskFlows gehören. |
| `secret`       | ja           | -                             | Klartextzeichenfolge oder eine SecretRef (siehe unten). |
| `controllerId` | nein         | `webhooks/<routeId>`          | Wird als standardmäßiger `create_flow`-Controller verwendet. |
| `description`  | nein         | -                             | Nur ein Hinweis für den Betreiber.            |

`secret` akzeptiert eine Klartextzeichenfolge oder eine SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

SecretRefs werden im Snapshot der Startkonfiguration des Gateways aufgelöst. Wenn das
Secret einer Route nicht aufgelöst werden kann, läuft das Gateway weiter und genau diese Route
bleibt registriert, aber inaktiv: Anfragen erhalten einen generischen Authentifizierungsfehler (`401`).
Andere Routen bleiben verfügbar. Korrigieren Sie die SecretRef-Quelle und laden Sie das
Gateway anschließend neu oder starten Sie es neu, um den neuen Snapshot zu aktivieren. SecretRef-Werte werden
im öffentlichen Anfragepfad niemals aufgelöst.

## Sicherheitsmodell

Jede Route handelt mit der TaskFlow-Berechtigung ihres konfigurierten `sessionKey`: Sie
kann jeden TaskFlow untersuchen und ändern, der dieser Sitzung gehört. Der TaskFlow-Zugriff
erfolgt immer über `api.runtime.tasks.managedFlows.bindSession(...)`, sodass eine
Route niemals außerhalb ihrer gebundenen Sitzung handeln kann. So begrenzen Sie den potenziellen Schadensumfang:

- Verwenden Sie für jede Route ein starkes, eindeutiges Secret.
- Bevorzugen Sie eine SecretRef gegenüber einem eingebetteten Klartext-Secret.
- Binden Sie Routen an die kleinstmögliche Sitzung, die für den Workflow ausreicht.
- Geben Sie nur den spezifischen Webhook-Pfad frei, den Sie benötigen.

Reihenfolge der Anfrageverarbeitung für jeden Pfad: Prüfung der HTTP-Methode (nur `POST`) und
von `Content-Type: application/json`, anschließend Ratenbegrenzung mit festem Zeitfenster (120
Anfragen pro 60-Sekunden-Zeitfenster und Pfad+Client-IP-Schlüssel, bis zu 4,096 erfasste
Schlüssel), danach Begrenzung gleichzeitig verarbeiteter Anfragen (8 gleichzeitige Anfragen pro Schlüssel, bis zu
4,096 erfasste Schlüssel), anschließend Authentifizierung mit dem gemeinsamen Secret und schließlich das Einlesen eines JSON-Texts mit 256 KB /
15 Sekunden. Anfragen, die bei einer früheren Prüfung scheitern, erreichen
spätere Prüfungen nicht.

## Anfrageformat

Senden Sie `POST`-Anfragen mit `Content-Type: application/json` und entweder
`Authorization: Bearer <secret>` oder `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Unterstützte Aktionen

| Aktion             | Zweck                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Erstellt einen verwalteten TaskFlow für die Sitzung der Route.     |
| `get_flow`         | Ruft einen TaskFlow anhand seiner ID ab.                            |
| `list_flows`       | Listet TaskFlows für die Sitzung der Route auf.                     |
| `find_latest_flow` | Ruft den zuletzt aktualisierten TaskFlow ab.                        |
| `resolve_flow`     | Löst einen TaskFlow anhand eines opaken Tokens auf.                 |
| `get_task_summary` | Ruft die Aufgabenzusammenfassung eines TaskFlows ab.                |
| `set_waiting`      | Markiert einen TaskFlow als wartend, optional mit Status-/Wartedaten. |
| `resume_flow`      | Setzt einen wartenden/blockierten TaskFlow fort.                    |
| `finish_flow`      | Markiert einen TaskFlow als abgeschlossen.                         |
| `fail_flow`        | Markiert einen TaskFlow als fehlgeschlagen.                         |
| `request_cancel`   | Fordert eine kooperative Abbrechung an.                             |
| `cancel_flow`      | Bricht einen TaskFlow ab (kann `202` zurückgeben, wenn untergeordnete Tasks noch aktiv sind). |
| `run_task`         | Erstellt eine verwaltete untergeordnete Aufgabe innerhalb eines vorhandenen TaskFlows. |

Ändernde Aktionen (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) erfordern `flowId` und `expectedRevision` für optimistische
Nebenläufigkeitskontrolle; eine veraltete Revision gibt `409 revision_conflict` zurück.

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

Zulässige `runtime`-Werte: `subagent`, `acp`. `startedAt`, `lastEventAt` und
`progressSummary` sind nur gültig, wenn `status` den Wert `"running"` hat; werden sie
mit einem anderen Status gesendet, wird `400 invalid_request` zurückgegeben.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Antwortstruktur

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

Flow- und Aufgabenansichten enthalten niemals Besitzer-/Sitzungsmetadaten, sodass Antworten den gebundenen
`sessionKey` der Route nicht offenlegen können. Zu den `code`-Werten gehören `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` und
aktionsspezifische Fallback-Codes (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`), wenn eine Änderung aus einem
Grund abgelehnt wird, der nicht durch die oben genannten Codes abgedeckt ist.

## Verwandte Themen

- [Hooks](/de/automation/hooks) – interne ereignisgesteuerte Hooks im Vergleich zu dieser HTTP-basierten TaskFlow-Brücke
- [Gateway-Webhooks (`hooks.*`-Konfiguration)](/de/automation/cron-jobs#webhooks) – separate generische HTTP-Endpunktfunktion des Gateways; nicht identisch mit den Routen dieses Plugins
- [Plugin-Laufzeit-SDK](/de/plugins/sdk-runtime)
- [CLI-Webhooks](/de/cli/webhooks)
