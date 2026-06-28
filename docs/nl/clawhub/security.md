---
read_when:
    - Een beveiligingsprobleem in ClawHub melden
    - Inzicht in openbaarmaking van ClawHub-kwetsbaarheden
    - ClawHub-platformproblemen onderscheiden van problemen met externe skills of plugins
sidebarTitle: Security
summary: Hoe u beveiligingsproblemen in ClawHub meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-06-28T00:11:51Z"
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
ClawHub-adviesmeldingen bevatten bugs in:

- de ClawHub-website, API of CLI
- registerpublicatie, downloads, installaties of artefactintegriteit
- authenticatie, autorisatie of API-tokens
- scanning, moderatie of afhandeling van meldingen

Gebruik ClawHub-adviezen niet voor kwetsbaarheden in de eigen broncode van een externe skill of
Plugin. Meld die rechtstreeks aan de uitgever of bronrepository die is gelinkt vanuit de ClawHub-vermelding.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden kwetsbaarheden in de ClawHub-service
standaard niet openbaar gemaakt. Ze worden openbaar gemaakt wanneer er
bewijs is van daadwerkelijke impact op gebruikers of wanneer gebruikers actie moeten ondernemen.

Voorbeelden van daadwerkelijke impact op gebruikers zijn bevestigde exploitatie, blootstelling van gebruikersgegevens
of geheimen, schadelijke content die gebruikers bereikt door een platformfout,
of elk probleem dat vereist dat gebruikers referenties roteren, lokale software bijwerken of
andere beschermende maatregelen nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar gemaakt, zoals
ClawHub CLI-pakketten, binaries, bibliotheken of andere releaseartefacten die gebruikers
lokaal moeten bijwerken.

## Gerelateerde pagina's

Zie voor auditlabels tijdens installatie, risiconiveaus, bevindingen en interpretatie
[Beveiligingsaudits](/nl/clawhub/security-audits).

Zie voor marketplace-meldingen, moderatieblokkades, verborgen vermeldingen, bans en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation).
