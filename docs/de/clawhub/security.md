---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Schwachstellenoffenlegung verstehen
    - ClawHub-Plattformprobleme von Problemen mit Drittanbieter-Skills oder -Plugins unterscheiden
sidebarTitle: Security
summary: So melden Sie ClawHub-Sicherheitsprobleme und erfahren, wann Sicherheitslücken öffentlich bekannt gegeben werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-05T05:46:56Z"
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
- Registry-Veröffentlichung, Downloads, Installationen oder Artefaktintegrität
- Authentifizierung, Autorisierung oder API-Tokens
- Scanning, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode
eines Drittanbieter-Skill oder -Plugin. Melden Sie diese direkt an den Publisher
oder das Quell-Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des
ClawHub-Dienstes standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich
offengelegt, wenn es Belege für tatsächliche Auswirkungen auf Nutzer gibt oder
wenn Nutzer Maßnahmen ergreifen müssen.

Beispiele für tatsächliche Auswirkungen auf Nutzer sind bestätigte Ausnutzung,
Offenlegung von Nutzerdaten oder Geheimnissen, schädliche Inhalte, die aufgrund
eines Plattformfehlers Nutzer erreichen, oder jedes Problem, das von Nutzern
verlangt, Zugangsdaten zu rotieren, lokale Software zu aktualisieren oder andere
Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Nutzern installierter Software werden öffentlich
offengelegt, etwa ClawHub-CLI-Pakete, Binärdateien, Bibliotheken oder andere
Release-Artefakte, die Nutzer lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Labels bei der Installation, Risikostufen, Befunden und
Interpretation finden Sie unter
[Sicherheits-Audits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten
Einträgen, Sperrungen und Kontostatus finden Sie unter [Moderation und
Kontosicherheit](/de/clawhub/moderation).
