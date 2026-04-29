---
read_when:
    - De instellingen-UI voor Skills op macOS bijwerken
    - Skills-gating of installatiegedrag wijzigen
summary: macOS-UI voor Skills-instellingen en Gateway-ondersteunde status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-29T23:00:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 16
---

De macOS-app toont OpenClaw Skills via de Gateway; hij parseert Skills niet lokaal.

## Gegevensbron

- `skills.status` (Gateway) retourneert alle Skills plus geschiktheid en ontbrekende vereisten
  (inclusief blokkades via allowlists voor gebundelde Skills).
- Vereisten worden afgeleid van `metadata.openclaw.requires` in elke `SKILL.md`.

## Installatieacties

- `metadata.openclaw.install` definieert installatieopties (brew/node/go/uv).
- De app roept `skills.install` aan om installatieprogramma's op de Gateway-host uit te voeren.
- Ingebouwde `critical`-bevindingen voor gevaarlijke code blokkeren standaard `skills.install`; verdachte bevindingen geven nog steeds alleen een waarschuwing. De gevaarlijke override bestaat op het Gateway-verzoek, maar de standaard app-flow blijft fail-closed.
- Als elke installatieoptie `download` is, toont de Gateway alle downloadkeuzes.
- Anders kiest de Gateway één voorkeursinstallatieprogramma op basis van de huidige
  installatievoorkeuren en host-binaries: Homebrew eerst wanneer
  `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de
  geconfigureerde node-manager uit `skills.install.nodeManager`, en daarna latere
  fallbacks zoals `go` of `download`.
- Node-installatielabels weerspiegelen de geconfigureerde node-manager, inclusief `yarn`.

## Env-/API-sleutels

- De app slaat sleutels op in `~/.openclaw/openclaw.json` onder `skills.entries.<skillKey>`.
- `skills.update` patcht `enabled`, `apiKey` en `env`.

## Externe modus

- Installatie- en configuratie-updates gebeuren op de Gateway-host (niet op de lokale Mac).

## Gerelateerd

- [Skills](/nl/tools/skills)
- [macOS-app](/nl/platforms/macos)
