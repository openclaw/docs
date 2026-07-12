---
read_when:
    - De gebruikersinterface voor Skills-instellingen in macOS bijwerken
    - Gating of installatiegedrag van Skills wijzigen
summary: macOS-instellingeninterface voor Skills en Gateway-ondersteunde status
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T09:06:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

De macOS-app biedt OpenClaw Skills aan via de Gateway; Skills worden niet lokaal geparseerd.

## Gegevensbron

- `skills.status` (Gateway) retourneert alle Skills, inclusief geschiktheid en ontbrekende vereisten, waaronder blokkeringen via de toelatingslijst voor meegeleverde Skills.
- Vereisten zijn afkomstig uit `metadata.openclaw.requires` in elk `SKILL.md`.

## Installatieacties

- `metadata.openclaw.install` definieert installatieopties (brew/node/go/uv/download).
- De app roept `skills.install` aan om installatieprogramma's op de Gateway-host uit te voeren.
- Het door de beheerder beheerde `security.installPolicy` (`enabled`, `targets`, `exec`) kan door de Gateway ondersteunde installaties van Skills blokkeren voordat de metagegevens van het installatieprogramma worden verwerkt. De ingebouwde scan op gevaarlijke code (gebruikt voor installaties van Plugins) is niet gekoppeld aan het installatieproces voor Skills.
- Als elke installatieoptie `download` is, biedt de Gateway alle downloadopties aan.
- Anders kiest de Gateway één voorkeursinstallatieprogramma op basis van de huidige installatievoorkeuren (`skills.install.preferBrew`, `skills.install.nodeManager`) en binaire bestanden op de host: eerst Homebrew wanneer `preferBrew` is ingeschakeld en `brew` aanwezig is, daarna `uv`, vervolgens het geconfigureerde Node-beheerprogramma, daarna opnieuw Homebrew als dit beschikbaar is (zelfs zonder `preferBrew`), vervolgens `go` en ten slotte `download`.
- Labels voor Node-installaties geven het geconfigureerde Node-beheerprogramma weer, waaronder `yarn`.

## Omgevingsvariabelen/API-sleutels

- De app slaat sleutels op in `~/.openclaw/openclaw.json` onder `skills.entries.<skillKey>`.
- `skills.update` werkt `enabled`, `apiKey` en `env` gedeeltelijk bij.

## Externe modus

- Installatie- en configuratie-updates vinden plaats op de Gateway-host, niet op de lokale Mac.

## Gerelateerd

- [Skills](/nl/tools/skills)
- [macOS-app](/nl/platforms/macos)
