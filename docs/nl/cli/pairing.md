---
read_when:
    - Je gebruikt privéberichten in koppelingsmodus en moet afzenders goedkeuren
summary: CLI-referentie voor `openclaw pairing` (koppelingsverzoeken goedkeuren/weergeven)
title: Koppelen
x-i18n:
    generated_at: "2026-04-29T22:34:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Keur DM-koppelingsverzoeken goed of inspecteer ze (voor kanalen die koppelen ondersteunen).

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

Toon openstaande koppelingsverzoeken voor één kanaal.

Opties:

- `[channel]`: positionele kanaal-id
- `--channel <channel>`: expliciete kanaal-id
- `--account <accountId>`: account-id voor kanalen met meerdere accounts
- `--json`: machineleesbare uitvoer

Opmerkingen:

- Als meerdere kanalen die koppeling ondersteunen zijn geconfigureerd, moet je een kanaal opgeven, positioneel of met `--channel`.
- Plugin-kanalen zijn toegestaan zolang de kanaal-id geldig is.

## `pairing approve`

Keur een openstaande koppelingscode goed en sta die afzender toe.

Gebruik:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` wanneer precies één kanaal dat koppeling ondersteunt is geconfigureerd

Opties:

- `--channel <channel>`: expliciete kanaal-id
- `--account <accountId>`: account-id voor kanalen met meerdere accounts
- `--notify`: stuur een bevestiging terug naar de aanvrager op hetzelfde kanaal

Bootstrap van eigenaar:

- Als `commands.ownerAllowFrom` leeg is wanneer je een koppelingscode goedkeurt, registreert OpenClaw de goedgekeurde afzender ook als de opdracht-eigenaar, met een kanaalgescoped item zoals `telegram:123456789`.
- Dit bootstrapt alleen de eerste eigenaar. Latere koppelingsgoedkeuringen vervangen of breiden `commands.ownerAllowFrom` niet uit.
- De opdracht-eigenaar is het menselijke operatoraccount dat eigenaar-opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren, zoals `/diagnostics`, `/export-trajectory`, `/config` en exec-goedkeuringen.

## Opmerkingen

- Kanaalinvoer: geef die positioneel door (`pairing list telegram`) of met `--channel <channel>`.
- `pairing list` ondersteunt `--account <accountId>` voor kanalen met meerdere accounts.
- `pairing approve` ondersteunt `--account <accountId>` en `--notify`.
- Als slechts één kanaal dat koppeling ondersteunt is geconfigureerd, is `pairing approve <code>` toegestaan.
- Als je een afzender hebt goedgekeurd voordat deze bootstrap bestond, voer dan `openclaw doctor` uit; deze waarschuwt wanneer geen opdracht-eigenaar is geconfigureerd en toont de opdracht `openclaw config set commands.ownerAllowFrom ...` om dit te herstellen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanaalkoppeling](/nl/channels/pairing)
