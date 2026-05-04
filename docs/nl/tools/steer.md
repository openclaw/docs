---
read_when:
    - Gebruik van /steer of /tell terwijl er al een agent actief is
    - Vergelijking van /steer met /queue steer
    - Beslissen of je de huidige uitvoering, een subagent of een ACP-sessie moet bijsturen
sidebarTitle: Steer
summary: Stuur een actieve uitvoering bij zonder de wachtrijmodus te wijzigen
title: Sturen
x-i18n:
    generated_at: "2026-05-04T07:09:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` stuurt begeleiding naar een al actieve uitvoering. Het is bedoeld voor momenten als "pas deze uitvoering aan terwijl die nog bezig is", niet om een nieuwe beurt te starten.

## Huidige sessie

Gebruik `/steer` op hoofdniveau om de actieve uitvoering voor de huidige sessie te targeten:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Gedrag:

- Target alleen de actieve uitvoering van de huidige sessie.
- Werkt onafhankelijk van de `/queue`-modus van de sessie.
- Start geen nieuwe uitvoering wanneer de sessie inactief is.
- Antwoordt met een waarschuwing wanneer er geen actieve uitvoering is om te sturen.
- Gebruikt het sturingspad van de actieve uitvoeringsomgeving, zodat het model de begeleiding ziet bij de volgende ondersteunde runtimegrens.

## Sturen versus wachtrij

`/queue steer` wijzigt hoe normale inkomende berichten zich gedragen wanneer ze binnenkomen terwijl een uitvoering actief is. `/steer <message>` is een expliciete opdracht die probeert het bericht van die opdracht in de actieve uitvoering te injecteren bij de volgende ondersteunde runtimegrens, ongeacht de opgeslagen `/queue`-instelling.

Gebruik:

- `/steer <message>` wanneer je de actieve uitvoering nu wilt begeleiden.
- `/queue steer` wanneer je wilt dat toekomstige normale berichten standaard actieve uitvoeringen sturen.
- `/queue collect` of `/queue followup` wanneer nieuwe berichten moeten wachten op een latere beurt in plaats van de actieve uitvoering te sturen.

Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering) voor wachtrijmodi en fallbackgedrag.

## Subagenten

Gebruik `/subagents steer` wanneer het doel een onderliggende uitvoering is:

```text
/subagents steer 2 focus only on the API surface
```

`/steer` op hoofdniveau selecteert geen subagent op id of lijstindex. Het target altijd de actieve uitvoering van de huidige sessie. Zie [Subagenten](/nl/tools/subagents) voor subagent-id's, labels en besturingsopdrachten.

## ACP-sessies

Gebruik `/acp steer` wanneer het doel een ACP-harnesssessie is:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Zie [ACP-agenten](/nl/tools/acp-agents) voor selectie van ACP-sessies en runtimegedrag.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Opdrachtwachtrij](/nl/concepts/queue)
- [Sturingswachtrij](/nl/concepts/queue-steering)
- [Subagenten](/nl/tools/subagents)
