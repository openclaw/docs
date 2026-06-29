---
read_when:
    - Een ClawHub-beveiligingsprobleem melden
    - ClawHub-kwetsbaarheidsmelding begrijpen
    - ClawHub-platformproblemen onderscheiden van problemen met externe Skills of Plugins
sidebarTitle: Security
summary: Hoe u beveiligingsproblemen in ClawHub meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-06-28T22:32:42Z"
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
ClawHub-advisorymeldingen bevatten bugs in:

- de ClawHub-website, API of CLI
- registry-publicatie, downloads, installaties of artifact-integriteit
- authenticatie, autorisatie of API-tokens
- scanning, moderatie of afhandeling van meldingen

Gebruik ClawHub-advisories niet voor kwetsbaarheden in de eigen broncode van een
Skill of Plugin van derden. Meld die rechtstreeks aan de uitgever of de
bronrepository die vanuit de ClawHub-vermelding is gelinkt.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudtoepassing is, worden kwetsbaarheden in de
ClawHub-service standaard niet openbaar gemaakt. Ze worden openbaar gemaakt
wanneer er bewijs is van echte gebruikersimpact of wanneer gebruikers actie
moeten ondernemen.

Voorbeelden van echte gebruikersimpact zijn bevestigde uitbuiting, blootstelling
van gebruikersgegevens of geheimen, schadelijke inhoud die gebruikers bereikt
door een platformfout, of elk probleem waarvoor gebruikers referenties moeten
roteren, lokale software moeten bijwerken of andere beschermende actie moeten
ondernemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar
gemaakt, zoals ClawHub CLI-pakketten, binaries, bibliotheken of andere
release-artifacts die gebruikers lokaal moeten bijwerken.

## Gerelateerde pagina's

Voor auditlabels tijdens installatie, risiconiveaus, bevindingen en interpretatie,
zie [Beveiligingsaudits](/nl/clawhub/security-audits).

Voor marktplaatsmeldingen, moderatieblokkades, verborgen vermeldingen, bans en
accountstatus, zie [Moderatie en accountveiligheid](/nl/clawhub/moderation).
