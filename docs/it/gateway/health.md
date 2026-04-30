---
read_when:
    - Diagnosi della connettività dei canali o dello stato del Gateway
    - Comprendere i comandi e le opzioni CLI per i controlli di integrità
summary: Comandi di verifica e monitoraggio dello stato del Gateway
title: Controlli di integrità
x-i18n:
    generated_at: "2026-04-30T08:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Guida breve per verificare la connettività dei canali senza tirare a indovinare.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del Gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni + attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, a colori, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al Gateway in esecuzione un probe di salute live (`health` con `probe:true`), inclusi i probe dei canali per account quando supportati.
- `openclaw health` — chiede al Gateway in esecuzione il suo snapshot di salute (solo WS; nessun socket di canale diretto dalla CLI).
- `openclaw health --verbose` — forza un probe di salute live e stampa i dettagli di connessione del Gateway.
- `openclaw health --json` — output dello snapshot di salute leggibile da macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: segui `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime dovrebbe essere recente).
- Archivio delle sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella configurazione). Il conteggio e i destinatari recenti sono esposti tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409–515 o `loggedOut`. (Nota: il flusso di accesso con QR si riavvia automaticamente una volta per lo stato 515 dopo l'abbinamento.)
- La diagnostica è abilitata per impostazione predefinita. Il Gateway registra fatti operativi a meno che non sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano i conteggi di byte RSS/heap, la pressione di soglia e la pressione di crescita. Gli avvisi di liveness registrano ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e conteggi delle sessioni attive/in attesa/in coda quando il processo è in esecuzione ma saturo. Gli eventi di payload sovradimensionato registrano cosa è stato rifiutato, troncato o suddiviso in blocchi, oltre a dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, i contenuti degli allegati, il corpo del Webhook, il corpo grezzo della richiesta o della risposta, token, cookie o valori segreti. Lo stesso Heartbeat avvia il registratore di stabilità con limiti, disponibile tramite `openclaw gateway stability` o l'RPC Gateway `diagnostics.stability`. Uscite fatali del Gateway, timeout di spegnimento ed errori di avvio dopo riavvio persistono lo snapshot più recente del registratore sotto `~/.openclaw/logs/stability/` quando esistono eventi; ispeziona il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per le segnalazioni di bug, esegui `openclaw gateway diagnostics export` e allega lo zip generato. L'esportazione combina un riepilogo Markdown, il bundle di stabilità più recente, metadati dei log sanificati, snapshot sanificati di stato/salute del Gateway e la forma della configurazione. È pensata per essere condivisa: testo della chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi e valori segreti sono omessi o oscurati. Vedi [Esportazione diagnostica](/it/gateway/diagnostics).

## Configurazione del monitor di salute

- `gateway.channelHealthCheckMinutes`: con quale frequenza il Gateway controlla la salute dei canali. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor di salute lo consideri obsoleto e lo riavvii. Predefinito: `30`. Mantienilo maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor di salute per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor di salute per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che prevale sull'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor dei canali integrati che li espongono oggi: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa non funziona

- `logged out` o stato 409–515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway irraggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando "health" dedicato

`openclaw health` chiede al Gateway in esecuzione il suo snapshot di salute (nessun
socket di canale diretto dalla CLI). Per impostazione predefinita può restituire uno snapshot
Gateway memorizzato nella cache e ancora fresco; il Gateway poi aggiorna quella cache in
background. `openclaw health --verbose` forza invece un probe live. Il comando riporta
credenziali collegate/età dell'autenticazione quando disponibili, riepiloghi dei probe per canale,
riepilogo dell'archivio delle sessioni e durata del probe. Esce con codice
diverso da zero se il Gateway è irraggiungibile o se il probe fallisce/va in timeout.

Opzioni:

- `--json`: output JSON leggibile da macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito del probe di 10 s
- `--verbose`: forza un probe live e stampa i dettagli di connessione del Gateway
- `--debug`: alias di `--verbose`

Lo snapshot di salute include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo del probe), stato per canale, disponibilità dell'agente e riepilogo dell'archivio delle sessioni.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
