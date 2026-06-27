---
read_when:
    - Diagnosi della connettività dei canali o dello stato del Gateway
    - Comprendere i comandi e le opzioni CLI di controllo dello stato
summary: Comandi di controllo integrità e monitoraggio dell'integrità del gateway
title: Controlli di integrità
x-i18n:
    generated_at: "2026-06-27T17:31:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Breve guida per verificare la connettività dei canali senza supposizioni.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del Gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni + attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, colore, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al Gateway in esecuzione una sonda di integrità live (`health` con `probe:true`), incluse le sonde dei canali per account quando supportate.
- `openclaw health` — chiede al Gateway in esecuzione la sua istantanea di integrità (solo WS; nessun socket di canale diretto dalla CLI).
- `openclaw health --verbose` — forza una sonda di integrità live e stampa i dettagli della connessione al Gateway.
- `openclaw health --json` — output dell'istantanea di integrità leggibile dalla macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: segui `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Per Discord e altri provider di chat, le righe di sessione non indicano la vitalità del socket.
`openclaw sessions`, `sessions.list` del Gateway e lo strumento `sessions_list` dell'agente
leggono lo stato delle conversazioni salvato. Un provider può riconnettersi e mostrare uno stato
del canale integro prima che venga materializzata una nuova riga di sessione. Usa i comandi di stato
del canale e di integrità sopra per i controlli di connettività live.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella configurazione). Conteggio e destinatari recenti sono mostrati tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409-515 o `loggedOut`. (Nota: il flusso di accesso con QR si riavvia automaticamente una volta per lo stato 515 dopo l'abbinamento.)
- La diagnostica è abilitata per impostazione predefinita. Il Gateway registra fatti operativi a meno che non sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano conteggi in byte di RSS/heap, pressione di soglia e pressione di crescita. La pressione critica della memoria viene registrata tramite il logger del Gateway. Quando è impostato `diagnostics.memoryPressureSnapshot: true`, la pressione critica della memoria scrive anche un bundle di stabilità pre-OOM con statistiche dell'heap V8, contatori cgroup Linux quando disponibili, conteggi delle risorse attive e i file di sessione/trascrizione più grandi per percorso relativo redatto. Gli avvisi di vitalità registrano ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e conteggi delle sessioni attive/in attesa/in coda quando il processo è in esecuzione ma saturo. Gli eventi di payload sovradimensionati registrano cosa è stato rifiutato, troncato o suddiviso in blocchi, più dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, i contenuti degli allegati, il corpo del Webhook, il corpo grezzo della richiesta o della risposta, token, cookie o valori segreti. Lo stesso Heartbeat avvia il registratore di stabilità delimitato, disponibile tramite `openclaw gateway stability` o l'RPC `diagnostics.stability` del Gateway. Uscite fatali del Gateway, timeout di arresto e fallimenti di avvio al riavvio persistono l'ultima istantanea del registratore in `~/.openclaw/logs/stability/` quando esistono eventi; la pressione critica della memoria lo fa anche solo quando è impostato `diagnostics.memoryPressureSnapshot: true`. Ispeziona il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per le segnalazioni di bug, esegui `openclaw gateway diagnostics export` e allega lo zip generato. L'esportazione combina un riepilogo Markdown, il bundle di stabilità più recente, metadati dei log sanificati, istantanee sanificate di stato/integrità del Gateway e forma della configurazione. È pensata per essere condivisa: testo della chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggio e valori segreti sono omessi o redatti. Vedi [Esportazione diagnostica](/it/gateway/diagnostics).

## Configurazione del monitoraggio dell'integrità

- `gateway.channelHealthCheckMinutes`: frequenza con cui il Gateway controlla l'integrità del canale. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitoraggio dell'integrità.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitoraggio dell'integrità lo consideri obsoleto e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitoraggio dell'integrità per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitoraggio dell'integrità per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che prevale sull'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor dei canali integrati che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Monitoraggio dell'uptime

I servizi esterni di monitoraggio dell'uptime dovrebbero usare l'endpoint dedicato `/health`, non `/v1/chat/completions`.

- **USA:** `GET /health` — risposta istantanea, nessuna sessione creata, nessuna chiamata LLM, restituisce `{"ok":true,"status":"live"}`
- **NON usare:** `/v1/chat/completions` per i controlli di integrità — ogni richiesta crea una sessione completa dell'agente con istantanea delle Skills, assemblaggio del contesto e chiamate LLM

Quando non viene fornita alcuna intestazione `x-openclaw-session-key` o campo `user`, `/v1/chat/completions` genera una nuova sessione casuale per ogni richiesta. I servizi di monitoraggio che effettuano ping ogni 15 minuti creano circa 96 sessioni/giorno, ciascuna consumando 4-22 KB. Nel tempo questo causa un rigonfiamento dell'archivio sessioni e può portare al superamento della finestra di contesto.

### Esempi di configurazione dei servizi di monitoraggio

- **BetterStack:** imposta l'URL del controllo di integrità su `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** aggiungi un nuovo monitor HTTP con URL `https://<your-gateway-host>:<port>/health`
- **Generico:** qualsiasi GET HTTP a `/health` restituisce 200 con `{"ok":true}` quando il Gateway è integro

## Quando qualcosa non funziona

- `logged out` o stato 409-515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway non raggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando "health" dedicato

`openclaw health` chiede al Gateway in esecuzione la sua istantanea di integrità (nessun socket
di canale diretto dalla CLI). Per impostazione predefinita può restituire una nuova istantanea del
Gateway dalla cache; il Gateway aggiorna poi quella cache in background. `openclaw health --verbose` forza
invece una sonda live. Il comando riporta credenziali collegate/età dell'autenticazione quando disponibili,
riepiloghi delle sonde per canale, riepilogo dell'archivio sessioni e durata della sonda. Esce
con valore diverso da zero se il Gateway non è raggiungibile o se la sonda fallisce/va in timeout.

Opzioni:

- `--json`: output JSON leggibile dalla macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito della sonda di 10 s
- `--verbose`: forza una sonda live e stampa i dettagli della connessione al Gateway
- `--debug`: alias di `--verbose`

L'istantanea di integrità include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo della sonda), stato per canale, disponibilità dell'agente e riepilogo dell'archivio sessioni.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
