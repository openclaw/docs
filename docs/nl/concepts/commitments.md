---
read_when:
    - Je wilt dat OpenClaw natuurlijke vervolgvragen onthoudt
    - Je wilt begrijpen hoe afgeleide check-ins verschillen van herinneringen
    - Je wilt vervolgtoezeggingen beoordelen of afwijzen
sidebarTitle: Commitments
summary: Afgeleid vervolggeheugen voor check-ins die geen exacte herinneringen zijn
title: Afgeleide toezeggingen
x-i18n:
    generated_at: "2026-07-16T15:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitments zijn kortstondige herinneringen voor vervolgacties. Wanneer deze functie is ingeschakeld, kan OpenClaw
opmerken dat een gesprek aanleiding geeft tot een toekomstige check-in en onthouden
om daar later op terug te komen.

Voorbeelden:

- Je noemt een sollicitatiegesprek morgen. OpenClaw kan daarna vragen hoe het ging.
- Je zegt dat je uitgeput bent. OpenClaw kan later vragen of je hebt geslapen.
- De agent zegt dat deze erop terugkomt nadat er iets verandert. OpenClaw kan
  die openstaande kwestie bijhouden.

Commitments zijn geen duurzame feiten zoals `MEMORY.md`, en het zijn geen exacte
herinneringen. Ze bevinden zich tussen geheugen en automatisering: OpenClaw onthoudt een
aan het gesprek gebonden verplichting, waarna Heartbeat deze aflevert wanneer het moment daarvoor is aangebroken.

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

`commitments.maxPerDay` beperkt hoeveel afgeleide vervolgacties
per agentsessie binnen een voortschrijdende dag kunnen worden afgeleverd. De standaardwaarde is `3`.

## Hoe het werkt

Na een antwoord van een agent kan OpenClaw op de achtergrond een verborgen extractieronde uitvoeren in een
afzonderlijke context, waarbij tools zijn uitgeschakeld. Deze ronde zoekt alleen naar afgeleide commitments voor vervolgacties. De ronde
schrijft niets naar het zichtbare gesprek en vraagt de hoofdagent niet
om over de extractie te redeneren.

Wanneer een kandidaat met hoge betrouwbaarheid wordt gevonden, slaat OpenClaw een commitment op met:

- de agent-id
- de sessiesleutel
- het oorspronkelijke kanaal en afleverdoel
- een tijdvenster
- een korte voorgestelde check-in
- niet-instruerende metadata waarmee Heartbeat bepaalt of deze moet worden verzonden

Aflevering vindt plaats via Heartbeat. Wanneer een commitment aan de beurt is, voegt Heartbeat
de commitment toe aan de Heartbeat-beurt voor dezelfde agent- en kanaalscope.
De prompt waarschuwt expliciet dat commitmentmetadata niet wordt vertrouwd en instrueert
het model om instructies daarin niet op te volgen en er geen tools vanwege te gebruiken. Het
model kan één natuurlijke check-in verzenden of antwoorden met `HEARTBEAT_OK` om deze te negeren.
Als Heartbeat is geconfigureerd met `target: "none"`, blijven commitments die aan de beurt zijn
intern en worden geen externe check-ins verzonden. Prompts voor het afleveren van commitments
herhalen niet de oorspronkelijke gesprekstekst, maar alleen de voorgestelde check-in en
metadata, en Heartbeat-beurten voor commitments die aan de beurt zijn, worden zonder OpenClaw-tools uitgevoerd.

OpenClaw levert een afgeleide commitment nooit onmiddellijk na het opslaan ervan af.
Het tijdstip wordt begrensd op minimaal één Heartbeat-interval nadat de commitment
is aangemaakt, zodat de vervolgactie niet op hetzelfde moment wordt teruggekaatst waarop deze
is afgeleid.

## Scope

Commitments zijn beperkt tot exact de agent- en kanaalcontext waarin ze zijn
aangemaakt. Een vervolgactie die tijdens een gesprek met één agent in Discord wordt afgeleid, wordt niet
afgeleverd door een andere agent, een ander kanaal of een niet-gerelateerde sessie.

Deze scope maakt deel uit van de functie. Natuurlijke check-ins moeten aanvoelen alsof hetzelfde
gesprek wordt voortgezet, niet als een wereldwijd herinneringssysteem.

## Commitments versus herinneringen

| Behoefte                                         | Gebruik                                  |
| ------------------------------------------------ | ---------------------------------------- |
| "Herinner me om 15.00 uur"                       | [Geplande taken](/nl/automation/cron-jobs)  |
| "Stuur me over 20 minuten een bericht"           | [Geplande taken](/nl/automation/cron-jobs)  |
| "Voer dit rapport elke werkdag uit"              | [Geplande taken](/nl/automation/cron-jobs)  |
| "Ik heb morgen een sollicitatiegesprek"           | Commitments                              |
| "Ik ben de hele nacht wakker geweest"            | Commitments                              |
| "Kom erop terug als ik niet op deze openstaande kwestie antwoord" | Commitments                 |

Exacte verzoeken van gebruikers horen al bij het plannerpad. Commitments zijn alleen
voor afgeleide vervolgacties: de momenten waarop de gebruiker niet om een herinnering heeft gevraagd,
maar het gesprek duidelijk aanleiding geeft tot een nuttige toekomstige check-in.

## Commitments beheren

Gebruik de CLI om opgeslagen commitments te bekijken en te wissen:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Zie [`openclaw commitments`](/nl/cli/commitments) voor de volledige opdrachtreferentie.

## Privacy en kosten

Voor de extractie van commitments wordt een LLM-ronde gebruikt, dus het inschakelen ervan voegt na geschikte beurten
modelgebruik op de achtergrond toe. De ronde is verborgen voor het voor de gebruiker zichtbare
gesprek, maar kan de recente uitwisseling lezen die nodig is om te bepalen of er een
vervolgactie bestaat.

Opgeslagen commitments vormen lokaal operationeel geheugen van OpenClaw in de gedeelde SQLite-
statusdatabase, geen langetermijngeheugen. Schakel de functie uit met:

```bash
openclaw config set commitments.enabled false
```

## Problemen oplossen

Als verwachte vervolgacties niet verschijnen:

- Controleer of `commitments.enabled` is ingesteld op `true`.
- Controleer `openclaw commitments --all` op wachtende, genegeerde, uitgestelde of verlopen
  records.
- Zorg dat Heartbeat voor de agent actief is.
- Controleer of `commitments.maxPerDay` al is bereikt voor die
  agentsessie.
- Onthoud dat exacte herinneringen worden overgeslagen bij de extractie van commitments en in plaats daarvan
  onder [geplande taken](/nl/automation/cron-jobs) moeten verschijnen.

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [`openclaw commitments`](/nl/cli/commitments)
- [Configuratiereferentie](/nl/gateway/configuration-reference#commitments)
