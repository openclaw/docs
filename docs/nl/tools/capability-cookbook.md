---
read_when:
    - Een nieuwe kerncapaciteit en Plugin-registratie-interface toevoegen
    - Bepalen of code thuishoort in de kern, een leveranciers-Plugin of een functie-Plugin
    - Een nieuwe runtime-helper voor kanalen of hulpmiddelen aansluiten
sidebarTitle: Adding Capabilities
summary: Bijdragersgids voor het toevoegen van een nieuwe gedeelde mogelijkheid aan het OpenClaw Plugin-systeem
title: Mogelijkheden toevoegen (bijdragersgids)
x-i18n:
    generated_at: "2026-04-29T23:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 16
---

<Info>
  Dit is een **bijdragershandleiding** voor OpenClaw-coreontwikkelaars. Als je een externe plugin bouwt, zie in plaats daarvan [Plugins bouwen](/nl/plugins/building-plugins).
</Info>

Gebruik dit wanneer OpenClaw een nieuw domein nodig heeft, zoals beeldgeneratie, videogeneratie of een toekomstig functiegebied dat door een leverancier wordt ondersteund.

De regel:

- plugin = eigendomsgrens
- capability = gedeeld kerncontract

Dat betekent dat je niet moet beginnen door een leverancier direct aan een kanaal of tool te koppelen. Begin met het definiëren van de capability.

## Wanneer je een capability maakt

Maak een nieuwe capability wanneer al het volgende waar is:

1. meer dan één leverancier zou deze plausibel kunnen implementeren
2. kanalen, tools of functieplugins moeten deze kunnen gebruiken zonder zich om de leverancier te bekommeren
3. core moet fallback-, beleid-, configuratie- of afleveringsgedrag beheren

Als het werk alleen voor een leverancier is en er nog geen gedeeld contract bestaat, stop dan en definieer eerst het contract.

## De standaardvolgorde

1. Definieer het getypeerde kerncontract.
2. Voeg pluginregistratie toe voor dat contract.
3. Voeg een gedeelde runtime-helper toe.
4. Koppel één echte leveranciersplugin als bewijs.
5. Verplaats functie-/kanaalgebruikers naar de runtime-helper.
6. Voeg contracttests toe.
7. Documenteer de operatorgerichte configuratie en het eigendomsmodel.

## Wat waar hoort

Core:

- aanvraag-/antwoordtypen
- providerregister + resolutie
- fallbackgedrag
- configuratieschema plus doorgegeven docs-metadata voor `title` / `description` op geneste object-, jokerteken-, array-item- en compositieknooppunten
- runtime-helperoppervlak

Leveranciersplugin:

- API-aanroepen naar de leverancier
- auth-afhandeling voor de leverancier
- leveranciersspecifieke aanvraagnormalisatie
- registratie van de capability-implementatie

Functie-/kanaalplugin:

- roept `api.runtime.*` aan of de bijpassende `plugin-sdk/*-runtime`-helper
- roept nooit direct een leveranciersimplementatie aan

## Provider- en harness-seams

Gebruik provider-hooks wanneer het gedrag hoort bij het modelprovidercontract in plaats van bij de generieke agentlus. Voorbeelden zijn providerspecifieke aanvraagparameters na transportselectie, voorkeur voor auth-profielen, prompt-overlays en follow-up-fallbackroutering na model-/profiel-failover.

Gebruik agent-harness-hooks wanneer het gedrag hoort bij de runtime die een beurt uitvoert. Harnesses kunnen succesvolle maar onbruikbare pogingresultaten classificeren, zoals lege, alleen-redenerende of alleen-plannende antwoorden, zodat het buitenste model-fallbackbeleid de beslissing voor een nieuwe poging kan nemen.

Houd beide seams smal:

- core beheert het retry-/fallbackbeleid
- providerplugins beheren providerspecifieke aanvraag-/auth-/routeringshints
- harness-plugins beheren runtimespecifieke classificatie van pogingen
- plugins van derden geven hints terug, geen directe mutaties van core-status

## Bestandschecklist

Voor een nieuwe capability kun je verwachten deze gebieden aan te raken:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- een of meer gebundelde pluginpakketten
- config/docs/tests

## Voorbeeld: beeldgeneratie

Beeldgeneratie volgt de standaardvorm:

1. core definieert `ImageGenerationProvider`
2. core stelt `registerImageGenerationProvider(...)` beschikbaar
3. core stelt `runtime.imageGeneration.generate(...)` beschikbaar
4. de plugins `openai`, `google`, `fal` en `minimax` registreren door leveranciers ondersteunde implementaties
5. toekomstige leveranciers kunnen hetzelfde contract registreren zonder kanalen/tools te wijzigen

De configuratiesleutel staat los van routering voor beeldanalyse:

- `agents.defaults.imageModel` = afbeeldingen analyseren
- `agents.defaults.imageGenerationModel` = afbeeldingen genereren

Houd die gescheiden, zodat fallback en beleid expliciet blijven.

## Reviewchecklist

Controleer vóór het uitbrengen van een nieuwe capability:

- geen kanaal/tool importeert direct leverancierscode
- de runtime-helper is het gedeelde pad
- minstens één contracttest bevestigt gebundeld eigendom
- configuratiedocs noemen het nieuwe model/de nieuwe configuratiesleutel
- plugindocs leggen de eigendomsgrens uit

Als een PR de capability-laag overslaat en leveranciersgedrag hardcodet in een kanaal/tool, stuur deze dan terug en definieer eerst het contract.

## Gerelateerd

- [Plugin](/nl/tools/plugin)
- [Skills maken](/nl/tools/creating-skills)
- [Tools en plugins](/nl/tools)
