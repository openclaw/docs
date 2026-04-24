---
read_when:
    - Vuoi una diagnosi rapida dello stato dei canali + dei destinatari recenti della sessione
    - Vuoi uno stato “all” copiabile per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: Stato
x-i18n:
    generated_at: "2026-04-24T08:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
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
- `--usage` stampa finestre di utilizzo normalizzate come `X% left`.
- L'output dello stato della sessione ora separa `Runtime:` da `Runner:`. `Runtime` è il percorso di esecuzione e lo stato sandbox (`direct`, `docker/*`), mentre `Runner` indica se la sessione usa Pi embedded, un provider supportato da CLI o un backend harness ACP come `codex (acp/acpx)`.
- I campi raw `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati su conteggio hanno la priorità quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l'etichetta della finestra dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è scarno, `/status` può riempire token e contatori cache dal log di utilizzo più recente della trascrizione. I valori live esistenti e non zero mantengono comunque la priorità sui valori di fallback della trascrizione.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce live della sessione. Se quel modello della trascrizione differisce dal modello selezionato, lo stato risolve la finestra di contesto rispetto al modello runtime recuperato invece che rispetto al modello selezionato.
- Per la contabilizzazione della dimensione del prompt, il fallback della trascrizione preferisce il totale orientato al prompt più grande quando i metadati della sessione mancano o sono inferiori, così le sessioni con provider personalizzato non collassano a visualizzazioni di token `0`.
- L'output include archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host Gateway + Node quando disponibile.
- La panoramica include canale di aggiornamento + SHA git (per checkout sorgente).
- Le informazioni di aggiornamento compaiono nella panoramica; se è disponibile un aggiornamento, lo stato stampa un suggerimento per eseguire `openclaw update` (consulta [Aggiornamento](/it/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i loro percorsi di configurazione mirati quando possibile.
- Se un SecretRef di un canale supportato è configurato ma non disponibile nel percorso del comando corrente, lo stato resta in sola lettura e segnala un output degradato invece di andare in crash. L'output leggibile mostra avvisi come “configured token unavailable in this command path”, e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione locale al comando di SecretRef riesce, lo stato preferisce lo snapshot risolto e rimuove i marcatori transitori del canale “secret unavailable” dall'output finale.
- `status --all` include una riga panoramica Secrets e una sezione di diagnosi che riepiloga la diagnostica dei segreti (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
