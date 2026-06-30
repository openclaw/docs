---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Schwachstellenoffenlegung verstehen
    - ClawHub-Plattformprobleme von Problemen mit Skills oder Plugins Dritter unterscheiden
sidebarTitle: Security
summary: Wie Sie ClawHub-Sicherheitsprobleme melden und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-06-30T22:12:37Z"
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
ClawHub-Advisory-Meldungen umfassen Fehler in:

- der ClawHub-Website, API oder CLI
- Registry-Veröffentlichungen, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scanning, Moderation oder Meldungsbearbeitung

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder -Plugins. Melden Sie diese direkt beim Publisher oder im Quell-Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen im ClawHub-Dienst
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Hinweise auf tatsächliche Auswirkungen auf Benutzer gibt oder wenn Benutzer handeln müssen.

Beispiele für tatsächliche Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten oder Secrets, bösartige Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen, oder jedes Problem, das Benutzer dazu veranlasst, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, etwa
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Befunden und Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperrungen und Kontostatus finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
