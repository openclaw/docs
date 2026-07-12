---
read_when:
    - Sie möchten einen Agent-Durchlauf über Skripte ausführen (optional die Antwort zustellen)
summary: CLI-Referenz für `openclaw agent` (eine Agentenrunde über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-07-12T01:30:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Führt einen Agent-Durchlauf über das Gateway aus. Fällt auf den eingebetteten Agent zurück, wenn die Gateway-Anfrage fehlschlägt; übergeben Sie `--local`, um von Anfang an die eingebettete Ausführung zu erzwingen.

Übergeben Sie mindestens einen Sitzungsauswähler: `--to`, `--session-key`, `--session-id` oder `--agent`.

Verwandt: [Tool zum Senden an einen Agent](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: Nachrichtentext
- `--message-file <path>`: Nachrichtentext aus einer UTF-8-Datei lesen
- `-t, --to <dest>`: Empfänger, aus dem der Sitzungsschlüssel abgeleitet wird
- `--session-key <key>`: expliziter Sitzungsschlüssel für das Routing
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Zuordnungen
- `--model <id>`: Modellüberschreibung für diesen Durchlauf (`provider/model` oder Modell-ID)
- `--thinking <level>`: Denkniveau des Agents (`off`, `minimal`, `low`, `medium`, `high` sowie vom Provider unterstützte benutzerdefinierte Stufen wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: Ausführlichkeitsstufe für die Sitzung dauerhaft speichern
- `--channel <channel>`: Zustellungskanal; weglassen, um den Kanal der Hauptsitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellungsziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: eingebetteten Agent direkt ausführen (nach dem Vorladen der Plugin-Registry)
- `--deliver`: Antwort an den ausgewählten Kanal bzw. das ausgewählte Ziel zurücksenden
- `--timeout <seconds>`: Zeitlimit des Agents überschreiben (Standard: 600 oder `agents.defaults.timeoutSeconds`); `0` deaktiviert das Zeitlimit
- `--json`: JSON ausgeben

## Beispiele

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Hinweise

- Übergeben Sie genau eine der Optionen `--message` oder `--message-file`. `--message-file` entfernt eine führende UTF-8-BOM und bewahrt mehrzeilige Inhalte; Dateien ohne gültige UTF-8-Codierung werden abgelehnt.
- Schrägstrichbefehle (zum Beispiel `/compact`) können nicht über `--message` ausgeführt werden. Die CLI lehnt sie ab und verweist stattdessen auf den entsprechenden eigenständigen Befehl (`openclaw sessions compact <key>` für Compaction).
- Durchläufe mit `--local` und eingebettetem Rückfall sind einmalig: Für den Durchlauf geöffnete gebündelte MCP-local-loopback-Ressourcen und vorbereitete Claude-stdio-Sitzungen werden nach der Antwort beendet, sodass skriptgesteuerte Aufrufe keine lokalen Unterprozesse weiterlaufen lassen. Gateway-gestützte Durchläufe belassen die dem Gateway gehörenden MCP-local-loopback-Ressourcen stattdessen unter dem laufenden Gateway-Prozess.
- Wenn `--agent`, `--channel` und `--to` gemeinsam verwendet werden, folgt das Sitzungsrouting dem kanonischen Empfänger des Kanals und `session.dmScope`. Kanäle mit einer stabilen, ausschließlich ausgehenden Empfängeridentität verwenden eine Provider-eigene Sitzung, die von der Hauptsitzung des Agents isoliert ist. `--reply-channel` und `--reply-account` wirken sich nur auf die Zustellung aus.
- `--session-key` wählt einen expliziten Sitzungsschlüssel aus. Mit einem Agent-Präfix versehene Schlüssel müssen `agent:<agent-id>:<session-key>` verwenden, und `--agent` muss mit der Agent-ID des Schlüssels übereinstimmen, wenn beide angegeben sind. Unpräfixierte Schlüssel, die keine Sentinel-Schlüssel sind, werden bei Angabe von `--agent` diesem Agent zugeordnet, andernfalls dem konfigurierten Standard-Agent; beispielsweise leitet `--agent ops --session-key incident-42` an `agent:ops:incident-42` weiter. Die literalen Schlüssel `global` und `unknown` bleiben nur dann ohne Gültigkeitsbereich, wenn kein `--agent` angegeben ist.
- `--json` reserviert stdout für die JSON-Antwort; Diagnosemeldungen des Gateways, von Plugins und des eingebetteten Rückfalls werden an stderr gesendet, sodass Skripte stdout direkt parsen können.
- Das JSON des eingebetteten Rückfalls enthält `meta.transport: "embedded"` und `meta.fallbackFrom: "gateway"`, damit Skripte einen Rückfalldurchlauf erkennen können.
- Wenn das Gateway einen Durchlauf annimmt, die CLI jedoch beim Warten auf die endgültige Antwort das Zeitlimit überschreitet, verwendet der eingebettete Rückfall eine neue Sitzungs-/Durchlauf-ID im Format `gateway-fallback-*` und meldet `meta.fallbackReason: "gateway_timeout"` sowie die Sitzungsfelder des Rückfalls, anstatt mit dem dem Gateway gehörenden Transkript zu konkurrieren oder die ursprüngliche Sitzung stillschweigend zu ersetzen.
- `SIGTERM`/`SIGINT` unterbrechen eine wartende Gateway-gestützte Anfrage; wenn das Gateway den Durchlauf bereits angenommen hat, sendet die CLI vor dem Beenden außerdem `chat.abort` für diese Durchlauf-ID. Durchläufe mit `--local` und eingebettetem Rückfall erhalten dasselbe Signal, senden jedoch kein `chat.abort`. Wenn für den internen Schlüssel zur Durchlauf-Deduplizierung bereits ein aktiver Durchlauf für diese Sitzung vorhanden ist, meldet die Antwort `status: "in_flight"`, und die Nicht-JSON-CLI gibt statt einer leeren Antwort eine Diagnosemeldung auf stderr aus. Verwenden Sie für externe Cron-/systemd-Wrapper eine Absicherung zum erzwungenen Beenden wie `timeout -k 60 600 openclaw agent ...`, damit der Supervisor den Prozess beenden kann, falls beim Herunterfahren kein ordnungsgemäßer Abschluss möglich ist.
- Wenn dieser Befehl die Neuerzeugung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als nicht geheime Markierungen gespeichert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), niemals als aufgelöster geheimer Klartext. Das Schreiben der Markierungen erfolgt aus dem aktiven Snapshot der Quellkonfiguration, nicht aus aufgelösten geheimen Laufzeitwerten.

## JSON-Zustellungsstatus

Mit `--json --deliver` enthält die JSON-Antwort der CLI das Feld `deliveryStatus` auf oberster Ebene, damit Skripte zwischen zugestellten, unterdrückten, teilweise und vollständig fehlgeschlagenen Sendungen unterscheiden können:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Gateway-gestützte CLI-Antworten bewahren außerdem die unverarbeitete Ergebnisstruktur des Gateways unter `result.deliveryStatus`.

`deliveryStatus.status` hat einen der folgenden Werte:

| Status           | Bedeutung                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Zustellung abgeschlossen.                                                                                                                                                                      |
| `suppressed`     | Die Zustellung wurde absichtlich nicht gesendet (zum Beispiel weil ein Hook zum Senden von Nachrichten sie abgebrochen hat oder kein sichtbares Ergebnis vorlag). Endgültig, kein erneuter Versuch. |
| `partial_failed` | Mindestens eine Nutzlast wurde gesendet, bevor eine spätere Nutzlast fehlschlug.                                                                                                                |
| `failed`         | Keine dauerhafte Sendung wurde abgeschlossen oder die Zustellungs-Vorprüfung ist fehlgeschlagen.                                                                                                |

Allgemeine Felder:

- `requested`: immer `true`, wenn das Objekt vorhanden ist.
- `attempted`: `true`, sobald der dauerhafte Sendepfad ausgeführt wurde; `false` bei Fehlern der Vorprüfung oder wenn keine sichtbaren Nutzlasten vorhanden sind.
- `succeeded`: `true`, `false` oder `"partial"`; `"partial"` tritt zusammen mit `status: "partial_failed"` auf.
- `reason`: Grund in kleingeschriebener Snake-Case-Schreibweise aus der dauerhaften Zustellung oder der Vorabvalidierung. Bekannte Werte sind unter anderem `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` und `no_delivery_target`; fehlgeschlagene dauerhafte Sendungen können außerdem die fehlgeschlagene Phase melden. Behandeln Sie unbekannte Werte als undurchsichtig, da die Menge erweitert werden kann.
- `resultCount`: Anzahl der Ergebnisse von Kanalsendungen, sofern verfügbar.
- `sentBeforeError`: `true`, wenn bei einem teilweisen Fehlschlag mindestens eine Nutzlast gesendet wurde, bevor der Fehler auftrat.
- `error`: `true` bei fehlgeschlagenen oder teilweise fehlgeschlagenen Sendungen.
- `errorMessage`: nur vorhanden, wenn eine zugrunde liegende Zustellungsfehlermeldung erfasst wurde. Fehler der Vorprüfung enthalten `error`/`reason`, aber keine `errorMessage`.
- `payloadOutcomes`: optionale Ergebnisse pro Nutzlast mit `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` oder Hook-Metadaten, sofern verfügbar.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Agent-Laufzeit](/de/concepts/agent)
