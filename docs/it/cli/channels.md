---
read_when:
    - Vuoi aggiungere/rimuovere account canale (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato del canale o seguire i log del canale in tempo reale
summary: Riferimento CLI per `openclaw channels` (account, stato, accesso/disconnessione, log)
title: Canali
x-i18n:
    generated_at: "2026-04-24T08:33:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gestisci gli account dei canali chat e il loro stato runtime sul Gateway.

Documentazione correlata:

- Guide ai canali: [Channels](/it/channels/index)
- Configurazione del Gateway: [Configuration](/it/gateway/configuration)

## Comandi comuni

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Stato / capabilities / resolve / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue per account i controlli
`probeAccount` e facoltativamente `auditAccount`, quindi l'output può includere lo stato
del trasporto più risultati della probe come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il gateway non è raggiungibile, `channels status` usa come fallback riepiloghi basati solo sulla configurazione
invece dell'output live della probe.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Suggerimento: `openclaw channels add --help` mostra i flag per canale (token, chiave privata, app token, percorsi signal-cli e così via).

Le superfici comuni per aggiunte non interattive includono:

- canali con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per autenticazione supportata basata su env dell'account predefinito

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può chiedere:

- id account per ogni canale selezionato
- nomi visualizzati facoltativi per quegli account
- `Bind configured channel accounts to agents now?`

Se confermi l'associazione immediata, la procedura guidata chiede quale agente debba possedere ogni account canale configurato e scrive associazioni di instradamento con ambito account.

Puoi anche gestire in seguito le stesse regole di instradamento con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agents](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che usa ancora impostazioni top-level a account singolo, OpenClaw promuove i valori top-level con ambito account nella mappa account del canale prima di scrivere il nuovo account. La maggior parte dei canali inserisce quei valori in `channels.<channel>.accounts.default`, ma i canali integrati possono invece preservare un account promosso esistente corrispondente. Matrix è l'esempio attuale: se esiste già un account nominato, oppure `defaultAccount` punta a un account nominato esistente, la promozione preserva quell'account invece di crearne uno nuovo `accounts.default`.

Il comportamento di instradamento resta coerente:

- Le associazioni esistenti solo-canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea né riscrive automaticamente associazioni in modalità non interattiva.
- La configurazione interattiva può facoltativamente aggiungere associazioni con ambito account.

Se la tua configurazione era già in uno stato misto (account nominati presenti e valori top-level a account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può preservare un target nominato/predefinito esistente.

## Accesso / disconnessione (interattivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Note:

- `channels login` supporta `--verbose`.
- `channels login` / `logout` possono dedurre il canale quando è configurata una sola destinazione di accesso supportata.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per una probe ampia.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` stampa `Claude: HTTP 403 ... user:profile` → l'istantanea di utilizzo richiede lo scope `user:profile`. Usa `--no-usage`, oppure fornisci una chiave di sessione claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oppure esegui di nuovo l'autenticazione tramite Claude CLI.
- `openclaw channels status` usa come fallback riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso di comando corrente, segnala quell'account come configurato con note di stato degradato invece di mostrarlo come non configurato.

## Probe delle capabilities

Recupera suggerimenti sulle capabilities del provider (intent/scope dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettilo per elencare ogni canale (incluse le estensioni).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un id canale numerico raw e si applica solo a Discord.
- Le probe sono specifiche del provider: intent Discord + autorizzazioni di canale facoltative; scope bot + utente Slack; flag bot Telegram + Webhook; versione daemon Signal; app token Microsoft Teams + ruoli/scope Graph (annotati dove noti). I canali senza probe riportano `Probe: unavailable`.

## Risolvere nomi in ID

Risolvi nomi di canali/utenti in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di destinazione.
- La risoluzione preferisce corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è di sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso di comando corrente, il comando restituisce risultati irrisolti degradati con note invece di interrompere l'intera esecuzione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
