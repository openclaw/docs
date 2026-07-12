---
read_when:
    - Reaktion auf eine Sicherheitsmeldung oder einen vermuteten Sicherheitsvorfall
    - Vorbereitung einer koordinierten Offenlegung oder eines Sicherheitsreleases mit Fehlerbehebung
    - Überprüfung der Erwartungen an die Nachbereitung nach einem Vorfall
summary: Wie OpenClaw Sicherheitsvorfälle bewertet, darauf reagiert und nachverfolgt
title: Reaktion auf Sicherheitsvorfälle
x-i18n:
    generated_at: "2026-07-12T16:01:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Erkennung und Triage

Sicherheitssignale stammen aus:

- GitHub Security Advisories (GHSA) und privaten Schwachstellenmeldungen.
- Öffentlichen GitHub-Issues/-Diskussionen, wenn Meldungen keine vertraulichen Informationen enthalten.
- Automatisierten Signalen: Dependabot, CodeQL, npm-Sicherheitshinweise, Secret Scanning.

Erste Triage:

1. Bestätigen Sie die betroffene Komponente, Version und die Auswirkungen auf Vertrauensgrenzen.
2. Klassifizieren Sie den Fall anhand der Regeln für den Geltungsbereich und ausgeschlossene Bereiche in `SECURITY.md` als Sicherheitsproblem oder als Härtungsmaßnahme/Problem ohne Handlungsbedarf.
3. Eine für den Vorfall verantwortliche Person reagiert entsprechend.

## 2. Schweregrad

| Schweregrad | Definition                                                                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kritisch     | Kompromittierung eines Pakets, eines Releases oder des Repositorys, aktive Ausnutzung oder Umgehung einer Vertrauensgrenze ohne Authentifizierung mit weitreichender Kontrolle oder Offenlegung von Daten. |
| Hoch         | Bestätigte Umgehung einer Vertrauensgrenze, die begrenzte Voraussetzungen erfordert (beispielsweise eine authentifizierte, aber nicht autorisierte Aktion mit weitreichenden Auswirkungen), oder Offenlegung vertraulicher, von OpenClaw verwalteter Zugangsdaten. |
| Mittel       | Erhebliche Sicherheitsschwäche mit praktischen Auswirkungen, aber eingeschränkter Ausnutzbarkeit oder umfangreichen Voraussetzungen.                                                                        |
| Niedrig      | Erkenntnisse zur mehrschichtigen Abwehr, eng begrenzte Denial-of-Service-Angriffe oder Lücken bei Härtung bzw. Funktionsgleichheit ohne nachgewiesene Umgehung einer Vertrauensgrenze.                       |

## 3. Reaktion

1. Bestätigen Sie der meldenden Person den Eingang (bei vertraulichen Informationen auf privatem Weg).
2. Reproduzieren Sie das Problem in unterstützten Releases und im neuesten Stand von `main`. Implementieren und validieren Sie anschließend einen Patch mit Abdeckung durch Regressionstests.
3. Kritisch/hoch: Bereiten Sie gepatchte Releases so schnell wie praktisch möglich vor.
4. Mittel/niedrig: Stellen Sie den Patch im regulären Release-Ablauf bereit und dokumentieren Sie Hinweise zur Risikominderung.

## 4. Kommunikation und Offenlegung

Kommunizieren Sie über GitHub Security Advisories im betroffenen Repository, Release Notes/Changelog-Einträge für korrigierte Versionen sowie direkte Status- und Lösungsinformationen an die meldende Person.

Bei kritischen/hoch eingestuften Vorfällen erfolgt eine koordinierte Offenlegung, gegebenenfalls einschließlich der Vergabe einer CVE. Härtungserkenntnisse mit geringem Risiko können abhängig von Auswirkungen und Benutzerexposition ohne CVE in Release Notes oder Sicherheitshinweisen dokumentiert werden.

## 5. Wiederherstellung und Nachbereitung

Nach der Bereitstellung der Korrektur:

1. Überprüfen Sie die Abhilfemaßnahmen in CI und den Release-Artefakten.
2. Führen Sie eine kurze Nachbesprechung des Vorfalls durch: Zeitverlauf, Grundursache, Erkennungslücke, Präventionsplan.
3. Fügen Sie Folgeaufgaben für Härtung, Tests und Dokumentation hinzu und verfolgen Sie diese bis zum Abschluss.

## Verwandte Themen

- [Sicherheitsrichtlinie](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — Geltungsbereich für Meldungen und Vertrauensmodell.
- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
