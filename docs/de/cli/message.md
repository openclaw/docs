---
read_when:
    - Hinzufügen oder Ändern von Nachrichten-CLI-Aktionen
    - Verhalten ausgehender Kanäle ändern
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-04-30T06:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Ein einzelner ausgehender Befehl zum Senden von Nachrichten und Kanalaktionen
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Verwendung

```
openclaw message <subcommand> [flags]
```

Kanalauswahl:

- `--channel` ist erforderlich, wenn mehr als ein Kanal konfiguriert ist.
- Wenn genau ein Kanal konfiguriert ist, wird er zum Standard.
- Werte: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost erfordert ein Plugin)
- `openclaw message` löst den ausgewählten Kanal zu seinem besitzenden Plugin auf, wenn `--channel` oder ein Ziel mit Kanalpräfix vorhanden ist; andernfalls lädt es konfigurierte Kanal-Plugins zur Ableitung des Standardkanals.

Zielformate (`--target`):

- WhatsApp: E.164 oder Gruppen-JID
- Telegram: Chat-ID oder `@username`
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Erwähnung; rohe numerische IDs werden als Kanäle behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (rohe Kanal-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (bloße IDs werden als Kanäle behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namenssuche:

- Für unterstützte Provider (Discord/Slack/usw.) werden Kanalnamen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Fehltreffer versucht OpenClaw eine Live-Verzeichnissuche, wenn der Provider dies unterstützt.

## Häufige Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Zielkanal oder Benutzer für Senden/Abrufen/Lesen/usw.)
- `--targets <name>` (wiederholen; nur Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Kanal-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung ist nach Möglichkeit auf das aktive Aktionsziel beschränkt:
  - kanalbezogen, wenn `--channel` gesetzt ist (oder aus Zielen mit Präfix wie `discord:...` abgeleitet wird)
  - kontobezogen, wenn `--account` gesetzt ist (Kanal-Globals + ausgewählte Kontooberflächen)
  - wenn `--account` ausgelassen wird, erzwingt OpenClaw keinen `default`-Konto-SecretRef-Scope
- Nicht aufgelöste SecretRefs auf nicht verwandten Kanälen blockieren keine zielgerichtete Nachrichtenaktion.
- Wenn die SecretRef des ausgewählten Kanals/Kontos nicht aufgelöst ist, schlägt der Befehl für diese Aktion geschlossen fehl.

## Aktionen

### Kern

- `send`
  - Kanäle: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target` plus `--message`, `--media` oder `--presentation`
  - Optional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gemeinsame Präsentations-Payloads: `--presentation` sendet semantische Blöcke (`text`, `context`, `divider`, `buttons`, `select`), die der Kern über die deklarierten Fähigkeiten des ausgewählten Kanals rendert. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation).
  - Generische Zustellpräferenzen: `--delivery` akzeptiert Zustellhinweise wie `{ "pin": true }`; `--pin` ist eine Kurzform für angeheftete Zustellung, wenn der Kanal sie unterstützt.
  - Nur Telegram: `--force-document` (Bilder und GIFs als Dokumente senden, um Telegram-Komprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forumsthemen-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`

- `poll`
  - Kanäle: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholen)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanäle: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (`--emoji` auslassen, um eigene Reaktionen zu löschen, sofern unterstützt; siehe /tools/reactions)
  - Nur WhatsApp: `--participant`, `--from-me`
  - Signal-Gruppenreaktionen: `--target-author` oder `--target-author-uuid` erforderlich

- `reactions`
  - Kanäle: Discord/Google Chat/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--target`
  - Optional: `--limit`, `--before`, `--after`
  - Nur Discord: `--around`

- `edit`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--message`, `--target`

- `delete`
  - Kanäle: Discord/Slack/Telegram/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`

- `pins` (auflisten)
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--target`

- `permissions`
  - Kanäle: Discord/Matrix
  - Erforderlich: `--target`
  - Nur Matrix: verfügbar, wenn Matrix-Verschlüsselung aktiviert ist und Verifizierungsaktionen erlaubt sind

- `search`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--query`
  - Optional: `--channel-id`, `--channel-ids` (wiederholen), `--author-id`, `--author-ids` (wiederholen), `--limit`

### Threads

- `thread create`
  - Kanäle: Discord
  - Erforderlich: `--thread-name`, `--target` (Kanal-ID)
  - Optional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`
  - Optional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanäle: Discord
  - Erforderlich: `--target` (Thread-ID), `--message`
  - Optional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: keine zusätzlichen Flags

- `emoji upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--emoji-name`, `--media`
  - Optional: `--role-ids` (wiederholen)

### Sticker

- `sticker send`
  - Kanäle: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholen)
  - Optional: `--message`

- `sticker upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Kanäle / Mitglieder / Sprache

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

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; beide auslassen, um Timeout zu löschen)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` unterstützt auch `--reason`

### Broadcast

- `broadcast`
  - Kanäle: jeder konfigurierte Kanal; verwenden Sie `--channel all`, um alle Provider anzusprechen
  - Erforderlich: `--targets <target...>`
  - Optional: `--message`, `--media`, `--dry-run`

## Beispiele

Eine Discord-Antwort senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Eine Nachricht mit semantischen Schaltflächen senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Der Kern rendert dieselbe `presentation`-Payload je nach Kanalfähigkeit in Discord-Komponenten, Slack-Blöcke, Telegram-Inline-Schaltflächen, Mattermost-Props oder Teams/Feishu-Karten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) für den vollständigen Vertrag und die Fallback-Regeln.

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

Telegram-Inline-Schaltflächen über generische Präsentation senden:

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
- [Agent send](/de/tools/agent-send)
