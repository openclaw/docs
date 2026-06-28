---
read_when:
    - Sie möchten Sicherheitsbefunde oder Bedrohungsszenarien beisteuern
    - Überprüfen oder Aktualisieren des Bedrohungsmodells
summary: Wie Sie zum OpenClaw-Bedrohungsmodell beitragen
title: Zum Bedrohungsmodell beitragen
x-i18n:
    generated_at: "2026-05-06T17:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Danke, dass Sie dazu beitragen, OpenClaw sicherer zu machen. Dieses Bedrohungsmodell ist ein lebendes Dokument, und wir freuen uns über Beiträge von allen - Sie müssen keine Sicherheitsexpertin und kein Sicherheitsexperte sein.

## Möglichkeiten zur Mitwirkung

### Eine Bedrohung hinzufügen

Haben Sie einen Angriffsvektor oder ein Risiko entdeckt, das wir noch nicht abgedeckt haben? Öffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues) und beschreiben Sie es in Ihren eigenen Worten. Sie müssen keine Frameworks kennen oder jedes Feld ausfüllen - beschreiben Sie einfach das Szenario.

**Hilfreiche Angaben (aber nicht erforderlich):**

- Das Angriffsszenario und wie es ausgenutzt werden könnte
- Welche Teile von OpenClaw betroffen sind (CLI, Gateway, Kanäle, ClawHub, MCP-Server usw.)
- Wie schwerwiegend Sie es einschätzen (niedrig / mittel / hoch / kritisch)
- Links zu verwandter Forschung, CVEs oder Beispielen aus der Praxis

Wir übernehmen die ATLAS-Zuordnung, Bedrohungs-IDs und Risikobewertung während der Prüfung. Wenn Sie diese Details hinzufügen möchten, gern - erwartet wird es aber nicht.

> **Dies ist für Ergänzungen zum Bedrohungsmodell gedacht, nicht für die Meldung aktiver Sicherheitslücken.** Wenn Sie eine ausnutzbare Sicherheitslücke gefunden haben, lesen Sie unsere [Trust-Seite](https://trust.openclaw.ai) für Anweisungen zur verantwortungsvollen Offenlegung.

### Eine Abhilfemaßnahme vorschlagen

Haben Sie eine Idee, wie eine bestehende Bedrohung adressiert werden kann? Öffnen Sie ein Issue oder einen PR mit Verweis auf die Bedrohung. Nützliche Abhilfemaßnahmen sind spezifisch und umsetzbar - zum Beispiel ist „Absenderbezogenes Rate Limiting von 10 Nachrichten/Minute am Gateway“ besser als „Rate Limiting implementieren“.

### Eine Angriffskette vorschlagen

Angriffsketten zeigen, wie mehrere Bedrohungen zu einem realistischen Angriffsszenario kombiniert werden. Wenn Sie eine gefährliche Kombination sehen, beschreiben Sie die Schritte und wie ein Angreifer sie miteinander verketten würde. Eine kurze Erzählung darüber, wie der Angriff in der Praxis abläuft, ist wertvoller als eine formale Vorlage.

### Vorhandene Inhalte korrigieren oder verbessern

Tippfehler, Klarstellungen, veraltete Informationen, bessere Beispiele - PRs sind willkommen, ein Issue ist nicht erforderlich.

## Was wir verwenden

### MITRE-ATLAS-Framework

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), einem Framework, das speziell für KI/ML-Bedrohungen wie Prompt Injection, Tool-Missbrauch und Agent-Ausnutzung entwickelt wurde. Sie müssen ATLAS nicht kennen, um beizutragen - wir ordnen Einreichungen während der Prüfung dem Framework zu.

### Bedrohungs-IDs

Jede Bedrohung erhält eine ID wie `T-EXEC-003`. Die Kategorien sind:

| Code    | Kategorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Aufklärung - Informationsbeschaffung       |
| ACCESS  | Erstzugriff - Zugang erlangen              |
| EXEC    | Ausführung - schädliche Aktionen ausführen |
| PERSIST | Persistenz - Zugriff aufrechterhalten      |
| EVADE   | Abwehrumgehung - Erkennung vermeiden       |
| DISC    | Erkundung - die Umgebung kennenlernen       |
| EXFIL   | Exfiltration - Daten stehlen               |
| IMPACT  | Auswirkung - Schaden oder Störung          |

IDs werden von den Maintainerinnen und Maintainern während der Prüfung vergeben. Sie müssen keine auswählen.

### Risikostufen

| Stufe        | Bedeutung                                                            |
| ------------ | -------------------------------------------------------------------- |
| **Kritisch** | Vollständige Systemkompromittierung oder hohe Wahrscheinlichkeit + kritische Auswirkung |
| **Hoch**     | Erheblicher Schaden wahrscheinlich oder mittlere Wahrscheinlichkeit + kritische Auswirkung |
| **Mittel**   | Moderates Risiko oder niedrige Wahrscheinlichkeit + hohe Auswirkung  |
| **Niedrig**  | Unwahrscheinlich und begrenzte Auswirkung                            |

Wenn Sie sich bei der Risikostufe unsicher sind, beschreiben Sie einfach die Auswirkung, und wir bewerten sie.

## Prüfprozess

1. **Triage** - Wir prüfen neue Einreichungen innerhalb von 48 Stunden
2. **Bewertung** - Wir prüfen die Machbarkeit, weisen ATLAS-Zuordnung und Bedrohungs-ID zu und validieren die Risikostufe
3. **Dokumentation** - Wir stellen sicher, dass alles formatiert und vollständig ist
4. **Merge** - Wird dem Bedrohungsmodell und der Visualisierung hinzugefügt

## Ressourcen

- [ATLAS-Website](https://atlas.mitre.org/)
- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [OpenClaw-Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)

## Kontakt

- **Sicherheitslücken:** Lesen Sie unsere [Trust-Seite](https://trust.openclaw.ai) für Meldeanweisungen
- **Fragen zum Bedrohungsmodell:** Öffnen Sie ein Issue auf [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Allgemeiner Chat:** Discord-Kanal #security

## Anerkennung

Beitragende zum Bedrohungsmodell werden in den Danksagungen des Bedrohungsmodells, den Release Notes und der OpenClaw Security Hall of Fame für bedeutende Beiträge anerkannt.

## Verwandt

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Formale Verifikation](/de/security/formal-verification)
