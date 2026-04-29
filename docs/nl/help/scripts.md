---
read_when:
    - Scripts uitvoeren vanuit de repo
    - Scripts toevoegen of wijzigen onder ./scripts
summary: 'Repositoryscripts: doel, scope en veiligheidsopmerkingen'
title: Scripts
x-i18n:
    generated_at: "2026-04-29T22:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 16
---

De map `scripts/` bevat hulpscripts voor lokale workflows en operationele taken.
Gebruik deze wanneer een taak duidelijk aan een script is gekoppeld; geef anders de voorkeur aan de CLI.

## Conventies

- Scripts zijn **optioneel**, tenzij ernaar wordt verwezen in docs of release-checklists.
- Geef de voorkeur aan CLI-oppervlakken wanneer die bestaan (voorbeeld: auth-bewaking gebruikt `openclaw models status --check`).
- Ga ervan uit dat scripts hostspecifiek zijn; lees ze voordat je ze op een nieuwe machine uitvoert.

## Scripts voor auth-bewaking

Auth-bewaking wordt behandeld in [Authenticatie](/nl/gateway/authentication). De scripts onder `scripts/` zijn optionele extra's voor systemd/Termux-telefoonworkflows.

## GitHub-leeshulp

Gebruik `scripts/gh-read` wanneer je wilt dat `gh` een GitHub App-installatietoken gebruikt voor repository-gebonden leesaanroepen, terwijl normale `gh` je persoonlijke login blijft gebruiken voor schrijfacties.

Vereiste omgevingsvariabelen:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Optionele omgevingsvariabelen:

- `OPENCLAW_GH_READ_INSTALLATION_ID` wanneer je repository-gebaseerde installatiedetectie wilt overslaan
- `OPENCLAW_GH_READ_PERMISSIONS` als kommagescheiden override voor de subset leesrechten die moet worden aangevraagd

Volgorde voor repository-resolutie:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Voorbeelden:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Bij het toevoegen van scripts

- Houd scripts gericht en gedocumenteerd.
- Voeg een korte vermelding toe in de relevante doc (of maak er een aan als die ontbreekt).

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
