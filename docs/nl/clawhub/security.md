---
read_when:
    - Een beveiligingsprobleem in ClawHub melden
    - ClawHub-kwetsbaarheidsmelding begrijpen
    - ClawHub-platformproblemen onderscheiden van problemen met Skills of Plugins van derden
sidebarTitle: Security
summary: Hoe u beveiligingsproblemen met ClawHub meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-07-03T15:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging

ClawHub-beveiligingsproblemen kunnen worden gemeld via GitHub Security Advisories voor
`openclaw/clawhub`.

Gebruik GitHub Security Advisories voor kwetsbaarheden in ClawHub zelf. Goede
ClawHub-advisorymeldingen omvatten bugs in:

- de ClawHub-website, API of CLI
- publiceren in het register, downloads, installaties of artefactintegriteit
- authenticatie, autorisatie of API-tokens
- scans, moderatie of afhandeling van meldingen

Gebruik ClawHub-advisories niet voor kwetsbaarheden in de eigen broncode van een
Skill of Plugin van derden. Meld die rechtstreeks bij de uitgever of het
bronrepository waarnaar wordt gelinkt vanuit de ClawHub-vermelding.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden kwetsbaarheden in de
ClawHub-service standaard niet openbaar gemaakt. Ze worden openbaar gemaakt
wanneer er bewijs is van echte impact op gebruikers of wanneer gebruikers actie
moeten ondernemen.

Voorbeelden van echte impact op gebruikers zijn bevestigde uitbuiting,
blootstelling van gebruikersgegevens of geheimen, kwaadaardige inhoud die
gebruikers bereikt door een platformfout, of elk probleem waarvoor gebruikers
referenties moeten roteren, lokale software moeten bijwerken of andere
beschermende maatregelen moeten nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar
gemaakt, zoals ClawHub CLI-pakketten, binaries, bibliotheken of andere
releaseartefacten die gebruikers lokaal moeten bijwerken.

## Gerelateerde pagina's

Zie [Beveiligingsaudits](/clawhub/security-audits) voor auditlabels bij
installatie, risiconiveaus, bevindingen en interpretatie.

Zie [Moderatie en accountveiligheid](/nl/clawhub/moderation) voor
marketplacemeldingen, moderatieblokkades, verborgen vermeldingen, verbanningen
en accountstatus.
