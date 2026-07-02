---
read_when:
    - Ein ClawHub-Sicherheitsproblem melden
    - Informationen zur Offenlegung von ClawHub-Schwachstellen
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: Wie Sie Sicherheitsprobleme in ClawHub melden und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-02T14:02:28Z"
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
- Scanning, Moderation oder Berichtsverarbeitung

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode einer Drittanbieter-Skill oder
eines Drittanbieter-Plugins. Melden Sie diese direkt beim Publisher oder im Quell-
Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden ClawHub-Service-Schwachstellen
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn
Hinweise auf reale Auswirkungen für Benutzer vorliegen oder wenn Benutzer handeln müssen.

Beispiele für reale Auswirkungen für Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzer-
daten oder Geheimnissen, schädliche Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, etwa
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels zur Installationszeit, Risikostufen, Befunden und Interpretation finden Sie unter
[Security Audits](/clawhub/security-audits).

Informationen zu Marketplace-Berichten, Moderationssperren, ausgeblendeten Einträgen, Sperrungen und Konto-
Status finden Sie unter [Moderation and Account Safety](/clawhub/moderation).
