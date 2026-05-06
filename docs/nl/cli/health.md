---
read_when:
    - Je wilt snel de status van de draaiende Gateway controleren
summary: CLI-referentie voor `openclaw health` (Gateway-gezondheidssnapshot via RPC)
title: Gezondheid
x-i18n:
    generated_at: "2026-05-06T09:05:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Haal health op van de actieve Gateway.

Opties:

- `--json`: machineleesbare uitvoer
- `--timeout <ms>`: verbindingstime-out in milliseconden (standaard `10000`)
- `--verbose`: uitgebreide logging
- `--debug`: alias voor `--verbose`

Voorbeelden:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Opmerkingen:

- Standaard vraagt `openclaw health` de actieve Gateway om de health-momentopname. Wanneer de
  Gateway al een recente gecachete momentopname heeft, kan deze die gecachete payload teruggeven en
  op de achtergrond vernieuwen.
- `--verbose` dwingt een live-probe af, toont Gateway-verbindingsdetails en breidt de
  voor mensen leesbare uitvoer uit over alle geconfigureerde accounts en agents.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-health](/nl/gateway/health)
