---
read_when:
    - Je wilt een systeemgebeurtenis in de wachtrij plaatsen zonder een Cron-taak te maken
    - Je moet Heartbeats in- of uitschakelen
    - Je wilt vermeldingen over systeemaanwezigheid inspecteren
summary: CLI-referentie voor `openclaw system` (systeemgebeurtenissen, Heartbeat, aanwezigheid)
title: Systeem
x-i18n:
    generated_at: "2026-05-11T20:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

Hulpmiddelen op systeemniveau voor de Gateway: systeemgebeurtenissen in de wachtrij plaatsen, Heartbeats beheren,
en aanwezigheid bekijken.

Alle `system`-subcommando's gebruiken Gateway-RPC en accepteren de gedeelde clientvlaggen:

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

Plaatst standaard een systeemgebeurtenis in de wachtrij op de **hoofd**sessie. De volgende Heartbeat
injecteert deze als een `System:`-regel in de prompt. Gebruik `--mode now` om
de Heartbeat onmiddellijk te activeren; `next-heartbeat` wacht op de volgende geplande tik.

Geef `--session-key` door om een specifieke sessie te targeten (bijvoorbeeld om een
voltooiing van een async-taak terug te sturen naar het kanaal dat deze heeft gestart).

> **Timing-uitzondering met `--session-key`:** wanneer `--session-key` is opgegeven,
> valt `--mode next-heartbeat` terug naar een onmiddellijke gerichte wake in plaats van
> te wachten op de volgende geplande tik. Gerichte wakes gebruiken Heartbeat-intentie
> `immediate`, zodat ze de not-due-gate van de runner omzeilen die anders
> een wake met `event`-intentie zou uitstellen (en feitelijk laten vallen). Als je vertraagde
> levering wilt, laat `--session-key` dan weg zodat de gebeurtenis op de hoofdsessie terechtkomt en
> meelift op de volgende reguliere Heartbeat.

Vlaggen:

- `--text <text>`: vereiste tekst voor de systeemgebeurtenis.
- `--mode <mode>`: `now` of `next-heartbeat` (standaard).
- `--session-key <sessionKey>`: optioneel; target een specifieke agentsessie
  in plaats van de hoofdsessie van de agent. Sleutels die niet bij de
  opgeloste agent horen, vallen terug naar de hoofdsessie van de agent.
- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## `system heartbeat last|enable|disable`

Heartbeat-beheer:

- `last`: toon de laatste Heartbeat-gebeurtenis.
- `enable`: schakel Heartbeats weer in (gebruik dit als ze waren uitgeschakeld).
- `disable`: pauzeer Heartbeats.

Vlaggen:

- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## `system presence`

Maak een lijst van de huidige systeemaanwezigheidsitems die de Gateway kent (nodes,
instanties en vergelijkbare statusregels).

Vlaggen:

- `--json`: machineleesbare uitvoer.
- `--url`, `--token`, `--timeout`, `--expect-final`: gedeelde Gateway-RPC-vlaggen.

## Opmerkingen

- Vereist een draaiende Gateway die bereikbaar is via je huidige configuratie (lokaal of remote).
- Systeemgebeurtenissen zijn tijdelijk en blijven niet behouden na herstarts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
