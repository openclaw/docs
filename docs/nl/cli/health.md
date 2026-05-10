---
read_when:
    - Je wilt snel de gezondheidsstatus van de draaiende Gateway controleren
summary: CLI-referentie voor `openclaw health` (momentopname van Gateway-status via RPC)
title: Gezondheid
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Haal de status op van de actieve Gateway.

## Opties

| Vlag             | Standaard | Beschrijving                                                               |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `--json`         | `false`   | Druk machineleesbare JSON af in plaats van tekst.                          |
| `--timeout <ms>` | `10000`   | Verbindingstime-out in milliseconden.                                      |
| `--verbose`      | `false`   | Uitgebreide logging. Forceert een live probe en breidt uitvoer per agent uit. |
| `--debug`        | `false`   | Alias voor `--verbose`.                                                    |

Voorbeelden:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Opmerkingen:

- Standaard vraagt `openclaw health` de actieve gateway om de health-snapshot. Wanneer de
  gateway al een recente gecachte snapshot heeft, kan deze die gecachte payload retourneren en
  op de achtergrond vernieuwen.
- `--verbose` forceert een live probe, drukt verbindingsdetails van de gateway af en breidt de
  menselijk leesbare uitvoer uit over alle geconfigureerde accounts en agents.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-status](/nl/gateway/health)
