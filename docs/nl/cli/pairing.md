---
read_when:
    - Je gebruikt privéberichten in koppelingsmodus en moet afzenders goedkeuren
summary: CLI-referentie voor `openclaw pairing` (koppelingsverzoeken goedkeuren/weergeven)
title: Koppelen
x-i18n:
    generated_at: "2026-05-06T17:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Keur DM-koppelingsverzoeken goed of inspecteer ze (voor kanalen die koppeling ondersteunen).

Gerelateerd:

- Koppelingsflow: [Koppeling](/nl/channels/pairing)

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

Toon wachtende koppelingsverzoeken voor één kanaal.

Opties:

- `[channel]`: positionele kanaal-id
- `--channel <channel>`: expliciete kanaal-id
- `--account <accountId>`: account-id voor kanalen met meerdere accounts
- `--json`: machineleesbare uitvoer

Opmerkingen:

- Als meerdere kanalen met koppelingsondersteuning zijn geconfigureerd, moet je een kanaal opgeven, positioneel of met `--channel`.
- Extensiekanalen zijn toegestaan zolang de kanaal-id geldig is.

## `pairing approve`

Keur een wachtende koppelingscode goed en sta die afzender toe.

Gebruik:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` wanneer precies één kanaal met koppelingsondersteuning is geconfigureerd

Opties:

- `--channel <channel>`: expliciete kanaal-id
- `--account <accountId>`: account-id voor kanalen met meerdere accounts
- `--notify`: stuur een bevestiging terug naar de aanvrager op hetzelfde kanaal

Bootstrap voor eigenaar:

- Als `commands.ownerAllowFrom` leeg is wanneer je een koppelingscode goedkeurt, registreert OpenClaw de goedgekeurde afzender ook als de opdrachteigenaar, met een kanaalgebonden vermelding zoals `telegram:123456789`.
- Dit bootstrapt alleen de eerste eigenaar. Latere koppelingsgoedkeuringen vervangen of breiden `commands.ownerAllowFrom` niet uit.
- De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren, zoals `/diagnostics`, `/export-trajectory`, `/config` en exec-goedkeuringen.

## Opmerkingen

- Kanaalinvoer: geef die positioneel door (`pairing list telegram`) of met `--channel <channel>`.
- `pairing list` ondersteunt `--account <accountId>` voor kanalen met meerdere accounts.
- `pairing approve` ondersteunt `--account <accountId>` en `--notify`.
- Als slechts één kanaal met koppelingsondersteuning is geconfigureerd, is `pairing approve <code>` toegestaan.
- Als je een afzender hebt goedgekeurd voordat deze bootstrap bestond, voer dan `openclaw doctor` uit; dit waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd en toont de opdracht `openclaw config set commands.ownerAllowFrom ...` om dit te herstellen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanaalkoppeling](/nl/channels/pairing)
