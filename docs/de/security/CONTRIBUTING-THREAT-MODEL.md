---
read_when:
    - Sie möchten Sicherheitsbefunde oder Bedrohungsszenarien beitragen
    - Bedrohungsmodell überprüfen oder aktualisieren
summary: So tragen Sie zum OpenClaw-Bedrohungsmodell bei
title: Zum Bedrohungsmodell beitragen
x-i18n:
    generated_at: "2026-04-30T07:14:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Zum OpenClaw-Bedrohungsmodell beitragen

Danke, dass Sie helfen, OpenClaw sicherer zu machen. Dieses Bedrohungsmodell ist ein lebendes Dokument, und wir begrüßen Beiträge von allen - Sie müssen kein Sicherheitsexperte sein.

## Möglichkeiten zur Mitarbeit

### Eine Bedrohung hinzufügen

Haben Sie einen Angriffsvektor oder ein Risiko entdeckt, das wir noch nicht abgedeckt haben? Öffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreiben Sie es in Ihren eigenen Worten. Sie müssen keine Frameworks kennen oder jedes Feld ausfüllen - beschreiben Sie einfach das Szenario.

**Hilfreich anzugeben (aber nicht erforderlich):**

- Das Angriffsszenario und wie es ausgenutzt werden könnte
- Welche Teile von OpenClaw betroffen sind (CLI, Gateway, Kanäle, ClawHub, MCP-Server usw.)
- Wie schwerwiegend Sie es einschätzen (niedrig / mittel / hoch / kritisch)
- Links zu verwandter Forschung, CVEs oder Beispielen aus der Praxis

Wir übernehmen das ATLAS-Mapping, Bedrohungs-IDs und die Risikobewertung während der Prüfung. Wenn Sie diese Details einbeziehen möchten, gerne - erwartet wird es aber nicht.

> **Dies dient dem Hinzufügen zum Bedrohungsmodell, nicht dem Melden aktiver Schwachstellen.** Wenn Sie eine ausnutzbare Schwachstelle gefunden haben, finden Sie auf unserer [Trust-Seite](https://trust.openclaw.ai) Anweisungen zur verantwortungsvollen Offenlegung.

### Eine Gegenmaßnahme vorschlagen

Haben Sie eine Idee, wie eine bestehende Bedrohung behoben werden kann? Öffnen Sie ein Issue oder einen PR mit Verweis auf die Bedrohung. Nützliche Gegenmaßnahmen sind konkret und umsetzbar - zum Beispiel ist „senderbezogene Ratenbegrenzung von 10 Nachrichten/Minute am Gateway“ besser als „Ratenbegrenzung implementieren“.

### Eine Angriffskette vorschlagen

Angriffsketten zeigen, wie mehrere Bedrohungen zu einem realistischen Angriffsszenario kombiniert werden. Wenn Sie eine gefährliche Kombination sehen, beschreiben Sie die Schritte und wie ein Angreifer sie miteinander verketten würde. Eine kurze Darstellung, wie der Angriff in der Praxis abläuft, ist wertvoller als eine formale Vorlage.

### Bestehende Inhalte korrigieren oder verbessern

Tippfehler, Klarstellungen, veraltete Informationen, bessere Beispiele - PRs sind willkommen, kein Issue erforderlich.

## Was wir verwenden

### MITRE ATLAS

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), einem Framework, das speziell für KI/ML-Bedrohungen wie Prompt Injection, Werkzeugmissbrauch und Agent-Ausnutzung entwickelt wurde. Sie müssen ATLAS nicht kennen, um beizutragen - wir ordnen Einreichungen während der Prüfung dem Framework zu.

### Bedrohungs-IDs

Jede Bedrohung erhält eine ID wie `T-EXEC-003`. Die Kategorien sind:

| Code    | Kategorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Aufklärung - Informationsbeschaffung       |
| ACCESS  | Erstzugriff - Zugang erlangen              |
| EXEC    | Ausführung - schädliche Aktionen ausführen |
| PERSIST | Persistenz - Zugriff aufrechterhalten      |
| EVADE   | Abwehrumgehung - Erkennung vermeiden       |
| DISC    | Erkundung - die Umgebung kennenlernen      |
| EXFIL   | Exfiltration - Daten stehlen               |
| IMPACT  | Auswirkung - Schaden oder Störung          |

IDs werden während der Prüfung von Maintainerinnen und Maintainern vergeben. Sie müssen keine auswählen.

### Risikostufen

| Stufe         | Bedeutung                                                        |
| ------------- | ---------------------------------------------------------------- |
| **Kritisch**  | Vollständige Systemkompromittierung oder hohe Wahrscheinlichkeit + kritische Auswirkung |
| **Hoch**      | Erheblicher Schaden wahrscheinlich oder mittlere Wahrscheinlichkeit + kritische Auswirkung |
| **Mittel**    | Moderates Risiko oder niedrige Wahrscheinlichkeit + hohe Auswirkung |
| **Niedrig**   | Unwahrscheinlich und begrenzte Auswirkung                        |

Wenn Sie sich bei der Risikostufe unsicher sind, beschreiben Sie einfach die Auswirkung, und wir bewerten sie.

## Prüfprozess

1. **Triage** - Wir prüfen neue Einreichungen innerhalb von 48 Stunden
2. **Bewertung** - Wir verifizieren die Machbarkeit, weisen ATLAS-Mapping und Bedrohungs-ID zu und validieren die Risikostufe
3. **Dokumentation** - Wir stellen sicher, dass alles formatiert und vollständig ist
4. **Merge** - Wird dem Bedrohungsmodell und der Visualisierung hinzugefügt

## Ressourcen

- [ATLAS-Website](https://atlas.mitre.org/)
- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [OpenClaw-Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Sicherheitslücken:** Anweisungen zum Melden finden Sie auf unserer [Trust-Seite](https://trust.openclaw.ai)
- **Fragen zum Bedrohungsmodell:** Öffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Allgemeiner Chat:** Discord-Kanal #security

## Anerkennung

Mitwirkende am Bedrohungsmodell werden in den Danksagungen des Bedrohungsmodells, in den Release Notes und in der OpenClaw Security Hall of Fame für bedeutende Beiträge gewürdigt.

## Verwandt

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Formale Verifikation](/de/security/formal-verification)
