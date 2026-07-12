---
read_when:
    - Vuoi aggiungere o rimuovere account dei canali (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp e altri)
    - Vuoi controllare lo stato del canale o seguire in tempo reale i log del canale
summary: Riferimento della CLI per `openclaw channels` (account, stato, funzionalità, risoluzione, log, accesso/disconnessione)
title: Canali
x-i18n:
    generated_at: "2026-07-12T06:54:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestisci gli account dei canali di chat e il loro stato di esecuzione sul Gateway.

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
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` mostra solo i canali di chat: per impostazione predefinita, gli account configurati, con etichette di stato `installed`, `configured` ed `enabled` per ciascun account (`--json` per un output elaborabile automaticamente). Passa `--all` per mostrare anche i canali inclusi che non dispongono ancora di un account configurato e i canali installabili del catalogo che non sono ancora presenti su disco. L'autenticazione dei provider e l'utilizzo dei modelli sono gestiti altrove: `openclaw models auth list` per i profili di autenticazione dei provider, `openclaw status` o `openclaw models list` per utilizzo e quota.

## Stato / funzionalità / risoluzione / registri

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (valore predefinito: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (richiede `--channel`), `--target <dest>` (richiede `--channel`), `--timeout <ms>` (valore predefinito: `10000`, limite massimo: `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valore predefinito: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (valore predefinito: `all`), `--lines <n>` (valore predefinito: `200`), `--json`

`channels status --probe` è il percorso in tempo reale: su un Gateway raggiungibile esegue per ogni account
i controlli `probeAccount` e, facoltativamente, `auditAccount`, quindi l'output può includere lo stato
del trasporto e risultati delle verifiche come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il Gateway non è raggiungibile, `channels status` utilizza riepiloghi basati esclusivamente sulla configurazione
anziché l'output delle verifiche in tempo reale.

Non utilizzare `openclaw sessions`, `sessions.list` del Gateway o lo strumento
`sessions_list` dell'agente come indicatore dello stato dei socket dei canali. Queste interfacce riportano
le righe delle conversazioni archiviate, non lo stato di esecuzione del provider. Dopo il riavvio di un provider Discord,
un account connesso ma inattivo può essere operativo anche se non compare alcuna riga di sessione Discord
fino al successivo evento di conversazione in entrata o in uscita.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` mostra le opzioni specifiche per ogni canale (token, chiave privata, token dell'app, percorsi di signal-cli e così via).
</Tip>

`channels remove` opera solo sui Plugin dei canali installati/configurati. Per i canali installabili del catalogo, utilizza prima `channels add`. Senza `--delete`, chiede di disabilitare l'account e ne conserva la configurazione; `--delete` rimuove le voci di configurazione senza chiedere conferma.
Per i Plugin dei canali supportati dall'ambiente di esecuzione, `channels remove` chiede inoltre al Gateway in esecuzione di arrestare l'account selezionato prima di aggiornare la configurazione, in modo che la disabilitazione o l'eliminazione di un account non lasci attivo il listener precedente fino al riavvio.

Opzioni condivise tra i canali per l'aggiunta non interattiva: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` e `--use-env` (autenticazione basata sulle variabili d'ambiente, solo per l'account predefinito, ove supportata). Le opzioni specifiche dei canali includono:

| Canale      | Opzioni                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Se durante un comando di aggiunta basato su opzioni è necessario installare un Plugin del canale, OpenClaw utilizza la fonte di installazione predefinita del canale senza aprire la richiesta interattiva di installazione del Plugin.

Quando esegui `openclaw channels add` senza opzioni, la procedura guidata interattiva può richiedere:

- gli ID account per ogni canale selezionato
- nomi visualizzati facoltativi per tali account
- `Instradare ora questi account dei canali agli agenti?`

Se confermi subito l'associazione, la procedura guidata chiede quale agente debba gestire ciascun account di canale configurato e scrive le associazioni di instradamento specifiche per account.

Puoi anche gestire successivamente le stesse regole di instradamento con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (consulta [agenti](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che utilizza ancora impostazioni di primo livello per un singolo account, OpenClaw sposta tali valori di primo livello nella mappa degli account del canale prima di scrivere il nuovo account. La conversione riutilizza un account esistente con nome quando il canale ne ha esattamente uno o quando `defaultAccount` ne indica uno; in caso contrario, i valori vengono inseriti in `channels.<channel>.accounts.default`.

Il comportamento dell'instradamento rimane coerente:

- Le associazioni esistenti relative al solo canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea né riscrive automaticamente le associazioni in modalità non interattiva.
- La configurazione interattiva può aggiungere facoltativamente associazioni specifiche per account.

Se la configurazione era già in uno stato misto (account con nome presenti e valori di primo livello per un singolo account ancora impostati), esegui `openclaw doctor --fix` per spostare i valori specifici dell'account nell'account convertito scelto per quel canale.

## Accesso e disconnessione (interattivi)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` supporta `--account <id>` e `--verbose`; `channels logout` supporta `--account <id>`.
- `channels login` e `logout` possono determinare automaticamente il canale quando un solo canale configurato supporta tale azione; se sono presenti più canali, passa `--channel`.
- `channels logout` preferisce il percorso tramite Gateway in tempo reale quando è raggiungibile, così la disconnessione arresta ogni listener attivo prima di cancellare lo stato di autenticazione del canale. Se un Gateway locale non è raggiungibile, ricorre alla pulizia locale dell'autenticazione; con `gateway.mode: "remote"` l'errore del Gateway causa invece il fallimento del comando.
- Dopo un accesso riuscito, la CLI chiede a un Gateway locale raggiungibile di avviare l'account; in modalità remota salva l'autenticazione localmente e segnala che l'ambiente di esecuzione remoto non è stato riavviato.
- Esegui `channels login` da un terminale sull'host del Gateway. `exec` dell'agente blocca questo flusso di accesso interattivo; gli strumenti di accesso dell'agente specifici del canale, come `whatsapp_login`, devono essere utilizzati dalla chat quando disponibili.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per una verifica generale.
- Utilizza `openclaw doctor` per correzioni guidate.
- `openclaw channels status` utilizza riepiloghi basati esclusivamente sulla configurazione quando il Gateway non è raggiungibile. Se una credenziale di un canale supportato è configurata tramite SecretRef ma non è disponibile nel percorso del comando corrente, segnala l'account come configurato con note sul funzionamento degradato anziché indicarlo come non configurato.

## Verifica delle funzionalità

Recupera indicazioni sulle funzionalità del provider (intenti/ambiti, ove disponibili) insieme al supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettile per elencare tutti i canali (inclusi quelli forniti dai Plugin).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID numerico non elaborato del canale e si applica solo a Discord. Per i canali vocali Discord, il controllo delle autorizzazioni segnala l'assenza di `ViewChannel`, `Connect`, `Speak`, `SendMessages` e `ReadMessageHistory`.
- Le verifiche sono specifiche del provider: identità del bot Discord e intenti, oltre alle autorizzazioni facoltative del canale; ambiti del bot e dell'utente Slack; opzioni del bot Telegram e Webhook; versione del daemon Signal; token dell'app Microsoft Teams e ruoli/ambiti Graph (annotati quando noti). I canali privi di verifiche riportano `Verifica: non disponibile`.

## Risolvere i nomi in ID

Risolvi i nomi di canali/utenti in ID utilizzando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Utilizza `--kind user|group|auto` per imporre il tipo di destinazione.
- La risoluzione preferisce le corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è in sola lettura. Se un account selezionato è configurato tramite SecretRef ma la credenziale non è disponibile nel percorso del comando corrente, il comando restituisce risultati non risolti in modalità degradata con note, anziché interrompere l'intera esecuzione.
- `channels resolve` non installa i Plugin dei canali. Utilizza `channels add --channel <name>` prima di risolvere i nomi per un canale installabile del catalogo.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
