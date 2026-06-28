---
read_when:
    - Auf einen Sicherheitsbericht oder einen vermuteten Sicherheitsvorfall reagieren
    - Eine koordinierte Offenlegung oder eine gepatchte Sicherheitsversion vorbereiten
    - Erwartungen an die Nachbereitung nach einem Vorfall überprüfen
summary: Wie OpenClaw Sicherheitsvorfälle triagiert, darauf reagiert und sie nachverfolgt
title: Reaktion auf Vorfälle
x-i18n:
    generated_at: "2026-05-06T07:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 1. Erkennung und Triage

Wir überwachen Sicherheitssignale aus:

- GitHub Security Advisories (GHSA) und privaten Schwachstellenmeldungen.
- Öffentlichen GitHub-Issues/-Diskussionen, wenn Meldungen nicht vertraulich sind.
- Automatisierten Signalen (zum Beispiel Dependabot, CodeQL, npm-Advisories und Secret Scanning).

Erste Triage:

1. Betroffene Komponente, Version und Auswirkungen auf Vertrauensgrenzen bestätigen.
2. Anhand des Geltungsbereichs und der Ausschlussregeln im `SECURITY.md` des Repositorys als Sicherheitsproblem oder als Härtung/keine Maßnahme klassifizieren.
3. Ein Incident Owner reagiert entsprechend.

## 2. Bewertung

Schweregrad-Leitfaden:

- **Critical:** Kompromittierung von Paket/Release/Repository, aktive Ausnutzung oder nicht authentifizierte Umgehung einer Vertrauensgrenze mit weitreichender Kontrolle oder Datenoffenlegung.
- **High:** Verifizierte Umgehung einer Vertrauensgrenze mit begrenzten Vorbedingungen (zum Beispiel authentifizierte, aber nicht autorisierte Aktion mit hoher Auswirkung) oder Offenlegung sensibler Zugangsdaten im Besitz von OpenClaw.
- **Medium:** Erhebliche Sicherheitsschwäche mit praktischer Auswirkung, aber eingeschränkter Ausnutzbarkeit oder wesentlichen Voraussetzungen.
- **Low:** Defense-in-depth-Befunde, eng begrenzter Denial-of-Service oder Härtungs-/Paritätslücken ohne nachgewiesene Umgehung einer Vertrauensgrenze.

## 3. Reaktion

1. Eingang gegenüber der meldenden Person bestätigen (privat, wenn vertraulich).
2. Auf unterstützten Releases und dem neuesten `main` reproduzieren, dann einen Patch mit Regressionsabdeckung implementieren und validieren.
3. Für kritische/hohe Incidents gepatchte Releases so schnell wie praktisch möglich vorbereiten.
4. Für mittlere/niedrige Incidents im normalen Release-Ablauf patchen und Hinweise zur Risikominderung dokumentieren.

## 4. Kommunikation

Wir kommunizieren über:

- GitHub Security Advisories im betroffenen Repository.
- Release Notes/Changelog-Einträge für behobene Versionen.
- Direkte Nachverfolgung mit der meldenden Person zu Status und Lösung.

Offenlegungsrichtlinie:

- Kritische/hohe Incidents sollten koordiniert offengelegt werden, mit CVE-Vergabe, wenn angemessen.
- Härtungsbefunde mit geringem Risiko können je nach Auswirkung und Benutzerexposition ohne CVE in Release Notes oder Advisories dokumentiert werden.

## 5. Wiederherstellung und Nachverfolgung

Nach Auslieferung des Fixes:

1. Behebungen in CI und Release-Artefakten verifizieren.
2. Eine kurze Nachbesprechung des Incidents durchführen (Zeitachse, Ursache, Erkennungslücke, Präventionsplan).
3. Folgeaufgaben für Härtung/Tests/Dokumentation hinzufügen und bis zum Abschluss nachverfolgen.
