---
read_when:
    - Diagnosi della connettività dei canali o dello stato del Gateway
    - Comprendere i comandi e le opzioni della CLI per il controllo dello stato di integrità
summary: Comandi di controllo dello stato e monitoraggio dello stato del Gateway
title: Controlli di integrità
x-i18n:
    generated_at: "2026-07-16T14:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Breve guida per verificare la connettività dei canali senza fare supposizioni.

## Controlli rapidi

- `openclaw status` - riepilogo locale: raggiungibilità/modalità del Gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni e attività recente.
- `openclaw status --all` - diagnosi locale completa (sola lettura, a colori, sicura da incollare per il debug).
- `openclaw status --deep` - richiede al Gateway in esecuzione una verifica in tempo reale (`health` con `probe:true`), incluse, se supportate, verifiche dei canali per ogni account.
- `openclaw status --usage` - mostra istantanee di utilizzo/quota del provider del modello.
- `openclaw health` - richiede al Gateway in esecuzione la relativa istantanea dello stato di integrità (solo WS; nessun socket diretto dei canali dalla CLI).
- `openclaw health --verbose` (alias `--debug`) - forza una verifica dello stato in tempo reale e mostra i dettagli della connessione al Gateway.
- `openclaw health --json` - output dell'istantanea dello stato di integrità leggibile dalla macchina.
- Inviare `/status` come comando di chat autonomo in qualsiasi canale per ottenere una risposta sullo stato senza invocare l'agente.
- Log: seguire `/tmp/openclaw/openclaw-*.log` e filtrare per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Per Discord e altri provider di chat, le righe delle sessioni non indicano se il socket è attivo.
`openclaw sessions`, il Gateway `sessions.list` e lo strumento `sessions_list`
dell'agente leggono lo stato delle conversazioni memorizzato. Un provider può riconnettersi e mostrare uno stato
del canale integro prima che venga materializzata una nuova riga di sessione. Utilizzare i comandi relativi allo stato
e all'integrità dei canali riportati sopra per verificare la connettività in tempo reale.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (il valore mtime dovrebbe essere recente).
- Archivio delle sessioni: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Il conteggio e i destinatari recenti sono visualizzati tramite `status`.
- Procedura di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409-515 o `loggedOut`. La procedura di accesso tramite QR si riavvia automaticamente una volta per lo stato 515 dopo l'associazione.
- La diagnostica è abilitata per impostazione predefinita (`diagnostics.enabled: false` la disabilita). Gli eventi di memoria registrano i conteggi in byte di RSS/heap e la pressione dovuta a soglie/crescita; la pressione critica sulla memoria viene registrata tramite il logger del Gateway e, quando è impostato `diagnostics.memoryPressureSnapshot: true`, viene inoltre scritto un pacchetto di stabilità precedente all'OOM (statistiche dell'heap V8, contatori cgroup Linux quando disponibili, conteggi delle risorse attive, file di sessione/trascrizione più grandi indicati tramite percorso relativo oscurato). Gli avvisi di attività registrano il ritardo/l'utilizzo del ciclo degli eventi, il rapporto rispetto ai core della CPU e i conteggi delle sessioni attive/in attesa/in coda quando il processo è in esecuzione ma saturo. Gli eventi relativi a payload sovradimensionati registrano cosa è stato rifiutato/troncato/suddiviso in blocchi, insieme a dimensioni e limiti, ma mai il testo dei messaggi, il contenuto degli allegati, i corpi dei webhook, i corpi non elaborati di richieste/risposte, token, cookie o valori segreti.
- Lo stesso Heartbeat alimenta il registratore di stabilità limitato: `openclaw gateway stability` (o l'RPC `diagnostics.stability` del Gateway). Le uscite irreversibili del Gateway, i timeout di arresto, gli errori di avvio dopo un riavvio e, quando `diagnostics.memoryPressureSnapshot: true`, la pressione critica sulla memoria salvano l'istantanea più recente in `~/.openclaw/logs/stability/`. Esaminare il pacchetto più recente con `openclaw gateway stability --bundle latest`.
- Per le segnalazioni di bug, eseguire `openclaw gateway diagnostics export` e allegare il file zip generato: un riepilogo Markdown, il pacchetto di stabilità più recente, i metadati dei log sanificati, le istantanee sanificate dello stato e dell'integrità del Gateway e la struttura della configurazione. Il testo delle chat, i corpi dei webhook, gli output degli strumenti, le credenziali, i cookie, gli identificatori di account/messaggi e i valori segreti vengono omessi od oscurati. Consultare [Esportazione della diagnostica](/it/gateway/diagnostics).

## Configurazione del monitoraggio dell'integrità

- `gateway.channelHealthCheckMinutes`: frequenza con cui il Gateway verifica l'integrità dei canali. Valore predefinito: `5`. Impostare `0` per disabilitare globalmente i riavvii del monitoraggio dell'integrità.
- `gateway.channelStaleEventThresholdMinutes`: periodo massimo durante il quale un canale connesso può rimanere inattivo prima che il monitoraggio dell'integrità lo consideri obsoleto e lo riavvii. Valore predefinito: `30`. Mantenere questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite progressivo di un'ora per i riavvii eseguiti dal monitoraggio dell'integrità per canale/account. Valore predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitoraggio dell'integrità per un canale specifico, lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: impostazione sostitutiva per più account che prevale sull'impostazione a livello di canale.
- Queste impostazioni sostitutive per canale si applicano ai canali integrati che attualmente le espongono: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Monitoraggio del tempo di attività

I servizi esterni di monitoraggio del tempo di attività devono utilizzare l'endpoint dedicato `/health`, non `/v1/chat/completions`.

- **UTILIZZARE:** `GET /health` - risposta immediata, nessuna sessione creata, nessuna chiamata LLM, restituisce `{"ok":true,"status":"live"}`
- **NON utilizzare:** `/v1/chat/completions` per i controlli di integrità - ogni richiesta crea una sessione completa dell'agente con istantanea delle Skills, composizione del contesto e chiamate LLM

Quando non viene fornita alcuna intestazione `x-openclaw-session-key` né alcun campo `user`, `/v1/chat/completions` genera una nuova sessione casuale per ogni richiesta. I servizi di monitoraggio che inviano una richiesta ogni 15 minuti creano circa 96 sessioni/giorno, ciascuna delle quali occupa 4-22KB. Nel tempo, ciò provoca il rigonfiamento dell'archivio delle sessioni e può causare il superamento della finestra di contesto.

### Esempi di configurazione dei servizi di monitoraggio

- **BetterStack:** impostare l'URL del controllo di integrità su `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** aggiungere un nuovo monitor HTTP con URL `https://<your-gateway-host>:<port>/health`
- **Generico:** qualsiasi richiesta HTTP GET a `/health` restituisce 200 con `{"ok":true}` quando il Gateway è integro

## In caso di errore

- `logged out` o stato 409-515 -> ricollegare con `openclaw channels logout`, quindi `openclaw channels login`.
- Gateway non raggiungibile -> avviarlo: `openclaw gateway --port 18789` (utilizzare `--force` se la porta è occupata).
- Nessun messaggio in entrata -> verificare che il telefono collegato sia online e che il mittente sia autorizzato (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurarsi che l'elenco dei consentiti e le regole relative alle menzioni corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` richiede al Gateway in esecuzione la relativa istantanea dello stato di integrità (nessun socket diretto
dei canali dalla CLI). Per impostazione predefinita, restituisce una nuova istantanea del Gateway memorizzata nella cache e il
Gateway aggiorna tale cache in background; `--verbose` forza invece una verifica in tempo reale.
Il comando indica, quando disponibili, le credenziali collegate/l'età dell'autenticazione, i riepiloghi delle verifiche per canale,
il riepilogo dell'archivio delle sessioni e la durata della verifica. Termina con un codice diverso da zero se il Gateway non è
raggiungibile oppure se la verifica non riesce o scade.

Opzioni:

- `--json`: output JSON leggibile dalla macchina
- `--timeout <ms>`: sostituisce il timeout predefinito di 10s per la verifica
- `--verbose`: forza una verifica in tempo reale e mostra i dettagli della connessione al Gateway
- `--debug`: alias di `--verbose`

L'istantanea dello stato di integrità include: `ok` (booleano), `ts` (timestamp), `durationMs` (durata della verifica), stato per canale, disponibilità dell'agente e riepilogo dell'archivio delle sessioni.

## Contenuti correlati

- [Manuale operativo del Gateway](/it/gateway)
- [Esportazione della diagnostica](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
