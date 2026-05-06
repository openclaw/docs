---
read_when:
    - Einrichten autonomer Agenten-Workflows, die ohne Aufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent eigenständig tun kann und wofür menschliche Freigabe erforderlich ist
    - Strukturierung von Agenten mit mehreren Programmen mit klaren Grenzen und Eskalationsregeln
summary: Dauerhafte Betriebsbefugnis für autonome Agentenprogramme definieren
title: Daueranweisungen
x-i18n:
    generated_at: "2026-05-06T06:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueranweisungen gewähren Ihrem Agenten **dauerhafte Handlungsbefugnis** für definierte Programme. Statt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln - und der Agent führt sie innerhalb dieser Grenzen autonom aus.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten, jeden Freitag „den Wochenbericht zu senden“, und der Erteilung einer dauerhaften Befugnis: „Sie sind für den Wochenbericht verantwortlich. Erstellen Sie ihn jeden Freitag, senden Sie ihn und eskalieren Sie nur, wenn etwas falsch aussieht.“

## Warum Daueranweisungen

**Ohne Daueranweisungen:**

- Sie müssen den Agenten für jede Aufgabe auffordern
- Der Agent bleibt zwischen Anfragen untätig
- Routinearbeit wird vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueranweisungen:**

- Der Agent arbeitet autonom innerhalb definierter Grenzen
- Routinearbeit erfolgt planmäßig ohne Aufforderung
- Sie werden nur bei Ausnahmen und Genehmigungen einbezogen
- Der Agent nutzt Leerlaufzeiten produktiv

## Funktionsweise

Daueranweisungen werden in den Dateien Ihres [Agenten-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch injiziert wird), damit der Agent sie immer im Kontext hat. Für größere Konfigurationen können Sie sie auch in einer dedizierten Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt fest:

1. **Umfang** - wozu der Agent befugt ist
2. **Auslöser** - wann die Ausführung erfolgt (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschwellen** - was vor der Ausführung menschliche Freigabe erfordert
4. **Eskalationsregeln** - wann anzuhalten und um Hilfe zu bitten ist

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (die vollständige Liste automatisch injizierter Dateien finden Sie unter [Agenten-Arbeitsbereich](/de/concepts/agent-workspace)) und führt sie zusammen mit [Cron-Jobs](/de/automation/cron-jobs) für zeitbasierte Durchsetzung aus.

<Tip>
Legen Sie Daueranweisungen in `AGENTS.md` ab, um zu garantieren, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap injiziert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` - aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau einer Daueranweisung

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

Daueranweisungen definieren, **was** der Agent tun darf. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Der Cron-Job-Prompt sollte auf die Daueranweisung verweisen, statt sie zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Beispiele

### Beispiel 1: Inhalte und Social Media (wöchentlicher Zyklus)

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

### Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)

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

## Muster „Ausführen-Prüfen-Berichten“

Daueranweisungen funktionieren am besten in Kombination mit strikter Ausführungsdisziplin. Jede Aufgabe in einer Daueranweisung sollte dieser Schleife folgen:

1. **Ausführen** - Die eigentliche Arbeit erledigen (nicht nur die Anweisung bestätigen)
2. **Prüfen** - Bestätigen, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** - Dem Eigentümer mitteilen, was erledigt und was geprüft wurde

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

## Architektur für mehrere Programme

Für Agenten, die mehrere Aufgabenbereiche verwalten, organisieren Sie Daueranweisungen als separate Programme mit klaren Grenzen:

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

- Einen eigenen **Auslöser-Rhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschwellen** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Tun

- Beginnen Sie mit enger Befugnis und erweitern Sie sie, wenn Vertrauen entsteht
- Definieren Sie explizite Genehmigungsschwellen für risikoreiche Aktionen
- Fügen Sie Abschnitte „Was NICHT zu tun ist“ ein - Grenzen sind genauso wichtig wie Berechtigungen
- Kombinieren Sie dies mit Cron-Jobs für zuverlässige zeitbasierte Ausführung
- Prüfen Sie Agentenprotokolle wöchentlich, um zu verifizieren, dass Daueranweisungen befolgt werden
- Aktualisieren Sie Daueranweisungen, wenn sich Ihre Anforderungen weiterentwickeln - sie sind lebende Dokumente

### Vermeiden

- Am ersten Tag weitreichende Befugnisse erteilen („tun Sie, was Sie für das Beste halten“)
- Eskalationsregeln auslassen - jedes Programm braucht eine Klausel, wann anzuhalten und nachzufragen ist
- Annehmen, dass der Agent mündliche Anweisungen behält - schreiben Sie alles in die Datei
- Anliegen in einem einzigen Programm vermischen - separate Programme für separate Bereiche
- Vergessen, sie mit Cron-Jobs durchzusetzen - Daueranweisungen ohne Auslöser werden zu Vorschlägen

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): zeitplanbasierte Durchsetzung für Daueranweisungen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Lebenszyklusereignisse von Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): eingehende HTTP-Ereignisauslöser.
- [Agenten-Arbeitsbereich](/de/concepts/agent-workspace): wo Daueranweisungen abgelegt werden, einschließlich der vollständigen Liste automatisch injizierter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
