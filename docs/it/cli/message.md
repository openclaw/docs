---
read_when:
    - Aggiunta o modifica delle azioni CLI per i messaggi
    - Modificare il comportamento del canale in uscita
summary: Riferimento CLI per `openclaw message` (invio + azioni del canale)
title: Messaggio
x-i18n:
    generated_at: "2026-04-30T08:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Comando singolo in uscita per inviare messaggi e azioni sui canali
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilizzo

```
openclaw message <subcommand> [flags]
```

Selezione del canale:

- `--channel` è obbligatorio se è configurato più di un canale.
- Se è configurato esattamente un canale, diventa quello predefinito.
- Valori: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost richiede un Plugin)
- `openclaw message` risolve il canale selezionato nel relativo Plugin proprietario quando è presente `--channel` o una destinazione con prefisso di canale; altrimenti carica i Plugin dei canali configurati per dedurre il canale predefinito.

Formati di destinazione (`--target`):

- WhatsApp: E.164 o JID di gruppo
- Telegram: id chat o `@username`
- Discord: `channel:<id>` o `user:<id>` (o menzione `<@id>`; gli id numerici grezzi sono trattati come canali)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (l’id canale grezzo è accettato)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` o `@username` (gli id senza prefisso sono trattati come canali)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: id conversazione (`19:...@thread.tacv2`) o `conversation:<id>` o `user:<aad-object-id>`

Ricerca per nome:

- Per i provider supportati (Discord/Slack/ecc.), i nomi dei canali come `Help` o `#help` vengono risolti tramite la cache della directory.
- In caso di mancata corrispondenza nella cache, OpenClaw tenterà una ricerca live nella directory quando il provider la supporta.

## Flag comuni

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canale o utente di destinazione per send/poll/read/ecc.)
- `--targets <name>` (ripetibile; solo broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento di SecretRef

- `openclaw message` risolve i SecretRef dei canali supportati prima di eseguire l’azione selezionata.
- La risoluzione è limitata alla destinazione attiva dell’azione quando possibile:
  - con ambito canale quando `--channel` è impostato (o dedotto da destinazioni con prefisso come `discord:...`)
  - con ambito account quando `--account` è impostato (globali del canale + superfici dell’account selezionato)
  - quando `--account` è omesso, OpenClaw non forza un ambito SecretRef dell’account `default`
- I SecretRef non risolti su canali non correlati non bloccano un’azione di messaggio mirata.
- Se il SecretRef del canale/account selezionato non è risolto, il comando fallisce in modo chiuso per quell’azione.

## Azioni

### Core

- `send`
  - Canali: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obbligatorio: `--target`, più `--message`, `--media` o `--presentation`
  - Facoltativo: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload di presentazione condivisi: `--presentation` invia blocchi semantici (`text`, `context`, `divider`, `buttons`, `select`) che il Core renderizza tramite le capacità dichiarate del canale selezionato. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation).
  - Preferenze di recapito generiche: `--delivery` accetta suggerimenti di recapito come `{ "pin": true }`; `--pin` è una scorciatoia per il recapito fissato quando il canale lo supporta.
  - Solo Telegram: `--force-document` (invia immagini e GIF come documenti per evitare la compressione di Telegram)
  - Solo Telegram: `--thread-id` (id dell’argomento del forum)
  - Solo Slack: `--thread-id` (timestamp del thread; `--reply-to` usa lo stesso campo)
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
  - Reazioni nei gruppi Signal: `--target-author` o `--target-author-uuid` obbligatorio

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

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` o `--until` facoltativo; ometti entrambi per cancellare il timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` supporta anche `--reason`

### Broadcast

- `broadcast`
  - Canali: qualsiasi canale configurato; usa `--channel all` per destinare tutti i provider
  - Obbligatorio: `--targets <target...>`
  - Facoltativo: `--message`, `--media`, `--dry-run`

## Esempi

Invia una risposta Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Invia un messaggio con pulsanti semantici:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Il Core renderizza lo stesso payload `presentation` in componenti Discord, blocchi Slack, pulsanti inline Telegram, prop Mattermost o schede Teams/Feishu in base alle capacità del canale. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto completo e le regole di fallback.

Invia un payload di presentazione più ricco:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
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

Invia pulsanti inline Telegram tramite presentazione generica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Invia una scheda Teams tramite presentazione generica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Invia un’immagine Telegram come documento per evitare la compressione:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Invio agente](/it/tools/agent-send)
