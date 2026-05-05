---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalzustands + der zuletzt verwendeten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status zum Debuggen
summary: CLI-Referenz für `openclaw status` (Diagnose, Prüfungen, Momentaufnahmen zur Nutzung)
title: Status
x-i18n:
    generated_at: "2026-05-05T06:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnosen für Kanäle + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Einfaches `openclaw status` bleibt auf dem schnellen schreibgeschützten Pfad und markiert Speicher als `not checked`, statt ihn als nicht verfügbar auszuweisen, wenn die Speicherprüfung übersprungen wird. Aufwendige Sicherheitsprüfung, Plugin-Kompatibilität und Speichervektor-Prüfungen bleiben `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` und `openclaw memory status --deep` vorbehalten.
- `status --json --all` meldet Speicherdetails aus der aktiven Speicher-Plugin-Runtime, die durch `plugins.slots.memory` ausgewählt wurde. Benutzerdefinierte Speicher-Plugins können das integrierte `agents.defaults.memorySearch.enabled` deaktiviert lassen und trotzdem ihren eigenen Datei-, Chunk-, Vektor- und FTS-Status melden.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Ausgabe des Sitzungsstatus trennt `Execution:` von `Runtime:`. `Execution` ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` Ihnen mitteilt, ob die Sitzung `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes) für die Unterscheidung zwischen Provider, Modell und Runtime.
- MiniMaxs rohe Felder `usage_percent` / `usagePercent` geben das verbleibende Kontingent an, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben Vorrang, wenn sie vorhanden sind. `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag, leiten die Fensterbeschriftung bei Bedarf aus Zeitstempeln ab und nehmen den Modellnamen in die Planbeschriftung auf.
- Wenn der aktuelle Sitzungssnapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Transkript-Nutzungsprotokoll auffüllen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten.
- `/status` enthält eine kompakte Laufzeit des Gateway-Prozesses und die Betriebszeit des Hostsystems.
- Der Transkript-Fallback kann auch die Modellbeschriftung der aktiven Runtime wiederherstellen, wenn sie im Live-Sitzungseintrag fehlt. Wenn dieses Transkriptmodell vom ausgewählten Modell abweicht, löst der Status das Kontextfenster anhand des wiederhergestellten Runtime-Modells statt anhand des ausgewählten Modells auf.
- Für die Prompt-Größenberechnung bevorzugt der Transkript-Fallback die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen benutzerdefinierter Provider nicht auf `0`-Token-Anzeigen zusammenfallen.
- Die Ausgabe enthält sitzungsbezogene Speicher pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält, sofern verfügbar, den Installations- und Runtime-Status des Gateway- und Node-Hostdienstes.
- Die Übersicht enthält den Update-Kanal + Git-SHA (für Quellcode-Checkouts).
- Update-Informationen erscheinen in der Übersicht; wenn ein Update verfügbar ist, gibt der Status einen Hinweis zum Ausführen von `openclaw update` aus (siehe [Aktualisieren](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Zielkonfigurationspfade auf, wenn möglich.
- Wenn eine unterstützte Kanal-SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, bleibt der Status schreibgeschützt und meldet eine herabgestufte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „konfiguriertes Token in diesem Befehlspfad nicht verfügbar“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt der Status den aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen für „Secret nicht verfügbar“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile zu Secrets und einen Diagnoseabschnitt, der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne die Berichtserstellung zu stoppen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
