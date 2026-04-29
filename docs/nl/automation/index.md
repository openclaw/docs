---
read_when:
    - Bepalen hoe je werk automatiseert met OpenClaw
    - Kiezen tussen Heartbeat, Cron, toezeggingen, hooks en vaste opdrachten
    - Op zoek naar het juiste automatiseringsingangspunt
summary: 'Overzicht van automatiseringsmechanismen: taken, Cron, hooks, doorlopende opdrachten en TaskFlow'
title: Automatisering en taken
x-i18n:
    generated_at: "2026-04-29T22:23:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw voert werk op de achtergrond uit via taken, geplande jobs, afgeleide
toezeggingen, event hooks en vaste instructies. Deze pagina helpt je het juiste
mechanisme te kiezen en te begrijpen hoe ze samenhangen.

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

| Gebruikssituatie                                 | Aanbevolen                 | Waarom                                             |
| ------------------------------------------------ | -------------------------- | -------------------------------------------------- |
| Dagelijks rapport precies om 9:00 verzenden      | Geplande taken (Cron)      | Exacte timing, geïsoleerde uitvoering              |
| Herinner me over 20 minuten                      | Geplande taken (Cron)      | Eenmalig met precieze timing (`--at`)              |
| Wekelijkse diepgaande analyse uitvoeren          | Geplande taken (Cron)      | Zelfstandige taak, kan een ander model gebruiken   |
| Inbox elke 30 min controleren                    | Heartbeat                  | Bundelt met andere controles, contextbewust        |
| Agenda monitoren op aankomende gebeurtenissen    | Heartbeat                  | Past natuurlijk bij periodiek bewustzijn           |
| Navragen na een genoemd interview                | Afgeleide toezeggingen     | Geheugenachtige follow-up, geen exact herinneringsverzoek |
| Voorzichtige check-in na gebruikerscontext       | Afgeleide toezeggingen     | Beperkt tot dezelfde agent en hetzelfde kanaal     |
| Status van een subagent of ACP-run inspecteren   | Achtergrondtaken           | Takenregister volgt al het losgekoppelde werk      |
| Controleren wat wanneer is uitgevoerd            | Achtergrondtaken           | `openclaw tasks list` en `openclaw tasks audit`    |
| Meertraps onderzoek en daarna samenvatten        | Task Flow                  | Duurzame orkestratie met revisietracking           |
| Een script uitvoeren bij sessiereset             | Hooks                      | Eventgestuurd, wordt uitgevoerd bij lifecycle-events |
| Code uitvoeren bij elke toolaanroep              | Plugin hooks               | In-process hooks kunnen toolaanroepen onderscheppen |
| Altijd compliance controleren vóór antwoorden    | Vaste instructies          | Automatisch in elke sessie geïnjecteerd            |

### Geplande taken (Cron) versus Heartbeat

| Dimensie        | Geplande taken (Cron)              | Heartbeat                             |
| --------------- | ---------------------------------- | ------------------------------------- |
| Timing          | Exact (cronexpressies, eenmalig)   | Bij benadering (standaard elke 30 min) |
| Sessiecontext   | Nieuw (geïsoleerd) of gedeeld      | Volledige hoofdsessiecontext          |
| Taakrecords     | Altijd aangemaakt                  | Nooit aangemaakt                      |
| Levering        | Kanaal, webhook of stil            | Inline in hoofdsessie                 |
| Beste voor      | Rapporten, herinneringen, achtergrondjobs | Inboxcontroles, agenda, meldingen |

Gebruik geplande taken (Cron) wanneer je precieze timing of geïsoleerde uitvoering nodig hebt. Gebruik Heartbeat wanneer het werk baat heeft bij volledige sessiecontext en timing bij benadering volstaat.

## Kernconcepten

### Geplande taken (cron)

Cron is de ingebouwde planner van de Gateway voor precieze timing. Het bewaart jobs, wekt de agent op het juiste moment en kan output leveren aan een chatkanaal of webhook-endpoint. Ondersteunt eenmalige herinneringen, terugkerende expressies en inkomende webhook-triggers.

Zie [Geplande taken](/nl/automation/cron-jobs).

### Taken

Het achtergrondtakenregister volgt al het losgekoppelde werk: ACP-runs, subagent-spawns, geïsoleerde cronuitvoeringen en CLI-bewerkingen. Taken zijn records, geen planners. Gebruik `openclaw tasks list` en `openclaw tasks audit` om ze te inspecteren.

Zie [Achtergrondtaken](/nl/automation/tasks).

### Afgeleide toezeggingen

Toezeggingen zijn opt-in, kortlevende follow-upherinneringen. OpenClaw leidt ze af
uit normale gesprekken, beperkt ze tot dezelfde agent en hetzelfde kanaal, en
levert check-ins wanneer ze verschuldigd zijn via Heartbeat. Exacte door gebruikers gevraagde herinneringen
horen nog steeds bij Cron.

Zie [Afgeleide toezeggingen](/nl/concepts/commitments).

### Task Flow

Task Flow is de floworkestratielaag boven achtergrondtaken. Het beheert duurzame meertraps flows met beheerde en gespiegelde synchronisatiemodi, revisietracking en `openclaw tasks flow list|show|cancel` voor inspectie.

Zie [Task Flow](/nl/automation/taskflow).

### Vaste instructies

Vaste instructies geven de agent permanente uitvoeringsbevoegdheid voor gedefinieerde programma's. Ze staan in werkruimtebestanden (meestal `AGENTS.md`) en worden in elke sessie geïnjecteerd. Combineer met Cron voor tijdgebaseerde handhaving.

Zie [Vaste instructies](/nl/automation/standing-orders).

### Hooks

Interne hooks zijn eventgestuurde scripts die worden getriggerd door lifecycle-events van de agent
(`/new`, `/reset`, `/stop`), sessie-Compaction, het opstarten van de Gateway en bericht-
flow. Ze worden automatisch ontdekt vanuit mappen en kunnen worden beheerd
met `openclaw hooks`. Gebruik voor onderschepping van toolaanroepen binnen het proces
[Plugin hooks](/nl/plugins/hooks).

Zie [Hooks](/nl/automation/hooks).

### Heartbeat

Heartbeat is een periodieke hoofdsessiebeurt (standaard elke 30 minuten). Het bundelt meerdere controles (inbox, agenda, meldingen) in één agentbeurt met volledige sessiecontext. Heartbeat-beurten maken geen taakrecords aan en verlengen de versheid voor dagelijkse/inactieve sessieresets niet. Gebruik `HEARTBEAT.md` voor een kleine checklist, of een `tasks:`-blok wanneer je periodieke controles die alleen bij vervaldatum lopen binnen Heartbeat zelf wilt. Lege Heartbeat-bestanden worden overgeslagen als `empty-heartbeat-file`; modus voor alleen vervallen taken wordt overgeslagen als `no-tasks-due`. Heartbeats worden uitgesteld terwijl cronwerk actief is of in de wachtrij staat, en `heartbeat.skipWhenBusy` kan ze ook uitstellen terwijl subagent- of geneste lanes bezig zijn.

Zie [Heartbeat](/nl/gateway/heartbeat).

## Hoe ze samenwerken

- **Cron** verwerkt precieze planningen (dagelijkse rapporten, wekelijkse reviews) en eenmalige herinneringen. Alle cronuitvoeringen maken taakrecords aan.
- **Heartbeat** verwerkt routinematige monitoring (inbox, agenda, meldingen) in één gebundelde beurt elke 30 minuten.
- **Hooks** reageren op specifieke events (sessieresets, Compaction, berichtenflow) met aangepaste scripts. Plugin hooks dekken toolaanroepen.
- **Vaste instructies** geven de agent persistente context en bevoegdheidsgrenzen.
- **Task Flow** coördineert meertraps flows boven individuele taken.
- **Taken** volgen automatisch al het losgekoppelde werk zodat je het kunt inspecteren en auditen.

## Gerelateerd

- [Geplande taken](/nl/automation/cron-jobs) — precieze planning en eenmalige herinneringen
- [Afgeleide toezeggingen](/nl/concepts/commitments) — geheugenachtige follow-upcheck-ins
- [Achtergrondtaken](/nl/automation/tasks) — takenregister voor al het losgekoppelde werk
- [Task Flow](/nl/automation/taskflow) — duurzame orkestratie van meertraps flows
- [Hooks](/nl/automation/hooks) — eventgestuurde lifecycle-scripts
- [Plugin hooks](/nl/plugins/hooks) — in-process hooks voor tools, prompts, berichten en lifecycle
- [Vaste instructies](/nl/automation/standing-orders) — persistente agentinstructies
- [Heartbeat](/nl/gateway/heartbeat) — periodieke hoofdsessiebeurten
- [Configuratiereferentie](/nl/gateway/configuration-reference) — alle configuratiesleutels
