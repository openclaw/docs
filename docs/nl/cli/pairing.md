---
read_when:
    - Je gebruikt privéberichten in de koppelingsmodus en moet afzenders goedkeuren
summary: CLI-referentie voor `openclaw pairing` (koppelingsverzoeken goedkeuren/weergeven)
title: Koppelen
x-i18n:
    generated_at: "2026-07-16T15:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Keur DM-koppelingsverzoeken goed of inspecteer ze voor kanalen die koppeling ondersteunen (alleen chat-DM's; voor het koppelen van nodes/apparaten wordt `openclaw devices` gebruikt).

Gerelateerd: [Koppelingsproces](/nl/channels/pairing)

## Opdrachten

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Geef openstaande koppelingsverzoeken voor één kanaal weer.

| Optie                   | Beschrijving                              |
| ----------------------- | ----------------------------------------- |
| `[channel]`      | positionele kanaal-id                     |
| `--channel <channel>`      | expliciete kanaal-id                      |
| `--account <accountId>`      | account-id voor kanalen met meerdere accounts |
| `--json`      | machineleesbare uitvoer                   |

Als meerdere kanalen zijn geconfigureerd die koppeling ondersteunen, geef dan positioneel een kanaal door of gebruik `--channel`. Uitbreidingskanalen werken zolang de kanaal-id geldig is.

## `pairing approve`

Keur een openstaande koppelingscode goed en sta die afzender toe.

Gebruik:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` wanneer precies één kanaal is geconfigureerd dat koppeling ondersteunt

Opties: `--channel <channel>`, `--account <accountId>`, `--notify` (stuur via hetzelfde kanaal een bevestiging terug naar de aanvrager).

### Initiële eigenaar instellen

Als `commands.ownerAllowFrom` leeg is wanneer je een koppelingscode goedkeurt, registreert OpenClaw de goedgekeurde afzender ook als opdrachteigenaar, met een kanaalspecifieke vermelding zoals `telegram:123456789`. Hiermee wordt alleen de eerste eigenaar ingesteld; latere goedkeuringen van koppelingsverzoeken vervangen of breiden `commands.ownerAllowFrom` nooit uit.

De opdrachteigenaar is het account van de menselijke beheerder dat opdrachten mag uitvoeren die alleen voor de eigenaar bestemd zijn en gevaarlijke acties mag goedkeuren, zoals `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` en goedkeuringen voor uitvoeropdrachten. Door koppeling kan een afzender alleen met de agent communiceren; op zichzelf verleent dit geen eigenaarsrechten, behalve bij deze eenmalige initiële instelling.

Als je een afzender hebt goedgekeurd voordat deze initiële instelling bestond, voer dan `openclaw doctor` uit; deze opdracht waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd en toont de exacte opdracht `openclaw config set commands.ownerAllowFrom ...` om dit te verhelpen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanaalkoppeling](/nl/channels/pairing)
