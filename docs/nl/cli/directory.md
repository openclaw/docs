---
read_when:
    - Je wilt contacten/groepen/eigen ID's voor een kanaal opzoeken
    - Je ontwikkelt een adapter voor de kanaaldirectory
summary: CLI-referentie voor `openclaw directory` (zelf, gelijken, groepen)
title: Map
x-i18n:
    generated_at: "2026-05-06T17:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

Directory-zoekacties voor kanalen die dit ondersteunen (contacten/peers, groepen en "me").

## Algemene vlaggen

- `--channel <name>`: kanaal-id/alias (vereist wanneer meerdere kanalen zijn geconfigureerd; automatisch wanneer er maar één is geconfigureerd)
- `--account <id>`: account-id (standaard: kanaalstandaard)
- `--json`: voer JSON uit

## Opmerkingen

- `directory` is bedoeld om je te helpen id's te vinden die je in andere commando's kunt plakken (vooral `openclaw message send --target ...`).
- Voor veel kanalen zijn resultaten gebaseerd op configuratie (allowlists / geconfigureerde groepen) in plaats van op een live providerdirectory.
- Geïnstalleerde kanaalplugins kunnen directory-ondersteuning nog steeds weglaten; in dat geval meldt het commando de niet-ondersteunde directorybewerking in plaats van de Plugin opnieuw te installeren.
- Standaarduitvoer is `id` (en soms `name`), gescheiden door een tab; gebruik `--json` voor scripts.

## Resultaten gebruiken met `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Id-indelingen (per kanaal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (groep), `120363123456789@newsletter` (uitgaand doel voor Channel/Newsletter)
- Telegram: `@username` of numerieke chat-id; groepen zijn numerieke id's
- Slack: `user:U…` en `channel:C…`
- Discord: `user:<id>` en `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, of `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` en `conversation:<id>`
- Zalo (Plugin): gebruikers-id (Bot API)
- Zalo Personal / `zalouser` (Plugin): thread-id (DM/groep) van `zca` (`me`, `friend list`, `group list`)

## Zelf ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (contacten/gebruikers)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groepen

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
