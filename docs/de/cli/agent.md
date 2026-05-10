---
read_when:
    - Sie möchten einen Agent-Turn über Skripte ausführen (optional eine Antwort senden)
summary: CLI-Referenz für `openclaw agent` (einen Agent-Turn über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-05-10T19:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Führen Sie einen Agent-Turn über das Gateway aus (verwenden Sie `--local` für eingebettet).
Verwenden Sie `--agent <id>`, um einen konfigurierten Agent direkt anzusteuern.

Übergeben Sie mindestens einen Sitzungsauswähler:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Weiterführend:

- Agent-Sendetool: [Agent senden](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zum Ableiten des Sitzungsschlüssels verwendet wird
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--model <id>`: Modellüberschreibung für diesen Lauf (`provider/model` oder Modell-ID)
- `--thinking <level>`: Thinking-Level des Agents (`off`, `minimal`, `low`, `medium`, `high` sowie Provider-unterstützte benutzerdefinierte Level wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: Verbose-Level für die Sitzung beibehalten
- `--channel <channel>`: Zustellungskanal; weglassen, um den Hauptkanal der Sitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellungsziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: den eingebetteten Agent direkt ausführen (nach dem Vorladen der Plugin-Registry)
- `--deliver`: die Antwort an den ausgewählten Kanal/das ausgewählte Ziel zurücksenden
- `--timeout <seconds>`: Agent-Timeout überschreiben (Standardwert 600 oder Konfigurationswert)
- `--json`: JSON ausgeben

## Beispiele

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Hinweise

- Der Gateway-Modus fällt auf den eingebetteten Agent zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von Anfang an zu erzwingen.
- `--local` lädt weiterhin zuerst die Plugin-Registry vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle während eingebetteter Läufe verfügbar bleiben.
- `--local` und eingebettete Fallback-Läufe werden als einmalige Läufe behandelt. Gebündelte MCP-loopback-Ressourcen und warme Claude-stdio-Sitzungen, die für diesen lokalen Prozess geöffnet wurden, werden nach der Antwort beendet, sodass skriptbasierte Aufrufe keine lokalen Kindprozesse am Leben halten.
- Gateway-gestützte Läufe belassen Gateway-eigene MCP-loopback-Ressourcen unter dem laufenden Gateway-Prozess; ältere Clients senden möglicherweise weiterhin das historische Bereinigungsflag, aber das Gateway akzeptiert es aus Kompatibilitätsgründen als wirkungslose Operation.
- `--channel`, `--reply-channel` und `--reply-account` wirken sich auf die Antwortzustellung aus, nicht auf das Sitzungs-Routing.
- `--json` reserviert stdout für die JSON-Antwort. Gateway-, Plugin- und Embedded-Fallback-Diagnosen werden nach stderr geleitet, damit Skripte stdout direkt parsen können.
- Embedded-Fallback-JSON enthält `meta.transport: "embedded"` und `meta.fallbackFrom: "gateway"`, damit Skripte Fallback-Läufe von Gateway-Läufen unterscheiden können.
- Wenn das Gateway einen Agent-Lauf akzeptiert, aber die CLI beim Warten auf die endgültige Antwort ein Timeout erreicht, verwendet der eingebettete Fallback eine frische explizite `gateway-fallback-*`-Sitzungs-/Lauf-ID und meldet `meta.fallbackReason: "gateway_timeout"` sowie die Fallback-Sitzungsfelder. Dadurch wird vermieden, dass mit der Gateway-eigenen Transkript-Sperre konkurriert oder die ursprüngliche geroutete Konversationssitzung stillschweigend ersetzt wird.
- Wenn dieser Befehl die Regenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldeinformationen als Nicht-Geheimnis-Marker persistiert (zum Beispiel Env-Var-Namen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster Klartext geheimer Werte.
- Marker-Schreibvorgänge sind quellenautoritativ: OpenClaw persistiert Marker aus dem aktiven Quell-Konfigurationssnapshot, nicht aus aufgelösten geheimen Laufzeitwerten.

## JSON-Zustellungsstatus

Wenn `--json --deliver` verwendet wird, kann die JSON-Antwort der CLI auf oberster Ebene `deliveryStatus` enthalten, damit Skripte zwischen zugestellten, unterdrückten, teilweise fehlgeschlagenen und fehlgeschlagenen Sendungen unterscheiden können:

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

`deliveryStatus.status` ist einer von `sent`, `suppressed`, `partial_failed` oder `failed`. `suppressed` bedeutet, dass die Zustellung absichtlich nicht gesendet wurde, zum Beispiel weil ein Hook zum Senden von Nachrichten sie abgebrochen hat oder kein sichtbares Ergebnis vorhanden war; es ist dennoch ein terminales Ergebnis ohne Wiederholung. `partial_failed` bedeutet, dass mindestens eine Payload gesendet wurde, bevor eine spätere Payload fehlschlug. `failed` bedeutet, dass kein dauerhafter Sendevorgang abgeschlossen wurde oder die Zustellungs-Vorabprüfung fehlgeschlagen ist.

Gateway-gestützte CLI-Antworten behalten außerdem die rohe Gateway-Ergebnisform bei, bei der dasselbe Objekt unter `result.deliveryStatus` verfügbar ist.

Häufige Felder:

- `requested`: immer `true`, wenn das Objekt vorhanden ist.
- `attempted`: `true`, nachdem der dauerhafte Sendepfad ausgeführt wurde; `false` bei Vorabprüfungsfehlern oder wenn keine sichtbaren Payloads vorhanden sind.
- `succeeded`: `true`, `false` oder `"partial"`; `"partial"` gehört zu `status: "partial_failed"`.
- `reason`: ein kleingeschriebener Snake-Case-Grund aus dauerhafter Zustellung oder Vorabvalidierung. Bekannte Gründe umfassen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` und `no_delivery_target`; fehlgeschlagene dauerhafte Sendungen können außerdem die fehlgeschlagene Phase melden. Behandeln Sie unbekannte Werte als undurchsichtig, da die Menge erweitert werden kann.
- `resultCount`: Anzahl der Kanal-Sendeergebnisse, sofern verfügbar.
- `sentBeforeError`: `true`, wenn bei einem teilweisen Fehler vor dem Fehler mindestens eine Payload gesendet wurde.
- `error`: boolesches `true` für fehlgeschlagene oder teilweise fehlgeschlagene Sendungen.
- `errorMessage`: nur enthalten, wenn eine zugrunde liegende Zustellungsfehlermeldung erfasst wird. Vorabprüfungsfehler enthalten `error` und `reason`, aber kein `errorMessage`.
- `payloadOutcomes`: optionale Ergebnisse pro Payload mit `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` oder Hook-Metadaten, sofern verfügbar.

## Weiterführend

- [CLI-Referenz](/de/cli)
- [Agent-Laufzeit](/de/concepts/agent)
