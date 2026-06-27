---
read_when:
    - Vuoi una diagnosi rapida dello stato del canale + i destinatari recenti della sessione
    - Vuoi uno stato "all" incollabile per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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
- Il semplice `openclaw status` resta sul percorso rapido in sola lettura e contrassegna la memoria come `not checked` invece che non disponibile quando salta l'ispezione della memoria. Audit di sicurezza approfondito, compatibilità dei Plugin e sonde memory-vector sono lasciati a `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` riporta i dettagli della memoria dal runtime del plugin di memoria attivo selezionato da `plugins.slots.memory`. I plugin di memoria personalizzati possono lasciare disabilitato il valore integrato `agents.defaults.memorySearch.enabled` e riportare comunque lo stato dei propri file, chunk, vettori e FTS.
- `--usage` stampa le finestre di utilizzo normalizzate del provider come `X% left`.
- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione usa `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per la distinzione tra provider/modello/runtime.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax sono quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio prevalgono quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è scarno, `/status` può ricostruire i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live non zero esistenti prevalgono comunque sui valori di fallback della trascrizione.
- `/status` include uptime compatto del processo Gateway e uptime del sistema host.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, lo stato risolve la finestra di contesto rispetto al modello runtime recuperato invece che a quello selezionato.
- Quando una sessione è fissata a un modello diverso dal primario configurato, lo stato stampa entrambi i valori, il motivo (`session override`) e il suggerimento chiaro (`/model default`). Il primario configurato si applica alle sessioni nuove o non fissate; le sessioni fissate esistenti mantengono la selezione di sessione finché non viene cancellata.
- Per il conteggio della dimensione del prompt, il fallback della trascrizione preferisce il totale più grande orientato al prompt quando i metadati della sessione mancano o sono inferiori, quindi le sessioni con provider personalizzati non collassano in visualizzazioni di token a `0`.
- L'output include gli archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + nodo quando disponibile.
- La panoramica include canale di aggiornamento + SHA git (per checkout sorgente).
- Le informazioni di aggiornamento compaiono nella Panoramica; se è disponibile un aggiornamento, lo stato stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Gli errori di aggiornamento dei prezzi dei modelli sono mostrati come avvisi opzionali sui prezzi. Non
  significano che il Gateway o i canali non siano integri.
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i percorsi di configurazione di destinazione quando possibile.
- Se un SecretRef di canale supportato è configurato ma non disponibile nel percorso del comando corrente, lo stato resta in sola lettura e riporta output degradato invece di arrestarsi in modo anomalo. L'output umano mostra avvisi come "token configurato non disponibile in questo percorso del comando" e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione SecretRef locale al comando riesce, lo stato preferisce lo snapshot risolto e cancella dall'output finale i marcatori di canale transitori "secret unavailable".
- `status --all` include una riga di panoramica dei Segreti e una sezione di diagnosi che riassume la diagnostica dei segreti (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
