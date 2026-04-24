---
read_when:
    - Aggiungere o modificare azioni CLI dei messaggi
    - Modifica del comportamento del canale in uscita
summary: Riferimento CLI per `openclaw message` (invio + azioni del canale)
title: Messaggio
x-i18n:
    generated_at: "2026-04-24T08:34:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Comando singolo in uscita per l'invio di messaggi e azioni del canale
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilizzo

```
openclaw message <subcommand> [flags]
```

Selezione del canale:

- `--channel` è obbligatorio se è configurato più di un canale.
- Se è configurato esattamente un canale, diventa quello predefinito.
- Valori: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost richiede il Plugin)

Formati di destinazione (`--target`):

- WhatsApp: E.164 o group JID
- Telegram: chat id o `@username`
- Discord: `channel:<id>` o `user:<id>` (oppure menzione `<@id>`; gli ID numerici grezzi vengono trattati come canali)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (l'ID canale grezzo è accettato)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` o `@username` (gli ID semplici vengono trattati come canali)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: ID conversazione (`19:...@thread.tacv2`) oppure `conversation:<id>` oppure `user:<aad-object-id>`

Ricerca per nome:

- Per i provider supportati (Discord/Slack/ecc.), i nomi dei canali come `Help` o `#help` vengono risolti tramite la cache della directory.
- In caso di cache miss, OpenClaw tenterà una ricerca live nella directory quando il provider lo supporta.

## Flag comuni

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canale o utente di destinazione per send/poll/read/ecc.)
- `--targets <name>` (ripetibile; solo broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento di SecretRef

- `openclaw message` risolve i SecretRef supportati del canale prima di eseguire l'azione selezionata.
- La risoluzione è limitata all'obiettivo attivo dell'azione quando possibile:
  - ambito canale quando è impostato `--channel` (o inferito da destinazioni con prefisso come `discord:...`)
  - ambito account quando è impostato `--account` (superfici globali del canale + superfici dell'account selezionato)
  - quando `--account` viene omesso, OpenClaw non forza un ambito SecretRef per l'account `default`
- SecretRef non risolti su canali non correlati non bloccano un'azione di messaggio mirata.
- Se il SecretRef del canale/account selezionato non è risolto, il comando fallisce in modalità closed per quell'azione.

## Azioni

### Core

- `send`
  - Canali: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obbligatori: `--target`, più `--message`, `--media` o `--presentation`
  - Facoltativi: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload di presentazione condivisi: `--presentation` invia blocchi semantici (`text`, `context`, `divider`, `buttons`, `select`) che il core rende attraverso le capacità dichiarate del canale selezionato. Consulta [Presentazione dei messaggi](/it/plugins/message-presentation).
  - Preferenze di consegna generiche: `--delivery` accetta hint di consegna come `{ "pin": true }`; `--pin` è una scorciatoia per la consegna fissata in alto quando il canale la supporta.
  - Solo Telegram: `--force-document` (invia immagini e GIF come documenti per evitare la compressione di Telegram)
  - Solo Telegram: `--thread-id` (ID del topic del forum)
  - Solo Slack: `--thread-id` (timestamp del thread; `--reply-to` usa lo stesso campo)
  - Telegram + Discord: `--silent`
  - Solo WhatsApp: `--gif-playback`

- `poll`
  - Canali: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obbligatori: `--target`, `--poll-question`, `--poll-option` (ripetibile)
  - Facoltativi: `--poll-multi`
  - Solo Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Solo Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canali: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Obbligatori: `--message-id`, `--target`
  - Facoltativi: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` richiede `--emoji` (ometti `--emoji` per cancellare le proprie reazioni dove supportato; vedi /tools/reactions)
  - Solo WhatsApp: `--participant`, `--from-me`
  - Reazioni nei gruppi Signal: obbligatorio `--target-author` o `--target-author-uuid`

- `reactions`
  - Canali: Discord/Google Chat/Slack/Matrix
  - Obbligatori: `--message-id`, `--target`
  - Facoltativi: `--limit`

- `read`
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--target`
  - Facoltativi: `--limit`, `--before`, `--after`
  - Solo Discord: `--around`

- `edit`
  - Canali: Discord/Slack/Matrix
  - Obbligatori: `--message-id`, `--message`, `--target`

- `delete`
  - Canali: Discord/Slack/Telegram/Matrix
  - Obbligatori: `--message-id`, `--target`

- `pin` / `unpin`
  - Canali: Discord/Slack/Matrix
  - Obbligatori: `--message-id`, `--target`

- `pins` (elenco)
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--target`

- `permissions`
  - Canali: Discord/Matrix
  - Obbligatorio: `--target`
  - Solo Matrix: disponibile quando la crittografia Matrix è abilitata e le azioni di verifica sono consentite

- `search`
  - Canali: Discord
  - Obbligatori: `--guild-id`, `--query`
  - Facoltativi: `--channel-id`, `--channel-ids` (ripetibile), `--author-id`, `--author-ids` (ripetibile), `--limit`

### Thread

- `thread create`
  - Canali: Discord
  - Obbligatori: `--thread-name`, `--target` (ID canale)
  - Facoltativi: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canali: Discord
  - Obbligatorio: `--guild-id`
  - Facoltativi: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canali: Discord
  - Obbligatori: `--target` (ID thread), `--message`
  - Facoltativi: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: nessun flag aggiuntivo

- `emoji upload`
  - Canali: Discord
  - Obbligatori: `--guild-id`, `--emoji-name`, `--media`
  - Facoltativi: `--role-ids` (ripetibile)

### Sticker

- `sticker send`
  - Canali: Discord
  - Obbligatori: `--target`, `--sticker-id` (ripetibile)
  - Facoltativo: `--message`

- `sticker upload`
  - Canali: Discord
  - Obbligatori: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Ruoli / Canali / Membri / Voce

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` per Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Eventi

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Facoltativi: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderazione (Discord)

- `timeout`: `--guild-id`, `--user-id` (facoltativi `--duration-min` o `--until`; omettili entrambi per cancellare il timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` supporta anche `--reason`

### Broadcast

- `broadcast`
  - Canali: qualsiasi canale configurato; usa `--channel all` per puntare a tutti i provider
  - Obbligatori: `--targets <target...>`
  - Facoltativi: `--message`, `--media`, `--dry-run`

## Esempi

Inviare una risposta su Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Inviare un messaggio con pulsanti semantici:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Il core rende lo stesso payload `presentation` in componenti Discord, blocchi Slack, pulsanti inline Telegram, props Mattermost o card Teams/Feishu a seconda della capacità del canale. Consulta [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto completo e le regole di fallback.

Inviare un payload di presentazione più ricco:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Creare un sondaggio su Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Creare un sondaggio su Telegram (chiusura automatica in 2 minuti):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Inviare un messaggio proattivo su Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Creare un sondaggio su Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reagire in Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reagire in un gruppo Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Inviare pulsanti inline Telegram tramite presentazione generica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Inviare una card Teams tramite presentazione generica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Inviare un'immagine Telegram come documento per evitare la compressione:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Agent send](/it/tools/agent-send)
