---
read_when:
    - Een nieuwe kernmogelijkheid en Plugin-registratieoppervlak toevoegen
    - Bepalen of code thuishoort in de kern, een leveranciers-Plugin of een functie-Plugin
    - Een nieuwe runtime-helper voor kanalen of tools bedraden
sidebarTitle: Adding capabilities
summary: Bijdragersgids voor het toevoegen van een nieuwe gedeelde mogelijkheid aan het OpenClaw Plugin-systeem
title: Mogelijkheden toevoegen (handleiding voor bijdragers)
x-i18n:
    generated_at: "2026-06-27T17:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dit is een **bijdragershandleiding** voor OpenClaw-coreontwikkelaars. Als je
  een externe Plugin bouwt, zie in plaats daarvan [Plugins bouwen](/nl/plugins/building-plugins).
  Voor de uitgebreide architectuurreferentie (capaciteitsmodel, eigenaarschap,
  laadpijplijn, runtime-helpers), zie [Plugin-internals](/nl/plugins/architecture).
</Info>

Gebruik dit wanneer OpenClaw een nieuw gedeeld domein nodig heeft, zoals embeddings, afbeeldingengeneratie, videogeneratie of een toekomstig door leveranciers ondersteund functiegebied.

De regel:

- **Plugin** = eigendomsgrens
- **capaciteit** = gedeeld corecontract

Begin niet door een leverancier direct aan een kanaal of tool te koppelen. Begin met het definiëren van de capaciteit.

## Wanneer je een capaciteit maakt

Maak een nieuwe capaciteit wanneer **al** het volgende waar is:

1. Meer dan één leverancier zou deze plausibel kunnen implementeren.
2. Kanalen, tools of functie-Plugins moeten deze kunnen gebruiken zonder zich om de leverancier te bekommeren.
3. Core moet eigenaar zijn van fallback-, beleid-, configuratie- of aflevergedrag.

Als het werk alleen voor een leverancier is en er nog geen gedeeld contract bestaat, stop dan en definieer eerst het contract.

## De standaardvolgorde

1. Definieer het getypeerde corecontract.
2. Voeg Plugin-registratie voor dat contract toe.
3. Voeg een gedeelde runtime-helper toe.
4. Sluit één echte leveranciers-Plugin aan als bewijs.
5. Verplaats functie-/kanaalgebruikers naar de runtime-helper.
6. Voeg contracttests toe.
7. Documenteer de operatorgerichte configuratie en het eigendomsmodel.

## Wat waar hoort

**Core:**

- Aanvraag-/antwoordtypen.
- Providerregister + resolutie.
- Fallbackgedrag.
- Configuratieschema met doorgegeven `title` / `description`-docsmetadata op geneste object-, wildcard-, array-item- en compositieknooppunten.
- Runtime-helperinterface.

**Leveranciers-Plugin:**

- Leveranciers-API-aanroepen.
- Leveranciersauthenticatieafhandeling.
- Leveranciersspecifieke aanvraagnormalisatie.
- Registratie van de capaciteitsimplementatie.

**Functie-/kanaal-Plugin:**

- Roept `api.runtime.*` of de bijbehorende `plugin-sdk/*-runtime`-helper aan.
- Roept nooit direct een leveranciersimplementatie aan.

## Provider- en harness-raakvlakken

Gebruik **provider-hooks** wanneer het gedrag bij het modelprovidercontract hoort in plaats van bij de generieke agentlus. Voorbeelden zijn providerspecifieke aanvraagparameters na transportselectie, auth-profielvoorkeur, prompt-overlays en vervolgfallbackroutering na model-/profielfailover.

Gebruik **agent-harness-hooks** wanneer het gedrag hoort bij de runtime die een beurt uitvoert. Harnassen kunnen expliciete protocoluitkomsten classificeren, zoals lege uitvoer, redenering zonder zichtbare uitvoer of een gestructureerd plan zonder eindantwoord, zodat het buitenste modelfallbackbeleid de beslissing voor een nieuwe poging kan nemen.

Houd beide raakvlakken smal:

- Core is eigenaar van het retry-/fallbackbeleid.
- Provider-Plugins zijn eigenaar van providerspecifieke aanvraag-/auth-/routeringshints.
- Harness-Plugins zijn eigenaar van runtimespecifieke pogingclassificatie.
- Plugins van derden retourneren hints, geen directe mutaties van corestatus.

## Bestandschecklist

Verwacht voor een nieuwe capaciteit deze gebieden aan te raken:

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
- Configuratie, docs, tests.

## Uitgewerkt voorbeeld: afbeeldingengeneratie

Afbeeldingengeneratie volgt de standaardvorm:

1. Core definieert `ImageGenerationProvider`.
2. Core stelt `registerImageGenerationProvider(...)` beschikbaar.
3. Core stelt `runtime.imageGeneration.generate(...)` beschikbaar.
4. De `openai`-, `google`-, `fal`- en `minimax`-Plugins registreren door leveranciers ondersteunde implementaties.
5. Toekomstige leveranciers registreren hetzelfde contract zonder kanalen/tools te wijzigen.

De configuratiesleutel staat bewust los van routering voor beeldanalyse:

- `agents.defaults.imageModel` analyseert afbeeldingen.
- `agents.defaults.imageGenerationModel` genereert afbeeldingen.

Houd die gescheiden zodat fallback en beleid expliciet blijven.

## Embeddingproviders

Gebruik `embeddingProviders` voor herbruikbare providers voor vectorembeddings. Dit contract
is bewust breder dan geheugen: tools, zoeken, retrieval, importeurs of
toekomstige functie-Plugins kunnen embeddings gebruiken zonder afhankelijk te zijn van de geheugenengine.

Geheugenzoekopdrachten kunnen generieke `embeddingProviders` gebruiken. Het oudere
`memoryEmbeddingProviders`-contract is verouderde compatibiliteit terwijl bestaande
geheugenspecifieke providers migreren; nieuwe herbruikbare embeddingproviders moeten
`embeddingProviders` gebruiken.

## Reviewchecklist

Controleer vóór verzending van een nieuwe capaciteit:

- Geen kanaal/tool importeert leverancierscode direct.
- De runtime-helper is het gedeelde pad.
- Minstens één contracttest verifieert gebundeld eigenaarschap.
- Configuratiedocs noemen de nieuwe model-/configuratiesleutel.
- Plugin-docs leggen de eigendomsgrens uit.

Als een PR de capaciteitslaag overslaat en leveranciersgedrag hardcodeert in een kanaal/tool, stuur deze dan terug en definieer eerst het contract.

## Gerelateerd

- [Plugin-internals](/nl/plugins/architecture) — capaciteitsmodel, eigenaarschap, laadpijplijn, runtime-helpers.
- [Plugins bouwen](/nl/plugins/building-plugins) — tutorial voor de eerste Plugin.
- [SDK-overzicht](/nl/plugins/sdk-overview) — importmap en API-referentie voor registratie.
- [Skills maken](/nl/tools/creating-skills) — bijbehorend bijdragersoppervlak.
