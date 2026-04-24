---
read_when:
    - Diagnosi della connettività del canale o dell'integrità del gateway
    - Capire i comandi CLI e le opzioni dei controlli di integrità
summary: Comandi di controllo di integrità e monitoraggio dell'integrità del gateway
title: Controlli di integrità
x-i18n:
    generated_at: "2026-04-24T08:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Controlli di integrità (CLI)

Guida rapida per verificare la connettività del canale senza andare a tentativi.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del gateway, suggerimento di aggiornamento, età dell'autenticazione dei canali collegati, sessioni + attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, a colori, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al gateway in esecuzione una probe live di integrità (`health` con `probe:true`), inclusi controlli per account dei canali quando supportati.
- `openclaw health` — chiede al gateway in esecuzione il suo snapshot di integrità (solo WS; nessun socket diretto ai canali dalla CLI).
- `openclaw health --verbose` — forza una probe live di integrità e stampa i dettagli di connessione del gateway.
- `openclaw health --json` — output dello snapshot di integrità in formato leggibile dalla macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: segui `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (l'mtime dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella configurazione). Conteggio e destinatari recenti vengono esposti tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409–515 o `loggedOut`. (Nota: il flusso di accesso QR si riavvia automaticamente una volta per lo stato 515 dopo il pairing.)
- La diagnostica è abilitata per impostazione predefinita. Il gateway registra fatti operativi a meno che non sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano conteggi di byte RSS/heap, pressione di soglia e pressione di crescita. Gli eventi di payload sovradimensionato registrano cosa è stato rifiutato, troncato o suddiviso in blocchi, oltre a dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, il contenuto degli allegati, il corpo del Webhook, il corpo raw della richiesta o della risposta, token, cookie o valori segreti. Lo stesso Heartbeat avvia il recorder di stabilità limitato, disponibile tramite `openclaw gateway stability` o la Gateway RPC `diagnostics.stability`. Le uscite fatali del Gateway, i timeout di arresto e i fallimenti di avvio dopo il riavvio mantengono l'ultimo snapshot del recorder in `~/.openclaw/logs/stability/` quando esistono eventi; ispeziona il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per segnalazioni di bug, esegui `openclaw gateway diagnostics export` e allega il file zip generato. L'esportazione combina un riepilogo Markdown, il bundle di stabilità più recente, metadati dei log sanificati, snapshot sanificati di stato/integrità del Gateway e la forma della configurazione. È pensata per essere condivisa: testo delle chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi e valori segreti vengono omessi o oscurati. Vedi [Diagnostics Export](/it/gateway/diagnostics).

## Configurazione del monitor di integrità

- `gateway.channelHealthCheckMinutes`: frequenza con cui il gateway controlla l'integrità dei canali. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor di integrità.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor di integrità lo consideri obsoleto e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor di integrità per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor di integrità per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che ha priorità sull'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor integrati dei canali che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa fallisce

- `logged out` o stato 409–515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway non raggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` chiede al gateway in esecuzione il suo snapshot di integrità (nessun socket diretto ai canali dalla CLI). Per impostazione predefinita può restituire uno snapshot del gateway memorizzato in cache ma aggiornato di recente; il gateway aggiorna poi quella cache in background. `openclaw health --verbose` forza invece una probe live. Il comando riporta credenziali collegate/età dell'autenticazione quando disponibili, riepiloghi della probe per canale, riepilogo dell'archivio sessioni e durata della probe. Termina con codice diverso da zero se il gateway non è raggiungibile o se la probe fallisce/scade.

Opzioni:

- `--json`: output JSON leggibile dalla macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito di 10s della probe
- `--verbose`: forza una probe live e stampa i dettagli di connessione del gateway
- `--debug`: alias di `--verbose`

Lo snapshot di integrità include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo della probe), stato per canale, disponibilità dell'agente e riepilogo dell'archivio sessioni.

## Correlati

- [Gateway runbook](/it/gateway)
- [Diagnostics export](/it/gateway/diagnostics)
- [Gateway troubleshooting](/it/gateway/troubleshooting)
