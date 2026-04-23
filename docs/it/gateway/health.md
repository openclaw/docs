---
read_when:
    - Diagnosticare la connettività del canale o lo stato di salute del gateway
    - Capire i comandi CLI di health check e le opzioni
summary: Comandi di health check e monitoraggio dello stato di salute del gateway
title: Health check
x-i18n:
    generated_at: "2026-04-23T08:28:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Health check (CLI)

Guida rapida per verificare la connettività del canale senza andare a tentativi.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni + attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, con colori, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al gateway in esecuzione una probe di health live (`health` con `probe:true`), inclusi probe di canale per account quando supportati.
- `openclaw health` — chiede al gateway in esecuzione la sua istantanea di health (solo WS; nessun socket diretto del canale dalla CLI).
- `openclaw health --verbose` — forza una probe di health live e stampa i dettagli della connessione gateway.
- `openclaw health --json` — output dell'istantanea di health leggibile da macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: fai tail di `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (l'mtime dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto in configurazione). Conteggio e destinatari recenti sono mostrati tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409–515 o `loggedOut`. (Nota: il flusso di login QR si riavvia automaticamente una volta per lo stato 515 dopo il pairing.)
- La diagnostica è abilitata per impostazione predefinita. Il gateway registra fatti operativi a meno che non sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano conteggi byte RSS/heap, pressione di soglia e pressione di crescita. Gli eventi di payload sovradimensionato registrano ciò che è stato rifiutato, troncato o suddiviso in chunk, più dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, il contenuto degli allegati, il body del webhook, il body raw di richieste o risposte, token, cookie o valori segreti. Lo stesso Heartbeat avvia il registratore di stabilità limitato, disponibile tramite `openclaw gateway stability` o la RPC Gateway `diagnostics.stability`. Uscite fatali del Gateway, timeout di arresto e fallimenti di avvio al riavvio mantengono l'ultima istantanea del registratore in `~/.openclaw/logs/stability/` quando esistono eventi; ispeziona il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per i bug report, esegui `openclaw gateway diagnostics export` e allega lo zip generato. L'export combina un riepilogo Markdown, il bundle di stabilità più recente, metadati di log sanificati, istantanee sanificate di stato/health del Gateway e la forma della configurazione. È pensato per essere condiviso: testo chat, body webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi e valori segreti vengono omessi o redatti.

## Configurazione del monitoraggio health

- `gateway.channelHealthCheckMinutes`: frequenza con cui il gateway controlla la salute del canale. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor health.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor health lo tratti come stale e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor health per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor health per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che ha la precedenza rispetto all'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor di canale integrati che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa fallisce

- `logged out` o stato 409–515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway irraggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` chiede al gateway in esecuzione la sua istantanea di health (nessun socket diretto del canale
dalla CLI). Per impostazione predefinita può restituire un'istantanea gateway in cache aggiornata di recente; il
gateway aggiorna poi quella cache in background. `openclaw health --verbose` forza
invece una probe live. Il comando riporta l'età di credenziali/autenticazione collegate quando disponibile,
i riepiloghi delle probe per canale, il riepilogo dell'archivio sessioni e una durata della probe. Esce
con valore non zero se il gateway è irraggiungibile o se la probe fallisce/scade.

Opzioni:

- `--json`: output JSON leggibile da macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito della probe di 10s
- `--verbose`: forza una probe live e stampa i dettagli della connessione gateway
- `--debug`: alias di `--verbose`

L'istantanea di health include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo della probe), stato per canale, disponibilità dell'agente e riepilogo dell'archivio sessioni.
