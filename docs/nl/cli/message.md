---
read_when:
    - CLI-acties voor berichten toevoegen of wijzigen
    - Gedrag van uitgaande kanalen wijzigen
summary: CLI-referentie voor `openclaw message` (verzenden + kanaalacties)
title: Bericht
x-i18n:
    generated_at: "2026-07-12T08:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Eén uitgaande opdracht voor het verzenden van berichten en kanaalacties via
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram en WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Kanaalselectie

- `--channel <name>` is vereist als er meer dan één kanaal is geconfigureerd; als
  er precies één kanaal is geconfigureerd, is dat kanaal de standaardwaarde.
- Waarden: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost vereist de Plugin).
- Doelen met een kanaalvoorvoegsel (bijvoorbeeld `discord:channel:123`) worden
  zonder expliciete `--channel` gekoppeld aan de bijbehorende Plugin.

## Doelindelingen (`-t, --target`)

| Kanaal              | Indeling                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, vermelding `<@id>` of een losse numerieke id (behandeld als kanaal-id)        |
| Google Chat         | `spaces/<spaceId>` of `users/<userId>`                                                                     |
| iMessage            | adres, `chat_id:<id>`, `chat_guid:<guid>` of `chat_identifier:<id>`                                       |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` of een losse id (behandeld als kanaal)                            |
| Matrix              | `@user:server`, `!room:server` of `#alias:server`                                                          |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), een losse gespreks-id of `user:<aad-object-id>`               |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` of een van deze met het voorvoegsel `signal:` |
| Slack               | `channel:<id>` of `user:<id>` (een losse id wordt behandeld als kanaal)                                   |
| Telegram            | chat-id, `@username` of een forumonderwerpdoel: `<chatId>:topic:<topicId>` (of `--thread-id <topicId>`)    |
| WhatsApp            | E.164, groeps-JID (`...@g.us`) of kanaal-/nieuwsbrief-JID (`...@newsletter`)                              |

Kanaalnamen opzoeken: bij providers met een directory (Discord/Slack/enzovoort)
worden namen zoals `Help` of `#help` via de directorycache gevonden. Als ze niet
in de cache staan, wordt teruggevallen op een live directoryzoekopdracht als de
provider dit ondersteunt.

## Algemene vlaggen

Elke actie accepteert: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Acties met een bestemming accepteren ook
`-t, --target <dest>`.

## SecretRef-resolutie

`openclaw message` resolveert kanaal-SecretRefs voordat de actie wordt
uitgevoerd, met een zo beperkt mogelijk bereik:

- kanaalbereik wanneer `--channel` is ingesteld (of wordt afgeleid uit een doel met voorvoegsel)
- accountbereik wanneer ook `--account` is ingesteld
- alle geconfigureerde kanalen wanneer geen van beide is ingesteld

Niet-resolveerbare SecretRefs op niet-gerelateerde kanalen blokkeren een
gerichte actie nooit; een niet-resolveerbare SecretRef voor het geselecteerde
kanaal/account laat de actie veilig mislukken.

## Acties

### Kern

| Actie           | Kanalen                                                                                                         | Vereist                                                        | Opmerkingen                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, plus een van `--message`/`--media`/`--presentation` | Zie [Verzenden](#send) hieronder.                                                                                                                                                                                                                                                                             |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (herhalen)       | Zie [Peiling](#poll) hieronder.                                                                                                                                                                                                                                                                               |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (vereist `--emoji`; laat deze weg om waar ondersteund de eigen reacties te wissen, zie [Reacties](/nl/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Voor reacties in Signal-groepen is `--target-author` of `--target-author-uuid` vereist. Nextcloud Talk voegt alleen reacties toe; `--remove` geeft een fout. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                   |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` leest een specifiek tijdstempel; combineer dit met `--thread-id` voor een exact antwoord in een thread.                                                                                         |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Telegram-forumthreads gebruiken `--thread-id`.                                                                                                                                                                                                                                                               |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                              |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` accepteert ook `--pinned-message-id` (Microsoft Teams: de resource-id voor vastzetten/vastgezette berichten weergeven, niet de chatbericht-id).                                                                                                                                                       |
| `pins` (lijst)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                   |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: alleen beschikbaar wanneer versleuteling is ingeschakeld en verificatieacties zijn toegestaan.                                                                                                                                                                                                       |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (herhalen), `--author-id`, `--author-ids` (herhalen), `--limit`.                                                                                                                                                                                                              |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                      |

### Verzenden

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: voeg een afbeelding, audiobestand, video of document
  toe (lokaal pad of URL).
- `--presentation <json>`: gedeelde payload met blokken van het type `text`,
  `context`, `divider`, `chart`, `table`, `buttons` en `select`, weergegeven
  volgens de mogelijkheden van elk kanaal. Zie [Berichtpresentatie](/nl/plugins/message-presentation).
- `--delivery <json>`: algemene afleveringsvoorkeuren, bijvoorbeeld `{"pin":
true}`. `--pin` is een verkorte schrijfwijze voor vastgezette aflevering wanneer
  het kanaal dit ondersteunt.
- `--reply-to <id>`, `--thread-id <id>` (Telegram-forumonderwerp; Slack-threadtijdstempel,
  hetzelfde veld als `--reply-to`).
- `--force-document` (Telegram, WhatsApp): verzend afbeeldingen, GIF's en video's
  als documenten om kanaalcompressie te voorkomen.
- `--silent` (Telegram, Discord): verzend zonder melding.
- `--gif-playback` (alleen WhatsApp): behandel videomedia als GIF-weergave.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack geeft ondersteunde grafiekblokken systeemeigen weer; andere kanalen
ontvangen dezelfde gegevens als leesbare tekst:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack geeft expliciete tabelblokken ook systeemeigen weer. Andere kanalen ontvangen het bijschrift en elke rij als deterministische tekst:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Knoppen voor Telegram Mini Apps gebruiken `webApp` (`web_app` wordt nog steeds geparseerd voor verouderde JSON) en worden alleen weergegeven in privéchats tussen een gebruiker en de bot:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Peiling

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: herhaal 2-12 keer.
- `--poll-multi`: sta meerdere selecties toe.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Discussies

- `thread create`: kanaal Discord. Vereist: `--thread-name`, `--target`
  (kanaal-id). Optioneel: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: kanaal Discord. Vereist: `--guild-id`. Optioneel:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: kanaal Discord. Vereist: `--target` (discussie-id),
  `--message`. Optioneel: `--media`, `--reply-to`.

### Emoji's

- `emoji list`: Discord (`--guild-id`), Slack (geen extra vlaggen).
- `emoji upload`: Discord. Vereist: `--guild-id`, `--emoji-name`, `--media`.
  Optioneel: `--role-ids` (herhaalbaar).

### Stickers

- `sticker send`: Discord. Vereist: `--target`, `--sticker-id` (herhaalbaar).
  Optioneel: `--message`.
- `sticker upload`: Discord. Vereist: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Rollen, kanalen, spraak en evenementen (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: vereist `--guild-id`, `--event-name`, `--start-time`;
  optioneel `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderatie (Discord)

- `timeout`: `--guild-id`, `--user-id`; optioneel `--duration-min` of
  `--until` (laat beide weg om de time-out op te heffen), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Uitzending

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Verzendt één payload naar meerdere doelen. `--targets` accepteert een door spaties gescheiden lijst. Gebruik `--channel all` om elke geconfigureerde provider als doel te gebruiken.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Verzenden door agent](/nl/tools/agent-send)
- [Berichtpresentatie](/nl/plugins/message-presentation)
