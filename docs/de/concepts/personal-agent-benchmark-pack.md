---
read_when:
    - Lokale Zuverlässigkeitsprüfungen für persönliche Agenten ausführen
    - Erweitern des repositorygestützten QA-Szenariokatalogs
    - Überprüfung von Erinnerungen, Antworten, Memory, Schwärzung, sicherer Tool-Nachverfolgung, Aufgabenstatus, sicher teilbarer Diagnoseinformationen, beleggestützter Abschlussbestätigungen und Fehlerbehebung
summary: Lokale qa-channel-Szenarien für Workflow-Prüfungen datenschutzfreundlicher persönlicher Assistenten.
title: Benchmark-Paket für persönliche Agenten
x-i18n:
    generated_at: "2026-07-24T03:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Das Personal Agent Benchmark Pack ist ein kleines, Repository-gestütztes QA-Szenariopaket für
lokale Arbeitsabläufe persönlicher Assistenten. Es ist kein allgemeiner Modell-Benchmark und
benötigt keinen neuen Runner: Es verwendet den privaten QA-Stack ([QA-Übersicht](/de/concepts/qa-e2e-automation)),
den synthetischen [QA-Kanal](/de/channels/qa-channel) und den vorhandenen
`qa/scenarios`-YAML-Katalog erneut.

## Szenarien

Zehn Szenarien, definiert in `qa/scenarios/personal/*.yaml`:

| Szenario-ID                                | Prüfungen                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Simulierte persönliche Erinnerungen über lokale Cron-Zustellung                                 |
| `personal-channel-thread-reply`            | Simuliertes Routing von Direktnachrichten und Thread-Antworten über `qa-channel`          |
| `personal-memory-preference-recall`        | Simulierter Abruf von Präferenzen aus den temporären Speicherdateien des QA-Arbeitsbereichs     |
| `personal-redaction-no-secret-leak`        | Simulierte Prüfungen, dass Geheimnisse nicht ausgegeben werden                                  |
| `personal-tool-safety-followthrough`       | Sichere, durch Lesevorgänge gestützte Tool-Folgeaktion nach einem kurzen genehmigungsartigen Dialog |
| `personal-approval-denial-stop`            | Abbruchverhalten bei verweigerter Genehmigung einer sensiblen lokalen Leseanforderung           |
| `personal-task-followthrough-status`       | Nachweisgestützte Aufgabenstatusmeldung, die ausstehend, blockiert und erledigt getrennt hält    |
| `personal-share-safe-diagnostics-artifact` | Sicher teilbare Diagnoseartefakte, die nützliche Statusinformationen erhalten und persönliche Rohinhalte auslassen |
| `personal-no-fake-progress`                | Nachweisgestützte Abschlussmeldungen, die vor dem Vorliegen lokaler Belege keinen falschen Fortschritt behaupten |
| `personal-failure-recovery`                | Fehlerbehebung, die einen Teilstatus meldet und die Grenzen für Wiederholungsversuche klar hält |

Die maschinenlesbaren Metadaten des Pakets (ID-Liste, Titel, Beschreibung) befinden sich in
`extensions/qa-lab/src/scenario-packs.ts` als `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Führen Sie das Paket mit `--pack personal-agent` aus:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` ist bei wiederholten `--scenario`-Flags additiv. Explizite Szenarien werden
zuerst ausgeführt, anschließend werden die Paketszenarien in der Reihenfolge von `QA_PERSONAL_AGENT_SCENARIO_IDS`
ausgeführt, wobei Duplikate entfernt werden.

Das Paket ist für `qa-channel` mit `mock-openai` oder eine andere lokale QA-Provider-
Ausführungsspur vorgesehen. Richten Sie es nicht auf Live-Chat-Dienste oder echte persönliche Konten.

## Datenschutzmodell

Die Szenarien verwenden ausschließlich simulierte Benutzer, simulierte Präferenzen, simulierte Geheimnisse und den
temporären QA-Gateway-Arbeitsbereich, der von der Suite erstellt wird. Sie dürfen weder den echten Speicher,
die Sitzungen, Anmeldedaten, Startagenten oder globalen Konfigurationen von OpenClaw noch den Live-
Gateway-Status lesen oder schreiben.

Artefakte verbleiben im vorhandenen Artefaktverzeichnis der QA-Suite und werden wie
Testausgaben behandelt. Schwärzungsprüfungen verwenden simulierte Markierungen, sodass Fehler sicher
untersucht und in Issues erfasst werden können.

## Paket erweitern

Fügen Sie neue `.yaml`-Fälle unter `qa/scenarios/personal/` hinzu und fügen Sie anschließend die Szenario-ID
zu `QA_PERSONAL_AGENT_SCENARIO_IDS` hinzu. Halten Sie jeden Fall klein, lokal und in
`mock-openai` deterministisch und konzentrieren Sie ihn auf ein Verhalten eines persönlichen Assistenten.

Gute Kandidaten für Folgearbeiten: Prüfungen des Exports geschwärzter Abläufe, Prüfungen rein lokaler
Plugin-Arbeitsabläufe.

Vermeiden Sie das Hinzufügen eines neuen Runners, Plugins, einer Abhängigkeit, eines Live-Transports oder einer Modellbewertung,
bis der Szenariokatalog genügend stabile Fälle enthält, um diese Oberfläche zu rechtfertigen.
