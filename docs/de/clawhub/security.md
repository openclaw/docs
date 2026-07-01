---
read_when:
    - Ein ClawHub-Sicherheitsproblem melden
    - ClawHub-Sicherheitslückenoffenlegung verstehen
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und erfahren, wann Schwachstellen öffentlich offengelegt werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-01T05:37:07Z"
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
- Scans, Moderation oder Berichtsbearbeitung

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Drittanbieter-Skills oder
-Plugins. Melden Sie diese direkt an den Herausgeber oder das Quell-Repository,
das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden ClawHub-Dienstschwachstellen
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Belege für reale Auswirkungen auf Benutzer gibt oder wenn Benutzer handeln müssen.

Beispiele für reale Auswirkungen auf Benutzer sind bestätigte Ausnutzung, Offenlegung von Benutzerdaten
oder Geheimnissen, schädliche Inhalte, die Benutzer aufgrund eines Plattformfehlers erreichen,
oder jedes Problem, das erfordert, dass Benutzer Anmeldedaten rotieren, lokale Software aktualisieren oder
andere Schutzmaßnahmen ergreifen.

Schwachstellen in benutzerinstallierter Software werden öffentlich offengelegt, z. B.
ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere Release-Artefakte, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Installationszeit-Audit-Labels, Risikostufen, Befunde und Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Marketplace-Berichte, Moderationssperren, ausgeblendete Einträge, Sperren und Kontostatus
finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
