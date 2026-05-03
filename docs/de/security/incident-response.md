---
read_when:
    - Reaktion auf einen Sicherheitsbericht oder einen vermuteten Sicherheitsvorfall
    - Vorbereitung einer koordinierten Offenlegung oder eines gepatchten Sicherheitsreleases
    - Überprüfung der Erwartungen an die Nachbereitung nach einem Vorfall
summary: Wie OpenClaw Sicherheitsvorfälle triagiert, darauf reagiert und sie nachverfolgt
title: Reaktion auf Vorfälle
x-i18n:
    generated_at: "2026-05-03T21:38:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Reaktion auf Sicherheitsvorfälle

## 1. Erkennung und Triage

Wir überwachen Sicherheitssignale aus:

- GitHub-Sicherheitshinweisen (GHSA) und privaten Schwachstellenmeldungen.
- Öffentlichen GitHub-Issues/-Diskussionen, wenn Meldungen nicht sensibel sind.
- Automatisierten Signalen (zum Beispiel Dependabot, CodeQL, npm-Sicherheitshinweise und Secret Scanning).

Erste Triage:

1. Betroffene Komponente, Version und Auswirkung auf Vertrauensgrenzen bestätigen.
2. Mithilfe des Geltungsbereichs und der Ausnahmenregeln in der `SECURITY.md` des Repositorys als Sicherheitsproblem gegenüber Härtung/keine Maßnahme klassifizieren.
3. Ein Verantwortlicher für den Vorfall reagiert entsprechend.

## 2. Bewertung

Leitfaden zur Schwere:

- **Kritisch:** Kompromittierung von Paket/Release/Repository, aktive Ausnutzung oder nicht authentifizierte Umgehung einer Vertrauensgrenze mit weitreichender Kontrolle oder Datenoffenlegung.
- **Hoch:** Verifizierte Umgehung einer Vertrauensgrenze mit begrenzten Vorbedingungen (zum Beispiel authentifizierte, aber nicht autorisierte Aktion mit hoher Auswirkung) oder Offenlegung sensibler Zugangsdaten, die OpenClaw gehören.
- **Mittel:** Erhebliche Sicherheitsschwäche mit praktischer Auswirkung, aber eingeschränkter Ausnutzbarkeit oder erheblichen Voraussetzungen.
- **Niedrig:** Defense-in-Depth-Befunde, eng begrenzte Dienstverweigerung oder Härtungs-/Paritätslücken ohne nachgewiesene Umgehung einer Vertrauensgrenze.

## 3. Reaktion

1. Eingang gegenüber der meldenden Person bestätigen (privat, wenn sensibel).
2. Auf unterstützten Releases und dem aktuellen `main` reproduzieren, anschließend einen Patch mit Regressionsabdeckung implementieren und validieren.
3. Bei kritischen/hohen Vorfällen gepatchte Release(s) so schnell wie praktikabel vorbereiten.
4. Bei mittleren/niedrigen Vorfällen im normalen Release-Ablauf patchen und Hinweise zur Risikominderung dokumentieren.

## 4. Kommunikation

Wir kommunizieren über:

- GitHub-Sicherheitshinweise im betroffenen Repository.
- Release Notes/Changelog-Einträge für behobene Versionen.
- Direkte Nachverfolgung mit der meldenden Person zu Status und Behebung.

Offenlegungsrichtlinie:

- Kritische/hohe Vorfälle sollten koordiniert offengelegt werden, mit CVE-Vergabe, wenn angemessen.
- Härtungsbefunde mit geringem Risiko können je nach Auswirkung und Betroffenheit der Nutzer in Release Notes oder Sicherheitshinweisen ohne CVE dokumentiert werden.

## 5. Wiederherstellung und Nachverfolgung

Nach Auslieferung des Fixes:

1. Abhilfemaßnahmen in CI und Release-Artefakten verifizieren.
2. Eine kurze Nachbesprechung des Vorfalls durchführen (Zeitachse, Grundursache, Erkennungslücke, Präventionsplan).
3. Nachgelagerte Aufgaben für Härtung/Tests/Dokumentation hinzufügen und bis zum Abschluss verfolgen.
