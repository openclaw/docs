---
read_when:
    - Vuoi una diagnosi rapida dello stato dei canali + destinatari delle sessioni recenti
    - Vuoi uno stato "all" pronto da incollare per la diagnostica
summary: Riferimento CLI per `openclaw status` (diagnostica, sonde, istantanee di utilizzo)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T08:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnostica per canali e sessioni.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Note:

- `--deep` esegue sonde live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Il semplice `openclaw status` rimane sul percorso rapido in sola lettura e contrassegna la memoria come `not checked` invece che non disponibile quando salta l'ispezione della memoria. L'audit di sicurezza pesante, la compatibilità dei plugin e le sonde dei vettori di memoria sono lasciati a `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` riporta i dettagli della memoria dal runtime del plugin di memoria attivo selezionato da `plugins.slots.memory`. I plugin di memoria personalizzati possono lasciare disabilitato `agents.defaults.memorySearch.enabled` integrato e riportare comunque i propri file, chunk, vettori e stato FTS.
- `--usage` stampa le finestre di utilizzo normalizzate del provider come `X% left`.
- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso della sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra provider, modello e runtime.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sui conteggi hanno priorità quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è sparso, `/status` può ricostruire i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero hanno comunque priorità sui valori di fallback della trascrizione.
- `/status` include uptime compatto del processo Gateway e uptime del sistema host.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello di runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, lo stato risolve la finestra di contesto rispetto al modello di runtime recuperato invece che a quello selezionato.
- Per la contabilizzazione della dimensione del prompt, il fallback della trascrizione preferisce il totale più grande orientato al prompt quando i metadati della sessione mancano o sono più piccoli, così le sessioni di provider personalizzati non collassano in visualizzazioni di token a `0`.
- L'output include archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime di Gateway + servizio host Node quando disponibile.
- La panoramica include il canale di aggiornamento + SHA git (per checkout sorgente).
- Le informazioni sugli aggiornamenti emergono nella Panoramica; se è disponibile un aggiornamento, lo stato stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono, quando possibile, i SecretRef supportati per i percorsi di configurazione mirati.
- Se un SecretRef di canale supportato è configurato ma non disponibile nel percorso del comando corrente, lo stato rimane in sola lettura e riporta un output degradato invece di arrestarsi in modo anomalo. L'output umano mostra avvisi come "token configurato non disponibile in questo percorso di comando" e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione locale al comando del SecretRef riesce, lo stato preferisce lo snapshot risolto e cancella dall'output finale i marcatori transitori di canale "segreto non disponibile".
- `status --all` include una riga di panoramica dei segreti e una sezione di diagnosi che riepiloga la diagnostica dei segreti (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
