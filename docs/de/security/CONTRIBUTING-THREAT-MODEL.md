---
read_when:
    - Sie möchten Sicherheitserkenntnisse oder Bedrohungsszenarien beitragen
    - Überprüfung oder Aktualisierung des Bedrohungsmodells
summary: So tragen Sie zum Bedrohungsmodell von OpenClaw bei
title: Mitwirkung am Bedrohungsmodell
x-i18n:
    generated_at: "2026-07-12T02:10:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Das [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS) ist ein fortlaufend aktualisiertes Dokument. Beiträge von allen Personen sind willkommen; Sie benötigen keine Vorkenntnisse im Bereich Sicherheit oder MITRE ATLAS.

<Note>
Hier geht es um Ergänzungen des Bedrohungsmodells, nicht um das Melden aktueller Schwachstellen. Wenn Sie eine ausnutzbare Schwachstelle gefunden haben, folgen Sie stattdessen den Anweisungen zur verantwortungsvollen Offenlegung auf der [Trust-Seite](https://trust.openclaw.ai).
</Note>

## Möglichkeiten zur Mitwirkung

**Eine Bedrohung hinzufügen.** Erstellen Sie ein Issue unter [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreiben Sie das Angriffsszenario mit eigenen Worten. Hilfreich, aber nicht erforderlich, sind:

- Das Angriffsszenario und die mögliche Art seiner Ausnutzung.
- Die betroffenen Komponenten (CLI, Gateway, Kanäle, ClawHub, MCP-Server usw.).
- Ihre Einschätzung des Schweregrads (niedrig / mittel / hoch / kritisch).
- Links zu relevanten Forschungsarbeiten, CVEs oder Praxisbeispielen.

Die Maintainer weisen während der Prüfung die ATLAS-Zuordnung, die Bedrohungs-ID und die Risikostufe zu.

**Eine Gegenmaßnahme vorschlagen.** Erstellen Sie ein Issue oder einen PR mit einem Verweis auf die Bedrohung. Formulieren Sie den Vorschlag konkret und umsetzbar: „Ratenbegrenzung pro Absender auf 10 Nachrichten pro Minute am Gateway“ ist hilfreicher als „Ratenbegrenzung implementieren“.

**Eine Angriffskette vorschlagen.** Angriffsketten zeigen, wie mehrere Bedrohungen gemeinsam ein realistisches Szenario bilden. Beschreiben Sie die Schritte und wie ein Angreifer sie miteinander verknüpfen würde; eine kurze Darstellung ist besser als eine formale Vorlage.

**Vorhandene Inhalte korrigieren oder verbessern.** Tippfehler, Klarstellungen, veraltete Informationen und bessere Beispiele: PRs sind willkommen, ein Issue ist nicht erforderlich.

## Referenz zum Framework

Bedrohungen werden [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems) zugeordnet, einem Framework für KI-/ML-spezifische Bedrohungen wie Prompt-Injection, Werkzeugmissbrauch und die Ausnutzung von Agenten. Sie müssen ATLAS nicht kennen, um beizutragen; die Maintainer ordnen Einreichungen während der Prüfung zu.

**Bedrohungs-IDs.** Jede Bedrohung erhält eine ID wie `T-EXEC-003`, die von den Maintainern während der Prüfung vergeben wird.

| Code    | Kategorie                                      |
| ------- | ---------------------------------------------- |
| RECON   | Aufklärung – Informationsbeschaffung           |
| ACCESS  | Erstzugriff – Zugang erlangen                   |
| EXEC    | Ausführung – schädliche Aktionen ausführen     |
| PERSIST | Persistenz – Zugriff aufrechterhalten          |
| EVADE   | Umgehung von Abwehrmaßnahmen – Erkennung vermeiden |
| DISC    | Erkundung – Informationen über die Umgebung gewinnen |
| EXFIL   | Exfiltration – Daten entwenden                  |
| IMPACT  | Auswirkung – Schäden oder Störungen verursachen |

**Risikostufen.** Wenn Sie sich bei der Stufe nicht sicher sind, beschreiben Sie einfach die Auswirkungen; die Maintainer nehmen die Bewertung vor.

| Stufe         | Bedeutung                                                               |
| ------------- | ----------------------------------------------------------------------- |
| **Kritisch**  | Vollständige Kompromittierung des Systems oder hohe Wahrscheinlichkeit bei kritischen Auswirkungen |
| **Hoch**      | Erhebliche Schäden wahrscheinlich oder mittlere Wahrscheinlichkeit bei kritischen Auswirkungen |
| **Mittel**    | Moderates Risiko oder geringe Wahrscheinlichkeit bei hohen Auswirkungen |
| **Niedrig**   | Unwahrscheinlich und mit begrenzten Auswirkungen                        |

## Prüfverfahren

1. **Triage** – neue Einreichungen werden innerhalb von 48 Stunden geprüft.
2. **Bewertung** – Maintainer prüfen die Umsetzbarkeit, weisen die ATLAS-Zuordnung und Bedrohungs-ID zu und validieren die Risikostufe.
3. **Dokumentation** – Prüfung von Formatierung und Vollständigkeit.
4. **Zusammenführung** – Aufnahme in das Bedrohungsmodell und die Visualisierung.

## Ressourcen

- [ATLAS-Website](https://atlas.mitre.org/)
- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)

## Kontakt

- **Sicherheitslücken:** Auf der [Trust-Seite](https://trust.openclaw.ai) finden Sie Anweisungen zum Melden; alternativ können Sie sich an `security@openclaw.ai` wenden.
- **Fragen zum Bedrohungsmodell:** Erstellen Sie ein Issue unter [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Allgemeiner Austausch:** Discord-Kanal `#security`.

## Anerkennung

Mitwirkende am Bedrohungsmodell werden in den Danksagungen des Bedrohungsmodells und in den Versionshinweisen sowie bei bedeutenden Beiträgen in der OpenClaw Security Hall of Fame gewürdigt.

## Verwandte Themen

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
- [Formale Verifikation](/de/security/formal-verification)
