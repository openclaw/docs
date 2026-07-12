---
read_when:
    - Aktualisieren der macOS-Einstellungsoberfläche für Skills
    - Ändern der Skills-Zugriffssteuerung oder des Installationsverhaltens
summary: macOS-Einstellungsoberfläche für Skills und Gateway-gestützter Status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T15:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Die macOS-App stellt OpenClaw-Skills über den Gateway bereit; sie analysiert Skills nicht lokal.

## Datenquelle

- `skills.status` (Gateway) gibt alle Skills sowie deren Verfügbarkeit und fehlende Voraussetzungen zurück, einschließlich Allowlist-Sperren für gebündelte Skills.
- Die Voraussetzungen stammen aus `metadata.openclaw.requires` in der jeweiligen `SKILL.md`.

## Installationsaktionen

- `metadata.openclaw.install` definiert Installationsoptionen (brew/node/go/uv/download).
- Die App ruft `skills.install` auf, um Installationsprogramme auf dem Gateway-Host auszuführen.
- Die vom Betreiber verwaltete `security.installPolicy` (`enabled`, `targets`, `exec`) kann Gateway-gestützte Skill-Installationen blockieren, bevor die Metadaten des Installationsprogramms verarbeitet werden. Die integrierte Prüfung auf gefährlichen Code (die für Plugin-Installationen verwendet wird) ist nicht in den Installationsablauf für Skills eingebunden.
- Wenn jede Installationsoption `download` lautet, stellt der Gateway alle Download-Optionen bereit.
- Andernfalls wählt der Gateway anhand der aktuellen Installationseinstellungen (`skills.install.preferBrew`, `skills.install.nodeManager`) und der auf dem Host vorhandenen Binärdateien ein bevorzugtes Installationsprogramm aus: zuerst Homebrew, wenn `preferBrew` aktiviert und `brew` vorhanden ist, dann `uv`, dann den konfigurierten Node-Manager, dann erneut Homebrew, falls verfügbar (auch ohne `preferBrew`), dann `go` und schließlich `download`.
- Die Bezeichnungen für Node-Installationen entsprechen dem konfigurierten Node-Manager, einschließlich `yarn`.

## Umgebungsvariablen/API-Schlüssel

- Die App speichert Schlüssel in `~/.openclaw/openclaw.json` unter `skills.entries.<skillKey>`.
- `skills.update` aktualisiert `enabled`, `apiKey` und `env`.

## Remote-Modus

- Installations- und Konfigurationsaktualisierungen erfolgen auf dem Gateway-Host, nicht auf dem lokalen Mac.

## Verwandte Themen

- [Skills](/de/tools/skills)
- [macOS-App](/de/platforms/macos)
