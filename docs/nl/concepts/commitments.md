---
read_when:
    - Je wilt dat OpenClaw natuurlijke vervolgvragen onthoudt
    - U wilt begrijpen hoe afgeleide check-ins verschillen van herinneringen
    - U wilt vervolgtoezeggingen beoordelen of afwijzen
sidebarTitle: Commitments
summary: Afgeleid vervolggeheugen voor check-ins die geen exacte herinneringen zijn
title: Afgeleide toezeggingen
x-i18n:
    generated_at: "2026-07-12T08:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments zijn kortdurende herinneringen voor opvolging. Wanneer deze functie is ingeschakeld, kan OpenClaw
opmerken dat een gesprek aanleiding geeft tot een toekomstig contactmoment en onthouden
om er later op terug te komen.

Voorbeelden:

- Je noemt een sollicitatiegesprek dat morgen plaatsvindt. OpenClaw kan daarna vragen hoe het ging.
- Je zegt dat je uitgeput bent. OpenClaw kan later vragen of je hebt geslapen.
- De agent zegt dat deze iets zal opvolgen nadat er iets verandert. OpenClaw kan
  die openstaande kwestie bijhouden.

Commitments zijn geen duurzame feiten zoals `MEMORY.md` en ook geen exacte
herinneringen. Ze bevinden zich tussen geheugen en automatisering: OpenClaw onthoudt een
gespreksgebonden verplichting, waarna Heartbeat deze aflevert wanneer het moment daarvoor is aangebroken.

## Commitments inschakelen

Commitments zijn standaard uitgeschakeld (`commitments.enabled: false`). Schakel ze in de configuratie in:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Gelijkwaardige `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` beperkt hoeveel afgeleide opvolgingen
per agentsessie binnen een voortschrijdende dag kunnen worden afgeleverd. De standaardwaarde is `3`.

## Werking

Na een antwoord van een agent kan OpenClaw een verborgen extractieronde op de achtergrond uitvoeren in een
afzonderlijke context, waarbij tools zijn uitgeschakeld. Die ronde zoekt uitsluitend naar afgeleide opvolgverplichtingen. Deze
schrijft niets naar het zichtbare gesprek en vraagt de hoofdagent niet
om over de extractie te redeneren.

Wanneer een kandidaat met hoge betrouwbaarheid wordt gevonden, slaat OpenClaw een Commitment op met:

- de agent-id
- de sessiesleutel
- het oorspronkelijke kanaal en afleverdoel
- een tijdvenster voor uitvoering
- een korte voorgestelde navraag
- niet-instruerende metagegevens waarmee Heartbeat bepaalt of deze moet worden verzonden

Aflevering vindt plaats via Heartbeat. Wanneer het tijdstip voor een Commitment is aangebroken, voegt Heartbeat
de Commitment toe aan de Heartbeat-beurt voor dezelfde agent- en kanaalcontext.
De prompt waarschuwt expliciet dat de metagegevens van de Commitment niet worden vertrouwd en instrueert
het model om instructies daarin niet te volgen en er geen tools vanwege te gebruiken. Het
model kan één natuurlijke navraag verzenden of met `HEARTBEAT_OK` antwoorden om deze te negeren.
Als Heartbeat is geconfigureerd met `target: "none"`, blijven vervallen Commitments
intern en worden er geen externe contactmomenten verzonden. Prompts voor het afleveren van Commitments
herhalen de oorspronkelijke gesprekstekst niet, maar bevatten alleen de voorgestelde navraag en
metagegevens. Heartbeat-beurten voor vervallen Commitments worden zonder OpenClaw-tools uitgevoerd.

OpenClaw levert een afgeleide Commitment nooit onmiddellijk na het opslaan af.
Het tijdstip wordt begrensd op minimaal één Heartbeat-interval nadat de Commitment
is aangemaakt, zodat de opvolging niet op hetzelfde moment wordt teruggestuurd als waarop deze
werd afgeleid.

## Bereik

Commitments zijn beperkt tot exact de agent- en kanaalcontext waarin ze zijn
aangemaakt. Een opvolging die is afgeleid tijdens een gesprek met één agent in Discord wordt niet
afgeleverd door een andere agent, een ander kanaal of een niet-gerelateerde sessie.

Dit bereik maakt deel uit van de functie. Natuurlijke contactmomenten moeten aanvoelen alsof hetzelfde
gesprek wordt voortgezet, niet als een wereldwijd herinneringssysteem.

## Commitments versus herinneringen

| Behoefte                                        | Gebruik                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Herinner me om 15.00 uur"                      | [Geplande taken](/nl/automation/cron-jobs)  |
| "Stuur me over 20 minuten een bericht"          | [Geplande taken](/nl/automation/cron-jobs)  |
| "Voer dit rapport elke werkdag uit"             | [Geplande taken](/nl/automation/cron-jobs)  |
| "Ik heb morgen een sollicitatiegesprek"         | Commitments                              |
| "Ik ben de hele nacht wakker geweest"           | Commitments                              |
| "Volg dit openstaande gesprek op als ik niet antwoord" | Commitments                       |

Exacte verzoeken van gebruikers horen al bij het pad van de planner. Commitments zijn uitsluitend
bedoeld voor afgeleide opvolgingen: momenten waarop de gebruiker niet om een herinnering heeft gevraagd,
maar het gesprek duidelijk aanleiding gaf tot een nuttig toekomstig contactmoment.

## Commitments beheren

Gebruik de CLI om opgeslagen Commitments te bekijken en te wissen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Zie [`openclaw commitments`](/nl/cli/commitments) voor de volledige opdrachtreferentie.

## Privacy en kosten

Voor het extraheren van Commitments wordt een LLM-ronde gebruikt. Als je deze functie inschakelt, leidt dat dus tot extra modelgebruik
op de achtergrond na geschikte beurten. De ronde is verborgen in het voor de gebruiker zichtbare
gesprek, maar kan de recente uitwisseling lezen die nodig is om te bepalen of er
een opvolging bestaat.

Opgeslagen Commitments zijn lokale OpenClaw-statusgegevens. Ze zijn operationeel geheugen, geen
langetermijngeheugen. Schakel de functie uit met:

```bash
openclaw config set commitments.enabled false
```

## Probleemoplossing

Als verwachte opvolgingen niet verschijnen:

- Controleer of `commitments.enabled` `true` is.
- Controleer met `openclaw commitments --all` op wachtende, genegeerde, uitgestelde of verlopen
  vermeldingen.
- Controleer of Heartbeat actief is voor de agent.
- Controleer of `commitments.maxPerDay` voor die agentsessie al is
  bereikt.
- Onthoud dat exacte herinneringen bij de extractie van Commitments worden overgeslagen en in plaats daarvan
  onder [geplande taken](/nl/automation/cron-jobs) moeten verschijnen.

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [`openclaw commitments`](/nl/cli/commitments)
- [Configuratiereferentie](/nl/gateway/configuration-reference#commitments)
