---
read_when:
    - CLI-Aktionen für Nachrichten hinzufügen oder ändern
    - Ausgehendes Channel-Verhalten ändern
summary: CLI-Referenz für `openclaw message` (Senden + Channel-Aktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-04-23T06:27:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Einzelner ausgehender Befehl zum Senden von Nachrichten und Channel-Aktionen
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Verwendung

```
openclaw message <subcommand> [flags]
```

Channel-Auswahl:

- `--channel` ist erforderlich, wenn mehr als ein Channel konfiguriert ist.
- Wenn genau ein Channel konfiguriert ist, wird er zum Standard.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost erfordert ein Plugin)

Zielformate (`--target`):

- WhatsApp: E.164 oder Gruppen-JID
- Telegram: Chat-ID oder `@username`
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Erwähnung; rohe numerische IDs werden als Channels behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (rohe Channel-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (einfache IDs werden als Channels behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namensauflösung:

- Bei unterstützten Anbietern (Discord/Slack/usw.) werden Channel-Namen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Fehlschlag versucht OpenClaw eine Live-Verzeichnisabfrage, wenn der Anbieter dies unterstützt.

## Häufige Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Ziel-Channel oder -Benutzer für send/poll/read/etc)
- `--targets <name>` (wiederholbar; nur für Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Channel-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung ist nach Möglichkeit auf das aktive Aktionsziel beschränkt:
  - channel-bezogen, wenn `--channel` gesetzt ist (oder aus präfixierten Zielen wie `discord:...` abgeleitet wird)
  - account-bezogen, wenn `--account` gesetzt ist (Channel-Globale + Oberflächen des ausgewählten Accounts)
  - wenn `--account` ausgelassen wird, erzwingt OpenClaw keinen `default`-Account-SecretRef-Bereich
- Nicht aufgelöste SecretRefs in nicht verwandten Channels blockieren keine gezielte Nachrichtenaktion.
- Wenn der SecretRef des ausgewählten Channels/Accounts nicht aufgelöst ist, schlägt der Befehl für diese Aktion fail-closed fehl.

## Aktionen

### Kern

- `send`
  - Channels: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target` sowie `--message`, `--media` oder `--presentation`
  - Optional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Geteilte Presentation-Payloads: `--presentation` sendet semantische Blöcke (`text`, `context`, `divider`, `buttons`, `select`), die der Kern über die deklarierten Fähigkeiten des ausgewählten Channels rendert. Siehe [Message Presentation](/de/plugins/message-presentation).
  - Generische Zustellungspräferenzen: `--delivery` akzeptiert Zustellungshinweise wie `{ "pin": true }`; `--pin` ist eine Kurzform für angeheftete Zustellung, wenn der Channel dies unterstützt.
  - Nur Telegram: `--force-document` (Bilder und GIFs als Dokumente senden, um Telegram-Komprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forum-Themen-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`

- `poll`
  - Channels: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholbar)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Channels: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (lassen Sie `--emoji` weg, um eigene Reaktionen zu löschen, wo unterstützt; siehe /tools/reactions)
  - Nur WhatsApp: `--participant`, `--from-me`
  - Signal-Gruppenreaktionen: `--target-author` oder `--target-author-uuid` erforderlich

- `reactions`
  - Channels: Discord/Google Chat/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Channels: Discord/Slack/Matrix
  - Erforderlich: `--target`
  - Optional: `--limit`, `--before`, `--after`
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
  - Optional: `--channel-id`, `--channel-ids` (wiederholbar), `--author-id`, `--author-ids` (wiederholbar), `--limit`

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
  - Optional: `--role-ids` (wiederholbar)

### Sticker

- `sticker send`
  - Channels: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholbar)
  - Optional: `--message`

- `sticker upload`
  - Channels: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Channels / Mitglieder / Sprache

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` für Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Ereignisse

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Optional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; beide weglassen, um das Timeout aufzuheben)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` unterstützt auch `--reason`

### Broadcast

- `broadcast`
  - Channels: jeder konfigurierte Channel; verwenden Sie `--channel all`, um alle Anbieter anzusprechen
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

Der Kern rendert dieselbe `presentation`-Payload je nach Channel-Fähigkeit in Discord-Komponenten, Slack-Blöcke, Telegram-Inline-Buttons, Mattermost-Props oder Teams-/Feishu-Karten. Siehe [Message Presentation](/de/plugins/message-presentation) für den vollständigen Vertrag und die Fallback-Regeln.

Eine umfangreichere Presentation-Payload senden:

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

Eine Telegram-Umfrage erstellen (automatisches Schließen nach 2 Minuten):

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

Telegram-Inline-Buttons über generische Presentation senden:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Eine Teams-Karte über generische Presentation senden:

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
