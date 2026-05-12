---
read_when:
    - Autonome Agenten-Arbeitsabläufe einrichten, die ohne Eingabeaufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent eigenständig tun kann und was menschliche Genehmigung erfordert
    - Strukturierung von Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln
summary: Dauerhafte Betriebsbefugnisse für autonome Agentenprogramme definieren
title: Daueranweisungen
x-i18n:
    generated_at: "2026-05-12T00:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueranweisungen gewähren Ihrem Agenten **dauerhafte operative Befugnis** für definierte Programme. Statt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Triggern und Eskalationsregeln - und der Agent führt sie autonom innerhalb dieser Grenzen aus.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten „Senden Sie jeden Freitag den Wochenbericht“ und der Erteilung dauerhafter Befugnis: „Sie sind für den Wochenbericht verantwortlich. Stellen Sie ihn jeden Freitag zusammen, senden Sie ihn und eskalieren Sie nur, wenn etwas falsch aussieht.“

## Warum Daueranweisungen

**Ohne Daueranweisungen:**

- Sie müssen den Agenten für jede Aufgabe prompten
- Der Agent bleibt zwischen Anfragen inaktiv
- Routinearbeit wird vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueranweisungen:**

- Der Agent führt Aufgaben autonom innerhalb definierter Grenzen aus
- Routinearbeit erfolgt planmäßig ohne Prompting
- Sie werden nur bei Ausnahmen und Freigaben einbezogen
- Der Agent nutzt Leerlaufzeit produktiv

## Funktionsweise

Daueranweisungen werden in den Dateien Ihres [Agent-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch injiziert wird), damit der Agent sie immer im Kontext hat. Für größere Konfigurationen können Sie sie auch in einer dedizierten Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt fest:

1. **Umfang** - wozu der Agent berechtigt ist
2. **Trigger** - wann die Ausführung erfolgen soll (Zeitplan, Ereignis oder Bedingung)
3. **Freigabegates** - was vor der Ausführung menschliche Zustimmung erfordert
4. **Eskalationsregeln** - wann gestoppt und um Hilfe gebeten werden soll

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (die vollständige Liste automatisch injizierter Dateien finden Sie unter [Agent-Arbeitsbereich](/de/concepts/agent-workspace)) und führt sie zusammen mit [Cron-Jobs](/de/automation/cron-jobs) zur zeitbasierten Durchsetzung aus.

<Tip>
Legen Sie Daueranweisungen in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap injiziert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` - aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Anatomie einer Daueranweisung

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Daueranweisungen plus Cron-Jobs

Daueranweisungen definieren, **wozu** der Agent berechtigt ist. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Der Prompt des Cron-Jobs sollte auf die Daueranweisung verweisen, statt sie zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Beispiele

### Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Beispiel 2: Finanzprozesse (ereignisgesteuert)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Beispiel 3: Monitoring und Warnmeldungen (kontinuierlich)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Muster Ausführen-Prüfen-Berichten

Daueranweisungen funktionieren am besten in Kombination mit strenger Ausführungsdisziplin. Jede Aufgabe in einer Daueranweisung sollte dieser Schleife folgen:

1. **Ausführen** - Erledigen Sie die eigentliche Arbeit (bestätigen Sie die Anweisung nicht nur)
2. **Prüfen** - Bestätigen Sie, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** - Teilen Sie der verantwortlichen Person mit, was erledigt und was geprüft wurde

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Dieses Muster verhindert den häufigsten Fehlermodus von Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Multi-Programm-Architektur

Für Agenten, die mehrere Zuständigkeitsbereiche verwalten, organisieren Sie Daueranweisungen als separate Programme mit klaren Grenzen:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Jedes Programm sollte Folgendes haben:

- Einen eigenen **Trigger-Takt** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Freigabegates** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Empfohlen

- Beginnen Sie mit enger Befugnis und erweitern Sie sie, wenn Vertrauen entsteht
- Definieren Sie explizite Freigabegates für risikoreiche Aktionen
- Fügen Sie Abschnitte „Was NICHT zu tun ist“ hinzu - Grenzen sind genauso wichtig wie Berechtigungen
- Kombinieren Sie dies mit Cron-Jobs für zuverlässige zeitbasierte Ausführung
- Prüfen Sie Agent-Protokolle wöchentlich, um zu verifizieren, dass Daueranweisungen befolgt werden
- Aktualisieren Sie Daueranweisungen, wenn sich Ihre Anforderungen weiterentwickeln - sie sind lebende Dokumente

### Vermeiden

- Am ersten Tag breite Befugnis gewähren („tun Sie, was Sie für richtig halten“)
- Eskalationsregeln auslassen - jedes Programm braucht eine Klausel dazu, wann gestoppt und gefragt werden soll
- Davon ausgehen, dass der Agent mündliche Anweisungen behält - schreiben Sie alles in die Datei
- Zuständigkeitsbereiche in einem einzigen Programm vermischen - separate Programme für separate Domänen
- Die Durchsetzung mit Cron-Jobs vergessen - Daueranweisungen ohne Trigger werden zu Vorschlägen

## Verwandte Themen

- [Automatisierung](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): Zeitplandurchsetzung für Daueranweisungen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Lebenszyklusereignisse von Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): eingehende HTTP-Ereignistrigger.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): wo Daueranweisungen liegen, einschließlich der vollständigen Liste automatisch injizierter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
