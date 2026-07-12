---
read_when:
    - Reaktion auf eine Sicherheitsmeldung oder einen vermuteten Sicherheitsvorfall
    - Vorbereitung einer koordinierten Offenlegung oder eines Sicherheitsupdates mit Fehlerbehebung
    - Überprüfung der Erwartungen an die Nachbereitung nach einem Vorfall
summary: Wie OpenClaw Sicherheitsvorfälle einstuft, darauf reagiert und sie nachbereitet
title: Reaktion auf Vorfälle
x-i18n:
    generated_at: "2026-07-12T02:10:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Erkennung und Triage

Sicherheitssignale stammen aus:

- GitHub Security Advisories (GHSA) und privaten Schwachstellenmeldungen.
- Öffentlichen GitHub-Issues/-Diskussionen, wenn Meldungen nicht vertraulich sind.
- Automatisierten Signalen: Dependabot, CodeQL, npm-Sicherheitshinweise, Secret-Scanning.

Erste Triage:

1. Bestätigen Sie die betroffene Komponente, Version und Auswirkung auf die Vertrauensgrenze.
2. Klassifizieren Sie den Fall anhand der Regeln zu Geltungsbereich und Ausschlüssen in `SECURITY.md` als Sicherheitsproblem oder als Härtungsmaßnahme/ohne Handlungsbedarf.
3. Eine für den Vorfall verantwortliche Person reagiert entsprechend.

## 2. Schweregrad

| Schweregrad | Definition                                                                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kritisch     | Kompromittierung von Paket, Release oder Repository, aktive Ausnutzung oder nicht authentifizierte Umgehung einer Vertrauensgrenze mit weitreichender Kontrolle oder Offenlegung von Daten.                 |
| Hoch         | Bestätigte Umgehung einer Vertrauensgrenze mit begrenzten Voraussetzungen (beispielsweise eine authentifizierte, aber nicht autorisierte Aktion mit schwerwiegenden Auswirkungen) oder Offenlegung sensibler, von OpenClaw verwalteter Zugangsdaten. |
| Mittel       | Erhebliche Sicherheitsschwäche mit praktischen Auswirkungen, aber eingeschränkter Ausnutzbarkeit oder erheblichen Voraussetzungen.                                                                          |
| Niedrig      | Maßnahmen zur mehrschichtigen Absicherung, eng begrenzte Denial-of-Service-Schwachstellen oder Lücken bei Härtung bzw. Funktionsgleichheit ohne nachgewiesene Umgehung einer Vertrauensgrenze.               |

## 3. Reaktion

1. Bestätigen Sie der meldenden Person den Eingang der Meldung (bei vertraulichen Inhalten nicht öffentlich).
2. Reproduzieren Sie das Problem in unterstützten Releases und im neuesten Stand von `main`; implementieren und validieren Sie anschließend einen Patch mit Regressionstests.
3. Kritisch/hoch: Bereiten Sie korrigierte Releases so schnell wie praktisch möglich vor.
4. Mittel/niedrig: Spielen Sie den Patch im regulären Release-Ablauf ein und dokumentieren Sie Maßnahmen zur Risikominderung.

## 4. Kommunikation und Offenlegung

Kommunizieren Sie über GitHub Security Advisories im betroffenen Repository, Release Notes/Changelog-Einträge für korrigierte Versionen und direkte Status- und Abschlussmeldungen an die meldende Person.

Bei kritischen und schwerwiegenden Vorfällen erfolgt eine koordinierte Offenlegung, gegebenenfalls einschließlich der Vergabe einer CVE. Härtungsbefunde mit geringem Risiko können abhängig von den Auswirkungen und der Betroffenheit der Benutzer ohne CVE in Release Notes oder Sicherheitshinweisen dokumentiert werden.

## 5. Wiederherstellung und Nachbereitung

Nach der Veröffentlichung der Korrektur:

1. Überprüfen Sie die Behebungsmaßnahmen in CI und den Release-Artefakten.
2. Führen Sie eine kurze Nachbesprechung des Vorfalls durch: Zeitablauf, Grundursache, Erkennungslücke, Präventionsplan.
3. Erstellen Sie Folgeaufgaben für Härtungsmaßnahmen, Tests und Dokumentation und verfolgen Sie diese bis zum Abschluss.

## Verwandte Themen

- [Sicherheitsrichtlinie](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — Geltungsbereich für Meldungen und Vertrauensmodell.
- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
