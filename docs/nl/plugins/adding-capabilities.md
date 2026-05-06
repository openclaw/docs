---
read_when:
    - Een nieuwe kernmogelijkheid en een Plugin-registratie-interface toevoegen
    - Bepalen of code thuishoort in de kern, een vendor-Plugin of een feature-Plugin
    - Een nieuwe runtime-helper aansluiten voor kanalen of tools
sidebarTitle: Adding capabilities
summary: Bijdragersgids voor het toevoegen van een nieuwe gedeelde mogelijkheid aan het OpenClaw Plugin-systeem
title: Mogelijkheden toevoegen (bijdragersgids)
x-i18n:
    generated_at: "2026-05-06T09:24:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dit is een **bijdragershandleiding** voor OpenClaw-coreontwikkelaars. Als je
  een externe Plugin bouwt, zie dan [Plugins bouwen](/nl/plugins/building-plugins).
  Voor de diepgaande architectuurreferentie (capabilitymodel, eigenaarschap,
  laadpipeline, runtimehelpers), zie [Plugin-internals](/nl/plugins/architecture).
</Info>

Gebruik dit wanneer OpenClaw een nieuw gedeeld domein nodig heeft, zoals beeldgeneratie, videogeneratie of een toekomstig functiegebied dat door een leverancier wordt ondersteund.

De regel:

- **plugin** = eigendomsgrens
- **capability** = gedeeld corecontract

Begin niet door een leverancier rechtstreeks aan een kanaal of tool te koppelen. Begin met het definiëren van de capability.

## Wanneer je een capability maakt

Maak een nieuwe capability wanneer **alle** volgende punten waar zijn:

1. Meer dan één leverancier zou deze aannemelijk kunnen implementeren.
2. Kanalen, tools of functie-Plugins moeten deze kunnen gebruiken zonder zich om de leverancier te bekommeren.
3. Core moet fallback-, beleids-, configuratie- of leveringsgedrag bezitten.

Als het werk alleen voor één leverancier is en er nog geen gedeeld contract bestaat, stop dan en definieer eerst het contract.

## De standaardvolgorde

1. Definieer het getypeerde corecontract.
2. Voeg Plugin-registratie toe voor dat contract.
3. Voeg een gedeelde runtimehelper toe.
4. Koppel één echte leveranciers-Plugin als bewijs.
5. Verplaats feature-/kanaalgebruikers naar de runtimehelper.
6. Voeg contracttests toe.
7. Documenteer de operatorgerichte configuratie en het eigendomsmodel.

## Wat waar hoort

**Core:**

- Request-/responstypen.
- Providerregister + resolutie.
- Fallbackgedrag.
- Configuratieschema met doorgegeven `title` / `description`-docsmetadata op geneste object-, wildcard-, array-item- en compositieknooppunten.
- Runtimehelper-oppervlak.

**Leveranciers-Plugin:**

- Leveranciers-API-aanroepen.
- Afhandeling van leveranciersauthenticatie.
- Leveranciersspecifieke requestnormalisatie.
- Registratie van de capability-implementatie.

**Feature-/kanaal-Plugin:**

- Roept `api.runtime.*` of de bijpassende `plugin-sdk/*-runtime`-helper aan.
- Roept nooit rechtstreeks een leveranciersimplementatie aan.

## Provider- en harnassenaden

Gebruik **provider hooks** wanneer het gedrag bij het modelprovidercontract hoort in plaats van bij de generieke agentlus. Voorbeelden zijn providerspecifieke requestparams na transportselectie, auth-profielvoorkeur, promptoverlays en fallbackroutering voor vervolgacties na model-/profielfailover.

Gebruik **agent harness hooks** wanneer het gedrag hoort bij de runtime die een beurt uitvoert. Harnassen kunnen succesvolle maar onbruikbare pogingresultaten classificeren, zoals lege, alleen-redenerende of alleen-plannende responses, zodat het buitenste modelfallbackbeleid de retrybeslissing kan nemen.

Houd beide naden smal:

- Core bezit het retry-/fallbackbeleid.
- Provider-Plugins bezitten providerspecifieke request-/auth-/routeringhints.
- Harness-Plugins bezitten runtimespecifieke pogingclassificatie.
- Plugins van derden retourneren hints, geen directe mutaties van corestatus.

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
- Een of meer gebundelde Plugin-pakketten.
- Configuratie, documentatie, tests.

## Uitgewerkt voorbeeld: beeldgeneratie

Beeldgeneratie volgt de standaardvorm:

1. Core definieert `ImageGenerationProvider`.
2. Core stelt `registerImageGenerationProvider(...)` beschikbaar.
3. Core stelt `runtime.imageGeneration.generate(...)` beschikbaar.
4. De Plugins `openai`, `google`, `fal` en `minimax` registreren leveranciersimplementaties.
5. Toekomstige leveranciers registreren hetzelfde contract zonder kanalen/tools te wijzigen.

De configuratiesleutel is bewust gescheiden van routering voor visieanalyse:

- `agents.defaults.imageModel` analyseert afbeeldingen.
- `agents.defaults.imageGenerationModel` genereert afbeeldingen.

Houd die gescheiden zodat fallback en beleid expliciet blijven.

## Reviewchecklist

Controleer voordat je een nieuwe capability levert:

- Geen kanaal/tool importeert leverancierscode rechtstreeks.
- De runtimehelper is het gedeelde pad.
- Ten minste één contracttest bevestigt gebundeld eigenaarschap.
- Configuratiedocumentatie noemt de nieuwe model-/configuratiesleutel.
- Plugin-documentatie legt de eigendomsgrens uit.

Als een PR de capabilitylaag overslaat en leveranciersgedrag hardcodeert in een kanaal/tool, stuur deze dan terug en definieer eerst het contract.

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capabilitymodel, eigenaarschap, laadpipeline, runtimehelpers.
- [Plugins bouwen](/nl/plugins/building-plugins) — tutorial voor je eerste Plugin.
- [SDK-overzicht](/nl/plugins/sdk-overview) — importmap en API-referentie voor registratie.
- [Skills maken](/nl/tools/creating-skills) — begeleidend bijdragersoppervlak.
