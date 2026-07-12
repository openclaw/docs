---
read_when:
    - Je wilt een gratis promotieaanbod voor een model van ClawHub uitproberen
    - Je configureert een provider via een promotie in plaats van via onboarding
summary: CLI-referentie voor `openclaw promos` (aanbiedingen voor promotiemodellen weergeven en claimen)
title: Promoties
x-i18n:
    generated_at: "2026-07-12T08:46:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Ontdek en claim promotionele modelaanbiedingen die op ClawHub zijn gepubliceerd. Wanneer je een
promotie claimt, wordt de provider geconfigureerd (authenticatie en Plugin, indien nodig) en worden
de modellen van de promotie geregistreerd — zonder de onboarding opnieuw uit te voeren en zonder
je standaardmodel te wijzigen, tenzij je dat aangeeft.

Gerelateerd:

- Standaardmodel en fallbacks: [Modellen](/nl/cli/models)
- Authenticatie-instelling voor providers: [Aan de slag](/nl/start/getting-started)

## Opdrachten

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Toont promoties die momenteel actief zijn, met hun modellen, het voorgestelde
standaardmodel, de resterende tijd en de exacte claimopdracht. `--json` toont de onbewerkte
payload.

## `openclaw promos claim <slug>`

Claimt een actieve promotie:

1. Haalt de promotie op bij ClawHub en controleert of deze binnen de geldigheidsperiode valt.
2. Valideert de provider, de authenticatiekeuze en de opgegeven Plugin-pakketten van de promotie
   aan de hand van je geïnstalleerde OpenClaw-versie. Onbekende id's of niet-overeenkomende pakketten
   worden geweigerd — een promotie kan de CLI nooit iets laten uitvoeren waarvoor deze niet al
   ondersteuning biedt.
3. Hergebruikt je bestaande providerreferenties als je die hebt. Anders wordt
   de normale authenticatieprocedure van de provider doorlopen (waarbij eerst de aanmeldings-URL
   van de promotie voor een gratis sleutel wordt weergegeven). Met `--api-key <key>` wordt authenticatie
   via een API-sleutel zonder vragen voltooid, overeenkomstig de niet-interactieve vlaggen van
   `openclaw onboard`; exporteer in plaats daarvan de omgevingsvariabele van de provider
   (bijvoorbeeld `OPENROUTER_API_KEY`) om de sleutel buiten de opdrachtregel te houden — bestaande
   referenties in omgevingsvariabelen worden automatisch gedetecteerd en er is geen vlag nodig.
4. Registreert de modellen van de promotie met hun aliassen. Bestaande aliassen worden
   nooit overschreven.
5. Biedt aan om het voorgestelde model van de promotie als je standaardmodel in te stellen —
   met `--set-default` wordt de vraag overgeslagen; anders verandert er niets aan je standaardinstellingen.

Wanneer de geldigheidsperiode van de promotie eindigt, stopt de provider met het aanbieden van de gratis modellen;
je configuratie en referenties blijven ongewijzigd. Schakel op elk moment terug met
`openclaw models set <model>`.

## Passieve ontdekking in `models list`

`openclaw models list` toont ook promoties zonder dat je ClawHub
rechtstreeks raadpleegt:

- Actieve aanbiedingen waarvan je de modellen niet hebt geconfigureerd, verschijnen in een
  groep 'Beschikbaar via promotie' onder de tabel, elk met de bijbehorende claimopdracht.
- Modellen die je via `promos claim` hebt geregistreerd, hebben een `promo`-tag, die
  verandert in `promo ended` zodra de geldigheidsperiode van de aanbieding is verstreken.
- De eerste keer dat een nieuwe aanbieding wordt gezien, verwijst een eenmalige melding naar
  `openclaw promos list`. Aanbiedingen die je al hebt weergegeven of geclaimd, worden nooit
  opnieuw aangekondigd.

Hiervoor wordt een lokaal gecachte kopie van de door ClawHub gehoste promotiefeed gelezen
(normaal eenmaal per dag vernieuwd met een voorwaardelijk verzoek, of eerder wanneer de
gecachete momentopname verloopt; fouten bij het vernieuwen worden stilzwijgend overgeslagen). Het vernieuwen
van een verouderde kopie wacht maximaal 2,5 seconden en onderbreekt de weergave nooit. Uitvoer met `--json` en
`--plain` blijft geschikt voor machinale verwerking: zonder promotiesecties of meldingen.
Bij het claimen wordt altijd opnieuw gevalideerd via de live-API van ClawHub, zodat een voortijdig ingetrokken
aanbieding wordt geweigerd, zelfs wanneer deze nog in een gecachte kopie wordt weergegeven.
