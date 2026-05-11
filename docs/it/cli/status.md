---
read_when:
    - Vuoi una diagnosi rapida dello stato dei canali + i destinatari delle sessioni recenti
    - Vuoi uno stato "all" incollabile per la diagnostica
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:26:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

Diagnostica per canali + sessioni.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Note:

- `--deep` esegue sonde live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Il semplice `openclaw status` resta nel percorso veloce di sola lettura e contrassegna la memoria come `not checked` invece che non disponibile quando salta l'ispezione della memoria. L'audit di sicurezza pesante, la compatibilità dei plugin e le sonde dei vettori di memoria sono lasciati a `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` segnala i dettagli della memoria dal runtime del Plugin di memoria attivo selezionato da `plugins.slots.memory`. I plugin di memoria personalizzati possono lasciare disabilitato `agents.defaults.memorySearch.enabled` integrato e segnalare comunque lo stato dei propri file, chunk, vettore e FTS.
- `--usage` stampa le finestre di utilizzo normalizzate del provider come `X% left`.
- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso della sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra provider, modello e runtime.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio prevalgono quando presenti. Le risposte model_remains preferiscono la voce del modello chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è scarno, `/status` può ricostruire i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live non nulli esistenti prevalgono comunque sui valori di fallback della trascrizione.
- `/status` include l'uptime compatto del processo Gateway e l'uptime del sistema host.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, lo stato risolve la finestra di contesto rispetto al modello runtime recuperato invece che a quello selezionato.
- Per il calcolo della dimensione del prompt, il fallback della trascrizione preferisce il totale orientato al prompt più grande quando i metadati della sessione mancano o sono inferiori, così le sessioni di provider personalizzati non collassano in visualizzazioni da `0` token.
- L'output include gli store di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + nodo quando disponibile.
- La panoramica include canale di aggiornamento + SHA git (per checkout da sorgente).
- Le informazioni di aggiornamento compaiono nella Panoramica; se è disponibile un aggiornamento, lo stato stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Gli errori di aggiornamento dei prezzi dei modelli sono mostrati come avvisi opzionali sui prezzi. Non
  indicano che il Gateway o i canali non siano sani.
- Le superfici di stato di sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i percorsi di configurazione di destinazione quando possibile.
- Se un SecretRef di canale supportato è configurato ma non disponibile nel percorso del comando corrente, lo stato resta di sola lettura e segnala un output degradato invece di arrestarsi in modo anomalo. L'output umano mostra avvisi come "token configurato non disponibile in questo percorso di comando" e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione SecretRef locale al comando riesce, lo stato preferisce lo snapshot risolto e rimuove dall'output finale i marcatori di canale transitori "secret unavailable".
- `status --all` include una riga di panoramica sui segreti e una sezione di diagnosi che riassume la diagnostica dei segreti (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
