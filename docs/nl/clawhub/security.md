---
read_when:
    - Een beveiligingsprobleem in ClawHub melden
    - Inzicht in de bekendmaking van ClawHub-kwetsbaarheden
    - ClawHub-platformproblemen onderscheiden van problemen met Skills of Plugins van derden
sidebarTitle: Security
summary: Hoe u ClawHub-beveiligingsproblemen meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-07-03T23:37:00Z"
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
- registry-publicatie, downloads, installaties of artefactintegriteit
- authenticatie, autorisatie of API-tokens
- scannen, moderatie of rapportafhandeling

Gebruik ClawHub-advisories niet voor kwetsbaarheden in de eigen broncode van een externe skill of
plugin. Meld die rechtstreeks aan de uitgever of bronrepository
die vanuit de ClawHub-vermelding is gelinkt.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden kwetsbaarheden in de ClawHub-service
standaard niet openbaar gemaakt. Ze worden openbaar gemaakt wanneer er
bewijs is van daadwerkelijke impact op gebruikers of wanneer gebruikers actie moeten ondernemen.

Voorbeelden van daadwerkelijke impact op gebruikers zijn bevestigde uitbuiting, blootstelling van gebruikersgegevens
of geheimen, kwaadaardige content die gebruikers bereikt door een platformfout,
of elk probleem waarbij gebruikers inloggegevens moeten roteren, lokale software moeten bijwerken of
andere beschermende maatregelen moeten nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar gemaakt, zoals
ClawHub CLI-pakketten, binaries, libraries of andere releaseartefacten die gebruikers
lokaal moeten bijwerken.

## Gerelateerde pagina's

Voor auditlabels tijdens installatie, risiconiveaus, bevindingen en interpretatie, zie
[Beveiligingsaudits](/clawhub/security-audits).

Voor marketplace-rapporten, moderatieblokkades, verborgen vermeldingen, bans en accountstatus,
zie [Moderatie en accountveiligheid](/clawhub/moderation).
