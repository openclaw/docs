---
read_when:
    - Een beveiligingsprobleem met ClawHub melden
    - Inzicht in de openbaarmaking van kwetsbaarheden in ClawHub
    - ClawHub-platformproblemen onderscheiden van problemen met Skills of Plugins van derden
sidebarTitle: Security
summary: Hoe u ClawHub-beveiligingsproblemen meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-06-28T07:42:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging

Beveiligingsproblemen in ClawHub kunnen worden gemeld via GitHub Security Advisories voor
`openclaw/clawhub`.

Gebruik GitHub Security Advisories voor kwetsbaarheden in ClawHub zelf. Goede
ClawHub-adviesrapporten omvatten bugs in:

- de ClawHub-website, API of CLI
- publiceren in het register, downloads, installaties of artifactintegriteit
- authenticatie, autorisatie of API-tokens
- scannen, moderatie of rapportafhandeling

Gebruik ClawHub-adviezen niet voor kwetsbaarheden in de eigen broncode van een externe skill of
Plugin. Meld die rechtstreeks aan de uitgever of de bronrepository
waarnaar vanuit de ClawHub-vermelding wordt gelinkt.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden kwetsbaarheden in de ClawHub-service
standaard niet openbaar gemaakt. Ze worden openbaar gemaakt wanneer er
bewijs is van echte impact op gebruikers of wanneer gebruikers actie moeten ondernemen.

Voorbeelden van echte impact op gebruikers zijn bevestigde uitbuiting, blootstelling van gebruikersgegevens
of geheimen, schadelijke inhoud die gebruikers bereikt door een platformfout,
of elk probleem waarvoor gebruikers referenties moeten roteren, lokale software moeten bijwerken of
andere beschermende maatregelen moeten nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar gemaakt, zoals
ClawHub CLI-pakketten, binaries, bibliotheken of andere releaseartefacten die gebruikers
lokaal moeten bijwerken.

## Gerelateerde pagina's

Zie voor auditlabels tijdens installatie, risiconiveaus, bevindingen en interpretatie
[Beveiligingsaudits](/nl/clawhub/security-audits).

Zie voor marktplaatsrapporten, moderatieblokkeringen, verborgen vermeldingen, bans en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation).
