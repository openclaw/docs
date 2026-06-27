---
read_when:
    - Sie möchten eine schnelle Diagnose des Channel-Zustands und der Empfänger der letzten Sitzungen
    - Sie möchten einen einfügbaren „all“-Status zum Debuggen
summary: CLI-Referenz für `openclaw status` (Diagnosen, Probes, Nutzungs-Snapshots)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

Diagnose für Kanäle + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Einfaches `openclaw status` bleibt auf dem schnellen, schreibgeschützten Pfad und markiert Speicher als `not checked` statt als nicht verfügbar, wenn die Speicherprüfung übersprungen wird. Aufwendige Sicherheitsprüfung, Plugin-Kompatibilität und Speicher-Vektor-Prüfungen bleiben `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` und `openclaw memory status --deep` vorbehalten.
- `status --json --all` meldet Speicherdetails aus der aktiven Speicher-Plugin-Laufzeitumgebung, die durch `plugins.slots.memory` ausgewählt wurde. Benutzerdefinierte Speicher-Plugins können das integrierte `agents.defaults.memorySearch.enabled` deaktiviert lassen und trotzdem ihren eigenen Datei-, Chunk-, Vektor- und FTS-Status melden.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Sitzungsstatusausgabe trennt `Execution:` von `Runtime:`. `Execution` ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` angibt, ob die Sitzung `OpenClaw Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Siehe [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes) für die Unterscheidung zwischen Provider, Modell und Laufzeitumgebung.
- Die rohen Felder `usage_percent` / `usagePercent` von MiniMax stehen für verbleibendes Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben Vorrang, wenn vorhanden. `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag, leiten die Fensterbeschriftung bei Bedarf aus Zeitstempeln ab und nehmen den Modellnamen in die Planbeschriftung auf.
- Wenn der aktuelle Sitzungssnapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Transkript-Nutzungsprotokoll ergänzen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten.
- `/status` enthält kompakte Gateway-Prozesslaufzeit und Host-Systemlaufzeit.
- Der Transkript-Fallback kann auch die aktive Laufzeitmodellbeschriftung wiederherstellen, wenn sie im Live-Sitzungseintrag fehlt. Wenn dieses Transkriptmodell vom ausgewählten Modell abweicht, löst status das Kontextfenster anhand des wiederhergestellten Laufzeitmodells statt anhand des ausgewählten Modells auf.
- Wenn eine Sitzung an ein Modell angeheftet ist, das von der konfigurierten primären Einstellung abweicht, gibt status beide Werte, den Grund (`session override`) und den klaren Hinweis (`/model default`) aus. Die konfigurierte primäre Einstellung gilt für neue oder nicht angeheftete Sitzungen; vorhandene angeheftete Sitzungen behalten ihre Sitzungsauswahl, bis sie gelöscht wird.
- Für die Prompt-Größenberechnung bevorzugt der Transkript-Fallback die größere Prompt-orientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, sodass Sitzungen mit benutzerdefiniertem Provider nicht auf Token-Anzeigen von `0` reduziert werden.
- Die Ausgabe enthält sitzungsspezifische Speicher pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält Installations- und Laufzeitstatus des Gateway- und Node-Hostdiensts, sofern verfügbar.
- Die Übersicht enthält Update-Kanal + Git-SHA (für Quellcode-Checkouts).
- Update-Informationen erscheinen in der Übersicht; wenn ein Update verfügbar ist, gibt status einen Hinweis zum Ausführen von `openclaw update` aus (siehe [Aktualisieren](/de/install/updating)).
- Fehler beim Aktualisieren von Modellpreisen werden als optionale Preiswarnungen angezeigt. Sie bedeuten
  nicht, dass der Gateway oder die Kanäle fehlerhaft sind.
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Ziel-Konfigurationspfade auf, wenn möglich.
- Wenn eine unterstützte Kanal-SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, bleibt status schreibgeschützt und meldet eine eingeschränkte Ausgabe, statt abzustürzen. Die Ausgabe für Menschen zeigt Warnungen wie „configured token unavailable in this command path“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt status den aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen wie „secret unavailable“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Secrets-Übersichtszeile und einen Diagnoseabschnitt, der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne die Berichtserstellung anzuhalten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
