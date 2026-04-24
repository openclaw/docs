---
read_when:
    - Configurazione di flussi di lavoro di agenti autonomi che vengono eseguiti senza prompt per ogni attività
    - Definizione di ciò che l'agente può fare in autonomia rispetto a ciò che richiede l'approvazione umana
    - Strutturazione di agenti multi-programma con confini chiari e regole di escalation
summary: Definire un'autorità operativa permanente per programmi di agenti autonomi
title: Ordini permanenti
x-i18n:
    generated_at: "2026-04-24T08:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Gli ordini permanenti concedono al tuo agente **un'autorità operativa permanente** per programmi definiti. Invece di fornire ogni volta istruzioni per singole attività, definisci programmi con ambito, trigger e regole di escalation chiari — e l'agente esegue in autonomia entro questi confini.

Questa è la differenza tra dire al tuo assistente "invia il report settimanale" ogni venerdì e concedere un'autorità permanente: "Ti occupi tu del report settimanale. Compilalo ogni venerdì, invialo ed effettua l'escalation solo se qualcosa sembra non andare."

## Perché gli ordini permanenti?

**Senza ordini permanenti:**

- Devi fornire un prompt all'agente per ogni attività
- L'agente resta inattivo tra una richiesta e l'altra
- Il lavoro di routine viene dimenticato o ritardato
- Diventi tu il collo di bottiglia

**Con gli ordini permanenti:**

- L'agente esegue in autonomia entro confini definiti
- Il lavoro di routine viene svolto nei tempi previsti senza prompt
- Intervieni solo per eccezioni e approvazioni
- L'agente usa produttivamente il tempo di inattività

## Come funzionano

Gli ordini permanenti sono definiti nei file del tuo [spazio di lavoro dell'agente](/it/concepts/agent-workspace). L'approccio consigliato è includerli direttamente in `AGENTS.md` (che viene inserito automaticamente in ogni sessione) in modo che l'agente li abbia sempre nel contesto. Per configurazioni più grandi, puoi anche inserirli in un file dedicato come `standing-orders.md` e farvi riferimento da `AGENTS.md`.

Ogni programma specifica:

1. **Ambito** — cosa l'agente è autorizzato a fare
2. **Trigger** — quando eseguire (pianificazione, evento o condizione)
3. **Punti di approvazione** — cosa richiede l'approvazione umana prima di agire
4. **Regole di escalation** — quando fermarsi e chiedere aiuto

L'agente carica queste istruzioni a ogni sessione tramite i file bootstrap dello spazio di lavoro (vedi [Spazio di lavoro dell'agente](/it/concepts/agent-workspace) per l'elenco completo dei file inseriti automaticamente) e le esegue insieme ai [job Cron](/it/automation/cron-jobs) per l'applicazione basata sul tempo.

<Tip>
Inserisci gli ordini permanenti in `AGENTS.md` per garantire che vengano caricati in ogni sessione. Il bootstrap dello spazio di lavoro inserisce automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` — ma non file arbitrari nelle sottodirectory.
</Tip>

## Anatomia di un ordine permanente

```markdown
## Programma: Report settimanale sullo stato

**Autorità:** Raccogliere i dati, generare il report, consegnarlo agli stakeholder
**Trigger:** Ogni venerdì alle 16:00 (applicato tramite job Cron)
**Punto di approvazione:** Nessuno per i report standard. Segnala anomalie per revisione umana.
**Escalation:** Se la fonte dati non è disponibile o le metriche sembrano insolite (>2σ dalla norma)

### Fasi di esecuzione

1. Recupera le metriche dalle fonti configurate
2. Confrontale con la settimana precedente e con gli obiettivi
3. Genera il report in Reports/weekly/YYYY-MM-DD.md
4. Invia il riepilogo tramite il canale configurato
5. Registra il completamento in Agent/Logs/

### Cosa NON fare

- Non inviare report a soggetti esterni
- Non modificare i dati di origine
- Non saltare l'invio se le metriche sembrano negative — riporta i dati in modo accurato
```

## Ordini permanenti + job Cron

Gli ordini permanenti definiscono **cosa** l'agente è autorizzato a fare. I [job Cron](/it/automation/cron-jobs) definiscono **quando** accade. Funzionano insieme:

```
Ordine permanente: "Ti occupi dello smistamento quotidiano della posta in arrivo"
    ↓
Job Cron (ogni giorno alle 8:00): "Esegui lo smistamento della posta in arrivo secondo gli ordini permanenti"
    ↓
Agente: legge gli ordini permanenti → esegue i passaggi → riporta i risultati
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
## Programma: Contenuti e social media

**Autorità:** Redigere contenuti, pianificare post, compilare report sul coinvolgimento
**Punto di approvazione:** Tutti i post richiedono la revisione del proprietario per i primi 30 giorni, poi approvazione permanente
**Trigger:** Ciclo settimanale (revisione il lunedì → bozze a metà settimana → briefing il venerdì)

### Ciclo settimanale

- **Lunedì:** Esamina le metriche della piattaforma e il coinvolgimento del pubblico
- **Da martedì a giovedì:** Redigi post social, crea contenuti per il blog
- **Venerdì:** Compila il briefing marketing settimanale → consegnalo al proprietario

### Regole per i contenuti

- Il tono deve corrispondere al brand (vedi SOUL.md o la guida alla voce del brand)
- Non identificarti mai come AI nei contenuti rivolti al pubblico
- Includi metriche quando disponibili
- Concentrati sul valore per il pubblico, non sull'autopromozione
```

### Esempio 2: operazioni finanziarie (attivate da evento)

```markdown
## Programma: Elaborazione finanziaria

**Autorità:** Elaborare i dati delle transazioni, generare report, inviare riepiloghi
**Punto di approvazione:** Nessuno per l'analisi. Le raccomandazioni richiedono l'approvazione del proprietario.
**Trigger:** Rilevamento di un nuovo file di dati OPPURE ciclo mensile pianificato

### Quando arrivano nuovi dati

1. Rileva un nuovo file nella directory di input designata
2. Analizza e categorizza tutte le transazioni
3. Confronta i risultati con gli obiettivi di budget
4. Segnala: elementi insoliti, superamenti di soglia, nuovi addebiti ricorrenti
5. Genera il report nella directory di output designata
6. Invia il riepilogo al proprietario tramite il canale configurato

### Regole di escalation

- Singolo elemento > $500: avviso immediato
- Categoria > budget del 20%: segnala nel report
- Transazione non riconoscibile: chiedi al proprietario la categorizzazione
- Elaborazione fallita dopo 2 tentativi: segnala l'errore, non fare supposizioni
```

### Esempio 3: monitoraggio e avvisi (continuo)

```markdown
## Programma: Monitoraggio del sistema

**Autorità:** Controllare lo stato del sistema, riavviare i servizi, inviare avvisi
**Punto di approvazione:** Riavvia i servizi automaticamente. Effettua l'escalation se il riavvio fallisce due volte.
**Trigger:** A ogni ciclo di Heartbeat

### Controlli

- Gli endpoint di stato dei servizi rispondono
- Lo spazio disco è sopra la soglia
- Le attività in sospeso non sono obsolete (>24 ore)
- I canali di consegna sono operativi

### Matrice di risposta

| Condizione      | Azione                      | Escalation?                 |
| --------------- | --------------------------- | --------------------------- |
| Servizio offline | Riavvia automaticamente     | Solo se il riavvio fallisce 2 volte |
| Spazio disco < 10% | Avvisa il proprietario    | Sì                          |
| Attività obsoleta > 24h | Ricorda al proprietario | No                        |
| Canale offline  | Registra e riprova al ciclo successivo | Se offline > 2 ore |
```

## Il modello Esegui-Verifica-Riporta

Gli ordini permanenti funzionano al meglio se combinati con una rigorosa disciplina di esecuzione. Ogni attività in un ordine permanente dovrebbe seguire questo ciclo:

1. **Esegui** — Svolgi il lavoro effettivo (non limitarti a riconoscere l'istruzione)
2. **Verifica** — Conferma che il risultato sia corretto (il file esiste, il messaggio è stato consegnato, i dati sono stati analizzati)
3. **Riporta** — Comunica al proprietario cosa è stato fatto e cosa è stato verificato

```markdown
### Regole di esecuzione

- Ogni attività segue Esegui-Verifica-Riporta. Nessuna eccezione.
- "Lo farò" non è esecuzione. Fallo, poi riportalo.
- "Fatto" senza verifica non è accettabile. Dimostralo.
- Se l'esecuzione fallisce: riprova una volta con un approccio corretto.
- Se fallisce ancora: segnala l'errore con una diagnosi. Non fallire mai in silenzio.
- Non riprovare all'infinito — massimo 3 tentativi, poi escalation.
```

Questo modello previene la modalità di errore più comune degli agenti: riconoscere un'attività senza completarla.

## Architettura multi-programma

Per agenti che gestiscono più ambiti, organizza gli ordini permanenti come programmi separati con confini chiari:

```markdown
# Ordini permanenti

## Programma 1: [Dominio A] (Settimanale)

...

## Programma 2: [Dominio B] (Mensile + Su richiesta)

...

## Programma 3: [Dominio C] (Secondo necessità)

...

## Regole di escalation (Tutti i programmi)

- [Criteri di escalation comuni]
- [Punti di approvazione che si applicano a tutti i programmi]
```

Ogni programma dovrebbe avere:

- La propria **cadenza di attivazione** (settimanale, mensile, guidata da eventi, continua)
- I propri **punti di approvazione** (alcuni programmi richiedono più supervisione di altri)
- **Confini** chiari (l'agente dovrebbe sapere dove finisce un programma e ne inizia un altro)

## Best practice

### Da fare

- Inizia con un'autorità limitata ed espandila man mano che cresce la fiducia
- Definisci punti di approvazione espliciti per azioni ad alto rischio
- Includi sezioni "Cosa NON fare" — i confini contano quanto i permessi
- Combina il tutto con job Cron per un'esecuzione affidabile basata sul tempo
- Esamina settimanalmente i log dell'agente per verificare che gli ordini permanenti vengano seguiti
- Aggiorna gli ordini permanenti man mano che le tue esigenze evolvono — sono documenti vivi

### Da evitare

- Concedere ampia autorità fin dal primo giorno ("fai quello che ritieni meglio")
- Saltare le regole di escalation — ogni programma ha bisogno di una clausola "quando fermarsi e chiedere"
- Presumere che l'agente ricorderà istruzioni verbali — metti tutto nel file
- Mescolare ambiti diversi in un singolo programma — programmi separati per domini separati
- Dimenticare di applicare il tutto con job Cron — gli ordini permanenti senza trigger diventano suggerimenti

## Correlati

- [Automation & Tasks](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Cron Jobs](/it/automation/cron-jobs) — applicazione della pianificazione per gli ordini permanenti
- [Hooks](/it/automation/hooks) — script guidati da eventi per gli eventi del ciclo di vita dell'agente
- [Webhooks](/it/automation/cron-jobs#webhooks) — trigger di eventi HTTP in ingresso
- [Agent Workspace](/it/concepts/agent-workspace) — dove risiedono gli ordini permanenti, incluso l'elenco completo dei file bootstrap inseriti automaticamente (AGENTS.md, SOUL.md, ecc.)
