---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalzustands + der zuletzt verwendeten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status zur Fehlersuche
summary: CLI-Referenz für `openclaw status` (Diagnosen, Prüfungen, Nutzungs-Snapshots)
title: Status
x-i18n:
    generated_at: "2026-04-30T06:47:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnose für Kanäle + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Einfaches `openclaw status` bleibt auf dem schnellen, schreibgeschützten Pfad und markiert Speicher als `not checked` statt als nicht verfügbar, wenn die Speicherprüfung übersprungen wird. Umfangreiche Sicherheitsprüfung, Plugin-Kompatibilität und Speichervektor-Prüfungen bleiben `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` und `openclaw memory status --deep` vorbehalten.
- `status --json --all` meldet Speicherdetails aus der aktiven Speicher-Plugin-Laufzeit, die durch `plugins.slots.memory` ausgewählt wurde. Benutzerdefinierte Speicher-Plugins können das integrierte `agents.defaults.memorySearch.enabled` deaktiviert lassen und dennoch ihren eigenen Datei-, Chunk-, Vektor- und FTS-Status melden.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Sitzungsstatusausgabe trennt `Execution:` von `Runtime:`. `Execution` ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` angibt, ob die Sitzung `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes) für die Unterscheidung zwischen Provider, Modell und Laufzeit.
- MiniMaxs rohe Felder `usage_percent` / `usagePercent` sind verbleibendes Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählungsbasierte Felder haben Vorrang, wenn sie vorhanden sind. `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag, leiten die Fensterbezeichnung bei Bedarf aus Zeitstempeln ab und nehmen den Modellnamen in die Planbezeichnung auf.
- Wenn der aktuelle Sitzungssnapshot unvollständig ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Transkript-Nutzungsprotokoll ergänzen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten.
- Der Transkript-Fallback kann auch die Modellbezeichnung der aktiven Laufzeit wiederherstellen, wenn sie im Live-Sitzungseintrag fehlt. Wenn dieses Transkriptmodell vom ausgewählten Modell abweicht, löst der Status das Kontextfenster anhand des wiederhergestellten Laufzeitmodells statt des ausgewählten Modells auf.
- Für die Prompt-Größenberechnung bevorzugt der Transkript-Fallback die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit Sitzungen mit benutzerdefiniertem Provider nicht auf Token-Anzeigen von `0` zurückfallen.
- Die Ausgabe enthält sitzungsbezogene Speicher pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält den Installations- und Laufzeitstatus von Gateway + Node-Hostdienst, sofern verfügbar.
- Die Übersicht enthält Update-Kanal + Git-SHA (für Quellcode-Checkouts).
- Update-Informationen erscheinen in der Übersicht; wenn ein Update verfügbar ist, gibt der Status einen Hinweis aus, `openclaw update` auszuführen (siehe [Aktualisieren](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Ziel-Konfigurationspfade nach Möglichkeit auf.
- Wenn eine unterstützte Kanal-SecretRef konfiguriert, im aktuellen Befehlspfad aber nicht verfügbar ist, bleibt der Status schreibgeschützt und meldet eine eingeschränkte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „konfiguriertes Token in diesem Befehlspfad nicht verfügbar“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt der Status den aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen für „Secret nicht verfügbar“ aus der finalen Ausgabe.
- `status --all` enthält eine Secrets-Übersichtszeile und einen Diagnoseabschnitt, der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne die Berichtserstellung zu stoppen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
