---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - Offenlegung von ClawHub-Sicherheitslücken verstehen
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und wann Sicherheitslücken öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-06-27T17:16:48Z"
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

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt an den Publisher oder das Quell-Repository,
das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Hinweise auf tatsächliche Auswirkungen auf Benutzer gibt oder wenn Benutzer handeln müssen.

Beispiele für tatsächliche Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten
oder Secrets, schädliche Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in vom Benutzer installierter Software werden öffentlich offengelegt, etwa
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels während der Installation, Risikostufen, Befunden und Interpretation finden Sie unter
[Security Audits](/de/clawhub/security-audits).

Informationen zu Marketplace-Berichten, Moderationssperren, ausgeblendeten Einträgen, Sperren und Kontostatus
finden Sie unter [Moderation and Account Safety](/de/clawhub/moderation).
