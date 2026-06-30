---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - Die Offenlegung von ClawHub-Schwachstellen verstehen
    - Unterscheiden von ClawHub-Plattformproblemen und Problemen mit Skills oder Plugins von Drittanbietern
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-06-30T13:53:17Z"
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
ClawHub-Advisory-Berichte umfassen Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichung, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scanning, Moderation oder Berichtsbearbeitung

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode einer Drittanbieter-Skill oder eines
Plugins. Melden Sie diese direkt an den Publisher oder das Quell-
Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Hinweise auf tatsächliche Auswirkungen auf Nutzer gibt oder wenn Nutzer Maßnahmen ergreifen müssen.

Beispiele für tatsächliche Auswirkungen auf Nutzer sind bestätigte Ausnutzung, Offenlegung von Nutzer-
daten oder Secrets, schädliche Inhalte, die Nutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das erfordert, dass Nutzer Anmeldedaten rotieren, lokale Software aktualisieren oder
andere Schutzmaßnahmen ergreifen.

Schwachstellen in von Nutzern installierter Software werden öffentlich offengelegt, beispielsweise
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Nutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Findings und Interpretation finden Sie unter
[Security Audits](/clawhub/security-audits).

Informationen zu Marketplace-Berichten, Moderationssperren, ausgeblendeten Einträgen, Sperren und Konto-
status finden Sie unter [Moderation and Account Safety](/clawhub/moderation).
