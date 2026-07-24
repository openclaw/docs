---
read_when:
    - Sie möchten Kontakte, Gruppen oder die eigene ID für einen Kanal nachschlagen
    - Sie entwickeln einen Adapter für ein Kanalverzeichnis
summary: CLI-Referenz für `openclaw directory` (selbst, Peers, Gruppen)
title: Verzeichnis
x-i18n:
    generated_at: "2026-07-24T04:28:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Verzeichnissuchen für Kanäle, die diese unterstützen: Kontakte/Peers, Gruppen und „me“ (selbst).

Die Ergebnisse sind zum Einfügen in andere Befehle vorgesehen, insbesondere in `openclaw message send --target ...`.

## Allgemeine Flags

- `--channel <name>`: Kanal-ID/-Alias (erforderlich, wenn mehrere Kanäle konfiguriert sind; wird automatisch ausgewählt, wenn nur einer konfiguriert ist)
- `--account <id>`: Konto-ID (Standard: Kanalstandard)
- `--json`: Ausgabe als JSON

Die standardmäßige Ausgabe (ohne JSON) besteht aus `id` (und manchmal `name`), getrennt durch einen Tabulator.

## Hinweise

- Bei vielen Kanälen basieren die Ergebnisse auf der Konfiguration (Zulassungslisten/konfigurierte Gruppen) und nicht auf einem Live-Verzeichnis des Providers.
- Die WhatsApp-Gruppenauflistung erfolgt live. Gateway-Suchen verwenden die zugehörige Verbindung erneut; ein eigenständiger Befehl öffnet die verknüpfte Sitzung nur, wenn kein anderer Prozess dieses Konto verwaltet, und meldet andernfalls, dass Live-Gruppen nicht verfügbar sind.
- Ein bereits installiertes Kanal-Plugin unterstützt möglicherweise keine Verzeichnisse. In diesem Fall meldet der Befehl den nicht unterstützten Vorgang; er versucht nicht, das Plugin neu zu installieren oder zu aktualisieren, um Unterstützung hinzuzufügen.

## Ergebnisse mit `message send` verwenden

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-Formate nach Kanal

| Kanal                               | Format der Ziel-ID                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (Direktnachricht), `1234567890-1234567890@g.us` (Gruppe), `120363123456789@newsletter` (Kanal/Newsletter, nur ausgehend) |
| Signal                              | Konfigurierte Aliasse werden in E.164-/UUID-Ziele für Direktnachrichten oder `group:<id>`-Gruppenziele aufgelöst |
| Telegram                            | `@username` oder numerische Chat-ID; Gruppen verwenden numerische IDs |
| Slack                               | `user:U…` und `channel:C…` |
| Discord                             | `user:<id>` und `channel:<id>` |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` oder `#alias:server` |
| Microsoft Teams (Plugin)            | `user:<id>` und `conversation:<id>` |
| Zalo (Plugin)                       | Benutzer-ID (Bot API) |
| Zalo Personal / `zalouser` (Plugin) | Thread-ID (Direktnachricht/Gruppe), aus `zca` (`me`, `friend list`, `group list`) |

## Selbst („me“)

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
