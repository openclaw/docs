---
read_when:
    - Bericht-CLI-acties toevoegen of wijzigen
    - Uitgaand kanaalgedrag wijzigen
summary: CLI-referentie voor `openclaw message` (verzenden + kanaalacties)
title: Bericht
x-i18n:
    generated_at: "2026-05-04T09:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ef57d33c93206a61a6d044667de4faf6340f7d8cc324300f235e838ee3b7ff1
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Eén enkele uitgaande opdracht voor het verzenden van berichten en kanaalacties
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Gebruik

```
openclaw message <subcommand> [flags]
```

Kanaalselectie:

- `--channel` is vereist als er meer dan één kanaal is geconfigureerd.
- Als er precies één kanaal is geconfigureerd, wordt dit de standaard.
- Waarden: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost vereist plugin)
- `openclaw message` herleidt het geselecteerde kanaal naar de eigenaar-plugin wanneer `--channel` of een doel met kanaalvoorvoegsel aanwezig is; anders laadt het geconfigureerde kanaalplugins voor afleiding van het standaardkanaal.

Doelformaten (`--target`):

- WhatsApp: E.164, groeps-JID of WhatsApp-kanaal-/nieuwsbrief-JID (`...@newsletter`)
- Telegram: chat-id, `@username` of forumonderwerpdoel (`-1001234567890:topic:42`, of `--thread-id 42`)
- Discord: `channel:<id>` of `user:<id>` (of `<@id>`-vermelding; ruwe numerieke id's worden behandeld als kanalen)
- Google Chat: `spaces/<spaceId>` of `users/<userId>`
- Slack: `channel:<id>` of `user:<id>` (ruwe kanaal-id wordt geaccepteerd)
- Mattermost (plugin): `channel:<id>`, `user:<id>` of `@username` (kale id's worden behandeld als kanalen)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` of `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` of `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` of `#alias:server`
- Microsoft Teams: gespreks-id (`19:...@thread.tacv2`) of `conversation:<id>` of `user:<aad-object-id>`

Naamopzoeking:

- Voor ondersteunde providers (Discord/Slack/enz.) worden kanaalnamen zoals `Help` of `#help` opgelost via de directory-cache.
- Bij een cachemisser probeert OpenClaw een live directory-opzoeking wanneer de provider dit ondersteunt.

## Algemene vlaggen

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (doelkanaal of doelgebruiker voor verzenden/pollen/lezen/enz.)
- `--targets <name>` (herhalen; alleen broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-gedrag

- `openclaw message` lost ondersteunde kanaal-SecretRefs op voordat de geselecteerde actie wordt uitgevoerd.
- Oplossing is waar mogelijk beperkt tot het actieve actiedoel:
  - kanaalgebonden wanneer `--channel` is ingesteld (of afgeleid uit doelen met voorvoegsel zoals `discord:...`)
  - accountgebonden wanneer `--account` is ingesteld (kanaalglobalen + geselecteerde accountoppervlakken)
  - wanneer `--account` is weggelaten, dwingt OpenClaw geen `default` account-SecretRef-scope af
- Onopgeloste SecretRefs op niet-gerelateerde kanalen blokkeren een gerichte berichtactie niet.
- Als de SecretRef van het geselecteerde kanaal/account onopgelost is, faalt de opdracht gesloten voor die actie.

## Acties

### Kern

- `send`
  - Kanalen: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Vereist: `--target`, plus `--message`, `--media` of `--presentation`
  - Optioneel: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gedeelde presentatiepayloads: `--presentation` verzendt semantische blokken (`text`, `context`, `divider`, `buttons`, `select`) die de kern rendert via de gedeclareerde mogelijkheden van het geselecteerde kanaal. Zie [Berichtpresentatie](/nl/plugins/message-presentation).
  - Algemene afleveringsvoorkeuren: `--delivery` accepteert afleveringshints zoals `{ "pin": true }`; `--pin` is een verkorte vorm voor vastgezette aflevering wanneer het kanaal dit ondersteunt.
  - Alleen Telegram: `--force-document` (afbeeldingen en GIF's als documenten verzenden om Telegram-compressie te vermijden)
  - Alleen Telegram: `--thread-id` (forumonderwerp-id)
  - Alleen Slack: `--thread-id` (threadtijdstempel; `--reply-to` gebruikt hetzelfde veld)
  - Telegram + Discord: `--silent`
  - Alleen WhatsApp: `--gif-playback`; WhatsApp-kanalen/nieuwsbrieven worden geadresseerd met hun native `@newsletter` JID.

- `poll`
  - Kanalen: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Vereist: `--target`, `--poll-question`, `--poll-option` (herhalen)
  - Optioneel: `--poll-multi`
  - Alleen Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Alleen Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanalen: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Vereist: `--message-id`, `--target`
  - Optioneel: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Opmerking: `--remove` vereist `--emoji` (laat `--emoji` weg om eigen reacties te wissen waar ondersteund; zie /tools/reactions)
  - Alleen WhatsApp: `--participant`, `--from-me`
  - Signal-groepsreacties: `--target-author` of `--target-author-uuid` vereist

- `reactions`
  - Kanalen: Discord/Google Chat/Slack/Matrix
  - Vereist: `--message-id`, `--target`
  - Optioneel: `--limit`

- `read`
  - Kanalen: Discord/Slack/Matrix
  - Vereist: `--target`
  - Optioneel: `--limit`, `--message-id`, `--before`, `--after`
  - Alleen Slack: `--message-id` leest een specifieke Slack-berichttijdstempel; combineer met `--thread-id` om een exact threadantwoord te lezen.
  - Alleen Discord: `--around`

- `edit`
  - Kanalen: Discord/Slack/Matrix
  - Vereist: `--message-id`, `--message`, `--target`

- `delete`
  - Kanalen: Discord/Slack/Telegram/Matrix
  - Vereist: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanalen: Discord/Slack/Matrix
  - Vereist: `--message-id`, `--target`

- `pins` (lijst)
  - Kanalen: Discord/Slack/Matrix
  - Vereist: `--target`

- `permissions`
  - Kanalen: Discord/Matrix
  - Vereist: `--target`
  - Alleen Matrix: beschikbaar wanneer Matrix-versleuteling is ingeschakeld en verificatieacties zijn toegestaan

- `search`
  - Kanalen: Discord
  - Vereist: `--guild-id`, `--query`
  - Optioneel: `--channel-id`, `--channel-ids` (herhalen), `--author-id`, `--author-ids` (herhalen), `--limit`

### Threads

- `thread create`
  - Kanalen: Discord
  - Vereist: `--thread-name`, `--target` (kanaal-id)
  - Optioneel: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanalen: Discord
  - Vereist: `--guild-id`
  - Optioneel: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanalen: Discord
  - Vereist: `--target` (thread-id), `--message`
  - Optioneel: `--media`, `--reply-to`

### Emoji's

- `emoji list`
  - Discord: `--guild-id`
  - Slack: geen extra vlaggen

- `emoji upload`
  - Kanalen: Discord
  - Vereist: `--guild-id`, `--emoji-name`, `--media`
  - Optioneel: `--role-ids` (herhalen)

### Stickers

- `sticker send`
  - Kanalen: Discord
  - Vereist: `--target`, `--sticker-id` (herhalen)
  - Optioneel: `--message`

- `sticker upload`
  - Kanalen: Discord
  - Vereist: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Kanalen / Leden / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` voor Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Gebeurtenissen

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Optioneel: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderatie (Discord)

- `timeout`: `--guild-id`, `--user-id` (optioneel `--duration-min` of `--until`; laat beide weg om timeout te wissen)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` ondersteunt ook `--reason`

### Broadcast

- `broadcast`
  - Kanalen: elk geconfigureerd kanaal; gebruik `--channel all` om alle providers te targeten
  - Vereist: `--targets <target...>`
  - Optioneel: `--message`, `--media`, `--dry-run`

## Voorbeelden

Een Discord-antwoord verzenden:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Een bericht met semantische knoppen verzenden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

De kern rendert dezelfde `presentation`-payload naar Discord-componenten, Slack-blokken, Telegram-inlineknoppen, Mattermost-props of Teams/Feishu-kaarten, afhankelijk van de kanaalmogelijkheid. Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het volledige contract en de fallbackregels.

Een rijkere presentatiepayload verzenden:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Een Discord-poll maken:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Een Telegram-poll maken (automatisch sluiten na 2 minuten):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Een proactief Teams-bericht verzenden:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Een Teams-poll maken:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reageren in Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reageren in een Signal-groep:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram-inlineknoppen verzenden via algemene presentatie:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Een Teams-kaart verzenden via algemene presentatie:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Een Telegram-afbeelding als document verzenden om compressie te vermijden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agent verzenden](/nl/tools/agent-send)
