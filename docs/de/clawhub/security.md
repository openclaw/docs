---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - Informationen zur Offenlegung von ClawHub-Sicherheitslücken
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-01T18:10:33Z"
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
- Scans, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt dem Herausgeber oder dem Quell-Repository,
das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Belege für reale Auswirkungen auf Benutzer gibt oder wenn Benutzer Maßnahmen ergreifen müssen.

Beispiele für reale Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten
oder Geheimnissen, schädliche Inhalte, die aufgrund eines Plattformfehlers Benutzer erreichen,
oder jedes Problem, das Benutzer dazu verpflichtet, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, z. B.
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels während der Installation, Risikostufen, Findings und Interpretation finden Sie unter
[Security Audits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Sperren und Kontostatus
finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
