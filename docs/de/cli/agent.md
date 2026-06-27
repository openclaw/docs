---
read_when:
    - Sie möchten einen Agent-Durchlauf aus Skripten ausführen (optional mit Zustellung der Antwort)
summary: CLI-Referenz für `openclaw agent` (einen Agenten-Turn über den Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-06-27T17:17:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Führt einen Agent-Durchlauf über das Gateway aus (verwenden Sie `--local` für eingebettet).
Verwenden Sie `--agent <id>`, um einen konfigurierten Agent direkt anzusteuern.

Übergeben Sie mindestens einen Sitzungsauswähler:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Agent-Sendetool: [Agent senden](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: Nachrichtentext
- `--message-file <path>`: Nachrichtentext aus einer UTF-8-Datei lesen
- `-t, --to <dest>`: Empfänger, der zum Ableiten des Sitzungsschlüssels verwendet wird
- `--session-key <key>`: expliziter Sitzungsschlüssel für das Routing
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--model <id>`: Modellüberschreibung für diesen Durchlauf (`provider/model` oder Modell-ID)
- `--thinking <level>`: Denkstufe des Agent (`off`, `minimal`, `low`, `medium`, `high` plus vom Provider unterstützte benutzerdefinierte Stufen wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: ausführliche Stufe für die Sitzung speichern
- `--channel <channel>`: Zustellkanal; auslassen, um den Hauptkanal der Sitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellziels
- `--reply-channel <channel>`: Überschreibung des Zustellkanals
- `--reply-account <id>`: Überschreibung des Zustellkontos
- `--local`: eingebetteten Agent direkt ausführen (nach dem Vorladen der Plugin-Registry)
- `--deliver`: Antwort an den ausgewählten Kanal bzw. das ausgewählte Ziel zurücksenden
- `--timeout <seconds>`: Agent-Timeout überschreiben (Standardwert 600 oder Konfigurationswert)
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

- Übergeben Sie genau eines von `--message` oder `--message-file`. `--message-file` behält mehrzeilige Dateiinhalte nach dem Entfernen einer optionalen UTF-8-BOM bei und lehnt Dateien ab, die kein gültiges UTF-8 sind.
- Der Gateway-Modus fällt auf den eingebetteten Agent zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von Anfang an zu erzwingen.
- `--local` lädt dennoch zuerst die Plugin-Registry vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle während eingebetteter Durchläufe verfügbar bleiben.
- `--local` und eingebettete Fallback-Durchläufe werden als einmalige Durchläufe behandelt. Gebündelte MCP-loopback-Ressourcen und warme Claude-stdio-Sitzungen, die für diesen lokalen Prozess geöffnet wurden, werden nach der Antwort beendet, sodass skriptgesteuerte Aufrufe keine lokalen Kindprozesse am Leben halten.
- Gateway-gestützte Durchläufe lassen Gateway-eigene MCP-loopback-Ressourcen unter dem laufenden Gateway-Prozess bestehen; ältere Clients senden möglicherweise weiterhin das historische Cleanup-Flag, aber das Gateway akzeptiert es aus Kompatibilitätsgründen als No-op.
- `--channel`, `--reply-channel` und `--reply-account` beeinflussen die Antwortzustellung, nicht das Sitzungsrouting.
- `--session-key` wählt einen expliziten Sitzungsschlüssel aus. Agent-präfixierte Schlüssel müssen `agent:<agent-id>:<session-key>` verwenden, und `--agent` muss mit der Agent-ID des Schlüssels übereinstimmen, wenn beide angegeben werden. Bloße Nicht-Sentinel-Schlüssel werden auf `--agent` eingeschränkt, wenn angegeben, andernfalls auf den konfigurierten Standard-Agent; zum Beispiel leitet `--agent ops --session-key incident-42` an `agent:ops:incident-42` weiter. Die Literale `global` und `unknown` bleiben nur dann ohne Scope, wenn kein `--agent` angegeben wird; in diesem Fall verwenden eingebetteter Fallback und Store-Eigentümerschaft den konfigurierten Standard-Agent.
- `--json` reserviert stdout für die JSON-Antwort. Gateway-, Plugin- und eingebettete Fallback-Diagnosen werden an stderr geleitet, damit Skripte stdout direkt parsen können.
- Eingebettetes Fallback-JSON enthält `meta.transport: "embedded"` und `meta.fallbackFrom: "gateway"`, damit Skripte Fallback-Durchläufe von Gateway-Durchläufen unterscheiden können.
- Wenn das Gateway einen Agent-Durchlauf akzeptiert, die CLI jedoch beim Warten auf die endgültige Antwort in ein Timeout läuft, verwendet der eingebettete Fallback eine neue explizite `gateway-fallback-*`-Sitzungs-/Durchlauf-ID und meldet `meta.fallbackReason: "gateway_timeout"` plus die Fallback-Sitzungsfelder. Dadurch wird vermieden, mit der Gateway-eigenen Transcript-Sperre zu konkurrieren oder die ursprüngliche geroutete Konversationssitzung stillschweigend zu ersetzen.
- Bei Gateway-gestützten Durchläufen unterbrechen `SIGTERM` und `SIGINT` die wartende CLI-Anfrage. Wenn das Gateway den Durchlauf bereits akzeptiert hat, sendet die CLI vor dem Beenden außerdem `chat.abort` für diese akzeptierte Durchlauf-ID. Lokale `--local`-Durchläufe und eingebettete Fallback-Durchläufe erhalten dasselbe Abbruchsignal, senden aber kein `chat.abort`. Wenn eine doppelte `--run-id` das Gateway erreicht, während der ursprüngliche Agent-Durchlauf noch aktiv ist, meldet die doppelte Antwort `status: "in_flight"`, und die Nicht-JSON-CLI gibt statt einer leeren Antwort eine stderr-Diagnose aus. Behalten Sie für externe Cron-/systemd-Wrapper eine äußere Hard-Kill-Absicherung wie `timeout -k 60 600 openclaw agent ...` bei, damit der Supervisor den Prozess weiterhin beenden kann, falls das Herunterfahren nicht sauber ablaufen kann.
- Wenn dieser Befehl eine Regenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als Nicht-Geheimnis-Markierungen gespeichert (zum Beispiel Env-Var-Namen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster geheimer Klartext.
- Markerschreibvorgänge sind quellenautoritativ: OpenClaw speichert Markierungen aus dem aktiven Quell-Konfigurationssnapshot, nicht aus aufgelösten Laufzeit-Geheimniswerten.

## JSON-Zustellstatus

Wenn `--json --deliver` verwendet wird, kann die CLI-JSON-Antwort ein `deliveryStatus` auf oberster Ebene enthalten, damit Skripte zwischen zugestellten, unterdrückten, teilweisen und fehlgeschlagenen Sendungen unterscheiden können:

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

`deliveryStatus.status` ist eines von `sent`, `suppressed`, `partial_failed` oder `failed`. `suppressed` bedeutet, dass die Zustellung absichtlich nicht gesendet wurde, zum Beispiel weil ein Hook zum Senden von Nachrichten sie abgebrochen hat oder kein sichtbares Ergebnis vorhanden war; es ist dennoch ein terminales Ergebnis ohne erneuten Versuch. `partial_failed` bedeutet, dass mindestens eine Payload gesendet wurde, bevor eine spätere Payload fehlschlug. `failed` bedeutet, dass keine dauerhafte Sendung abgeschlossen wurde oder die Zustellungs-Vorprüfung fehlgeschlagen ist.

Gateway-gestützte CLI-Antworten bewahren außerdem die rohe Gateway-Ergebnisform, wobei dasselbe Objekt unter `result.deliveryStatus` verfügbar ist.

Häufige Felder:

- `requested`: immer `true`, wenn das Objekt vorhanden ist.
- `attempted`: `true`, nachdem der dauerhafte Sendepfad ausgeführt wurde; `false` bei Vorprüfungsfehlern oder keinen sichtbaren Payloads.
- `succeeded`: `true`, `false` oder `"partial"`; `"partial"` gehört zu `status: "partial_failed"`.
- `reason`: ein kleingeschriebener Snake-Case-Grund aus dauerhafter Zustellung oder Vorprüfungsvalidierung. Bekannte Gründe sind `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` und `no_delivery_target`; fehlgeschlagene dauerhafte Sendungen können außerdem die fehlgeschlagene Stufe melden. Behandeln Sie unbekannte Werte als opak, da die Menge erweitert werden kann.
- `resultCount`: Anzahl der Kanal-Sendeergebnisse, wenn verfügbar.
- `sentBeforeError`: `true`, wenn bei einem Teilfehler vor dem Fehler mindestens eine Payload gesendet wurde.
- `error`: boolesches `true` für fehlgeschlagene oder teilweise fehlgeschlagene Sendungen.
- `errorMessage`: nur enthalten, wenn eine zugrunde liegende Fehlermeldung der Zustellung erfasst wird. Vorprüfungsfehler enthalten `error` und `reason`, aber kein `errorMessage`.
- `payloadOutcomes`: optionale Ergebnisse pro Payload mit `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` oder Hook-Metadaten, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agent-Laufzeit](/de/concepts/agent)
