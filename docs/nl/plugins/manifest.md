---
read_when:
    - Je bouwt een OpenClaw-plugin
    - Je moet een configuratieschema voor een plugin uitbrengen of validatiefouten voor plugins opsporen.
summary: Vereisten voor Plugin-manifest en JSON-schema (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-07-16T16:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina behandelt het **native OpenClaw-pluginmanifest**, `openclaw.plugin.json`. Zie [Pluginbundels](/nl/plugins/bundles) voor compatibele bundelindelingen (Codex, Claude, Cursor).

Compatibele bundelindelingen gebruiken in plaats daarvan hun eigen manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json`, of de standaard Claude-componentindeling zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert deze indelingen automatisch, maar valideert ze niet aan de hand van het onderstaande `openclaw.plugin.json`-schema. Voor een compatibele bundel leest OpenClaw de bundelmetadata, gedeclareerde hoofdmaplocaties van skills, Claude-hoofdmaplocaties van opdrachten, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude LSP en ondersteunde hookpakketten, wanneer de indeling overeenkomt met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw-plugin **moet** `openclaw.plugin.json` in de **hoofdmap van de plugin** bevatten. OpenClaw leest dit om de configuratie te valideren **zonder plugincode uit te voeren**. Een ontbrekend of ongeldig manifest blokkeert de configuratievalidatie en wordt als een pluginfout behandeld.

Zie [Plugins](/nl/tools/plugin) voor de volledige gids voor het pluginsysteem en [Capaciteitsmodel](/nl/plugins/architecture#public-capability-model) voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit.

## Wat dit bestand doet

`openclaw.plugin.json` bevat metadata die OpenClaw leest **voordat je plugincode wordt geladen**. Alles erin moet snel genoeg te inspecteren zijn zonder de pluginruntime op te starten.

**Gebruik het voor:**

- pluginidentiteit, configuratievalidatie en hints voor de configuratie-interface
- metadata voor authenticatie, onboarding en installatie (alias, automatisch inschakelen, omgevingsvariabelen van providers, authenticatiekeuzes)
- activeringshints voor besturingsvlakken
- eigenaarschap van modelreeksen via verkorte notatie
- statische momentopnamen van capaciteitseigenaarschap (`contracts`)
- metadata voor de QA-runner die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die wordt samengevoegd in catalogus- en validatievlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints of npm-installatiemetadata. Die horen thuis in je plugincode en `package.json`.

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
  "description": "OpenRouter-providerplugin",
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
      "choiceLabel": "OpenRouter-API-sleutel",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter-API-sleutel",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API-sleutel",
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

## Overzicht van velden op het hoogste niveau

| Veld                                 | Vereist | Type                         | Betekenis                                                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja       | `string`                     | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Ja       | `object`                     | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | Nee      | `string[]`                   | Plugin-id's die ook geïnstalleerd moeten zijn om deze Plugin effect te laten hebben. Discovery houdt de Plugin laadbaar, maar waarschuwt wanneer een vereiste Plugin ontbreekt.                                                                                                               |
| `enabledByDefault`                   | Nee      | `true`                       | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg of stel een andere waarde dan `true` in om de Plugin standaard uitgeschakeld te laten.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | Nee      | `string[]`                   | Markeert een gebundelde Plugin alleen op de vermelde Node.js-platforms als standaard ingeschakeld, bijvoorbeeld `["darwin"]`. Expliciete configuratie heeft nog steeds voorrang.                                                                                                                                   |
| `legacyPluginIds`                    | Nee      | `string[]`                   | Verouderde id's die naar deze canonieke Plugin-id worden genormaliseerd.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Nee      | `string[]`                   | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer ernaar wordt verwezen in authenticatie, configuratie of modelverwijzingen.                                                                                                                                                                            |
| `kind`                               | Nee      | `PluginKind \| PluginKind[]` | Declareert een of meer exclusieve Plugin-typen (`"memory"`, `"context-engine"`) die door `plugins.slots.*` worden gebruikt. Een Plugin die beide posities beheert, declareert beide typen in één array.                                                                                                    |
| `channels`                           | Nee      | `string[]`                   | Kanaal-id's die door deze Plugin worden beheerd. Wordt gebruikt voor discovery en configuratievalidatie.                                                                                                                                                                                                |
| `providers`                          | Nee      | `string[]`                   | Provider-id's die door deze Plugin worden beheerd.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | Nee      | `string`                     | Pad naar een lichtgewicht providercatalogusmodule, relatief ten opzichte van de hoofdmap van de Plugin, voor manifestgebonden metadata van de providercatalogus die kan worden geladen zonder de volledige Plugin-runtime te activeren.                                                                                        |
| `modelSupport`                       | Nee      | `object`                     | Door het manifest beheerde verkorte metadata voor modelfamilies waarmee de Plugin vóór de runtime automatisch wordt geladen.                                                                                                                                                                                |
| `modelCatalog`                       | Nee      | `object`                     | Declaratieve modelcatalogusmetadata voor providers die door deze Plugin worden beheerd. Dit is het control-planecontract voor toekomstige alleen-lezenlijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden.                                                |
| `modelPricing`                       | Nee      | `object`                     | Door de provider beheerd beleid voor het extern opzoeken van prijzen. Gebruik dit om lokale/zelfgehoste providers uit te sluiten van externe prijscatalogi of om providerverwijzingen toe te wijzen aan OpenRouter-/LiteLLM-catalogus-id's zonder provider-id's hard te coderen in de kern.                                                    |
| `modelIdNormalization`               | Nee      | `object`                     | Door de provider beheerde opschoning van model-id-aliassen/-voorvoegsels die moet worden uitgevoerd voordat de providerruntime wordt geladen.                                                                                                                                                                                  |
| `providerEndpoints`                  | Nee      | `object[]`                   | Door het manifest beheerde metadata voor endpointhosts/baseUrl's voor providerroutes die de kern moet classificeren voordat de providerruntime wordt geladen.                                                                                                                                                   |
| `providerRequest`                    | Nee      | `object`                     | Goedkope metadata voor providerfamilies en aanvraagcompatibiliteit die door generiek aanvraagbeleid wordt gebruikt voordat de providerruntime wordt geladen.                                                                                                                                                     |
| `secretProviderIntegrations`         | Nee      | `Record<string, object>`     | Declaratieve SecretRef-voorinstellingen voor exec-providers die setup- of installatie-interfaces kunnen aanbieden zonder providerspecifieke integraties hard te coderen in de kern.                                                                                                                            |
| `cliBackends`                        | Nee      | `string[]`                   | Id's van CLI-inferentiebackends die door deze Plugin worden beheerd. Wordt gebruikt voor automatische activering bij het opstarten op basis van expliciete configuratieverwijzingen.                                                                                                                                                                |
| `syntheticAuthRefs`                  | Nee      | `string[]`                   | Provider- of CLI-backendverwijzingen waarvan de synthetische authenticatiehook van de Plugin moet worden getest tijdens koude modeldetectie voordat de runtime wordt geladen.                                                                                                                                     |
| `nonSecretAuthMarkers`               | Nee      | `string[]`                   | Door gebundelde Plugins beheerde tijdelijke API-sleutelwaarden die niet-geheime lokale, OAuth- of omgevingsreferentiestatus vertegenwoordigen.                                                                                                                                                       |
| `commandAliases`                     | Nee      | `object[]`                   | Opdrachtnamen die door deze Plugin worden beheerd en Plugin-bewuste configuratie- en CLI-diagnostiek moeten opleveren voordat de runtime wordt geladen.                                                                                                                                                       |
| `providerAuthEnvVars`                | Nee      | `Record<string, string[]>`   | Verouderde compatibiliteitsmetadata voor omgevingsvariabelen voor het opzoeken van providerauthenticatie/-status. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de uitfaseringsperiode.                                                                                        |
| `providerUsageAuthEnvVars`           | Nee      | `Record<string, string[]>`   | Providerreferenties uitsluitend voor gebruik/facturering. OpenClaw gebruikt deze namen voor gebruiksdetectie en het opschonen van geheimen, maar nooit voor inferentieauthenticatie.                                                                                                                                  |
| `providerAuthAliases`                | Nee      | `Record<string, string>`     | Provider-id's die voor het opzoeken van authenticatie een andere provider-id moeten hergebruiken, bijvoorbeeld een programmeerprovider die de API-sleutel en authenticatieprofielen van de basisprovider deelt.                                                                                                                 |
| `channelEnvVars`                     | Nee      | `Record<string, string[]>`   | Goedkope metadata voor kanaalomgevingsvariabelen die OpenClaw kan inspecteren zonder Plugincode te laden. Gebruik dit voor door omgevingsvariabelen gestuurde kanaalsetup of authenticatie-interfaces die generieke opstart-/configuratiehelpers moeten kunnen zien.                                                                                   |
| `providerAuthChoices`                | Nee      | `object[]`                   | Goedkope metadata voor authenticatiekeuzes voor onboardingkiezers, het bepalen van de voorkeursprovider en eenvoudige koppeling van CLI-vlaggen.                                                                                                                                                              |
| `activation`                         | Nee      | `object`                     | Goedkope metadata voor de activeringsplanner voor laden dat wordt geactiveerd door opstarten, providers, opdrachten, kanalen, routes en mogelijkheden. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.                                                                                              |
| `setup`                              | Nee      | `object`                     | Goedkope setup-/onboardingbeschrijvingen die discovery- en setup-interfaces kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                                                                                           |
| `qaRunners`                          | Nee      | `object[]`                   | Goedkope beschrijvingen voor QA-runners die door de gedeelde `openclaw qa`-host worden gebruikt voordat de Plugin-runtime wordt geladen.                                                                                                                                                                             |
| `contracts`                          | Nee      | `object`                     | Statische momentopname van eigenaarschap van mogelijkheden voor externe authenticatiehooks, embeddings, spraak, realtime transcriptie, realtime spraak, mediabegrip, beeld-/video-/muziekgeneratie, ophalen via het web, zoeken op het web, workerproviders, extractie van document-/webinhoud en eigenaarschap van tools. |
| `configContracts`                    | Nee      | `object`                     | Configuratiegedrag dat door het manifest wordt beheerd en door generieke kernhelpers wordt gebruikt: detectie van gevaarlijke vlaggen, migratiedoelen voor SecretRef en inperking van verouderde configuratiepaden. Zie de [configContracts-referentie](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Nee      | `Record<string, object>`     | Voordelige standaardinstellingen voor mediabegrip voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetadata voor afbeeldingsgeneratie voor provider-id's die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief door de provider beheerde authenticatiealiassen en controles voor basis-URL's.                                                                                                         |
| `videoGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetadata voor videogeneratie voor provider-id's die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief door de provider beheerde authenticatiealiassen en controles voor basis-URL's.                                                                                                         |
| `musicGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetadata voor muziekgeneratie voor provider-id's die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief door de provider beheerde authenticatiealiassen en controles voor basis-URL's.                                                                                                         |
| `toolMetadata`                       | Nee      | `Record<string, object>`     | Voordelige beschikbaarheidsmetadata voor tools die door plugins worden beheerd en zijn gedeclareerd in `contracts.tools`. Gebruik deze wanneer een tool de runtime niet mag laden tenzij er bewijs uit configuratie, omgevingsvariabelen of authenticatie beschikbaar is.                                                                                                  |
| `channelConfigs`                     | Nee      | `Record<string, object>`     | Door het manifest beheerde metadata voor kanaalconfiguratie die vóór het laden van de runtime wordt samengevoegd in oppervlakken voor detectie en validatie.                                                                                                                                                                 |
| `skills`                             | Nee      | `string[]`                   | Te laden Skills-mappen, relatief ten opzichte van de hoofdmap van de plugin.                                                                                                                                                                                                                    |
| `name`                               | Nee      | `string`                     | Voor mensen leesbare pluginnaam.                                                                                                                                                                                                                                                |
| `description`                        | Nee      | `string`                     | Korte samenvatting die op pluginoppervlakken wordt weergegeven.                                                                                                                                                                                                                                    |
| `catalog`                            | Nee      | `object`                     | Optionele presentatietips voor oppervlakken van de plugincatalogus. Deze metadata installeert of activeert geen plugin en verleent er geen vertrouwen aan.                                                                                                                                               |
| `icon`                               | Nee      | `string`                     | HTTPS-afbeeldings-URL voor kaarten in de marktplaats/catalogus. ClawHub accepteert elke geldige `https://`-URL en valt terug op het standaardpictogram van de plugin wanneer deze is weggelaten of ongeldig is.                                                                                                         |
| `version`                            | Nee      | `string`                     | Informatieve pluginversie.                                                                                                                                                                                                                                              |
| `uiHints`                            | Nee      | `Record<string, object>`     | UI-labels, tijdelijke aanduidingen en gevoeligheidstips voor configuratievelden.                                                                                                                                                                                                          |

## naslag voor catalogus

`catalog` biedt optionele weergaveaanwijzingen voor pluginbrowsers. Hosts kunnen deze aanwijzingen negeren. Ze installeren of activeren de plugin nooit en wijzigen het runtimegedrag of vertrouwensniveau ervan niet.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Veld       | Type      | Betekenis                                                                  |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Of catalogusweergaven deze plugin moeten uitlichten.                       |
| `order`    | `number`  | Oplopende weergaveaanwijzing voor gecureerde plugins; lagere waarden verschijnen eerder. |

## Naslag voor metadata van generatieproviders

De metadatavelden voor generatieproviders beschrijven statische authenticatiesignalen voor providers die in de bijbehorende lijst `contracts.*GenerationProviders` zijn gedeclareerd. OpenClaw leest deze velden voordat de providerruntime wordt geladen, zodat kerntools kunnen bepalen of een generatieprovider beschikbaar is zonder elke providerplugin te importeren.

Gebruik deze velden alleen voor eenvoudig te bepalen, declaratieve feiten. Transport, aanvraagtransformaties, tokenvernieuwing, validatie van inloggegevens en het daadwerkelijke generatiegedrag blijven in de Plugin-runtime.

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

Elke metadata-invoer ondersteunt:

| Veld                   | Verplicht | Type       | Betekenis                                                                                                                                           |
| ---------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Nee       | `string[]` | Aanvullende provider-ID's die als statische authenticatiealiassen voor de generatieprovider moeten gelden.                                          |
| `authProviders`        | Nee       | `string[]` | Provider-ID's waarvan de geconfigureerde authenticatieprofielen als authenticatie voor deze generatieprovider moeten gelden.                        |
| `configSignals`        | Nee       | `object[]` | Eenvoudig te bepalen beschikbaarheidssignalen die alleen op configuratie zijn gebaseerd, voor lokale of zelfgehoste providers die zonder authenticatieprofielen of omgevingsvariabelen kunnen worden geconfigureerd. |
| `authSignals`          | Nee       | `object[]` | Expliciete authenticatiesignalen. Indien aanwezig vervangen deze de standaardset signalen van de provider-ID, `aliases` en `authProviders`. |
| `referenceAudioInputs` | Nee       | `boolean`  | Alleen voor videogeneratie. Stel in op `true` wanneer de provider referentie-audioassets accepteert; anders verbergt `video_generate` de parameters voor audioreferenties. |

Elke invoer van `configSignals` ondersteunt:

| Veld             | Verplicht | Type       | Betekenis                                                                                                                                                                                 |
| ---------------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja        | `string`   | Puntpad naar het configuratieobject van de plugin dat moet worden gecontroleerd, bijvoorbeeld `plugins.entries.example.config`.                                                                          |
| `overlayPath`    | Nee       | `string`   | Puntpad binnen de hoofdconfiguratie waarvan het object vóór evaluatie van het signaal over het hoofdobject moet worden gelegd. Gebruik dit voor mogelijkhedenpecifieke configuratie, zoals `image`, `video` of `music`. |
| `overlayMapPath` | Nee       | `string`   | Puntpad binnen de hoofdconfiguratie waarvan elk van de objectwaarden over het hoofdobject moet worden gelegd. Gebruik dit voor benoemde accounttoewijzingen zoals `accounts`, waarbij elk geconfigureerd account mag voldoen. |
| `required`       | Nee       | `string[]` | Puntpaden binnen de effectieve configuratie die geconfigureerde waarden moeten hebben. Tekenreeksen mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                          |
| `requiredAny`    | Nee       | `string[]` | Puntpaden binnen de effectieve configuratie waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                              |
| `mode`           | Nee       | `object`   | Optionele modusvoorwaarde voor tekenreeksen binnen de effectieve configuratie. Gebruik dit wanneer beschikbaarheid op basis van alleen configuratie slechts op één modus van toepassing is. |

Elke voorwaarde van `mode` ondersteunt:

| Veld         | Verplicht | Type       | Betekenis                                                                         |
| ------------ | --------- | ---------- | --------------------------------------------------------------------------------- |
| `path`       | Nee       | `string`   | Puntpad binnen de effectieve configuratie. De standaardwaarde is `mode`. |
| `default`    | Nee       | `string`   | Moduswaarde die moet worden gebruikt wanneer het pad in de configuratie ontbreekt. |
| `allowed`    | Nee       | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is. |
| `disallowed` | Nee       | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is. |

Elke invoer van `authSignals` ondersteunt:

| Veld              | Verplicht | Type     | Betekenis                                                                                                                                                                     |
| ----------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja        | `string` | Provider-ID die in geconfigureerde authenticatieprofielen moet worden gecontroleerd.                                                                                          |
| `providerBaseUrl` | Nee       | `object` | Optionele voorwaarde waardoor het signaal alleen meetelt wanneer de geconfigureerde provider waarnaar wordt verwezen een toegestane basis-URL gebruikt. Gebruik dit wanneer een authenticatiealias alleen voor bepaalde API's geldig is. |

Elke voorwaarde van `providerBaseUrl` ondersteunt:

| Veld              | Verplicht | Type       | Betekenis                                                                                                                                              |
| ----------------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja        | `string`   | Configuratie-ID van de provider waarvan `baseUrl` moet worden gecontroleerd.                                                                   |
| `defaultBaseUrl`  | Nee       | `string`   | Basis-URL die moet worden aangenomen wanneer `baseUrl` in de providerconfiguratie ontbreekt.                                                    |
| `allowedBaseUrls` | Ja        | `string[]` | Toegestane basis-URL's voor dit authenticatiesignaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaard basis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Naslag voor toolmetadata

`toolMetadata` gebruikt dezelfde vormen `configSignals` en `authSignals` als metadata voor generatieproviders, met de toolnaam als sleutel. `contracts.tools` declareert het eigenaarschap. `toolMetadata` declareert eenvoudig te bepalen bewijs van beschikbaarheid, zodat OpenClaw kan voorkomen dat een Plugin-runtime wordt geïmporteerd alleen om de toolfactory `null` te laten retourneren.

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

Invoer van `toolMetadata` accepteert naast de gedeelde velden `configSignals`/`authSignals` hierboven ook `optional` (markeert de tool als niet-verplicht voor activering van de plugin) en `replaySafe` (markeert de uitvoering van de tool als veilig om te herhalen na een onvoltooide modelbeurt).

Als een tool geen `toolMetadata` heeft, behoudt OpenClaw het bestaande gedrag en laadt het de eigenaarplugin wanneer het toolcontract overeenkomt met het beleid. Voor tools in kritieke uitvoeringspaden waarvan de factory afhankelijk is van authenticatie/configuratie, moeten pluginauteurs `toolMetadata` declareren in plaats van de kern runtime te laten importeren om dit op te vragen.

## Naslag voor providerAuthChoices

Elke invoer van `providerAuthChoices` beschrijft één keuze voor onboarding of authenticatie. OpenClaw leest dit voordat de providerruntime wordt geladen. Providerconfiguratielijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide configuratiekeuzes en metadata uit de installatiecatalogus zonder de providerruntime te laden.

| Veld                  | Vereist | Type                                                                  | Betekenis                                                                                                  |
| --------------------- | -------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja       | `string`                                                              | Provider-id waartoe deze keuze behoort.                                                                    |
| `method`              | Ja       | `string`                                                              | Id van de authenticatiemethode waarnaar wordt doorgestuurd.                                               |
| `choiceId`            | Ja       | `string`                                                              | Stabiel id voor de authenticatiekeuze dat wordt gebruikt door onboarding- en CLI-stromen.                  |
| `choiceLabel`         | Nee      | `string`                                                              | Gebruikersgericht label. Indien weggelaten, valt OpenClaw terug op `choiceId`.                      |
| `choiceHint`          | Nee      | `string`                                                              | Korte hulptekst voor de keuzelijst.                                                                        |
| `assistantPriority`   | Nee      | `number`                                                              | Lagere waarden worden eerder gesorteerd in interactieve, door de assistent aangestuurde keuzelijsten.      |
| `assistantVisibility` | Nee      | `"visible"` \| `"manual-only"`                                        | Verberg de keuze in keuzelijsten van de assistent, maar sta handmatige selectie via de CLI wel toe.        |
| `deprecatedChoiceIds` | Nee      | `string[]`                                                            | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorsturen.                        |
| `groupId`             | Nee      | `string`                                                              | Optioneel groeps-id voor het groeperen van gerelateerde keuzes.                                            |
| `groupLabel`          | Nee      | `string`                                                              | Gebruikersgericht label voor die groep.                                                                    |
| `groupHint`           | Nee      | `string`                                                              | Korte hulptekst voor de groep.                                                                             |
| `onboardingFeatured`  | Nee      | `boolean`                                                             | Toon deze groep in het uitgelichte niveau van de interactieve onboarding-keuzelijst, vóór het item "More...". |
| `optionKey`           | Nee      | `string`                                                              | Interne optiesleutel voor eenvoudige authenticatiestromen met één vlag.                                   |
| `cliFlag`             | Nee      | `string`                                                              | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                            |
| `cliOption`           | Nee      | `string`                                                              | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                                 |
| `cliDescription`      | Nee      | `string`                                                              | Beschrijving die wordt gebruikt in de CLI-help.                                                            |
| `appGuidedSecret`     | Nee      | `boolean`                                                             | Eén geplakt geheim plus de standaardwaarden van de provider volstaat voor app-gestuurde configuratie.     |
| `appGuidedDiscovery`  | Nee      | `boolean`                                                             | De overeenkomende runtime-authenticatiemethode beheert alleen-lezen lokale detectie via `appGuidedSetup`. |
| `appGuidedAuth`       | Nee      | `"oauth"` \| `"device-code"`                                          | Interactieve aanmelding onder beheer van de provider die native configuratieclients generiek kunnen weergeven. |
| `onboardingScopes`    | Nee      | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Op welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten, is de standaardwaarde `["text-inference"]`. |

Wanneer `appGuidedDiscovery` waar is, moet de overeenkomende authenticatiemethode van de provider
`appGuidedSetup.detect` en `appGuidedSetup.prepare` beschikbaar stellen. Detectie moet
alleen-lezen zijn: geen aanmelding, ophalen van modellen, downloads of schrijven naar de configuratie. De voorbereiding controleert
het exact geselecteerde model opnieuw en retourneert een configuratievoorstel; OpenClaw test dat
voorstel afzonderlijk live en legt het pas vast na succes.

## Naslaginformatie voor commandAliases

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers per ongeluk in `plugins.allow` kunnen plaatsen of als CLI-hoofdopdracht proberen uit te voeren. OpenClaw gebruikt deze metadata voor diagnostiek zonder runtimecode van de plugin te importeren.

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

| Veld         | Vereist | Type              | Betekenis                                                                |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Ja       | `string`          | Opdrachtnaam die bij deze plugin hoort.                                  |
| `kind`       | Nee      | `"runtime-slash"` | Markeert de alias als een slash-opdracht in de chat in plaats van een CLI-hoofdopdracht. |
| `cliCommand` | Nee      | `string`          | Gerelateerde CLI-hoofdopdracht die voor CLI-bewerkingen kan worden voorgesteld, indien aanwezig. |

## Naslaginformatie voor activation

Gebruik `activation` wanneer de plugin met weinig overhead kan aangeven bij welke gebeurtenissen in het besturingsvlak deze in een activerings-/laadplan moet worden opgenomen.

Dit blok bevat plannermetadata en is geen levenscyclus-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en garandeert niet dat de plugincode al is uitgevoerd. De activeringsplanner gebruikt deze velden om kandidaat-plugins te beperken voordat wordt teruggevallen op bestaande metadata over eigenaarschap in het manifest, zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de specifiekste metadata die het eigenaarschap al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, configuratiedescriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor aanvullende plannerhints die niet door die eigenaarschapsvelden kunnen worden weergegeven. Gebruik `cliBackends` op het hoogste niveau voor CLI-runtimealiassen zoals `claude-cli`, `my-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen bedoeld voor id's van ingebedde agentharnassen die nog geen eigenaarschapsveld hebben.

Elke plugin moet `activation.onStartup` bewust instellen. Stel dit alleen in op `true` wanneer de plugin tijdens het opstarten van de Gateway moet worden uitgevoerd. Stel dit in op `false` wanneer de plugin bij het opstarten inactief is en alleen door specifiekere triggers moet worden geladen. Als `onStartup` wordt weggelaten, wordt de plugin niet langer impliciet bij het opstarten geladen; gebruik expliciete activeringsmetadata voor activering bij opstarten, kanaal, configuratie, agentharnas, geheugen of andere specifiekere activeringstriggers.

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

| Veld               | Vereist | Type                                                 | Betekenis                                                                                                                                                                                    |
| ------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee      | `boolean`                                            | Expliciete activering bij het opstarten van de Gateway. Elke plugin moet dit instellen. `true` importeert de plugin tijdens het opstarten; `false` zorgt dat deze bij het opstarten pas wordt geladen wanneer een andere overeenkomende trigger dit vereist. |
| `onProviders`      | Nee      | `string[]`                                           | Provider-id's die deze plugin in activerings-/laadplannen moeten opnemen.                                                                                                                     |
| `onAgentHarnesses` | Nee      | `string[]`                                           | Runtime-id's van ingebedde agentharnassen die deze plugin in activerings-/laadplannen moeten opnemen. Gebruik `cliBackends` op het hoogste niveau voor CLI-backendaliassen.                 |
| `onCommands`       | Nee      | `string[]`                                           | Opdracht-id's die deze plugin in activerings-/laadplannen moeten opnemen.                                                                                                                     |
| `onChannels`       | Nee      | `string[]`                                           | Kanaal-id's die deze plugin in activerings-/laadplannen moeten opnemen.                                                                                                                       |
| `onRoutes`         | Nee      | `string[]`                                           | Routetypen die deze plugin in activerings-/laadplannen moeten opnemen.                                                                                                                        |
| `onConfigPaths`    | Nee      | `string[]`                                           | Configuratiepaden relatief aan de hoofdmap die deze plugin in opstart-/laadplannen moeten opnemen wanneer het pad aanwezig en niet expliciet uitgeschakeld is.                                |
| `onCapabilities`   | Nee      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capaciteitshints die worden gebruikt door de activeringsplanning van het besturingsvlak. Geef waar mogelijk de voorkeur aan specifiekere velden.                                        |

Huidige actieve gebruikers:

- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete import bij het opstarten.
- Door opdrachten geactiveerde CLI-planning valt terug op het verouderde `commandAliases[].cliCommand` of `commandAliases[].name`.
- Opstartplanning voor de agentruntime gebruikt `activation.onAgentHarnesses` voor ingebedde testharnassen en `cliBackends[]` op het hoogste niveau voor CLI-runtimealiassen.
- Door kanalen geactiveerde installatie-/kanaalplanning valt terug op het verouderde eigenaarschap van `channels[]` wanneer expliciete metadata voor kanaalactivering ontbreekt.
- Pluginplanning bij het opstarten gebruikt `activation.onConfigPaths` voor niet-kanaalgebonden hoofdconfiguratieoppervlakken, zoals het `browser`-blok van de gebundelde browserplugin.
- Door providers geactiveerde installatie-/runtimeplanning valt terug op het verouderde eigenaarschap van `providers[]` en `cliBackends[]` op het hoogste niveau wanneer expliciete metadata voor provideractivering ontbreekt.

Plannerdiagnostiek kan expliciete activeringshints onderscheiden van terugval op manifesteigenaarschap. Zo betekent `activation-command-hint` bijvoorbeeld dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan het eigenaarschap van `commandAliases` gebruikte. Deze redenlabels zijn bedoeld voor hostdiagnostiek en tests; pluginauteurs moeten de metadata blijven declareren die het eigenaarschap het best beschrijft.

## Naslaginformatie voor qaRunners

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners onder
de gedeelde `openclaw qa`-hoofdstructuur bijdraagt. Houd deze metadata eenvoudig en statisch; de
pluginruntime blijft verantwoordelijk voor de daadwerkelijke CLI-registratie via een lichtgewicht
`runtime-api.ts`-oppervlak dat overeenkomende `qaRunnerCliRegistrations` exporteert. Een
optionele `adapterFactory` stelt het transport beschikbaar voor gedeelde QA-scenario's zonder
de runner van de geregistreerde opdracht te wijzigen.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Voer de door Docker ondersteunde live QA-route voor Matrix uit op een tijdelijke homeserver"
    }
  ]
}
```

| Veld          | Vereist | Type     | Betekenis                                                          |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja       | `string` | Subopdracht gekoppeld onder `openclaw qa`, bijvoorbeeld `matrix`. |
| `description` | Nee      | `string` | Terugvaltekst voor hulp wanneer de gedeelde host een tijdelijke opdracht nodig heeft. |

De `adapterFactory`-id moet overeenkomen met `commandName`. Exporteer geen registraties
voor opdrachten die niet in het manifest voorkomen.

## Naslaginformatie voor setup

Gebruik `setup` wanneer installatie- en onboardingoppervlakken eenvoudige metadata van de plugin nodig hebben voordat de runtime wordt geladen.

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
            "source": "lokale OpenAI-aanmeldgegevens"
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

`cliBackends` op het hoogste niveau blijft geldig en blijft CLI-inferentiebackends beschrijven. `setup.cliBackends` is het installatiespecifieke descriptoroppervlak voor besturingsvlak-/installatiestromen die uitsluitend uit metadata moeten blijven bestaan.

Wanneer aanwezig, vormen `setup.providers` en `setup.cliBackends` het voorkeursoppervlak voor descriptorgebaseerd opzoeken bij installatiedetectie. Als de descriptor alleen de kandidaatplugin specifieker afbakent en de installatie nog uitgebreidere runtimehooks tijdens de installatie nodig heeft, stel je `requiresRuntime: true` in en behoud je `setup-api` als terugvalpad voor uitvoering.

OpenClaw neemt `setup.providers[].envVars` ook op in algemene zoekopdrachten naar providerauthenticatie en omgevingsvariabelen. `providerAuthEnvVars` blijft tijdens de uitfaseringsperiode ondersteund via een compatibiliteitsadapter, maar niet-gebundelde plugins die dit nog gebruiken, ontvangen een manifestdiagnose. Nieuwe plugins moeten omgevingsmetadata voor installatie/status op `setup.providers[].envVars` plaatsen.

Gebruik `providerUsageAuthEnvVars` wanneer aanmeldgegevens op facturerings- of organisatieniveau `resolveUsageAuth` moeten activeren zonder inferentieaanmeldgegevens te worden. Deze namen worden opgenomen in het blokkeren van dotenv-waarden voor werkruimten, het verwijderen uit ACP-subprocessen, het filteren van geheimen in de sandbox en het breed opschonen van geheimen. De providerruntime leest en classificeert de waarde nog steeds binnen `resolveUsageAuth`.

OpenClaw kan ook eenvoudige installatiekeuzes afleiden uit `setup.providers[].authMethods` wanneer geen installatie-item beschikbaar is, of wanneer `setup.requiresRuntime: false` declareert dat een installatieruntime niet nodig is. Expliciete `providerAuthChoices`-items blijven de voorkeur houden voor aangepaste labels, CLI-vlaggen, onboardingsbereik en assistentmetadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor het installatieoppervlak. OpenClaw behandelt expliciete `false` als een contract dat uitsluitend uit descriptors bestaat en voert `setup-api` of `openclaw.setupEntry` niet uit voor het opzoeken van installatiegegevens. Als een plugin die uitsluitend descriptors gebruikt toch een van die runtime-items voor installatie bevat, meldt OpenClaw een aanvullende diagnose en blijft het item negeren. Als `requiresRuntime` wordt weggelaten, blijft het verouderde terugvalgedrag behouden, zodat bestaande plugins die descriptors zonder de vlag hebben toegevoegd niet defect raken.

Omdat het opzoeken van installatiegegevens code uit `setup-api` van de plugin kan uitvoeren, moeten genormaliseerde waarden voor `setup.providers[].id` en `setup.cliBackends[]` uniek blijven voor alle gedetecteerde plugins. Bij ambigu eigenaarschap wordt de bewerking uit veiligheidsoverwegingen afgebroken in plaats van een winnaar te kiezen op basis van de detectievolgorde.

Wanneer de installatieruntime wel wordt uitgevoerd, meldt de diagnostiek van het installatieregister descriptorafwijkingen als `setup-api` een provider of CLI-backend registreert die niet door de manifestdescriptors wordt gedeclareerd, of als een descriptor geen overeenkomende runtimeregistratie heeft. Deze diagnoses zijn aanvullend en wijzen verouderde plugins niet af.

### Naslaginformatie voor setup.providers

| Veld           | Vereist | Type       | Betekenis                                                                                         |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja       | `string`   | Provider-id die tijdens installatie of onboarding beschikbaar wordt gesteld. Houd genormaliseerde ids wereldwijd uniek. |
| `authMethods`  | Nee      | `string[]` | Ids van installatie-/authenticatiemethoden die deze provider ondersteunt zonder de volledige runtime te laden. |
| `envVars`      | Nee      | `string[]` | Omgevingsvariabelen die algemene installatie-/statusoppervlakken kunnen controleren voordat de pluginruntime wordt geladen. |
| `authEvidence` | Nee      | `object[]` | Eenvoudige controles op lokaal authenticatiebewijs voor providers die via niet-geheime markeringen kunnen authenticeren. |

`authEvidence` is bedoeld voor lokale aanmeldgegevensmarkeringen van de provider die kunnen worden geverifieerd zonder runtimecode te laden. Deze controles moeten eenvoudig en lokaal blijven: geen netwerkaanroepen, geen uitlezingen uit sleutelhangers of geheimenbeheerders, geen shellopdrachten en geen controles van provider-API's.

Ondersteunde bewijsitems:

| Veld               | Vereist | Type       | Betekenis                                                                                                      |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja       | `string`   | Momenteel `local-file-with-env`.                                                                                  |
| `fileEnvVar`       | Nee      | `string`   | Omgevingsvariabele met een expliciet pad naar een bestand met aanmeldgegevens.                                  |
| `fallbackPaths`    | Nee      | `string[]` | Paden naar lokale bestanden met aanmeldgegevens die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee      | `string[]` | Ten minste één vermelde omgevingsvariabele moet niet leeg zijn voordat het bewijs geldig is.                   |
| `requiresAllEnv`   | Nee      | `string[]` | Elke vermelde omgevingsvariabele moet niet leeg zijn voordat het bewijs geldig is.                              |
| `credentialMarker` | Ja       | `string`   | Niet-geheime markering die wordt geretourneerd wanneer het bewijs aanwezig is.                                 |
| `source`           | Nee      | `string`   | Voor gebruikers zichtbaar bronlabel voor authenticatie-/statusuitvoer.                                         |

### setup-velden

| Veld               | Vereist | Type       | Betekenis                                                                                         |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nee      | `object[]` | Installatiedescriptors voor providers die tijdens installatie en onboarding beschikbaar worden gesteld. |
| `cliBackends`      | Nee      | `string[]` | Backend-ids tijdens installatie die worden gebruikt voor descriptorgebaseerd opzoeken. Houd genormaliseerde ids wereldwijd uniek. |
| `configMigrations` | Nee      | `string[]` | Ids van configuratiemigraties die eigendom zijn van het installatieoppervlak van deze plugin.     |
| `requiresRuntime`  | Nee      | `boolean`  | Of de installatie na het opzoeken van descriptors nog steeds uitvoering van `setup-api` nodig heeft. |

## Naslaginformatie voor uiHints

`uiHints` is een toewijzing van configuratieveldnamen aan kleine weergavehints. Sleutels kunnen punten gebruiken voor geneste configuratievelden, maar geen enkel padsegment mag `__proto__`, `constructor` of `prototype` zijn; de installatie wijst deze namen af.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API-sleutel",
      "help": "Wordt gebruikt voor OpenRouter-aanvragen",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Elke veldhint kan het volgende bevatten:

| Veld          | Type       | Betekenis                               |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Voor gebruikers zichtbaar veldlabel.   |
| `help`        | `string`   | Korte helptekst.                        |
| `tags`        | `string[]` | Optionele UI-tags.                      |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.      |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig. |
| `placeholder` | `string`   | Tijdelijke aanduiding voor formulierinvoer. |

## Naslaginformatie voor contracts

Gebruik `contracts` alleen voor statische metadata over het eigenaarschap van mogelijkheden die OpenClaw kan lezen zonder de pluginruntime te importeren.

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
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Elke lijst is optioneel:

| Veld                             | Type       | Betekenis                                                                                                                            |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Factory-id's voor Codex-app-serverextensies, momenteel `codex-app-server`.                                                           |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor deze Plugin middleware voor toolresultaten mag registreren.                                                    |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale id's voor vertrouwd beleid vóór toolgebruik die een geïnstalleerde Plugin mag registreren. Gebundelde Plugins mogen beleid registreren zonder dit veld. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze Plugin de hook voor externe authenticatieprofielen beheert.                                               |
| `embeddingProviders`             | `string[]` | Id's van algemene embeddingproviders die deze Plugin beheert voor herbruikbare vectorembeddings, inclusief geheugen.                 |
| `speechProviders`                | `string[]` | Id's van spraakproviders die deze Plugin beheert.                                                                                    |
| `realtimeTranscriptionProviders` | `string[]` | Id's van providers voor realtime transcriptie die deze Plugin beheert.                                                              |
| `realtimeVoiceProviders`         | `string[]` | Id's van providers voor realtime spraak die deze Plugin beheert.                                                                    |
| `memoryEmbeddingProviders`       | `string[]` | Verouderde id's van geheugenspecifieke embeddingproviders die deze Plugin beheert.                                                   |
| `mediaUnderstandingProviders`    | `string[]` | Id's van providers voor mediabegrip die deze Plugin beheert.                                                                        |
| `transcriptSourceProviders`      | `string[]` | Id's van providers voor transcriptbronnen die deze Plugin beheert.                                                                  |
| `documentExtractors`             | `string[]` | Id's van providers voor documentextractie (bijvoorbeeld PDF) die deze Plugin beheert.                                                |
| `imageGenerationProviders`       | `string[]` | Id's van providers voor het genereren van afbeeldingen die deze Plugin beheert.                                                      |
| `videoGenerationProviders`       | `string[]` | Id's van providers voor het genereren van video's die deze Plugin beheert.                                                           |
| `musicGenerationProviders`       | `string[]` | Id's van providers voor het genereren van muziek die deze Plugin beheert.                                                            |
| `webContentExtractors`           | `string[]` | Id's van providers voor inhoudsextractie uit webpagina's die deze Plugin beheert.                                                    |
| `webFetchProviders`              | `string[]` | Id's van providers voor het ophalen van webinhoud die deze Plugin beheert.                                                           |
| `webSearchProviders`             | `string[]` | Id's van providers voor zoeken op het web die deze Plugin beheert.                                                                  |
| `workerProviders`                | `string[]` | Id's van cloudworkerproviders die deze Plugin beheert voor inrichting en de levenscyclus van profielgebonden leases.                 |
| `usageProviders`                 | `string[]` | Provider-id's waarvan deze Plugin de hooks voor gebruiksauthenticatie en gebruiksmomentopnamen beheert.                              |
| `migrationProviders`             | `string[]` | Id's van importproviders die deze Plugin beheert voor `openclaw migrate`.                                                            |
| `gatewayMethodDispatch`          | `string[]` | Gereserveerd recht voor geauthenticeerde HTTP-routes van Plugins die Gateway-methoden binnen het proces aanroepen.                  |
| `tools`                          | `string[]` | Namen van agenttools die deze Plugin beheert.                                                                                        |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde extensiefactory's die uitsluitend voor de Codex-app-server bestemd zijn. Gebundelde transformaties van toolresultaten moeten in plaats daarvan `contracts.agentToolResultMiddleware` declareren en zich registreren met `api.registerAgentToolResultMiddleware(...)`. Geïnstalleerde Plugins mogen dezelfde middlewarekoppeling alleen gebruiken wanneer deze expliciet is ingeschakeld en uitsluitend voor runtimes die ze declareren in `contracts.agentToolResultMiddleware`.

Geïnstalleerde Plugins die de door de host vertrouwde beleidslaag vóór toolgebruik nodig hebben, moeten elke geregistreerde lokale id in `contracts.trustedToolPolicies` declareren en expliciet zijn ingeschakeld. Gebundelde Plugins behouden het bestaande pad voor vertrouwd beleid, maar geïnstalleerde Plugins met niet-gedeclareerde beleids-id's worden vóór registratie geweigerd. Beleids-id's zijn beperkt tot de registrerende Plugin, zodat twee Plugins beide `workflow-budget` mogen declareren en registreren; één Plugin mag dezelfde lokale id niet tweemaal registreren.

Registraties voor runtime `api.registerTool(...)` moeten overeenkomen met `contracts.tools`. Tooldetectie gebruikt deze lijst om alleen de Plugin-runtimes te laden die de aangevraagde tools kunnen beheren.

Provider-Plugins die `resolveExternalAuthProfiles` implementeren, moeten `contracts.externalAuthProviders` declareren; niet-gedeclareerde hooks voor externe authenticatie worden genegeerd.

Provider-Plugins die zowel `resolveUsageAuth` als `fetchUsageSnapshot` implementeren, moeten elke automatisch gedetecteerde provider-id declareren in `contracts.usageProviders`. Gebruiksdetectie leest dit contract voordat runtimecode wordt geladen en verifieert vervolgens beide hooks nadat alleen de gedeclareerde beheerders zijn geladen.

Algemene embeddingproviders moeten `contracts.embeddingProviders` declareren voor elke adapter die met `api.registerEmbeddingProvider(...)` is geregistreerd. Gebruik het algemene contract voor herbruikbare vectorgeneratie, inclusief providers die door geheugenzoekopdrachten worden gebruikt. `contracts.memoryEmbeddingProviders` is verouderde, geheugenspecifieke compatibiliteit en blijft alleen bestaan terwijl bestaande providers naar de algemene koppeling voor embeddingproviders migreren.

Workerproviders moeten elke `api.registerWorkerProvider(...)`-id declareren in `contracts.workerProviders`. Core slaat duurzame intentie op voordat `provision` wordt aangeroepen; providers valideren hun instellingen vóór externe toewijzing en herhaalde aanroepen met dezelfde bewerkings-id moeten dezelfde lease overnemen. Core slaat ook die momentopname van gevalideerde instellingen op en geeft deze met `leaseId` door aan `inspect({ leaseId, profile })` en `destroy({ leaseId, profile })`, ook nadat het benoemde profiel is gewijzigd of verwijderd. Vernietiging is idempotent, inspectie retourneert de gesloten status-unie `active` / `destroyed` / `unknown`, en materiaal van de persoonlijke SSH-sleutel wordt uitsluitend via `SecretRef` gerefereerd. Ingerichte SSH-eindpunten moeten ook een openbare `hostKey` uit vertrouwde inrichtingsuitvoer bevatten als exact `algorithm base64`, zonder hostnaam of opmerking, zodat Core de host vóór het verbinden kan vastzetten. Providers die dynamische identiteitsreferenties aanmaken, mogen een gezaghebbende `resolveSshIdentity({ leaseId, profile, keyRef })` implementeren; providers zonder deze implementatie gebruiken de algemene geheimresolver van Core. Een gezaghebbende `unknown` maakt een actief lokaal record verweesd; na een opgeslagen vernietigingsaanvraag bevestigt deze de ontmanteling.

`contracts.gatewayMethodDispatch` accepteert momenteel `"authenticated-request"`. Dit is een API-hygiënepoort voor native HTTP-routes van Plugins die opzettelijk Gateway-besturingsvlakmethoden binnen het proces aanroepen, geen sandbox tegen kwaadaardige native Plugins. Gebruik deze uitsluitend voor zorgvuldig beoordeelde gebundelde/operatoroppervlakken die al HTTP-authenticatie van de Gateway vereisen. Een route met rechten blijft bereikbaar wanneer de toelating van rootwerk door de Gateway is gesloten, maar alleen wanneer deze ook `auth: "gateway"` en de routespecifieke `gatewayRuntimeScopeSurface: "trusted-operator"` declareert; gewone zusterroutes van dezelfde Plugin blijven achter de toelatingsgrens. Zo blijven de opschortingsstatus en hervatting bereikbaar zonder de volledige Plugin een omzeiling van de toelating te geven. Houd parseren en het vormgeven van antwoorden begrensd buiten de dispatch; inhoudelijk of muterend werk moet via de methodedispatch van de Gateway verlopen, die de toelating en bereikhandhaving beheert.

## Referentie voor configContracts

Gebruik `configContracts` voor manifestbeheerd configuratiegedrag dat algemene Core-helpers nodig hebben zonder Plugin-runtime te importeren: detectie van gevaarlijke vlaggen, migratiedoelen voor SecretRef en afbakening van verouderde configuratiepaden.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Veld                          | Vereist | Type       | Betekenis                                                                                                                                                                                                                              |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nee      | `string[]` | Configuratiepaden relatief aan de root die aangeven dat compatibiliteitsmigraties tijdens de configuratie van deze Plugin mogelijk van toepassing zijn. Hiermee kunnen algemene runtimelezingen van configuratie elk Plugin-configuratieoppervlak overslaan wanneer de configuratie nooit naar de Plugin verwijst. |
| `compatibilityRuntimePaths`   | Nee      | `string[]` | Compatibiliteitspaden relatief aan de root die deze Plugin tijdens runtime kan afhandelen voordat de Plugincode volledig wordt geactiveerd. Gebruik dit voor verouderde oppervlakken die gebundelde kandidaatsets moeten beperken zonder elke compatibele Plugin-runtime te importeren. |
| `dangerousFlags`              | Nee      | `object[]` | Configuratieliteralen die `openclaw doctor` als onveilig of gevaarlijk moet markeren wanneer ze zijn ingeschakeld. Zie hieronder.                                                                                                       |
| `secretInputs`                | Nee      | `object`   | Configuratiepaden onder `plugins.entries.<id>.config` die het doelregister voor SecretRef-migratie/-controle moet behandelen als strings met een geheimstructuur. Zie hieronder.                                                        |

Elke `dangerousFlags`-vermelding ondersteunt:

| Veld     | Vereist | Type                                  | Betekenis                                                                                                           |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ja       | `string`                              | Door punten gescheiden configuratiepad relatief aan `plugins.entries.<id>.config`. Ondersteunt `*`-jokertekens voor kaart-/arraysegmenten. |
| `equals` | Ja       | `string \| number \| boolean \| null` | Exacte letterlijke waarde die deze configuratiewaarde als gevaarlijk markeert.                                      |

`secretInputs` ondersteunt:

| Veld                    | Vereist | Type       | Wat het betekent                                                                                                                                                                                               |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nee      | `boolean`  | Overschrijf de standaardinschakeling van de gebundelde plugin bij het bepalen of dit SecretRef-oppervlak actief is. Gebruik dit wanneer de plugin is gebundeld, maar het oppervlak inactief moet blijven totdat het expliciet in de configuratie wordt ingeschakeld. |
| `paths`                 | Ja       | `object[]` | Configuratiepaden in de vorm van geheimen, elk met `path` (door punten gescheiden, relatief ten opzichte van `plugins.entries.<id>.config`, ondersteunt `*`-jokertekens) en optioneel `expected` (momenteel alleen `"string"`).                            |

## Naslag voor mediaUnderstandingProviderMetadata

Gebruik `mediaUnderstandingProviderMetadata` wanneer een provider voor mediabegrip standaardmodellen, prioriteit voor automatische authenticatieterugval of native documentondersteuning heeft die generieke kernhelpers nodig hebben voordat de runtime wordt geladen. Sleutels moeten ook worden gedeclareerd in `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Elke providervermelding kan het volgende bevatten:

| Veld                   | Type                                                             | Wat het betekent                                                                                                 |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Mediamogelijkheden die deze provider beschikbaar stelt.                                                         |
| `defaultModels`        | `Record<string, string>`                                         | Standaardtoewijzingen van mogelijkheid naar model die worden gebruikt wanneer de configuratie geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`                                         | Lagere getallen worden eerder gesorteerd voor automatische, op referenties gebaseerde providerterugval.          |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Native documentinvoer die door de provider wordt ondersteund.                                                    |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modeloverschrijvingen per documenttype. Stel `image: false` in om op afbeeldingen gebaseerde extractie voor dat documenttype uit te schakelen. |

## Naslag voor channelConfigs

Gebruik `channelConfigs` wanneer een kanaalplugin goedkope configuratiemetadata nodig heeft voordat de runtime wordt geladen. Alleen-lezen ontdekking van kanaalinstallatie/-status kan deze metadata rechtstreeks gebruiken voor geconfigureerde externe kanalen wanneer er geen installatievermelding beschikbaar is, of wanneer `setup.requiresRuntime: false` aangeeft dat een installatieruntime niet nodig is.

`channelConfigs` is metadata van het pluginmanifest, geen nieuwe gebruikersconfiguratiesectie op het hoogste niveau. Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`. OpenClaw leest manifestmetadata om te bepalen welke plugin eigenaar is van dat geconfigureerde kanaal voordat de runtimecode van de plugin wordt uitgevoerd.

Voor een kanaalplugin beschrijven `configSchema` en `channelConfigs` verschillende paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende `channelConfigs`-vermeldingen declareren. Zonder deze vermeldingen kan OpenClaw de plugin nog steeds laden, maar kunnen het configuratieschema voor het koude pad, de installatie en de Control UI-oppervlakken de vorm van de kanaaleigen opties pas kennen wanneer de runtime van de plugin wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en `nativeSkillsAutoEnabled` kunnen statische `auto`-standaardwaarden declareren voor controles van opdrachtconfiguraties die worden uitgevoerd voordat de kanaalruntime wordt geladen. Gebundelde kanalen kunnen dezelfde standaardwaarden ook publiceren via `package.json#openclaw.channel.commands`, naast hun andere kanaalcatalogusmetadata waarvan het pakket eigenaar is.

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
          "label": "Homeserver-URL",
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

Elke kanaalvermelding kan het volgende bevatten:

| Veld          | Type                     | Wat het betekent                                                                          |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratievermelding. |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels, tijdelijke aanduidingen en hints voor gevoelige gegevens voor die kanaalconfiguratiesectie. |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in selectie- en inspectieoppervlakken wanneer runtimemetadata nog niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                         |
| `commands`    | `object`                 | Statische automatische standaardwaarden voor native opdrachten en native Skills voor configuratiecontroles vóór de runtime. |
| `preferOver`  | `string[]`               | Verouderde plugin-id's of plugin-id's met een lagere prioriteit die dit kanaal in selectieoppervlakken moet overtreffen. |

### Een andere kanaalplugin vervangen

Gebruik `preferOver` wanneer jouw plugin de voorkeureigenaar is voor een kanaal-id dat ook door een andere plugin kan worden geleverd. Veelvoorkomende gevallen zijn een hernoemde plugin-id, een zelfstandige plugin die een gebundelde plugin vervangt, of een onderhouden fork die dezelfde kanaal-id behoudt voor configuratiecompatibiliteit.

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

Wanneer `channels.chat` is geconfigureerd, houdt OpenClaw rekening met zowel de kanaal-id als de voorkeurs-plugin-id. Als de plugin met lagere prioriteit alleen was geselecteerd omdat deze is gebundeld of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve runtimeconfiguratie, zodat één plugin eigenaar is van het kanaal en de bijbehorende tools. Expliciete gebruikersselectie blijft leidend: als de gebruiker beide plugins expliciet inschakelt (via `plugins.allow` of een materiële `plugins.entries`-configuratie), behoudt OpenClaw die keuze en rapporteert het diagnostische gegevens over dubbele kanalen/tools in plaats van de gevraagde pluginset stilzwijgend te wijzigen.

Beperk `preferOver` tot plugin-id's die daadwerkelijk hetzelfde kanaal kunnen leveren. Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## Naslag voor modelSupport

Gebruik `modelSupport` wanneer OpenClaw jouw providerplugin moet afleiden uit verkorte model-id's zoals `gpt-5.6-sol` of `claude-sonnet-4.6` voordat de runtime van de plugin wordt geladen.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw past deze voorrangsvolgorde toe:

- expliciete `provider/model`-verwijzingen gebruiken de metadata van het bijbehorende `providers`-manifest
- `modelPatterns` hebben voorrang op `modelPrefixes`
- als één niet-gebundelde plugin en één gebundelde plugin beide overeenkomen, krijgt de niet-gebundelde plugin voorrang
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Voorvoegsels die met `startsWith` worden vergeleken met verkorte model-id's. |
| `modelPatterns` | `string[]` | Regex-bronnen die worden vergeleken met verkorte model-id's nadat het profielsuffix is verwijderd. |

`modelPatterns`-vermeldingen worden gecompileerd via `compileSafeRegex`, dat patronen met geneste herhaling afwijst (bijvoorbeeld `(a+)+$`). Patronen die niet door de veiligheidscontrole komen, worden stilzwijgend overgeslagen, net als syntactisch ongeldige regex. Houd patronen eenvoudig en vermijd geneste kwantoren.

## Naslag voor modelCatalog

Gebruik `modelCatalog` wanneer OpenClaw metadata van providermodellen moet kennen voordat de runtime van de plugin wordt geladen. Dit is de bron waarvan het manifest eigenaar is voor vaste catalogusrijen, provideraliases, onderdrukkingsregels en de ontdekkingsmodus. Runtimevernieuwing blijft onderdeel van de providerruntimecode, maar het manifest vertelt de kern wanneer de runtime vereist is.

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
        "reason": "niet beschikbaar in Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Velden op het hoogste niveau:

| Veld            | Type                                                     | Betekenis                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze plugin. Sleutels moeten ook voorkomen in `providers` op het hoogste niveau.       |
| `aliases`        | `Record<string, object>`                                 | Provideraliassen die voor catalogus- of onderdrukkingsplanning moeten worden omgezet naar een provider in eigendom.              |
| `suppressions`   | `object[]`                                               | Modelrijen uit een andere bron die deze plugin om een providerspecifieke reden onderdrukt.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus uit manifestmetadata kan worden gelezen, in de cache kan worden vernieuwd of runtime vereist. |
| `runtimeAugment` | `boolean`                                                | Stel dit alleen in op `true` wanneer de providerruntime catalogusrijen moet toevoegen na manifest-/configuratieplanning.       |

`aliases` neemt deel aan het opzoeken van providereigendom voor modelcatalogusplanning. Aliasdoelen moeten providers op het hoogste niveau zijn die eigendom zijn van dezelfde plugin. Wanneer een op provider gefilterde lijst een alias gebruikt, kan OpenClaw het manifest van de eigenaar lezen en API-/basis-URL-overschrijvingen voor de alias toepassen zonder de providerruntime te laden. Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten tonen alleen de canonieke providerrijen van de eigenaar.

`suppressions` vervangt de oude providerruntime-hook `suppressBuiltInModel`. Onderdrukkingsvermeldingen worden alleen gehonoreerd wanneer de provider eigendom is van de plugin of is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een provider in eigendom verwijst. Runtime-onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld                 | Type                     | Betekenis                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | Optionele statische headers die op deze providercatalogus van toepassing zijn.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Optioneel, door de provider aanbevolen klein model-id voor korte interne hulptaken (titels, voortgangsbeschrijvingen). Wordt gebruikt wanneer `agents.defaults.utilityModel` niet is ingesteld en deze provider het primaire model van de agent aanbiedt. |
| `models`              | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.                                                                                                                                                            |

Modelvelden:

| Veld              | Type                                                           | Betekenis                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Providerlokaal model-id, zonder het voorvoegsel `provider/`.                    |
| `name`             | `string`                                                       | Optionele weergavenaam.                                                      |
| `api`              | `ModelApi`                                                     | Optionele API-overschrijving per model.                                            |
| `baseUrl`          | `string`                                                       | Optionele overschrijving van de basis-URL per model.                                       |
| `headers`          | `Record<string, string>`                                       | Optionele statische headers per model.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modaliteiten die het model accepteert. Andere waarden worden stilzwijgend verwijderd.            |
| `reasoning`        | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                               |
| `contextWindow`    | `number`                                                       | Systeemeigen contextvenster van de provider.                                             |
| `contextTokens`    | `number`                                                       | Optionele effectieve runtime-contextlimiet wanneer deze afwijkt van `contextWindow`. |
| `maxTokens`        | `number`                                                       | Maximaal aantal uitvoertokens, indien bekend.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionele overschrijvingen van model-id of parameters per denkniveau.                    |
| `cost`             | `object`                                                       | Optionele prijs in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`           | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met de compatibiliteit van de OpenClaw-modelconfiguratie.  |
| `mediaInput`       | `object`                                                       | Optionele invoerconfiguratie per modaliteit, momenteel alleen voor afbeeldingen.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Alleen onderdrukken wanneer de rij helemaal niet mag verschijnen.          |
| `statusReason`     | `string`                                                       | Optionele reden die wordt weergegeven bij een niet-beschikbare status.                            |
| `replaces`         | `string[]`                                                     | Oudere providerlokale model-id's die door dit model worden vervangen.                       |
| `replacedBy`       | `string`                                                       | Vervangend providerlokaal model-id voor verouderde rijen.                    |
| `tags`             | `string[]`                                                     | Stabiele tags die door keuzelijsten en filters worden gebruikt.                                    |

Onderdrukkingsvelden:

| Veld                      | Type       | Betekenis                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de bovenliggende rij die moet worden onderdrukt. Moet eigendom zijn van deze plugin of als een alias in eigendom zijn gedeclareerd. |
| `model`                    | `string`   | Providerlokaal model-id dat moet worden onderdrukt.                                                                      |
| `reason`                   | `string`   | Optioneel bericht dat wordt weergegeven wanneer de onderdrukte rij rechtstreeks wordt aangevraagd.                                     |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve hosts van basis-URL's van providers die vereist zijn voordat de onderdrukking wordt toegepast.               |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte `api`-waarden van de providerconfiguratie die vereist zijn voordat de onderdrukking wordt toegepast.              |

Plaats geen gegevens die alleen tijdens runtime beschikbaar zijn in `modelCatalog`. Gebruik `static` alleen wanneer manifest-rijen volledig genoeg zijn om voor providergefilterde lijsten en keuzeschermen register-/runtime-detectie te laten overslaan. Gebruik `refreshable` wanneer manifest-rijen nuttige vermeldbare beginwaarden of aanvullingen zijn, maar later via vernieuwing/cache meer rijen kunnen worden toegevoegd; vernieuwbare rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw de providerruntime moet laden om de lijst te kennen.

## Naslag voor modelIdNormalization

Gebruik `modelIdNormalization` voor eenvoudige, door de provider beheerde opschoning van model-id's die moet plaatsvinden voordat de providerruntime wordt geladen. Hierdoor blijven aliassen, zoals korte modelnamen, verouderde providerlokale id's en regels voor proxyvoorvoegsels, in het manifest van de eigenaarplugin in plaats van in de modelselectietabellen van de kern.

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

| Veld                                | Type                    | Betekenis                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte model-id-aliassen. Waarden worden teruggegeven zoals ze zijn geschreven.                  |
| `stripPrefixes`                      | `string[]`              | Voorvoegsels die vóór het opzoeken van aliassen moeten worden verwijderd, nuttig voor verouderde duplicatie van provider/model.     |
| `prefixWhenBare`                     | `string`                | Voorvoegsel dat moet worden toegevoegd wanneer het genormaliseerde model-id nog geen `/` bevat.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke regels voor voorvoegsels bij kale id's na het opzoeken van aliassen, geïndexeerd op `modelPrefix` en `prefix`. |

## Naslag voor providerEndpoints

Gebruik `providerEndpoints` voor eindpuntclassificatie die algemeen aanvraagbeleid moet kennen voordat de providerruntime wordt geladen. De kern beheert nog steeds de betekenis van elke `endpointClass`; pluginmanifesten beheren de host- en basis-URL-metadata.

Officieel geëxternaliseerde providerplugins zijn uitgesloten van de kerndistributie, dus
hun manifesten zijn onzichtbaar totdat ze zijn geïnstalleerd. Hun `providerEndpoints` moeten
ook worden gespiegeld in `scripts/lib/official-external-provider-catalog.json`, zodat
eindpuntclassificatie zonder de plugin blijft werken; een contracttest
dwingt deze spiegeling af.

Eindpuntvelden:

| Veld                          | Type       | Wat het betekent                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende klasse van kerneindpunten, zoals `openrouter`, `moonshot-native` of `google-vertex`.        |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de eindpuntklasse worden toegewezen.                                                |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die aan de eindpuntklasse worden toegewezen. Voeg `.` als voorvoegsel toe om alleen domeinsuffixen te vergelijken. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de eindpuntklasse worden toegewezen.                             |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Uit overeenkomende hosts te verwijderen suffix om het Google Vertex-regiovoorvoegsel beschikbaar te maken.                 |

## Naslaginformatie voor providerRequest

Gebruik `providerRequest` voor eenvoudige metadata over aanvraagcompatibiliteit die algemeen aanvraagbeleid nodig heeft zonder de providerruntime te laden. Houd gedragsspecifieke herschrijving van payloads in providerruntimehooks of gedeelde helpers voor providerfamilies.

```json
{
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

| Veld                 | Type         | Wat het betekent                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label van de providerfamilie dat wordt gebruikt voor algemene beslissingen over aanvraagcompatibiliteit en diagnostiek. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitscategorie voor providerfamilies voor gedeelde aanvraaghelpers.              |
| `openAICompletions`   | `object`     | Aanvraagvlaggen voor OpenAI-compatibele aanvullingen, momenteel `supportsStreamingUsage`.       |

## Naslaginformatie voor secretProviderIntegrations

Gebruik `secretProviderIntegrations` wanneer een plugin een herbruikbare voorinstelling voor een SecretRef-exec-provider kan publiceren. OpenClaw leest deze metadata voordat de providerruntime wordt geladen, slaat het plugineigendom op in `secrets.providers.<alias>.pluginIntegration` en laat de daadwerkelijke geheimoplossing over aan de SecretRef-runtime. Voorinstellingen worden alleen beschikbaar gesteld voor gebundelde plugins en geïnstalleerde plugins die zijn gevonden in de beheerde installatielocaties voor plugins, zoals installaties via git en ClawHub.

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

De mapsleutel is de integratie-id. Als `providerAlias` wordt weggelaten, gebruikt OpenClaw de integratie-id als alias voor de SecretRef-provider. Provideraliassen moeten overeenkomen met het normale patroon voor SecretRef-provideraliassen, bijvoorbeeld `team-secrets` of `onepassword-work`.

Wanneer een beheerder de voorinstelling selecteert, schrijft OpenClaw een providerverwijzing zoals:

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

Bij het starten of opnieuw laden lost OpenClaw die provider op door de huidige metadata uit het pluginmanifest te laden, te controleren of de eigenaarplugin geïnstalleerd en actief is en de exec-opdracht uit het manifest te materialiseren. Door de plugin uit te schakelen of te verwijderen, wordt de provider voor actieve SecretRefs ingetrokken. Beheerders die een zelfstandige exec-configuratie willen, kunnen nog steeds rechtstreeks handmatige `command`-/`args`-providers schrijven.

Momenteel worden alleen `source: "exec"`-voorinstellingen ondersteund. `command` moet `${node}` zijn en `args[0]` moet een `./`-resolverscript relatief aan de hoofdmap van de plugin zijn. OpenClaw materialiseert dit bij het starten of opnieuw laden naar het huidige uitvoerbare Node-bestand en het absolute pad naar het script in de plugin. Node-opties zoals `--require`, `--import`, `--loader`, `--env-file`, `--eval` en `--print` maken geen deel uit van het contract voor manifestvoorinstellingen. Beheerders die niet-Node-opdrachten nodig hebben, kunnen rechtstreeks zelfstandige handmatige exec-providers configureren.

OpenClaw leidt `trustedDirs` voor manifestvoorinstellingen af uit de hoofdmap van de plugin en, voor `${node}`-voorinstellingen, uit de map van het huidige uitvoerbare Node-bestand. In het manifest opgegeven `trustedDirs` worden genegeerd. Andere opties voor exec-providers, zoals `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` en `allowInsecurePath`, worden ongewijzigd doorgegeven aan de normale configuratie voor SecretRef-exec-providers.

## Naslaginformatie voor modelPricing

Gebruik `modelPricing` wanneer een provider prijsbepalingsgedrag in het besturingsvlak nodig heeft voordat de runtime wordt geladen. De prijsbepalingscache van de Gateway leest deze metadata zonder providerruntimecode te importeren.

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

| Veld        | Type              | Wat het betekent                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Stel dit in op `false` voor lokale/zelfgehoste providers die nooit prijsgegevens van OpenRouter of LiteLLM mogen ophalen. |
| `openRouter` | `false \| object` | Toewijzing voor het opzoeken van OpenRouter-prijzen. `false` schakelt het opzoeken via OpenRouter voor deze provider uit.           |
| `liteLLM`    | `false \| object` | Toewijzing voor het opzoeken van LiteLLM-prijzen. `false` schakelt het opzoeken via LiteLLM voor deze provider uit.                 |

Bronvelden:

| Veld                      | Type               | Wat het betekent                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-id in de externe catalogus wanneer deze afwijkt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met slashes als geneste provider-/modelverwijzingen, nuttig voor proxyproviders zoals OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Extra model-id-varianten voor de externe catalogus. `version-dots` probeert versie-id's met punten, zoals `claude-opus-4.6`.            |

### OpenClaw-providerindex

De OpenClaw-providerindex is previewmetadata die eigendom is van OpenClaw voor providers waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Deze maakt geen deel uit van een pluginmanifest. Pluginmanifesten blijven de autoriteit voor geïnstalleerde plugins. De providerindex is het interne terugvalcontract dat toekomstige interfaces voor installeerbare providers en modelkiezers vóór installatie zullen gebruiken wanneer een providerplugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd pluginmanifest `modelCatalog`.
3. Modelcataloguscache van een expliciete vernieuwing.
4. Previewrijen van de OpenClaw-providerindex.

De providerindex mag geen geheimen, ingeschakelde status, runtimehooks of live accountspecifieke modelgegevens bevatten. De previewcatalogi gebruiken dezelfde `modelCatalog`-providerstructuur als pluginmanifesten, maar moeten beperkt blijven tot stabiele weergavemetadata, tenzij runtimeadaptervelden zoals `api`, `baseUrl`, prijsgegevens of compatibiliteitsvlaggen opzettelijk gelijk worden gehouden aan het geïnstalleerde pluginmanifest. Providers met live `/models`-detectie moeten vernieuwde rijen schrijven via het expliciete cachepad voor de modelcatalogus, in plaats van provider-API's aan te roepen tijdens normale vermeldingen of onboarding.

Vermeldingen in de providerindex kunnen ook metadata voor installeerbare plugins bevatten voor providers waarvan de plugin uit de kern is verplaatst of anderszins nog niet is geïnstalleerd. Deze metadata volgt het patroon van de kanaalcatalogus: de pakketnaam, npm-installatiespecificatie, verwachte integriteit en eenvoudige labels voor authenticatiekeuzes zijn voldoende om een installeerbare configuratieoptie weer te geven. Zodra de plugin is geïnstalleerd, krijgt het manifest ervan voorrang en wordt de vermelding in de providerindex voor die provider genegeerd.

`openclaw doctor --fix` migreert een kleine, gesloten verzameling verouderde manifestcapaciteitssleutels op het hoogste niveau naar `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` en `tools`. Geen van deze sleutels (of enige andere capaciteitenlijst) wordt nog als manifestveld op het hoogste niveau gelezen; bij het normaal laden van manifesten worden ze alleen onder `contracts` herkend.

## Manifest versus package.json

De twee bestanden hebben verschillende functies:

| Bestand                   | Gebruik het voor                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configuratievalidatie, metadata voor authenticatiekeuzes en UI-aanwijzingen die beschikbaar moeten zijn voordat plugincode wordt uitgevoerd                         |
| `package.json`         | npm-metadata, installatie van afhankelijkheden en het `openclaw`-blok dat wordt gebruikt voor toegangspunten, installatievoorwaarden, configuratie of catalogusmetadata |

Als je niet zeker weet waar een bepaald stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw dit moet weten voordat plugincode wordt geladen, plaats je het in `openclaw.plugin.json`
- als het over pakkettering, invoerbestanden of het installatiegedrag van npm gaat, plaats je het in `package.json`

### package.json-velden die detectie beïnvloeden

Sommige pluginmetadata voor vóór de runtime staat bewust in `package.json` onder het `openclaw`-blok in plaats van in `openclaw.plugin.json`. `openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw-plugincontracten; native plugins moeten `openclaw.plugin.json` gebruiken, samen met de hieronder ondersteunde `package.json#openclaw`-velden.

Belangrijke voorbeelden:

| Veld                                                                                       | Wat het betekent                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declareert native Plugin-ingangspunten. Moet binnen de pakketmap van de Plugin blijven.                                                                                               |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-ingangspunten voor geïnstalleerde pakketten. Moet binnen de pakketmap van de Plugin blijven.                                                   |
| `openclaw.setupEntry`                                                                      | Lichtgewicht ingangspunt uitsluitend voor configuratie, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus-/SecretRef-detectie. Moet binnen de pakketmap van de Plugin blijven. |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-configuratie-ingangspunt voor geïnstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de pakketmap van de Plugin blijven.       |
| `openclaw.channel`                                                                         | Goedkope metagegevens voor de kanaalcatalogus, zoals labels, documentatiepaden, aliassen en selectietekst.                                                                             |
| `openclaw.channel.commands`                                                                | Statische metagegevens voor native opdrachten en automatische standaardinstellingen van native skills, gebruikt door configuratie-, audit- en opdrachtenlijstinterfaces voordat de kanaalruntime wordt geladen. |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht metagegevens voor controle van de geconfigureerde status, waarmee zonder de volledige kanaalruntime te laden de vraag ‘bestaat er al een configuratie uitsluitend via omgevingsvariabelen?’ kan worden beantwoord. |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht metagegevens voor controle van opgeslagen authenticatie, waarmee zonder de volledige kanaalruntime te laden de vraag ‘is er al ergens aangemeld?’ kan worden beantwoord. |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updatehints voor gebundelde en extern gepubliceerde plugins.                                                                                                             |
| `openclaw.install.defaultChoice`                                                           | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde versie van de OpenClaw-host, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                               |
| `openclaw.compat.pluginApi`                                                                | Minimaal bereik van de OpenClaw-Plugin-API dat dit pakket vereist, met een semver-ondergrens zoals `>=2026.5.27`.                                                                     |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm-dist-integriteitstekenreeks, zoals `sha512-...`; installatie- en updateprocessen verifiëren het opgehaalde artefact hiertegen.                                         |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een beperkt herstelpad toe voor herinstallatie van een gebundelde Plugin wanneer de configuratie ongeldig is.                                                                  |
| `openclaw.install.requiredPlatformPackages`                                                | Aliassen van npm-pakketten die moeten worden geïnstalleerd wanneer hun platformbeperkingen in het lockbestand overeenkomen met de huidige host.                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat kanaalinterfaces van de configuratieruntime vóór het luisteren laden en stelt vervolgens de volledige geconfigureerde kanaal-Plugin uit tot activering na het starten van luisteren. |

Metagegevens in het manifest bepalen welke provider-, kanaal- en configuratiekeuzes tijdens onboarding verschijnen voordat de runtime wordt geladen. `package.json#openclaw.install` vertelt onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die keuzes selecteert. Verplaats installatiehints niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt tijdens installatie en het laden van het manifestregister afgedwongen voor niet-gebundelde Plugin-bronnen. Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden zorgen ervoor dat externe plugins op oudere hosts worden overgeslagen. Er wordt aangenomen dat gebundelde bronplugins dezelfde versie hebben als de host-checkout.

`openclaw.install.requiredPlatformPackages` is bedoeld voor npm-pakketten die vereiste native binaire bestanden beschikbaar stellen via optionele, platformspecifieke aliassen. Vermeld voor elke ondersteunde platformalias de kale npm-pakketnaam. Tijdens de npm-installatie verifieert OpenClaw alleen de gedeclareerde alias waarvan de beperkingen in het lockbestand overeenkomen met de huidige host. Als npm succes meldt maar die alias weglaat, probeert OpenClaw het eenmaal opnieuw met een verse cache en draait het de installatie terug als de alias nog steeds ontbreekt.

`openclaw.compat.pluginApi` wordt tijdens de pakketinstallatie afgedwongen voor niet-gebundelde Plugin-bronnen. Gebruik dit voor de ondergrens van de OpenClaw-Plugin-SDK/runtime-API waartegen het pakket is gebouwd. Deze kan strenger zijn dan `minHostVersion` wanneer een Plugin-pakket een nieuwere API nodig heeft, maar voor andere processen toch een lagere installatiehint behoudt. De officiële synchronisatie van OpenClaw-releases verhoogt bestaande officiële ondergrenzen voor Plugin-API's standaard naar de OpenClaw-releaseversie, maar releases die alleen een Plugin bevatten, kunnen een lagere ondergrens behouden wanneer het pakket bewust oudere hosts ondersteunt. Gebruik niet uitsluitend de pakketversie als compatibiliteitscontract. `peerDependencies.openclaw` blijft metagegevens van het npm-pakket; OpenClaw gebruikt het contract `openclaw.compat.pluginApi` voor beslissingen over installatiecompatibiliteit.

Officiële metagegevens voor installatie op aanvraag moeten `clawhubSpec` gebruiken wanneer de Plugin op ClawHub is gepubliceerd; onboarding behandelt dit als de externe voorkeursbron en registreert na installatie de artefactgegevens van ClawHub. `npmSpec` blijft de compatibiliteitsterugval voor pakketten die nog niet naar ClawHub zijn verhuisd.

Het exact vastzetten van npm-versies staat al in `npmSpec`, bijvoorbeeld `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiële externe catalogusvermeldingen moeten exacte specificaties combineren met `expectedIntegrity`, zodat updateprocessen gesloten mislukken als het opgehaalde npm-artefact niet langer overeenkomt met de vastgezette release. Interactieve onboarding biedt voor compatibiliteit nog steeds vertrouwde npm-registerspecificaties aan, waaronder kale pakketnamen en dist-tags. Catalogusdiagnostiek kan onderscheid maken tussen exacte, zwevende, op integriteit vastgezette, integriteit missende, niet-overeenkomende pakketnamen en ongeldige bronnen voor standaardkeuzes. Er wordt ook gewaarschuwd wanneer `expectedIntegrity` aanwezig is, maar er geen geldige npm-bron bestaat die ermee kan worden vastgezet. Wanneer `expectedIntegrity` aanwezig is, dwingen installatie-/updateprocessen deze waarde af; wanneer deze is weggelaten, wordt de registerresolutie zonder integriteitsvergrendeling geregistreerd.

Kanaalplugins moeten `openclaw.setupEntry` aanbieden wanneer status-, kanaallijst- of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige runtime te laden. Het configuratie-ingangspunt moet kanaalmetagegevens plus configuratieveilige adapters voor configuratie, status en geheimen beschikbaar stellen; houd netwerkclients, Gateway-listeners en transportruntimes in het hoofdingangspunt van de extensie.

Velden voor runtime-ingangspunten overschrijven de pakketgrenscontroles voor velden van broningangspunten niet. `openclaw.runtimeExtensions` kan bijvoorbeeld een ontsnappend pad in `openclaw.extensions` niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust beperkt. Het maakt niet elke willekeurige defecte configuratie installeerbaar. Momenteel staat het installatieprocessen alleen toe te herstellen van specifieke verouderde upgradefouten van gebundelde plugins, zoals een ontbrekend pad naar een gebundelde Plugin of een verouderde `channels.<id>`-vermelding voor diezelfde gebundelde Plugin. Niet-gerelateerde configuratiefouten blokkeren de installatie nog steeds en verwijzen beheerders naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` zijn pakketmetagegevens voor een kleine controlemodule:

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

Gebruik dit wanneer configuratie-, doctor-, status- of alleen-lezen-aanwezigheidsprocessen een goedkope ja/nee-controle van authenticatie nodig hebben voordat de volledige kanaal-Plugin wordt geladen. Opgeslagen authenticatiestatus is niet hetzelfde als geconfigureerde kanaalstatus: gebruik deze metagegevens niet om plugins automatisch in te schakelen, runtime-afhankelijkheden te herstellen of te bepalen of een kanaalruntime moet worden geladen. De doel-export moet een kleine functie zijn die alleen opgeslagen status leest; leid deze niet door de volledige barrel van de kanaalruntime.

`openclaw.channel.configuredState` ondersteunt goedkope controles van de geconfigureerde status. Geef de voorkeur aan declaratieve omgevingsmetagegevens wanneer omgevingsvariabelen volstaan:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Gebruik `env.allOf` wanneer elke vermelde variabele vereist is en `env.anyOf` wanneer één niet-lege variabele voldoende is. Als een kleine niet-runtimecontrole meer nodig heeft dan omgevingsmetagegevens, gebruik dan `specifier` plus `exportName`, zoals weergegeven voor `persistedAuthState`; wanneer `env` aanwezig is, gebruikt OpenClaw deze zonder die module te laden. Als de controle volledige configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan in de `config.hasConfiguredState`-hook van de Plugin.

## Detectieprioriteit (dubbele Plugin-id's)

OpenClaw detecteert plugins vanuit drie hoofdlocaties, gecontroleerd in deze volgorde: gebundelde plugins die met OpenClaw worden geleverd, de globale installatiemap (`~/.openclaw/extensions`) en de huidige werkruimtemap (`<workspace>/.openclaw/extensions`), plus eventuele expliciete `plugins.load.paths`-vermeldingen.

Als twee detecties dezelfde `id` delen, wordt alleen het manifest met de **hoogste prioriteit** behouden; duplicaten met een lagere prioriteit worden verwijderd in plaats van ernaast te worden geladen. Prioriteit, van hoog naar laag:

1. **Door configuratie geselecteerd** — een pad dat expliciet is vastgezet in `plugins.entries.<id>`
2. **Globale installatie die overeenkomt met een bijgehouden installatierecord** — een Plugin die via `openclaw plugin install`/`openclaw plugin update` is geïnstalleerd en die OpenClaw voor dezelfde id in de installatieregistratie herkent, zelfs wanneer de id ook bij een gebundelde Plugin hoort
3. **Gebundeld** — plugins die met OpenClaw worden geleverd
4. **Werkruimte** — plugins die relatief ten opzichte van de huidige werkruimte zijn gedetecteerd
5. Elke andere gedetecteerde kandidaat

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde Plugin die niet wordt bijgehouden en zich in de werkruimte of globale hoofdmap bevindt, overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin te overschrijven, voer je voor die id `openclaw plugin install` uit zodat de bijgehouden globale installatie een hogere prioriteit krijgt dan de gebundelde kopie, of zet je via `plugins.entries.<id>` een specifiek pad vast zodat dit wint door de prioriteit van door configuratie geselecteerde paden.
- Verwijderde duplicaten worden gelogd, zodat Doctor en opstartdiagnostiek naar de verworpen kopie kunnen verwijzen.
- Door configuratie geselecteerde overschrijvingen van duplicaten worden in diagnostiek aangeduid als expliciete overschrijvingen, maar geven nog steeds een waarschuwing zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## Vereisten voor JSON Schema

- **Elke plugin moet een JSON-schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is toegestaan (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van de configuratie, niet tijdens runtime.
- Wanneer je een meegeleverde plugin uitbreidt of forkt met nieuwe configuratiesleutels, werk dan tegelijkertijd de `openclaw.plugin.json` `configSchema` van die plugin bij. Schema's van meegeleverde plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` aan de gebruikersconfiguratie zonder `myNewKey` aan `configSchema.properties` toe te voegen, wordt geweigerd voordat de runtime van de plugin wordt geladen.

Voorbeeld van een schema-uitbreiding:

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

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id is gedeclareerd door een pluginmanifest. Als dezelfde id ook voorkomt in `plugins.allow`, `plugins.entries` of `plugins.installs` (een plugin waarnaar wordt verwezen, maar die momenteel niet kan worden gevonden), verlaagt OpenClaw dit in plaats daarvan tot een **waarschuwing**.
- `plugins.entries.<id>`, `plugins.allow` en `plugins.deny` die naar onbekende plugin-id's verwijzen, zijn **waarschuwingen** ("verouderde configuratievermelding genegeerd"), geen fouten, zodat upgrades en verwijderde/hernoemde plugins het starten van de Gateway niet blokkeren.
- `plugins.slots.memory` die naar een onbekende plugin-id verwijst, is een **fout**, behalve voor de bekende officiële externe plugin `memory-lancedb`; daarvoor wordt in plaats daarvan een waarschuwing gegeven.
- Als een plugin is geïnstalleerd maar een defect of ontbrekend manifest of schema heeft, mislukt de validatie en meldt Doctor de pluginfout.
- Als er een pluginconfiguratie bestaat maar de plugin **uitgeschakeld** is, blijft de configuratie behouden en wordt er een **waarschuwing** weergegeven in Doctor en de logboeken.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief plugins die vanuit het lokale bestandssysteem worden geladen. De runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest dient alleen voor detectie en validatie.
- Native manifests worden met JSON5 geparseerd, dus opmerkingen, afsluitende komma's en sleutels zonder aanhalingstekens zijn toegestaan zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden door de manifestlader gelezen. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerCatalogEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische catalogusmetadata van providers of beperkte detectiedescriptors, niet voor uitvoering tijdens verzoeken.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory` (standaard `memory-core`), `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. De runtime-ingang `OpenClawPluginDefinition.kind` is verouderd en blijft alleen behouden als compatibiliteitsterugval voor oudere plugins.
- Metadata voor omgevingsvariabelen (`setup.providers[].envVars`, de verouderde `providerAuthEnvVars` en `channelEnvVars`) is uitsluitend declaratief. Status, audits, validatie van Cron-aflevering en andere alleen-lezenoppervlakken passen nog steeds het pluginvertrouwen en het effectieve activeringsbeleid toe voordat een omgevingsvariabele als geconfigureerd wordt beschouwd.
- Zie [Runtimehooks voor providers](/nl/plugins/architecture-internals#provider-runtime-hooks) voor metadata van runtimewizards waarvoor providercode nodig is.
- Als je plugin afhankelijk is van native modules, documenteer dan de bouwstappen en eventuele vereisten voor de toestemmingslijst van de pakketbeheerder (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Pluginarchitectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitenmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Naslag voor de Plugin-SDK en imports van subpaden.
  </Card>
</CardGroup>
