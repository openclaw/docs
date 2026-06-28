---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Offenlegung von Sicherheitslücken verstehen
    - ClawHub-Plattformprobleme von Problemen mit Skills oder Plugins von Drittanbietern unterscheiden
sidebarTitle: Security
summary: Wie Sie ClawHub-Sicherheitsprobleme melden und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-06-28T05:31:22Z"
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
- Scanning, Moderation oder Berichtsverarbeitung

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository,
das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Hinweise auf echte Auswirkungen für Benutzer gibt oder wenn Benutzer handeln müssen.

Beispiele für echte Auswirkungen für Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten
oder Secrets, bösartige Inhalte, die aufgrund eines Plattformfehlers Benutzer erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in vom Benutzer installierter Software werden öffentlich offengelegt, etwa
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Installationszeitliche Audit-Labels, Risikostufen, Findings und deren Interpretation finden Sie unter
[Security Audits](/de/clawhub/security-audits).

Marketplace-Berichte, Moderationssperren, ausgeblendete Einträge, Sperren und Kontostatus finden Sie unter [Moderation and Account Safety](/de/clawhub/moderation).
