---
read_when:
    - Vuoi aggiungere/rimuovere account dei canali (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato del canale o seguire in tempo reale i log del canale
summary: Riferimento CLI per `openclaw channels` (account, stato, accesso/disconnessione, log)
title: Canali
x-i18n:
    generated_at: "2026-05-02T08:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestisci gli account dei canali chat e il loro stato di runtime sul Gateway.

Documentazione correlata:

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

## Stato / funzionalità / risoluzione / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue controlli
`probeAccount` per account e controlli `auditAccount` facoltativi, quindi l'output può includere lo
stato del trasporto più risultati del probe come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il gateway non è raggiungibile, `channels status` ripiega su riepiloghi basati solo sulla configurazione
invece dell'output del probe live.

Non usare `openclaw sessions`, Gateway `sessions.list` o lo strumento dell'agente
`sessions_list` come segnale di integrità del socket del canale. Queste superfici riportano
righe di conversazioni archiviate, non lo stato di runtime del provider. Dopo un riavvio del provider Discord,
un account connesso ma inattivo può essere integro anche se non appare alcuna riga di sessione Discord
fino al successivo evento di conversazione in entrata o in uscita.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra i flag specifici per canale (token, chiave privata, token app, percorsi signal-cli, ecc.).
</Tip>

`channels remove` opera solo sui Plugin di canale installati/configurati. Usa prima `channels add` per i canali del catalogo installabili.
Per i Plugin di canale con backend di runtime, `channels remove` chiede anche al Gateway in esecuzione di arrestare l'account selezionato prima di aggiornare la configurazione, quindi la disabilitazione o eliminazione di un account non lascia il vecchio listener attivo fino al riavvio.

Le superfici comuni di aggiunta non interattiva includono:

- canali con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione supportata da env dell'account predefinito dove supportata

Se un Plugin di canale deve essere installato durante un comando di aggiunta guidato da flag, OpenClaw usa la sorgente di installazione predefinita del canale senza aprire il prompt interattivo di installazione del Plugin.

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può richiedere:

- ID account per ciascun canale selezionato
- nomi visualizzati facoltativi per tali account
- `Bind configured channel accounts to agents now?`

Se confermi il collegamento immediato, la procedura guidata chiede quale agente deve possedere ciascun account di canale configurato e scrive binding di instradamento con ambito account.

Puoi anche gestire le stesse regole di instradamento in seguito con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agenti](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che sta ancora usando impostazioni di primo livello per account singolo, OpenClaw promuove i valori di primo livello con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali colloca questi valori in `channels.<channel>.accounts.default`, ma i canali inclusi possono invece preservare un account promosso corrispondente esistente. Matrix è l'esempio attuale: se esiste già un account con nome, o `defaultAccount` punta a un account con nome esistente, la promozione preserva quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di instradamento resta coerente:

- I binding esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea automaticamente né riscrive binding in modalità non interattiva.
- La configurazione interattiva può aggiungere facoltativamente binding con ambito account.

Se la tua configurazione era già in uno stato misto (account con nome presenti e valori di primo livello per account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può invece preservare una destinazione con nome/predefinita esistente.

## Accesso e uscita (interattivi)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` supporta `--verbose`.
- `channels login` e `logout` possono inferire il canale quando è configurata una sola destinazione di accesso supportata.
- `channels logout` preferisce il percorso live del Gateway quando raggiungibile, quindi l'uscita arresta qualsiasi listener attivo prima di cancellare lo stato di autenticazione del canale. Se un Gateway locale non è raggiungibile, ripiega sulla pulizia dell'autenticazione locale.
- Esegui `channels login` da un terminale sull'host del gateway. `exec` dell'agente blocca questo flusso di accesso interattivo; gli strumenti di accesso nativi del canale per agenti, come `whatsapp_login`, dovrebbero essere usati dalla chat quando disponibili.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per un probe ampio.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` stampa `Claude: HTTP 403 ... user:profile` → lo snapshot di utilizzo richiede l'ambito `user:profile`. Usa `--no-usage`, oppure fornisci una chiave di sessione claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oppure riautenticati tramite Claude CLI.
- `openclaw channels status` ripiega su riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente, segnala quell'account come configurato con note degradate invece di mostrarlo come non configurato.

## Probe delle funzionalità

Recupera gli indizi sulle funzionalità del provider (intent/ambiti dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettilo per elencare ogni canale (incluse le estensioni).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID canale numerico grezzo e si applica solo a Discord.
- I probe sono specifici del provider: intent Discord + autorizzazioni facoltative del canale; bot Slack + ambiti utente; flag bot Telegram + webhook; versione del daemon Signal; token app Microsoft Teams + ruoli/ambiti Graph (annotati dove noti). I canali senza probe riportano `Probe: unavailable`.

## Risolvere i nomi in ID

Risolvi nomi di canali/utenti in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di destinazione.
- La risoluzione preferisce corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è di sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso del comando corrente, il comando restituisce risultati degradati non risolti con note invece di interrompere l'intera esecuzione.
- `channels resolve` non installa Plugin di canale. Usa `channels add --channel <name>` prima di risolvere nomi per un canale del catalogo installabile.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
