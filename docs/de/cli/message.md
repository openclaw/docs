---
read_when:
    - Nachrichten-CLI-Aktionen hinzufügen oder ändern
    - Verhalten ausgehender Kanäle ändern
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-07-24T04:29:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Ein einzelner ausgehender Befehl zum Senden von Nachrichten und Ausführen von Kanalaktionen über
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram und WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Kanalauswahl

- `--channel <name>` ist erforderlich, wenn mehr als ein Kanal konfiguriert ist; bei
  genau einem konfigurierten Kanal wird dieser standardmäßig verwendet.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost erfordert das Plugin).
- Ziele mit Kanalpräfix (zum Beispiel `discord:channel:123`) lösen das
  zuständige Plugin ohne explizites `--channel` auf.

## Zielformate (`-t, --target`)

| Kanal               | Format                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, `<@id>`-Erwähnung oder eine reine numerische ID (wird als Kanal-ID behandelt)               |
| Google Chat         | `spaces/<spaceId>` oder `users/<userId>`                                                                     |
| iMessage            | Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`                                      |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` oder eine reine ID (wird als Kanal behandelt)                              |
| Matrix              | `@user:server`, `!room:server` oder `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), eine reine Konversations-ID oder `user:<aad-object-id>`             |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` oder eines dieser Formate mit vorangestelltem `signal:` |
| Slack               | `channel:<id>` oder `user:<id>` (eine reine ID wird als Kanal behandelt)                                          |
| Telegram            | Chat-ID, `@username` oder ein Forenthemenziel: `<chatId>:topic:<topicId>` (oder `--thread-id <topicId>`)     |
| WhatsApp            | E.164, Gruppen-JID (`...@g.us`) oder Kanal-/Newsletter-JID (`...@newsletter`)                                |

Suche nach Kanalnamen: Bei Providern mit einem Verzeichnis (Discord/Slack usw.) werden Namen
wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst. Bei einem Cache-Fehltreffer
wird auf eine Live-Verzeichnissuche zurückgegriffen, sofern der Provider diese unterstützt.

## Gemeinsame Flags

Jede Aktion akzeptiert: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Aktionen mit einem Ziel akzeptieren außerdem
`-t, --target <dest>`.

## SecretRef-Auflösung

`openclaw message` löst SecretRefs von Kanälen vor Ausführung der Aktion
mit möglichst engem Geltungsbereich auf:

- kanalbezogen, wenn `--channel` festgelegt ist (oder aus einem Ziel mit Präfix abgeleitet wird)
- kontobezogen, wenn zusätzlich `--account` festgelegt ist
- alle konfigurierten Kanäle, wenn keines von beiden festgelegt ist

Nicht aufgelöste SecretRefs nicht betroffener Kanäle blockieren eine gezielte Aktion niemals; eine
nicht aufgelöste SecretRef des ausgewählten Kanals/Kontos führt zu einem sicheren Abbruch der Aktion.

## Aktionen

### Kernfunktionen

| Aktion          | Kanäle                                                                                                        | Erforderlich                                                       | Hinweise                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` sowie eines von `--message`/`--media`/`--presentation` | Siehe unten [Senden](#send).                                                                                                                                                                                                                                                                               |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (wiederholbar)        | Siehe unten [Umfrage](#poll).                                                                                                                                                                                                                                                                               |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (erfordert `--emoji`; lassen Sie es weg, um eigene Reaktionen zu entfernen, sofern unterstützt, siehe [Reaktionen](/de/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Reaktionen in Signal-Gruppen erfordern `--target-author` oder `--target-author-uuid`. Nextcloud Talk fügt nur Reaktionen hinzu; `--remove` führt zu einem Fehler. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                             |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` liest einen bestimmten Zeitstempel; kombinieren Sie es mit `--thread-id`, um eine genaue Thread-Antwort abzurufen.                                                                                                     |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Telegram-Forenthreads verwenden `--thread-id`.                                                                                                                                                                                                                                                              |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` akzeptiert auch `--pinned-message-id` (Microsoft Teams: die Ressourcen-ID zum Anheften/Auflisten angehefteter Elemente, nicht die ID der Chatnachricht).                                                                                                                                                                                  |
| `pins` (Liste)   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: nur verfügbar, wenn die Verschlüsselung aktiviert ist und Verifizierungsaktionen zulässig sind.                                                                                                                                                                                                                |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (wiederholbar), `--author-id`, `--author-ids` (wiederholbar), `--limit`.                                                                                                                                                                                                           |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                |

### Senden

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: Bild/Audio/Video/Dokument anhängen (lokaler Pfad oder
  URL).
- `--presentation <json>`: gemeinsame Nutzlast mit `text`-, `context`-, `divider`-,
  `chart`-, `table`-, `buttons`- und `select`-Blöcken, die entsprechend den Fähigkeiten
  des jeweiligen Kanals gerendert werden. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation).
- `--delivery <json>`: allgemeine Zustellungspräferenzen, zum Beispiel `{"pin":
true}`. `--pin` ist eine Kurzform für angeheftete Zustellung, sofern der Kanal
  dies unterstützt.
- `--reply-to <id>`, `--thread-id <id>` (Telegram-Forenthema; Slack-Thread-
  Zeitstempel, dasselbe Feld wie `--reply-to`).
- `--force-document` (Telegram, WhatsApp): Bilder/GIFs/Videos als
  Dokumente senden, um die Komprimierung durch den Kanal zu vermeiden.
- `--silent` (Telegram, Discord): ohne Benachrichtigung senden.
- `--gif-playback` (nur WhatsApp): Videomedien als GIF-Wiedergabe behandeln.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Auswählen:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Genehmigen","value":"approve","style":"success"},{"label":"Ablehnen","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Auswählen:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Ja","value":"cmd:yes"},{"label":"Nein","value":"cmd:no"}]}]}'
```

Slack stellt unterstützte Diagrammblöcke nativ dar; andere Kanäle erhalten dieselben
Daten als lesbaren Text:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quartalsumsatz","categories":["Q1","Q2"],"series":[{"name":"Umsatz","values":[120,145]}],"xLabel":"Quartal"}]}'
```

Slack stellt auch explizite Tabellenblöcke nativ dar. Andere Kanäle erhalten die
Beschriftung und jede Zeile als deterministischen Text:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline-Bericht","blocks":[{"type":"table","caption":"Offene Pipeline","headers":["Konto","Phase","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Telegram-Mini-App-Schaltflächen verwenden `webApp` (`web_app` wird für älteres
JSON weiterhin geparst) und werden nur in privaten Chats zwischen einem Benutzer und dem Bot dargestellt:

```bash
openclaw message send --channel telegram --target 123456789 --message "App öffnen:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Starten","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Statusaktualisierung","blocks":[{"type":"text","text":"Build abgeschlossen"}]}'
```

### Umfrage

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: 2-12-mal wiederholen.
- `--poll-multi`: Mehrfachauswahl zulassen.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Mittagessen?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Mittagessen?" \
  --poll-option Pizza --poll-option Sushi
```

### Threads

- `thread create`: Kanäle Discord. Erforderlich: `--thread-name`, `--target`
  (Kanal-ID). Optional: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: Kanäle Discord. Erforderlich: `--guild-id`. Optional:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: Kanäle Discord. Erforderlich: `--target` (Thread-ID),
  `--message`. Optional: `--media`, `--reply-to`.

### Emojis

- `emoji list`: Discord (`--guild-id`), Slack (keine zusätzlichen Flags).
- `emoji upload`: Discord. Erforderlich: `--guild-id`, `--emoji-name`, `--media`.
  Optional: `--role-ids` (wiederholen).

### Sticker

- `sticker send`: Discord. Erforderlich: `--target`, `--sticker-id` (wiederholen).
  Optional: `--message`.
- `sticker upload`: Discord. Erforderlich: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Rollen, Kanäle, Sprache und Ereignisse (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: erforderlich `--guild-id`, `--event-name`, `--start-time`;
  optional `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id`; optional `--duration-min` oder
  `--until` (beide weglassen, um das Timeout aufzuheben), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Rundsendung

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Sendet eine Nutzlast an mehrere Ziele. `--targets` akzeptiert eine durch Leerzeichen getrennte
Liste. Verwenden Sie `--channel all`, um jeden konfigurierten Provider als Ziel auszuwählen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Agent-Versand](/de/tools/agent-send)
- [Nachrichtendarstellung](/de/plugins/message-presentation)
