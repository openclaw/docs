---
read_when:
    - De macOS Skills-instellingen-UI bijwerken
    - Installatiegedrag of gating van Skills wijzigen
summary: macOS Skills-instellingeninterface en gateway-ondersteunde status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:48:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

De macOS-app toont OpenClaw Skills via de Gateway; de app parseert Skills niet lokaal.

## Gegevensbron

- `skills.status` (Gateway) retourneert alle Skills plus geschiktheid en ontbrekende vereisten
  (inclusief allowlist-blokkades voor gebundelde Skills).
- Vereisten worden afgeleid van `metadata.openclaw.requires` in elke `SKILL.md`.

## Installatieacties

- `metadata.openclaw.install` definieert installatieopties (brew/node/go/uv).
- De app roept `skills.install` aan om installers op de Gateway-host uit te voeren.
- Door de operator beheerde `security.installPolicy` kan door de Gateway ondersteunde Skill-
  installaties blokkeren voordat installermetadata wordt uitgevoerd. Ingebouwde blokkering
  van gevaarlijke code tijdens installatie maakt geen deel uit van de Skill-installatiestroom.
- Als elke installatieoptie `download` is, toont de Gateway alle download-
  keuzes.
- Anders kiest de Gateway één voorkeursinstaller op basis van de huidige
  installatievoorkeuren en hostbinaries: Homebrew eerst wanneer
  `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de
  geconfigureerde Node-manager uit `skills.install.nodeManager`, en daarna latere
  fallbacks zoals `go` of `download`.
- Node-installatielabels weerspiegelen de geconfigureerde Node-manager, inclusief `yarn`.

## Omgevings-/API-sleutels

- De app slaat sleutels op in `~/.openclaw/openclaw.json` onder `skills.entries.<skillKey>`.
- `skills.update` patcht `enabled`, `apiKey` en `env`.

## Externe modus

- Installatie- en configuratie-updates gebeuren op de Gateway-host (niet op de lokale Mac).

## Gerelateerd

- [Skills](/nl/tools/skills)
- [macOS-app](/nl/platforms/macos)
