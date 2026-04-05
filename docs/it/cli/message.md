---
read_when:
    - Aggiunta o modifica delle azioni CLI dei messaggi
    - Modifica del comportamento dei canali in uscita
summary: Riferimento CLI per `openclaw message` (invio + azioni canale)
title: message
x-i18n:
    generated_at: "2026-04-05T13:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Comando unico in uscita per inviare messaggi e azioni canale
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilizzo

```
openclaw message <subcommand> [flags]
```

Selezione del canale:

- `--channel` è obbligatorio se è configurato più di un canale.
- Se è configurato esattamente un canale, diventa il valore predefinito.
- Valori: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost richiede un plugin)

Formati target (`--target`):

- WhatsApp: E.164 o JID di gruppo
- Telegram: id chat o `@username`
- Discord: `channel:<id>` o `user:<id>` (o menzione `<@id>`; gli id numerici raw vengono trattati come canali)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (l'id canale raw è accettato)
- Mattermost (plugin): `channel:<id>`, `user:<id>` o `@username` (gli id semplici vengono trattati come canali)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: id conversazione (`19:...@thread.tacv2`) o `conversation:<id>` o `user:<aad-object-id>`

Risoluzione nomi:

- Per i provider supportati (Discord/Slack/ecc.), i nomi canale come `Help` o `#help` vengono risolti tramite la cache della directory.
- In caso di cache miss, OpenClaw tenterà una ricerca live nella directory quando il provider lo supporta.

## Flag comuni

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canale o utente di destinazione per send/poll/read/ecc.)
- `--targets <name>` (ripetibile; solo broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento SecretRef

- `openclaw message` risolve i SecretRef dei canali supportati prima di eseguire l'azione selezionata.
- La risoluzione è limitata all'obiettivo dell'azione attiva quando possibile:
  - limitata al canale quando `--channel` è impostato (o dedotto da target con prefisso come `discord:...`)
  - limitata all'account quando `--account` è impostato (globali del canale + superfici dell'account selezionato)
  - quando `--account` è omesso, OpenClaw non forza un ambito SecretRef `default` per l'account
- I SecretRef non risolti su canali non correlati non bloccano un'azione messaggio mirata.
- Se il SecretRef del canale/account selezionato non è risolto, il comando fallisce in modo chiuso per quell'azione.

## Azioni

### Core

- `send`
  - Canali: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obbligatorio: `--target`, più `--message` o `--media`
  - Facoltativo: `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload interattivi condivisi: `--interactive` invia un payload JSON interattivo nativo del canale quando supportato
  - Solo Telegram: `--buttons` (richiede `channels.telegram.capabilities.inlineButtons` per consentirlo)
  - Solo Telegram: `--force-document` (invia immagini e GIF come documenti per evitare la compressione di Telegram)
  - Solo Telegram: `--thread-id` (id argomento del forum)
  - Solo Slack: `--thread-id` (timestamp del thread; `--reply-to` usa lo stesso campo)
  - Solo Discord: payload JSON `--components`
  - Canali Adaptive Card: payload JSON `--card` quando supportato
  - Telegram + Discord: `--silent`
  - Solo WhatsApp: `--gif-playback`

- `poll`
  - Canali: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obbligatorio: `--target`, `--poll-question`, `--poll-option` (ripetibile)
  - Facoltativo: `--poll-multi`
  - Solo Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Solo Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canali: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Obbligatorio: `--message-id`, `--target`
  - Facoltativo: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` richiede `--emoji` (ometti `--emoji` per cancellare le proprie reazioni dove supportato; vedi /tools/reactions)
  - Solo WhatsApp: `--participant`, `--from-me`
  - Reazioni nei gruppi Signal: richiesto `--target-author` o `--target-author-uuid`

- `reactions`
  - Canali: Discord/Google Chat/Slack/Matrix
  - Obbligatorio: `--message-id`, `--target`
  - Facoltativo: `--limit`

- `read`
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--target`
  - Facoltativo: `--limit`, `--before`, `--after`
  - Solo Discord: `--around`

- `edit`
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--message-id`, `--message`, `--target`

- `delete`
  - Canali: Discord/Slack/Telegram/Matrix
  - Obbligatorio: `--message-id`, `--target`

- `pin` / `unpin`
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--message-id`, `--target`

- `pins` (elenco)
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--target`

- `permissions`
  - Canali: Discord/Matrix
  - Obbligatorio: `--target`
  - Solo Matrix: disponibile quando la crittografia Matrix è abilitata e le azioni di verifica sono consentite

- `search`
  - Canali: Discord
  - Obbligatorio: `--guild-id`, `--query`
  - Facoltativo: `--channel-id`, `--channel-ids` (ripetibile), `--author-id`, `--author-ids` (ripetibile), `--limit`

### Thread

- `thread create`
  - Canali: Discord
  - Obbligatorio: `--thread-name`, `--target` (id canale)
  - Facoltativo: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canali: Discord
  - Obbligatorio: `--guild-id`
  - Facoltativo: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canali: Discord
  - Obbligatorio: `--target` (id thread), `--message`
  - Facoltativo: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: nessun flag aggiuntivo

- `emoji upload`
  - Canali: Discord
  - Obbligatorio: `--guild-id`, `--emoji-name`, `--media`
  - Facoltativo: `--role-ids` (ripetibile)

### Sticker

- `sticker send`
  - Canali: Discord
  - Obbligatorio: `--target`, `--sticker-id` (ripetibile)
  - Facoltativo: `--message`

- `sticker upload`
  - Canali: Discord
  - Obbligatorio: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

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
  - Facoltativo: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderazione (Discord)

- `timeout`: `--guild-id`, `--user-id` (facoltativo `--duration-min` o `--until`; ometti entrambi per cancellare il timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` supporta anche `--reason`

### Broadcast

- `broadcast`
  - Canali: qualsiasi canale configurato; usa `--channel all` per indirizzare tutti i provider
  - Obbligatorio: `--targets <target...>`
  - Facoltativo: `--message`, `--media`, `--dry-run`

## Esempi

Invia una risposta Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Invia un messaggio Discord con components:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Vedi [Discord components](/channels/discord#interactive-components) per lo schema completo.

Invia un payload interattivo condiviso:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Crea un sondaggio Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Crea un sondaggio Telegram (chiusura automatica in 2 minuti):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Invia un messaggio proattivo Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Crea un sondaggio Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reagisci in Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reagisci in un gruppo Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Invia pulsanti inline Telegram:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Invia una Adaptive Card Teams:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Invia un'immagine Telegram come documento per evitare la compressione:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
