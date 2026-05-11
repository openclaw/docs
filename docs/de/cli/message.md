---
read_when:
    - Nachrichten-CLI-Aktionen hinzufügen oder ändern
    - Verhalten ausgehender Kanäle ändern
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-05-11T20:26:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 12ae0e32e86a87076e795cbb18e34d9a37797323f805f4edbd4351e73dbdac46
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Ein einzelner ausgehender Befehl zum Senden von Nachrichten und Channel-Aktionen
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Verwendung

```
openclaw message <subcommand> [flags]
```

Channel-Auswahl:

- `--channel` ist erforderlich, wenn mehr als ein Channel konfiguriert ist.
- Wenn genau ein Channel konfiguriert ist, wird er zum Standard.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost erfordert Plugin)
- `openclaw message` löst den ausgewählten Channel zu seinem zugehörigen Plugin auf, wenn `--channel` oder ein Ziel mit Channel-Präfix vorhanden ist; andernfalls lädt es konfigurierte Channel-Plugins zur Ableitung des Standard-Channels.

Zielformate (`--target`):

- WhatsApp: E.164, Gruppen-JID oder WhatsApp-Channel-/Newsletter-JID (`...@newsletter`)
- Telegram: Chat-ID, `@username` oder Forumsthemen-Ziel (`-1001234567890:topic:42` oder `--thread-id 42`)
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Erwähnung; rohe numerische IDs werden als Channels behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (rohe Channel-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (bloße IDs werden als Channels behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namensauflösung:

- Für unterstützte Provider (Discord/Slack/usw.) werden Channel-Namen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Fehltreffer versucht OpenClaw eine Live-Verzeichnissuche, wenn der Provider sie unterstützt.

## Häufige Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Ziel-Channel oder Benutzer für Senden/Abrufen/Lesen/usw.)
- `--targets <name>` (wiederholen; nur Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Channel-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung ist nach Möglichkeit auf das aktive Aktionsziel beschränkt:
  - Channel-bezogen, wenn `--channel` gesetzt ist (oder aus Zielen mit Präfix wie `discord:...` abgeleitet)
  - Account-bezogen, wenn `--account` gesetzt ist (Channel-Globals + ausgewählte Account-Oberflächen)
  - wenn `--account` ausgelassen wird, erzwingt OpenClaw keinen `default`-Account-SecretRef-Scope
- Nicht aufgelöste SecretRefs auf nicht zugehörigen Channels blockieren eine zielgerichtete Nachrichtenaktion nicht.
- Wenn der SecretRef des ausgewählten Channels/Accounts nicht aufgelöst ist, schlägt der Befehl für diese Aktion sicher geschlossen fehl.

## Aktionen

### Kern

- `send`
  - Channels: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target` sowie `--message`, `--media` oder `--presentation`
  - Optional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gemeinsame Präsentations-Payloads: `--presentation` sendet semantische Blöcke (`text`, `context`, `divider`, `buttons`, `select`), die der Kern über die deklarierten Fähigkeiten des ausgewählten Channels rendert. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation).
  - Generische Zustellungspräferenzen: `--delivery` akzeptiert Zustellungshinweise wie `{ "pin": true }`; `--pin` ist eine Kurzform für angeheftete Zustellung, wenn der Channel sie unterstützt.
  - Nur Telegram: `--force-document` (Bilder, GIFs und Videos als Dokumente senden, um Telegram-Komprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forumsthemen-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`; WhatsApp-Channels/-Newsletter werden mit ihrer nativen `@newsletter`-JID adressiert.

- `poll`
  - Channels: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholen)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Channels: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (`--emoji` auslassen, um eigene Reaktionen zu löschen, wo unterstützt; siehe /tools/reactions)
  - Nur WhatsApp: `--participant`, `--from-me`
  - Signal-Gruppenreaktionen: `--target-author` oder `--target-author-uuid` erforderlich

- `reactions`
  - Channels: Discord/Google Chat/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Channels: Discord/Slack/Matrix
  - Erforderlich: `--target`
  - Optional: `--limit`, `--message-id`, `--before`, `--after`
  - Nur Slack: `--message-id` liest einen bestimmten Slack-Nachrichtenzeitstempel; mit `--thread-id` kombinieren, um eine genaue Thread-Antwort zu lesen.
  - Nur Discord: `--around`

- `edit`
  - Channels: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--message`, `--target`

- `delete`
  - Channels: Discord/Slack/Telegram/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pin` / `unpin`
  - Channels: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pins` (auflisten)
  - Channels: Discord/Slack/Matrix
  - Erforderlich: `--target`

- `permissions`
  - Channels: Discord/Matrix
  - Erforderlich: `--target`
  - Nur Matrix: verfügbar, wenn Matrix-Verschlüsselung aktiviert ist und Verifizierungsaktionen erlaubt sind

- `search`
  - Channels: Discord
  - Erforderlich: `--guild-id`, `--query`
  - Optional: `--channel-id`, `--channel-ids` (wiederholen), `--author-id`, `--author-ids` (wiederholen), `--limit`

### Threads

- `thread create`
  - Channels: Discord
  - Erforderlich: `--thread-name`, `--target` (Channel-ID)
  - Optional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Channels: Discord
  - Erforderlich: `--guild-id`
  - Optional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Channels: Discord
  - Erforderlich: `--target` (Thread-ID), `--message`
  - Optional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: keine zusätzlichen Flags

- `emoji upload`
  - Channels: Discord
  - Erforderlich: `--guild-id`, `--emoji-name`, `--media`
  - Optional: `--role-ids` (wiederholen)

### Sticker

- `sticker send`
  - Channels: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholen)
  - Optional: `--message`

- `sticker upload`
  - Channels: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Channels / Mitglieder / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` für Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Optional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; beide auslassen, um Timeout zu löschen)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` unterstützt auch `--reason`

### Broadcast

- `broadcast`
  - Channels: beliebiger konfigurierter Channel; verwenden Sie `--channel all`, um alle Provider anzusprechen
  - Erforderlich: `--targets <target...>`
  - Optional: `--message`, `--media`, `--dry-run`

## Beispiele

Eine Discord-Antwort senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Eine Nachricht mit semantischen Buttons senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Der Kern rendert dieselbe `presentation`-Payload je nach Channel-Fähigkeit in Discord-Komponenten, Slack-Blöcke, Telegram-Inline-Buttons, Mattermost-Props oder Teams-/Feishu-Karten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den vollständigen Vertrag und Fallback-Regeln.

Eine umfangreichere Präsentations-Payload senden:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Eine Discord-Umfrage erstellen:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Eine Telegram-Umfrage erstellen (automatisch schließen in 2 Minuten):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Eine proaktive Teams-Nachricht senden:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Eine Teams-Umfrage erstellen:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

In Slack reagieren:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

In einer Signal-Gruppe reagieren:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram-Inline-Buttons über generische Präsentation senden:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Eine Teams-Karte über generische Präsentation senden:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Ein Telegram-Bild als Dokument senden, um Komprimierung zu vermeiden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agent-Senden](/de/tools/agent-send)
