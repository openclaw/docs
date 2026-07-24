---
read_when:
    - Sie möchten eine schnelle Diagnose des Kanalzustands und der Empfänger der letzten Sitzungen.
    - Sie möchten einen einfügbaren „all“-Status für das Debugging.
summary: CLI-Referenz für `openclaw status` (Diagnose, Prüfungen, Nutzungsmomentaufnahmen)
title: openclaw status
x-i18n:
    generated_at: "2026-07-24T04:29:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52e8076339216f11ddadf35e0ae8e5604322a47a5a9e2ee305468b2624d7cfde
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

| Flag                    | Beschreibung                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Vollständige Diagnose (schreibgeschützt, zum Einfügen geeignet). Umfasst Sicherheitsprüfung, Plugin-Kompatibilität und Memory-Vektor-Prüfungen. |
| `--deep`                | Führt Live-Prüfungen aus (WhatsApp Web + Telegram + Discord + Slack + Signal). Aktiviert außerdem die Sicherheitsprüfung.         |
| `--usage`               | Gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.                                                          |
| `--json`                | Maschinenlesbare Ausgabe.                                                                                        |
| `--verbose` / `--debug` | Gibt vor dem Bericht außerdem die unaufgelöste Gateway-Zielauflösung aus.                                                 |

Einfaches `openclaw status` bleibt auf dem schnellen schreibgeschützten Pfad und kennzeichnet Memory als
`not checked` statt als nicht verfügbar, wenn die Memory-Überprüfung übersprungen wird. Aufwendige
Sicherheitsprüfungen, Plugin-Kompatibilitätsprüfungen und Memory-Vektor-Prüfungen bleiben
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
und `openclaw memory status --deep` vorbehalten.

## Sitzungs- und Modellauflösung

- Die Sitzungsstatusausgabe unterscheidet `Execution:` von `Runtime:`. `Execution`
  ist der Sandbox-Pfad (`direct`, `docker/*`), während `Runtime` angibt,
  ob die Sitzung `OpenClaw Default`, `OpenAI Codex`, ein CLI-
  Backend oder ein ACP-Backend wie `codex (acp/acpx)` verwendet. Informationen zur Unterscheidung
  zwischen Provider, Modell und Runtime finden Sie unter
  [Agent-Runtimes](/de/concepts/agent-runtimes).
- Wenn der aktuelle Sitzungssnapshot unvollständig ist, kann `/status` Token-
  und Cache-Zähler aus dem neuesten Transkript-Nutzungsprotokoll ergänzen. Bereits vorhandene
  Live-Werte ungleich null haben weiterhin Vorrang vor Transkript-Fallback-Werten.
- Der Transkript-Fallback kann außerdem die Bezeichnung des aktiven Runtime-Modells wiederherstellen, wenn
  sie im Live-Sitzungseintrag fehlt. Wenn sich dieses Transkriptmodell
  vom ausgewählten Modell unterscheidet, löst der Status das Kontextfenster anhand des
  wiederhergestellten Runtime-Modells statt anhand des ausgewählten Modells auf.
- Für die Berechnung der Prompt-Größe bevorzugt der Transkript-Fallback den größeren
  promptbezogenen Gesamtwert, wenn Sitzungsmetadaten fehlen oder kleiner sind, damit
  Sitzungen benutzerdefinierter Provider nicht auf eine Token-Anzeige von `0` zurückfallen.
- Wenn eine Sitzung an ein Modell gebunden ist, das sich vom konfigurierten
  primären Modell unterscheidet, gibt der Status beide Werte, den Grund (`session override`) und
  den Hinweis `/model default` aus. Das konfigurierte primäre Modell gilt für neue oder
  nicht gebundene Sitzungen; bestehende gebundene Sitzungen behalten ihre Sitzungsauswahl,
  bis sie gelöscht wird.
- Die Ausgabe enthält die Sitzungsspeicher der einzelnen Agenten, wenn mehrere Agenten
  konfiguriert sind.

## Nutzung und Kontingent

- `--usage` gibt normalisierte Provider-Nutzungsfenster als `X% left` aus.
- Die Rohfelder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an,
  daher invertiert OpenClaw sie vor der Anzeige; anzahlbasierte Felder haben Vorrang, wenn
  sie vorhanden sind. Bei `model_remains`-Antworten wird der Eintrag des Chatmodells bevorzugt, die
  Fensterbezeichnung bei Bedarf aus Zeitstempeln abgeleitet und der Modellname in
  die Planbezeichnung aufgenommen.
- Fehler beim Aktualisieren der Modellpreise werden als optionale Preiswarnungen angezeigt.
  Sie bedeuten nicht, dass der Gateway oder die Kanäle fehlerhaft sind.

## Übersicht und Aktualisierungsstatus

- Die Übersicht enthält, sofern verfügbar, den Installations- und Runtime-Status des Gateway- und Node-Hostdienstes
  sowie eine kompakte Anzeige der Gateway-Prozesslaufzeit und der Hostsystemlaufzeit.
- Die Übersicht enthält den Aktualisierungskanal und den Git-SHA (bei Quellcode-Checkouts).
- Aktualisierungsinformationen werden in der Übersicht angezeigt. Wenn eine Aktualisierung verfügbar ist, gibt der Status
  einen Hinweis zum Ausführen von `openclaw update` aus (siehe [Aktualisieren](/de/install/updating)).

## Secrets

- Wenn der laufende Gateway einen isolierten SecretRef-Eigentümer aus dem Startvorgang, einem Neuladen oder einem Konfigurationsschreibvorgang enthält, umfasst der Status `degradedSecretOwners` in JSON sowie eine Übersichtszeile **Beeinträchtigte Secrets** in der menschenlesbaren Ausgabe. Jeder Eintrag nennt den Eigentümer, den Beeinträchtigungszustand (`cold` oder `stale`), die Konfigurationspfade und den redigierten Grund. Kalte Eigentümer sind nicht verfügbar; veraltete Eigentümer verwenden weiterhin die letzten bekannten funktionsfähigen Werte.
- Schreibgeschützte Statusoberflächen (`status`, `status --json`, `status --all`)
  lösen unterstützte SecretRefs für ihre jeweiligen Konfigurationspfade auf, wenn
  dies möglich ist.
- Wenn ein unterstützter Kanal-SecretRef konfiguriert, im
  aktuellen Befehlspfad jedoch nicht verfügbar ist, bleibt der Status schreibgeschützt und meldet eine beeinträchtigte Ausgabe,
  statt abzustürzen. Die menschenlesbare Ausgabe zeigt Warnungen wie „konfiguriertes Token
  ist in diesem Befehlspfad nicht verfügbar“, und die JSON-Ausgabe enthält
  `secretDiagnostics`.
- Wenn die befehlslokale SecretRef-Auflösung erfolgreich ist, bevorzugt der Status den
  aufgelösten Snapshot und entfernt vorübergehende Kanalmarkierungen des Typs „Secret nicht verfügbar“
  aus der endgültigen Ausgabe.
- `status --all` enthält eine Secrets-Übersichtszeile und einen Diagnoseabschnitt,
  der Secret-Diagnosen zusammenfasst (zur besseren Lesbarkeit gekürzt), ohne
  die Berichterstellung zu stoppen.

## Memory

`status --json --all` meldet Memory-Details aus der aktiven Memory-Plugin-
Runtime, die durch `plugins.slots.memory` ausgewählt wurde. Benutzerdefinierte Memory-Plugins können das
integrierte `memory.search.enabled` deaktiviert lassen und dennoch
ihre eigenen Dateien, Chunks sowie ihren Vektor- und FTS-Status melden.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/gateway/doctor)
