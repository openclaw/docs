---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalzustands und der letzten Sitzungsempfänger
    - Sie möchten einen einfügbaren „all“-Status zur Fehlersuche
summary: CLI-Referenz für `openclaw status` (Diagnosen, Prüfungen, Nutzungs-Snapshots)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T06:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnosen für Kanäle + Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Hinweise:

- `--deep` führt Live-Probes aus (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Einfaches `openclaw status` bleibt auf dem schnellen schreibgeschützten Pfad und markiert Memory als `not checked` statt als nicht verfügbar, wenn die Memory-Inspektion übersprungen wird. Aufwendige Sicherheitsaudits, Plugin-Kompatibilität und Memory-Vektor-Probes bleiben `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` und `openclaw memory status --deep` vorbehalten.
- `status --json --all` meldet Memory-Details aus der aktiven Memory-Plugin-Runtime, die über `plugins.slots.memory` ausgewählt wurde. Benutzerdefinierte Memory-Plugins können das integrierte `agents.defaults.memorySearch.enabled` deaktiviert lassen und trotzdem ihren eigenen Datei-, Chunk-, Vektor- und FTS-Status melden.
- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Sitzungsstatusausgabe trennt `Execution:` von `Runtime:`. `Execution` ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` Ihnen sagt, ob die Sitzung `OpenClaw Pi Default`, `OpenAI Codex`, ein CLI-Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes) für die Unterscheidung zwischen Provider, Modell und Runtime.
- Die rohen MiniMax-Felder `usage_percent` / `usagePercent` geben das verbleibende Kontingent an, daher invertiert OpenClaw sie vor der Anzeige; zählbasierte Felder haben Vorrang, wenn sie vorhanden sind. `model_remains`-Antworten bevorzugen den Chat-Modell-Eintrag, leiten die Fensterbeschriftung bei Bedarf aus Zeitstempeln ab und enthalten den Modellnamen in der Planbeschriftung.
- Wenn der aktuelle Sitzungs-Snapshot spärlich ist, kann `/status` Token- und Cache-Zähler aus dem neuesten Transcript-Nutzungsprotokoll auffüllen. Vorhandene, von null verschiedene Live-Werte haben weiterhin Vorrang vor Transcript-Fallback-Werten.
- `/status` enthält eine kompakte Gateway-Prozesslaufzeit und Hostsystem-Laufzeit.
- Der Transcript-Fallback kann auch die Modellbeschriftung der aktiven Runtime wiederherstellen, wenn sie im Live-Sitzungseintrag fehlt. Wenn dieses Transcript-Modell vom ausgewählten Modell abweicht, löst der Status das Kontextfenster anhand des wiederhergestellten Runtime-Modells statt des ausgewählten Modells auf.
- Für die Prompt-Größenabrechnung bevorzugt der Transcript-Fallback die größere promptorientierte Summe, wenn Sitzungsmetadaten fehlen oder kleiner sind, sodass Sitzungen mit benutzerdefinierten Providern nicht auf `0`-Token-Anzeigen zusammenfallen.
- Die Ausgabe enthält sitzungsbezogene Stores pro Agent, wenn mehrere Agenten konfiguriert sind.
- Die Übersicht enthält den Installations-/Runtime-Status von Gateway + Node-Hostdienst, wenn verfügbar.
- Die Übersicht enthält Update-Kanal + Git-SHA (für Quellcode-Checkouts).
- Update-Informationen erscheinen in der Übersicht; wenn ein Update verfügbar ist, gibt der Status einen Hinweis aus, `openclaw update` auszuführen (siehe [Aktualisieren](/de/install/updating)).
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`) lösen unterstützte SecretRefs für ihre Zielkonfigurationspfade nach Möglichkeit auf.
- Wenn ein unterstützter Kanal-SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, bleibt der Status schreibgeschützt und meldet eine beeinträchtigte Ausgabe, statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „konfiguriertes Token in diesem Befehlspfad nicht verfügbar“, und die JSON-Ausgabe enthält `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt der Status den aufgelösten Snapshot und entfernt vorübergehende Kanalmarker für „Secret nicht verfügbar“ aus der endgültigen Ausgabe.
- `status --all` enthält eine Secrets-Übersichtszeile und einen Diagnoseabschnitt, der Secret-Diagnosen zusammenfasst (aus Gründen der Lesbarkeit gekürzt), ohne die Berichterstellung zu stoppen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
