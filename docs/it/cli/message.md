---
read_when:
    - Aggiunta o modifica delle azioni CLI dei messaggi
    - Modifica del comportamento dei canali in uscita
summary: Riferimento CLI per `openclaw message` (invio + azioni del canale)
title: Messaggio
x-i18n:
    generated_at: "2026-06-27T17:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Singolo comando in uscita per inviare messaggi e azioni di canale
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilizzo

```
openclaw message <subcommand> [flags]
```

Selezione del canale:

- `--channel` obbligatorio se è configurato più di un canale.
- Se è configurato esattamente un canale, diventa il valore predefinito.
- Valori: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost richiede un plugin)
- `openclaw message` risolve il canale selezionato nel plugin proprietario quando è presente `--channel` o una destinazione con prefisso di canale; altrimenti carica i plugin di canale configurati per inferire il canale predefinito.

Formati di destinazione (`--target`):

- WhatsApp: E.164, JID del gruppo o JID di WhatsApp Channel/Newsletter (`...@newsletter`)
- Telegram: id chat, `@username` o destinazione di argomento forum (`-1001234567890:topic:42`, oppure `--thread-id 42`)
- Discord: `channel:<id>` o `user:<id>` (o menzione `<@id>`; gli id numerici grezzi sono trattati come canali)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (l'id canale grezzo è accettato)
- Mattermost (plugin): `channel:<id>`, `user:<id>` o `@username` (gli id senza prefisso sono trattati come canali)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: id conversazione (`19:...@thread.tacv2`) o `conversation:<id>` o `user:<aad-object-id>`

Risoluzione dei nomi:

- Per i provider supportati (Discord/Slack/ecc.), i nomi dei canali come `Help` o `#help` vengono risolti tramite la cache della directory.
- In caso di cache miss, OpenClaw tenterà una ricerca live nella directory quando il provider la supporta.

## Flag comuni

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canale o utente di destinazione per send/poll/read/ecc.)
- `--targets <name>` (ripetibile; solo broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento di SecretRef

- `openclaw message` risolve i SecretRef dei canali supportati prima di eseguire l'azione selezionata.
- La risoluzione è limitata alla destinazione dell'azione attiva quando possibile:
  - con ambito canale quando `--channel` è impostato (o inferito da destinazioni con prefisso come `discord:...`)
  - con ambito account quando `--account` è impostato (globali del canale + superfici dell'account selezionato)
  - quando `--account` è omesso, OpenClaw non forza un ambito SecretRef dell'account `default`
- I SecretRef non risolti su canali non correlati non bloccano un'azione di messaggio mirata.
- Se il SecretRef del canale/account selezionato non è risolto, il comando fallisce in modalità fail-closed per quell'azione.

## Azioni

### Core

- `send`
  - Canali: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obbligatorio: `--target`, più `--message`, `--media` o `--presentation`
  - Opzionale: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload di presentazione condivisi: `--presentation` invia blocchi semantici (`text`, `context`, `divider`, `buttons`, `select`) che il core renderizza tramite le capacità dichiarate del canale selezionato. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation).
  - Preferenze di consegna generiche: `--delivery` accetta suggerimenti di consegna come `{ "pin": true }`; `--pin` è una scorciatoia per la consegna fissata quando il canale la supporta.
  - Telegram + WhatsApp: `--force-document` (invia immagini, GIF e video come documenti per evitare la compressione del canale)
  - Solo Telegram: `--thread-id` (id argomento forum)
  - Solo Slack: `--thread-id` (timestamp del thread; `--reply-to` usa lo stesso campo)
  - Telegram + Discord: `--silent`
  - Solo WhatsApp: `--gif-playback`; WhatsApp Channels/Newsletters vengono indirizzati con il loro JID nativo `@newsletter`.

- `poll`
  - Canali: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obbligatorio: `--target`, `--poll-question`, `--poll-option` (ripetibile)
  - Opzionale: `--poll-multi`
  - Solo Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Solo Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canali: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Obbligatorio: `--message-id`, `--target`
  - Opzionale: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` richiede `--emoji` (ometti `--emoji` per cancellare le proprie reazioni dove supportato; vedi /tools/reactions)
  - Solo WhatsApp: `--participant`, `--from-me`
  - Reazioni di gruppo Signal: `--target-author` o `--target-author-uuid` obbligatorio
  - Nextcloud Talk: solo aggiunta di reazioni; `--remove` viene rifiutato con un errore chiaro (vedi /tools/reactions)

- `reactions`
  - Canali: Discord/Google Chat/Slack/Matrix
  - Obbligatorio: `--message-id`, `--target`
  - Opzionale: `--limit`

- `read`
  - Canali: Discord/Slack/Matrix
  - Obbligatorio: `--target`
  - Opzionale: `--limit`, `--message-id`, `--before`, `--after`
  - Solo Slack: `--message-id` legge un timestamp specifico di messaggio Slack; combinalo con `--thread-id` per leggere una risposta esatta del thread.
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
  - Opzionale: `--channel-id`, `--channel-ids` (ripetibile), `--author-id`, `--author-ids` (ripetibile), `--limit`

### Thread

- `thread create`
  - Canali: Discord
  - Obbligatorio: `--thread-name`, `--target` (id canale)
  - Opzionale: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canali: Discord
  - Obbligatorio: `--guild-id`
  - Opzionale: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canali: Discord
  - Obbligatorio: `--target` (id thread), `--message`
  - Opzionale: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: nessun flag aggiuntivo

- `emoji upload`
  - Canali: Discord
  - Obbligatorio: `--guild-id`, `--emoji-name`, `--media`
  - Opzionale: `--role-ids` (ripetibile)

### Sticker

- `sticker send`
  - Canali: Discord
  - Obbligatorio: `--target`, `--sticker-id` (ripetibile)
  - Opzionale: `--message`

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
  - Opzionale: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderazione (Discord)

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` o `--until` opzionali; omettili entrambi per cancellare il timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` supporta anche `--reason`

### Broadcast

- `broadcast`
  - Canali: qualsiasi canale configurato; usa `--channel all` per indirizzare tutti i provider
  - Obbligatorio: `--targets <target...>`
  - Opzionale: `--message`, `--media`, `--dry-run`

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

Il core esegue il rendering dello stesso payload `presentation` in componenti Discord, blocchi Slack, pulsanti inline Telegram, props Mattermost o schede Teams/Feishu, a seconda della funzionalità del canale. Consulta [Presentazione dei messaggi](/it/plugins/message-presentation) per il contratto completo e le regole di fallback.

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

Crea un sondaggio Telegram (chiusura automatica dopo 2 minuti):

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

Invia un pulsante Telegram Mini App tramite presentazione generica:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

I pulsanti delle web app Telegram sono supportati solo nelle chat private tra un utente e
il bot. I payload JSON precedenti che usano `web_app` vengono ancora analizzati, ma `webApp` è il
campo di presentazione canonico.

Invia una scheda Teams tramite presentazione generica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Invia un'immagine Telegram o WhatsApp come documento per evitare la compressione:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Invio agente](/it/tools/agent-send)
