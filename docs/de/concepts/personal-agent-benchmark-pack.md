---
read_when:
    - Lokale Zuverlässigkeitsprüfungen für persönliche Agenten ausführen
    - Erweitern des repo-gestützten QA-Szenariokatalogs
    - Überprüfung von Erinnerung, Antwort, Speicher, Schwärzung, sicherer Tool-Ausführung, Aufgabenstatus, teilungssicheren Diagnosen, beweisgestützten Abschlussangaben und Fehlerbehebung
summary: Lokale qa-channel-Szenarien für datenschutzwahrende Workflow-Prüfungen persönlicher Assistenten.
title: Persönliches Agent-Benchmark-Paket
x-i18n:
    generated_at: "2026-06-27T17:25:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Der Personal-Agent-Benchmark-Pack ist ein kleines, repo-gestütztes QA-Szenariopaket für
lokale Workflows persönlicher Assistenten. Er ist kein generischer Modell-Benchmark und
erfordert keinen neuen Runner. Das Paket nutzt den privaten QA-Stack wieder, der im
[QA-Überblick](/de/concepts/qa-e2e-automation), im synthetischen
[QA-Kanal](/de/channels/qa-channel) und im bestehenden YAML-Katalog
`qa/scenarios` beschrieben ist.

Das erste Paket ist absichtlich eng gefasst:

- simulierte persönliche Erinnerungen über lokale Cron-Zustellung
- simuliertes DM- und Thread-Antwort-Routing über `qa-channel`
- simulierter Präferenzabruf aus den temporären Memory-Dateien des QA-Workspace
- simulierte Prüfungen, dass Secrets nicht wiedergegeben werden
- sicherer, lesegestützter Tool-Followthrough nach einer kurzen genehmigungsartigen Interaktion
- Stoppverhalten bei verweigerter Genehmigung für eine sensible lokale Leseanfrage
- beweisgestützte Aufgabenstatusberichte, die ausstehend, blockiert und erledigt getrennt halten
- teilungssichere Diagnoseartefakte, die nützlichen Status beibehalten und rohe persönliche Inhalte auslassen
- beweisgestützte Abschlussbehauptungen, die vorliegende Fortschritte vermeiden, bevor lokale Nachweise existieren
- Fehlerwiederherstellung, die Teilstatus meldet und Wiederholungsgrenzen klar hält

## Szenarien

Die maschinenlesbaren Paketmetadaten befinden sich in
`extensions/qa-lab/src/scenario-packs.ts`. Führen Sie das Paket mit
`--pack personal-agent` aus:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` ist additiv zu wiederholten `--scenario`-Flags. Explizite Szenarien werden
zuerst ausgeführt, danach laufen die Paketszenarien in der Reihenfolge von
`QA_PERSONAL_AGENT_SCENARIO_IDS`, wobei Duplikate entfernt werden.

Das Paket ist für `qa-channel` mit `mock-openai` oder einer anderen lokalen QA-
Provider-Lane ausgelegt. Es sollte nicht auf Live-Chatdienste oder echte persönliche
Konten gerichtet werden.

## Datenschutzmodell

Die Szenarien verwenden ausschließlich simulierte Benutzer, simulierte Präferenzen,
simulierte Secrets und den temporären QA-Gateway-Workspace, der von der Suite erstellt
wird. Sie dürfen keine echten OpenClaw-Benutzer-Memory-Daten, Sitzungen,
Anmeldedaten, Launch Agents, globalen Konfigurationen oder Live-Gateway-Zustände lesen
oder schreiben.

Artefakte verbleiben im bestehenden Artefaktverzeichnis der QA-Suite und sollten wie
Testausgabe behandelt werden. Schwärzungsprüfungen verwenden simulierte Marker, sodass
Fehler sicher geprüft und in Issues gemeldet werden können.

## Paket Erweitern

Fügen Sie neue `.yaml`-Fälle unter `qa/scenarios/personal/` hinzu und fügen Sie dann
die Szenario-ID zu `QA_PERSONAL_AGENT_SCENARIO_IDS` hinzu. Halten Sie jeden Fall klein,
lokal, deterministisch in `mock-openai` und auf ein Verhalten persönlicher Assistenten
fokussiert.

Gute Kandidaten für Folgearbeiten:

- Prüfungen für geschwärzte Trajektorienexporte
- Prüfungen für rein lokale Plugin-Workflows

Vermeiden Sie das Hinzufügen eines neuen Runners, Plugins, einer Abhängigkeit, eines
Live-Transports oder eines Modell-Judges, bis der Szenariokatalog genügend stabile
Fälle enthält, um diese Oberfläche zu rechtfertigen.
