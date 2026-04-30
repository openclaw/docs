---
read_when:
    - Configurazione di flussi di lavoro di agenti autonomi che vengono eseguiti senza richiedere istruzioni per ogni attività
    - Definire cosa l'agente può fare in autonomia rispetto a ciò che richiede l'approvazione umana
    - Strutturare agenti multi-programma con confini chiari e regole di escalation
summary: Definire l'autorità operativa permanente per i programmi di agenti autonomi
title: Istruzioni permanenti
x-i18n:
    generated_at: "2026-04-30T08:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

Gli ordini permanenti concedono al tuo agente **autorità operativa permanente** per programmi definiti. Invece di fornire ogni volta istruzioni per singole attività, definisci programmi con ambito, trigger e regole di escalation chiari, e l'agente esegue autonomamente entro quei confini.

Questa è la differenza tra dire al tuo assistente "invia il report settimanale" ogni venerdì e concedere un'autorità permanente: "Sei responsabile del report settimanale. Compilalo ogni venerdì, invialo e fai escalation solo se qualcosa sembra errato."

## Perché usare gli ordini permanenti

**Senza ordini permanenti:**

- Devi sollecitare l'agente per ogni attività
- L'agente resta inattivo tra una richiesta e l'altra
- Il lavoro di routine viene dimenticato o ritardato
- Diventi il collo di bottiglia

**Con gli ordini permanenti:**

- L'agente esegue autonomamente entro confini definiti
- Il lavoro di routine avviene secondo pianificazione senza prompt
- Vieni coinvolto solo per eccezioni e approvazioni
- L'agente usa il tempo inattivo in modo produttivo

## Come funzionano

Gli ordini permanenti sono definiti nei file del tuo [workspace dell'agente](/it/concepts/agent-workspace). L'approccio consigliato è includerli direttamente in `AGENTS.md` (che viene iniettato automaticamente in ogni sessione), così l'agente li ha sempre nel contesto. Per configurazioni più ampie, puoi anche inserirli in un file dedicato come `standing-orders.md` e farvi riferimento da `AGENTS.md`.

Ogni programma specifica:

1. **Ambito** — ciò che l'agente è autorizzato a fare
2. **Trigger** — quando eseguire (pianificazione, evento o condizione)
3. **Gate di approvazione** — cosa richiede l'approvazione umana prima di agire
4. **Regole di escalation** — quando fermarsi e chiedere aiuto

L'agente carica queste istruzioni a ogni sessione tramite i file di bootstrap del workspace (vedi [Workspace dell'agente](/it/concepts/agent-workspace) per l'elenco completo dei file iniettati automaticamente) e le esegue, combinate con i [job Cron](/it/automation/cron-jobs) per l'applicazione basata sul tempo.

<Tip>
Inserisci gli ordini permanenti in `AGENTS.md` per garantire che vengano caricati a ogni sessione. Il bootstrap del workspace inietta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md`, ma non file arbitrari nelle sottodirectory.
</Tip>

## Anatomia di un ordine permanente

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

## Ordini permanenti più job Cron

Gli ordini permanenti definiscono **cosa** l'agente è autorizzato a fare. I [job Cron](/it/automation/cron-jobs) definiscono **quando** accade. Funzionano insieme:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Il prompt del job Cron dovrebbe fare riferimento all'ordine permanente invece di duplicarlo:

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

## Esempi

### Esempio 1: contenuti e social media (ciclo settimanale)

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

### Esempio 2: operazioni finanziarie (attivate da evento)

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

### Esempio 3: monitoraggio e avvisi (continuo)

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

## Schema esegui-verifica-riporta

Gli ordini permanenti funzionano meglio quando sono combinati con una disciplina di esecuzione rigorosa. Ogni attività in un ordine permanente dovrebbe seguire questo ciclo:

1. **Esegui** — Svolgi il lavoro effettivo (non limitarti a confermare l'istruzione)
2. **Verifica** — Conferma che il risultato sia corretto (il file esiste, il messaggio è stato consegnato, i dati sono stati analizzati)
3. **Riporta** — Comunica al proprietario cosa è stato fatto e cosa è stato verificato

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Questo schema previene la modalità di errore più comune degli agenti: confermare un'attività senza completarla.

## Architettura multiprogramma

Per gli agenti che gestiscono più ambiti, organizza gli ordini permanenti come programmi separati con confini chiari:

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

Ogni programma dovrebbe avere:

- La propria **cadenza di trigger** (settimanale, mensile, basata su eventi, continua)
- I propri **gate di approvazione** (alcuni programmi richiedono più supervisione di altri)
- **Confini** chiari (l'agente dovrebbe sapere dove finisce un programma e dove ne inizia un altro)

## Buone pratiche

### Da fare

- Inizia con un'autorità limitata ed espandila man mano che cresce la fiducia
- Definisci gate di approvazione espliciti per le azioni ad alto rischio
- Includi sezioni "Cosa NON fare": i confini contano quanto i permessi
- Combina con job Cron per un'esecuzione affidabile basata sul tempo
- Rivedi settimanalmente i log dell'agente per verificare che gli ordini permanenti vengano seguiti
- Aggiorna gli ordini permanenti man mano che le tue esigenze evolvono: sono documenti vivi

### Da evitare

- Concedere ampia autorità il primo giorno ("fai quello che ritieni migliore")
- Saltare le regole di escalation: ogni programma ha bisogno di una clausola "quando fermarsi e chiedere"
- Dare per scontato che l'agente ricordi istruzioni verbali: metti tutto nel file
- Mescolare ambiti in un singolo programma: programmi separati per domini separati
- Dimenticare di applicarli con job Cron: gli ordini permanenti senza trigger diventano suggerimenti

## Correlati

- [Automazione e attività](/it/automation): tutti i meccanismi di automazione in sintesi.
- [Job Cron](/it/automation/cron-jobs): applicazione della pianificazione per gli ordini permanenti.
- [Hook](/it/automation/hooks): script basati su eventi per gli eventi del ciclo di vita dell'agente.
- [Webhook](/it/automation/cron-jobs#webhooks): trigger di eventi HTTP in ingresso.
- [Workspace dell'agente](/it/concepts/agent-workspace): dove risiedono gli ordini permanenti, incluso l'elenco completo dei file di bootstrap iniettati automaticamente (`AGENTS.md`, `SOUL.md`, ecc.).
