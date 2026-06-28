---
read_when:
    - Een ClawHub-beveiligingsprobleem melden
    - Inzicht in openbaarmaking van ClawHub-kwetsbaarheden
    - ClawHub-platformproblemen onderscheiden van problemen met Skills of Plugins van derden
sidebarTitle: Security
summary: Hoe u ClawHub-beveiligingsproblemen meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-06-28T20:42:12Z"
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
ClawHub-advisoryrapporten bevatten bugs in:

- de ClawHub-website, API of CLI
- publiceren in het register, downloads, installaties of artefactintegriteit
- authenticatie, autorisatie of API-tokens
- scannen, moderatie of afhandeling van rapporten

Gebruik ClawHub-advisories niet voor kwetsbaarheden in de eigen broncode van een Skill of
Plugin van derden. Meld die rechtstreeks bij de uitgever of bronrepository
die vanuit de ClawHub-vermelding is gekoppeld.

## Bekendmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden ClawHub-servicekwetsbaarheden
standaard niet openbaar bekendgemaakt. Ze worden openbaar bekendgemaakt wanneer er
bewijs is van echte impact op gebruikers of wanneer gebruikers actie moeten ondernemen.

Voorbeelden van echte impact op gebruikers zijn bevestigde uitbuiting, blootstelling van gebruikersgegevens
of geheimen, schadelijke inhoud die gebruikers bereikt door een platformfout,
of elk probleem waarbij gebruikers referenties moeten roteren, lokale software moeten bijwerken of
andere beschermende maatregelen moeten nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar bekendgemaakt, zoals
ClawHub CLI-pakketten, binaries, bibliotheken of andere releaseartefacten die gebruikers
lokaal moeten bijwerken.

## Gerelateerde pagina's

Zie voor auditlabels tijdens installatie, risiconiveaus, bevindingen en interpretatie
[Security Audits](/nl/clawhub/security-audits).

Zie voor marktplaatsrapporten, moderatieblokkades, verborgen vermeldingen, bans en accountstatus
[Moderation and Account Safety](/nl/clawhub/moderation).
