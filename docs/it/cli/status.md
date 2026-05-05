---
read_when:
    - Vuoi una diagnosi rapida dello stato del canale + i destinatari delle sessioni recenti
    - Vuoi uno stato “all” da incollare per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: Stato
x-i18n:
    generated_at: "2026-05-05T06:16:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnostica per canali + sessioni.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Note:

- `--deep` esegue sonde live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Il semplice `openclaw status` resta sul percorso rapido in sola lettura e contrassegna la memoria come `not checked` invece che non disponibile quando salta l'ispezione della memoria. L'audit di sicurezza pesante, la compatibilità dei plugin e le sonde sui vettori di memoria sono lasciati a `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` riporta i dettagli della memoria dal runtime del plugin di memoria attivo selezionato da `plugins.slots.memory`. I plugin di memoria personalizzati possono lasciare disabilitato `agents.defaults.memorySearch.enabled` integrato e riportare comunque il proprio stato di file, chunk, vettore e FTS.
- `--usage` stampa le finestre di utilizzo normalizzate del provider come `X% left`.
- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso della sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione sta usando `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra provider/modello/runtime.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati su conteggio prevalgono quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è sparso, `/status` può ricostruire i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero prevalgono comunque sui valori di fallback della trascrizione.
- `/status` include l'uptime compatto del processo Gateway e l'uptime del sistema host.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, lo stato risolve la finestra di contesto rispetto al modello runtime recuperato invece che rispetto a quello selezionato.
- Per il conteggio della dimensione del prompt, il fallback della trascrizione preferisce il totale più grande orientato al prompt quando i metadati della sessione mancano o sono inferiori, così le sessioni con provider personalizzati non collassano in visualizzazioni di token a `0`.
- L'output include archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + Node quando disponibile.
- La panoramica include canale di aggiornamento + SHA git (per checkout del sorgente).
- Le informazioni di aggiornamento sono mostrate nella Panoramica; se è disponibile un aggiornamento, lo stato stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i rispettivi percorsi di configurazione mirati quando possibile.
- Se un SecretRef di canale supportato è configurato ma non disponibile nel percorso del comando corrente, lo stato resta in sola lettura e riporta un output degradato invece di arrestarsi in modo anomalo. L'output leggibile mostra avvisi come “token configurato non disponibile in questo percorso del comando”, e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione del SecretRef locale al comando riesce, lo stato preferisce lo snapshot risolto e rimuove dall'output finale i marcatori transitori di canale “segreto non disponibile”.
- `status --all` include una riga di panoramica dei segreti e una sezione di diagnosi che riepiloga le diagnostiche dei segreti (troncate per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
