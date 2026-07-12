---
read_when:
    - Je wilt contacten/groepen/eigen ID's voor een kanaal opzoeken
    - Je ontwikkelt een adapter voor de kanaaldirectory
summary: CLI-referentie voor `openclaw directory` (uzelf, peers, groepen)
title: Map
x-i18n:
    generated_at: "2026-07-12T08:44:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Adreslijstzoekopdrachten voor kanalen die deze ondersteunen: contacten/peers, groepen en 'mijzelf' (eigen identiteit).

De resultaten zijn bedoeld om in andere opdrachten te plakken, met name in `openclaw message send --target ...`.

## Algemene vlaggen

- `--channel <name>`: kanaal-id/-alias (vereist wanneer meerdere kanalen zijn geconfigureerd; automatisch geselecteerd wanneer er slechts één is geconfigureerd)
- `--account <id>`: account-id (standaard: standaardaccount van het kanaal)
- `--json`: uitvoer als JSON

De standaarduitvoer (niet-JSON) bestaat uit `id` (en soms `name`), gescheiden door een tab.

## Opmerkingen

- Voor veel kanalen zijn de resultaten gebaseerd op de configuratie (toegestane lijsten / geconfigureerde groepen) in plaats van op een live adreslijst van de provider.
- Een reeds geïnstalleerde kanaalplugin kan adreslijstondersteuning missen. In dat geval meldt de opdracht dat de bewerking niet wordt ondersteund; de plugin wordt niet opnieuw geïnstalleerd of bijgewerkt om ondersteuning toe te voegen.

## Resultaten gebruiken met `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-indelingen per kanaal

| Kanaal                              | Indeling doel-id                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (privébericht), `1234567890-1234567890@g.us` (groep), `120363123456789@newsletter` (kanaal/nieuwsbrief, alleen uitgaand) |
| Signal                              | Geconfigureerde aliassen worden omgezet naar E.164-/UUID-doelen voor privéberichten of groepsdoelen met `group:<id>`                   |
| Telegram                            | `@username` of numerieke chat-id; groepen gebruiken numerieke id's                                                                      |
| Slack                               | `user:U…` en `channel:C…`                                                                                                               |
| Discord                             | `user:<id>` en `channel:<id>`                                                                                                           |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` of `#alias:server`                                                                           |
| Microsoft Teams (plugin)            | `user:<id>` en `conversation:<id>`                                                                                                      |
| Zalo (plugin)                       | Gebruikers-id (Bot API)                                                                                                                 |
| Zalo Personal / `zalouser` (plugin) | Thread-id (privébericht/groep), afkomstig van `zca` (`me`, `friend list`, `group list`)                                                  |

## Eigen identiteit ('mijzelf')

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
