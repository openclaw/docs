---
read_when:
    - Vuoi aggiungere/rimuovere account canale (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato dei canali o seguire i log dei canali
summary: Riferimento CLI per `openclaw channels` (account, stato, login/logout, log)
title: channels
x-i18n:
    generated_at: "2026-04-05T13:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gestisci gli account dei canali chat e il loro stato di runtime sul Gateway.

Documentazione correlata:

- Guide dei canali: [Canali](/it/channels/index)
- Configurazione del gateway: [Configurazione](/gateway/configuration)

## Comandi comuni

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Stato / funzionalità / risoluzione / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue controlli
`probeAccount` per account e, facoltativamente, `auditAccount`, quindi l'output può includere
lo stato del trasporto più risultati delle probe come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il gateway non è raggiungibile, `channels status` usa come fallback riepiloghi basati solo sulla configurazione
invece dell'output delle probe live.

## Aggiungi / rimuovi account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Suggerimento: `openclaw channels add --help` mostra i flag specifici per canale (token, chiave privata, token app, percorsi signal-cli e così via).

Le comuni superfici di aggiunta non interattiva includono:

- canali con bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione supportata tramite env dell'account predefinito

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può chiedere:

- gli ID account per ciascun canale selezionato
- nomi visualizzati facoltativi per tali account
- `Bind configured channel accounts to agents now?`

Se confermi il bind immediato, la procedura guidata chiede quale agente deve possedere ciascun account canale configurato e scrive binding di instradamento con ambito account.

Puoi anche gestire le stesse regole di instradamento in seguito con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agents](/cli/agents)).

Quando aggiungi un account non predefinito a un canale che sta ancora usando impostazioni di primo livello per account singolo, OpenClaw promuove i valori di primo livello con ambito account nella mappa account del canale prima di scrivere il nuovo account. La maggior parte dei canali inserisce questi valori in `channels.<channel>.accounts.default`, ma i canali inclusi possono invece mantenere un account promosso corrispondente già esistente. Matrix è l'esempio attuale: se esiste già un account con nome oppure `defaultAccount` punta a un account con nome esistente, la promozione mantiene quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di instradamento resta coerente:

- I binding esistenti solo canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea né riscrive automaticamente i binding in modalità non interattiva.
- La configurazione interattiva può facoltativamente aggiungere binding con ambito account.

Se la tua configurazione era già in uno stato misto (account con nome presenti e valori di primo livello per account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può mantenere un target esistente con nome/predefinito.

## Login / logout (interattivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Note:

- `channels login` supporta `--verbose`.
- `channels login` / `logout` possono dedurre il canale quando è configurato un solo target di login supportato.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per una probe ampia.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` stampa `Claude: HTTP 403 ... user:profile` → lo snapshot di utilizzo richiede lo scope `user:profile`. Usa `--no-usage`, oppure fornisci una chiave di sessione claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oppure autenticati di nuovo tramite Claude CLI.
- `openclaw channels status` usa come fallback riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso di comando corrente, quell'account viene segnalato come configurato con note di degrado invece di essere mostrato come non configurato.

## Probe delle funzionalità

Recupera suggerimenti sulle funzionalità del provider (intent/scope dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettilo per elencare ogni canale (incluse le estensioni).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` oppure un ID canale numerico grezzo e si applica solo a Discord.
- Le probe sono specifiche del provider: intent Discord + permessi canale facoltativi; scope bot + utente Slack; flag bot + webhook Telegram; versione del demone Signal; token app + ruoli/scope Graph di Microsoft Teams (annotati dove noti). I canali senza probe riportano `Probe: unavailable`.

## Risolvi nomi in ID

Risolvi nomi di canale/utente in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di destinazione.
- La risoluzione preferisce le corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è di sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso di comando corrente, il comando restituisce risultati non risolti in stato degradato con note invece di interrompere l'intera esecuzione.
