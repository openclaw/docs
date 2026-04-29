---
read_when:
    - Je wilt dat OpenClaw vanzelfsprekende vervolgvragen onthoudt
    - Je wilt begrijpen hoe afgeleide check-ins verschillen van herinneringen
    - U wilt vervolgtoezeggingen bekijken of negeren
sidebarTitle: Commitments
summary: Afgeleid opvolggeheugen voor contactmomenten die geen exacte herinneringen zijn
title: Afgeleide toezeggingen
x-i18n:
    generated_at: "2026-04-29T22:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Toezeggingen zijn kortlevende vervolggeheugens. Wanneer dit is ingeschakeld, kan OpenClaw
opmerken dat een gesprek een toekomstige gelegenheid voor een check-in heeft gecreëerd en onthouden
om die later weer terug te brengen.

Voorbeelden:

- Je noemt morgen een sollicitatiegesprek. OpenClaw kan daarna even checken.
- Je zegt dat je uitgeput bent. OpenClaw kan later vragen of je hebt geslapen.
- De agent zegt dat hij opvolgt nadat iets verandert. OpenClaw kan die open lus
  bijhouden.

Toezeggingen zijn geen duurzame feiten zoals `MEMORY.md`, en het zijn geen exacte
herinneringen. Ze zitten tussen geheugen en automatisering in: OpenClaw onthoudt een
gespreksgebonden verplichting, waarna Heartbeat die levert wanneer deze aan de beurt is.

## Toezeggingen inschakelen

Toezeggingen staan standaard uit. Schakel ze in de configuratie in:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Equivalent `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` beperkt hoeveel afgeleide follow-ups per agentsessie
binnen een voortschrijdende dag kunnen worden geleverd. De standaardwaarde is `3`.

## Hoe het werkt

Na een agentantwoord kan OpenClaw een verborgen extractiestap op de achtergrond uitvoeren in een
afzonderlijke context. Die stap zoekt alleen naar afgeleide vervolgtoezeggingen. Hij
schrijft niet naar het zichtbare gesprek en vraagt de hoofdagent niet
om over de extractie te redeneren.

Wanneer een kandidaat met hoge zekerheid wordt gevonden, slaat OpenClaw een toezegging op met:

- de agent-id
- de sessiesleutel
- het oorspronkelijke kanaal en afleverdoel
- een venster waarin deze aan de beurt is
- een korte voorgestelde check-in
- voldoende broncontext zodat Heartbeat kan beslissen of deze moet worden verzonden

Levering gebeurt via Heartbeat. Wanneer een toezegging aan de beurt is, voegt Heartbeat
de toezegging toe aan de Heartbeat-beurt voor dezelfde agent en kanaalscope.
Het model kan één natuurlijke check-in sturen of antwoorden met `HEARTBEAT_OK` om deze te negeren.

OpenClaw levert een afgeleide toezegging nooit direct nadat deze is geschreven.
Het tijdstip wordt vastgezet op minimaal één Heartbeat-interval nadat de toezegging
is gemaakt, zodat de follow-up niet op hetzelfde moment kan terugkaatsen als waarop deze is
afgeleid.

## Scope

Toezeggingen zijn beperkt tot de exacte agent- en kanaalcontext waarin ze zijn
gemaakt. Een follow-up die wordt afgeleid tijdens een gesprek met één agent in Discord wordt niet
geleverd door een andere agent, een ander kanaal of een niet-gerelateerde sessie.

Deze scope is onderdeel van de functie. Natuurlijke check-ins moeten aanvoelen alsof hetzelfde
gesprek doorgaat, niet als een wereldwijd herinneringssysteem.

## Toezeggingen versus herinneringen

| Behoefte                                       | Gebruik                                  |
| ---------------------------------------------- | ---------------------------------------- |
| "Herinner me om 15:00"                         | [Geplande taken](/nl/automation/cron-jobs) |
| "Ping me over 20 minuten"                      | [Geplande taken](/nl/automation/cron-jobs) |
| "Voer dit rapport elke werkdag uit"            | [Geplande taken](/nl/automation/cron-jobs) |
| "Ik heb morgen een sollicitatiegesprek"        | Toezeggingen                            |
| "Ik ben de hele nacht wakker geweest"          | Toezeggingen                            |
| "Volg op als ik deze open thread niet beantwoord" | Toezeggingen                         |

Exacte gebruikersverzoeken horen al thuis in het scheduler-pad. Toezeggingen zijn alleen
voor afgeleide follow-ups: de momenten waarop de gebruiker niet om een herinnering vroeg,
maar het gesprek duidelijk een nuttige toekomstige check-in creëerde.

## Toezeggingen beheren

Gebruik de CLI om opgeslagen toezeggingen te inspecteren en te wissen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Zie [`openclaw commitments`](/nl/cli/commitments) voor de opdrachtreferentie.

## Privacy en kosten

Toezeggingsextractie gebruikt een LLM-stap, dus inschakeling voegt achtergrondmodelgebruik
toe na in aanmerking komende beurten. De stap is verborgen voor het voor de gebruiker zichtbare
gesprek, maar kan de recente uitwisseling lezen die nodig is om te bepalen of er een
follow-up bestaat.

Opgeslagen toezeggingen zijn lokale OpenClaw-status. Ze zijn operationeel geheugen, geen
langetermijngeheugen. Schakel de functie uit met:

```bash
openclaw config set commitments.enabled false
```

## Probleemoplossing

Als verwachte follow-ups niet verschijnen:

- Bevestig dat `commitments.enabled` `true` is.
- Controleer `openclaw commitments --all` op openstaande, genegeerde, gesnoozede of verlopen
  records.
- Zorg dat Heartbeat draait voor de agent.
- Controleer of `commitments.maxPerDay` al is bereikt voor die
  agentsessie.
- Onthoud dat exacte herinneringen worden overgeslagen door toezeggingsextractie en in plaats daarvan
  onder [geplande taken](/nl/automation/cron-jobs) moeten verschijnen.

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [`openclaw commitments`](/nl/cli/commitments)
- [Configuratiereferentie](/nl/gateway/configuration-reference#commitments)
