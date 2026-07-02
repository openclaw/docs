---
read_when:
    - Ein ClawHub-Sicherheitsproblem melden
    - ClawHub-Schwachstellenoffenlegung verstehen
    - Unterscheidung von ClawHub-Plattformproblemen und Problemen mit Skills oder Plugins von Drittanbietern
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und erfahren, wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-02T17:34:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit

ClawHub-Sicherheitsprobleme können über GitHub Security Advisories für
`openclaw/clawhub` gemeldet werden.

Verwenden Sie GitHub Security Advisories für Sicherheitslücken in ClawHub selbst. Gute
ClawHub-Advisory-Meldungen umfassen Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichungen, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scans, Moderation oder Meldungsbearbeitung

Verwenden Sie ClawHub-Advisories nicht für Sicherheitslücken im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt an den Herausgeber oder das Quell-Repository,
das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Sicherheitslücken

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Sicherheitslücken im ClawHub-Dienst
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Belege für reale Auswirkungen auf Benutzer gibt oder wenn Benutzer Maßnahmen ergreifen müssen.

Beispiele für reale Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten
oder Geheimnissen, schädliche Inhalte, die aufgrund eines Plattformfehlers Benutzer erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Anmeldedaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Sicherheitslücken in von Benutzern installierter Software werden öffentlich offengelegt, beispielsweise
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Befunden und Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperrungen und Kontostatus
finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
