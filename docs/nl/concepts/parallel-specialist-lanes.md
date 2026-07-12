---
read_when:
    - Je routeert groepschats naar speciale agents
    - Je wilt parallel werken zonder dat één langdurige taak elke chat blokkeert
    - U ontwerpt een operationele opzet met meerdere agents
sidebarTitle: Specialist lanes
status: active
summary: Voer gespecialiseerde agents parallel uit zonder gedeelde model- en toolcapaciteit te overbelasten
title: Parallelle specialistische trajecten
x-i18n:
    generated_at: "2026-07-12T08:46:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Parallelle specialistische lanes laten één Gateway verschillende chats of ruimtes naar
verschillende agents routeren, terwijl de gebruikerservaring snel blijft. Beschouw parallellisme als
een ontwerpprobleem rond schaarse middelen, niet alleen als "meer agents".

## Basisprincipes

Een specialistische lane verbetert de doorvoer alleen wanneer deze de concurrentie om de
werkelijke knelpunten vermindert:

- **Sessievergrendelingen**: slechts één uitvoering mag een bepaalde sessie tegelijk wijzigen.
- **Globale modelcapaciteit**: alle zichtbare chatuitvoeringen delen nog steeds de limieten van de provider.
- **Toolcapaciteit**: werk met de shell, browser, het netwerk en repository's kan trager zijn
  dan de modelbeurt zelf.
- **Contextbudget**: lange transcripties maken elke toekomstige beurt trager en minder
  gericht.
- **Onduidelijk eigenaarschap**: dubbele agents die hetzelfde werk doen, verspillen capaciteit.

OpenClaw voert uitvoeringen per sessie al serieel uit en begrenst globale parallelliteit
via de [opdrachtwachtrij](/nl/concepts/queue). Specialistische lanes voegen daar beleid aan
toe: welke agent welk werk beheert, wat in de chat blijft en wat
achtergrondwerk wordt.

## Aanbevolen uitrol

### Fase 1: lane-contracten + zwaar achtergrondwerk

Geef elke lane een schriftelijk contract in de werkruimte en systeemprompt:

- **Doel**: het werk waarvoor deze lane verantwoordelijk is.
- **Niet-doelen**: werk dat de lane moet overdragen in plaats van zelf uit te voeren.
- **Chatbudget**: snelle antwoorden blijven in de chat; bij langdurige taken volgt een korte bevestiging,
  waarna ze worden uitgevoerd in een sub-agent of taak op de achtergrond.
- **Overdrachtsregel**: wanneer een andere lane verantwoordelijk is voor het werk, vermeld dan waar het naartoe moet en
  geef een compacte overdrachtssamenvatting.
- **Toolrisicoregel**: geef de voorkeur aan het kleinste tooloppervlak waarmee de taak kan worden uitgevoerd.

Dit is de goedkoopste fase en verhelpt de meeste verstoppingen: één codeertaak verandert
de onderzoekslane niet langer in stroop en elke chat houdt zijn eigen context
schoon.

### Fase 2: prioriteits- en gelijktijdigheidsregelingen

Stem de capaciteit van de wachtrij en het model af op de bedrijfswaarde van elke lane:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
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

Gebruik directe/persoonlijke chats en agents voor productieactiviteiten voor werk met hoge prioriteit. Laat
onderzoek, conceptwerk en codeerwerk in batches naar achtergrondtaken verplaatsen wanneer het systeem
druk is.

### Fase 3: coördinator / verkeersregelaar

Voeg een klein coördinatorpatroon toe zodra meerdere lanes actief zijn:

- Houd actieve lanetaken en verantwoordelijken bij.
- Detecteer dubbele verzoeken tussen groepen.
- Routeer overdrachtssamenvattingen tussen lanes.
- Toon alleen blokkades, voltooide resultaten en beslissingen die de mens moet nemen.

Begin hier niet mee. Een coördinator zonder lane-contracten coördineert alleen chaos.

## Minimale sjabloon voor een lane-contract

```md
# Lane-contract

## Verantwoordelijk voor

- <taak waarvoor deze lane verantwoordelijk is>

## Niet verantwoordelijk voor

- <werk om over te dragen>

## Chatbudget

- Beantwoord snelle vragen direct.
- Voor werk met meerdere stappen, dat traag is of veel tools gebruikt: bevestig het kort, start/voer
  het werk op de achtergrond uit en geef vervolgens het resultaat terug wanneer het voltooid is.

## Overdracht

Als een andere lane verantwoordelijk is voor het verzoek, antwoord dan met:

- doellane
- doelstelling
- relevante context
- exacte volgende actie

## Toolbeleid

Gebruik het kleinste tooloppervlak waarmee de taak kan worden voltooid. Vermijd uitgebreid shell- of
netwerkwerk, tenzij deze lane daar expliciet verantwoordelijk voor is.
```

## Gerelateerd

- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Opdrachtwachtrij](/nl/concepts/queue)
- [Sub-agents](/nl/tools/subagents)
