---
read_when:
    - Je wilt contactpersonen/groepen/eigen id's voor een kanaal opzoeken
    - Je ontwikkelt een kanaaldirectory-adapter
summary: CLI-referentie voor `openclaw directory` (zelf, peers, groepen)
title: Map
x-i18n:
    generated_at: "2026-05-02T11:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Directory-zoekopdrachten voor kanalen die dit ondersteunen (contacten/peers, groepen en “me”).

## Algemene vlaggen

- `--channel <name>`: kanaal-id/alias (vereist wanneer meerdere kanalen zijn geconfigureerd; automatisch wanneer er maar één is geconfigureerd)
- `--account <id>`: account-id (standaard: kanaalstandaard)
- `--json`: JSON uitvoeren

## Opmerkingen

- `directory` is bedoeld om u te helpen ID’s te vinden die u in andere opdrachten kunt plakken (vooral `openclaw message send --target ...`).
- Voor veel kanalen zijn resultaten gebaseerd op configuratie (toestaanlijsten / geconfigureerde groepen) in plaats van op een live providerdirectory.
- Geïnstalleerde kanaalplugins kunnen directory-ondersteuning nog steeds weglaten; in dat geval meldt de opdracht de niet-ondersteunde directorybewerking in plaats van de Plugin opnieuw te installeren.
- Standaarduitvoer is `id` (en soms `name`) gescheiden door een tab; gebruik `--json` voor scripting.

## Resultaten gebruiken met `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-indelingen (per kanaal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (groep)
- Telegram: `@username` of numerieke chat-id; groepen zijn numerieke id’s
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
