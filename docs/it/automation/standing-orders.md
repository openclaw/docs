---
read_when:
    - Configurazione di flussi di lavoro di agenti autonomi che vengono eseguiti senza istruzioni per ogni attività
    - Definire ciò che l'agente può fare in autonomia rispetto a ciò che richiede l'approvazione umana
    - Strutturare agenti multiprogramma con confini chiari e regole di escalation
summary: Definire l'autorità operativa permanente per i programmi di agenti autonomi
title: Istruzioni permanenti
x-i18n:
    generated_at: "2026-05-06T08:39:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Gli ordini permanenti concedono al tuo agente **autorità operativa permanente** per programmi definiti. Invece di fornire ogni volta istruzioni per singole attività, definisci programmi con ambito, trigger e regole di escalation chiari - e l'agente opera autonomamente entro quei limiti.

Questa è la differenza tra dire al tuo assistente "invia il report settimanale" ogni venerdì e concedere un'autorità permanente: "Sei responsabile del report settimanale. Compilalo ogni venerdì, invialo ed effettua escalation solo se qualcosa sembra anomalo."

## Perché gli ordini permanenti

**Senza ordini permanenti:**

- Devi inviare un prompt all'agente per ogni attività
- L'agente resta inattivo tra una richiesta e l'altra
- Il lavoro di routine viene dimenticato o ritardato
- Diventi il collo di bottiglia

**Con ordini permanenti:**

- L'agente opera autonomamente entro limiti definiti
- Il lavoro di routine avviene in base alla pianificazione senza prompt
- Vieni coinvolto solo per eccezioni e approvazioni
- L'agente usa in modo produttivo il tempo di inattività

## Come funzionano

Gli ordini permanenti sono definiti nei file della tua [area di lavoro dell'agente](/it/concepts/agent-workspace). L'approccio consigliato è includerli direttamente in `AGENTS.md` (che viene iniettato automaticamente in ogni sessione) in modo che l'agente li abbia sempre nel contesto. Per configurazioni più grandi, puoi anche inserirli in un file dedicato come `standing-orders.md` e farvi riferimento da `AGENTS.md`.

Ogni programma specifica:

1. **Ambito** - cosa l'agente è autorizzato a fare
2. **Trigger** - quando eseguire (pianificazione, evento o condizione)
3. **Gate di approvazione** - cosa richiede l'approvazione umana prima di agire
4. **Regole di escalation** - quando fermarsi e chiedere aiuto

L'agente carica queste istruzioni a ogni sessione tramite i file di bootstrap dell'area di lavoro (vedi [Area di lavoro dell'agente](/it/concepts/agent-workspace) per l'elenco completo dei file iniettati automaticamente) e le esegue, combinate con i [job Cron](/it/automation/cron-jobs) per l'applicazione basata sul tempo.

<Tip>
Inserisci gli ordini permanenti in `AGENTS.md` per garantire che vengano caricati a ogni sessione. Il bootstrap dell'area di lavoro inietta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` - ma non file arbitrari nelle sottodirectory.
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
- Do not skip delivery if metrics look bad - report accurately
```

## Ordini permanenti e job Cron

Gli ordini permanenti definiscono **cosa** l'agente è autorizzato a fare. I [job Cron](/it/automation/cron-jobs) definiscono **quando** avviene. Funzionano insieme:

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
- **Tuesday-Thursday:** Draft social posts, create blog content
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

## Pattern esegui-verifica-riporta

Gli ordini permanenti funzionano al meglio quando sono combinati con una disciplina di esecuzione rigorosa. Ogni attività in un ordine permanente dovrebbe seguire questo ciclo:

1. **Esegui** - Svolgi il lavoro effettivo (non limitarti a confermare l'istruzione)
2. **Verifica** - Conferma che il risultato sia corretto (il file esiste, il messaggio è stato consegnato, i dati sono stati analizzati)
3. **Riporta** - Comunica al proprietario cosa è stato fatto e cosa è stato verificato

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Questo pattern previene la modalità di errore più comune degli agenti: confermare un'attività senza completarla.

## Architettura multiprogramma

Per gli agenti che gestiscono più ambiti, organizza gli ordini permanenti come programmi separati con limiti chiari:

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

- La propria **cadenza di trigger** (settimanale, mensile, guidata da eventi, continua)
- I propri **gate di approvazione** (alcuni programmi richiedono più supervisione di altri)
- **Limiti** chiari (l'agente dovrebbe sapere dove finisce un programma e ne inizia un altro)

## Best practice

### Cosa fare

- Inizia con un'autorità ristretta ed espandila man mano che aumenta la fiducia
- Definisci gate di approvazione espliciti per le azioni ad alto rischio
- Includi sezioni "Cosa NON fare" - i limiti contano quanto le autorizzazioni
- Combina con job Cron per un'esecuzione affidabile basata sul tempo
- Rivedi settimanalmente i log dell'agente per verificare che gli ordini permanenti vengano seguiti
- Aggiorna gli ordini permanenti man mano che le tue esigenze evolvono - sono documenti vivi

### Da evitare

- Concedere un'autorità ampia il primo giorno ("fai quello che ritieni meglio")
- Saltare le regole di escalation - ogni programma ha bisogno di una clausola "quando fermarsi e chiedere"
- Presumere che l'agente ricordi istruzioni verbali - inserisci tutto nel file
- Mescolare ambiti in un unico programma - programmi separati per domini separati
- Dimenticare di applicare con job Cron - gli ordini permanenti senza trigger diventano suggerimenti

## Correlati

- [Automazione e attività](/it/automation): tutti i meccanismi di automazione in sintesi.
- [Job Cron](/it/automation/cron-jobs): applicazione della pianificazione per gli ordini permanenti.
- [Hook](/it/automation/hooks): script guidati da eventi per gli eventi del ciclo di vita dell'agente.
- [Webhook](/it/automation/cron-jobs#webhooks): trigger di eventi HTTP in ingresso.
- [Area di lavoro dell'agente](/it/concepts/agent-workspace): dove risiedono gli ordini permanenti, incluso l'elenco completo dei file di bootstrap iniettati automaticamente (`AGENTS.md`, `SOUL.md`, ecc.).
