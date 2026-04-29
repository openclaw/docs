---
read_when:
    - Je wilt een systeemevent in de wachtrij plaatsen zonder een Cron-taak aan te maken
    - Je moet Heartbeat inschakelen of uitschakelen
    - Je wilt vermeldingen voor systeemaanwezigheid inspecteren
summary: CLI-referentie voor `openclaw system` (systeemgebeurtenissen, Heartbeat, aanwezigheid)
title: Systeem
x-i18n:
    generated_at: "2026-04-29T22:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Helpers op systeemniveau voor de Gateway: systeemgebeurtenissen in de wachtrij plaatsen, Heartbeats beheren,
en aanwezigheid bekijken.

Alle `system`-subopdrachten gebruiken Gateway-RPC en accepteren de gedeelde clientvlaggen:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Algemene opdrachten

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Plaats een systeemgebeurtenis in de wachtrij van de **main**-sessie. De volgende Heartbeat injecteert
deze als een `System:`-regel in de prompt. Gebruik `--mode now` om de Heartbeat
direct te activeren; `next-heartbeat` wacht op de volgende geplande tik.

Vlaggen:

- `--text <text>`: verplichte tekst voor de systeemgebeurtenis.
- `--mode <mode>`: `now` of `next-heartbeat` (standaard).
- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## `system heartbeat last|enable|disable`

Heartbeat-besturing:

- `last`: toon de laatste Heartbeat-gebeurtenis.
- `enable`: schakel Heartbeats weer in (gebruik dit als ze waren uitgeschakeld).
- `disable`: pauzeer Heartbeats.

Vlaggen:

- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## `system presence`

Geef de huidige systeemaanwezigheidsitems weer die de Gateway kent (nodes,
instanties en vergelijkbare statusregels).

Vlaggen:

- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## Opmerkingen

- Vereist een actieve Gateway die bereikbaar is via je huidige configuratie (lokaal of extern).
- Systeemgebeurtenissen zijn tijdelijk en blijven niet behouden na herstarts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
