---
read_when:
    - Aktualisieren der macOS-Skills-Einstellungen im UI
    - Ändern der Skills-Zugangssteuerung oder des Installationsverhaltens
summary: macOS-Skills-Einstellungs-UI und Gateway-gestützter Status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:43:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Die macOS-App stellt OpenClaw Skills über das Gateway bereit; sie parst Skills nicht lokal.

## Datenquelle

- `skills.status` (Gateway) gibt alle Skills plus Eignung und fehlende Anforderungen zurück
  (einschließlich Allowlist-Sperren für gebündelte Skills).
- Anforderungen werden aus `metadata.openclaw.requires` in jeder `SKILL.md` abgeleitet.

## Installationsaktionen

- `metadata.openclaw.install` definiert Installationsoptionen (brew/node/go/uv).
- Die App ruft `skills.install` auf, um Installer auf dem Gateway-Host auszuführen.
- Die vom Operator verwaltete `security.installPolicy` kann Gateway-gestützte Skill-
  Installationen blockieren, bevor Installer-Metadaten ausgeführt werden. Die integrierte Blockierung von gefährlichem Code zur Installationszeit
  ist nicht Teil des Skill-Installationsablaufs.
- Wenn jede Installationsoption `download` ist, stellt das Gateway alle Download-
  Optionen bereit.
- Andernfalls wählt das Gateway anhand der aktuellen
  Installationseinstellungen und Host-Binärdateien einen bevorzugten Installer aus: zuerst Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` vorhanden ist, dann `uv`, dann der
  konfigurierte Node-Manager aus `skills.install.nodeManager`, danach weitere
  Fallbacks wie `go` oder `download`.
- Node-Installationslabels spiegeln den konfigurierten Node-Manager wider, einschließlich `yarn`.

## Umgebungs-/API-Schlüssel

- Die App speichert Schlüssel in `~/.openclaw/openclaw.json` unter `skills.entries.<skillKey>`.
- `skills.update` patcht `enabled`, `apiKey` und `env`.

## Remote-Modus

- Installations- und Konfigurationsupdates erfolgen auf dem Gateway-Host (nicht auf dem lokalen Mac).

## Verwandte Themen

- [Skills](/de/tools/skills)
- [macOS-App](/de/platforms/macos)
