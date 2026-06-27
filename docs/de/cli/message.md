---
read_when:
    - Message-CLI-Aktionen hinzufügen oder ändern
    - Ausgehendes Kanalverhalten ändern
summary: CLI-Referenz für `openclaw message` (Senden + Kanalaktionen)
title: Nachricht
x-i18n:
    generated_at: "2026-06-27T17:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
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
- `openclaw message` löst den ausgewählten Kanal zum zugehörigen Plugin auf, wenn `--channel` oder ein Ziel mit Kanalpräfix vorhanden ist; andernfalls lädt es konfigurierte Kanal-Plugins, um den Standardkanal abzuleiten.

Zielformate (`--target`):

- WhatsApp: E.164, Gruppen-JID oder WhatsApp-Kanal-/Newsletter-JID (`...@newsletter`)
- Telegram: Chat-ID, `@username` oder Forumsthema-Ziel (`-1001234567890:topic:42` oder `--thread-id 42`)
- Discord: `channel:<id>` oder `user:<id>` (oder `<@id>`-Erwähnung; rohe numerische IDs werden als Kanäle behandelt)
- Google Chat: `spaces/<spaceId>` oder `users/<userId>`
- Slack: `channel:<id>` oder `user:<id>` (rohe Kanal-ID wird akzeptiert)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` oder `@username` (alleinstehende IDs werden als Kanäle behandelt)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` oder `username:<name>`/`u:<name>`
- iMessage: Handle, `chat_id:<id>`, `chat_guid:<guid>` oder `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` oder `#alias:server`
- Microsoft Teams: Konversations-ID (`19:...@thread.tacv2`) oder `conversation:<id>` oder `user:<aad-object-id>`

Namenssuche:

- Für unterstützte Provider (Discord/Slack/usw.) werden Kanalnamen wie `Help` oder `#help` über den Verzeichnis-Cache aufgelöst.
- Bei einem Cache-Fehlschlag versucht OpenClaw eine Live-Verzeichnissuche, wenn der Provider dies unterstützt.

## Häufig verwendete Flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (Zielkanal oder Benutzer für Senden/Abrufen/Lesen/usw.)
- `--targets <name>` (wiederholbar; nur Broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef-Verhalten

- `openclaw message` löst unterstützte Kanal-SecretRefs auf, bevor die ausgewählte Aktion ausgeführt wird.
- Die Auflösung ist nach Möglichkeit auf das aktive Aktionsziel beschränkt:
  - kanalbezogen, wenn `--channel` gesetzt ist (oder aus Zielen mit Präfix wie `discord:...` abgeleitet wird)
  - accountbezogen, wenn `--account` gesetzt ist (globale Kanalwerte + ausgewählte Account-Oberflächen)
  - wenn `--account` ausgelassen wird, erzwingt OpenClaw keinen SecretRef-Bereich für einen `default`-Account
- Nicht aufgelöste SecretRefs auf nicht verwandten Kanälen blockieren keine zielgerichtete Nachrichtenaktion.
- Wenn der SecretRef des ausgewählten Kanals/Accounts nicht aufgelöst ist, schlägt der Befehl für diese Aktion fail-closed fehl.

## Aktionen

### Kern

- `send`
  - Kanäle: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Erforderlich: `--target` sowie `--message`, `--media` oder `--presentation`
  - Optional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Gemeinsame Präsentations-Payloads: `--presentation` sendet semantische Blöcke (`text`, `context`, `divider`, `buttons`, `select`), die der Kern über die deklarierten Fähigkeiten des ausgewählten Kanals rendert. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation).
  - Allgemeine Zustellungspräferenzen: `--delivery` akzeptiert Zustellungshinweise wie `{ "pin": true }`; `--pin` ist eine Kurzform für angeheftete Zustellung, wenn der Kanal sie unterstützt.
  - Telegram + WhatsApp: `--force-document` (Bilder, GIFs und Videos als Dokumente senden, um Kanalkomprimierung zu vermeiden)
  - Nur Telegram: `--thread-id` (Forumsthema-ID)
  - Nur Slack: `--thread-id` (Thread-Zeitstempel; `--reply-to` verwendet dasselbe Feld)
  - Telegram + Discord: `--silent`
  - Nur WhatsApp: `--gif-playback`; WhatsApp-Kanäle/-Newsletter werden mit ihrer nativen `@newsletter`-JID adressiert.

- `poll`
  - Kanäle: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Erforderlich: `--target`, `--poll-question`, `--poll-option` (wiederholbar)
  - Optional: `--poll-multi`
  - Nur Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Nur Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanäle: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Hinweis: `--remove` erfordert `--emoji` (`--emoji` weglassen, um eigene Reaktionen zu löschen, sofern unterstützt; siehe /tools/reactions)
  - Nur WhatsApp: `--participant`, `--from-me`
  - Signal-Gruppenreaktionen: `--target-author` oder `--target-author-uuid` erforderlich
  - Nextcloud Talk: nur Hinzufügen von Reaktionen; `--remove` wird mit einem klaren Fehler abgelehnt (siehe /tools/reactions)

- `reactions`
  - Kanäle: Discord/Google Chat/Slack/Matrix
  - Erforderlich: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Kanäle: Discord/Slack/Matrix
  - Erforderlich: `--target`
  - Optional: `--limit`, `--message-id`, `--before`, `--after`
  - Nur Slack: `--message-id` liest einen bestimmten Slack-Nachrichtenzeitstempel; mit `--thread-id` kombinieren, um eine exakte Thread-Antwort zu lesen.
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
  - Optional: `--channel-id`, `--channel-ids` (wiederholbar), `--author-id`, `--author-ids` (wiederholbar), `--limit`

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
  - Optional: `--role-ids` (wiederholbar)

### Sticker

- `sticker send`
  - Kanäle: Discord
  - Erforderlich: `--target`, `--sticker-id` (wiederholbar)
  - Optional: `--message`

- `sticker upload`
  - Kanäle: Discord
  - Erforderlich: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rollen / Kanäle / Mitglieder / Sprachfunktionen

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

- `timeout`: `--guild-id`, `--user-id` (optional `--duration-min` oder `--until`; lassen Sie beides weg, um das Timeout aufzuheben)
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

Eine Nachricht mit semantischen Buttons senden:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Der Core rendert dieselbe `presentation`-Payload je nach Kanalfähigkeit in Discord-Komponenten, Slack-Blöcke, Telegram-Inline-Buttons, Mattermost-Props oder Teams-/Feishu-Karten. Den vollständigen Vertrag und die Fallback-Regeln finden Sie unter [Nachrichtenpräsentation](/de/plugins/message-presentation).

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

Eine Telegram-Umfrage erstellen (automatisch nach 2 Minuten schließen):

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

Telegram-Inline-Buttons über die generische Präsentation senden:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Einen Telegram-Mini-App-Button über die generische Präsentation senden:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Telegram-Web-App-Buttons werden nur in privaten Chats zwischen einem Benutzer und
dem Bot unterstützt. Ältere JSON-Payloads mit `web_app` werden weiterhin geparst,
aber `webApp` ist das kanonische Präsentationsfeld.

Eine Teams-Karte über die generische Präsentation senden:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Ein Telegram- oder WhatsApp-Bild als Dokument senden, um Komprimierung zu vermeiden:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Agent senden](/de/tools/agent-send)
