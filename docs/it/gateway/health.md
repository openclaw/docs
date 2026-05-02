---
read_when:
    - Diagnosi della connettività del canale o dello stato del Gateway
    - Comprendere i comandi e le opzioni CLI per i controlli di integrità
summary: Comandi per il controllo e il monitoraggio dell'integrità del Gateway
title: Controlli di integrità
x-i18n:
    generated_at: "2026-05-02T08:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Breve guida per verificare la connettività dei canali senza tirare a indovinare.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del Gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni + attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, colore, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al Gateway in esecuzione una sonda di integrità live (`health` con `probe:true`), incluse le sonde dei canali per account quando supportate.
- `openclaw health` — chiede al Gateway in esecuzione il suo snapshot di integrità (solo WS; nessun socket diretto dei canali dalla CLI).
- `openclaw health --verbose` — forza una sonda di integrità live e stampa i dettagli della connessione al Gateway.
- `openclaw health --json` — output dello snapshot di integrità leggibile dalla macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: segui `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Per Discord e altri provider di chat, le righe di sessione non indicano la vitalità del socket.
`openclaw sessions`, Gateway `sessions.list` e lo strumento `sessions_list` dell'agente
leggono lo stato delle conversazioni salvato. Un provider può riconnettersi e mostrare uno stato del canale
integro prima che venga materializzata una nuova riga di sessione. Usa i comandi di stato dei canali e
di integrità indicati sopra per controlli di connettività live.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella configurazione). Il conteggio e i destinatari recenti sono mostrati tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409-515 o `loggedOut`. (Nota: il flusso di accesso QR si riavvia automaticamente una volta per lo stato 515 dopo l'associazione.)
- La diagnostica è abilitata per impostazione predefinita. Il Gateway registra fatti operativi salvo che sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano conteggi in byte RSS/heap, pressione di soglia e pressione di crescita. Gli avvisi di vitalità registrano ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e conteggi delle sessioni attive/in attesa/in coda quando il processo è in esecuzione ma saturo. Gli eventi di payload sovradimensionato registrano ciò che è stato rifiutato, troncato o suddiviso in blocchi, più dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, i contenuti degli allegati, il corpo del Webhook, il corpo grezzo della richiesta o della risposta, token, cookie o valori segreti. Lo stesso Heartbeat avvia il registratore di stabilità delimitato, disponibile tramite `openclaw gateway stability` o la RPC Gateway `diagnostics.stability`. Uscite fatali del Gateway, timeout di arresto e fallimenti di avvio al riavvio persistono l'ultimo snapshot del registratore sotto `~/.openclaw/logs/stability/` quando esistono eventi; ispeziona il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per segnalazioni di bug, esegui `openclaw gateway diagnostics export` e allega lo zip generato. L'esportazione combina un riepilogo Markdown, il bundle di stabilità più recente, metadati di log sanificati, snapshot sanificati di stato/integrità del Gateway e forma della configurazione. È pensata per essere condivisa: testo delle chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggio e valori segreti sono omessi o oscurati. Vedi [Esportazione diagnostica](/it/gateway/diagnostics).

## Configurazione del monitor di integrità

- `gateway.channelHealthCheckMinutes`: frequenza con cui il Gateway controlla l'integrità dei canali. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor di integrità.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor di integrità lo consideri obsoleto e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor di integrità per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor di integrità per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che prevale sull'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor dei canali integrati che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa fallisce

- `logged out` o stato 409-515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway irraggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` chiede al Gateway in esecuzione il suo snapshot di integrità (nessun socket diretto
dei canali dalla CLI). Per impostazione predefinita può restituire uno snapshot Gateway fresco in cache; il
Gateway poi aggiorna quella cache in background. `openclaw health --verbose` forza
invece una sonda live. Il comando riporta credenziali collegate/età dell'autenticazione quando disponibili,
riepiloghi delle sonde per canale, riepilogo dell'archivio sessioni e durata della sonda. Termina
con codice diverso da zero se il Gateway è irraggiungibile o se la sonda fallisce/va in timeout.

Opzioni:

- `--json`: output JSON leggibile dalla macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito di 10s della sonda
- `--verbose`: forza una sonda live e stampa i dettagli della connessione al Gateway
- `--debug`: alias di `--verbose`

Lo snapshot di integrità include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo della sonda), stato per canale, disponibilità dell'agente e riepilogo dell'archivio sessioni.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
