---
read_when:
    - Autonome Agenten-Workflows einrichten, die ohne Eingabeaufforderungen für einzelne Aufgaben ausgeführt werden
    - Festlegen, was der Agent selbstständig tun kann und was menschliche Zustimmung erfordert
    - Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln strukturieren
summary: Dauerhafte Betriebsberechtigungen für autonome Agentenprogramme definieren
title: Ständige Anweisungen
x-i18n:
    generated_at: "2026-04-30T06:38:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueraufträge gewähren Ihrem Agenten **dauerhafte operative Befugnis** für definierte Programme. Statt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln — und der Agent führt sie innerhalb dieser Grenzen autonom aus.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten, jeden Freitag „den Wochenbericht zu senden“, und einer dauerhaften Befugnis: „Sie verantworten den Wochenbericht. Erstellen Sie ihn jeden Freitag, senden Sie ihn und eskalieren Sie nur, wenn etwas ungewöhnlich aussieht.“

## Warum Daueraufträge

**Ohne Daueraufträge:**

- Sie müssen den Agenten für jede Aufgabe anweisen
- Der Agent bleibt zwischen Anfragen untätig
- Routinetätigkeiten werden vergessen oder verzögert
- Sie werden zum Engpass

**Mit Daueraufträgen:**

- Der Agent führt Aufgaben innerhalb definierter Grenzen autonom aus
- Routinetätigkeiten erfolgen planmäßig ohne Aufforderung
- Sie werden nur bei Ausnahmen und Genehmigungen einbezogen
- Der Agent nutzt Leerlaufzeiten produktiv

## Wie sie funktionieren

Daueraufträge werden in den Dateien Ihres [Agenten-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (die in jeder Sitzung automatisch injiziert wird), damit der Agent sie immer im Kontext hat. Für größere Konfigurationen können Sie sie auch in einer dedizierten Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm gibt Folgendes an:

1. **Umfang** — was der Agent tun darf
2. **Auslöser** — wann die Ausführung erfolgt (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschwellen** — was vor der Ausführung menschliche Freigabe erfordert
4. **Eskalationsregeln** — wann gestoppt und um Hilfe gebeten werden muss

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (siehe [Agenten-Arbeitsbereich](/de/concepts/agent-workspace) für die vollständige Liste automatisch injizierter Dateien) und führt sie aus, kombiniert mit [Cron-Jobs](/de/automation/cron-jobs) für zeitbasierte Durchsetzung.

<Tip>
Legen Sie Daueraufträge in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap injiziert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` — aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau eines Dauerauftrags

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
- Do not skip delivery if metrics look bad — report accurately
```

## Daueraufträge plus Cron-Jobs

Daueraufträge definieren, **was** der Agent tun darf. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Der Prompt des Cron-Jobs sollte auf den Dauerauftrag verweisen, statt ihn zu duplizieren:

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

### Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
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

## Execute-Verify-Report-Muster

Daueraufträge funktionieren am besten in Kombination mit strikter Ausführungsdisziplin. Jede Aufgabe in einem Dauerauftrag sollte dieser Schleife folgen:

1. **Ausführen** — Erledigen Sie die eigentliche Arbeit (bestätigen Sie nicht nur die Anweisung)
2. **Verifizieren** — Bestätigen Sie, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** — Teilen Sie dem Eigentümer mit, was erledigt und was verifiziert wurde

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Dieses Muster verhindert den häufigsten Fehlermodus von Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Multi-Programm-Architektur

Für Agenten, die mehrere Themenbereiche verwalten, organisieren Sie Daueraufträge als separate Programme mit klaren Grenzen:

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

- Eine eigene **Auslöserkadenz** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschwellen** (manche Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Empfohlen

- Beginnen Sie mit enger Befugnis und erweitern Sie diese, wenn Vertrauen entsteht
- Definieren Sie explizite Genehmigungsschwellen für risikoreiche Aktionen
- Fügen Sie Abschnitte „Was NICHT zu tun ist“ hinzu — Grenzen sind genauso wichtig wie Berechtigungen
- Kombinieren Sie dies mit Cron-Jobs für zuverlässige zeitbasierte Ausführung
- Prüfen Sie wöchentlich die Agentenprotokolle, um zu verifizieren, dass Daueraufträge befolgt werden
- Aktualisieren Sie Daueraufträge, wenn sich Ihre Anforderungen weiterentwickeln — sie sind lebende Dokumente

### Vermeiden

- Am ersten Tag weitreichende Befugnis zu gewähren („tun Sie, was Sie für am besten halten“)
- Eskalationsregeln auszulassen — jedes Programm benötigt eine Klausel, wann gestoppt und gefragt werden muss
- Anzunehmen, dass der Agent mündliche Anweisungen behält — schreiben Sie alles in die Datei
- Themenbereiche in einem einzigen Programm zu vermischen — separate Programme für separate Domänen
- Die Durchsetzung mit Cron-Jobs zu vergessen — Daueraufträge ohne Auslöser werden zu Vorschlägen

## Verwandte Themen

- [Automatisierung und Aufgaben](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): Zeitplandurchsetzung für Daueraufträge.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Lebenszyklusereignisse des Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): eingehende HTTP-Ereignisauslöser.
- [Agenten-Arbeitsbereich](/de/concepts/agent-workspace): wo Daueraufträge abgelegt werden, einschließlich der vollständigen Liste automatisch injizierter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
