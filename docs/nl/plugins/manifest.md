---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configuratieschema leveren of Plugin-validatiefouten opsporen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Plugin-manifest
x-i18n:
    generated_at: "2026-06-27T17:54:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **eigen OpenClaw-Pluginmanifest**.

Zie [Pluginbundels](/nl/plugins/bundles) voor compatibele bundelindelingen.

Compatibele bundelindelingen gebruiken andere manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json` of de standaard Claude-componentindeling
  zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert die bundelindelingen ook automatisch, maar ze worden niet gevalideerd
tegen het hier beschreven `openclaw.plugin.json`-schema.

Voor compatibele bundels leest OpenClaw momenteel bundelmetadata plus gedeclareerde
skillroots, Claude-commandoroots, standaardwaarden uit Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hookpakketten wanneer de indeling
overeenkomt met de runtimeverwachtingen van OpenClaw.

Elke eigen OpenClaw-Plugin **moet** een `openclaw.plugin.json`-bestand leveren in de
**Pluginroot**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugincode uit te voeren**. Ontbrekende of ongeldige manifests worden behandeld als
Pluginfouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het Pluginsysteem: [Plugins](/nl/tools/plugin).
Voor het eigen capabilitymodel en de huidige richtlijnen voor externe compatibiliteit:
[Capabilitymodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugincode laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Pluginruntime te starten.

**Gebruik het voor:**

- Pluginidentiteit, configuratievalidatie en hints voor configuratie-UI
- auth-, onboarding- en setupmetadata (alias, automatisch inschakelen, provider-env-vars, authkeuzes)
- activatiehints voor control-plane-oppervlakken
- eigenaarschap van verkorte modelfamilies
- statische snapshots van capability-eigenaarschap (`contracts`)
- QA-runner-metadata die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die wordt samengevoegd in catalogus- en validatieoppervlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints
of npm-installatiemetadata. Die horen thuis in je Plugincode en `package.json`.

## Minimaal voorbeeld

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Uitgebreid voorbeeld

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referentie voor top-level velden

| Veld                                 | Vereist | Type                             | Wat het betekent                                                                                                                                                                                                                               |
| ------------------------------------ | ------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                                |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                                       |
| `requiresPlugins`                    | Nee     | `string[]`                       | Plugin-id's die ook moeten zijn geïnstalleerd om deze Plugin effect te laten hebben. Discovery houdt de Plugin laadbaar, maar waarschuwt wanneer een vereiste Plugin ontbreekt.                                                               |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een waarde anders dan `true` in, om de Plugin standaard uitgeschakeld te laten.                                                                              |
| `enabledByDefaultOnPlatforms`        | Nee     | `string[]`                       | Markeert een gebundelde Plugin als standaard ingeschakeld, maar alleen op de vermelde Node.js-platformen, bijvoorbeeld `["darwin"]`. Expliciete configuratie heeft nog steeds voorrang.                                                       |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde id's die naar deze canonieke Plugin-id normaliseren.                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer auth, configuratie of modelverwijzingen ze noemen.                                                                                                                       |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                             |
| `channels`                           | Nee     | `string[]`                       | Kanaal-id's die eigendom zijn van deze Plugin. Gebruikt voor discovery en configuratievalidatie.                                                                                                                                               |
| `providers`                          | Nee     | `string[]`                       | Provider-id's die eigendom zijn van deze Plugin.                                                                                                                                                                                              |
| `providerCatalogEntry`               | Nee     | `string`                         | Lichtgewicht modulepad voor de provider-catalogus, relatief aan de Plugin-root, voor provider-catalogusmetadata binnen de manifestscope die kan worden geladen zonder de volledige Plugin-runtime te activeren.                               |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte model-familiemetadata die wordt gebruikt om de Plugin vóór runtime automatisch te laden.                                                                                                                  |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-planecontract voor toekomstige alleen-lezen-lijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd extern prijsopzoekbeleid. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te laten stappen of providerverwijzingen toe te wijzen aan OpenRouter/LiteLLM-catalogus-id's zonder provider-id's in de kern hard te coderen. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime laadt.                                                                                                             |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde endpoint-host-/baseUrl-metadata voor providerroutes die de kern moet classificeren voordat de provider-runtime laadt.                                                                                              |
| `providerRequest`                    | Nee     | `object`                         | Goedkope provider-familie- en aanvraagcompatibiliteitsmetadata die door generiek aanvraagbeleid wordt gebruikt voordat de provider-runtime laadt.                                                                                             |
| `secretProviderIntegrations`         | Nee     | `Record<string, object>`         | Declaratieve SecretRef exec-providerpresets die setup- of installatiesurfaces kunnen aanbieden zonder providerspecifieke integraties in de kern hard te coderen.                                                                              |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inference-backend-id's die eigendom zijn van deze Plugin. Gebruikt voor automatische startupactivatie vanuit expliciete configuratieverwijzingen.                                                                                         |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backendverwijzingen waarvan de door de Plugin beheerde synthetische auth-hook moet worden geprobed tijdens koude modeldiscovery voordat de runtime laadt.                                                                    |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Door gebundelde Plugins beheerde placeholderwaarden voor API-sleutels die niet-geheime lokale, OAuth- of omgevingscredentialstatus vertegenwoordigen.                                                                                        |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en Plugin-bewuste configuratie- en CLI-diagnostiek moeten opleveren voordat de runtime laadt.                                                                                                 |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor provider-auth/statusopzoekingen. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog steeds tijdens de deprecatieperiode.                              |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-id's die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codingprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                            |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor env-gestuurde kanaalsetup of auth-surfaces die generieke startup-/configuratiehelpers moeten zien.                                   |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboardingkiezers, resolutie van voorkeursproviders en eenvoudige CLI-flagbedrading.                                                                                                                        |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activatieplanner voor startup, provider, commando, kanaal, route en capability-getriggerd laden. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.                                  |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingdescriptors die discovery- en setup-surfaces kunnen inspecteren zonder Plugin-runtime te laden.                                                                                                                     |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerdescriptors die worden gebruikt door de gedeelde `openclaw qa`-host voordat de Plugin-runtime laadt.                                                                                                                        |
| `contracts`                          | Nee     | `object`                         | Statische momentopname van capability-eigenaarschap voor externe auth-hooks, embeddings, spraak, realtime transcriptie, realtime stem, mediabegrip, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoeken en tool-eigenaarschap. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope mediabegripstandaarden voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                                          |
| `imageGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor afbeeldingsgeneratie voor provider-id's die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-guards.                                     |
| `videoGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor videogeneratie voor provider-id's die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-guards.                                           |
| `musicGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor muziekgeneratie voor provider-id's die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-guards.                                          |
| `toolMetadata`                       | Nee      | `Record<string, object>`         | Goedkope beschikbaarheidsmetadata voor Plugin-eigen tools die in `contracts.tools` zijn gedeclareerd. Gebruik dit wanneer een tool de runtime alleen moet laden als er bewijs voor config, env of auth bestaat.                                                                       |
| `channelConfigs`                     | Nee      | `Record<string, object>`         | Kanaalconfiguratiemetadata die eigendom is van het manifest en wordt samengevoegd in discovery- en validatieoppervlakken voordat de runtime wordt geladen.                                                                                                                                      |
| `skills`                             | Nee      | `string[]`                       | Skill-mappen om te laden, relatief ten opzichte van de Plugin-root.                                                                                                                                                                                         |
| `name`                               | Nee      | `string`                         | Voor mensen leesbare Plugin-naam.                                                                                                                                                                                                                     |
| `description`                        | Nee      | `string`                         | Korte samenvatting die wordt getoond in Plugin-oppervlakken.                                                                                                                                                                                                         |
| `icon`                               | Nee      | `string`                         | HTTPS-afbeeldings-URL voor marketplace-/cataloguskaarten. ClawHub accepteert elke geldige `https://`-URL en valt terug op het standaard Plugin-pictogram wanneer dit is weggelaten of ongeldig is.                                                                              |
| `version`                            | Nee      | `string`                         | Informatieve Plugin-versie.                                                                                                                                                                                                                   |
| `uiHints`                            | Nee      | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidshints voor config-velden.                                                                                                                                                                               |

## Referentie voor metadata van generatieproviders

De metadatavelden van generatieproviders beschrijven statische authenticatiesignalen voor
providers die zijn gedeclareerd in de bijbehorende lijst `contracts.*GenerationProviders`.
OpenClaw leest deze velden voordat de providerruntime wordt geladen, zodat kerntools
kunnen bepalen of een generatieprovider beschikbaar is zonder elke
provider-Plugin te importeren.

Gebruik deze velden alleen voor lichte, declaratieve feiten. Transport, request-
transformaties, tokenvernieuwing, credentialvalidatie en het daadwerkelijke generatiegedrag
blijven in de Plugin-runtime.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Elke metadata-entry ondersteunt:

| Veld                   | Vereist | Type       | Betekenis                                                                                                                                       |
| ---------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | Nee     | `string[]` | Aanvullende provider-id's die moeten meetellen als statische authenticatiealiassen voor de generatieprovider.                                    |
| `authProviders`        | Nee     | `string[]` | Provider-id's waarvan geconfigureerde authenticatieprofielen moeten meetellen als authenticatie voor deze generatieprovider.                     |
| `configSignals`        | Nee     | `object[]` | Lichte, alleen-op-configuratie gebaseerde beschikbaarheidssignalen voor lokale of self-hosted providers die zonder authenticatieprofielen of omgevingsvariabelen kunnen worden geconfigureerd. |
| `authSignals`          | Nee     | `object[]` | Expliciete authenticatiesignalen. Wanneer aanwezig vervangen deze de standaardset signalen van de provider-id, `aliases` en `authProviders`.     |
| `referenceAudioInputs` | Nee     | `boolean`  | Alleen voor videogeneratie. Stel in op `true` wanneer de provider referentie-audioassets accepteert; anders verbergt `video_generate` audioreferentieparameters. |

Elke `configSignals`-entry ondersteunt:

| Veld             | Vereist | Type       | Betekenis                                                                                                                                                                                  |
| ---------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`       | Ja      | `string`   | Puntpad naar het configuratieobject dat eigendom is van de Plugin en moet worden geïnspecteerd, bijvoorbeeld `plugins.entries.example.config`.                                             |
| `overlayPath`    | Nee     | `string`   | Puntpad binnen de rootconfiguratie waarvan het object de rootobjectwaarden moet overschrijven voordat het signaal wordt beoordeeld. Gebruik dit voor capability-specifieke configuratie zoals `image`, `video` of `music`. |
| `overlayMapPath` | Nee     | `string`   | Puntpad binnen de rootconfiguratie waarvan elke objectwaarde de rootobjectwaarden moet overschrijven. Gebruik dit voor benoemde accountmaps zoals `accounts`, waarbij elk geconfigureerd account mag kwalificeren. |
| `required`       | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie die geconfigureerde waarden moeten hebben. Strings mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                              |
| `requiredAny`    | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                               |
| `mode`           | Nee     | `object`   | Optionele stringmodusbewaking binnen de effectieve configuratie. Gebruik dit wanneer beschikbaarheid op basis van alleen configuratie slechts voor één modus geldt.                         |

Elke `mode`-bewaking ondersteunt:

| Veld         | Vereist | Type       | Betekenis                                                                 |
| ------------ | ------- | ---------- | ------------------------------------------------------------------------- |
| `path`       | Nee     | `string`   | Puntpad binnen de effectieve configuratie. Standaard is `mode`.           |
| `default`    | Nee     | `string`   | Moduswaarde om te gebruiken wanneer de configuratie het pad weglaat.      |
| `allowed`    | Nee     | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is. |
| `disallowed` | Nee     | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is. |

Elke `authSignals`-entry ondersteunt:

| Veld              | Vereist | Type     | Betekenis                                                                                                                                                            |
| ----------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string` | Provider-id om te controleren in geconfigureerde authenticatieprofielen.                                                                                              |
| `providerBaseUrl` | Nee     | `object` | Optionele bewaking waardoor het signaal alleen meetelt wanneer de gerefereerde geconfigureerde provider een toegestane basis-URL gebruikt. Gebruik dit wanneer een authenticatiealias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-bewaking ondersteunt:

| Veld              | Vereist | Type       | Betekenis                                                                                                                                          |
| ----------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string`   | Providerconfiguratie-id waarvan `baseUrl` moet worden gecontroleerd.                                                                               |
| `defaultBaseUrl`  | Nee     | `string`   | Basis-URL om aan te nemen wanneer de providerconfiguratie `baseUrl` weglaat.                                                                       |
| `allowedBaseUrls` | Ja      | `string[]` | Toegestane basis-URL's voor dit authenticatiesignaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaardbasis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Referentie voor toolmetadata

`toolMetadata` gebruikt dezelfde vormen voor `configSignals` en `authSignals` als
metadata van generatieproviders, met de toolnaam als sleutel. `contracts.tools` declareert
eigenaarschap. `toolMetadata` declareert licht beschikbaarheidsbewijs zodat OpenClaw kan
voorkomen dat een Plugin-runtime wordt geïmporteerd alleen om de toolfactory `null` te laten retourneren.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Als een tool geen `toolMetadata` heeft, behoudt OpenClaw het bestaande gedrag en
laadt het de eigenaar-Plugin wanneer het toolcontract overeenkomt met het beleid. Voor hot-path
tools waarvan de factory afhankelijk is van authenticatie/configuratie, moeten Plugin-auteurs
`toolMetadata` declareren in plaats van core runtime te laten importeren om het te vragen.

## Referentie voor providerAuthChoices

Elke `providerAuthChoices`-entry beschrijft één onboarding- of authenticatiekeuze.
OpenClaw leest dit voordat de providerruntime wordt geladen.
Providersetuplijsten gebruiken deze manifestkeuzes, setupkeuzes afgeleid van descriptors
en install-catalogmetadata zonder de providerruntime te laden.

| Veld                  | Vereist | Type                                                                  | Betekenis                                                                                                |
| --------------------- | ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                                              | Provider-id waartoe deze keuze behoort.                                                                 |
| `method`              | Ja      | `string`                                                              | Auth-methode-id waarnaar moet worden gedispatcht.                                                       |
| `choiceId`            | Ja      | `string`                                                              | Stabiele auth-keuze-id die wordt gebruikt door onboarding- en CLI-flows.                                |
| `choiceLabel`         | Nee     | `string`                                                              | Gebruikersgerichte label. Indien weggelaten valt OpenClaw terug op `choiceId`.                         |
| `choiceHint`          | Nee     | `string`                                                              | Korte hulptekst voor de kiezer.                                                                         |
| `assistantPriority`   | Nee     | `number`                                                              | Lagere waarden worden eerder gesorteerd in interactieve kiezers die door de assistent worden gestuurd. |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                                        | Verberg de keuze voor assistentkiezers, terwijl handmatige CLI-selectie nog steeds mogelijk blijft.     |
| `deprecatedChoiceIds` | Nee     | `string[]`                                                            | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten omleiden.                       |
| `groupId`             | Nee     | `string`                                                              | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                         |
| `groupLabel`          | Nee     | `string`                                                              | Gebruikersgerichte label voor die groep.                                                                |
| `groupHint`           | Nee     | `string`                                                              | Korte hulptekst voor de groep.                                                                          |
| `optionKey`           | Nee     | `string`                                                              | Interne optiesleutel voor eenvoudige auth-flows met een enkele vlag.                                   |
| `cliFlag`             | Nee     | `string`                                                              | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                     |
| `cliOption`           | Nee     | `string`                                                              | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Nee     | `string`                                                              | Beschrijving die wordt gebruikt in CLI-help.                                                            |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Op welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten is de standaard `["text-inference"]`. |

## commandAliases-referentie

Gebruik `commandAliases` wanneer een Plugin eigenaar is van een runtime-commandonaam die gebruikers per ongeluk in `plugins.allow` kunnen zetten of proberen uit te voeren als root-CLI-commando. OpenClaw gebruikt deze metadata voor diagnostiek zonder runtimecode van de Plugin te importeren.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Veld         | Vereist | Type              | Betekenis                                                              |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Commandonaam die bij deze Plugin hoort.                                |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als een chat-slashcommando in plaats van een root-CLI-commando. |
| `cliCommand` | Nee     | `string`          | Gerelateerd root-CLI-commando om voor CLI-bewerkingen voor te stellen, als er een bestaat. |

## activation-referentie

Gebruik `activation` wanneer de Plugin goedkoop kan declareren welke control-plane-gebeurtenissen hem in een activatie-/laadplan moeten opnemen.

Dit blok is planner-metadata, geen lifecycle-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en belooft niet dat Plugincode al is uitgevoerd. De activatieplanner gebruikt deze velden om kandidaat-Plugins te beperken voordat wordt teruggevallen op bestaande manifest-eigendomsmetadata zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigenaarschap al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, setup-descriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra planner-hints die niet door die eigendomsvelden kunnen worden weergegeven.
Gebruik `cliBackends` op topniveau voor CLI-runtimealiases zoals `claude-cli`, `my-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor ingebedde agent-harness-id's die nog geen eigendomsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt `register(...)`, `setupEntry` of andere runtime-/Plugin-entrypoints niet. Huidige consumers gebruiken het als een beperkende hint vóór bredere Plugin-loading, dus ontbrekende niet-startup-activatiemetadata kost meestal alleen prestaties; het zou de correctheid niet moeten veranderen zolang manifest-eigendomsfallbacks nog bestaan.

Elke Plugin moet `activation.onStartup` bewust instellen. Stel dit alleen in op `true` wanneer de Plugin tijdens Gateway-opstart moet worden uitgevoerd. Stel dit in op `false` wanneer de Plugin inert is bij startup en alleen vanuit smallere triggers moet laden. Het weglaten van `onStartup` laadt de Plugin niet langer impliciet bij startup; gebruik expliciete activatiemetadata voor startup, kanaal, config, agent-harness, memory of andere smallere activatietriggers.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Veld               | Vereist | Type                                                 | Betekenis                                                                                                                                                                                  |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-startupactivatie. Elke Plugin moet dit instellen. `true` importeert de Plugin tijdens startup; `false` houdt hem startup-lazy tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze Plugin in activatie-/laadplannen moeten opnemen.                                                                                                                    |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingebedde agent-harness-runtime-id's die deze Plugin in activatie-/laadplannen moeten opnemen. Gebruik `cliBackends` op topniveau voor CLI-backendaliases.                                |
| `onCommands`       | Nee     | `string[]`                                           | Commando-id's die deze Plugin in activatie-/laadplannen moeten opnemen.                                                                                                                    |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's die deze Plugin in activatie-/laadplannen moeten opnemen.                                                                                                                       |
| `onRoutes`         | Nee     | `string[]`                                           | Routetypen die deze Plugin in activatie-/laadplannen moeten opnemen.                                                                                                                       |
| `onConfigPaths`    | Nee     | `string[]`                                           | Root-relatieve configpaden die deze Plugin in startup-/laadplannen moeten opnemen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                          |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capability-hints die worden gebruikt door activatieplanning van het besturingsvlak. Geef waar mogelijk de voorkeur aan smallere velden.                                               |

Huidige live-consumers:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startupimport
- door commando's getriggerde CLI-planning valt terug op legacy `commandAliases[].cliCommand` of `commandAliases[].name`
- startupplanning van de agent-runtime gebruikt `activation.onAgentHarnesses` voor ingebedde harnesses en `cliBackends[]` op topniveau voor CLI-runtimealiases
- door kanalen getriggerde setup-/kanaalplanning valt terug op legacy `channels[]`-eigenaarschap wanneer expliciete kanaalactivatiemetadata ontbreekt
- startupplanning van Plugins gebruikt `activation.onConfigPaths` voor niet-kanaal-rootconfigoppervlakken, zoals het `browser`-blok van de gebundelde browser-Plugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy `providers[]`- en `cliBackends[]`-eigenaarschap op topniveau wanneer expliciete provideractivatiemetadata ontbreekt

Planner-diagnostiek kan expliciete activatiehints onderscheiden van manifest-eigendomsfallback. Bijvoorbeeld: `activation-command-hint` betekent dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn voor hostdiagnostiek en tests; Plugin-auteurs moeten de metadata blijven declareren die eigenaarschap het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een Plugin een of meer transportrunners bijdraagt onder de gedeelde `openclaw qa`-root. Houd deze metadata goedkoop en statisch; de Plugin-runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht `runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Veld          | Vereist | Type     | Wat het betekent                                                  |
| ------------- | ------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Ja      | `string` | Subcommando gekoppeld onder `openclaw qa`, bijvoorbeeld `matrix`. |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stubcommando nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboardingsurfaces goedkope Plugin-eigen metadata nodig hebben
voordat de runtime wordt geladen.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` op het hoogste niveau blijft geldig en blijft CLI-inferentie-
backends beschrijven. `setup.cliBackends` is de setup-specifieke descriptorsurface voor
control-plane-/setupflows die uitsluitend metadata moeten blijven.

Wanneer aanwezig, zijn `setup.providers` en `setup.cliBackends` de voorkeurs-
lookupsurface met descriptors eerst voor setupdetectie. Als de descriptor alleen
de kandidaat-Plugin vernauwt en setup nog rijkere runtimehooks tijdens setup
nodig heeft, stel dan `requiresRuntime: true` in en houd `setup-api` aanwezig als
fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en
env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteits-
adapter tijdens de deprecatievenster, maar niet-gebundelde plugins die het nog gebruiken
ontvangen een manifestdiagnose. Nieuwe plugins moeten setup-/status-env-metadata
op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods`
wanneer er geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false`
verklaart dat setup-runtime overbodig is. Expliciete `providerAuthChoices`-entries blijven
de voorkeur houden voor aangepaste labels, CLI-flags, onboardingscope en assistant-metadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor de
setupsurface. OpenClaw behandelt expliciete `false` als een descriptor-only contract
en voert `setup-api` of `openclaw.setupEntry` niet uit voor setuplookup. Als
een descriptor-only Plugin nog steeds een van die setup-runtime-entries levert,
rapporteert OpenClaw een additieve diagnose en blijft het die negeren. Een weggelaten
`requiresRuntime` behoudt legacy fallback-gedrag zodat bestaande plugins die
descriptors zonder de flag hebben toegevoegd niet breken.

Omdat setuplookup Plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
`setup.providers[].id`- en `setup.cliBackends[]`-waarden uniek blijven over
ontdekte plugins heen. Ambigu eigenaarschap faalt gesloten in plaats van een
winnaar te kiezen op basis van ontdekkingsvolgorde.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteren setupregisterdiagnoses descriptor-
drift als `setup-api` een provider of CLI-backend registreert die de manifest-
descriptors niet declareren, of als een descriptor geen overeenkomende runtime-
registratie heeft. Deze diagnoses zijn additief en wijzen legacy plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                   |
| -------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Ja      | `string`   | Provider-id die tijdens setup of onboarding wordt blootgesteld. Houd genormaliseerde ids wereldwijd uniek. |
| `authMethods`  | Nee     | `string[]` | Setup-/auth-method-ids die deze provider ondersteunt zonder de volledige runtime te laden.          |
| `envVars`      | Nee     | `string[]` | Env vars die generieke setup-/statussurfaces kunnen controleren voordat de Plugin-runtime laadt.    |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-evidencecontroles voor providers die kunnen authenticeren via niet-geheime markers. |

`authEvidence` is bedoeld voor provider-eigen lokale credentialmarkers die kunnen worden
geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkcalls, geen keychain- of secret-manager-reads, geen shellcommando's en geen
provider-API-probes.

Ondersteunde evidence-entries:

| Veld               | Vereist | Type       | Wat het betekent                                                                                              |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja      | `string`   | Momenteel `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Nee     | `string`   | Env var met een expliciet credentialbestandspad.                                                              |
| `fallbackPaths`    | Nee     | `string[]` | Lokale credentialbestandspaden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee     | `string[]` | Ten minste één vermelde env var moet niet-leeg zijn voordat de evidence geldig is.                            |
| `requiresAllEnv`   | Nee     | `string[]` | Elke vermelde env var moet niet-leeg zijn voordat de evidence geldig is.                                      |
| `credentialMarker` | Ja      | `string`   | Niet-geheime marker die wordt geretourneerd wanneer de evidence aanwezig is.                                  |
| `source`           | Nee     | `string`   | Gebruikersgericht bronlabel voor auth-/statusoutput.                                                         |

### setup-velden

| Veld               | Vereist | Type       | Wat het betekent                                                                                      |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Nee     | `object[]` | Provider-setupdescriptors die tijdens setup en onboarding worden blootgesteld.                         |
| `cliBackends`      | Nee     | `string[]` | Backend-ids tijdens setup die worden gebruikt voor setuplookup met descriptors eerst. Houd genormaliseerde ids wereldwijd uniek. |
| `configMigrations` | Nee     | `string[]` | Config-migratie-ids die eigendom zijn van de setupsurface van deze Plugin.                            |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup nog `setup-api`-uitvoering nodig heeft na descriptorlookup.                                  |

## uiHints-referentie

`uiHints` is een map van config-veldnamen naar kleine renderinghints.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Elke veldhint kan bevatten:

| Veld          | Type       | Wat het betekent                           |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Gebruikersgericht veldlabel.               |
| `help`        | `string`   | Korte helptekst.                           |
| `tags`        | `string[]` | Optionele UI-tags.                         |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.         |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.  |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.     |

## contracts-referentie

Gebruik `contracts` alleen voor statische metadata over capability-eigenaarschap die OpenClaw kan
lezen zonder de Plugin-runtime te importeren.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Elke lijst is optioneel:

| Veld                             | Type       | Wat het betekent                                                                                                                            |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server-extensiefactory-id's, momenteel `codex-app-server`.                                                                        |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor deze plugin middleware voor toolresultaten mag registreren.                                                           |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale vertrouwde pre-tool-beleids-id's die een geïnstalleerde plugin mag registreren. Gebundelde plugins mogen beleid zonder dit veld registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze plugin de externe-auth-profielhook beheert.                                                                      |
| `embeddingProviders`             | `string[]` | Algemene embeddingprovider-id's die deze plugin beheert voor herbruikbaar gebruik van vectorembeddings, inclusief geheugen.                 |
| `speechProviders`                | `string[]` | Spraakprovider-id's die deze plugin beheert.                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcriptieprovider-id's die deze plugin beheert.                                                                                 |
| `realtimeVoiceProviders`         | `string[]` | Realtime-spraakprovider-id's die deze plugin beheert.                                                                                       |
| `memoryEmbeddingProviders`       | `string[]` | Verouderde geheugenspecifieke embeddingprovider-id's die deze plugin beheert.                                                               |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-id's die deze plugin beheert.                                                                                  |
| `transcriptSourceProviders`      | `string[]` | Transcriptbronprovider-id's die deze plugin beheert.                                                                                        |
| `imageGenerationProviders`       | `string[]` | Afbeeldingsgeneratieprovider-id's die deze plugin beheert.                                                                                  |
| `videoGenerationProviders`       | `string[]` | Videogeneratieprovider-id's die deze plugin beheert.                                                                                        |
| `webFetchProviders`              | `string[]` | Webfetchprovider-id's die deze plugin beheert.                                                                                              |
| `webSearchProviders`             | `string[]` | Webzoekprovider-id's die deze plugin beheert.                                                                                               |
| `migrationProviders`             | `string[]` | Importprovider-id's die deze plugin beheert voor `openclaw migrate`.                                                                        |
| `gatewayMethodDispatch`          | `string[]` | Gereserveerde aanspraak voor geauthenticeerde plugin-HTTP-routes die Gateway-methoden in-proces dispatchen.                                 |
| `tools`                          | `string[]` | Agenttoolnamen die deze plugin beheert.                                                                                                     |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde Codex
extensiefactory's die alleen voor de app-server zijn. Gebundelde transformaties
van toolresultaten moeten in plaats daarvan
`contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Geïnstalleerde plugins mogen
hetzelfde middlewarekoppelvlak alleen gebruiken wanneer het expliciet is
ingeschakeld en alleen voor runtimes die ze declareren in
`contracts.agentToolResultMiddleware`.

Geïnstalleerde plugins die het door de host vertrouwde pre-tool-beleidsniveau
nodig hebben, moeten elke geregistreerde lokale id declareren in
`contracts.trustedToolPolicies` en expliciet zijn ingeschakeld. Gebundelde
plugins behouden het bestaande vertrouwde-beleidspad, maar geïnstalleerde
plugins met niet-gedeclareerde beleids-id's worden vóór registratie geweigerd.
Beleids-id's zijn beperkt tot de registrerende plugin, dus twee plugins mogen
beide `workflow-budget` declareren en registreren; één plugin mag dezelfde lokale
id niet twee keer registreren.

Runtime-registraties met `api.registerTool(...)` moeten overeenkomen met
`contracts.tools`. Tooldetectie gebruikt deze lijst om alleen de pluginruntimes
te laden die eigenaar kunnen zijn van de gevraagde tools.

Providerplugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren; niet-gedeclareerde externe-auth-
hooks worden genegeerd.

Algemene embeddingproviders moeten `contracts.embeddingProviders` declareren
voor elke adapter die met `api.registerEmbeddingProvider(...)` wordt
geregistreerd. Gebruik het algemene contract voor herbruikbare vectorgeneratie,
inclusief providers die door geheugenzoekopdrachten worden gebruikt.
`contracts.memoryEmbeddingProviders` is verouderde geheugenspecifieke
compatibiliteit en blijft alleen bestaan terwijl bestaande providers migreren
naar het algemene embeddingproviderkoppelvlak.

`contracts.gatewayMethodDispatch` accepteert momenteel
`"authenticated-request"`. Het is een API-hygiënepoort voor native plugin-HTTP-
routes die opzettelijk Gateway-control-plane-methoden in-proces dispatchen, geen
sandbox tegen kwaadwillende native plugins. Gebruik het alleen voor strak
gereviewde gebundelde/operator-oppervlakken die al Gateway-HTTP-auth vereisen.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-
provider standaardmodellen, fallbackprioriteit voor auto-auth of native
documentondersteuning heeft die generieke core-helpers nodig hebben voordat de
runtime laadt. Sleutels moeten ook worden gedeclareerd in
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Elke providervermelding kan bevatten:

| Veld                   | Type                                | Wat het betekent                                                                  |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediamogelijkheden die door deze provider worden aangeboden.                      |
| `defaultModels`        | `Record<string, string>`            | Standaardwaarden van mogelijkheid naar model die worden gebruikt wanneer config geen model specificeert. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische providerfallback op basis van referenties. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                     |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een kanaalplugin goedkope configmetadata nodig
heeft voordat de runtime laadt. Alleen-lezen detectie van kanaalsetup/status kan
deze metadata rechtstreeks gebruiken voor geconfigureerde externe kanalen
wanneer er geen setupvermelding beschikbaar is, of wanneer
`setup.requiresRuntime: false` verklaart dat setup-runtime niet nodig is.

`channelConfigs` is pluginmanifestmetadata, geen nieuwe top-level
gebruikersconfigsectie. Gebruikers configureren kanaalinstanties nog steeds
onder `channels.<channel-id>`. OpenClaw leest manifestmetadata om te bepalen
welke plugin dat geconfigureerde kanaal beheert voordat pluginruntimecode wordt
uitgevoerd.

Voor een kanaalplugin beschrijven `configSchema` en `channelConfigs`
verschillende paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook bijpassende
`channelConfigs`-vermeldingen declareren. Zonder deze kan OpenClaw de plugin nog
steeds laden, maar cold-path-configschema-, setup- en Control UI-oppervlakken
kunnen de vorm van kanaaleigen opties niet kennen totdat de pluginruntime wordt
uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor
commandoconfigcontroles die worden uitgevoerd voordat de kanaalruntime laadt.
Gebundelde kanalen kunnen dezelfde standaarden ook publiceren via
`package.json#openclaw.channel.commands` naast hun andere kanaalcatalogusmetadata
die eigendom is van het pakket.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix-homeserververbinding",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Elke kanaalvermelding kan bevatten:

| Veld          | Type                     | Wat het betekent                                                                             |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfigvermelding.    |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoelige hints voor die kanaalconfigsectie.                |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in picker- en inspectieoppervlakken wanneer runtimemetadata niet klaar is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                           |
| `commands`    | `object`                 | Statische auto-standaarden voor native commando's en native Skills voor pre-runtime-configcontroles. |
| `preferOver`  | `string[]`               | Verouderde plugin-id's of plugin-id's met lagere prioriteit die dit kanaal moet overtreffen in selectieoppervlakken. |

### Een andere kanaalplugin vervangen

Gebruik `preferOver` wanneer je plugin de voorkeursbeheerder is voor een
kanaal-id die een andere plugin ook kan leveren. Veelvoorkomende gevallen zijn
een hernoemde plugin-id, een zelfstandige plugin die een gebundelde plugin
vervangt, of een onderhouden fork die dezelfde kanaal-id behoudt voor
configcompatibiliteit.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Wanneer `channels.chat` is geconfigureerd, houdt OpenClaw rekening met zowel de
kanaal-id als de voorkeursplugin-id. Als de plugin met lagere prioriteit alleen
was geselecteerd omdat deze gebundeld is of standaard is ingeschakeld, schakelt
OpenClaw deze uit in de effectieve runtimeconfig, zodat één plugin eigenaar is
van het kanaal en de bijbehorende tools. Expliciete gebruikersselectie wint nog
steeds: als de gebruiker beide plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het diagnostiek voor dubbele kanalen/tools in plaats
van de gevraagde pluginset stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot plugin-id's die echt hetzelfde kanaal kunnen
leveren. Het is geen algemeen prioriteitsveld en het hernoemt geen
gebruikersconfigsleutels.

## modelSupport-referentie

Gebruik `modelSupport` wanneer OpenClaw je provider-Plugin moet afleiden uit
verkorte model-id's zoals `gpt-5.5` of `claude-sonnet-4.6` voordat de Plugin-runtime
wordt geladen.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw past deze prioriteit toe:

- expliciete `provider/model`-verwijzingen gebruiken de manifesmetadata van de eigenaar in `providers`
- `modelPatterns` krijgen voorrang op `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, wint de niet-gebundelde
  Plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Voorvoegsels die met `startsWith` worden vergeleken met verkorte model-id's.    |
| `modelPatterns` | `string[]` | Regex-bronnen die na verwijdering van het profielsuffix met verkorte model-id's worden vergeleken. |

`modelPatterns`-items worden gecompileerd via `compileSafeRegex`, dat patronen
met geneste herhaling weigert (bijvoorbeeld `(a+)+$`). Patronen die niet door de
veiligheidscontrole komen, worden stilzwijgend overgeslagen, net als syntactisch
ongeldige regex. Houd patronen eenvoudig en vermijd geneste kwantoren.

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
de Plugin-runtime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en ontdekkingsmodus. Runtime-verversing
hoort nog steeds in providerruntimecode, maar het manifest vertelt de kern wanneer runtime
vereist is.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Velden op topniveau:

| Veld             | Type                                                     | Wat het betekent                                                                                              |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze Plugin. Sleutels moeten ook voorkomen in `providers` op topniveau. |
| `aliases`        | `Record<string, object>`                                 | Provideraliassen die moeten worden opgelost naar een eigen provider voor catalogus- of onderdrukkingsplanning. |
| `suppressions`   | `object[]`                                               | Modelrijen uit een andere bron die deze Plugin onderdrukt om een providerspecifieke reden.                    |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus uit manifestmetadata kan worden gelezen, naar de cache kan worden ververst, of runtime vereist. |
| `runtimeAugment` | `boolean`                                                | Stel alleen in op `true` wanneer de providerruntime catalogusrijen moet toevoegen na manifest-/configuratieplanning. |

`aliases` doet mee aan de lookup van providereigenaarschap voor modelcatalogusplanning.
Aliasdoelen moeten providers op topniveau zijn die eigendom zijn van dezelfde Plugin. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarsmanifest lezen en
alias-API-/basis-URL-overschrijvingen toepassen zonder de providerruntime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de rijen
van de canonieke eigenaarprovider uit.

`suppressions` vervangt de oude providerruntimehook `suppressBuiltInModel`.
Onderdrukkingsitems worden alleen gehonoreerd wanneer de provider eigendom is van de Plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een eigen provider verwijst. Runtime-
onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                   |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus. |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die op deze providercatalogus van toepassing zijn. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.       |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                              |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het voorvoegsel `provider/`.                  |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                       |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                       |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                 |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                        |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                        |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                |
| `contextWindow` | `number`                                                       | Native providercontextvenster.                                                |
| `contextTokens` | `number`                                                       | Optionele effectieve runtimecontextlimiet wanneer die verschilt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximum aantal uitvoertokens, indien bekend.                                  |
| `cost`          | `object`                                                       | Optionele prijs in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Onderdruk alleen wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.            |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die dit model vervangt.                      |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                    |
| `tags`          | `string[]`                                                     | Stabiele tags die door kiezers en filters worden gebruikt.                    |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                            |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstreamrij die moet worden onderdrukt. Moet eigendom zijn van deze Plugin of zijn gedeclareerd als een eigen alias. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                                        |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt opgevraagd.              |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve providerbasis-URL-hosts die vereist zijn voordat de onderdrukking geldt.     |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen gegevens die alleen voor runtime zijn in `modelCatalog`. Gebruik `static` alleen wanneer manifestrijen
volledig genoeg zijn zodat op provider gefilterde lijst- en kiezersurfaces
registry-/runtimeontdekking kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige
lijstbare zaden of aanvullingen zijn, maar een verversing/cache later meer rijen kan toevoegen;
verversbare rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
de providerruntime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, door de provider beheerde opschoning van model-id's die moet
gebeuren voordat de providerruntime wordt geladen. Dit houdt aliassen zoals korte modelnamen,
providerlokale legacy-id's en proxyvoorvoegselregels in het manifest van de eigenaar-Plugin
in plaats van in kernmodelselectietabellen.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Providervelden:

| Veld                                 | Type                    | Wat het betekent                                                                         |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte model-id-aliassen. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Voorvoegsels die vóór aliaslookup moeten worden verwijderd, nuttig voor legacy provider/model-duplicatie. |
| `prefixWhenBare`                     | `string`                | Voorvoegsel om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.      |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke voorvoegselregels voor kale id's na aliaslookup, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat de providerruntime wordt geladen. De kern beheert nog steeds de betekenis van elke
`endpointClass`; Plugin-manifesten beheren de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Betekenis                                                                                         |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.            |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de endpointklasse worden gekoppeld.                                      |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die aan de endpointklasse worden gekoppeld. Voeg `.` toe voor alleen domeinsuffixmatching. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de endpointklasse worden gekoppeld.            |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                          |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om uit overeenkomende hosts te verwijderen om het Google Vertex-regioprefix zichtbaar te maken. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata voor aanvraagcompatibiliteit die generiek
aanvraagbeleid nodig heeft zonder de provider-runtime te laden. Houd gedragsspecifieke
payloadherschrijving in provider-runtimehooks of gedeelde providerfamiliehelpers.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Providervelden:

| Veld                  | Type         | Betekenis                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Providerfamilielabel dat wordt gebruikt door generieke compatibiliteitsbeslissingen en diagnostiek voor aanvragen. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitsbucket per providerfamilie voor gedeelde aanvraaghelpers.    |
| `openAICompletions`   | `object`     | OpenAI-compatibele vlaggen voor completions-aanvragen, momenteel `supportsStreamingUsage`. |

## secretProviderIntegrations-referentie

Gebruik `secretProviderIntegrations` wanneer een plugin een herbruikbare SecretRef
exec-providerpreset kan publiceren. OpenClaw leest deze metadata voordat de plugin-runtime laadt,
slaat plugin-eigenaarschap op in `secrets.providers.<alias>.pluginIntegration`, en
laat daadwerkelijke geheimresolutie over aan de SecretRef-runtime.
Presets worden alleen beschikbaar gemaakt voor gebundelde plugins en geïnstalleerde plugins die zijn ontdekt
vanuit de beheerde plugin-installatieroots, zoals git- en ClawHub-installaties.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

De mapsleutel is de integratie-id. Als `providerAlias` wordt weggelaten, gebruikt OpenClaw
de integratie-id als de SecretRef-provideralias. Provideraliassen moeten overeenkomen met
het normale SecretRef-provideraliaspatroon, bijvoorbeeld `team-secrets` of
`onepassword-work`.

Wanneer een operator de preset selecteert, schrijft OpenClaw een providerreferentie zoals:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Bij opstarten/herladen lost OpenClaw die provider op door de huidige
manifestmetadata van de plugin te laden, te controleren dat de eigenaarsplugin is geïnstalleerd en actief is, en
de exec-opdracht uit het manifest te materialiseren. Het uitschakelen of verwijderen van de
plugin trekt de provider in voor actieve SecretRefs. Operators die zelfstandige
exec-configuratie willen, kunnen nog steeds handmatig `command`/`args`-providers rechtstreeks schrijven.

Alleen `source: "exec"`-presets worden momenteel ondersteund. `command` moet
`${node}` zijn, en `args[0]` moet een `./` resolver-script zijn relatief aan de plugin-root.
OpenClaw materialiseert dit bij opstarten/herladen naar het huidige Node-uitvoerbare bestand en
het absolute scriptpad binnen de plugin. Node-opties zoals `--require`, `--import`,
`--loader`, `--env-file`, `--eval` en `--print` maken geen deel uit van het manifest
presetcontract. Operators die niet-Node-opdrachten nodig hebben, kunnen zelfstandige
handmatige exec-providers rechtstreeks configureren.

OpenClaw leidt `trustedDirs` voor manifestpresets af van de plugin-root en,
voor `${node}`-presets, de huidige map van het Node-uitvoerbare bestand. In het manifest opgegeven
`trustedDirs` worden genegeerd. Andere exec-provideropties zoals `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv` en `allowInsecurePath` worden
doorgegeven aan de normale SecretRef exec-providerconfiguratie.

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider prijsstellingsgedrag in het besturingsvlak nodig heeft voordat
de runtime laadt. De Gateway-prijscache leest deze metadata zonder
provider-runtimecode te importeren.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Providervelden:

| Veld         | Type              | Betekenis                                                                                          |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelfgehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking uit voor deze provider. |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking uit voor deze provider.    |

Bronvelden:

| Veld                       | Type               | Betekenis                                                                                                       |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogusprovider-id wanneer dit verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met een slash als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra varianten van externe catalogusmodel-id's. `version-dots` probeert versie-id's met punten zoals `claude-opus-4.6`. |

### OpenClaw Provider Index

De OpenClaw Provider Index is previewmetadata in eigendom van OpenClaw voor providers
waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een pluginmanifest.
Pluginmanifesten blijven de autoriteit voor geïnstalleerde plugins. De Provider Index is
het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en modelkiezers vóór installatie zullen gebruiken wanneer een providerplugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd pluginmanifest `modelCatalog`.
3. Modelcataloguscache van expliciete vernieuwing.
4. Previewrijen van de OpenClaw Provider Index.

De Provider Index mag geen geheimen, ingeschakelde status, runtimehooks of
live accountspecifieke modelgegevens bevatten. De previewcatalogi gebruiken dezelfde
`modelCatalog`-providerrijvorm als pluginmanifesten, maar moeten beperkt blijven
tot stabiele weergavemetadata tenzij runtime-adaptervelden zoals `api`,
`baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op
het geïnstalleerde pluginmanifest. Providers met live `/models`-ontdekking moeten
vernieuwde rijen via het expliciete modelcataloguscachepad schrijven in plaats van
normale listing- of onboardingsaanroepen provider-API's te laten aanroepen.

Provider Index-vermeldingen kunnen ook metadata voor installeerbare plugins bevatten voor providers
waarvan de plugin uit core is verplaatst of anderszins nog niet is geïnstalleerd. Deze
metadata weerspiegelt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie,
verwachte integriteit en goedkope labels voor auth-keuzes zijn voldoende om een
installeerbare setupoptie te tonen. Zodra de plugin is geïnstalleerd, wint het manifest ervan en
wordt de Provider Index-vermelding voor die provider genegeerd.

Verouderde capability-sleutels op topniveau zijn deprecated. Gebruik `openclaw doctor --fix` om
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` en `webSearchProviders` onder `contracts` te plaatsen; normaal
manifestladen behandelt die velden op topniveau niet langer als capability-eigenaarschap.

## Manifest versus package.json

De twee bestanden hebben verschillende taken:

| Bestand                | Gebruik het voor                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Ontdekking, configuratievalidatie, metadata voor auth-keuzes en UI-hints die moeten bestaan voordat plugincode wordt uitgevoerd |
| `package.json`         | npm-metadata, afhankelijkheidsinstallatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatiegating, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat plugincode wordt geladen, zet het dan in `openclaw.plugin.json`
- als het gaat over packaging, entrybestanden of npm-installatiegedrag, zet het dan in `package.json`

### package.json-velden die ontdekking beïnvloeden

Sommige pluginmetadata vóór runtime leeft bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.
`openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw-plugincontracten;
native plugins moeten `openclaw.plugin.json` gebruiken plus de ondersteunde
`package.json#openclaw`-velden hieronder.

Belangrijke voorbeelden:

| Veld                                                                                       | Wat het betekent                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declareert native Plugin-entrypoints. Moet binnen de Plugin-pakketmap blijven.                                                                                                       |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-entrypoints voor geïnstalleerde pakketten. Moet binnen de Plugin-pakketmap blijven.                                                          |
| `openclaw.setupEntry`                                                                      | Lichtgewicht setup-only entrypoint dat wordt gebruikt tijdens onboarding, uitgestelde kanaalstart en read-only kanaalstatus-/SecretRef-detectie. Moet binnen de Plugin-pakketmap blijven. |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-setup-entrypoint voor geïnstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de Plugin-pakketmap blijven.                    |
| `openclaw.channel`                                                                         | Goedkope kanaalcatalogusmetadata zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                         |
| `openclaw.channel.commands`                                                                | Statische native opdracht- en native skill-auto-defaultmetadata die worden gebruikt door configuratie-, audit- en opdrachtenlijstoppervlakken voordat de kanaalruntime laadt.         |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht metadata voor controle van geconfigureerde status die kan antwoorden "bestaat env-only setup al?" zonder de volledige kanaalruntime te laden.                           |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht metadata voor controle van persistente auth die kan antwoorden "is er al iets aangemeld?" zonder de volledige kanaalruntime te laden.                                   |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updatehints voor gebundelde en extern gepubliceerde plugins.                                                                                                            |
| `openclaw.install.defaultChoice`                                                           | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                    |
| `openclaw.compat.pluginApi`                                                                | Minimaal OpenClaw-plugin-API-bereik dat dit pakket vereist, met een semver-ondergrens zoals `>=2026.5.27`.                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm dist-integriteitstring zoals `sha512-...`; installatie- en updateflows verifiëren het opgehaalde artefact daartegen.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een smal herstelpad voor herinstallatie van gebundelde plugins toe wanneer configuratie ongeldig is.                                                                           |
| `openclaw.install.requiredPlatformPackages`                                                | npm-pakketaliassen die moeten materialiseren wanneer hun lockfile-platformbeperkingen overeenkomen met de huidige host.                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat setup-runtime-kanaaloppervlakken vóór listen laden en stelt daarna de volledige geconfigureerde kanaalplugin uit tot activering na listen.                                      |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes verschijnen in
onboarding voordat de runtime laadt. `package.json#openclaw.install` vertelt
onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de
gebruiker een van die keuzes kiest. Verplaats installatiehints niet naar
`openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en het
laden van het manifestregister voor niet-gebundelde Plugin-bronnen. Ongeldige
waarden worden geweigerd; nieuwere maar geldige waarden slaan externe plugins
over op oudere hosts. Gebundelde bronplugins worden verondersteld dezelfde
versie te hebben als de hostcheckout.

`openclaw.install.requiredPlatformPackages` is voor npm-pakketten die vereiste
native binaries beschikbaar maken via optionele, platformspecifieke aliassen.
Vermeld de kale npm-pakketnaam voor elke ondersteunde platformalias. Tijdens
npm-installatie verifieert OpenClaw alleen de gedeclareerde alias waarvan de
lockfile-beperkingen overeenkomen met de huidige host. Als npm succes meldt maar
die alias weglaat, probeert OpenClaw het één keer opnieuw met een verse cache en
draait de installatie terug als de alias nog steeds ontbreekt.

`openclaw.compat.pluginApi` wordt afgedwongen tijdens pakketinstallatie voor
niet-gebundelde Plugin-bronnen. Gebruik het voor de OpenClaw plugin-SDK-/
runtime-API-ondergrens waartegen het pakket is gebouwd. Het kan strenger zijn
dan `minHostVersion` wanneer een Plugin-pakket een nieuwere API nodig heeft maar
nog steeds een lagere installatiehint behoudt voor andere flows. Officiële
OpenClaw-release-synchronisatie verhoogt bestaande officiële plugin-API-
ondergrenzen standaard naar de OpenClaw-releaseversie, maar plugin-only releases
kunnen een lagere ondergrens behouden wanneer het pakket oudere hosts bewust
ondersteunt. Gebruik niet alleen de pakketversie als compatibiliteitscontract.
`peerDependencies.openclaw` blijft npm-pakketmetadata; OpenClaw gebruikt het
`openclaw.compat.pluginApi`-contract voor beslissingen over
installatiecompatibiliteit.

Officiële install-on-demandmetadata moet `clawhubSpec` gebruiken wanneer de
Plugin op ClawHub is gepubliceerd; onboarding behandelt dat als de gewenste
remote bron en registreert ClawHub-artefactfeiten na installatie. `npmSpec`
blijft de compatibiliteitsfallback voor pakketten die nog niet naar ClawHub zijn
verplaatst.

Exacte npm-versiepinnen staan al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiële externe
catalogusitems moeten exacte specs koppelen aan `expectedIntegrity`, zodat
updateflows fail-closed zijn als het opgehaalde npm-artefact niet langer
overeenkomt met de gepinde release. Interactieve onboarding biedt nog steeds
vertrouwde registry-npm-specs, inclusief kale pakketnamen en dist-tags, voor
compatibiliteit. Catalogusdiagnostiek kan onderscheid maken tussen exacte,
zwevende, met integriteit gepinde, ontbrekende-integriteit, pakketnaam-
mismatch- en ongeldige default-choice-bronnen. Ze waarschuwen ook wanneer
`expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee kan
worden gepind. Wanneer `expectedIntegrity` aanwezig is, dwingen installatie-/
updateflows dit af; wanneer het ontbreekt, wordt de registry-resolutie zonder
integriteitspin geregistreerd.

Kanaalplugins moeten `openclaw.setupEntry` aanbieden wanneer status,
kanaallijst of SecretRef-scans geconfigureerde accounts moeten identificeren
zonder de volledige runtime te laden. De setup-entry moet kanaalmetadata plus
setup-veilige configuratie-, status- en secrets-adapters beschikbaar maken; houd
netwerkclients, Gateway-listeners en transportruntimes in het hoofdextension-
entrypoint.

Runtime-entrypointvelden overschrijven pakketgrenscontroles voor
bronentrypointvelden niet. Bijvoorbeeld: `openclaw.runtimeExtensions` kan een
ontsnappend `openclaw.extensions`-pad niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt
willekeurige defecte configuraties niet installeerbaar. Vandaag staat het alleen
installatieflows toe om te herstellen van specifieke verouderde upgradefouten
van gebundelde plugins, zoals een ontbrekend gebundeld Plugin-pad of een
verouderde `channels.<id>`-vermelding voor diezelfde gebundelde Plugin. Niet-
gerelateerde configuratiefouten blokkeren installatie nog steeds en sturen
operators naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine
checker-module:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Gebruik dit wanneer setup, doctor, status of read-only presence-flows een
goedkope ja/nee-authprobe nodig hebben voordat de volledige kanaalplugin laadt.
Persistente authstatus is geen geconfigureerde kanaalstatus: gebruik deze
metadata niet om plugins automatisch in te schakelen, runtimedependencies te
herstellen of te bepalen of een kanaalruntime moet laden. De doel-export moet
een kleine functie zijn die alleen persistente status leest; routeer die niet
via de volledige kanaalruntime-barrel.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope env-only
geconfigureerde controles:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Gebruik dit wanneer een kanaal geconfigureerde status kan beantwoorden op basis
van env of andere kleine niet-runtime-inputs. Als de controle volledige
configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan
in de Plugin-hook `config.hasConfiguredState`.

## Discovery-volgorde (dubbele plugin-id's)

OpenClaw ontdekt plugins vanuit meerdere roots. Zie voor de ruwe scanvolgorde
van het bestandssysteem [Plugin-scanvolgorde](/nl/gateway/configuration-reference#plugin-scan-order).
Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de
**hoogste prioriteit** behouden; duplicaten met lagere prioriteit worden
verwijderd in plaats van ernaast te laden.

Prioriteit, van hoog naar laag:

1. **Config-selected** — een pad dat expliciet is vastgepind in `plugins.entries.<id>`
2. **Gebundeld** — plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — plugins die in de globale OpenClaw-pluginroot zijn geïnstalleerd
4. **Workspace** — plugins die relatief aan de huidige workspace zijn ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde Plugin in de workspace overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin daadwerkelijk te overschrijven met een lokale, pin je die via `plugins.entries.<id>` zodat die wint op prioriteit in plaats van te vertrouwen op workspace-detectie.
- Verwijderde duplicaten worden gelogd zodat Doctor en startupdiagnostiek naar de weggegooide kopie kunnen wijzen.
- Config-selected dubbele overrides worden in diagnostiek verwoord als expliciete overrides, maar waarschuwen nog steeds zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## JSON Schema-vereisten

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als het geen configuratie accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van de configuratie, niet tijdens runtime.
- Wanneer je een meegeleverde Plugin uitbreidt of forkt met nieuwe configuratiesleutels, werk dan tegelijk de `configSchema` van die Plugin in `openclaw.plugin.json` bij. Schema's van meegeleverde Plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` in gebruikersconfiguratie zonder `myNewKey` toe te voegen aan `configSchema.properties` wordt geweigerd voordat de plugin-runtime wordt geladen.

Voorbeeld van schema-uitbreiding:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Validatiegedrag

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id is gedeclareerd door
  een plugin-manifest.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*`
  moeten verwijzen naar **detecteerbare** plugin-id's. Onbekende id's zijn **fouten**.
- Als een Plugin is geïnstalleerd maar een defect of ontbrekend manifest of schema heeft,
  mislukt de validatie en rapporteert Doctor de pluginfout.
- Als pluginconfiguratie bestaat maar de Plugin **uitgeschakeld** is, blijft de configuratie behouden en
  wordt er een **waarschuwing** weergegeven in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief het laden vanaf het lokale bestandssysteem. Runtime laadt de plugin-module nog steeds afzonderlijk; het manifest is alleen voor ontdekking + validatie.
- Native manifesten worden geparseerd met JSON5, dus opmerkingen, afsluitende komma's en sleutels zonder aanhalingstekens worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestlader. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een Plugin ze niet nodig heeft.
- `providerCatalogEntry` moet lichtgewicht blijven en mag geen brede runtime-code importeren; gebruik het voor statische metadata van de providercatalogus of smalle ontdekkingsdescriptors, niet voor uitvoering tijdens verzoeken.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere Plugins.
- Metadata voor omgevingsvariabelen (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, validatie van cronlevering en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activeringsbeleid toe voordat een omgevingsvariabele als geconfigureerd wordt behandeld.
- Zie [Provider-runtimehooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor runtime-wizardmetadata waarvoor providercode nodig is.
- Als je Plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele vereisten voor allowlists van pakketbeheerders (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met Plugins.
  </Card>
  <Card title="Pluginarchitectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitsmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin SDK-referentie en subpadimports.
  </Card>
</CardGroup>
