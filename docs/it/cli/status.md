---
read_when:
    - Vuoi una diagnosi rapida dello stato dei canali + dei destinatari delle sessioni recenti
    - Vuoi uno stato “all” copiabile per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, istantanee di utilizzo)
title: status
x-i18n:
    generated_at: "2026-04-05T13:48:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
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

- `--deep` esegue probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` stampa finestre di utilizzo normalizzate del provider come `X% left`.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, ricavano l'etichetta della finestra temporale dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando l'istantanea della sessione corrente è scarsa, `/status` può riempire i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live esistenti diversi da zero continuano comunque ad avere la precedenza rispetto ai valori di fallback della trascrizione.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello di runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, status risolve la finestra di contesto rispetto al modello di runtime recuperato invece che a quello selezionato.
- Per il conteggio della dimensione del prompt, il fallback della trascrizione preferisce il totale orientato al prompt più grande quando i metadati della sessione mancano o sono inferiori, in modo che le sessioni con provider personalizzati non vengano ridotte a visualizzazioni di `0` token.
- L'output include archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + nodo quando disponibile.
- La panoramica include il canale di aggiornamento + il git SHA (per i checkout dal sorgente).
- Le informazioni sugli aggiornamenti vengono mostrate nella Panoramica; se è disponibile un aggiornamento, status stampa un suggerimento per eseguire `openclaw update` (vedi [Updating](/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i percorsi di configurazione mirati quando possibile.
- Se è configurato un SecretRef di canale supportato ma non è disponibile nel percorso del comando corrente, status resta in sola lettura e segnala un output degradato invece di bloccarsi. L'output per gli esseri umani mostra avvisi come “token configurato non disponibile in questo percorso del comando”, e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione locale del SecretRef del comando ha successo, status preferisce l'istantanea risolta e rimuove i marker temporanei di canale “secret unavailable” dall'output finale.
- `status --all` include una riga di panoramica dei Secrets e una sezione di diagnosi che riepiloga la diagnostica dei secret (troncata per leggibilità) senza interrompere la generazione del report.
