---
read_when:
    - Vuoi aggiungere/rimuovere account dei canali (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato del canale o seguire i log del canale
summary: Riferimento CLI per `openclaw channels` (account, stato, accesso/disconnessione, log)
title: Canali
x-i18n:
    generated_at: "2026-05-11T20:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw channels`

Gestisci gli account dei canali di chat e il loro stato di runtime sul Gateway.

Documentazione correlata:

- Guide ai canali: [Canali](/it/channels)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)

## Comandi comuni

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` mostra solo i canali di chat: per impostazione predefinita gli account configurati, con tag di stato `installed`, `configured` ed `enabled` per account. Passa `--all` per mostrare anche i canali inclusi che non hanno ancora un account configurato e i canali del catalogo installabili che non sono ancora su disco. I provider di autenticazione (OAuth + chiavi API) e le istantanee di utilizzo/quota dei provider di modelli non vengono più stampati qui; usa `openclaw models auth list` per i profili di autenticazione dei provider e `openclaw status` oppure `openclaw models list` per l'utilizzo.

## Stato / capacità / risoluzione / log

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue i controlli per account
`probeAccount` e, facoltativamente, `auditAccount`, quindi l'output può includere lo stato
del trasporto più risultati di probe come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il Gateway non è raggiungibile, `channels status` ripiega su riepiloghi basati solo sulla configurazione
invece dell'output del probe live.

Non usare `openclaw sessions`, Gateway `sessions.list` o lo strumento dell'agente
`sessions_list` come segnale di integrità del socket del canale. Queste superfici riportano
righe di conversazioni memorizzate, non lo stato di runtime del provider. Dopo il riavvio
di un provider Discord, un account connesso ma silenzioso può essere integro anche se non appare
alcuna riga di sessione Discord fino al successivo evento di conversazione in ingresso o in uscita.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra i flag per canale (token, chiave privata, token app, percorsi signal-cli, ecc.).
</Tip>

`channels remove` opera solo sui Plugin di canale installati/configurati. Usa prima `channels add` per i canali del catalogo installabili.
Per i Plugin di canale supportati dal runtime, `channels remove` chiede anche al Gateway in esecuzione di arrestare l'account selezionato prima di aggiornare la configurazione, quindi disabilitare o eliminare un account non lascia attivo il vecchio listener fino al riavvio.

Le superfici comuni di aggiunta non interattiva includono:

- canali con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione dell'account predefinito basata su env, dove supportata

Se un Plugin di canale deve essere installato durante un comando di aggiunta guidato da flag, OpenClaw usa la sorgente di installazione predefinita del canale senza aprire il prompt interattivo di installazione del Plugin.

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può chiedere:

- ID account per ogni canale selezionato
- nomi visualizzati facoltativi per quegli account
- `Route these channel accounts to agents now?`

Se confermi l'associazione immediata, la procedura guidata chiede quale agente deve possedere ogni account di canale configurato e scrive associazioni di routing con ambito account.

Puoi anche gestire le stesse regole di routing in seguito con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agenti](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che sta ancora usando impostazioni di primo livello per account singolo, OpenClaw promuove i valori di primo livello con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali inserisce quei valori in `channels.<channel>.accounts.default`, ma i canali inclusi possono invece preservare un account promosso corrispondente esistente. Matrix è l'esempio attuale: se esiste già un account con nome, oppure `defaultAccount` punta a un account con nome esistente, la promozione preserva quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di routing resta coerente:

- Le associazioni esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea automaticamente né riscrive associazioni in modalità non interattiva.
- La configurazione interattiva può aggiungere facoltativamente associazioni con ambito account.

Se la tua configurazione era già in uno stato misto (account con nome presenti e valori di primo livello per account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può invece preservare una destinazione con nome/predefinita esistente.

## Login e logout (interattivi)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` supporta `--verbose`.
- `channels login` e `logout` possono dedurre il canale quando è configurato un solo target di login supportato.
- `channels logout` preferisce il percorso live del Gateway quando è raggiungibile, quindi il logout arresta eventuali listener attivi prima di cancellare lo stato di autenticazione del canale. Se un Gateway locale non è raggiungibile, ripiega sulla pulizia dell'autenticazione locale.
- Esegui `channels login` da un terminale sull'host del gateway. L'`exec` dell'agente blocca questo flusso di login interattivo; gli strumenti di login nativi del canale per agenti, come `whatsapp_login`, devono essere usati dalla chat quando disponibili.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per un probe ampio.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` non stampa più istantanee di utilizzo/quota dei provider di modelli. Per queste, usa `openclaw status` (panoramica) oppure `openclaw models list` (per provider).
- `openclaw channels status` ripiega su riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente, riporta quell'account come configurato con note degradate invece di mostrarlo come non configurato.

## Probe delle capacità

Recupera suggerimenti sulle capacità del provider (intent/scope dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettilo per elencare ogni canale (incluse le extension).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID canale numerico grezzo e si applica solo a Discord. Per i canali vocali Discord, il controllo dei permessi segnala i `ViewChannel`, `Connect`, `Speak`, `SendMessages` e `ReadMessageHistory` mancanti.
- I probe sono specifici del provider: intent Discord + permessi canale facoltativi; scope bot + utente Slack; flag bot Telegram + Webhook; versione del daemon Signal; token app Microsoft Teams + ruoli/scope Graph (annotati dove noti). I canali senza probe riportano `Probe: unavailable`.

## Risolvere i nomi in ID

Risolvi nomi di canali/utenti in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di target.
- La risoluzione preferisce le corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è in sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso del comando corrente, il comando restituisce risultati non risolti degradati con note invece di interrompere l'intera esecuzione.
- `channels resolve` non installa Plugin di canale. Usa `channels add --channel <name>` prima di risolvere nomi per un canale del catalogo installabile.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
