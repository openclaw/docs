---
read_when:
    - Je wilt contactpersonen/groepen/eigen id's voor een kanaal opzoeken
    - Je ontwikkelt een kanaaldirectoryadapter
summary: CLI-referentie voor `openclaw directory` (zelf, peers, groepen)
title: Map
x-i18n:
    generated_at: "2026-05-02T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Directory-opzoekingen voor kanalen die dit ondersteunen (contacten/peers, groepen en “me”).

## Algemene flags

- `--channel <name>`: kanaal-id/alias (vereist wanneer meerdere kanalen zijn geconfigureerd; automatisch wanneer er maar één is geconfigureerd)
- `--account <id>`: account-id (standaard: kanaalstandaard)
- `--json`: JSON uitvoeren

## Opmerkingen

- `directory` is bedoeld om je te helpen id's te vinden die je in andere opdrachten kunt plakken (vooral `openclaw message send --target ...`).
- Voor veel kanalen zijn resultaten gebaseerd op configuratie (toestemmingslijsten / geconfigureerde groepen) in plaats van op een live providerdirectory.
- Geïnstalleerde kanaalplugins kunnen directory-ondersteuning nog steeds weglaten; in dat geval meldt de opdracht de niet-ondersteunde directorybewerking in plaats van de plugin opnieuw te installeren.
- De standaarduitvoer is `id` (en soms `name`), gescheiden door een tab; gebruik `--json` voor scripting.

## Resultaten gebruiken met `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-indelingen (per kanaal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (groep), `120363123456789@newsletter` (uitgaand doel voor Channel/Newsletter)
- Telegram: `@username` of numerieke chat-id; groepen zijn numerieke id's
- Slack: `user:U…` en `channel:C…`
- Discord: `user:<id>` en `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, of `#alias:server`
- Microsoft Teams (plugin): `user:<id>` en `conversation:<id>`
- Zalo (plugin): gebruikers-id (Bot API)
- Zalo Personal / `zalouser` (plugin): thread-id (DM/groep) van `zca` (`me`, `friend list`, `group list`)

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
