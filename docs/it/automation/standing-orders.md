---
read_when:
    - Configurazione di flussi di lavoro autonomi degli agenti che vengono eseguiti senza richieste per ogni attività
    - Definire cosa può fare l'agente in autonomia e cosa richiede l'approvazione umana
    - Strutturare agenti multiprogramma con confini chiari e regole di escalation
summary: Definisci l'autorità operativa permanente per i programmi di agenti autonomi
title: Ordini permanenti
x-i18n:
    generated_at: "2026-07-12T06:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Gli ordini permanenti conferiscono al tuo agente **autorità operativa permanente** per programmi definiti. Invece di impartire istruzioni all'agente per ogni attività, definisci programmi con ambito, trigger e regole di escalation chiari, e l'agente opera autonomamente entro tali limiti: "Sei responsabile del rapporto settimanale. Compilalo ogni venerdì, invialo e avvia un'escalation solo se qualcosa non sembra corretto."

## Perché usare gli ordini permanenti

**Senza ordini permanenti:** devi impartire istruzioni all'agente per ogni attività, il lavoro di routine viene dimenticato o ritardato e tu diventi il collo di bottiglia.

**Con gli ordini permanenti:** l'agente opera autonomamente entro limiti definiti, il lavoro di routine viene svolto nei tempi previsti e tu intervieni solo per eccezioni e approvazioni.

## Come funzionano

Gli ordini permanenti sono definiti nei file del tuo [workspace dell'agente](/it/concepts/agent-workspace). L'approccio consigliato consiste nell'includerli direttamente in `AGENTS.md` (che viene inserito automaticamente in ogni sessione), affinché l'agente li abbia sempre nel contesto. Per configurazioni più grandi, puoi anche inserirli in un file dedicato come `standing-orders.md` e farvi riferimento da `AGENTS.md`.

Ogni programma specifica:

1. **Ambito** - ciò che l'agente è autorizzato a fare
2. **Trigger** - quando eseguire il programma (pianificazione, evento o condizione)
3. **Punti di approvazione** - ciò che richiede l'autorizzazione umana prima di procedere
4. **Regole di escalation** - quando fermarsi e chiedere aiuto

L'agente carica queste istruzioni a ogni sessione tramite i file di bootstrap del workspace (consulta [Workspace dell'agente](/it/concepts/agent-workspace) per l'elenco completo dei file inseriti automaticamente) e le esegue, in combinazione con i [processi Cron](/it/automation/cron-jobs) per garantirne l'applicazione in base al tempo.

<Tip>
Inserisci gli ordini permanenti in `AGENTS.md` per garantirne il caricamento a ogni sessione. Il bootstrap del workspace inserisce automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md`, ma non file arbitrari presenti nelle sottodirectory.
</Tip>

## Anatomia di un ordine permanente

```markdown
## Programma: Rapporto settimanale sullo stato

**Autorità:** Compilare i dati, generare il rapporto, consegnarlo alle parti interessate
**Trigger:** Ogni venerdì alle 16:00 (applicato tramite un processo Cron)
**Punto di approvazione:** Nessuno per i rapporti standard. Segnalare le anomalie per la revisione umana.
**Escalation:** Se la fonte dei dati non è disponibile o le metriche sembrano insolite (>2σ rispetto alla norma)

### Passaggi di esecuzione

1. Recuperare le metriche dalle fonti configurate
2. Confrontarle con la settimana precedente e con gli obiettivi
3. Generare il rapporto in Reports/weekly/YYYY-MM-DD.md
4. Inviare il riepilogo tramite il canale configurato
5. Registrare il completamento in Agent/Logs/

### Cosa NON fare

- Non inviare rapporti a soggetti esterni
- Non modificare i dati di origine
- Non saltare l'invio se le metriche sono negative: riportarle con precisione
```

## Ordini permanenti e processi Cron

Gli ordini permanenti definiscono **cosa** l'agente è autorizzato a fare. I [processi Cron](/it/automation/cron-jobs) definiscono **quando** avviene. Operano insieme:

```text
Ordine permanente: "Sei responsabile della classificazione quotidiana della posta in arrivo"
    ↓
Processo Cron (ogni giorno alle 8:00): "Esegui la classificazione della posta in arrivo secondo gli ordini permanenti"
    ↓
Agente: legge gli ordini permanenti → esegue i passaggi → comunica i risultati
```

Il prompt del processo Cron deve fare riferimento all'ordine permanente anziché duplicarlo:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Esegui la classificazione quotidiana della posta in arrivo secondo gli ordini permanenti. Controlla la posta per individuare nuovi avvisi. Analizza, categorizza e salva ogni elemento. Invia un riepilogo al proprietario. Avvia un'escalation per gli elementi sconosciuti."
```

## Esempi

### Esempio 1: contenuti e social media (ciclo settimanale)

```markdown
## Programma: Contenuti e social media

**Autorità:** Redigere contenuti, programmare pubblicazioni, compilare rapporti sul coinvolgimento
**Punto di approvazione:** Tutte le pubblicazioni richiedono la revisione del proprietario per i primi 30 giorni, quindi si applica l'approvazione permanente
**Trigger:** Ciclo settimanale (revisione del lunedì → bozze infrasettimanali → resoconto del venerdì)

### Ciclo settimanale

- **Lunedì:** Esaminare le metriche delle piattaforme e il coinvolgimento del pubblico
- **Martedì-giovedì:** Redigere pubblicazioni per i social, creare contenuti per il blog
- **Venerdì:** Compilare il resoconto settimanale di marketing → consegnarlo al proprietario

### Regole per i contenuti

- Il tono deve corrispondere al marchio (consulta SOUL.md o la guida al tono del marchio)
- Non presentarsi mai come IA nei contenuti destinati al pubblico
- Includere le metriche quando disponibili
- Concentrarsi sul valore per il pubblico, non sull'autopromozione
```

### Esempio 2: operazioni finanziarie (attivate da eventi)

```markdown
## Programma: Elaborazione finanziaria

**Autorità:** Elaborare i dati delle transazioni, generare rapporti, inviare riepiloghi
**Punto di approvazione:** Nessuno per l'analisi. Le raccomandazioni richiedono l'approvazione del proprietario.
**Trigger:** Rilevamento di un nuovo file di dati OPPURE ciclo mensile pianificato

### Quando arrivano nuovi dati

1. Rilevare il nuovo file nella directory di input designata
2. Analizzare e categorizzare tutte le transazioni
3. Confrontarle con gli obiettivi di budget
4. Segnalare: elementi insoliti, superamenti delle soglie, nuovi addebiti ricorrenti
5. Generare il rapporto nella directory di output designata
6. Inviare il riepilogo al proprietario tramite il canale configurato

### Regole di escalation

- Singolo elemento > $500: avviso immediato
- Categoria oltre il budget del 20%: segnalarla nel rapporto
- Transazione non riconoscibile: chiedere al proprietario di categorizzarla
- Elaborazione non riuscita dopo 2 tentativi: segnalare l'errore, non fare supposizioni
```

### Esempio 3: monitoraggio e avvisi (continuo)

```markdown
## Programma: Monitoraggio del sistema

**Autorità:** Controllare lo stato del sistema, riavviare i servizi, inviare avvisi
**Punto di approvazione:** Riavviare automaticamente i servizi. Avviare un'escalation se il riavvio non riesce due volte.
**Trigger:** A ogni ciclo di Heartbeat

### Controlli

- Gli endpoint di stato dei servizi rispondono
- Lo spazio su disco supera la soglia
- Le attività in sospeso non sono obsolete (>24 ore)
- I canali di consegna sono operativi

### Matrice delle risposte

| Condizione                  | Azione                               | Avviare un'escalation?                |
| --------------------------- | ------------------------------------ | ------------------------------------- |
| Servizio non disponibile    | Riavviare automaticamente            | Solo se il riavvio non riesce 2 volte |
| Spazio su disco < 10%       | Avvisare il proprietario             | Sì                                    |
| Attività obsoleta da > 24 h | Inviare un promemoria al proprietario | No                                    |
| Canale non disponibile      | Registrare e riprovare al ciclo successivo | Se non disponibile per > 2 ore  |
```

## Schema esecuzione-verifica-resoconto

Gli ordini permanenti funzionano meglio se associati a una rigorosa disciplina di esecuzione. Ogni attività di un ordine permanente deve seguire questo ciclo:

1. **Esecuzione** - Svolgere effettivamente il lavoro (non limitarsi a confermare l'istruzione)
2. **Verifica** - Confermare che il risultato sia corretto (il file esiste, il messaggio è stato consegnato, i dati sono stati analizzati)
3. **Resoconto** - Comunicare al proprietario cosa è stato fatto e cosa è stato verificato

```markdown
### Regole di esecuzione

- Ogni attività segue lo schema Esecuzione-Verifica-Resoconto. Nessuna eccezione.
- "Lo farò" non equivale all'esecuzione. Fallo, quindi comunica il risultato.
- "Fatto" senza verifica non è accettabile. Fornisci una prova.
- Se l'esecuzione non riesce: riprova una volta con un approccio modificato.
- Se non riesce ancora: segnala l'errore con una diagnosi. Non fallire mai senza comunicarlo.
- Non riprovare mai all'infinito: massimo 3 tentativi, quindi avvia un'escalation.
```

Questo schema previene la modalità di errore più comune degli agenti: confermare un'attività senza completarla.

## Architettura multiprogramma

Per gli agenti che gestiscono più ambiti, organizza gli ordini permanenti come programmi separati con limiti chiari:

```markdown
## Programma 1: [Ambito A] (Settimanale)

...

## Programma 2: [Ambito B] (Mensile + Su richiesta)

...

## Programma 3: [Ambito C] (Secondo necessità)

...

## Regole di escalation (Tutti i programmi)

- [Criteri di escalation comuni]
- [Punti di approvazione applicabili a tutti i programmi]
```

Ogni programma deve avere:

- Una propria **cadenza di attivazione** (settimanale, mensile, basata su eventi, continua)
- Propri **punti di approvazione** (alcuni programmi richiedono una supervisione maggiore rispetto ad altri)
- **Limiti** chiari (l'agente deve sapere dove termina un programma e ne inizia un altro)

## Procedure consigliate

### Da fare

- Iniziare con un'autorità limitata ed estenderla man mano che aumenta la fiducia
- Definire punti di approvazione espliciti per le azioni ad alto rischio
- Includere sezioni "Cosa NON fare": i limiti sono importanti quanto le autorizzazioni
- Combinare gli ordini con processi Cron per un'esecuzione affidabile basata sul tempo
- Esaminare settimanalmente i registri dell'agente per verificare che gli ordini permanenti vengano rispettati
- Aggiornare gli ordini permanenti in base all'evoluzione delle esigenze: sono documenti dinamici

### Da evitare

- Concedere un'autorità ampia fin dal primo giorno ("fai ciò che ritieni migliore")
- Omettere le regole di escalation: ogni programma necessita di una clausola che definisca "quando fermarsi e chiedere"
- Presumere che l'agente ricordi le istruzioni verbali: inserire tutto nel file
- Mescolare ambiti in un singolo programma: utilizzare programmi separati per ambiti separati
- Dimenticare di applicarli tramite processi Cron: gli ordini permanenti senza trigger diventano suggerimenti

## Argomenti correlati

- [Automazione](/it/automation): panoramica di tutti i meccanismi di automazione.
- [Processi Cron](/it/automation/cron-jobs): applicazione della pianificazione per gli ordini permanenti.
- [Hook](/it/automation/hooks): script basati su eventi per gli eventi del ciclo di vita dell'agente.
- [Webhook](/it/automation/cron-jobs#webhooks): trigger di eventi HTTP in entrata.
- [Workspace dell'agente](/it/concepts/agent-workspace): dove risiedono gli ordini permanenti, incluso l'elenco completo dei file di bootstrap inseriti automaticamente (`AGENTS.md`, `SOUL.md`, ecc.).
