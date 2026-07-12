---
read_when:
    - Je wilt snel de status van de actieve Gateway controleren
summary: CLI-referentie voor `openclaw health` (momentopname van de Gateway-status via RPC)
title: Status
x-i18n:
    generated_at: "2026-07-12T08:42:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Haal via WebSocket-RPC een momentopname van de status op uit de actieve Gateway (geen rechtstreekse kanaalsockets vanuit de CLI).

## Opties

| Vlag             | Standaard | Beschrijving                                                                                                             |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--json`         | `false`   | Druk machineleesbare JSON af in plaats van tekst.                                                                        |
| `--timeout <ms>` | `10000`   | Time-out voor de verbinding in milliseconden.                                                                            |
| `--verbose`      | `false`   | Dwingt een livecontrole af en breidt de uitvoer uit met alle geconfigureerde accounts en agents.                         |
| `--debug`        | `false`   | Alias voor `--verbose`.                                                                                                  |

Voorbeelden:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Gedrag

- Zonder `--verbose` kan de Gateway een momentopname uit de cache retourneren (maximaal 60 seconden actueel en ongewijzigd ten opzichte van de live runtime-status van het kanaal) en deze op de achtergrond vernieuwen voor de volgende aanroeper.
- `--verbose` dwingt een livecontrole af (accountcontroles per kanaal), toont verbindingsgegevens van de Gateway en breidt de voor mensen leesbare uitvoer uit met alle geconfigureerde accounts en agents in plaats van alleen de standaardagent.
- `--json` retourneert altijd de volledige momentopname: kanalen, controles per account, laadstatus van plugins, quarantainestatus van de context-engine, status van de cache voor modelprijzen, status van de eventloop en sessieopslag per agent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [`openclaw status`](/nl/cli/status) — lokale diagnose en kanaalcontroles zonder een volledige statusmomentopname
- [Gateway-status](/nl/gateway/health)
