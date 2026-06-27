---
read_when:
    - Gebruik van /steer of /tell terwijl er al een agent actief is
    - Vergelijking van de modi /steer en /queue
    - Beslissen of je de huidige run of een ACP-sessie wilt sturen
sidebarTitle: Steer
summary: Stuur een actieve run aan zonder de wachtrijmodus te wijzigen
title: Sturen
x-i18n:
    generated_at: "2026-06-27T18:30:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` probeert eerst begeleiding naar een al actieve uitvoering te sturen. Het is bedoeld voor momenten als
"pas deze uitvoering aan terwijl die nog bezig is". Als de huidige runtime
geen sturing kan accepteren, stuurt OpenClaw het bericht in plaats daarvan als
een normale prompt, in plaats van het te laten vallen.

## Huidige sessie

Gebruik `/steer` op hoofdniveau om de actieve uitvoering voor de huidige sessie te targeten:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Gedrag:

- Target alleen de actieve uitvoering van de huidige sessie.
- Werkt onafhankelijk van de `/queue`-modus van de sessie.
- Start een normale beurt met hetzelfde bericht wanneer de sessie inactief is of de
  actieve uitvoering geen sturing kan accepteren.
- Gebruikt het sturingspad van de actieve runtime, zodat het model de begeleiding ziet bij
  de volgende ondersteunde runtimegrens.

## Sturen versus wachtrij

`/queue steer` zorgt ervoor dat normale inkomende berichten proberen de actieve uitvoering te sturen wanneer
ze binnenkomen terwijl een uitvoering actief is. `/steer <message>` is een expliciete opdracht
die probeert het bericht van die opdracht in de actieve uitvoering te injecteren bij de volgende
ondersteunde runtimegrens, ongeacht de opgeslagen `/queue`-instelling. Wanneer
die injectie niet beschikbaar is, wordt het opdrachtvoorvoegsel verwijderd en gaat `<message>`
door als een normale prompt.

Gebruik:

- `/steer <message>` wanneer je de actieve uitvoering nu wilt sturen.
- `/queue steer` wanneer je wilt dat toekomstige normale berichten actieve uitvoeringen standaard
  sturen.
- `/queue collect` of `/queue followup` wanneer toekomstige normale berichten moeten wachten
  op een latere beurt in plaats van de actieve uitvoering te sturen.
- `/queue interrupt` wanneer het nieuwste bericht de actieve uitvoering moet vervangen
  in plaats van die te sturen.

Zie [Opdrachtenwachtrij](/nl/concepts/queue) en
[Sturingswachtrij](/nl/concepts/queue-steering) voor wachtrijmodi en sturingsgrenzen.

## Subagents

`/steer` op hoofdniveau target de actieve uitvoering van de huidige sessie. Subagents rapporteren
terug naar hun bovenliggende/aanvragende sessie; `/subagents` is alleen voor zichtbaarheid.

## ACP-sessies

Gebruik `/acp steer` wanneer het doel een ACP-harnesssessie is:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Zie [ACP-agents](/nl/tools/acp-agents) voor ACP-sessieselectie en runtimegedrag.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Opdrachtenwachtrij](/nl/concepts/queue)
- [Sturingswachtrij](/nl/concepts/queue-steering)
- [Subagents](/nl/tools/subagents)
