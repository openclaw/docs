---
read_when:
    - Je bouwt een OpenClaw-plugin
    - Je moet een configuratieschema voor een Plugin uitbrengen of validatiefouten van een Plugin opsporen
summary: Vereisten voor het Plugin-manifest en JSON-schema (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-07-12T09:09:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina behandelt het **native OpenClaw-pluginmanifest**, `openclaw.plugin.json`. Zie [Pluginbundels](/nl/plugins/bundles) voor compatibele bundelindelingen (Codex, Claude, Cursor).

Compatibele bundelindelingen gebruiken in plaats daarvan hun eigen manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json`, of de standaardindeling van Claude-componenten zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert deze indelingen automatisch, maar valideert ze niet aan de hand van het onderstaande schema voor `openclaw.plugin.json`. Voor een compatibele bundel leest OpenClaw bundelmetadata, gedeclareerde hoofdmappen voor Skills, hoofdmappen voor Claude-opdrachten, standaardwaarden uit Claude `settings.json`, standaardwaarden voor Claude LSP en ondersteunde hookpakketten, wanneer de indeling overeenkomt met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw-plugin **moet** `openclaw.plugin.json` in de **hoofdmap van de plugin** bevatten. OpenClaw leest dit bestand om de configuratie te valideren **zonder plugincode uit te voeren**. Een ontbrekend of ongeldig manifest blokkeert de configuratievalidatie en wordt behandeld als een pluginfout.

Zie [Plugins](/nl/tools/plugin) voor de volledige handleiding voor het pluginsysteem en [Capaciteitsmodel](/nl/plugins/architecture#public-capability-model) voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit.

## Wat dit bestand doet

`openclaw.plugin.json` bevat metadata die OpenClaw leest **voordat uw plugincode wordt geladen**. Alles wat erin staat, moet eenvoudig genoeg zijn om te inspecteren zonder de pluginruntime te starten.

**Gebruik het voor:**

- pluginidentiteit, configuratievalidatie en aanwijzingen voor de configuratie-interface
- metadata voor authenticatie, onboarding en installatie (alias, automatisch inschakelen, omgevingsvariabelen van providers, authenticatiekeuzes)
- activeringsaanwijzingen voor beheerinterfaces
- verkort eigenaarschap van modelfamilies
- statische momentopnamen van capaciteitseigenaarschap (`contracts`)
- metadata voor de QA-runner die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die in catalogus- en validatie-interfaces worden samengevoegd

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints of npm-installatiemetadata. Deze horen thuis in uw plugincode en `package.json`.

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

| Veld                                 | Vereist | Type                         | Betekenis                                                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja       | `string`                     | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                                                             |
| `configSchema`                       | Ja       | `object`                     | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                                                                   |
| `requiresPlugins`                    | Nee      | `string[]`                   | Plugin-id's die ook moeten zijn geïnstalleerd voordat deze Plugin effect heeft. Tijdens detectie blijft de Plugin laadbaar, maar er wordt gewaarschuwd wanneer een vereiste Plugin ontbreekt.                                                                               |
| `enabledByDefault`                   | Nee      | `true`                       | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg of stel een andere waarde dan `true` in om de Plugin standaard uitgeschakeld te laten.                                                                                                              |
| `enabledByDefaultOnPlatforms`        | Nee      | `string[]`                   | Markeert een gebundelde Plugin als standaard alleen ingeschakeld op de vermelde Node.js-platforms, bijvoorbeeld `["darwin"]`. Expliciete configuratie heeft nog steeds voorrang.                                                                                            |
| `legacyPluginIds`                    | Nee      | `string[]`                   | Verouderde id's die naar deze canonieke Plugin-id worden genormaliseerd.                                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Nee      | `string[]`                   | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer ernaar wordt verwezen in authenticatie, configuratie of modelverwijzingen.                                                                                                                            |
| `kind`                               | Nee      | `PluginKind \| PluginKind[]` | Declareert een of meer exclusieve Plugin-soorten (`"memory"`, `"context-engine"`) die door `plugins.slots.*` worden gebruikt. Een Plugin die beide slots beheert, declareert beide soorten in één array.                                                                    |
| `channels`                           | Nee      | `string[]`                   | Kanaal-id's die door deze Plugin worden beheerd. Wordt gebruikt voor detectie en configuratievalidatie.                                                                                                                                                                     |
| `providers`                          | Nee      | `string[]`                   | Provider-id's die door deze Plugin worden beheerd.                                                                                                                                                                                                                          |
| `providerCatalogEntry`               | Nee      | `string`                     | Pad naar een lichtgewicht providercatalogusmodule, relatief ten opzichte van de Plugin-hoofdmap, voor provider-catalogusmetadata binnen het manifest die kan worden geladen zonder de volledige Plugin-runtime te activeren.                                                 |
| `modelSupport`                       | Nee      | `object`                     | Door het manifest beheerde verkorte metadata voor modelfamilies, waarmee de Plugin vóór de runtime automatisch wordt geladen.                                                                                                                                              |
| `modelCatalog`                       | Nee      | `object`                     | Declaratieve modelcatalogusmetadata voor providers die door deze Plugin worden beheerd. Dit is het beheerlaagcontract voor toekomstige alleen-lezenvermeldingen, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden.                       |
| `modelPricing`                       | Nee      | `object`                     | Door de provider beheerd beleid voor het extern opzoeken van prijzen. Gebruik dit om lokale/zelfgehoste providers uit te sluiten van externe prijscatalogi of providerverwijzingen aan OpenRouter-/LiteLLM-catalogus-id's te koppelen zonder provider-id's in de kern hard te coderen. |
| `modelIdNormalization`               | Nee      | `object`                     | Door de provider beheerde opschoning van model-id-aliassen en -voorvoegsels die moet worden uitgevoerd voordat de provider-runtime wordt geladen.                                                                                                                          |
| `providerEndpoints`                  | Nee      | `object[]`                   | Door het manifest beheerde metadata over endpointhosts en baseUrl's voor providerroutes die door de kern moeten worden geclassificeerd voordat de provider-runtime wordt geladen.                                                                                          |
| `providerRequest`                    | Nee      | `object`                     | Lichtgewicht metadata over providerfamilies en aanvraagcompatibiliteit die door algemeen aanvraagbeleid wordt gebruikt voordat de provider-runtime wordt geladen.                                                                                                         |
| `secretProviderIntegrations`         | Nee      | `Record<string, object>`     | Declaratieve voorinstellingen voor SecretRef-uitvoerproviders die installatie- of configuratie-interfaces kunnen aanbieden zonder providerspecifieke integraties in de kern hard te coderen.                                                                               |
| `cliBackends`                        | Nee      | `string[]`                   | Id's van CLI-inferentiebackends die door deze Plugin worden beheerd. Wordt gebruikt voor automatische activering bij het opstarten op basis van expliciete configuratieverwijzingen.                                                                                       |
| `syntheticAuthRefs`                  | Nee      | `string[]`                   | Verwijzingen naar providers of CLI-backends waarvan de door de Plugin beheerde synthetische authenticatiehook tijdens koude modeldetectie moet worden onderzocht voordat de runtime wordt geladen.                                                                        |
| `nonSecretAuthMarkers`               | Nee      | `string[]`                   | Door de gebundelde Plugin beheerde tijdelijke API-sleutelwaarden die een niet-geheime lokale, OAuth- of omgevingsreferentiestatus vertegenwoordigen.                                                                                                                        |
| `commandAliases`                     | Nee      | `object[]`                   | Opdrachtnamen die door deze Plugin worden beheerd en die Plugin-bewuste configuratie- en CLI-diagnostiek moeten opleveren voordat de runtime wordt geladen.                                                                                                                 |
| `providerAuthEnvVars`                | Nee      | `Record<string, string[]>`   | Verouderde compatibiliteitsmetadata voor omgevingsvariabelen bij het opzoeken van providerauthenticatie en -status. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de uitfaseringsperiode.                            |
| `providerUsageAuthEnvVars`           | Nee      | `Record<string, string[]>`   | Providerreferenties die uitsluitend voor gebruik en facturering dienen. OpenClaw gebruikt deze namen voor gebruiksdetectie en het verwijderen van geheimen, maar nooit voor inferentieauthenticatie.                                                                       |
| `providerAuthAliases`                | Nee      | `Record<string, string>`     | Provider-id's die de authenticatiezoekopdracht van een andere provider-id moeten hergebruiken, bijvoorbeeld een programmeerprovider die de API-sleutel en authenticatieprofielen van de basisprovider deelt.                                                               |
| `channelEnvVars`                     | Nee      | `Record<string, string[]>`   | Lichtgewicht metadata over kanaalomgevingsvariabelen die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor omgevingsgestuurde kanaalconfiguratie- of authenticatie-interfaces die algemene opstart- en configuratiehelpers moeten kunnen zien.          |
| `providerAuthChoices`                | Nee      | `object[]`                   | Lichtgewicht metadata voor authenticatiekeuzes in onboardingkiezers, het bepalen van de voorkeursprovider en eenvoudige koppeling van CLI-vlaggen.                                                                                                                         |
| `activation`                         | Nee      | `object`                     | Lichtgewicht metadata voor de activeringsplanner voor laden bij opstart-, provider-, opdracht-, kanaal-, route- en capaciteitstriggers. Alleen metadata; de Plugin-runtime blijft verantwoordelijk voor het daadwerkelijke gedrag.                                          |
| `setup`                              | Nee      | `object`                     | Lichtgewicht configuratie- en onboardingbeschrijvingen die detectie- en configuratie-interfaces kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                                                      |
| `qaRunners`                          | Nee      | `object[]`                   | Lichtgewicht beschrijvingen van QA-runners die door de gedeelde `openclaw qa`-host worden gebruikt voordat de Plugin-runtime wordt geladen.                                                                                                                                |
| `contracts`                          | Nee      | `object`                     | Statische momentopname van capaciteitseigendom voor externe authenticatiehooks, embeddings, spraak, realtime transcriptie, realtime spraak, mediabegrip, beeld-/video-/muziekgeneratie, webophalen, webzoeken, workerproviders, document-/webinhoudextractie en toolbeheer. |
| `configContracts`                    | Nee      | `object`                     | Door het manifest beheerd configuratiegedrag dat door algemene kernhelpers wordt gebruikt: detectie van gevaarlijke vlaggen, migratiedoelen voor SecretRef en beperking van verouderde configuratiepaden. Zie de [configContracts-referentie](#configcontracts-reference).   |
| `mediaUnderstandingProviderMetadata` | Nee      | `Record<string, object>`     | Voordelige standaardinstellingen voor mediabegrip voor provider-id's die in `contracts.mediaUnderstandingProviders` zijn gedeclareerd.                                                                                                                                      |
| `imageGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetagegevens voor beeldgeneratie voor provider-id's die in `contracts.imageGenerationProviders` zijn gedeclareerd, inclusief authenticatiealiassen die eigendom zijn van de provider en controles voor de basis-URL.                                  |
| `videoGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetagegevens voor videogeneratie voor provider-id's die in `contracts.videoGenerationProviders` zijn gedeclareerd, inclusief authenticatiealiassen die eigendom zijn van de provider en controles voor de basis-URL.                                  |
| `musicGenerationProviderMetadata`    | Nee      | `Record<string, object>`     | Voordelige authenticatiemetagegevens voor muziekgeneratie voor provider-id's die in `contracts.musicGenerationProviders` zijn gedeclareerd, inclusief authenticatiealiassen die eigendom zijn van de provider en controles voor de basis-URL.                                 |
| `toolMetadata`                       | Nee      | `Record<string, object>`     | Voordelige beschikbaarheidsmetagegevens voor tools die eigendom zijn van de plugin en in `contracts.tools` zijn gedeclareerd. Gebruik dit wanneer een tool de runtime niet mag laden tenzij er bewijs van configuratie, omgevingsvariabelen of authenticatie bestaat.           |
| `channelConfigs`                     | Nee      | `Record<string, object>`     | Configuratiemetagegevens van kanalen die eigendom zijn van het manifest en vóór het laden van de runtime worden samengevoegd met oppervlakken voor detectie en validatie.                                                                                                    |
| `skills`                             | Nee      | `string[]`                   | Te laden Skills-mappen, relatief ten opzichte van de hoofdmap van de plugin.                                                                                                                                                                                                |
| `name`                               | Nee      | `string`                     | Voor mensen leesbare naam van de plugin.                                                                                                                                                                                                                                   |
| `description`                        | Nee      | `string`                     | Korte samenvatting die op plugin-oppervlakken wordt weergegeven.                                                                                                                                                                                                           |
| `catalog`                            | Nee      | `object`                     | Optionele presentatierichtlijnen voor plugin-catalogusoppervlakken. Deze metagegevens installeren of activeren een plugin niet en verlenen er geen vertrouwen aan.                                                                                                          |
| `icon`                               | Nee      | `string`                     | HTTPS-afbeeldings-URL voor marketplace-/cataloguskaarten. ClawHub accepteert elke geldige `https://`-URL en valt terug op het standaardpictogram van de plugin wanneer deze waarde ontbreekt of ongeldig is.                                                                   |
| `version`                            | Nee      | `string`                     | Informatieve versie van de plugin.                                                                                                                                                                                                                                         |
| `uiHints`                            | Nee      | `Record<string, object>`     | UI-labels, tijdelijke aanduidingen en gevoeligheidsrichtlijnen voor configuratievelden.                                                                                                                                                                                     |

## Naslaginformatie voor `catalog`

`catalog` biedt optionele weergaveaanwijzingen voor Plugin-browsers. Hosts mogen deze aanwijzingen negeren. Ze installeren of activeren de Plugin nooit en wijzigen het runtimegedrag of vertrouwensniveau ervan niet.

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
| `featured` | `boolean` | Of catalogusweergaven deze Plugin prominent moeten tonen.                  |
| `order`    | `number`  | Oplopende weergaveaanwijzing binnen samengestelde Plugins; lagere waarden worden eerder weergegeven. |

## Naslaginformatie voor metadata van generatieproviders

De metadatavelden voor generatieproviders beschrijven statische authenticatiesignalen voor providers die zijn gedeclareerd in de bijbehorende lijst `contracts.*GenerationProviders`. OpenClaw leest deze velden voordat de providerruntime wordt geladen, zodat kerntools kunnen bepalen of een generatieprovider beschikbaar is zonder elke provider-Plugin te importeren.

Gebruik deze velden alleen voor eenvoudige, declaratieve feiten. Transport, aanvraagtransformaties, tokenvernieuwing, validatie van aanmeldgegevens en het daadwerkelijke generatiegedrag blijven in de Plugin-runtime.

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

| Veld                   | Vereist | Type       | Betekenis                                                                                                                                                    |
| ---------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | Nee     | `string[]` | Aanvullende provider-ID's die als statische authenticatiealiassen voor de generatieprovider moeten gelden.                                                   |
| `authProviders`        | Nee     | `string[]` | Provider-ID's waarvan geconfigureerde authenticatieprofielen als authenticatie voor deze generatieprovider moeten gelden.                                    |
| `configSignals`        | Nee     | `object[]` | Eenvoudige beschikbaarheidssignalen die alleen op configuratie zijn gebaseerd, voor lokale of zelfgehoste providers die zonder authenticatieprofielen of omgevingsvariabelen kunnen worden geconfigureerd. |
| `authSignals`          | Nee     | `object[]` | Expliciete authenticatiesignalen. Indien aanwezig vervangen deze de standaardsignalen van de provider-ID, `aliases` en `authProviders`.                       |
| `referenceAudioInputs` | Nee     | `boolean`  | Alleen voor videogeneratie. Stel in op `true` wanneer de provider referentie-audiobestanden accepteert; anders verbergt `video_generate` parameters voor audioreferenties. |

Elke invoer in `configSignals` ondersteunt:

| Veld             | Vereist | Type       | Betekenis                                                                                                                                                                                 |
| ---------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Ja      | `string`   | Puntpad naar het configuratieobject van de Plugin dat moet worden onderzocht, bijvoorbeeld `plugins.entries.example.config`.                                                              |
| `overlayPath`    | Nee     | `string`   | Puntpad binnen de hoofdconfiguratie waarvan het object vóór evaluatie van het signaal over het hoofdobject moet worden gelegd. Gebruik dit voor functionaliteitsspecifieke configuratie, zoals `image`, `video` of `music`. |
| `overlayMapPath` | Nee     | `string`   | Puntpad binnen de hoofdconfiguratie waarvan elke objectwaarde over het hoofdobject moet worden gelegd. Gebruik dit voor benoemde accounttoewijzingen zoals `accounts`, waarbij elk geconfigureerd account volstaat. |
| `required`       | Nee     | `string[]` | Puntpaden binnen de resulterende configuratie die geconfigureerde waarden moeten hebben. Tekenreeksen mogen niet leeg zijn; objecten en matrices mogen niet leeg zijn.                     |
| `requiredAny`    | Nee     | `string[]` | Puntpaden binnen de resulterende configuratie waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                            |
| `mode`           | Nee     | `object`   | Optionele beveiliging op basis van een tekenreeksmodus binnen de resulterende configuratie. Gebruik dit wanneer beschikbaarheid op basis van alleen configuratie slechts voor één modus geldt. |

Elke `mode`-beveiliging ondersteunt:

| Veld         | Vereist | Type       | Betekenis                                                                                           |
| ------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `path`       | Nee     | `string`   | Puntpad binnen de resulterende configuratie. Standaard is dit `mode`.                               |
| `default`    | Nee     | `string`   | Moduswaarde die wordt gebruikt wanneer het pad in de configuratie ontbreekt.                        |
| `allowed`    | Nee     | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de resulterende modus een van deze waarden heeft. |
| `disallowed` | Nee     | `string[]` | Indien aanwezig faalt het signaal wanneer de resulterende modus een van deze waarden heeft.         |

Elke invoer in `authSignals` ondersteunt:

| Veld              | Vereist | Type     | Betekenis                                                                                                                                                                              |
| ----------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string` | Provider-ID die in de geconfigureerde authenticatieprofielen moet worden gecontroleerd.                                                                                               |
| `providerBaseUrl` | Nee     | `object` | Optionele voorwaarde waardoor het signaal alleen geldt wanneer de geconfigureerde provider waarnaar wordt verwezen een toegestane basis-URL gebruikt. Gebruik dit wanneer een authenticatiealias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-voorwaarde ondersteunt:

| Veld              | Vereist | Type       | Betekenis                                                                                                                                                       |
| ----------------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string`   | ID van de providerconfiguratie waarvan `baseUrl` moet worden gecontroleerd.                                                                                      |
| `defaultBaseUrl`  | Nee     | `string`   | Basis-URL die moet worden aangenomen wanneer `baseUrl` in de providerconfiguratie ontbreekt.                                                                      |
| `allowedBaseUrls` | Ja      | `string[]` | Toegestane basis-URL's voor dit authenticatiesignaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaardbasis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Naslaginformatie voor toolmetadata

`toolMetadata` gebruikt dezelfde structuren voor `configSignals` en `authSignals` als metadata voor generatieproviders, geïndexeerd op toolnaam. `contracts.tools` declareert het eigenaarschap. `toolMetadata` declareert eenvoudig bewijs van beschikbaarheid, zodat OpenClaw kan voorkomen dat een Plugin-runtime wordt geïmporteerd enkel om de toolfactory `null` te laten retourneren.

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

Invoeren in `toolMetadata` accepteren naast de gedeelde velden `configSignals` en `authSignals` hierboven ook `optional` (markeert de tool als niet-verplicht voor activering van de Plugin) en `replaySafe` (markeert uitvoering van de tool als veilig om te herhalen na een onvolledige modelbeurt).

Als een tool geen `toolMetadata` heeft, behoudt OpenClaw het bestaande gedrag en laadt het de Plugin die eigenaar is wanneer het toolcontract overeenkomt met het beleid. Voor tools in kritieke uitvoeringspaden waarvan de factory afhankelijk is van authenticatie of configuratie, moeten Plugin-auteurs `toolMetadata` declareren in plaats van de kern de runtime te laten importeren om dit op te vragen.

## Naslaginformatie voor `providerAuthChoices`

Elke invoer in `providerAuthChoices` beschrijft één keuze voor onboarding of authenticatie. OpenClaw leest deze voordat de providerruntime wordt geladen. Lijsten voor providerconfiguratie gebruiken deze manifestkeuzes, uit descriptors afgeleide configuratiekeuzes en metadata uit de installatiecatalogus zonder de providerruntime te laden.

| Veld                  | Vereist | Type                                                                  | Betekenis                                                                                                      |
| --------------------- | ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                                              | Provider-id waartoe deze keuze behoort.                                                                        |
| `method`              | Ja      | `string`                                                              | Id van de authenticatiemethode waarnaar moet worden doorgestuurd.                                              |
| `choiceId`            | Ja      | `string`                                                              | Stabiel id van de authenticatiekeuze dat wordt gebruikt door onboarding- en CLI-stromen.                        |
| `choiceLabel`         | Nee     | `string`                                                              | Aan de gebruiker getoond label. Indien weggelaten, valt OpenClaw terug op `choiceId`.                            |
| `choiceHint`          | Nee     | `string`                                                              | Korte helptekst voor de keuzelijst.                                                                            |
| `assistantPriority`   | Nee     | `number`                                                              | Lagere waarden worden eerder gesorteerd in interactieve, door de assistent aangestuurde keuzelijsten.           |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                                        | Verberg de keuze in assistentkeuzelijsten, maar sta handmatige selectie via de CLI wel toe.                     |
| `deprecatedChoiceIds` | Nee     | `string[]`                                                            | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorsturen.                             |
| `groupId`             | Nee     | `string`                                                              | Optioneel groeps-id voor het groeperen van gerelateerde keuzes.                                                 |
| `groupLabel`          | Nee     | `string`                                                              | Aan de gebruiker getoond label voor die groep.                                                                 |
| `groupHint`           | Nee     | `string`                                                              | Korte helptekst voor de groep.                                                                                 |
| `onboardingFeatured`  | Nee     | `boolean`                                                             | Toon deze groep in de uitgelichte categorie van de interactieve onboardingkeuzelijst, vóór het item "Meer...". |
| `optionKey`           | Nee     | `string`                                                              | Interne optiesleutel voor eenvoudige authenticatiestromen met één vlag.                                         |
| `cliFlag`             | Nee     | `string`                                                              | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                             |
| `cliOption`           | Nee     | `string`                                                              | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Nee     | `string`                                                              | Beschrijving die in de CLI-help wordt gebruikt.                                                                |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Op welke onboardingschermen deze keuze moet verschijnen. Indien weggelaten, is de standaard `["text-inference"]`. |

## Naslag voor `commandAliases`

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers per vergissing in `plugins.allow` kunnen zetten of als CLI-hoofdopdracht kunnen proberen uit te voeren. OpenClaw gebruikt deze metagegevens voor diagnostiek zonder de runtimecode van de plugin te importeren.

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

| Veld         | Vereist | Type              | Betekenis                                                                  |
| ------------ | ------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Opdrachtnaam die bij deze plugin hoort.                                    |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als een slashopdracht in de chat in plaats van een CLI-hoofdopdracht. |
| `cliCommand` | Nee     | `string`          | Gerelateerde CLI-hoofdopdracht om voor CLI-bewerkingen voor te stellen, indien aanwezig. |

## Naslag voor `activation`

Gebruik `activation` wanneer de plugin zonder veel overhead kan aangeven bij welke gebeurtenissen in het besturingsvlak deze in een activerings-/laadplan moet worden opgenomen.

Dit blok bevat plannermetagegevens en is geen levenscyclus-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en garandeert niet dat de plugincode al is uitgevoerd. De activeringsplanner gebruikt deze velden om kandidaat-plugins te beperken voordat wordt teruggevallen op bestaande eigendomsmetagegevens in het manifest, zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de meest specifieke metagegevens die het eigendom al beschrijven. Gebruik `providers`, `channels`, `commandAliases`, setupbeschrijvingen of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor aanvullende plannerhints die niet door die eigendomsvelden kunnen worden weergegeven. Gebruik `cliBackends` op het hoogste niveau voor CLI-runtime-aliassen zoals `claude-cli`, `my-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen bedoeld voor id's van ingebedde agent-harnassen waarvoor nog geen eigendomsveld bestaat.

Elke plugin moet `activation.onStartup` bewust instellen. Stel dit alleen in op `true` wanneer de plugin tijdens het opstarten van de Gateway moet worden uitgevoerd. Stel het in op `false` wanneer de plugin bij het opstarten inactief is en alleen door specifiekere triggers moet worden geladen. Als `onStartup` wordt weggelaten, wordt de plugin niet langer impliciet bij het opstarten geladen; gebruik expliciete activeringsmetagegevens voor triggers bij het opstarten, voor kanalen, configuratie, agent-harnassen, geheugen of andere specifiekere activeringstriggers.

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

| Veld               | Vereist | Type                                                 | Betekenis                                                                                                                                                                                        |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete activering bij het opstarten van de Gateway. Elke plugin moet dit instellen. `true` importeert de plugin tijdens het opstarten; `false` houdt deze tijdens het opstarten lui geladen, tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's waardoor deze plugin in activerings-/laadplannen moet worden opgenomen.                                                                                                            |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Runtime-id's van ingebedde agent-harnassen waardoor deze plugin in activerings-/laadplannen moet worden opgenomen. Gebruik `cliBackends` op het hoogste niveau voor aliassen van CLI-backends.    |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's waardoor deze plugin in activerings-/laadplannen moet worden opgenomen.                                                                                                            |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's waardoor deze plugin in activerings-/laadplannen moet worden opgenomen.                                                                                                              |
| `onRoutes`         | Nee     | `string[]`                                           | Routetypen waardoor deze plugin in activerings-/laadplannen moet worden opgenomen.                                                                                                               |
| `onConfigPaths`    | Nee     | `string[]`                                           | Configuratiepaden ten opzichte van de hoofdmap waardoor deze plugin in opstart-/laadplannen moet worden opgenomen wanneer het pad aanwezig en niet expliciet uitgeschakeld is.                    |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Algemene capaciteitshints die worden gebruikt bij activeringsplanning in het besturingsvlak. Geef waar mogelijk de voorkeur aan specifiekere velden.                                            |

Huidige actieve afnemers:

- De opstartplanning van de Gateway gebruikt `activation.onStartup` voor expliciete import tijdens het opstarten.
- Door opdrachten geactiveerde CLI-planning valt terug op het verouderde `commandAliases[].cliCommand` of `commandAliases[].name`.
- Opstartplanning van de agentruntime gebruikt `activation.onAgentHarnesses` voor ingebedde harnassen en `cliBackends[]` op het hoogste niveau voor CLI-runtime-aliassen.
- Door kanalen geactiveerde setup-/kanaalplanning valt terug op het verouderde eigendom via `channels[]` wanneer expliciete activeringsmetagegevens voor kanalen ontbreken.
- Pluginplanning bij het opstarten gebruikt `activation.onConfigPaths` voor niet-kanaalgebonden hoofdconfiguratieoppervlakken, zoals het blok `browser` van de meegeleverde browserplugin.
- Door providers geactiveerde setup-/runtimeplanning valt terug op het verouderde eigendom via `providers[]` en `cliBackends[]` op het hoogste niveau wanneer expliciete activeringsmetagegevens voor providers ontbreken.

Plannerdiagnostiek kan expliciete activeringshints onderscheiden van terugval op manifesteigendom. Zo betekent `activation-command-hint` bijvoorbeeld dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan het eigendom via `commandAliases` gebruikte. Deze redenlabels zijn bedoeld voor diagnostiek en tests van de host; pluginauteurs moeten de metagegevens blijven declareren die het eigendom het best beschrijven.

## Naslag voor `qaRunners`

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners toevoegt onder
de gedeelde hoofdopdracht `openclaw qa`. Houd deze metagegevens eenvoudig en statisch; de
pluginruntime blijft verantwoordelijk voor de daadwerkelijke CLI-registratie via een lichtgewicht
`runtime-api.ts`-oppervlak dat overeenkomende `qaRunnerCliRegistrations` exporteert. Een
optionele `adapterFactory` stelt het transport beschikbaar aan gedeelde QA-scenario's zonder
de runner van de geregistreerde opdracht te wijzigen.

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

| Veld          | Vereist | Type     | Betekenis                                                                        |
| ------------- | ------- | -------- | -------------------------------------------------------------------------------- |
| `commandName` | Ja      | `string` | Subopdracht die onder `openclaw qa` wordt gekoppeld, bijvoorbeeld `matrix`.      |
| `description` | Nee     | `string` | Terugvalhelptekst die wordt gebruikt wanneer de gedeelde host een voorlopige opdracht nodig heeft. |

De id `adapterFactory` moet overeenkomen met `commandName`. Exporteer geen registraties
voor opdrachten die niet in het manifest staan.

## naslaginformatie voor setup

Gebruik `setup` wanneer setup- en onboardingoppervlakken goedkope, door de Plugin beheerde metadata nodig hebben voordat de runtime wordt geladen.

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

`cliBackends` op het hoogste niveau blijft geldig en blijft CLI-inferentiebackends beschrijven. `setup.cliBackends` is het setup-specifieke descriptoroppervlak voor besturingsvlak- en setupstromen die uitsluitend uit metadata moeten blijven bestaan.

Wanneer ze aanwezig zijn, vormen `setup.providers` en `setup.cliBackends` het voorkeursoppervlak voor descriptor-eerst-zoekacties bij setupdetectie. Als de descriptor alleen de kandidaat-Plugin beperkt en de setup nog uitgebreidere runtimehooks tijdens de setup nodig heeft, stel dan `requiresRuntime: true` in en behoud `setup-api` als terugvalpad voor uitvoering.

OpenClaw neemt `setup.providers[].envVars` ook op in algemene zoekacties voor providerauthenticatie en omgevingsvariabelen. `providerAuthEnvVars` blijft tijdens de afschaffingsperiode ondersteund via een compatibiliteitsadapter, maar niet-gebundelde plugins die dit nog gebruiken, ontvangen een manifestdiagnose. Nieuwe plugins moeten omgevingsmetadata voor setup/status in `setup.providers[].envVars` plaatsen.

Gebruik `providerUsageAuthEnvVars` wanneer een referentie op facturerings- of organisatieniveau `resolveUsageAuth` moet activeren zonder een inferentiereferentie te worden. Deze namen worden toegevoegd aan de blokkering van dotenv-bestanden in de werkruimte, verwijdering uit ACP-subprocessen, filtering van geheimen in de sandbox en brede opschoning van geheimen. De providerruntime leest en classificeert de waarde nog steeds binnen `resolveUsageAuth`.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods` wanneer geen setupitem beschikbaar is, of wanneer `setup.requiresRuntime: false` aangeeft dat een setupruntime niet nodig is. Expliciete `providerAuthChoices`-items behouden de voorkeur voor aangepaste labels, CLI-vlaggen, onboardingbereik en assistentmetadata.

Stel `requiresRuntime: false` alleen in wanneer deze descriptors voldoende zijn voor het setupoppervlak. OpenClaw behandelt een expliciete waarde `false` als een contract dat uitsluitend uit descriptors bestaat en voert `setup-api` of `openclaw.setupEntry` niet uit voor setupzoekacties. Als een Plugin die uitsluitend descriptors gebruikt toch een van deze setupruntime-items levert, meldt OpenClaw een aanvullende diagnose en blijft het item negeren. Wanneer `requiresRuntime` wordt weggelaten, blijft het verouderde terugvalgedrag behouden, zodat bestaande plugins die descriptors zonder de vlag hebben toegevoegd niet stukgaan.

Omdat setupzoekacties door de Plugin beheerde `setup-api`-code kunnen uitvoeren, moeten genormaliseerde waarden van `setup.providers[].id` en `setup.cliBackends[]` uniek blijven voor alle gedetecteerde plugins. Bij dubbelzinnig eigenaarschap wordt de bewerking veilig geweigerd in plaats van een winnaar te kiezen op basis van de detectievolgorde.

Wanneer de setupruntime wel wordt uitgevoerd, melden diagnosen van het setupregister descriptorafwijkingen als `setup-api` een provider of CLI-backend registreert die niet door de manifestdescriptors wordt gedeclareerd, of als een descriptor geen overeenkomende runtimeregistratie heeft. Deze diagnosen zijn aanvullend en wijzen verouderde plugins niet af.

### naslaginformatie voor setup.providers

| Veld           | Vereist | Type       | Betekenis                                                                                                      |
| -------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `id`           | Ja       | `string`   | Provider-id dat tijdens setup of onboarding beschikbaar wordt gesteld. Houd genormaliseerde id's wereldwijd uniek. |
| `authMethods`  | Nee      | `string[]` | Id's van setup-/authenticatiemethoden die deze provider ondersteunt zonder de volledige runtime te laden.     |
| `envVars`      | Nee      | `string[]` | Omgevingsvariabelen die algemene setup-/statusoppervlakken kunnen controleren voordat de Plugin-runtime wordt geladen. |
| `authEvidence` | Nee      | `object[]` | Goedkope lokale controles op authenticatiebewijs voor providers die via niet-geheime markeringen kunnen authenticeren. |

`authEvidence` is bedoeld voor door de provider beheerde lokale referentiemarkeringen die kunnen worden geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven: geen netwerkaanroepen, geen leesacties uit een sleutelhanger of geheimenbeheerder, geen shellopdrachten en geen controles van provider-API's.

Ondersteunde bewijsitems:

| Veld               | Vereist | Type       | Betekenis                                                                                                           |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja       | `string`   | Momenteel `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Nee      | `string`   | Omgevingsvariabele die een expliciet pad naar een referentiebestand bevat.                                          |
| `fallbackPaths`    | Nee      | `string[]` | Paden naar lokale referentiebestanden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee      | `string[]` | Ten minste één vermelde omgevingsvariabele moet niet leeg zijn voordat het bewijs geldig is.                        |
| `requiresAllEnv`   | Nee      | `string[]` | Elke vermelde omgevingsvariabele moet niet leeg zijn voordat het bewijs geldig is.                                  |
| `credentialMarker` | Ja       | `string`   | Niet-geheime markering die wordt geretourneerd wanneer het bewijs aanwezig is.                                     |
| `source`           | Nee      | `string`   | Gebruikersgericht bronlabel voor authenticatie-/statusuitvoer.                                                      |

### setupvelden

| Veld               | Vereist | Type       | Betekenis                                                                                                   |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`        | Nee      | `object[]` | Descriptors voor providersetup die tijdens setup en onboarding beschikbaar worden gesteld.                 |
| `cliBackends`      | Nee      | `string[]` | Backend-id's voor setuptijd die worden gebruikt voor descriptor-eerst-zoekacties. Houd genormaliseerde id's wereldwijd uniek. |
| `configMigrations` | Nee      | `string[]` | Id's van configuratiemigraties die worden beheerd door het setupoppervlak van deze Plugin.                  |
| `requiresRuntime`  | Nee      | `boolean`  | Of voor setup na de descriptorzoekactie nog uitvoering van `setup-api` nodig is.                           |

## naslaginformatie voor uiHints

`uiHints` is een toewijzing van namen van configuratievelden aan kleine weergaveaanwijzingen. Sleutels kunnen punten gebruiken voor geneste configuratievelden, maar geen enkel padsegment mag `__proto__`, `constructor` of `prototype` zijn; setup wijst deze namen af.

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

Elke veldaanwijzing kan het volgende bevatten:

| Veld          | Type       | Betekenis                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Gebruikersgericht veldlabel.               |
| `help`        | `string`   | Korte hulptekst.                           |
| `tags`        | `string[]` | Optionele UI-tags.                         |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.         |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.  |
| `placeholder` | `string`   | Tijdelijke aanduiding voor formulierinvoer. |

## naslaginformatie voor contracts

Gebruik `contracts` alleen voor statische metadata over het eigenaarschap van mogelijkheden die OpenClaw kan lezen zonder de Plugin-runtime te importeren.

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

| Veld                             | Type       | Betekenis                                                                                                                                            |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-id's voor Codex-appserverextensies, momenteel `codex-app-server`.                                                                             |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor deze Plugin middleware voor toolresultaten mag registreren.                                                                     |
| `trustedToolPolicies`            | `string[]` | Plugin-lokale id's voor vertrouwd pre-toolbeleid die een geïnstalleerde Plugin mag registreren. Gebundelde Plugins mogen beleid zonder dit veld registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze Plugin de hook voor externe authenticatieprofielen beheert.                                                                |
| `embeddingProviders`             | `string[]` | Algemene embeddingprovider-id's die deze Plugin beheert voor herbruikbare vectorembeddings, waaronder geheugen.                                       |
| `speechProviders`                | `string[]` | Spraakprovider-id's die deze Plugin beheert.                                                                                                          |
| `realtimeTranscriptionProviders` | `string[]` | Provider-id's voor realtime transcriptie die deze Plugin beheert.                                                                                     |
| `realtimeVoiceProviders`         | `string[]` | Provider-id's voor realtime spraak die deze Plugin beheert.                                                                                           |
| `memoryEmbeddingProviders`       | `string[]` | Verouderde geheugenspecifieke embeddingprovider-id's die deze Plugin beheert.                                                                         |
| `mediaUnderstandingProviders`    | `string[]` | Provider-id's voor mediabegrip die deze Plugin beheert.                                                                                               |
| `transcriptSourceProviders`      | `string[]` | Provider-id's voor transcriptbronnen die deze Plugin beheert.                                                                                         |
| `documentExtractors`             | `string[]` | Provider-id's voor extractors van documenten (bijvoorbeeld PDF) die deze Plugin beheert.                                                              |
| `imageGenerationProviders`       | `string[]` | Provider-id's voor het genereren van afbeeldingen die deze Plugin beheert.                                                                            |
| `videoGenerationProviders`       | `string[]` | Provider-id's voor het genereren van video's die deze Plugin beheert.                                                                                 |
| `musicGenerationProviders`       | `string[]` | Provider-id's voor het genereren van muziek die deze Plugin beheert.                                                                                  |
| `webContentExtractors`           | `string[]` | Provider-id's voor het extraheren van inhoud uit webpagina's die deze Plugin beheert.                                                                 |
| `webFetchProviders`              | `string[]` | Provider-id's voor het ophalen van webinhoud die deze Plugin beheert.                                                                                 |
| `webSearchProviders`             | `string[]` | Provider-id's voor zoeken op het web die deze Plugin beheert.                                                                                         |
| `workerProviders`                | `string[]` | Provider-id's voor cloudworkers die deze Plugin beheert voor inrichting en een door profielen ondersteunde leaselevenscyclus.                          |
| `usageProviders`                 | `string[]` | Provider-id's waarvan deze Plugin de hooks voor gebruiksauthenticatie en gebruikssnapshots beheert.                                                    |
| `migrationProviders`             | `string[]` | Importprovider-id's die deze Plugin beheert voor `openclaw migrate`.                                                                                   |
| `gatewayMethodDispatch`          | `string[]` | Gereserveerde bevoegdheid voor geauthenticeerde HTTP-routes van Plugins die Gateway-methoden binnen het proces aanroepen.                              |
| `tools`                          | `string[]` | Namen van agenttools die deze Plugin beheert.                                                                                                         |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde extensiefactory's die uitsluitend voor de Codex-appserver bestemd zijn. Gebundelde transformaties van toolresultaten moeten in plaats daarvan `contracts.agentToolResultMiddleware` declareren en zich registreren met `api.registerAgentToolResultMiddleware(...)`. Geïnstalleerde Plugins mogen dezelfde middlewarekoppeling alleen gebruiken wanneer deze expliciet is ingeschakeld en uitsluitend voor runtimes die zij in `contracts.agentToolResultMiddleware` declareren.

Geïnstalleerde Plugins die de door de host vertrouwde pre-toolbeleidslaag nodig hebben, moeten elk geregistreerd lokaal id in `contracts.trustedToolPolicies` declareren en expliciet zijn ingeschakeld. Gebundelde Plugins behouden het bestaande pad voor vertrouwd beleid, maar geïnstalleerde Plugins met niet-gedeclareerde beleids-id's worden vóór registratie geweigerd. Beleids-id's vallen binnen het bereik van de registrerende Plugin, zodat twee Plugins beide `workflow-budget` mogen declareren en registreren; één Plugin mag hetzelfde lokale id niet tweemaal registreren.

Runtime-registraties via `api.registerTool(...)` moeten overeenkomen met `contracts.tools`. Tooldetectie gebruikt deze lijst om alleen de runtimes van Plugins te laden die de aangevraagde tools kunnen beheren.

Provider-Plugins die `resolveExternalAuthProfiles` implementeren, moeten `contracts.externalAuthProviders` declareren; niet-gedeclareerde hooks voor externe authenticatie worden genegeerd.

Provider-Plugins die zowel `resolveUsageAuth` als `fetchUsageSnapshot` implementeren, moeten elk automatisch gedetecteerd provider-id in `contracts.usageProviders` declareren. Gebruiksdetectie leest dit contract voordat runtimecode wordt geladen en verifieert vervolgens beide hooks nadat alleen de gedeclareerde beheerders zijn geladen.

Algemene embeddingproviders moeten `contracts.embeddingProviders` declareren voor elke adapter die met `api.registerEmbeddingProvider(...)` wordt geregistreerd. Gebruik het algemene contract voor herbruikbare vectorgeneratie, waaronder providers die door geheugenzoekopdrachten worden gebruikt. `contracts.memoryEmbeddingProviders` is verouderde, geheugenspecifieke compatibiliteit en blijft alleen bestaan terwijl bestaande providers naar de generieke koppeling voor embeddingproviders migreren.

Workerproviders moeten elk via `api.registerWorkerProvider(...)` geregistreerd id in `contracts.workerProviders` declareren. Core slaat duurzame intentie op voordat `provision` wordt aangeroepen; providers valideren hun instellingen vóór externe toewijzing en herhaalde aanroepen met hetzelfde bewerkings-id moeten dezelfde lease overnemen. Core slaat ook die gevalideerde momentopname van instellingen op en geeft deze samen met `leaseId` door aan `inspect({ leaseId, profile })` en `destroy({ leaseId, profile })`, ook nadat het genoemde profiel is gewijzigd of verwijderd. Vernietiging is idempotent, inspectie retourneert de gesloten statusvereniging `active` / `destroyed` / `unknown`, en materiaal van privésleutels voor SSH wordt uitsluitend via `SecretRef` aangeduid. Ingerichte SSH-eindpunten moeten ook een openbare `hostKey` uit vertrouwde inrichtingsuitvoer bevatten, exact in de vorm `algorithm base64`, zonder hostnaam of opmerking, zodat Core de host vóór het verbinden kan vastzetten. Providers die dynamische identiteitsreferenties uitgeven, mogen een gezaghebbende `resolveSshIdentity({ leaseId, profile, keyRef })` implementeren; providers zonder deze functie gebruiken de generieke geheimresolver van Core. Een gezaghebbende `unknown` maakt een actief lokaal record wees; na een opgeslagen vernietigingsverzoek bevestigt dit de ontmanteling.

`contracts.gatewayMethodDispatch` accepteert momenteel `"authenticated-request"`. Het is een hygiënepoort voor de API van native HTTP-routes van Plugins die doelbewust Gateway-methoden voor het besturingsvlak binnen het proces aanroepen, geen sandbox ter bescherming tegen schadelijke native Plugins. Gebruik dit alleen voor grondig beoordeelde gebundelde/operatoroppervlakken die al HTTP-authenticatie van de Gateway vereisen. Een bevoegde route blijft bereikbaar terwijl de toelating van Gateway-hoofdwerk gesloten is, uitsluitend wanneer deze ook `auth: "gateway"` en de routespecifieke `gatewayRuntimeScopeSurface: "trusted-operator"` declareert; gewone zusterroutes van dezelfde Plugin blijven achter de toelatingsgrens. Hierdoor blijven de opschortingsstatus en hervatting bereikbaar zonder de hele Plugin een omzeiling van de toelating te geven. Houd parsering en vormgeving van antwoorden begrensd buiten de aanroep; wezenlijk of muterend werk moet via de Gateway-methodedispatch verlopen, die de toelating en bereikafdwinging beheert.

## Naslag voor configContracts

Gebruik `configContracts` voor manifestbeheerd configuratiegedrag dat generieke Core-helpers nodig hebben zonder de Plugin-runtime te importeren: detectie van gevaarlijke vlaggen, migratiedoelen voor `SecretRef` en beperking van verouderde configuratiepaden.

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

| Veld                          | Vereist | Type       | Betekenis                                                                                                                                                                                                                                                  |
| ----------------------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Nee     | `string[]` | Configuratiepaden relatief aan de hoofdmap die aangeven dat compatibiliteitsmigraties tijdens de installatie van deze Plugin mogelijk van toepassing zijn. Hiermee kunnen generieke runtimelezingen van configuratie elk installatieoppervlak van Plugins overslaan wanneer de configuratie nooit naar de Plugin verwijst. |
| `compatibilityRuntimePaths`   | Nee     | `string[]` | Compatibiliteitspaden relatief aan de hoofdmap die deze Plugin tijdens runtime kan afhandelen voordat de Plugin-code volledig wordt geactiveerd. Gebruik dit voor verouderde oppervlakken die verzamelingen van gebundelde kandidaten moeten beperken zonder elke compatibele Plugin-runtime te importeren. |
| `dangerousFlags`              | Nee     | `object[]` | Configuratieliteralen die `openclaw doctor` als onveilig of gevaarlijk moet markeren wanneer ze zijn ingeschakeld. Zie hieronder.                                                                                                                            |
| `secretInputs`                | Nee     | `object`   | Configuratiepaden onder `plugins.entries.<id>.config` die het doelregister voor `SecretRef`-migratie/-controle als tekenreeksen in de vorm van geheimen moet behandelen. Zie hieronder.                                                                         |

Elke vermelding in `dangerousFlags` ondersteunt:

| Veld     | Vereist | Type                                  | Betekenis                                                                                                                     |
| -------- | ------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `path`   | Ja      | `string`                              | Door punten gescheiden configuratiepad relatief aan `plugins.entries.<id>.config`. Ondersteunt `*`-jokertekens voor kaart-/arraysegmenten. |
| `equals` | Ja      | `string \| number \| boolean \| null` | Exacte letterlijke waarde die deze configuratiewaarde als gevaarlijk markeert.                                                |

`secretInputs` ondersteunt:

| Veld                    | Vereist | Type       | Betekenis                                                                                                                                                                                                                              |
| ----------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Nee      | `boolean`  | Overschrijf de standaardactivering van de gebundelde Plugin bij het bepalen of dit SecretRef-oppervlak actief is. Gebruik dit wanneer de Plugin is gebundeld, maar het oppervlak inactief moet blijven totdat het expliciet in de configuratie wordt geactiveerd. |
| `paths`                 | Ja       | `object[]` | Configuratiepaden in geheimvorm, elk met `path` (door punten gescheiden, relatief ten opzichte van `plugins.entries.<id>.config`, ondersteunt jokertekens met `*`) en optioneel `expected` (momenteel alleen `"string"`).                   |

## Naslaginformatie voor mediaUnderstandingProviderMetadata

Gebruik `mediaUnderstandingProviderMetadata` wanneer een provider voor mediabegrip standaardmodellen, prioriteit voor automatische authenticatieterugval of native documentondersteuning heeft die generieke kernhulpprogramma's nodig hebben voordat de runtime wordt geladen. Sleutels moeten ook in `contracts.mediaUnderstandingProviders` worden gedeclareerd.

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

| Veld                   | Type                                                             | Betekenis                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Mediamogelijkheden die door deze provider beschikbaar worden gesteld.                                                            |
| `defaultModels`        | `Record<string, string>`                                         | Standaardtoewijzingen van mogelijkheid aan model die worden gebruikt wanneer de configuratie geen model opgeeft.                  |
| `autoPriority`         | `Record<string, number>`                                         | Lagere getallen worden eerder gesorteerd voor automatische, op aanmeldgegevens gebaseerde providerterugval.                       |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Native documentinvoer die door de provider wordt ondersteund.                                                                     |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Modeloverschrijvingen per documenttype. Stel `image: false` in om beeldgebaseerde extractie voor dat documenttype uit te schakelen. |

## Naslaginformatie voor channelConfigs

Gebruik `channelConfigs` wanneer een kanaal-Plugin goedkope configuratiemetadata nodig heeft voordat de runtime wordt geladen. Alleen-lezen detectie van kanaalconfiguratie en -status kan deze metadata rechtstreeks gebruiken voor geconfigureerde externe kanalen wanneer er geen configuratievermelding beschikbaar is, of wanneer `setup.requiresRuntime: false` aangeeft dat een configuratieruntime niet nodig is.

`channelConfigs` is metadata van het Pluginmanifest, geen nieuwe gebruikersconfiguratiesectie op het hoogste niveau. Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`. OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde kanaal voordat de runtimecode van de Plugin wordt uitgevoerd.

Voor een kanaal-Plugin beschrijven `configSchema` en `channelConfigs` verschillende paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde Plugins die `channels[]` declareren, moeten ook overeenkomende `channelConfigs`-vermeldingen declareren. Zonder deze vermeldingen kan OpenClaw de Plugin nog steeds laden, maar kunnen configuratieschema-, configuratie- en Control UI-oppervlakken in het koude pad de vorm van de kanaalspecifieke opties pas kennen wanneer de runtime van de Plugin wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en `nativeSkillsAutoEnabled` kunnen statische `auto`-standaardwaarden declareren voor controles van opdrachtconfiguraties die worden uitgevoerd voordat de kanaalruntime wordt geladen. Gebundelde kanalen kunnen dezelfde standaardwaarden ook publiceren via `package.json#openclaw.channel.commands`, naast hun overige kanaalcatalogusmetadata die eigendom is van het pakket.

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
      "description": "Matrix homeserver connection",
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

| Veld          | Type                     | Betekenis                                                                                                                                      |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratievermelding.                                                |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels, tijdelijke aanduidingen en aanwijzingen voor gevoelige gegevens voor die kanaalconfiguratiesectie.                        |
| `label`       | `string`                 | Kanaallabel dat met selectie- en inspectieoppervlakken wordt samengevoegd wanneer runtimemetadata nog niet gereed is.                          |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                                                                             |
| `commands`    | `object`                 | Statische automatische standaardwaarden voor native opdrachten en native Skills voor configuratiecontroles vóór de runtime.                   |
| `preferOver`  | `string[]`               | Verouderde Plugin-ID's of Plugin-ID's met lagere prioriteit die dit kanaal in selectieoppervlakken moet overtreffen.                           |

### Een andere kanaal-Plugin vervangen

Gebruik `preferOver` wanneer uw Plugin de voorkeurs-eigenaar is van een kanaal-ID dat ook door een andere Plugin kan worden geleverd. Veelvoorkomende gevallen zijn een hernoemde Plugin-ID, een zelfstandige Plugin die een gebundelde Plugin vervangt, of een onderhouden fork die dezelfde kanaal-ID behoudt voor configuratiecompatibiliteit.

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

Wanneer `channels.chat` is geconfigureerd, houdt OpenClaw rekening met zowel de kanaal-ID als de voorkeurs-Plugin-ID. Als de Plugin met lagere prioriteit alleen is geselecteerd omdat deze is gebundeld of standaard is geactiveerd, schakelt OpenClaw deze uit in de effectieve runtimeconfiguratie, zodat één Plugin eigenaar is van het kanaal en de bijbehorende hulpmiddelen. Expliciete gebruikersselectie heeft nog steeds voorrang: als de gebruiker beide Plugins expliciet activeert (via `plugins.allow` of een materiële `plugins.entries`-configuratie), behoudt OpenClaw die keuze en rapporteert het diagnostische meldingen over dubbele kanalen en hulpmiddelen, in plaats van de aangevraagde Pluginset stilzwijgend te wijzigen.

Beperk `preferOver` tot Plugin-ID's die werkelijk hetzelfde kanaal kunnen leveren. Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## Naslaginformatie voor modelSupport

Gebruik `modelSupport` wanneer OpenClaw uw provider-Plugin moet afleiden uit verkorte model-ID's zoals `gpt-5.6-sol` of `claude-sonnet-4.6` voordat de runtime van de Plugin wordt geladen.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw past deze prioriteitsvolgorde toe:

- expliciete `provider/model`-verwijzingen gebruiken de manifestmetadata van de eigenaar uit `providers`
- `modelPatterns` heeft voorrang op `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, heeft de niet-gebundelde Plugin voorrang
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Betekenis                                                                                          |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Voorvoegsels die met `startsWith` worden vergeleken met verkorte model-ID's.                       |
| `modelPatterns` | `string[]` | Bronnen voor reguliere expressies die na verwijdering van het profielachtervoegsel met verkorte model-ID's worden vergeleken. |

Vermeldingen in `modelPatterns` worden gecompileerd via `compileSafeRegex`, dat patronen met geneste herhaling weigert (bijvoorbeeld `(a+)+$`). Patronen die niet door de veiligheidscontrole komen, worden stilzwijgend overgeslagen, net als syntactisch ongeldige reguliere expressies. Houd patronen eenvoudig en vermijd geneste kwantoren.

## Naslaginformatie voor modelCatalog

Gebruik `modelCatalog` wanneer OpenClaw de modelmetadata van de provider moet kennen voordat de runtime van de Plugin wordt geladen. Dit is de bron die eigendom is van het manifest voor vaste catalogusrijen, provideraliassen, onderdrukkingsregels en detectiemodus. Runtimevernieuwing blijft de verantwoordelijkheid van de runtimcode van de provider, maar het manifest vertelt de kern wanneer runtime vereist is.

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

Velden op het hoogste niveau:

| Veld             | Type                                                     | Betekenis                                                                                                        |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze plugin. Sleutels moeten ook voorkomen in `providers` op het hoogste niveau. |
| `aliases`        | `Record<string, object>`                                 | Provideraliassen die voor catalogus- of onderdrukkingsplanning moeten worden herleid tot een provider waarvan de plugin eigenaar is. |
| `suppressions`   | `object[]`                                               | Modelrijen uit een andere bron die deze plugin om een providerspecifieke reden onderdrukt.                       |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus uit manifestmetagegevens kan worden gelezen, in de cache kan worden vernieuwd of runtime vereist. |
| `runtimeAugment` | `boolean`                                                | Stel alleen in op `true` wanneer de providerruntime catalogusrijen moet toevoegen na manifest-/configuratieplanning. |

`aliases` neemt deel aan het opzoeken van providereigendom voor de planning van de modelcatalogus. Aliasdoelen moeten providers op het hoogste niveau zijn die eigendom zijn van dezelfde plugin. Wanneer een op provider gefilterde lijst een alias gebruikt, kan OpenClaw het manifest van de eigenaar lezen en API-/basis-URL-overschrijvingen van de alias toepassen zonder de providerruntime te laden. Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de canonieke providerrijen van de eigenaar weer.

`suppressions` vervangt de oude providerruntimehook `suppressBuiltInModel`. Onderdrukkingsitems worden alleen gerespecteerd wanneer de provider eigendom is van de plugin of is gedeclareerd als een sleutel van `modelCatalog.aliases` die naar een provider van de eigenaar verwijst. Runtimehooks voor onderdrukking worden niet langer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld                  | Type                     | Betekenis                                                                                                                                                                                                        |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus.                                                                                                                                            |
| `api`                 | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus.                                                                                                                                          |
| `headers`             | `Record<string, string>` | Optionele statische headers die op deze providercatalogus van toepassing zijn.                                                                                                                                    |
| `defaultUtilityModel` | `string`                 | Optionele, door de provider aanbevolen id van een klein model voor korte interne hulptaken (titels, voortgangsbeschrijvingen). Wordt gebruikt wanneer `agents.defaults.utilityModel` niet is ingesteld en deze provider het primaire model van de agent levert. |
| `models`              | `object[]`               | Vereiste modelrijen. Rijen zonder `id` worden genegeerd.                                                                                                                                                          |

Modelvelden:

| Veld               | Type                                                           | Betekenis                                                                       |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Providerlokale model-id, zonder het voorvoegsel `provider/`.                    |
| `name`             | `string`                                                       | Optionele weergavenaam.                                                         |
| `api`              | `ModelApi`                                                     | Optionele API-overschrijving per model.                                         |
| `baseUrl`          | `string`                                                       | Optionele overschrijving van de basis-URL per model.                            |
| `headers`          | `Record<string, string>`                                       | Optionele statische headers per model.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modaliteiten die het model accepteert. Andere waarden worden stilzwijgend verwijderd. |
| `reasoning`        | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                  |
| `contextWindow`    | `number`                                                       | Systeemeigen contextvenster van de provider.                                    |
| `contextTokens`    | `number`                                                       | Optionele effectieve runtimecontextlimiet wanneer deze afwijkt van `contextWindow`. |
| `maxTokens`        | `number`                                                       | Maximaal aantal uitvoertokens, indien bekend.                                   |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Optionele overschrijvingen van model-id's of parameters per denkniveau.         |
| `cost`             | `object`                                                       | Optionele prijsstelling in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`           | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met de compatibiliteit van de OpenClaw-modelconfiguratie. |
| `mediaInput`       | `object`                                                       | Optionele invoerconfiguratie per modaliteit, momenteel alleen voor afbeeldingen. |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Lijststatus. Onderdruk alleen wanneer de rij helemaal niet mag verschijnen.     |
| `statusReason`     | `string`                                                       | Optionele reden die wordt weergegeven bij een niet-beschikbare status.          |
| `replaces`         | `string[]`                                                     | Oudere providerlokale model-id's die door dit model worden vervangen.           |
| `replacedBy`       | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                       |
| `tags`             | `string[]`                                                     | Stabiele tags die door keuzelijsten en filters worden gebruikt.                  |

Onderdrukkingsvelden:

| Veld                       | Type       | Betekenis                                                                                                      |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de bovenliggende rij die moet worden onderdrukt. Moet eigendom zijn van deze plugin of als alias van de eigenaar zijn gedeclareerd. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                                            |
| `reason`                   | `string`   | Optioneel bericht dat wordt weergegeven wanneer de onderdrukte rij rechtstreeks wordt opgevraagd.             |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve hosts van de providerbasis-URL die vereist zijn voordat de onderdrukking wordt toegepast. |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte `api`-waarden uit de providerconfiguratie die vereist zijn voordat de onderdrukking wordt toegepast. |

Plaats geen gegevens die alleen tijdens runtime beschikbaar zijn in `modelCatalog`. Gebruik `static` alleen wanneer de manfestrijen volledig genoeg zijn om bij op provider gefilterde lijsten en keuzelijsten register-/runtime-detectie over te slaan. Gebruik `refreshable` wanneer manfestrijen bruikbare, weer te geven beginwaarden of aanvullingen zijn, maar een vernieuwing/cache later meer rijen kan toevoegen; vernieuwbare rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw de providerruntime moet laden om de lijst te kennen.

## Naslag voor modelIdNormalization

Gebruik `modelIdNormalization` voor eenvoudige, provider-eigen opschoning van model-id's die moet plaatsvinden voordat de providerruntime wordt geladen. Hierdoor blijven aliassen zoals korte modelnamen, oudere providerlokale id's en proxyvoorvoegselregels in het manifest van de eigenaarplugin in plaats van in de modelselectietabellen van de kern.

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

| Veld                                 | Type                    | Betekenis                                                                                |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte aliassen voor model-id's. Waarden worden ongewijzigd teruggegeven. |
| `stripPrefixes`                      | `string[]`              | Voorvoegsels die vóór het opzoeken van aliassen moeten worden verwijderd, nuttig voor oudere duplicatie van provider/model. |
| `prefixWhenBare`                     | `string`                | Voorvoegsel dat wordt toegevoegd wanneer de genormaliseerde model-id nog geen `/` bevat. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke regels voor voorvoegsels bij losse id's na het opzoeken van aliassen, met `modelPrefix` en `prefix` als sleutels. |

## Naslag voor providerEndpoints

Gebruik `providerEndpoints` voor eindpuntclassificatie die het algemene aanvraagbeleid moet kennen voordat de providerruntime wordt geladen. De kern blijft eigenaar van de betekenis van elke `endpointClass`; pluginmanifests zijn eigenaar van de host- en basis-URL-metagegevens.

Officieel geëxternaliseerde providerplugins worden uitgesloten van de kerndistributie, waardoor
hun manifests onzichtbaar zijn totdat ze zijn geïnstalleerd. Hun `providerEndpoints` moeten
ook worden gespiegeld in `scripts/lib/official-external-provider-catalog.json`, zodat
eindpuntclassificatie zonder de plugin blijft werken; een contracttest
dwingt deze spiegeling af.

Eindpuntvelden:

| Veld                           | Type       | Betekenis                                                                                             |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende kerneindpuntklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.                 |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de eindpuntklasse worden gekoppeld.                                          |
| `hostSuffixes`                 | `string[]` | Hostachtervoegsels die aan de eindpuntklasse worden gekoppeld. Begin met `.` om alleen domeinachtervoegsels te vergelijken. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de eindpuntklasse worden gekoppeld.                |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                              |
| `googleVertexRegionHostSuffix` | `string`   | Achtervoegsel dat van overeenkomende hosts wordt verwijderd om het Google Vertex-regiovoorvoegsel beschikbaar te maken. |

## Naslaginformatie voor providerRequest

Gebruik `providerRequest` voor goedkope metadata over aanvraagcompatibiliteit die generiek aanvraagbeleid nodig heeft zonder de providerruntime te laden. Houd gedragsspecifieke herschrijving van payloads in providerruntime-hooks of gedeelde helpers voor providerfamilies.

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

| Veld                  | Type         | Betekenis                                                                                       |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `family`              | `string`     | Label voor de providerfamilie dat wordt gebruikt voor generieke beslissingen over aanvraagcompatibiliteit en diagnostiek. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitscategorie voor providerfamilies voor gedeelde aanvraaghelpers.        |
| `openAICompletions`   | `object`     | Vlaggen voor OpenAI-compatibele voltooiingsaanvragen, momenteel `supportsStreamingUsage`.       |

## Naslaginformatie voor secretProviderIntegrations

Gebruik `secretProviderIntegrations` wanneer een plugin een herbruikbare vooraf ingestelde SecretRef-execprovider kan publiceren. OpenClaw leest deze metadata voordat de providerruntime wordt geladen, slaat het eigendom van de plugin op in `secrets.providers.<alias>.pluginIntegration` en laat de daadwerkelijke oplossing van geheimen over aan de SecretRef-runtime. Voorinstellingen worden alleen beschikbaar gemaakt voor meegeleverde plugins en geïnstalleerde plugins die zijn gevonden in de beheerde installatielocaties voor plugins, zoals installaties via git en ClawHub.

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

De sleutel van de toewijzing is de integratie-id. Als `providerAlias` wordt weggelaten, gebruikt OpenClaw de integratie-id als alias voor de SecretRef-provider. Provideraliassen moeten overeenkomen met het normale patroon voor SecretRef-provideraliassen, bijvoorbeeld `team-secrets` of `onepassword-work`.

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

Bij het opstarten of opnieuw laden lost OpenClaw die provider op door de huidige manifestmetadata van de plugin te laden, te controleren of de eigenaarplugin is geïnstalleerd en actief is, en de exec-opdracht uit het manifest samen te stellen. Als de plugin wordt uitgeschakeld of verwijderd, wordt de provider voor actieve SecretRefs ingetrokken. Beheerders die een zelfstandige exec-configuratie willen, kunnen nog steeds rechtstreeks handmatige providers met `command`/`args` configureren.

Momenteel worden alleen voorinstellingen met `source: "exec"` ondersteund. `command` moet `${node}` zijn en `args[0]` moet een resolverscript zijn dat met `./` relatief ten opzichte van de pluginhoofdmap is opgegeven. OpenClaw zet dit bij het opstarten of opnieuw laden om naar het huidige uitvoerbare Node-bestand en het absolute pad van het script binnen de plugin. Node-opties zoals `--require`, `--import`, `--loader`, `--env-file`, `--eval` en `--print` maken geen deel uit van het manifestcontract voor voorinstellingen. Beheerders die niet-Node-opdrachten nodig hebben, kunnen rechtstreeks zelfstandige handmatige execproviders configureren.

OpenClaw leidt `trustedDirs` voor manifestvoorinstellingen af van de pluginhoofdmap en, voor `${node}`-voorinstellingen, de map van het huidige uitvoerbare Node-bestand. In het manifest opgegeven `trustedDirs` worden genegeerd. Andere opties voor execproviders, zoals `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` en `allowInsecurePath`, worden doorgegeven aan de normale configuratie van de SecretRef-execprovider.

## Naslaginformatie voor modelPricing

Gebruik `modelPricing` wanneer een provider prijsbepalingsgedrag op het besturingsvlak nodig heeft voordat de runtime wordt geladen. De Gateway-cache voor prijzen leest deze metadata zonder providerruntimecode te importeren.

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

| Veld         | Type              | Betekenis                                                                                         |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelfgehoste providers die nooit prijsinformatie van OpenRouter of LiteLLM mogen ophalen. |
| `openRouter` | `false \| object` | Toewijzing voor het opzoeken van OpenRouter-prijzen. `false` schakelt het opzoeken via OpenRouter voor deze provider uit. |
| `liteLLM`    | `false \| object` | Toewijzing voor het opzoeken van LiteLLM-prijzen. `false` schakelt het opzoeken via LiteLLM voor deze provider uit. |

Bronvelden:

| Veld                       | Type               | Betekenis                                                                                                             |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Provider-id in de externe catalogus wanneer deze afwijkt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met schuine strepen als geneste provider-/modelverwijzingen, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra model-id-varianten voor de externe catalogus. `version-dots` probeert versie-id's met punten, zoals `claude-opus-4.6`. |

### OpenClaw-providerindex

De OpenClaw-providerindex is door OpenClaw beheerde voorbeeldmetadata voor providers waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Deze maakt geen deel uit van een pluginmanifest. Pluginmanifesten blijven de autoriteit voor geïnstalleerde plugins. De providerindex is het interne terugvalcontract dat toekomstige interfaces voor installeerbare providers en modelkeuze vóór installatie zullen gebruiken wanneer een providerplugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. `modelCatalog` van het geïnstalleerde pluginmanifest.
3. Modelcataloguscache van een expliciete vernieuwing.
4. Voorbeeldrijen uit de OpenClaw-providerindex.

De providerindex mag geen geheimen, ingeschakelde status, runtime-hooks of live accountspecifieke modelgegevens bevatten. De voorbeeldcatalogi gebruiken dezelfde vorm voor de `modelCatalog`-providerrij als pluginmanifesten, maar moeten beperkt blijven tot stabiele weergavemetadata, tenzij runtimeadaptervelden zoals `api`, `baseUrl`, prijzen of compatibiliteitsvlaggen bewust synchroon worden gehouden met het geïnstalleerde pluginmanifest. Providers met live ontdekking via `/models` moeten vernieuwde rijen via het expliciete cachepad voor de modelcatalogus schrijven, in plaats van providerap API's aan te roepen tijdens normale weergave of onboarding.

Vermeldingen in de providerindex kunnen ook metadata voor installeerbare plugins bevatten voor providers waarvan de plugin uit de kern is verplaatst of om een andere reden nog niet is geïnstalleerd. Deze metadata weerspiegelt het patroon van de kanaalcatalogus: pakketnaam, npm-installatiespecificatie, verwachte integriteit en eenvoudige labels voor authenticatiekeuzes zijn voldoende om een installeerbare configuratieoptie te tonen. Zodra de plugin is geïnstalleerd, heeft het manifest voorrang en wordt de vermelding in de providerindex voor die provider genegeerd.

`openclaw doctor --fix` migreert een kleine, gesloten verzameling verouderde manifestcapaciteitssleutels op het hoogste niveau naar `contracts.*`: `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` en `tools`. Geen van deze sleutels, en ook geen enkele andere capaciteitenlijst, wordt nog als manifestveld op het hoogste niveau gelezen; bij normaal laden van manifesten worden ze alleen onder `contracts` herkend.

## Manifest tegenover package.json

De twee bestanden hebben verschillende functies:

| Bestand                | Gebruik het voor                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configuratievalidatie, metadata voor authenticatiekeuzes en UI-aanwijzingen die beschikbaar moeten zijn voordat plugincode wordt uitgevoerd |
| `package.json`         | npm-metadata, installatie van afhankelijkheden en het `openclaw`-blok voor toegangspunten, installatievoorwaarden, configuratie of catalogusmetadata |

Als u niet zeker weet waar een bepaald onderdeel van de metadata thuishoort, gebruikt u deze regel:

- als OpenClaw dit moet weten voordat plugincode wordt geladen, plaatst u het in `openclaw.plugin.json`
- als het gaat om verpakking, toegangsbestanden of npm-installatiegedrag, plaatst u het in `package.json`

### package.json-velden die de detectie beïnvloeden

Bepaalde pluginmetadata voor vóór de runtime staat bewust in `package.json` onder het `openclaw`-blok in plaats van in `openclaw.plugin.json`. `openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw-plugincontracten; systeemeigen plugins moeten `openclaw.plugin.json` gebruiken in combinatie met de hieronder ondersteunde `package.json#openclaw`-velden.

Belangrijke voorbeelden:

| Veld                                                                                       | Betekenis                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declareert systeemeigen Plugin-toegangspunten. Moet binnen de pakketmap van de Plugin blijven.                                                                                                |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-toegangspunten voor geïnstalleerde pakketten. Moet binnen de pakketmap van de Plugin blijven.                                                          |
| `openclaw.setupEntry`                                                                      | Lichtgewicht toegangspunt uitsluitend voor configuratie, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen-kanaalstatus/SecretRef-detectie. Moet binnen de pakketmap van de Plugin blijven. |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-configuratietoegangspunt voor geïnstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de pakketmap van de Plugin blijven.                |
| `openclaw.channel`                                                                         | Eenvoudige metadata voor de kanaalcatalogus, zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                       |
| `openclaw.channel.commands`                                                                | Statische metadata voor systeemeigen opdrachten en automatische standaardinstellingen van systeemeigen Skills, gebruikt door configuratie-, audit- en opdrachtenchermoppervlakken voordat de kanaalruntime wordt geladen. |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht metadata voor controle van de geconfigureerde status, die zonder de volledige kanaalruntime te laden kan antwoorden op: "bestaat er al een configuratie die uitsluitend omgevingsvariabelen gebruikt?" |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht metadata voor controle van opgeslagen authenticatie, die zonder de volledige kanaalruntime te laden kan antwoorden op: "is er al ergens aangemeld?"                             |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updateaanwijzingen voor meegeleverde en extern gepubliceerde plugins.                                                                                                            |
| `openclaw.install.defaultChoice`                                                           | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                                 |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                              |
| `openclaw.compat.pluginApi`                                                                | Minimaal door dit pakket vereist bereik van de OpenClaw-Plugin-API, met een semver-ondergrens zoals `>=2026.5.27`.                                                                            |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm-dist-integriteitstekenreeks, zoals `sha512-...`; installatie- en updatestromen verifiëren het opgehaalde artefact hiertegen.                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een beperkt herstelpad via herinstallatie van een meegeleverde Plugin toe wanneer de configuratie ongeldig is.                                                                          |
| `openclaw.install.requiredPlatformPackages`                                                | npm-pakketaliassen die aanwezig moeten worden wanneer hun platformbeperkingen in het lockbestand overeenkomen met de huidige host.                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat kanaaloppervlakken van de configuratieruntime vóór het luisteren laden en stelt vervolgens de volledige geconfigureerde kanaal-Plugin uit tot activering na het starten met luisteren.    |

Manifestmetadata bepaalt welke provider-, kanaal- en configuratiekeuzes tijdens onboarding verschijnen voordat de runtime wordt geladen. `package.json#openclaw.install` vertelt onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die keuzes selecteert. Verplaats installatieaanwijzingen niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt tijdens installatie en het laden van het manifestregister afgedwongen voor niet-meegeleverde Plugin-bronnen. Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden zorgen ervoor dat externe plugins op oudere hosts worden overgeslagen. Meegeleverde bronplugins worden geacht dezelfde versie te hebben als de host-checkout.

`openclaw.install.requiredPlatformPackages` is bedoeld voor npm-pakketten die vereiste systeemeigen binaire bestanden aanbieden via optionele, platformspecifieke aliassen. Vermeld voor elke ondersteunde platformalias de kale npm-pakketnaam. Tijdens npm-installatie verifieert OpenClaw uitsluitend de gedeclareerde alias waarvan de beperkingen in het lockbestand overeenkomen met de huidige host. Als npm succes meldt maar die alias weglaat, probeert OpenClaw het eenmaal opnieuw met een nieuwe cache en draait het de installatie terug als de alias nog steeds ontbreekt.

`openclaw.compat.pluginApi` wordt tijdens pakketinstallatie afgedwongen voor niet-meegeleverde Plugin-bronnen. Gebruik dit voor de ondergrens van de OpenClaw-Plugin-SDK/runtime-API waartegen het pakket is gebouwd. Deze kan strenger zijn dan `minHostVersion` wanneer een Plugin-pakket een nieuwere API nodig heeft, maar voor andere stromen toch een lagere installatieaanwijzing behoudt. De officiële synchronisatie van OpenClaw-releases verhoogt bestaande officiële ondergrenzen voor Plugin-API's standaard naar de OpenClaw-releaseversie, maar releases die uitsluitend een Plugin betreffen, kunnen een lagere ondergrens behouden wanneer het pakket bewust oudere hosts ondersteunt. Gebruik niet uitsluitend de pakketversie als compatibiliteitscontract. `peerDependencies.openclaw` blijft npm-pakketmetadata; OpenClaw gebruikt het contract `openclaw.compat.pluginApi` voor beslissingen over installatiecompatibiliteit.

Officiële metadata voor installatie op aanvraag moet `clawhubSpec` gebruiken wanneer de Plugin op ClawHub is gepubliceerd; onboarding behandelt dit als de externe voorkeursbron en registreert na installatie de feiten over het ClawHub-artefact. `npmSpec` blijft de compatibiliteitsterugval voor pakketten die nog niet naar ClawHub zijn verplaatst.

Exacte vastzetting van npm-versies staat al in `npmSpec`, bijvoorbeeld `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiële externe catalogusvermeldingen moeten exacte specificaties combineren met `expectedIntegrity`, zodat updatestromen veilig mislukken als het opgehaalde npm-artefact niet langer overeenkomt met de vastgezette release. Interactieve onboarding biedt voor compatibiliteit nog steeds vertrouwde npm-specificaties uit registers aan, waaronder kale pakketnamen en dist-tags. Catalogusdiagnostiek kan onderscheid maken tussen exacte, variabele, met integriteit vastgezette, zonder integriteit, niet-overeenkomende pakketnaam en ongeldige standaardkeuzebronnen. De diagnostiek waarschuwt ook wanneer `expectedIntegrity` aanwezig is, maar er geen geldige npm-bron is die ermee kan worden vastgezet. Wanneer `expectedIntegrity` aanwezig is, dwingen installatie- en updatestromen dit af; wanneer het ontbreekt, wordt de registerresolutie zonder integriteitsvastzetting geregistreerd.

Kanaalplugins moeten `openclaw.setupEntry` opgeven wanneer status-, kanaallijst- of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige runtime te laden. Het configuratietoegangspunt moet kanaalmetadata plus configuratieveilige adapters voor configuratie, status en geheimen beschikbaar stellen; houd netwerkclients, Gateway-listeners en transportruntimes in het hoofdtoegangspunt van de extensie.

Velden voor runtime-toegangspunten omzeilen de controles van pakketgrenzen voor velden met brontoegangspunten niet. `openclaw.runtimeExtensions` kan bijvoorbeeld een pad in `openclaw.extensions` dat buiten het pakket treedt niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust beperkt. Het maakt niet elke willekeurige defecte configuratie installeerbaar. Momenteel staat het installatiestromen alleen toe om te herstellen van specifieke verouderde upgradefouten van meegeleverde plugins, zoals een ontbrekend pad naar een meegeleverde Plugin of een verouderde vermelding `channels.<id>` voor diezelfde meegeleverde Plugin. Niet-gerelateerde configuratiefouten blokkeren de installatie nog steeds en verwijzen beheerders naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine controlemodule:

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

Gebruik dit wanneer configuratie-, doctor-, status- of alleen-lezen-aanwezigheidsstromen een eenvoudige ja/nee-controle van authenticatie nodig hebben voordat de volledige kanaal-Plugin wordt geladen. Opgeslagen authenticatiestatus is niet hetzelfde als geconfigureerde kanaalstatus: gebruik deze metadata niet om plugins automatisch in te schakelen, runtime-afhankelijkheden te herstellen of te bepalen of een kanaalruntime moet worden geladen. De doelexport moet een kleine functie zijn die uitsluitend opgeslagen status leest; leid deze niet via het volledige runtime-barrelbestand van het kanaal.

`openclaw.channel.configuredState` gebruikt dezelfde vorm voor eenvoudige controles van een uitsluitend via omgevingsvariabelen geconfigureerde status:

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

Gebruik dit wanneer een kanaal de geconfigureerde status kan bepalen op basis van omgevingsvariabelen of andere kleine invoer die geen runtime vereist. Als de controle volledige configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan in de hook `config.hasConfiguredState` van de Plugin.

## Detectieprioriteit (dubbele Plugin-id's)

OpenClaw detecteert plugins vanuit drie hoofdmappen, gecontroleerd in deze volgorde: met OpenClaw meegeleverde plugins, de algemene installatiemap (`~/.openclaw/extensions`) en de huidige werkruimtemap (`<workspace>/.openclaw/extensions`), aangevuld met eventuele expliciete vermeldingen in `plugins.load.paths`.

Als twee gedetecteerde plugins dezelfde `id` hebben, wordt alleen het manifest met de **hoogste prioriteit** behouden; duplicaten met een lagere prioriteit worden verwijderd in plaats van ernaast geladen. Prioriteit, van hoog naar laag:

1. **Via configuratie geselecteerd** — een pad dat expliciet is vastgezet in `plugins.entries.<id>`
2. **Algemene installatie die overeenkomt met een bijgehouden installatierecord** — een Plugin die is geïnstalleerd via `openclaw plugin install`/`openclaw plugin update` en die door de installatieregistratie van OpenClaw voor dezelfde id wordt herkend, zelfs wanneer de id ook bij een meegeleverde Plugin hoort
3. **Meegeleverd** — plugins die met OpenClaw worden geleverd
4. **Werkruimte** — plugins die relatief ten opzichte van de huidige werkruimte zijn gedetecteerd
5. Elke andere gedetecteerde kandidaat

Gevolgen:

- Een gevorkte of verouderde kopie van een meegeleverde Plugin die zonder registratie in de werkruimte of algemene hoofdmap staat, overschaduwt de meegeleverde build niet.
- Om een meegeleverde Plugin te overschrijven, voert u `openclaw plugin install` uit voor die id, zodat de bijgehouden algemene installatie een hogere prioriteit krijgt dan de meegeleverde kopie, of zet u een specifiek pad vast via `plugins.entries.<id>`, zodat dit wint op basis van de prioriteit voor selectie via configuratie.
- Verwijderde duplicaten worden vastgelegd in logboeken, zodat Doctor en opstartdiagnostiek naar de genegeerde kopie kunnen verwijzen.
- Via configuratie geselecteerde overschrijvingen van duplicaten worden in de diagnostiek beschreven als expliciete overschrijvingen, maar genereren nog steeds een waarschuwing, zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## Vereisten voor JSON Schema

- **Elke plugin moet een JSON Schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is toegestaan (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd wanneer de configuratie wordt gelezen of geschreven, niet tijdens runtime.
- Wanneer je een gebundelde plugin uitbreidt of forkt met nieuwe configuratiesleutels, moet je tegelijkertijd de `configSchema` in `openclaw.plugin.json` van die plugin bijwerken. Schema's van gebundelde plugins zijn strikt. Als je dus `plugins.entries.<id>.config.myNewKey` aan de gebruikersconfiguratie toevoegt zonder `myNewKey` aan `configSchema.properties` toe te voegen, wordt de configuratie afgewezen voordat de runtime van de plugin wordt geladen.

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

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id in een pluginmanifest is gedeclareerd. Als dezelfde id ook voorkomt in `plugins.allow`, `plugins.entries` of `plugins.installs` (een plugin waarnaar wordt verwezen, maar die momenteel niet kan worden gevonden), verlaagt OpenClaw dit in plaats daarvan tot een **waarschuwing**.
- Verwijzingen naar onbekende plugin-id's in `plugins.entries.<id>`, `plugins.allow` en `plugins.deny` zijn **waarschuwingen** ("verouderde configuratievermelding genegeerd"), geen fouten, zodat upgrades en verwijderde of hernoemde plugins het opstarten van de Gateway niet blokkeren.
- Een verwijzing naar een onbekende plugin-id in `plugins.slots.memory` is een **fout**, behalve voor de bekende officiële externe plugin `memory-lancedb`, waarvoor in plaats daarvan een waarschuwing wordt gegeven.
- Als een plugin is geïnstalleerd, maar een defect of ontbrekend manifest of schema heeft, mislukt de validatie en rapporteert Doctor de pluginfout.
- Als er pluginconfiguratie bestaat, maar de plugin **uitgeschakeld** is, blijft de configuratie behouden en wordt er een **waarschuwing** weergegeven in Doctor en de logboeken.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief plugins die vanuit het lokale bestandssysteem worden geladen. De runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest dient alleen voor detectie en validatie.
- Native manifesten worden met JSON5 geparseerd, waardoor opmerkingen, afsluitende komma's en sleutels zonder aanhalingstekens zijn toegestaan, zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden door de manifestlader gelezen. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin deze niet nodig heeft.
- `providerCatalogEntry` moet lichtgewicht blijven en mag geen omvangrijke runtimecode importeren; gebruik dit voor statische metagegevens van de providercatalogus of beperkte detectiedescriptors, niet voor uitvoering tijdens aanvragen.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory` (standaard `memory-core`) en `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. `OpenClawPluginDefinition.kind` van het runtime-ingangspunt is verouderd en blijft alleen bestaan als compatibiliteitsterugval voor oudere plugins.
- Metagegevens voor omgevingsvariabelen (`setup.providers[].envVars`, het verouderde `providerAuthEnvVars` en `channelEnvVars`) zijn uitsluitend declaratief. Status, controle, validatie van Cron-bezorging en andere alleen-lezen oppervlakken passen nog steeds het pluginvertrouwen en het effectieve activeringsbeleid toe voordat een omgevingsvariabele als geconfigureerd wordt beschouwd.
- Zie [Runtimehooks voor providers](/nl/plugins/architecture-internals#provider-runtime-hooks) voor runtime-metagegevens van de wizard waarvoor providercode nodig is.
- Als je plugin afhankelijk is van native modules, documenteer dan de bouwstappen en eventuele vereisten voor de toelatingslijst van de pakketbeheerder (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Pluginarchitectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitenmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Naslaginformatie voor de Plugin SDK en imports van subpaden.
  </Card>
</CardGroup>
