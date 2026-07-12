---
read_when:
    - Je komt `openclaw flows` tegen in oudere documentatie of releaseopmerkingen
    - U wilt een beknopte referentie voor TaskFlow-inspectie
summary: 'Omleiding: flow-opdrachten bevinden zich onder `openclaw tasks flow`'
title: Flows (omleiding)
x-i18n:
    generated_at: "2026-07-12T08:43:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Er is geen `openclaw flows`-opdracht op het hoogste niveau. Inspectie van duurzame TaskFlows vindt plaats onder `openclaw tasks flow`.

## Subopdrachten

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subopdracht | Beschrijving                   | Argumenten / opties                                                                            |
| ----------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `list`      | Geeft bijgehouden TaskFlows weer. | `--json` machineleesbare uitvoer; filter `--status <name>` (zie de statuswaarden hieronder). |
| `show`      | Toont één TaskFlow.            | `<lookup>` flow-id of eigenaarssleutel; `--json` machineleesbare uitvoer.                      |
| `cancel`    | Annuleert een actieve TaskFlow. | `<lookup>` flow-id of eigenaarssleutel.                                                        |

`<lookup>` accepteert een flow-id (geretourneerd door `list` / `show`) of de eigenaarssleutel van de flow (de stabiele identificatie die het verantwoordelijke subsysteem gebruikt om de flow bij te houden).

### Waarden voor het statusfilter

`--status` bij `list` accepteert een van de volgende waarden: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Voorbeelden

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Zie [TaskFlow](/nl/automation/taskflow) voor TaskFlow-concepten en het schrijven ervan. Zie de [CLI-referentie voor tasks](/nl/cli/tasks) voor de bovenliggende opdracht `tasks`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Automatisering](/nl/automation)
- [TaskFlow](/nl/automation/taskflow)
