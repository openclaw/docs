---
read_when:
    - Je gebruikt DM's in de koppelingsmodus en moet afzenders goedkeuren
summary: CLI-referentie voor `openclaw pairing` (koppelingsverzoeken goedkeuren/weergeven)
title: Koppelen
x-i18n:
    generated_at: "2026-07-12T08:43:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Keur DM-koppelingsverzoeken goed of bekijk ze voor kanalen die koppeling ondersteunen (alleen chat-DM's; voor het koppelen van nodes/apparaten gebruikt u `openclaw devices`).

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

Toon openstaande koppelingsverzoeken voor één kanaal.

| Optie                   | Beschrijving                                      |
| ----------------------- | ------------------------------------------------- |
| `[channel]`             | positionele kanaal-id                             |
| `--channel <channel>`   | expliciete kanaal-id                              |
| `--account <accountId>` | account-id voor kanalen met meerdere accounts     |
| `--json`                | machineleesbare uitvoer                           |

Als meerdere kanalen zijn geconfigureerd die koppeling ondersteunen, geeft u een kanaal positioneel of met `--channel` op. Uitbreidingskanalen werken zolang de kanaal-id geldig is.

## `pairing approve`

Keur een openstaande koppelingscode goed en sta die afzender toe.

Gebruik:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` wanneer precies één kanaal is geconfigureerd dat koppeling ondersteunt

Opties: `--channel <channel>`, `--account <accountId>`, `--notify` (stuur via hetzelfde kanaal een bevestiging terug naar de aanvrager).

### Initiële eigenaar instellen

Als `commands.ownerAllowFrom` leeg is wanneer u een koppelingscode goedkeurt, registreert OpenClaw de goedgekeurde afzender ook als opdrachteigenaar met een kanaalspecifieke vermelding, zoals `telegram:123456789`. Hiermee wordt alleen de eerste eigenaar ingesteld; latere goedkeuringen van koppelingen vervangen of breiden `commands.ownerAllowFrom` nooit uit.

De opdrachteigenaar is het account van de menselijke beheerder dat opdrachten mag uitvoeren die uitsluitend voor de eigenaar bestemd zijn en gevaarlijke acties mag goedkeuren, zoals `/diagnostics`, `/export-trajectory`, `/config` en goedkeuringen voor uitvoering. Koppeling stelt een afzender alleen in staat met de agent te communiceren; op zichzelf verleent dit geen eigenaarsrechten buiten deze eenmalige initiële instelling.

Als u een afzender hebt goedgekeurd voordat deze initiële instelling bestond, voert u `openclaw doctor` uit. Dit waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd en toont de exacte opdracht `openclaw config set commands.ownerAllowFrom ...` om dit te verhelpen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanaalkoppeling](/nl/channels/pairing)
