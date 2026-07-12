---
read_when:
    - Een nieuwe kernfunctionaliteit en een registratie-interface voor Plugins toevoegen
    - Bepalen of code thuishoort in de kern, een leveranciersplugin of een functieplugin
    - Een nieuwe runtimehelper voor kanalen of tools aansluiten
sidebarTitle: Adding capabilities
summary: Handleiding voor bijdragers voor het toevoegen van een nieuwe gedeelde mogelijkheid aan het pluginsysteem van OpenClaw
title: Mogelijkheden toevoegen (gids voor bijdragers)
x-i18n:
    generated_at: "2026-07-12T09:07:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dit is een **bijdragershandleiding** voor ontwikkelaars van de OpenClaw-kern. Als u
  een externe Plugin bouwt, raadpleegt u in plaats daarvan [Plugins bouwen](/nl/plugins/building-plugins).
  Voor de uitgebreide architectuurreferentie (capabiliteitsmodel, eigenaarschap,
  laadpijplijn, runtimehelpers) raadpleegt u [Interne werking van Plugins](/nl/plugins/architecture).
</Info>

Gebruik dit wanneer OpenClaw een nieuw gedeeld domein nodig heeft, zoals embeddings,
beeldgeneratie, videogeneratie of een toekomstig functiegebied dat door leveranciers wordt ondersteund.

De regel:

- **Plugin** = eigendomsgrens
- **capabiliteit** = gedeeld kerncontract

Koppel een leverancier niet rechtstreeks aan een kanaal of tool. Definieer eerst de capabiliteit.

## Wanneer u een capabiliteit maakt

Maak alleen een nieuwe capabiliteit wanneer **al** het volgende waar is:

1. Meer dan één leverancier zou deze redelijkerwijs kunnen implementeren.
2. Kanalen, tools of functie-Plugins moeten deze kunnen gebruiken zonder rekening te houden met de leverancier.
3. De kern moet eigenaar zijn van fallback-, beleids-, configuratie- of afleveringsgedrag.

Als het werk uitsluitend voor een leverancier is en er nog geen gedeeld contract bestaat, definieert u eerst het contract.

## De standaardvolgorde

1. Definieer het getypeerde kerncontract.
2. Voeg Plugin-registratie voor dat contract toe.
3. Voeg een gedeelde runtimehelper toe.
4. Koppel ter bevestiging één echte leveranciers-Plugin.
5. Laat functie- en kanaalgebruikers de runtimehelper gebruiken.
6. Voeg contracttests toe.
7. Documenteer de configuratie voor beheerders en het eigendomsmodel.

## Wat hoort waar

| Laag                       | Is eigenaar van                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Kern**                   | Aanvraag-/antwoordtypen; providerregister en -resolutie; fallbackgedrag; configuratieschema met doorgegeven documentatiemetagegevens voor `title`/`description` op geneste object-, jokerteken-, array-item- en compositieknooppunten; runtimehelperoppervlak. |
| **Leveranciers-Plugin**    | API-aanroepen naar de leverancier, afhandeling van leveranciersauthenticatie, leveranciersspecifieke normalisatie van aanvragen en registratie van de capabiliteitsimplementatie.                                                     |
| **Functie-/kanaal-Plugin** | Roept `api.runtime.*` of de bijbehorende helper `plugin-sdk/*-runtime` aan. Roept nooit rechtstreeks een leveranciersimplementatie aan.                                                                                                |

## Koppelpunten voor providers en harnassen

Gebruik **providerhooks** wanneer het gedrag bij het modelprovidercontract hoort in plaats van bij de algemene agentlus. Voorbeelden zijn providerspecifieke aanvraagparameters na transportselectie, voorkeuren voor authenticatieprofielen, promptoverlays en vervolgfallbackroutering na een failover van model of profiel.

Gebruik **agentharnashooks** wanneer het gedrag bij de runtime hoort die een beurt uitvoert. Harnassen kunnen expliciete protocolresultaten classificeren, zoals lege uitvoer, redeneringen zonder zichtbare uitvoer of een gestructureerd plan zonder definitief antwoord, zodat het buitenste fallbackbeleid voor modellen kan beslissen of opnieuw moet worden geprobeerd.

Houd beide koppelpunten beperkt:

- De kern is eigenaar van het beleid voor opnieuw proberen en fallback.
- Provider-Plugins zijn eigenaar van providerspecifieke hints voor aanvragen, authenticatie en routering.
- Harnas-Plugins zijn eigenaar van runtimespecifieke classificatie van pogingen.
- Plugins van derden retourneren hints en wijzigen de kernstatus niet rechtstreeks.

## Bestandscontrolelijst

Voor een nieuwe capabiliteit zult u naar verwachting deze gebieden aanpassen:

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
- Configuratie, documentatie en tests.

## Uitgewerkt voorbeeld: beeldgeneratie

Beeldgeneratie volgt de standaardstructuur:

1. De kern definieert `ImageGenerationProvider`.
2. De kern stelt `registerImageGenerationProvider(...)` beschikbaar.
3. De kern stelt `api.runtime.imageGeneration.generate(...)` en `.listProviders(...)` beschikbaar.
4. Leveranciers-Plugins (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registreren door leveranciers ondersteunde implementaties.
5. Toekomstige leveranciers registreren hetzelfde contract zonder kanalen of tools te wijzigen.

De configuratiesleutel is bewust gescheiden van routering voor beeldanalyse:

- `agents.defaults.imageModel` analyseert afbeeldingen.
- `agents.defaults.imageGenerationModel` genereert afbeeldingen.

Houd deze gescheiden, zodat fallback en beleid expliciet blijven.

## Embeddingproviders

Gebruik `registerEmbeddingProvider(...)` / contract `embeddingProviders` voor
herbruikbare providers van vectorembeddings. Dit contract is bewust breder
dan geheugen: tools, zoekfuncties, informatieophaling, importeurs of toekomstige functie-Plugins
kunnen embeddings gebruiken zonder afhankelijk te zijn van de geheugenengine. Zoeken in het geheugen
gebruikt ook algemene `embeddingProviders`.

De oudere geheugenspecifieke registratie-API en het contract `memoryEmbeddingProviders`
zijn verouderd. Gebruik `registerEmbeddingProvider` en
`embeddingProviders` voor alle nieuwe embeddingproviders.

## Controlelijst voor beoordeling

Controleer voordat u een nieuwe capabiliteit uitbrengt:

- Geen enkel kanaal of tool importeert leverancierscode rechtstreeks.
- De runtimehelper is het gedeelde pad.
- Ten minste één contracttest bevestigt het gebundelde eigenaarschap.
- De configuratiedocumentatie noemt de nieuwe model- of configuratiesleutel.
- De Plugin-documentatie legt de eigendomsgrens uit.

Als een PR de capabiliteitslaag overslaat en leveranciersgedrag rechtstreeks in een kanaal of tool vastlegt, stuurt u deze terug en definieert u eerst het contract.

## Gerelateerd

- [Interne werking van Plugins](/nl/plugins/architecture) — capabiliteitsmodel, eigenaarschap, laadpijplijn en runtimehelpers.
- [Plugins bouwen](/nl/plugins/building-plugins) — zelfstudie voor de eerste Plugin.
- [SDK-overzicht](/nl/plugins/sdk-overview) — referentie voor de importtoewijzing en registratie-API.
- [Skills maken](/nl/tools/creating-skills) — aanvullend oppervlak voor bijdragers.
