---
read_when:
    - CLI-acties voor berichten toevoegen of wijzigen
    - Gedrag van uitgaande kanalen wijzigen
summary: CLI-referentie voor `openclaw message` (verzenden + kanaalacties)
title: Bericht
x-i18n:
    generated_at: "2026-05-02T11:12:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f429acc2c81f33d1ade543ab1170220e293077e1d1721ac0940937de3d19f0d2
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
- Als precies één kanaal is geconfigureerd, wordt dat de standaard.
- Waarden: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost vereist Plugin)
- `openclaw message` koppelt het geselecteerde kanaal aan de bijbehorende Plugin wanneer `--channel` of een doel met kanaalprefix aanwezig is; anders laadt het geconfigureerde kanaalplugins voor standaardkanaalafleiding.

Doelindelingen (`--target`):

- WhatsApp: E.164 of groeps-JID
- Telegram: chat-id of `@username`
- Discord: `channel:<id>` of `user:<id>` (of `<@id>`-vermelding; ruwe numerieke ids worden behandeld als kanalen)
- Google Chat: `spaces/<spaceId>` of `users/<userId>`
- Slack: `channel:<id>` of `user:<id>` (ruwe kanaal-id wordt geaccepteerd)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` of `@username` (kale ids worden behandeld als kanalen)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` of `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` of `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` of `#alias:server`
- Microsoft Teams: gespreks-id (`19:...@thread.tacv2`) of `conversation:<id>` of `user:<aad-object-id>`

Naamopzoeking:

- Voor ondersteunde providers (Discord/Slack/enzovoort) worden kanaalnamen zoals `Help` of `#help` opgelost via de directorycache.
- Bij een cachemisser probeert OpenClaw een live directoryopzoeking wanneer de provider dit ondersteunt.

## Algemene flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (doelkanaal of gebruiker voor verzenden/pollen/lezen/enzovoort)
- `--targets <name>` (herhalen; alleen broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-gedrag

- `openclaw message` lost ondersteunde kanaal-SecretRefs op voordat de geselecteerde actie wordt uitgevoerd.
- Oplossing is waar mogelijk beperkt tot het actieve actiedoel:
  - kanaalgebonden wanneer `--channel` is ingesteld (of afgeleid uit doelen met prefix zoals `discord:...`)
  - accountgebonden wanneer `--account` is ingesteld (kanaalglobals + geselecteerde accountoppervlakken)
  - wanneer `--account` is weggelaten, forceert OpenClaw geen `default` account-SecretRef-scope
- Niet-opgeloste SecretRefs op niet-gerelateerde kanalen blokkeren een gerichte berichtactie niet.
- Als de geselecteerde kanaal-/account-SecretRef niet is opgelost, faalt de opdracht gesloten voor die actie.

## Acties

### Kern

- `send`
  - Kanalen: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Vereist: `--target`, plus `--message`, `--media` of `--presentation`
  - Optioneel: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gedeelde presentatiepayloads: `--presentation` verzendt semantische blokken (`text`, `context`, `divider`, `buttons`, `select`) die de kern rendert via de aangegeven mogelijkheden van het geselecteerde kanaal. Zie [Berichtpresentatie](/nl/plugins/message-presentation).
  - Generieke bezorgvoorkeuren: `--delivery` accepteert bezorghints zoals `{ "pin": true }`; `--pin` is een verkorte vorm voor vastgezette bezorging wanneer het kanaal dit ondersteunt.
  - Alleen Telegram: `--force-document` (afbeeldingen en GIFs als documenten verzenden om Telegram-compressie te vermijden)
  - Alleen Telegram: `--thread-id` (forumtopic-id)
  - Alleen Slack: `--thread-id` (threadtimestamp; `--reply-to` gebruikt hetzelfde veld)
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
  - Optioneel: `--limit`, `--message-id`, `--before`, `--after`
  - Alleen Slack: `--message-id` leest een specifieke Slack-berichttimestamp; combineer met `--thread-id` om een exact threadantwoord te lezen.
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
  - Slack: geen extra flags

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

### Evenementen

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
  - Kanalen: elk geconfigureerd kanaal; gebruik `--channel all` om alle providers als doel te kiezen
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

De kern rendert dezelfde `presentation`-payload naar Discord-componenten, Slack-blokken, Telegram-inlineknoppen, Mattermost-props of Teams/Feishu-kaarten, afhankelijk van de kanaalmogelijkheid. Zie [Berichtpresentatie](/nl/plugins/message-presentation) voor het volledige contract en fallbackregels.

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

Telegram-inlineknoppen verzenden via generieke presentatie:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Een Teams-kaart verzenden via generieke presentatie:

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
