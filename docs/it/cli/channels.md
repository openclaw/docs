---
read_when:
    - Vuoi aggiungere/rimuovere account di canale (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato del canale o seguire in tempo reale i log del canale
summary: Riferimento CLI per `openclaw channels` (accounts, status, login/logout, logs)
title: Canali
x-i18n:
    generated_at: "2026-04-30T08:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestisci gli account dei canali di chat e il loro stato di runtime sul Gateway.

Documenti correlati:

- Guide ai canali: [Canali](/it/channels)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)

## Comandi comuni

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Stato / capacità / risoluzione / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue controlli `probeAccount` e `auditAccount` opzionali per account, quindi l'output può includere lo stato del trasporto più risultati della sonda come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il Gateway non è raggiungibile, `channels status` ripiega su riepiloghi basati solo sulla configurazione invece dell'output della sonda live.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra i flag per canale (token, chiave privata, token dell'app, percorsi signal-cli, ecc.).
</Tip>

Le superfici comuni di aggiunta non interattiva includono:

- canali con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione dell'account predefinito basata su env, dove supportata

Se un plugin di canale deve essere installato durante un comando di aggiunta guidato da flag, OpenClaw usa la sorgente di installazione predefinita del canale senza aprire il prompt interattivo di installazione del plugin.

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può chiedere:

- ID account per ogni canale selezionato
- nomi visualizzati opzionali per quegli account
- `Bind configured channel accounts to agents now?`

Se confermi l'associazione immediata, la procedura guidata chiede quale agent deve possedere ogni account di canale configurato e scrive associazioni di instradamento con ambito account.

Puoi anche gestire le stesse regole di instradamento in seguito con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agent](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che usa ancora impostazioni di primo livello per account singolo, OpenClaw promuove i valori di primo livello con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali salva quei valori in `channels.<channel>.accounts.default`, ma i canali inclusi possono invece preservare un account promosso corrispondente già esistente. Matrix è l'esempio attuale: se esiste già un account con nome, oppure `defaultAccount` punta a un account con nome esistente, la promozione preserva quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di instradamento resta coerente:

- Le associazioni esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea né riscrive automaticamente associazioni in modalità non interattiva.
- La configurazione interattiva può facoltativamente aggiungere associazioni con ambito account.

Se la tua configurazione era già in uno stato misto (account con nome presenti e valori di primo livello per account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può invece preservare un target esistente con nome/predefinito.

## Accesso e disconnessione (interattivi)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` supporta `--verbose`.
- `channels login` e `logout` possono dedurre il canale quando è configurato un solo target di accesso supportato.
- Esegui `channels login` da un terminale sull'host del Gateway. Agent `exec` blocca questo flusso di accesso interattivo; gli strumenti di accesso nativi del canale per agent, come `whatsapp_login`, devono essere usati dalla chat quando disponibili.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per una sonda ampia.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` stampa `Claude: HTTP 403 ... user:profile` → lo snapshot di utilizzo richiede l'ambito `user:profile`. Usa `--no-usage`, oppure fornisci una chiave di sessione claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oppure riautenticati tramite Claude CLI.
- `openclaw channels status` ripiega su riepiloghi basati solo sulla configurazione quando il Gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente, segnala quell'account come configurato con note degradate invece di mostrarlo come non configurato.

## Sonda delle capacità

Recupera suggerimenti sulle capacità del provider (intent/ambiti dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è opzionale; omettilo per elencare ogni canale (incluse le extension).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID canale numerico grezzo e si applica solo a Discord.
- Le sonde sono specifiche del provider: intent Discord + autorizzazioni di canale opzionali; ambiti bot + utente Slack; flag del bot Telegram + webhook; versione del demone Signal; token dell'app Microsoft Teams + ruoli/ambiti Graph (annotati dove noti). I canali senza sonde riportano `Probe: unavailable`.

## Risolvere nomi in ID

Risolvi nomi di canali/utenti in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di target.
- La risoluzione preferisce corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è di sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso del comando corrente, il comando restituisce risultati non risolti degradati con note invece di interrompere l'intera esecuzione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
