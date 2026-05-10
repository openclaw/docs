---
read_when:
    - Je komt `openclaw flows` tegen in oudere documentatie of releaseopmerkingen
    - Je wilt een beknopte referentie voor TaskFlow-inspectie
summary: 'Doorverwijzing: flow-opdrachten staan onder `openclaw tasks flow`'
title: Stromen (doorverwijzing)
x-i18n:
    generated_at: "2026-05-10T19:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Er is geen top-level `openclaw flows`-commando. Persistente TaskFlow-inspectie bevindt zich onder `openclaw tasks flow`.

## Subcommando's

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subcommando | Beschrijving                | Argumenten / opties                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Geef bijgehouden TaskFlows weer.    | `--json` machinaal leesbare uitvoer; `--status <name>`-filter (zie statuswaarden hieronder). |
| `show`     | Toon één TaskFlow.         | `<lookup>` flow-id of owner key; `--json` machinaal leesbare uitvoer.                    |
| `cancel`   | Annuleer een actieve TaskFlow. | `<lookup>` flow-id of owner key.                                                      |

`<lookup>` accepteert een flow-id (geretourneerd door `list` / `show`) of de owner key van de flow (de stabiele identificatie die het eigenaarssubsysteem gebruikt om de flow te volgen).

### Statusfilterwaarden

`--status` bij `list` accepteert een van:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Voorbeelden

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Zie [TaskFlow](/nl/automation/taskflow) voor volledige TaskFlow-concepten en authoring. Zie [tasks CLI-referentie](/nl/cli/tasks) voor het bovenliggende `tasks`-commando.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Automatisering](/nl/automation)
- [TaskFlow](/nl/automation/taskflow)
