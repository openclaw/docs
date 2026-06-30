---
read_when:
    - Een ClawHub-beveiligingsprobleem melden
    - Inzicht in ClawHub-kwetsbaarheidsmeldingen
    - ClawHub-platformproblemen onderscheiden van problemen met Skills of Plugins van derden
sidebarTitle: Security
summary: Hoe u beveiligingsproblemen in ClawHub meldt en wanneer kwetsbaarheden openbaar worden gemaakt.
title: Beveiliging
x-i18n:
    generated_at: "2026-06-30T22:24:00Z"
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
ClawHub-beveiligingsmeldingen omvatten bugs in:

- de ClawHub-website, API of CLI
- publiceren naar het register, downloads, installaties of artifactintegriteit
- authenticatie, autorisatie of API-tokens
- scannen, moderatie of afhandeling van meldingen

Gebruik ClawHub-advisories niet voor kwetsbaarheden in de eigen broncode van een skill of
Plugin van derden. Meld die rechtstreeks bij de uitgever of bronrepository
die vanuit de ClawHub-vermelding is gelinkt.

## Openbaarmaking van kwetsbaarheden

Omdat ClawHub een gehoste cloudapplicatie is, worden kwetsbaarheden in de
ClawHub-service standaard niet openbaar gemaakt. Ze worden openbaar gemaakt
wanneer er bewijs is van werkelijke impact op gebruikers of wanneer gebruikers
actie moeten ondernemen.

Voorbeelden van werkelijke impact op gebruikers zijn bevestigde uitbuiting,
blootstelling van gebruikersgegevens of geheimen, schadelijke content die
gebruikers bereikt door een platformfout, of elk probleem waarvoor gebruikers
referenties moeten rouleren, lokale software moeten bijwerken of andere
beschermende maatregelen moeten nemen.

Kwetsbaarheden in door gebruikers geïnstalleerde software worden openbaar
gemaakt, zoals ClawHub CLI-pakketten, binaries, bibliotheken of andere
release-artifacts die gebruikers lokaal moeten bijwerken.

## Gerelateerde pagina's

Zie [Beveiligingsaudits](/clawhub/security-audits) voor auditlabels tijdens installatie,
risiconiveaus, bevindingen en interpretatie.

Zie [Moderatie en accountveiligheid](/clawhub/moderation) voor marktplaatsmeldingen,
moderatieblokkades, verborgen vermeldingen, bans en accountstatus.
