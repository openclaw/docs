---
read_when:
    - CLI-acties voor berichten toevoegen of wijzigen
    - Gedrag van uitgaande kanalen wijzigen
summary: CLI-referentie voor `openclaw message` (verzenden + kanaalacties)
title: Bericht
x-i18n:
    generated_at: "2026-04-29T22:33:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Enkele uitgaande opdracht voor het verzenden van berichten en kanaalacties
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Gebruik

```
openclaw message <subcommand> [flags]
```

Kanaalselectie:

- `--channel` is vereist als meer dan één kanaal is geconfigureerd.
- Als precies één kanaal is geconfigureerd, wordt dit de standaard.
- Waarden: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost vereist Plugin)
- `openclaw message` herleidt het geselecteerde kanaal naar de eigenaar-Plugin wanneer `--channel` of een doel met kanaalvoorvoegsel aanwezig is; anders laadt het geconfigureerde kanaal-Plugins voor afleiding van het standaardkanaal.

Doelindelingen (`--target`):

- WhatsApp: E.164 of groeps-JID
- Telegram: chat-id of `@username`
- Discord: `channel:<id>` of `user:<id>` (of `<@id>`-vermelding; ruwe numerieke id's worden als kanalen behandeld)
- Google Chat: `spaces/<spaceId>` of `users/<userId>`
- Slack: `channel:<id>` of `user:<id>` (ruw kanaal-id wordt geaccepteerd)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, of `@username` (kale id's worden als kanalen behandeld)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, of `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, of `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, of `#alias:server`
- Microsoft Teams: gespreks-id (`19:...@thread.tacv2`) of `conversation:<id>` of `user:<aad-object-id>`

Naamopzoeking:

- Voor ondersteunde providers (Discord/Slack/etc.) worden kanaalnamen zoals `Help` of `#help` herleid via de directory-cache.
- Bij een cachemisser probeert OpenClaw een live directory-opzoeking wanneer de provider dit ondersteunt.

## Algemene vlaggen

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (doelkanaal of doelgebruiker voor verzenden/pollen/lezen/etc.)
- `--targets <name>` (herhalen; alleen broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-gedrag

- `openclaw message` lost ondersteunde kanaal-SecretRefs op voordat de geselecteerde actie wordt uitgevoerd.
- Oplossing is waar mogelijk beperkt tot het actieve actiedoel:
  - kanaalbereik wanneer `--channel` is ingesteld (of afgeleid uit doelen met voorvoegsel zoals `discord:...`)
  - accountbereik wanneer `--account` is ingesteld (kanaalglobalen + geselecteerde accountoppervlakken)
  - wanneer `--account` is weggelaten, forceert OpenClaw geen `default` account-SecretRef-bereik
- Niet-opgeloste SecretRefs op niet-gerelateerde kanalen blokkeren een gerichte berichtactie niet.
- Als de SecretRef van het geselecteerde kanaal/account niet is opgelost, faalt de opdracht gesloten voor die actie.

## Acties

### Kern

- `send`
  - Kanalen: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Vereist: `--target`, plus `--message`, `--media`, of `--presentation`
  - Optioneel: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gedeelde presentatiepayloads: `--presentation` verzendt semantische blokken (`text`, `context`, `divider`, `buttons`, `select`) die de kern rendert via de verklaarde mogelijkheden van het geselecteerde kanaal. Zie [Berichtpresentatie](/nl/plugins/message-presentation).
  - Generieke leveringsvoorkeuren: `--delivery` accepteert leveringshints zoals `{ "pin": true }`; `--pin` is een verkorte vorm voor vastgezette levering wanneer het kanaal dit ondersteunt.
  - Alleen Telegram: `--force-document` (afbeeldingen en GIF's als documenten verzenden om Telegram-compressie te vermijden)
  - Alleen Telegram: `--thread-id` (forumonderwerp-id)
  - Alleen Slack: `--thread-id` (thread-tijdstempel; `--reply-to` gebruikt hetzelfde veld)
  - Telegram + Discord: `--silent`
  - Alleen WhatsApp: `--gif-playback`

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
  - Optioneel: `--limit`, `--before`, `--after`
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

### Rollen / Kanalen / Leden / Spraak

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
  - Kanalen: elk geconfigureerd kanaal; gebruik `--channel all` om alle providers als doel te nemen
  - Vereist: `--targets <target...>`
  - Optioneel: `--message`, `--media`, `--dry-run`

## Voorbeelden

Verzend een Discord-antwoord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Verzend een bericht met semantische knoppen:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

De kern rendert dezelfde `presentation`-payload naar Discord-componenten, Slack-blokken, Telegram-inlineknoppen, Mattermost-props of Teams/Feishu-kaarten, afhankelijk van de kanaalmogelijkheid. Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het volledige contract en de fallback-regels.

Verzend een rijkere presentatiepayload:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Maak een Discord-poll:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Maak een Telegram-poll (automatisch sluiten na 2 minuten):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Verzend een proactief Teams-bericht:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Maak een Teams-poll:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reageer in Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reageer in een Signal-groep:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Verzend Telegram-inlineknoppen via generieke presentatie:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Verzend een Teams-kaart via generieke presentatie:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Verzend een Telegram-afbeelding als document om compressie te vermijden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agent verzenden](/nl/tools/agent-send)
