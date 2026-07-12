---
read_when:
    - U wilt een systeemgebeurtenis in de wachtrij plaatsen zonder een Cron-taak aan te maken
    - Je moet heartbeats in- of uitschakelen
    - U wilt de aanwezigheidsvermeldingen van het systeem inspecteren
summary: CLI-referentie voor `openclaw system` (systeemgebeurtenissen, Heartbeat, aanwezigheid)
title: Systeem
x-i18n:
    generated_at: "2026-07-12T08:44:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Helpers op systeemniveau voor de Gateway: systeemgebeurtenissen in de wachtrij plaatsen, heartbeats beheren en aanwezigheid bekijken.

Alle `system`-subcommando's gebruiken Gateway-RPC en accepteren de gedeelde clientvlaggen:

| Vlag              | Standaard                             | Beschrijving                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` indien ingesteld | WebSocket-URL van de Gateway.                                                                                                                                                                                                                                       |
| `--token <token>` | geen                                  | Gateway-token (indien vereist).                                                                                                                                                                                                                                     |
| `--timeout <ms>`  | `30000`                               | RPC-time-out in milliseconden.                                                                                                                                                                                                                                      |
| `--expect-final`  | uit                                   | Wachten op het definitieve antwoord (agent).                                                                                                                                                                                                                         |
| `--json`          | uit                                   | JSON uitvoeren. `heartbeat last/enable/disable` en `system presence` drukken altijd de onbewerkte JSON-payload van RPC af, ongeacht deze vlag; `system event` gebruikt deze om te wisselen tussen JSON en een eenvoudige regel met `ok`. |

## Veelgebruikte commando's

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Plaatst standaard een systeemgebeurtenis in de wachtrij van de **hoofd**sessie. De volgende heartbeat voegt deze als een regel met `System:` in de prompt in. Gebruik `--mode now` om de heartbeat onmiddellijk te activeren; `next-heartbeat` (standaard) wacht op de volgende geplande cyclus.

Geef `--session-key` door om een specifieke sessie als doel te gebruiken, bijvoorbeeld om de voltooiing van een asynchrone taak terug te sturen naar het kanaal dat deze heeft gestart.

<Note>
**Timinguitzondering met `--session-key`:** wanneer `--session-key` wordt opgegeven, leidt `--mode next-heartbeat` tot een onmiddellijke gerichte activering in plaats van te wachten op de volgende geplande cyclus. Gerichte activeringen gebruiken de heartbeat-intentie `immediate`, zodat ze de nog-niet-aan-de-beurt-controle van de uitvoerder omzeilen, die anders een activering met de intentie `event` zou uitstellen (en feitelijk laten vervallen). Als je uitgestelde aflevering wilt, laat je `--session-key` weg, zodat de gebeurtenis in de hoofdsessie terechtkomt en met de volgende reguliere heartbeat wordt verwerkt.
</Note>

Vlaggen:

- `--text <text>`: vereiste tekst van de systeemgebeurtenis.
- `--mode <mode>`: `now` of `next-heartbeat` (standaard).
- `--session-key <sessionKey>`: optioneel; richt zich op een specifieke agentsessie in plaats van op de hoofdsessie van de agent. Sleutels die niet bij de gevonden agent horen, vallen terug op de hoofdsessie van de agent.

## `system heartbeat last|enable|disable`

- `last`: de laatste heartbeat-gebeurtenis weergeven.
- `enable`: heartbeats weer inschakelen (gebruik dit als ze waren uitgeschakeld).
- `disable`: heartbeats pauzeren.

## `system presence`

Geeft de huidige vermeldingen van systeemaanwezigheid weer die bij de Gateway bekend zijn (nodes, instanties en vergelijkbare statusregels).

## Opmerkingen

- Vereist een actieve Gateway die bereikbaar is via je huidige configuratie (lokaal of extern).
- Systeemgebeurtenissen zijn tijdelijk en blijven niet behouden na herstarts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
