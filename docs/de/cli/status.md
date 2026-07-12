---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalstatus und der Empfänger der letzten Sitzungen.
    - Sie möchten einen einfügbaren „all“-Status für die Fehlerdiagnose.
summary: CLI-Referenz für `openclaw status` (Diagnose, Prüfungen, Nutzungsmomentaufnahmen)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T15:15:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnose für Kanäle und Sitzungen.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Flag                    | Beschreibung                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Vollständige Diagnose (schreibgeschützt, zum Einfügen geeignet). Umfasst Sicherheitsaudit, Plugin-Kompatibilität und Memory-Vektor-Prüfungen. |
| `--deep`                | Führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal). Aktiviert außerdem das Sicherheitsaudit.            |
| `--usage`               | Gibt normalisierte Provider-Nutzungszeiträume als `X% left` aus.                                                                  |
| `--json`                | Maschinenlesbare Ausgabe.                                                                                                         |
| `--verbose` / `--debug` | Gibt vor dem Bericht zusätzlich die unaufgelöste Gateway-Zielauflösung aus.                                                       |

Ein einfaches `openclaw status` bleibt auf dem schnellen schreibgeschützten Pfad und kennzeichnet den Memory-Status als
`not checked` statt als nicht verfügbar, wenn die Memory-Prüfung übersprungen wird. Aufwendige
Sicherheitsaudits, Plugin-Kompatibilitätsprüfungen und Memory-Vektor-Prüfungen bleiben
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
und `openclaw memory status --deep` vorbehalten.

## Sitzungs- und Modellauflösung

- Die Ausgabe des Sitzungsstatus trennt `Execution:` von `Runtime:`. `Execution`
  bezeichnet den Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` angibt,
  ob die Sitzung `OpenClaw Default`, `OpenAI Codex`, ein CLI-
  Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Unter
  [Agent-Runtimes](/de/concepts/agent-runtimes) finden Sie Informationen zur Unterscheidung
  zwischen Provider, Modell und Runtime.
- Wenn der aktuelle Sitzungssnapshot nur wenige Daten enthält, kann `/status` Token-
  und Cache-Zähler aus dem neuesten Transkript-Nutzungsprotokoll ergänzen. Vorhandene
  Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten.
- Der Transkript-Fallback kann auch die Bezeichnung des aktiven Runtime-Modells wiederherstellen, wenn
  sie im Live-Sitzungseintrag fehlt. Wenn dieses Transkriptmodell vom
  ausgewählten Modell abweicht, löst der Status das Kontextfenster anhand des
  wiederhergestellten Runtime-Modells statt anhand des ausgewählten Modells auf.
- Für die Berechnung der Prompt-Größe bevorzugt der Transkript-Fallback die größere
  Prompt-bezogene Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit
  Sitzungen benutzerdefinierter Provider nicht auf eine Anzeige von `0` Token zurückfallen.
- Wenn eine Sitzung an ein Modell gebunden ist, das von der konfigurierten
  primären Auswahl abweicht, gibt der Status beide Werte, den Grund (`session override`) und
  den Hinweis `/model default` aus. Die konfigurierte primäre Auswahl gilt für neue oder
  nicht gebundene Sitzungen; vorhandene gebundene Sitzungen behalten ihre Sitzungsauswahl,
  bis sie aufgehoben wird.
- Die Ausgabe umfasst sitzungsbezogene Speicher pro Agent, wenn mehrere Agenten
  konfiguriert sind.

## Nutzung und Kontingent

- `--usage` gibt normalisierte Provider-Nutzungszeiträume als `X% left` aus.
- Die ursprünglichen Felder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an,
  daher invertiert OpenClaw sie vor der Anzeige; anzahlbasierte Felder haben Vorrang, wenn
  sie vorhanden sind. Bei `model_remains`-Antworten wird der Chat-Modelleintrag bevorzugt, die
  Zeitraumbeschriftung bei Bedarf aus Zeitstempeln abgeleitet und der Modellname in
  die Tarifbeschriftung aufgenommen.
- Fehler beim Aktualisieren der Modellpreise werden als optionale Preiswarnungen angezeigt.
  Sie bedeuten nicht, dass der Gateway oder die Kanäle fehlerhaft sind.

## Übersicht und Aktualisierungsstatus

- Die Übersicht enthält den Installations- und Runtime-Status des Gateway- und Node-Hostdienstes, sofern
  verfügbar, sowie eine kompakte Angabe zur Laufzeit des Gateway-Prozesses und zur Laufzeit des Hostsystems.
- Die Übersicht enthält den Aktualisierungskanal und den Git-SHA (für Quellcode-Checkouts).
- Aktualisierungsinformationen werden in der Übersicht angezeigt; wenn eine Aktualisierung verfügbar ist, gibt der Status
  einen Hinweis zur Ausführung von `openclaw update` aus (siehe [Aktualisierung](/de/install/updating)).

## Secrets

- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`)
  lösen unterstützte SecretRefs für ihre jeweiligen Konfigurationspfade auf, wenn
  dies möglich ist.
- Wenn eine unterstützte SecretRef für einen Kanal konfiguriert, aber im
  aktuellen Befehlspfad nicht verfügbar ist, bleibt der Status schreibgeschützt und meldet eine eingeschränkte Ausgabe,
  statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „configured token
  unavailable in this command path“ an, und die JSON-Ausgabe enthält
  `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt der Status den
  aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen für „secret unavailable“
  aus der endgültigen Ausgabe.
- `status --all` enthält eine Übersichtszeile zu Secrets und einen Diagnoseabschnitt,
  der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne
  die Berichterstellung zu stoppen.

## Memory

`status --json --all` meldet Memory-Details aus der Runtime des aktiven Memory-Plugins,
das durch `plugins.slots.memory` ausgewählt wird. Benutzerdefinierte Memory-Plugins können die integrierte Option
`agents.defaults.memorySearch.enabled` deaktiviert lassen und dennoch
ihren eigenen Status für Dateien, Chunks, Vektoren und FTS melden.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
