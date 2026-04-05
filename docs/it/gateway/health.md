---
read_when:
    - Diagnosi della connettività dei canali o dello stato del gateway
    - Comprensione dei comandi CLI e delle opzioni per il controllo dello stato
summary: Comandi di controllo dello stato e monitoraggio dello stato del gateway
title: Controlli dello stato
x-i18n:
    generated_at: "2026-04-05T13:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Controlli dello stato (CLI)

Guida rapida per verificare la connettività dei canali senza andare a tentativi.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni + attività recente.
- `openclaw status --all` — diagnostica locale completa (sola lettura, colori, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al gateway in esecuzione un probe di salute live (`health` con `probe:true`), inclusi probe per account sui canali quando supportati.
- `openclaw health` — chiede al gateway in esecuzione la sua istantanea di stato (solo WS; nessun socket di canale diretto dalla CLI).
- `openclaw health --verbose` — forza un probe di salute live e stampa i dettagli di connessione del gateway.
- `openclaw health --json` — output dell'istantanea di stato leggibile da macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: esegui il tail di `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella config). Conteggio e destinatari recenti sono mostrati tramite `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409–515 o `loggedOut`. (Nota: il flusso di login tramite QR si riavvia automaticamente una volta per lo stato 515 dopo il pairing.)

## Configurazione del monitor dello stato

- `gateway.channelHealthCheckMinutes`: frequenza con cui il gateway controlla lo stato dei canali. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor dello stato.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor dello stato lo consideri obsoleto e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor dello stato per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor dello stato per un canale specifico lasciando attivo il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che prevale sull'impostazione a livello di canale.
- Questi override per canale si applicano ai monitor di canale integrati che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa non funziona

- `logged out` o stato 409–515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway non raggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in ingresso → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist + regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` chiede al gateway in esecuzione la sua istantanea di stato (nessun socket di canale diretto dalla CLI). Per impostazione predefinita può restituire un'istantanea recente del gateway dalla cache; il gateway aggiorna quindi quella cache in background. `openclaw health --verbose` forza invece un probe live. Il comando riporta età di credenziali/autenticazione collegate quando disponibili, riepiloghi dei probe per canale, riepilogo dell'archivio sessioni e durata del probe. Restituisce un codice diverso da zero se il gateway non è raggiungibile o se il probe fallisce/va in timeout.

Opzioni:

- `--json`: output JSON leggibile da macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito del probe di 10 s
- `--verbose`: forza un probe live e stampa i dettagli di connessione del gateway
- `--debug`: alias di `--verbose`

L'istantanea di stato include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo del probe), stato per canale, disponibilità degli agenti e riepilogo dell'archivio sessioni.
