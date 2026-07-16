---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - Informationen zur Offenlegung von Schwachstellen in ClawHub
    - Unterscheidung zwischen Problemen der ClawHub-Plattform und Problemen mit Skills oder Plugins von Drittanbietern
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und erfahren, wann Schwachstellen öffentlich bekannt gegeben werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-16T12:34:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sicherheit

Sicherheitsprobleme in ClawHub können über GitHub Security Advisories für
`openclaw/clawhub` gemeldet werden.

Verwenden Sie GitHub Security Advisories für Schwachstellen in ClawHub selbst. Gute
ClawHub-Advisory-Berichte umfassen Fehler in:

- der ClawHub-Website, API oder CLI
- der Veröffentlichung in der Registry, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scans, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Skills oder
Plugins eines Drittanbieters. Melden Sie diese direkt dem Herausgeber oder dem
Quell-Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn
Nachweise für tatsächliche Auswirkungen auf Benutzer vorliegen oder Benutzer Maßnahmen ergreifen müssen.

Beispiele für tatsächliche Auswirkungen auf Benutzer sind bestätigte Ausnutzung, die Offenlegung von
Benutzerdaten oder Geheimnissen, schädliche Inhalte, die aufgrund eines Plattformfehlers Benutzer erreichen,
oder Probleme, die Benutzer dazu zwingen, Zugangsdaten zu erneuern, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, beispielsweise in
ClawHub-CLI-Paketen, Binärdateien, Bibliotheken oder anderen Release-Artefakten, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Kennzeichnungen bei der Installation, Risikostufen, Befunden und deren Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Kontosperren und
Kontostatus finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
