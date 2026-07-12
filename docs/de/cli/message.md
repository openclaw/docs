---
read_when:
    - Nachrichtenaktionen der CLI hinzufügen oder ändern
    - Verhalten ausgehender Kanäle ändern
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-07-12T01:29:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Einheitlicher ausgehender Befehl zum Senden von Nachrichten und Ausführen von Kanalaktionen über
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram und WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Kanalauswahl

- `--channel <name>` ist erforderlich, wenn mehr als ein Kanal konfiguriert ist; ist
  genau ein Kanal konfiguriert, wird dieser standardmäßig verwendet.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost erfordert das Plugin).
- Ziele mit Kanalpräfix (zum Beispiel `discord:channel:123`) ermitteln das
  zuständige Plugin ohne explizites `--channel`.

## Zielformate (`-t, --target`)

| Kanal               | Format                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, `<@id>`-Erwähnung oder eine reine numerische ID (wird als Kanal-ID behandelt)     |
| Google Chat         | `spaces/<spaceId>` oder `users/<userId>`                                                                       |
| iMessage            | Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`                                         |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` oder eine reine ID (wird als Kanal behandelt)                         |
| Matrix              | `@user:server`, `!room:server` oder `#alias:server`                                                             |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), eine reine Konversations-ID oder `user:<aad-object-id>`           |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` oder eine dieser Angaben mit Präfix `signal:` |
| Slack               | `channel:<id>` oder `user:<id>` (eine reine ID wird als Kanal behandelt)                                       |
| Telegram            | Chat-ID, `@username` oder ein Forenthemenziel: `<chatId>:topic:<topicId>` (oder `--thread-id <topicId>`)        |
| WhatsApp            | E.164, Gruppen-JID (`...@g.us`) oder Kanal-/Newsletter-JID (`...@newsletter`)                                  |

Suche nach Kanalnamen: Bei Providern mit einem Verzeichnis (Discord/Slack usw.) werden Namen
wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst. Bei einem Cache-Fehltreffer
wird auf eine Live-Verzeichnissuche zurückgegriffen, sofern der Provider diese unterstützt.

## Allgemeine Flags

Jede Aktion akzeptiert: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Aktionen mit einem Ziel akzeptieren außerdem
`-t, --target <dest>`.

## SecretRef-Auflösung

`openclaw message` löst SecretRefs des Kanals vor der Ausführung der Aktion auf,
wobei der Geltungsbereich so eng wie möglich gefasst wird:

- kanalbezogen, wenn `--channel` gesetzt ist (oder aus einem Ziel mit Präfix abgeleitet wird)
- kontobezogen, wenn zusätzlich `--account` gesetzt ist
- alle konfigurierten Kanäle, wenn keines von beiden gesetzt ist

Nicht aufgelöste SecretRefs in nicht betroffenen Kanälen blockieren eine gezielte Aktion nie;
eine nicht aufgelöste SecretRef im ausgewählten Kanal/Konto lässt die Aktion sicher fehlschlagen.

## Aktionen

### Kernfunktionen

| Aktion          | Kanäle                                                                                                          | Erforderlich                                                   | Hinweise                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` sowie eines von `--message`/`--media`/`--presentation` | Siehe [Senden](#send) unten.                                                                                                                                                                                                                                                                                                                                                     |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (wiederholbar)  | Siehe [Umfrage](#poll) unten.                                                                                                                                                                                                                                                                                                                                                    |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (erfordert `--emoji`; lassen Sie es weg, um eigene Reaktionen zu löschen, sofern unterstützt; siehe [Reaktionen](/de/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Reaktionen in Signal-Gruppen erfordern `--target-author` oder `--target-author-uuid`. Nextcloud Talk fügt nur Reaktionen hinzu; `--remove` führt zu einem Fehler. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                                       |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` liest einen bestimmten Zeitstempel; kombinieren Sie es mit `--thread-id`, um eine bestimmte Thread-Antwort zu lesen.                                                                                                                                              |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Verwenden Sie für Telegram-Forenthreads `--thread-id`.                                                                                                                                                                                                                                                                                                                           |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                                                                  |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` akzeptiert außerdem `--pinned-message-id` (Microsoft Teams: die Ressourcen-ID zum Anheften/Auflisten angehefteter Nachrichten, nicht die Chatnachrichten-ID).                                                                                                                                                                                                             |
| `pins` (Liste)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                                       |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: nur verfügbar, wenn die Verschlüsselung aktiviert ist und Verifizierungsaktionen zulässig sind.                                                                                                                                                                                                                                                                          |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (wiederholbar), `--author-id`, `--author-ids` (wiederholbar), `--limit`.                                                                                                                                                                                                                                                                         |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                                                          |

### Senden

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: Bild/Audio/Video/Dokument anhängen (lokaler Pfad oder
  URL).
- `--presentation <json>`: gemeinsame Nutzlast mit `text`-, `context`-, `divider`-,
  `chart`-, `table`-, `buttons`- und `select`-Blöcken, die entsprechend den Fähigkeiten
  des jeweiligen Kanals dargestellt werden. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation).
- `--delivery <json>`: allgemeine Zustellungseinstellungen, zum Beispiel `{"pin":
true}`. `--pin` ist eine Kurzform für angeheftete Zustellung, wenn der Kanal
  dies unterstützt.
- `--reply-to <id>`, `--thread-id <id>` (Telegram-Forenthema; Slack-Thread-
  Zeitstempel, dasselbe Feld wie `--reply-to`).
- `--force-document` (Telegram, WhatsApp): Bilder/GIFs/Videos als
  Dokumente senden, um die Kanalkomprimierung zu vermeiden.
- `--silent` (Telegram, Discord): ohne Benachrichtigung senden.
- `--gif-playback` (nur WhatsApp): Videomedien als GIF-Wiedergabe behandeln.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack stellt unterstützte Diagrammblöcke nativ dar; andere Kanäle erhalten dieselben
Daten als lesbaren Text:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack stellt auch explizite Tabellenblöcke nativ dar. Andere Kanäle erhalten die
Beschriftung und jede Zeile als deterministischen Text:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram-Mini-App-Schaltflächen verwenden `webApp` (`web_app` wird für älteres
JSON weiterhin geparst) und werden nur in privaten Chats zwischen einem Benutzer und dem Bot dargestellt:

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

### Umfrage

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: 2- bis 12-mal wiederholen.
- `--poll-multi`: Mehrfachauswahl zulassen.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5–600), `--silent`,
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

### Threads

- `thread create`: Kanal Discord. Erforderlich: `--thread-name`, `--target`
  (Kanal-ID). Optional: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: Kanal Discord. Erforderlich: `--guild-id`. Optional:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: Kanal Discord. Erforderlich: `--target` (Thread-ID),
  `--message`. Optional: `--media`, `--reply-to`.

### Emojis

- `emoji list`: Discord (`--guild-id`), Slack (keine zusätzlichen Flags).
- `emoji upload`: Discord. Erforderlich: `--guild-id`, `--emoji-name`, `--media`.
  Optional: `--role-ids` (wiederholbar).

### Sticker

- `sticker send`: Discord. Erforderlich: `--target`, `--sticker-id` (wiederholbar).
  Optional: `--message`.
- `sticker upload`: Discord. Erforderlich: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Rollen, Kanäle, Sprache, Ereignisse (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: erforderlich sind `--guild-id`, `--event-name`, `--start-time`;
  optional sind `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id`; optional `--duration-min` oder
  `--until` (lassen Sie beide weg, um das Timeout aufzuheben), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Rundsendung

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Sendet eine Nutzlast an mehrere Ziele. `--targets` akzeptiert eine durch Leerzeichen getrennte
Liste. Verwenden Sie `--channel all`, um alle konfigurierten Provider anzusprechen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Agent-Versand](/de/tools/agent-send)
- [Nachrichtendarstellung](/de/plugins/message-presentation)
