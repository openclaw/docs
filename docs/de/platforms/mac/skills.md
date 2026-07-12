---
read_when:
    - Aktualisieren der macOS-Einstellungsoberfläche für Skills
    - Gating oder Installationsverhalten von Skills ändern
summary: macOS-Einstellungsoberfläche für Skills und Gateway-gestützter Status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T01:51:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Die macOS-App stellt OpenClaw Skills über den Gateway bereit; sie analysiert Skills nicht lokal.

## Datenquelle

- `skills.status` (Gateway) gibt alle Skills einschließlich ihrer Verwendbarkeit und fehlender Voraussetzungen zurück, darunter Sperren durch Zulassungslisten für mitgelieferte Skills.
- Die Voraussetzungen stammen aus `metadata.openclaw.requires` in der jeweiligen `SKILL.md`.

## Installationsaktionen

- `metadata.openclaw.install` definiert Installationsoptionen (brew/node/go/uv/download).
- Die App ruft `skills.install` auf, um Installationsprogramme auf dem Gateway-Host auszuführen.
- Die vom Betreiber verwaltete `security.installPolicy` (`enabled`, `targets`, `exec`) kann Gateway-gestützte Installationen von Skills blockieren, bevor die Metadaten des Installationsprogramms verarbeitet werden. Die integrierte Suche nach gefährlichem Code (die bei Plugin-Installationen verwendet wird) ist nicht in den Installationsablauf für Skills eingebunden.
- Wenn jede Installationsoption `download` lautet, stellt der Gateway alle Downloadoptionen bereit.
- Andernfalls wählt der Gateway anhand der aktuellen Installationseinstellungen (`skills.install.preferBrew`, `skills.install.nodeManager`) und der auf dem Host vorhandenen Binärdateien ein bevorzugtes Installationsprogramm aus: zuerst Homebrew, wenn `preferBrew` aktiviert und `brew` vorhanden ist, dann `uv`, dann den konfigurierten Node-Paketmanager, anschließend erneut Homebrew, sofern verfügbar (auch ohne `preferBrew`), dann `go` und schließlich `download`.
- Die Bezeichnungen für Node-Installationen entsprechen dem konfigurierten Node-Paketmanager, einschließlich `yarn`.

## Umgebungsvariablen/API-Schlüssel

- Die App speichert Schlüssel in `~/.openclaw/openclaw.json` unter `skills.entries.<skillKey>`.
- `skills.update` aktualisiert `enabled`, `apiKey` und `env`.

## Remote-Modus

- Installations- und Konfigurationsaktualisierungen erfolgen auf dem Gateway-Host, nicht auf dem lokalen Mac.

## Verwandte Themen

- [Skills](/de/tools/skills)
- [macOS-App](/de/platforms/macos)
