---
read_when:
    - Vuoi una diagnosi rapida dello stato dei canali + dei destinatari delle sessioni recenti
    - Vuoi uno stato “all” da incollare per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: Stato
x-i18n:
    generated_at: "2026-04-30T08:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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
- Il semplice `openclaw status` resta sul percorso rapido di sola lettura e contrassegna la memoria come `not checked` invece che non disponibile quando salta l’ispezione della memoria. Audit di sicurezza pesante, compatibilità dei plugin e sonde sui vettori di memoria sono lasciati a `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` riporta i dettagli della memoria dal runtime del Plugin di memoria attivo selezionato da `plugins.slots.memory`. I Plugin di memoria personalizzati possono lasciare disabilitato `agents.defaults.memorySearch.enabled` integrato e continuare a riportare i propri stati di file, chunk, vettori e FTS.
- `--usage` stampa le finestre di utilizzo normalizzate del provider come `X% left`.
- L’output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso della sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione sta usando `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra provider, modello e runtime.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sui conteggi prevalgono quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l’etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell’etichetta del piano.
- Quando lo snapshot della sessione corrente è sparso, `/status` può reintegrare i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero prevalgono comunque sui valori di fallback della trascrizione.
- Il fallback della trascrizione può anche recuperare l’etichetta del modello runtime attivo quando manca dalla voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, status risolve la finestra di contesto rispetto al modello runtime recuperato invece che a quello selezionato.
- Per la contabilizzazione della dimensione del prompt, il fallback della trascrizione preferisce il totale più grande orientato al prompt quando i metadati della sessione sono mancanti o inferiori, così le sessioni con provider personalizzati non collassano in visualizzazioni di `0` token.
- L’output include gli store delle sessioni per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + nodo quando disponibile.
- La panoramica include il canale di aggiornamento + SHA git (per i checkout dei sorgenti).
- Le informazioni sugli aggiornamenti compaiono nella panoramica; se è disponibile un aggiornamento, status stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Le superfici di stato di sola lettura (`status`, `status --json`, `status --all`) risolvono le SecretRef supportate per i rispettivi percorsi di configurazione mirati quando possibile.
- Se una SecretRef di canale supportata è configurata ma non disponibile nel percorso del comando corrente, status resta di sola lettura e riporta un output degradato invece di arrestarsi in modo anomalo. L’output leggibile mostra avvisi come “token configurato non disponibile in questo percorso di comando”, e l’output JSON include `secretDiagnostics`.
- Quando la risoluzione SecretRef locale al comando riesce, status preferisce lo snapshot risolto e cancella dall’output finale i marcatori transitori di canale “secret unavailable”.
- `status --all` include una riga di panoramica dei segreti e una sezione di diagnosi che riassume la diagnostica dei segreti (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
