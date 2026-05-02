---
read_when:
    - Sie möchten Kontakte/Gruppen/eigene IDs für einen Kanal nachschlagen
    - Sie entwickeln einen Channel-Directory-Adapter
summary: CLI-Referenz für `openclaw directory` (selbst, Peers, Gruppen)
title: Verzeichnis
x-i18n:
    generated_at: "2026-05-02T20:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Verzeichnissuchen für Kanäle, die sie unterstützen (Kontakte/Peers, Gruppen und „me“).

## Allgemeine Flags

- `--channel <name>`: Kanal-ID/Alias (erforderlich, wenn mehrere Kanäle konfiguriert sind; automatisch, wenn nur einer konfiguriert ist)
- `--account <id>`: Konto-ID (Standard: Kanalstandard)
- `--json`: JSON ausgeben

## Hinweise

- `directory` soll Ihnen helfen, IDs zu finden, die Sie in andere Befehle einfügen können (insbesondere `openclaw message send --target ...`).
- Bei vielen Kanälen basieren die Ergebnisse auf der Konfiguration (Allowlisten / konfigurierte Gruppen) statt auf einem Live-Provider-Verzeichnis.
- Installierte Kanal-Plugins können die Verzeichnisunterstützung dennoch auslassen; in diesem Fall meldet der Befehl die nicht unterstützte Verzeichnisoperation, statt das Plugin neu zu installieren.
- Die Standardausgabe ist `id` (und manchmal `name`), getrennt durch einen Tabulator; verwenden Sie `--json` für Skripting.

## Ergebnisse mit `message send` verwenden

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-Formate (nach Kanal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (Gruppe), `120363123456789@newsletter` (ausgehendes Ziel für Kanal/Newsletter)
- Telegram: `@username` oder numerische Chat-ID; Gruppen sind numerische IDs
- Slack: `user:U…` und `channel:C…`
- Discord: `user:<id>` und `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` oder `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` und `conversation:<id>`
- Zalo (Plugin): Benutzer-ID (Bot-API)
- Zalo Personal / `zalouser` (Plugin): Thread-ID (DM/Gruppe) aus `zca` (`me`, `friend list`, `group list`)

## Selbst ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (Kontakte/Benutzer)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Gruppen

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
