---
read_when:
    - Scripts uitvoeren vanuit de repo
    - Scripts toevoegen of wijzigen onder ./scripts
summary: 'Repositoryscripts: doel, bereik en veiligheidsopmerkingen'
title: Scripts
x-i18n:
    generated_at: "2026-05-06T09:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

De directory `scripts/` bevat hulpscripts voor lokale workflows en operationele taken.
Gebruik deze wanneer een taak duidelijk aan een script is gekoppeld; geef anders de voorkeur aan de CLI.

## Conventies

- Scripts zijn **optioneel**, tenzij ernaar wordt verwezen in documentatie of releasechecklists.
- Geef de voorkeur aan CLI-oppervlakken wanneer die bestaan (voorbeeld: authenticatiebewaking gebruikt `openclaw models status --check`).
- Ga ervan uit dat scripts hostspecifiek zijn; lees ze voordat je ze op een nieuwe machine uitvoert.

## Scripts voor authenticatiebewaking

Authenticatiebewaking wordt behandeld in [Authenticatie](/nl/gateway/authentication). De scripts onder `scripts/` zijn optionele extra's voor systemd-/Termux-telefoonworkflows.

## GitHub-leeshulp

Gebruik `scripts/gh-read` wanneer je wilt dat `gh` een installatietoken van een GitHub App gebruikt voor repo-gebonden leesaanroepen, terwijl normale `gh` je persoonlijke login blijft gebruiken voor schrijfacties.

Vereiste env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Optionele env:

- `OPENCLAW_GH_READ_INSTALLATION_ID` wanneer je het op repo gebaseerde opzoeken van installaties wilt overslaan
- `OPENCLAW_GH_READ_PERMISSIONS` als door komma's gescheiden override voor de subset van leesrechten die moet worden aangevraagd

Volgorde voor repo-resolutie:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Voorbeelden:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Bij het toevoegen van scripts

- Houd scripts gericht en gedocumenteerd.
- Voeg een korte vermelding toe in de relevante documentatie (of maak er een aan als die ontbreekt).

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
