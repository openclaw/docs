---
read_when:
    - Autonome Agenten-Workflows einrichten, die ohne Eingabeaufforderung pro Aufgabe ausgeführt werden
    - Festlegen, was der Agent eigenständig tun kann und was eine menschliche Genehmigung erfordert
    - Strukturierung von Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln
summary: Dauerhafte Betriebsbefugnisse für autonome Agentenprogramme festlegen
title: Ständige Anweisungen
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueranweisungen verleihen Ihrem Agenten **dauerhafte operative Befugnis** für definierte Programme. Statt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Triggern und Eskalationsregeln - und der Agent führt sie innerhalb dieser Grenzen autonom aus.

Das ist der Unterschied zwischen der Anweisung „Senden Sie den Wochenbericht“ jeden Freitag und einer dauerhaften Befugnis: „Sie sind für den Wochenbericht verantwortlich. Stellen Sie ihn jeden Freitag zusammen, senden Sie ihn und eskalieren Sie nur, wenn etwas falsch aussieht.“

## Warum Daueranweisungen

**Ohne Daueranweisungen:**

- Sie müssen den Agenten für jede Aufgabe auffordern
- Der Agent bleibt zwischen Anfragen untätig
- Routinearbeit wird vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueranweisungen:**

- Der Agent führt Aufgaben innerhalb definierter Grenzen autonom aus
- Routinearbeit erfolgt planmäßig ohne Aufforderung
- Sie werden nur bei Ausnahmen und Genehmigungen einbezogen
- Der Agent nutzt Leerlaufzeiten produktiv

## Funktionsweise

Daueranweisungen werden in den Dateien Ihres [Agent-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch injiziert wird), damit der Agent sie immer im Kontext hat. Für größere Konfigurationen können Sie sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt fest:

1. **Umfang** - wozu der Agent befugt ist
2. **Trigger** - wann ausgeführt wird (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschwellen** - was vor dem Handeln menschliche Freigabe erfordert
4. **Eskalationsregeln** - wann angehalten und um Hilfe gebeten werden soll

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (siehe [Agent-Arbeitsbereich](/de/concepts/agent-workspace) für die vollständige Liste der automatisch injizierten Dateien) und führt sie zusammen mit [Cron-Jobs](/de/automation/cron-jobs) für zeitbasierte Durchsetzung aus.

<Tip>
Legen Sie Daueranweisungen in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap injiziert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` - aber keine beliebigen Dateien in Unterverzeichnissen.
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

### Beispiel 2: Finanzabläufe (ereignisgesteuert)

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

### Beispiel 3: Monitoring und Warnungen (kontinuierlich)

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

## Ausführen-Prüfen-Berichten-Muster

Daueranweisungen funktionieren am besten, wenn sie mit strenger Ausführungsdisziplin kombiniert werden. Jede Aufgabe in einer Daueranweisung sollte dieser Schleife folgen:

1. **Ausführen** - Die eigentliche Arbeit erledigen (nicht nur die Anweisung bestätigen)
2. **Prüfen** - Bestätigen, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** - Dem Owner mitteilen, was erledigt und was geprüft wurde

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

Für Agenten, die mehrere Themen verwalten, organisieren Sie Daueranweisungen als separate Programme mit klaren Grenzen:

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

- Eine eigene **Trigger-Kadenz** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschwellen** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Bewährte Vorgehensweisen

### Empfohlen

- Beginnen Sie mit enger Befugnis und erweitern Sie sie, wenn Vertrauen entsteht
- Definieren Sie explizite Genehmigungsschwellen für risikoreiche Aktionen
- Fügen Sie Abschnitte „Was NICHT zu tun ist“ hinzu - Grenzen sind genauso wichtig wie Berechtigungen
- Kombinieren Sie sie mit Cron-Jobs für zuverlässige zeitbasierte Ausführung
- Prüfen Sie die Agent-Protokolle wöchentlich, um sicherzustellen, dass Daueranweisungen befolgt werden
- Aktualisieren Sie Daueranweisungen, wenn sich Ihre Anforderungen ändern - sie sind lebende Dokumente

### Vermeiden

- Breite Befugnis am ersten Tag erteilen („Tun Sie, was Sie für das Beste halten“)
- Eskalationsregeln auslassen - jedes Programm benötigt eine Klausel dazu, wann angehalten und gefragt werden soll
- Annehmen, dass der Agent mündliche Anweisungen behält - legen Sie alles in der Datei ab
- Themen in einem einzigen Programm vermischen - separate Programme für separate Bereiche
- Die Durchsetzung mit Cron-Jobs vergessen - Daueranweisungen ohne Trigger werden zu Vorschlägen

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): Zeitplandurchsetzung für Daueranweisungen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Lebenszyklusereignisse von Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): eingehende HTTP-Ereignistrigger.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): wo Daueranweisungen abgelegt werden, einschließlich der vollständigen Liste automatisch injizierter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
