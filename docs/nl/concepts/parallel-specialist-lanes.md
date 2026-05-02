---
read_when:
    - Je routeert groepschats naar vaste agenten
    - Je wilt parallel kunnen werken zonder dat één lange taak elke chat blokkeert
    - Je ontwerpt een operationele multi-agentopzet
sidebarTitle: Specialist lanes
status: active
summary: Voer gespecialiseerde agents parallel uit zonder gedeelde model- en toolcapaciteit te blokkeren
title: Parallelle specialistische sporen
x-i18n:
    generated_at: "2026-05-02T11:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Parallelle specialistische lanes laten één Gateway verschillende chats of ruimtes naar
verschillende agenten routeren, terwijl de gebruikerservaring snel blijft. De truc is om
parallelisme te behandelen als een ontwerpprobleem met schaarse middelen, niet alleen als "meer agenten".

## Eerste principes

Een specialistische lane verbetert de doorvoer alleen wanneer deze de concurrentie om de
echte knelpunten vermindert:

- **Sessievergrendelingen**: slechts één uitvoering mag een gegeven sessie tegelijk wijzigen.
- **Globale modelcapaciteit**: alle zichtbare chatuitvoeringen delen nog steeds aanbiederlimieten.
- **Toolcapaciteit**: shell-, browser-, netwerk- en repositorywerk kan trager zijn
  dan de modelbeurt zelf.
- **Contextbudget**: lange transcripties maken elke toekomstige beurt trager en minder
  gericht.
- **Onduidelijk eigenaarschap**: dubbele agenten die hetzelfde werk doen verspillen capaciteit.

OpenClaw serialiseert uitvoeringen al per sessie en begrenst globale paralleliteit via
de [opdrachtwachtrij](/nl/concepts/queue). Specialistische lanes voegen daar beleid bovenop toe:
welke agent welk werk bezit, wat in de chat blijft en wat achtergrondwerk wordt.

## Aanbevolen uitrol

### Fase 1: lane-contracten + zwaar achtergrondwerk

Geef elke lane een geschreven contract in de werkruimte en systeemprompt:

- **Doel**: het werk waarvoor deze lane verantwoordelijk is.
- **Niet-doelen**: werk dat deze lane moet overdragen in plaats van proberen uit te voeren.
- **Chatbudget**: snelle antwoorden blijven in de chat; lange taken moeten kort worden
  bevestigd en daarna in een achtergrond-subagent of taak worden uitgevoerd.
- **Overdrachtsregel**: wanneer een andere lane het werk bezit, zeg waar het heen moet en
  geef een compacte overdrachtssamenvatting.
- **Toolrisicoregel**: geef de voorkeur aan het kleinste tooloppervlak dat de klus kan klaren.

Dit is de goedkoopste fase en verhelpt de meeste verstoppingen: één programmeertaak verandert
de onderzoekslane niet langer in stroop, en elke chat houdt zijn eigen context schoon.

### Fase 2: prioriteits- en gelijktijdigheidscontroles

Stem wachtrij- en modelcapaciteit af op de bedrijfswaarde van elke lane:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Gebruik directe/persoonlijke chats en productie-ops-agenten voor werk met hoge prioriteit. Laat
onderzoek, opstellen en batchgewijs programmeren naar achtergrondtaken gaan wanneer het systeem
druk is.

### Fase 3: coördinator / verkeersregelaar

Voeg een klein coördinatorpatroon toe zodra meerdere lanes actief zijn:

- Houd actieve lane-taken en eigenaars bij.
- Detecteer dubbele verzoeken tussen groepen.
- Routeer overdrachtssamenvattingen tussen lanes.
- Toon alleen blokkades, voltooide resultaten en beslissingen die de mens moet nemen.

Begin hier niet. Een coördinator zonder lane-contracten coördineert alleen chaos.

## Minimale template voor lane-contract

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Gerelateerd

- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Opdrachtwachtrij](/nl/concepts/queue)
- [Subagenten](/nl/tools/subagents)
