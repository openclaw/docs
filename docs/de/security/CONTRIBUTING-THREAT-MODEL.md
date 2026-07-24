---
read_when:
    - Sie möchten Sicherheitserkenntnisse oder Bedrohungsszenarien beitragen
    - Überprüfung oder Aktualisierung des Bedrohungsmodells
summary: So tragen Sie zum OpenClaw-Bedrohungsmodell bei
title: Mitwirkung am Bedrohungsmodell
x-i18n:
    generated_at: "2026-07-24T05:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Das [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS) ist ein fortlaufend aktualisiertes Dokument. Beiträge von allen Personen sind willkommen; Vorkenntnisse im Bereich Sicherheit oder MITRE ATLAS sind nicht erforderlich.

<Note>
Dieser Abschnitt dient dazu, das Bedrohungsmodell zu ergänzen, nicht dazu, aktive Schwachstellen zu melden. Wenn Sie eine ausnutzbare Schwachstelle gefunden haben, befolgen Sie stattdessen die Anweisungen zur verantwortungsvollen Offenlegung auf der [Trust-Seite](https://trust.openclaw.ai).
</Note>

## Möglichkeiten zur Mitwirkung

**Eine Bedrohung hinzufügen.** Erstellen Sie ein Issue unter [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreiben Sie das Angriffsszenario mit eigenen Worten. Hilfreich, aber nicht erforderlich:

- Das Angriffsszenario und wie es ausgenutzt werden könnte.
- Welche Komponenten betroffen sind (CLI, Gateway, Kanäle, ClawHub, MCP-Server usw.).
- Ihre Einschätzung des Schweregrads (niedrig / mittel / hoch / kritisch).
- Links zu relevanten Forschungsarbeiten, CVEs oder Praxisbeispielen.

Die Maintainer weisen während der Überprüfung die ATLAS-Zuordnung, die Bedrohungs-ID und die Risikostufe zu.

**Eine Gegenmaßnahme vorschlagen.** Erstellen Sie ein Issue oder einen PR mit einem Verweis auf die Bedrohung. Formulieren Sie den Vorschlag konkret und umsetzbar: „Absenderbezogene Ratenbegrenzung auf 10 Nachrichten/Minute am Gateway“ ist hilfreicher als „Ratenbegrenzung implementieren“.

**Eine Angriffskette vorschlagen.** Angriffsketten zeigen, wie mehrere Bedrohungen zu einem realistischen Szenario kombiniert werden können. Beschreiben Sie die Schritte und wie ein Angreifer sie verketten würde; eine kurze Schilderung ist besser als eine formale Vorlage.

**Vorhandene Inhalte korrigieren oder verbessern.** Tippfehler, Klarstellungen, veraltete Informationen, bessere Beispiele: PRs sind willkommen, ein Issue ist nicht erforderlich.

## Framework-Referenz

Bedrohungen werden [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems) zugeordnet, einem Framework für KI-/ML-spezifische Bedrohungen wie Prompt-Injection, Werkzeugmissbrauch und die Ausnutzung von Agenten. Für einen Beitrag müssen Sie ATLAS nicht kennen; die Maintainer ordnen Einreichungen während der Überprüfung zu.

**Bedrohungs-IDs.** Jede Bedrohung erhält eine ID wie `T-EXEC-003`, die während der Überprüfung von den Maintainern vergeben wird.

| Code    | Kategorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Aufklärung – Informationsbeschaffung       |
| ACCESS  | Erstzugriff – Zugang erlangen              |
| EXEC    | Ausführung – schädliche Aktionen ausführen |
| PERSIST | Persistenz – Zugriff aufrechterhalten      |
| EVADE   | Umgehung von Schutzmaßnahmen – Erkennung vermeiden |
| DISC    | Erkundung – Informationen über die Umgebung gewinnen |
| EXFIL   | Exfiltration – Daten entwenden             |
| IMPACT  | Auswirkung – Schaden oder Störung          |

**Risikostufen.** Wenn Sie sich bei der Stufe unsicher sind, beschreiben Sie einfach die Auswirkungen; die Maintainer nehmen die Bewertung vor.

| Stufe          | Bedeutung                                                        |
| -------------- | ---------------------------------------------------------------- |
| **Kritisch**   | Vollständige Kompromittierung des Systems oder hohe Wahrscheinlichkeit + kritische Auswirkungen |
| **Hoch**       | Erheblicher Schaden wahrscheinlich oder mittlere Wahrscheinlichkeit + kritische Auswirkungen |
| **Mittel**     | Moderates Risiko oder geringe Wahrscheinlichkeit + hohe Auswirkungen |
| **Niedrig**    | Unwahrscheinlich und begrenzte Auswirkungen                      |

## Überprüfungsprozess

1. **Triage** – neue Einreichungen werden innerhalb von 48 Stunden überprüft.
2. **Bewertung** – Maintainer prüfen die Umsetzbarkeit, weisen die ATLAS-Zuordnung und die Bedrohungs-ID zu und validieren die Risikostufe.
3. **Dokumentation** – Prüfung von Formatierung und Vollständigkeit.
4. **Zusammenführung** – Aufnahme in das Bedrohungsmodell und die Visualisierung.

## Ressourcen

- [ATLAS-Website](https://atlas.mitre.org/)
- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)

## Kontakt

- **Sicherheitslücken:** Auf der [Trust-Seite](https://trust.openclaw.ai) finden Sie Anweisungen zur Meldung; alternativ können Sie `security@openclaw.ai` verwenden.
- **Fragen zum Bedrohungsmodell:** Erstellen Sie ein Issue unter [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Allgemeiner Austausch:** Discord-Kanal `#security`.

## Anerkennung

Mitwirkende am Bedrohungsmodell werden in den Danksagungen des Bedrohungsmodells und den Versionshinweisen sowie bei bedeutenden Beiträgen in der OpenClaw Security Hall of Fame gewürdigt.

## Verwandte Themen

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
- [Formale Verifikation](/de/security/formal-verification)
