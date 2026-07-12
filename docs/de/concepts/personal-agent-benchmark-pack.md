---
read_when:
    - Lokale Zuverlässigkeitsprüfungen für persönliche Agenten ausführen
    - Erweitern des repositorygestützten Katalogs für QA-Szenarien
    - Überprüfung von Erinnerungen, Antworten, Active Memory, Schwärzung, sicherer Tool-Nachverfolgung, Aufgabenstatus, sicher teilbaren Diagnosedaten, belegten Abschlussangaben und Fehlerbehebung
summary: Lokale qa-channel-Szenarien zur Überprüfung datenschutzwahrender Workflows für persönliche Assistenten.
title: Benchmark-Paket für persönliche Agenten
x-i18n:
    generated_at: "2026-07-12T01:33:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Das Personal Agent Benchmark Pack ist ein kleines, Repository-gestütztes Paket von QA-Szenarien für
lokale Arbeitsabläufe persönlicher Assistenten. Es ist kein allgemeiner Modell-Benchmark und
benötigt keinen neuen Runner: Es verwendet den privaten QA-Stack ([QA-Übersicht](/de/concepts/qa-e2e-automation)),
den synthetischen [QA-Kanal](/de/channels/qa-channel) und den vorhandenen
YAML-Katalog unter `qa/scenarios`.

## Szenarien

Zehn Szenarien, definiert in `qa/scenarios/personal/*.yaml`:

| Szenario-ID                                | Prüfungen                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Simulierte persönliche Erinnerungen durch lokale Cron-Zustellung                                                  |
| `personal-channel-thread-reply`            | Routing simulierter Direktnachrichten und Thread-Antworten über `qa-channel`                                      |
| `personal-memory-preference-recall`        | Simulierter Abruf von Präferenzen aus den Speicherdateien des temporären QA-Arbeitsbereichs                       |
| `personal-redaction-no-secret-leak`        | Prüfungen, dass simulierte Geheimnisse nicht wiedergegeben werden                                                 |
| `personal-tool-safety-followthrough`       | Sichere, lesegestützte Tool-Ausführung nach einem kurzen, genehmigungsähnlichen Dialogschritt                     |
| `personal-approval-denial-stop`            | Abbruchverhalten bei verweigerter Genehmigung einer sensiblen lokalen Leseanforderung                             |
| `personal-task-followthrough-status`       | Nachweisgestützte Aufgabenstatusmeldung, die ausstehende, blockierte und abgeschlossene Aufgaben getrennt hält    |
| `personal-share-safe-diagnostics-artifact` | Sicher teilbare Diagnoseartefakte, die nützliche Statusinformationen enthalten, aber persönliche Rohdaten auslassen |
| `personal-no-fake-progress`                | Nachweisgestützte Abschlussmeldungen, die vor dem Vorliegen lokaler Belege keinen falschen Fortschritt vortäuschen |
| `personal-failure-recovery`                | Fehlerbehebung, die den Teilstatus meldet und die Grenzen für erneute Versuche klar ausweist                      |

Die maschinenlesbaren Metadaten des Pakets (ID-Liste, Titel, Beschreibung) befinden sich in
`extensions/qa-lab/src/scenario-packs.ts` unter `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Führen Sie das Paket mit `--pack personal-agent` aus:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` lässt sich additiv mit wiederholten `--scenario`-Flags verwenden. Explizit angegebene Szenarien werden
zuerst ausgeführt, anschließend die Paketszenarien in der Reihenfolge von `QA_PERSONAL_AGENT_SCENARIO_IDS`,
wobei Duplikate entfernt werden.

Das Paket ist für `qa-channel` mit `mock-openai` oder einer anderen lokalen QA-Provider-
Lane vorgesehen. Richten Sie es nicht auf Live-Chatdienste oder echte persönliche Konten.

## Datenschutzmodell

Die Szenarien verwenden ausschließlich simulierte Benutzer, simulierte Präferenzen, simulierte Geheimnisse und den
temporären QA-Gateway-Arbeitsbereich, den die Suite erstellt. Sie dürfen weder reale OpenClaw-Benutzerspeicher,
Sitzungen, Anmeldedaten, Startagenten, globale Konfigurationen noch den Live-Zustand des Gateway lesen oder
schreiben.

Artefakte verbleiben im vorhandenen Artefaktverzeichnis der QA-Suite und werden
wie Testausgaben behandelt. Schwärzungsprüfungen verwenden simulierte Markierungen, sodass Fehler gefahrlos
untersucht und in Issues dokumentiert werden können.

## Paket erweitern

Fügen Sie neue `.yaml`-Fälle unter `qa/scenarios/personal/` hinzu und ergänzen Sie anschließend die Szenario-ID
in `QA_PERSONAL_AGENT_SCENARIO_IDS`. Halten Sie jeden Fall klein, lokal und in
`mock-openai` deterministisch und konzentrieren Sie ihn auf ein einzelnes Verhalten eines persönlichen Assistenten.

Gute Kandidaten für Folgearbeiten: Prüfungen des Exports geschwärzter Abläufe, Prüfungen rein lokaler
Plugin-Arbeitsabläufe.

Fügen Sie keinen neuen Runner, kein Plugin, keine Abhängigkeit, keinen Live-Transport und keine Modellbewertung
hinzu, bis der Szenariokatalog genügend stabile Fälle enthält, um diese zusätzliche Oberfläche zu rechtfertigen.
