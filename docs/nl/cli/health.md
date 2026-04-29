---
read_when:
    - Je wilt snel de gezondheid van de draaiende Gateway controleren
summary: CLI-referentie voor `openclaw health` (Gateway-gezondheidssnapshot via RPC)
title: Gezondheid
x-i18n:
    generated_at: "2026-04-29T22:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Haalt de status op van de actieve Gateway.

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

- Standaard vraagt `openclaw health` de actieve Gateway om de statussnapshot. Wanneer de
  Gateway al een recente gecachete snapshot heeft, kan deze die gecachete payload retourneren en
  op de achtergrond vernieuwen.
- `--verbose` dwingt een livecontrole af, toont verbindingsdetails van de Gateway en breidt de
  leesbare uitvoer uit over alle geconfigureerde accounts en agents.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-status](/nl/gateway/health)
