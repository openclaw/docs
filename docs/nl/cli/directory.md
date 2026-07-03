---
read_when:
    - Je wilt contactpersonen/groepen/eigen ID's voor een kanaal opzoeken
    - Je ontwikkelt een adapter voor de kanaaldirectory
summary: CLI-referentie voor `openclaw directory` (zelf, peers, groepen)
title: Map
x-i18n:
    generated_at: "2026-07-03T15:34:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Directory-zoekopdrachten voor kanalen die dit ondersteunen (contacten/peers, groepen en "me").

## Algemene vlaggen

- `--channel <name>`: kanaal-id/alias (vereist wanneer meerdere kanalen zijn geconfigureerd; automatisch wanneer er maar één is geconfigureerd)
- `--account <id>`: account-id (standaard: kanaalstandaard)
- `--json`: JSON uitvoeren

## Opmerkingen

- `directory` is bedoeld om je te helpen ID's te vinden die je in andere opdrachten kunt plakken (vooral `openclaw message send --target ...`).
- Voor veel kanalen worden resultaten ondersteund door configuratie (allowlists / geconfigureerde groepen) in plaats van een live provider-directory.
- Geïnstalleerde kanaal-Plugins kunnen directory-ondersteuning nog steeds weglaten; in dat geval meldt de opdracht de niet-ondersteunde directorybewerking in plaats van de Plugin opnieuw te installeren.
- De standaarduitvoer is `id` (en soms `name`) gescheiden door een tab; gebruik `--json` voor scripts.

## Resultaten gebruiken met `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-indelingen (per kanaal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (groep), `120363123456789@newsletter` (uitgaand doel voor kanaal/nieuwsbrief)
- Signal: geconfigureerde aliassen worden omgezet naar E.164/UUID-DM-doelen of `group:<id>`-groepsdoelen
- Telegram: `@username` of numerieke chat-id; groepen zijn numerieke ID's
- Slack: `user:U…` en `channel:C…`
- Discord: `user:<id>` en `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, of `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` en `conversation:<id>`
- Zalo (Plugin): gebruikers-id (Bot API)
- Zalo Personal / `zalouser` (Plugin): thread-id (DM/groep) uit `zca` (`me`, `friend list`, `group list`)

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
