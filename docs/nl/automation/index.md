---
doc-schema-version: 1
read_when:
    - Bepalen hoe u werk automatiseert met OpenClaw
    - Kiezen tussen Heartbeat, Cron, toezeggingen, hooks en vaste opdrachten
    - Op zoek naar het juiste startpunt voor automatisering
summary: 'Overzicht van automatiseringsmechanismen: taken, Cron, hooks, vaste opdrachten en TaskFlow'
title: Automatisering
x-i18n:
    generated_at: "2026-07-12T08:34:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw voert werk op de achtergrond uit via taken, geplande opdrachten, afgeleide
toezeggingen, gebeurtenishooks en vaste opdrachten. Gebruik deze pagina om het
juiste mechanisme te kiezen.

## Snelle keuzehulp

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

| Gebruikssituatie                                      | Aanbevolen                   | Waarom                                                    |
| ----------------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| Dagelijks rapport exact om 9.00 uur verzenden         | Geplande taken (Cron)        | Exacte timing, geïsoleerde uitvoering                     |
| Herinner me over 20 minuten                           | Geplande taken (Cron)        | Eenmalig met nauwkeurige timing (`--at`)                  |
| Wekelijks een diepgaande analyse uitvoeren            | Geplande taken (Cron)        | Zelfstandige taak, kan een ander model gebruiken          |
| Postvak IN elke 30 minuten controleren                | Heartbeat                    | Gebundeld met andere controles, contextbewust             |
| Agenda controleren op komende gebeurtenissen          | Heartbeat                    | Past vanzelfsprekend bij periodieke bewaking              |
| Navraag doen na een genoemd sollicitatiegesprek       | Afgeleide toezeggingen       | Geheugenachtige opvolging, zonder exact herinneringsverzoek |
| Voorzichtig informeren na context van de gebruiker    | Afgeleide toezeggingen       | Beperkt tot dezelfde agent en hetzelfde kanaal            |
| Status van een subagent- of ACP-uitvoering controleren | Achtergrondtaken             | Het takenregister volgt al het losgekoppelde werk          |
| Controleren wat wanneer is uitgevoerd                 | Achtergrondtaken             | `openclaw tasks list` en `openclaw tasks audit`           |
| Onderzoek in meerdere stappen en daarna samenvatten   | Taakstroom                   | Duurzame orkestratie met revisieregistratie                |
| Een script uitvoeren bij het resetten van een sessie  | Hooks                        | Gebeurtenisgestuurd, wordt geactiveerd bij levenscyclusgebeurtenissen |
| Code uitvoeren bij elke toolaanroep                   | Plugin-hooks                 | Hooks binnen het proces kunnen toolaanroepen onderscheppen |
| Altijd naleving controleren voordat wordt geantwoord  | Vaste opdrachten             | Wordt automatisch in elke sessie geïnjecteerd             |

### Geplande taken (Cron) tegenover Heartbeat

| Dimensie        | Geplande taken (Cron)                 | Heartbeat                                  |
| --------------- | ------------------------------------- | ------------------------------------------ |
| Timing          | Exact (cron-expressies, eenmalig)     | Bij benadering (standaard elke 30 minuten) |
| Sessiecontext   | Nieuw (geïsoleerd) of gedeeld         | Volledige context van de hoofdsessie       |
| Taakrecords     | Worden altijd aangemaakt              | Worden nooit aangemaakt                    |
| Aflevering      | Kanaal, webhook of stil               | Inline in de hoofdsessie                   |
| Meest geschikt voor | Rapporten, herinneringen, achtergrondtaken | Postvakcontroles, agenda, meldingen  |

Gebruik Geplande taken (Cron) wanneer je nauwkeurige timing of geïsoleerde uitvoering nodig hebt. Gebruik Heartbeat wanneer het werk baat heeft bij de volledige sessiecontext en timing bij benadering volstaat.

## Kernbegrippen

### Geplande taken (cron)

Cron is de ingebouwde planner van de Gateway voor nauwkeurige timing. Deze bewaart opdrachten, activeert de agent op het juiste moment en kan uitvoer afleveren bij een chatkanaal of webhook-eindpunt. Ondersteunt eenmalige herinneringen, terugkerende expressies en triggers van inkomende webhooks.

Zie [Geplande taken](/nl/automation/cron-jobs).

### Taken

Het register voor achtergrondtaken volgt al het losgekoppelde werk: ACP-uitvoeringen, gestarte subagents, geïsoleerde cron-uitvoeringen en CLI-bewerkingen. Taken zijn records, geen planners. Gebruik `openclaw tasks list` en `openclaw tasks audit` om ze te bekijken.

Zie [Achtergrondtaken](/nl/automation/tasks).

### Afgeleide toezeggingen

Toezeggingen zijn optionele, kortstondige herinneringen voor opvolging. OpenClaw leidt ze
af uit normale gesprekken, beperkt ze tot dezelfde agent en hetzelfde kanaal en
levert geplande controlemomenten via Heartbeat. Exacte herinneringen waarom de gebruiker vraagt,
horen nog steeds bij Cron.

Zie [Afgeleide toezeggingen](/nl/concepts/commitments).

### Taakstroom

Taakstroom is de onderliggende infrastructuur voor stroomorkestratie boven achtergrondtaken. Deze beheert duurzame stromen met meerdere stappen, met beheerde en gespiegelde synchronisatiemodi, revisieregistratie en `openclaw tasks flow list|show|cancel` voor inspectie.

Zie [Taakstroom](/nl/automation/taskflow).

### Vaste opdrachten

Vaste opdrachten geven de agent permanente uitvoeringsbevoegdheid voor gedefinieerde programma's. Ze bevinden zich in werkruimtebestanden (doorgaans `AGENTS.md`) en worden in elke sessie geïnjecteerd. Combineer ze met Cron voor tijdgebonden handhaving.

Zie [Vaste opdrachten](/nl/automation/standing-orders).

### Hooks

Interne hooks zijn gebeurtenisgestuurde scripts die worden geactiveerd door gebeurtenissen in de levenscyclus van de agent
(`/new`, `/reset`, `/stop`), sessiecompactie, het starten van de Gateway en de berichtenstroom.
Ze worden ontdekt in hookmappen en beheerd met
`openclaw hooks`. Gebruik voor het onderscheppen van toolaanroepen binnen het proces
[Plugin-hooks](/nl/plugins/hooks).

Zie [Hooks](/nl/automation/hooks).

### Heartbeat

Heartbeat is een periodieke beurt in de hoofdsessie (standaard elke 30 minuten). Deze bundelt meerdere controles (postvak IN, agenda, meldingen) in één agentbeurt met de volledige sessiecontext. Heartbeat-beurten maken geen taakrecords aan en verlengen de actualiteit voor dagelijkse/inactiviteitsresets van sessies niet. Gebruik `HEARTBEAT.md` voor een kleine controlelijst, of een `tasks:`-blok wanneer je alleen periodieke controles wilt uitvoeren die binnen Heartbeat zelf aan de beurt zijn. Lege Heartbeat-bestanden worden overgeslagen als `empty-heartbeat-file`; een taakmodus die alleen vervallen taken uitvoert, wordt overgeslagen als `no-tasks-due`. Heartbeats worden uitgesteld zolang Cron-werk actief is of in de wachtrij staat. `heartbeat.skipWhenBusy` kan een agent ook uitstellen zolang sessiesleutelgebonden subagent- of geneste uitvoeringsbanen van diezelfde agent bezet zijn.

Zie [Heartbeat](/nl/gateway/heartbeat).

## Hoe ze samenwerken

- **Cron** verwerkt nauwkeurige planningen (dagelijkse rapporten, wekelijkse beoordelingen) en eenmalige herinneringen. Alle Cron-uitvoeringen maken taakrecords aan.
- **Heartbeat** verwerkt routinematige bewaking (postvak IN, agenda, meldingen) in één gebundelde beurt per 30 minuten.
- **Hooks** reageren met aangepaste scripts op specifieke gebeurtenissen (sessieresets, Compaction, berichtenstroom). Plugin-hooks verwerken toolaanroepen.
- **Vaste opdrachten** geven de agent permanente context en bevoegdheidsgrenzen.
- **Taakstroom** coördineert stromen met meerdere stappen boven afzonderlijke taken.
- **Taken** volgen automatisch al het losgekoppelde werk, zodat je het kunt bekijken en controleren.

## Gerelateerd

- [Geplande taken](/nl/automation/cron-jobs) — nauwkeurige planning en eenmalige herinneringen
- [Afgeleide toezeggingen](/nl/concepts/commitments) — geheugenachtige opvolgingsmomenten
- [Achtergrondtaken](/nl/automation/tasks) — takenregister voor al het losgekoppelde werk
- [Taakstroom](/nl/automation/taskflow) — duurzame orkestratie van stromen met meerdere stappen
- [Hooks](/nl/automation/hooks) — gebeurtenisgestuurde levenscyclusscripts
- [Plugin-hooks](/nl/plugins/hooks) — hooks binnen het proces voor tools, prompts, berichten en de levenscyclus
- [Vaste opdrachten](/nl/automation/standing-orders) — permanente agentinstructies
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle configuratiesleutels
