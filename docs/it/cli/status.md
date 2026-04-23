---
read_when:
    - Vuoi una diagnosi rapida dello stato del canale + i destinatari recenti della sessione
    - Vuoi uno stato “all” copiabile per il debug
summary: Riferimento della CLI per `openclaw status` (diagnostica, probe, istantanee di utilizzo)
title: stato
x-i18n:
    generated_at: "2026-04-23T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
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
- `--usage` stampa finestre di utilizzo del provider normalizzate come `X% left`.
- L'output dello stato della sessione ora separa `Runtime:` da `Runner:`. `Runtime` è il percorso di esecuzione e lo stato della sandbox (`direct`, `docker/*`), mentre `Runner` indica se la sessione sta usando Pi incorporato, un provider supportato da CLI o un backend harness ACP come `codex (acp/acpx)`.
- I campi grezzi `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando presenti. Le risposte `model_remains` privilegiano la voce del modello di chat, ricavano l'etichetta della finestra temporale dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando l'istantanea della sessione corrente è scarsa di dati, `/status` può completare i contatori di token e cache dal log di utilizzo della trascrizione più recente. I valori live esistenti e non nulli continuano ad avere la precedenza sui valori di fallback della trascrizione.
- Il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce della sessione live. Se quel modello della trascrizione differisce dal modello selezionato, status risolve la finestra di contesto rispetto al modello runtime recuperato invece che a quello selezionato.
- Per il conteggio della dimensione del prompt, il fallback della trascrizione privilegia il totale orientato al prompt più grande quando i metadati della sessione mancano o sono inferiori, così le sessioni con provider personalizzati non vengono ridotte a visualizzazioni di `0` token.
- L'output include archivi di sessione per agente quando sono configurati più agenti.
- La panoramica include lo stato di installazione/runtime del servizio host di Gateway + node quando disponibile.
- La panoramica include il canale di aggiornamento + SHA git (per i checkout dal sorgente).
- Le informazioni sugli aggiornamenti compaiono nella panoramica; se è disponibile un aggiornamento, status stampa un suggerimento per eseguire `openclaw update` (vedi [Aggiornamento](/it/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i percorsi di configurazione di destinazione quando possibile.
- Se un SecretRef di un canale supportato è configurato ma non disponibile nel percorso del comando corrente, status rimane in sola lettura e segnala un output degradato invece di arrestarsi in modo anomalo. L'output leggibile mostra avvisi come “token configurato non disponibile in questo percorso del comando”, e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione locale al comando di SecretRef riesce, status privilegia l'istantanea risolta e rimuove dall'output finale i marker transitori del canale “secret unavailable”.
- `status --all` include una riga di panoramica Secrets e una sezione di diagnosi che riassume la diagnostica dei secret (troncata per leggibilità) senza interrompere la generazione del report.
