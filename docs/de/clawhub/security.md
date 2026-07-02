---
read_when:
    - Ein ClawHub-Sicherheitsproblem melden
    - ClawHub-Offenlegung von Schwachstellen verstehen
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: Wie Sie Sicherheitsprobleme in ClawHub melden und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-02T22:26:27Z"
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
ClawHub-Sicherheitsmeldungen umfassen Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichung, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scans, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Sicherheitsmeldungen nicht für Schwachstellen im eigenen Quellcode eines Skills oder Plugins von Drittanbietern. Melden Sie diese direkt dem Herausgeber oder dem Quell-Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen im ClawHub-Dienst standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es Hinweise auf tatsächliche Auswirkungen auf Nutzer gibt oder wenn Nutzer Maßnahmen ergreifen müssen.

Beispiele für tatsächliche Auswirkungen auf Nutzer sind bestätigte Ausnutzung, Offenlegung von Nutzerdaten oder Secrets, bösartige Inhalte, die Nutzer aufgrund eines Plattformfehlers erreichen, oder jedes Problem, bei dem Nutzer Zugangsdaten rotieren, lokale Software aktualisieren oder andere Schutzmaßnahmen ergreifen müssen.

Schwachstellen in von Nutzern installierter Software werden öffentlich offengelegt, etwa ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Nutzer lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Findings und Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperren und Kontostatus finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
