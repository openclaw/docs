---
doc-schema-version: 1
read_when:
    - Bepalen hoe je werk automatiseert met OpenClaw
    - Kiezen tussen Heartbeat, Cron, toezeggingen, haakpunten en doorlopende opdrachten
    - Het juiste startpunt voor automatisering zoeken
summary: 'Overzicht van automatiseringsmechanismen: taken, Cron, hooks, vaste opdrachten en TaskFlow'
title: Automatisering
x-i18n:
    generated_at: "2026-05-12T00:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw voert werk op de achtergrond uit via taken, geplande jobs, afgeleide
toezeggingen, gebeurtenishooks en permanente instructies. Deze pagina helpt je
het juiste mechanisme te kiezen en te begrijpen hoe ze samenwerken.

## Snelle beslisgids

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Gebruikssituatie                         | Aanbevolen            | Waarom                                           |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| Dagelijks rapport exact om 9:00 versturen | Geplande taken (Cron) | Exacte timing, geïsoleerde uitvoering            |
| Herinner mij over 20 minuten             | Geplande taken (Cron) | Eenmalig met precieze timing (`--at`)            |
| Wekelijkse diepgaande analyse uitvoeren  | Geplande taken (Cron) | Losstaande taak, kan ander model gebruiken       |
| Inbox elke 30 min controleren            | Heartbeat             | Batcht met andere controles, contextbewust       |
| Agenda bewaken op aankomende afspraken   | Heartbeat             | Natuurlijke keuze voor periodiek bewustzijn      |
| Terugkomen na een genoemd interview      | Afgeleide toezeggingen | Geheugenachtige follow-up, geen exact herinneringsverzoek |
| Zachte zorg-check-in na gebruikerscontext | Afgeleide toezeggingen | Beperkt tot dezelfde agent en hetzelfde kanaal   |
| Status van een subagent of ACP-run bekijken | Achtergrondtaken    | Takenlogboek volgt al het losgekoppelde werk     |
| Controleren wat wanneer is uitgevoerd    | Achtergrondtaken      | `openclaw tasks list` en `openclaw tasks audit`  |
| Meerstaps onderzoek en daarna samenvatten | TaskFlow             | Duurzame orchestration met revisietracking       |
| Script uitvoeren bij sessiereset         | Hooks                 | Gebeurtenisgestuurd, activeert bij lifecycle-gebeurtenissen |
| Code uitvoeren bij elke toolaanroep      | Plugin hooks          | In-process hooks kunnen toolaanroepen onderscheppen |
| Altijd compliance controleren vóór antwoorden | Permanente instructies | Automatisch in elke sessie geïnjecteerd       |

### Geplande taken (Cron) versus Heartbeat

| Dimensie        | Geplande taken (Cron)               | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Timing          | Exact (cron-expressies, eenmalig)   | Bij benadering (standaard elke 30 min) |
| Sessiecontext   | Nieuw (geïsoleerd) of gedeeld       | Volledige hoofdsessiecontext          |
| Taakrecords     | Altijd aangemaakt                   | Nooit aangemaakt                      |
| Levering        | Kanaal, webhook of stil             | Inline in hoofdsessie                 |
| Best geschikt voor | Rapporten, herinneringen, achtergrondjobs | Inboxcontroles, agenda, meldingen |

Gebruik Geplande taken (Cron) wanneer je precieze timing of geïsoleerde uitvoering nodig hebt. Gebruik Heartbeat wanneer het werk baat heeft bij volledige sessiecontext en timing bij benadering voldoende is.

## Kernconcepten

### Geplande taken (cron)

Cron is de ingebouwde planner van de Gateway voor precieze timing. Het bewaart jobs, wekt de agent op het juiste moment en kan uitvoer afleveren in een chatkanaal of webhook-eindpunt. Ondersteunt eenmalige herinneringen, terugkerende expressies en inkomende webhook-triggers.

Zie [Geplande taken](/nl/automation/cron-jobs).

### Taken

Het achtergrondtakenlogboek volgt al het losgekoppelde werk: ACP-runs, subagent-starts, geïsoleerde cron-uitvoeringen en CLI-bewerkingen. Taken zijn records, geen planners. Gebruik `openclaw tasks list` en `openclaw tasks audit` om ze te inspecteren.

Zie [Achtergrondtaken](/nl/automation/tasks).

### Afgeleide toezeggingen

Toezeggingen zijn opt-in, kortlevende follow-upherinneringen. OpenClaw leidt ze af
uit normale gesprekken, beperkt ze tot dezelfde agent en hetzelfde kanaal, en
levert verschuldigde check-ins via Heartbeat. Exacte door de gebruiker gevraagde herinneringen horen nog steeds
bij cron.

Zie [Afgeleide toezeggingen](/nl/concepts/commitments).

### TaskFlow

TaskFlow is het flow-orchestration-substraat boven achtergrondtaken. Het beheert duurzame meerstaps flows met beheerde en gespiegeld gesynchroniseerde modi, revisietracking en `openclaw tasks flow list|show|cancel` voor inspectie.

Zie [TaskFlow](/nl/automation/taskflow).

### Permanente instructies

Permanente instructies geven de agent blijvende operationele bevoegdheid voor gedefinieerde programma's. Ze staan in workspace-bestanden (meestal `AGENTS.md`) en worden in elke sessie geïnjecteerd. Combineer met cron voor tijdgebaseerde handhaving.

Zie [Permanente instructies](/nl/automation/standing-orders).

### Hooks

Interne hooks zijn gebeurtenisgestuurde scripts die worden getriggerd door agent-lifecycle-gebeurtenissen
(`/new`, `/reset`, `/stop`), sessie-Compaction, het starten van de Gateway en berichtenflow.
Ze worden automatisch uit mappen ontdekt en kunnen worden beheerd
met `openclaw hooks`. Gebruik voor in-process onderschepping van toolaanroepen
[Plugin hooks](/nl/plugins/hooks).

Zie [Hooks](/nl/automation/hooks).

### Heartbeat

Heartbeat is een periodieke hoofdsessie-turn (standaard elke 30 minuten). Het batcht meerdere controles (inbox, agenda, meldingen) in één agent-turn met volledige sessiecontext. Heartbeat-turns maken geen taakrecords aan en verlengen de versheid van dagelijkse/inactieve sessieresets niet. Gebruik `HEARTBEAT.md` voor een kleine checklist, of een `tasks:`-blok wanneer je verschuldigde periodieke controles alleen binnen Heartbeat zelf wilt. Lege Heartbeat-bestanden slaan over als `empty-heartbeat-file`; due-only-taakmodus slaat over als `no-tasks-due`. Heartbeats worden uitgesteld terwijl cron-werk actief is of in de wachtrij staat, en `heartbeat.skipWhenBusy` kan ze ook uitstellen terwijl subagent- of geneste lanes bezig zijn.

Zie [Heartbeat](/nl/gateway/heartbeat).

## Hoe ze samenwerken

- **Cron** verwerkt precieze schema's (dagelijkse rapporten, wekelijkse reviews) en eenmalige herinneringen. Alle cron-uitvoeringen maken taakrecords aan.
- **Heartbeat** verwerkt routinematige monitoring (inbox, agenda, meldingen) in één gebatchte turn elke 30 minuten.
- **Hooks** reageren op specifieke gebeurtenissen (sessieresets, Compaction, berichtenflow) met aangepaste scripts. Plugin hooks dekken toolaanroepen.
- **Permanente instructies** geven de agent blijvende context en bevoegdheidsgrenzen.
- **TaskFlow** coördineert meerstaps flows boven individuele taken.
- **Taken** volgen automatisch al het losgekoppelde werk, zodat je het kunt inspecteren en auditen.

## Gerelateerd

- [Geplande taken](/nl/automation/cron-jobs) — precieze planning en eenmalige herinneringen
- [Afgeleide toezeggingen](/nl/concepts/commitments) — geheugenachtige follow-up-check-ins
- [Achtergrondtaken](/nl/automation/tasks) — takenlogboek voor al het losgekoppelde werk
- [TaskFlow](/nl/automation/taskflow) — duurzame meerstaps flow-orchestration
- [Hooks](/nl/automation/hooks) — gebeurtenisgestuurde lifecycle-scripts
- [Plugin hooks](/nl/plugins/hooks) — in-process hooks voor tools, prompts, berichten en lifecycle
- [Permanente instructies](/nl/automation/standing-orders) — blijvende agentinstructies
- [Heartbeat](/nl/gateway/heartbeat) — periodieke hoofdsessie-turns
- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle config keys
