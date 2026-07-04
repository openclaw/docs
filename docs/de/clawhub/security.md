---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Offenlegung von Sicherheitslücken verstehen
    - Unterscheidung von ClawHub-Plattformproblemen und Drittanbieter-Skill- oder Plugin-Problemen
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und erfahren, wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-04T03:42:32Z"
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

Verwenden Sie GitHub Security Advisories für Schwachstellen in ClawHub selbst. Gute
ClawHub-Advisory-Berichte enthalten Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichung, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scanning, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt an den Publisher oder das Quell-
Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden ClawHub-Service-Schwachstellen
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Belege für echte Auswirkungen auf Benutzer gibt oder wenn Benutzer Maßnahmen ergreifen müssen.

Beispiele für echte Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzer-
daten oder Geheimnissen, bösartige Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das Benutzer dazu zwingt, Anmeldedaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, etwa
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Findings und Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperren und Konto-
status finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
