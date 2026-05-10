---
read_when:
    - Vuoi aggiungere/rimuovere account di canale (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Vuoi verificare lo stato del canale o seguire i log del canale
summary: Riferimento CLI per `openclaw channels` (account, stato, accesso/disconnessione, log)
title: Canali
x-i18n:
    generated_at: "2026-05-10T19:27:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
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

`channels list` mostra solo i canali di chat: per impostazione predefinita gli account configurati, con tag di stato `installed`, `configured` e `enabled` per account. Passa `--all` per mostrare anche i canali in bundle che non hanno ancora un account configurato e i canali del catalogo installabili che non sono ancora su disco. I provider di autenticazione (OAuth + chiavi API) e gli snapshot di utilizzo/quota dei provider di modelli non vengono più stampati qui; usa `openclaw models auth list` per i profili di autenticazione dei provider e `openclaw status` o `openclaw models list` per l'utilizzo.

## Stato / capacità / risoluzione / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un Gateway raggiungibile esegue per account i controlli
`probeAccount` e gli eventuali controlli `auditAccount`, quindi l'output può includere lo stato
del trasporto più risultati delle sonde come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il Gateway non è raggiungibile, `channels status` ripiega su riepiloghi basati solo sulla configurazione
invece dell'output delle sonde live.

Non usare `openclaw sessions`, Gateway `sessions.list` o lo strumento dell'agente
`sessions_list` come segnale di integrità del socket del canale. Queste superfici riportano
righe di conversazione archiviate, non lo stato di runtime del provider. Dopo un riavvio del provider Discord,
un account connesso ma inattivo può essere integro anche se non compare alcuna riga di sessione Discord
fino al successivo evento di conversazione in ingresso o in uscita.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra i flag per canale (token, chiave privata, app token, percorsi signal-cli, ecc.).
</Tip>

`channels remove` opera solo sui plugin di canale installati/configurati. Usa prima `channels add` per i canali installabili del catalogo.
Per i plugin di canale supportati dal runtime, `channels remove` chiede anche al Gateway in esecuzione di arrestare l'account selezionato prima di aggiornare la configurazione, quindi disabilitare o eliminare un account non lascia attivo il vecchio listener fino al riavvio.

Le superfici comuni di aggiunta non interattiva includono:

- canali bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione supportata dall'ambiente dell'account predefinito, dove supportata

Se un plugin di canale deve essere installato durante un comando di aggiunta guidato da flag, OpenClaw usa la sorgente di installazione predefinita del canale senza aprire il prompt interattivo di installazione del plugin.

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può chiedere:

- ID account per ciascun canale selezionato
- nomi visualizzati opzionali per quegli account
- `Route these channel accounts to agents now?`

Se confermi l'associazione immediata, la procedura guidata chiede quale agente deve possedere ciascun account di canale configurato e scrive associazioni di instradamento con ambito account.

Puoi anche gestire in seguito le stesse regole di instradamento con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agenti](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che usa ancora impostazioni di primo livello per account singolo, OpenClaw promuove i valori di primo livello con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali colloca questi valori in `channels.<channel>.accounts.default`, ma i canali in bundle possono invece preservare un account promosso esistente corrispondente. Matrix è l'esempio attuale: se esiste già un account nominato, o `defaultAccount` punta a un account nominato esistente, la promozione preserva quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di instradamento resta coerente:

- Le associazioni esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea automaticamente né riscrive associazioni in modalità non interattiva.
- La configurazione interattiva può opzionalmente aggiungere associazioni con ambito account.

Se la tua configurazione era già in uno stato misto (account nominati presenti e valori di primo livello per account singolo ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può invece preservare un target nominato/predefinito esistente.

## Login e logout (interattivi)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` supporta `--verbose`.
- `channels login` e `logout` possono dedurre il canale quando è configurato un solo target di login supportato.
- `channels logout` preferisce il percorso live del Gateway quando raggiungibile, quindi il logout arresta qualsiasi listener attivo prima di cancellare lo stato di autenticazione del canale. Se un Gateway locale non è raggiungibile, ripiega sulla pulizia dell'autenticazione locale.
- Esegui `channels login` da un terminale sull'host del gateway. L'`exec` dell'agente blocca questo flusso di login interattivo; gli strumenti di login nativi del canale per agenti, come `whatsapp_login`, dovrebbero essere usati dalla chat quando disponibili.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per una sonda ampia.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` non stampa più snapshot di utilizzo/quota dei provider di modelli. Per questi, usa `openclaw status` (panoramica) o `openclaw models list` (per provider).
- `openclaw channels status` ripiega su riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente, segnala quell'account come configurato con note di degrado invece di mostrarlo come non configurato.

## Sonda delle capacità

Recupera suggerimenti sulle capacità del provider (intent/scope dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è opzionale; omettilo per elencare ogni canale (incluse le estensioni).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID canale numerico grezzo e si applica solo a Discord. Per i canali vocali Discord, il controllo dei permessi segnala l'assenza di `ViewChannel`, `Connect`, `Speak`, `SendMessages` e `ReadMessageHistory`.
- Le sonde sono specifiche del provider: intent Discord + permessi opzionali del canale; scope bot + utente Slack; flag bot Telegram + webhook; versione del demone Signal; app token Microsoft Teams + ruoli/scope Graph (annotati dove noti). I canali senza sonde riportano `Probe: unavailable`.

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
- `channels resolve` non installa plugin di canale. Usa `channels add --channel <name>` prima di risolvere nomi per un canale installabile del catalogo.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
