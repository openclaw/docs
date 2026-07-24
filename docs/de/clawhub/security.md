---
read_when:
    - Melden eines ClawHub-Sicherheitsproblems
    - ClawHub-Schwachstellenmeldungen verstehen
    - Unterscheidung zwischen Problemen der ClawHub-Plattform und Problemen mit Skills oder Plugins von Drittanbietern
sidebarTitle: Security
summary: So melden Sie Sicherheitsprobleme bei ClawHub und wann Sicherheitslücken öffentlich bekannt gegeben werden.
title: Sicherheit
x-i18n:
    generated_at: "2026-07-24T03:41:09Z"
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
- der Veröffentlichung in der Registry, bei Downloads, Installationen oder der Artefaktintegrität
- der Authentifizierung, Autorisierung oder bei API-Tokens
- der Überprüfung, Moderation oder Bearbeitung von Meldungen

Verwenden Sie ClawHub-Advisories nicht für Schwachstellen im eigenen Quellcode eines Skills oder
Plugins eines Drittanbieters. Melden Sie diese direkt dem Herausgeber oder dem Quellcode-
Repository, das im ClawHub-Eintrag verlinkt ist.

## Offenlegung von Schwachstellen

Da ClawHub eine gehostete Cloud-Anwendung ist, werden Schwachstellen des ClawHub-Dienstes
standardmäßig nicht öffentlich offengelegt. Sie werden öffentlich offengelegt, wenn es
Belege für tatsächliche Auswirkungen auf Benutzer gibt oder wenn Benutzer Maßnahmen ergreifen müssen.

Beispiele für tatsächliche Auswirkungen auf Benutzer sind bestätigte Ausnutzung, die Offenlegung von Benutzer-
daten oder Geheimnissen, bösartige Inhalte, die aufgrund eines Plattformfehlers Benutzer erreichen,
oder jedes Problem, das von Benutzern verlangt, Anmeldedaten zu erneuern, lokale Software zu aktualisieren oder
andere Schutzmaßnahmen zu ergreifen.

Schwachstellen in von Benutzern installierter Software werden öffentlich offengelegt, beispielsweise in
ClawHub-CLI-Paketen, Binärdateien, Bibliotheken oder anderen Release-Artefakten, die Benutzer
lokal aktualisieren müssen.

## Verwandte Seiten

Informationen zu Audit-Kennzeichnungen bei der Installation, Risikostufen, Befunden und deren Interpretation finden Sie unter
[Sicherheitsaudits](/clawhub/security-audits).

Informationen zu Marketplace-Meldungen, Moderationssperren, ausgeblendeten Einträgen, Ausschlüssen und dem Konto-
status finden Sie unter [Moderation und Kontosicherheit](/clawhub/moderation).
