---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Schwachstellenoffenlegung verstehen
    - ClawHub-Plattformprobleme von Problemen mit Skills oder Plugins von Drittanbietern unterscheiden
sidebarTitle: Security
summary: Wie Sie ClawHub-Sicherheitsprobleme melden und wann Sicherheitslücken öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-03T02:46:49Z"
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
ClawHub-Advisory-Berichte enthalten Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichungen, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scans, Moderation oder Berichtsverarbeitung

Verwenden Sie ClawHub-Advisories nicht für Sicherheitslücken im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt beim Publisher oder im Quell-
Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Sicherheitslücken

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Sicherheitslücken des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Hinweise auf reale Auswirkungen für Benutzer gibt oder wenn Benutzer handeln müssen.

Beispiele für reale Auswirkungen für Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzer-
daten oder Secrets, schädliche Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Anmeldedaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Sicherheitslücken in vom Benutzer installierter Software werden öffentlich offengelegt, z. B.
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Findings und Interpretation finden Sie unter
[Security Audits](/clawhub/security-audits).

Informationen zu Marketplace-Berichten, Moderationssperren, ausgeblendeten Einträgen, Sperren und Konto-
status finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
