---
read_when:
    - Je wilt dat OpenClaw natuurlijke vervolgvragen onthoudt
    - Je wilt begrijpen hoe afgeleide incheckmomenten verschillen van herinneringen
    - Je wilt vervolgtoezeggingen bekijken of afwijzen
sidebarTitle: Commitments
summary: Afgeleid vervolggeheugen voor check-ins die geen exacte herinneringen zijn
title: Afgeleide toezeggingen
x-i18n:
    generated_at: "2026-05-01T11:17:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Toezeggingen zijn kortstondige opvolgingsherinneringen. Wanneer ingeschakeld kan OpenClaw
opmerken dat een gesprek een toekomstige check-inmogelijkheid heeft gecreëerd en onthouden
om die later terug te brengen.

Voorbeelden:

- Je noemt morgen een sollicitatiegesprek. OpenClaw kan daarna inchecken.
- Je zegt dat je uitgeput bent. OpenClaw kan later vragen of je hebt geslapen.
- De agent zegt dat hij opvolgt nadat er iets verandert. OpenClaw kan die open lus
  bijhouden.

Toezeggingen zijn geen duurzame feiten zoals `MEMORY.md`, en het zijn geen exacte
herinneringen. Ze zitten tussen geheugen en automatisering in: OpenClaw onthoudt een
gespreksgebonden verplichting, waarna Heartbeat deze levert wanneer die aan de beurt is.

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

`commitments.maxPerDay` beperkt hoeveel afgeleide opvolgingen per agentsessie
in een voortschrijdende dag kunnen worden geleverd. De standaardwaarde is `3`.

## Hoe het werkt

Na een antwoord van een agent kan OpenClaw een verborgen extractieronde op de achtergrond
uitvoeren in een aparte context. Die ronde zoekt alleen naar afgeleide opvolgingstoezeggingen. Deze
schrijft niets naar het zichtbare gesprek en vraagt de hoofdagent niet om over de
extractie te redeneren.

Wanneer er een kandidaat met hoge betrouwbaarheid wordt gevonden, slaat OpenClaw een toezegging op met:

- de agent-id
- de sessiesleutel
- het oorspronkelijke kanaal en afleverdoel
- een tijdvenster voor wanneer deze aan de beurt is
- een korte voorgestelde check-in
- niet-instruerende metadata waarmee Heartbeat kan bepalen of deze moet worden verzonden

Levering gebeurt via Heartbeat. Wanneer een toezegging aan de beurt is, voegt Heartbeat
de toezegging toe aan de Heartbeat-beurt voor dezelfde agent- en kanaalscope.
Het model kan één natuurlijke check-in verzenden of antwoorden met `HEARTBEAT_OK` om deze te negeren.
Als Heartbeat is geconfigureerd met `target: "none"`, blijven toezeggingen die aan de beurt zijn
intern en worden er geen externe check-ins verzonden. Prompts voor toezeggingenlevering
spelen de oorspronkelijke gesprekstekst niet opnieuw af, en Heartbeat-beurten voor toezeggingen
die aan de beurt zijn draaien zonder OpenClaw-tools.

OpenClaw levert een afgeleide toezegging nooit direct nadat deze is geschreven.
Het tijdstip waarop deze aan de beurt is, wordt vastgezet op minimaal één Heartbeat-interval nadat de toezegging
is aangemaakt, zodat de opvolging niet op hetzelfde moment kan terugkomen als waarop deze werd
afgeleid.

## Scope

Toezeggingen zijn beperkt tot de exacte agent- en kanaalcontext waarin ze zijn
aangemaakt. Een opvolging die wordt afgeleid tijdens een gesprek met één agent in Discord wordt niet
geleverd door een andere agent, een ander kanaal of een niet-gerelateerde sessie.

Deze scope is onderdeel van de functie. Natuurlijke check-ins moeten aanvoelen alsof hetzelfde
gesprek wordt voortgezet, niet als een globaal herinneringssysteem.

## Toezeggingen versus herinneringen

| Behoefte                                        | Gebruik                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Herinner me om 15:00"                          | [Geplande taken](/nl/automation/cron-jobs) |
| "Ping me over 20 minuten"                       | [Geplande taken](/nl/automation/cron-jobs) |
| "Voer dit rapport elke werkdag uit"             | [Geplande taken](/nl/automation/cron-jobs) |
| "Ik heb morgen een sollicitatiegesprek"         | Toezeggingen                             |
| "Ik was de hele nacht wakker"                   | Toezeggingen                             |
| "Volg op als ik deze open thread niet beantwoord" | Toezeggingen                           |

Exacte gebruikersverzoeken horen al bij het scheduler-pad. Toezeggingen zijn alleen
voor afgeleide opvolgingen: de momenten waarop de gebruiker niet om een herinnering vroeg,
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

Extractie van toezeggingen gebruikt een LLM-ronde, dus inschakelen voegt achtergrondmodelgebruik
toe na geschikte beurten. De ronde is verborgen voor het voor de gebruiker zichtbare
gesprek, maar kan de recente uitwisseling lezen die nodig is om te bepalen of er een
opvolging bestaat.

Opgeslagen toezeggingen zijn lokale OpenClaw-status. Ze zijn operationeel geheugen, geen
langetermijngeheugen. Schakel de functie uit met:

```bash
openclaw config set commitments.enabled false
```

## Problemen oplossen

Als verwachte opvolgingen niet verschijnen:

- Controleer of `commitments.enabled` `true` is.
- Controleer `openclaw commitments --all` op openstaande, genegeerde, gesnoozede of verlopen
  records.
- Zorg dat Heartbeat draait voor de agent.
- Controleer of `commitments.maxPerDay` al is bereikt voor die
  agentsessie.
- Onthoud dat exacte herinneringen worden overgeslagen door toezeggingsextractie en in plaats daarvan
  onder [geplande taken](/nl/automation/cron-jobs) zouden moeten verschijnen.

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [`openclaw commitments`](/nl/cli/commitments)
- [Configuratiereferentie](/nl/gateway/configuration-reference#commitments)
