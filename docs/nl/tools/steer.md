---
read_when:
    - /steer of /tell gebruiken terwijl er al een agent actief is
    - /steer vergelijken met /queue-modi
    - Bepalen of de huidige uitvoering of een ACP-sessie moet worden bijgestuurd
sidebarTitle: Steer
summary: Stuur een actieve run bij zonder de wachtrijmodus te wijzigen
title: Bijsturen
x-i18n:
    generated_at: "2026-07-12T09:31:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` probeert eerst instructies naar een al actieve uitvoering te sturen. Het is bedoeld voor
momenten waarop u „deze uitvoering wilt bijsturen terwijl deze nog bezig is”. Als de huidige runtime
geen bijsturing kan verwerken, verzendt OpenClaw het bericht in plaats daarvan als een normale prompt,
zodat het niet verloren gaat.

## Huidige sessie

Gebruik `/steer` op het hoogste niveau om de actieve uitvoering voor de huidige sessie aan te sturen:

```text
/steer geef de voorkeur aan de kleinere patch en houd de tests gericht
/tell vat samen voordat je de volgende toolaanroep uitvoert
```

Gedrag:

- Richt zich uitsluitend op de actieve uitvoering van de huidige sessie.
- Werkt onafhankelijk van de `/queue`-modus van de sessie.
- Start een normale beurt met hetzelfde bericht wanneer de sessie inactief is of de
  actieve uitvoering geen bijsturing kan verwerken.
- Gebruikt het bijsturingspad van de actieve runtime, zodat het model de instructies bij
  de volgende ondersteunde runtimegrens ontvangt.

## Bijsturen versus wachtrij

`/queue steer` zorgt ervoor dat normale inkomende berichten de actieve uitvoering proberen bij te sturen wanneer
ze binnenkomen terwijl een uitvoering actief is. `/steer <message>` is een expliciete opdracht
die probeert het bericht van die opdracht bij de volgende ondersteunde runtimegrens in de actieve
uitvoering te injecteren, ongeacht de opgeslagen `/queue`-instelling. Wanneer
die injectie niet beschikbaar is, wordt het opdrachtvoorvoegsel verwijderd en gaat `<message>`
verder als een normale prompt.

Gebruik:

- `/steer <message>` wanneer u de actieve uitvoering direct wilt bijsturen.
- `/queue steer` wanneer u wilt dat toekomstige normale berichten actieve uitvoeringen
  standaard bijsturen.
- `/queue collect` of `/queue followup` wanneer toekomstige normale berichten op
  een latere beurt moeten wachten in plaats van de actieve uitvoering bij te sturen.
- `/queue interrupt` wanneer het nieuwste bericht de actieve uitvoering moet vervangen
  in plaats van deze bij te sturen.

Zie voor wachtrijmodi en bijsturingsgrenzen [Opdrachtwachtrij](/nl/concepts/queue) en
[Bijsturingswachtrij](/nl/concepts/queue-steering).

## Subagents

`/steer` op het hoogste niveau richt zich op de actieve uitvoering van de huidige sessie. Subagents rapporteren
terug aan hun bovenliggende/aanvragende sessie; `/subagents` is uitsluitend bedoeld voor inzicht.

## ACP-sessies

Gebruik `/acp steer` wanneer het doel een ACP-harnesssessie is:

```text
/acp steer --session agent:main:acp:codex maak de reproductie nauwkeuriger
```

Zie [ACP-agents](/nl/tools/acp-agents) voor de selectie van ACP-sessies en het
runtimegedrag.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Opdrachtwachtrij](/nl/concepts/queue)
- [Bijsturingswachtrij](/nl/concepts/queue-steering)
- [Subagents](/nl/tools/subagents)
