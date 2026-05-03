---
read_when:
    - Je bouwt een OpenClaw-Plugin
    - Je moet een Plugin-configuratieschema leveren of Plugin-validatiefouten opsporen
summary: Pluginmanifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Plugin-manifest
x-i18n:
    generated_at: "2026-05-03T21:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **native OpenClaw Plugin-manifest**.

Zie [Plugin-bundels](/nl/plugins/bundles) voor compatibele bundelindelingen.

Compatibele bundelformaten gebruiken andere manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json` of de standaard Claude-componentindeling
  zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert die bundelindelingen ook automatisch, maar ze worden niet gevalideerd
tegen het hier beschreven `openclaw.plugin.json`-schema.

Voor compatibele bundels leest OpenClaw momenteel bundelmetadata plus gedeclareerde
skillroots, Claude-commandoroots, standaardwaarden uit Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hookpakketten wanneer de indeling overeenkomt
met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw Plugin **moet** een `openclaw.plugin.json`-bestand meeleveren in de
**pluginroot**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder plugincode uit te voeren**. Ontbrekende of ongeldige manifests worden behandeld als
pluginfouten en blokkeren configuratievalidatie.

Zie de volledige handleiding voor het pluginsysteem: [Plugins](/nl/tools/plugin).
Voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit:
[Capaciteitsmodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
plugincode laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
pluginruntime te starten.

**Gebruik het voor:**

- pluginidentiteit, configuratievalidatie en hints voor de configuratie-UI
- metadata voor auth, onboarding en installatie (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activatiehints voor control-plane-oppervlakken
- eigenaarschap van verkorte modelfamilies
- statische snapshots van capaciteitseigenaarschap (`contracts`)
- metadata voor de QA-runner die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die wordt samengevoegd in catalogus- en validatieoppervlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints
of npm-installatiemetadata. Die horen thuis in je plugincode en `package.json`.

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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

## Referentie van top-level velden

| Veld                                 | Vereist | Type                             | Betekenis                                                                                                                                                                                                                          |
| ------------------------------------ | ------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                    |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de config van deze Plugin.                                                                                                                                                                                 |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een niet-`true` waarde in, om de Plugin standaard uitgeschakeld te laten.                                                                         |
| `enabledByDefaultOnPlatforms`        | Nee     | `string[]`                       | Markeert een gebundelde Plugin alleen als standaard ingeschakeld op de vermelde Node.js-platformen, bijvoorbeeld `["darwin"]`. Expliciete config heeft nog steeds voorrang.                                                        |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde id's die worden genormaliseerd naar deze canonieke Plugin-id.                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer auth, config of model refs ze vermelden.                                                                                                                      |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                  |
| `channels`                           | Nee     | `string[]`                       | Kanaal-id's die eigendom zijn van deze Plugin. Gebruikt voor ontdekking en configvalidatie.                                                                                                                                        |
| `providers`                          | Nee     | `string[]`                       | Provider-id's die eigendom zijn van deze Plugin.                                                                                                                                                                                   |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht modulepad voor providerontdekking, relatief ten opzichte van de Plugin-root, voor provider-catalogusmetadata binnen het manifestbereik die kan worden geladen zonder de volledige Plugin-runtime te activeren.        |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte metadata voor modelfamilies, gebruikt om de Plugin automatisch vóór runtime te laden.                                                                                                          |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-plane-contract voor toekomstige alleen-lezen-vermeldingen, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd beleid voor externe prijsopzoeking. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te houden of provider refs te koppelen aan OpenRouter/LiteLLM-catalogus-id's zonder provider-id's hard te coderen in core. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde alias-/prefixopschoning voor model-id's die moet worden uitgevoerd voordat de provider-runtime wordt geladen.                                                                                            |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde endpoint host/baseUrl-metadata voor providerroutes die core moet classificeren voordat de provider-runtime wordt geladen.                                                                                |
| `providerRequest`                    | Nee     | `object`                         | Goedkope providerfamilie- en request-compatibiliteitsmetadata die door generiek requestbeleid wordt gebruikt voordat de provider-runtime wordt geladen.                                                                             |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inferentiebackend-id's die eigendom zijn van deze Plugin. Gebruikt voor automatische activering bij opstarten vanuit expliciete config refs.                                                                                   |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backend refs waarvan de door de Plugin beheerde synthetische auth-hook moet worden gepeild tijdens koude modelontdekking voordat runtime wordt geladen.                                                           |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Placeholderwaarden voor API-sleutels die eigendom zijn van gebundelde Plugins en niet-geheime lokale, OAuth- of omgevingscredentialstatus vertegenwoordigen.                                                                       |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en Plugin-bewuste config- en CLI-diagnostiek moeten produceren voordat runtime wordt geladen.                                                                                      |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor auth-/statusopzoeking van providers. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de deprecatieperiode.                     |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-id's die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codingprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                  |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor door env aangestuurde kanaalsetup of auth-oppervlakken die generieke opstart-/confighelpers moeten zien.                   |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboardingkiezers, resolutie van voorkeursproviders en eenvoudige bedrading van CLI-flags.                                                                                                        |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activeringsplanner voor laden dat wordt getriggerd door opstarten, provider, command, kanaal, route en capability. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.     |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingbeschrijvingen die ontdekkings- en setup-oppervlakken kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                              |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerbeschrijvingen die door de gedeelde `openclaw qa`-host worden gebruikt voordat de Plugin-runtime wordt geladen.                                                                                                  |
| `contracts`                          | Nee     | `object`                         | Statische momentopname van capability-eigenaarschap voor externe auth-hooks, spraak, realtime transcriptie, realtime stem, mediabegrip, image-generation, music-generation, video-generation, web-fetch, web search en tool-eigenaarschap. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                     |
| `imageGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor image-generation voor provider-id's die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-bewaking.                              |
| `videoGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor video-generation voor provider-id's die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-bewaking.                              |
| `musicGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor music-generation voor provider-id's die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief door de provider beheerde auth-aliassen en base-url-bewaking.                              |
| `toolMetadata`                       | Nee     | `Record<string, object>`         | Goedkope beschikbaarheidsmetadata voor tools die eigendom zijn van Plugins en zijn gedeclareerd in `contracts.tools`. Gebruik dit wanneer een tool runtime niet moet laden tenzij er bewijs voor config, env of auth bestaat.       |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Door het manifest beheerde kanaalconfigmetadata die wordt samengevoegd in ontdekkings- en validatie-oppervlakken voordat runtime wordt geladen.                                                                                     |
| `skills`                             | Nee     | `string[]`                       | Skill-mappen om te laden, relatief ten opzichte van de Plugin-root.                                                                                                                                                                |
| `name`                               | Nee      | `string`                         | Voor mensen leesbare pluginnaam.                                                                                                                                                                                                    |
| `description`                        | Nee      | `string`                         | Korte samenvatting die in pluginoppervlakken wordt weergegeven.                                                                                                                                                                      |
| `version`                            | Nee      | `string`                         | Informatieve pluginversie.                                                                                                                                                                                                          |
| `uiHints`                            | Nee      | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidsaanwijzingen voor configuratievelden.                                                                                                                                                        |

## Referentie voor metadata van generatieproviders

De metadatavelden voor generatieproviders beschrijven statische authenticatiesignalen voor
providers die zijn gedeclareerd in de bijbehorende lijst `contracts.*GenerationProviders`.
OpenClaw leest deze velden voordat de providerruntime wordt geladen, zodat kerntools kunnen
bepalen of een generatieprovider beschikbaar is zonder elke
provider-Plugin te importeren.

Gebruik deze velden alleen voor goedkope, declaratieve feiten. Transport, aanvraag-
transformaties, tokenvernieuwing, validatie van inloggegevens en daadwerkelijk generatiegedrag
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

| Veld            | Vereist | Type       | Wat het betekent                                                                                                                                        |
| --------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nee     | `string[]` | Aanvullende provider-id's die moeten meetellen als statische authenticatie-aliassen voor de generatieprovider.                                           |
| `authProviders` | Nee     | `string[]` | Provider-id's waarvan de geconfigureerde authenticatieprofielen moeten meetellen als authenticatie voor deze generatieprovider.                          |
| `configSignals` | Nee     | `object[]` | Goedkope, alleen op configuratie gebaseerde beschikbaarheidssignalen voor lokale of zelfgehoste providers die zonder authenticatieprofielen of env-vars kunnen worden geconfigureerd. |
| `authSignals`   | Nee     | `object[]` | Expliciete authenticatiesignalen. Indien aanwezig vervangen deze de standaardset signalen van de provider-id, `aliases` en `authProviders`.              |

Elke `configSignals`-entry ondersteunt:

| Veld          | Vereist | Type       | Wat het betekent                                                                                                                                                                             |
| ------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja      | `string`   | Puntpad naar het Plugin-eigen configuratieobject dat moet worden gecontroleerd, bijvoorbeeld `plugins.entries.example.config`.                                                               |
| `overlayPath` | Nee     | `string`   | Puntpad binnen de rootconfiguratie waarvan het object over het rootobject moet worden gelegd voordat het signaal wordt geëvalueerd. Gebruik dit voor capabilitiespecifieke configuratie zoals `image`, `video` of `music`. |
| `required`    | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie die geconfigureerde waarden moeten hebben. Strings mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                                |
| `requiredAny` | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                                 |
| `mode`        | Nee     | `object`   | Optionele stringmodus-guard binnen de effectieve configuratie. Gebruik dit wanneer beschikbaarheid op basis van alleen configuratie slechts voor één modus geldt.                             |

Elke `mode`-guard ondersteunt:

| Veld         | Vereist | Type       | Wat het betekent                                                                 |
| ------------ | ------- | ---------- | --------------------------------------------------------------------------------- |
| `path`       | Nee     | `string`   | Puntpad binnen de effectieve configuratie. Standaard `mode`.                      |
| `default`    | Nee     | `string`   | Moduswaarde die moet worden gebruikt wanneer de configuratie het pad weglaat.      |
| `allowed`    | Nee     | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is. |
| `disallowed` | Nee     | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is. |

Elke `authSignals`-entry ondersteunt:

| Veld              | Vereist | Type     | Wat het betekent                                                                                                                                                          |
| ----------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string` | Provider-id om te controleren in geconfigureerde authenticatieprofielen.                                                                                                  |
| `providerBaseUrl` | Nee     | `object` | Optionele guard waardoor het signaal alleen meetelt wanneer de geconfigureerde provider waarnaar wordt verwezen een toegestane basis-URL gebruikt. Gebruik dit wanneer een authenticatie-alias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-guard ondersteunt:

| Veld              | Vereist | Type       | Wat het betekent                                                                                                                                          |
| ----------------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string`   | Providerconfiguratie-id waarvan `baseUrl` moet worden gecontroleerd.                                                                                      |
| `defaultBaseUrl`  | Nee     | `string`   | Basis-URL om aan te nemen wanneer de providerconfiguratie `baseUrl` weglaat.                                                                              |
| `allowedBaseUrls` | Ja      | `string[]` | Toegestane basis-URL's voor dit authenticatiesignaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaard basis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Referentie voor toolmetadata

`toolMetadata` gebruikt dezelfde vormen voor `configSignals` en `authSignals` als
metadata van generatieproviders, met de toolnaam als sleutel. `contracts.tools` declareert
eigenaarschap. `toolMetadata` declareert goedkoop beschikbaarheidsbewijs zodat OpenClaw kan
vermijden een Plugin-runtime te importeren alleen om de toolfactory `null` te laten retourneren.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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
laadt het de eigenaar-Plugin wanneer het toolcontract met het beleid overeenkomt. Voor hot-path
tools waarvan de factory afhankelijk is van authenticatie/configuratie, moeten Plugin-auteurs
`toolMetadata` declareren in plaats van core runtime te laten importeren om dit te vragen.

## Referentie voor providerAuthChoices

Elke `providerAuthChoices`-entry beschrijft één onboarding- of authenticatiekeuze.
OpenClaw leest dit voordat de providerruntime wordt geladen.
Providerinstallatielijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide installatiekeuzes
en install-catalog-metadata zonder de providerruntime te laden.

| Veld                  | Vereist | Type                                            | Wat het betekent                                                                                                    |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                             |
| `method`              | Ja      | `string`                                        | Authenticatiemethode-id waarnaar moet worden gedispatcht.                                                           |
| `choiceId`            | Ja      | `string`                                        | Stabiele authenticatiekeuze-id die wordt gebruikt door onboarding- en CLI-flows.                                     |
| `choiceLabel`         | Nee     | `string`                                        | Gebruikersgerichte label. Indien weggelaten valt OpenClaw terug op `choiceId`.                                      |
| `choiceHint`          | Nee     | `string`                                        | Korte hulptekst voor de kiezer.                                                                                     |
| `assistantPriority`   | Nee     | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistant aangestuurde interactieve kiezers.                     |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistant-kiezers, terwijl handmatige CLI-selectie toegestaan blijft.                         |
| `deprecatedChoiceIds` | Nee     | `string[]`                                      | Verouderde keuze-id's die gebruikers moeten omleiden naar deze vervangende keuze.                                   |
| `groupId`             | Nee     | `string`                                        | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                                     |
| `groupLabel`          | Nee     | `string`                                        | Gebruikersgericht label voor die groep.                                                                             |
| `groupHint`           | Nee     | `string`                                        | Korte hulptekst voor de groep.                                                                                      |
| `optionKey`           | Nee     | `string`                                        | Interne optiesleutel voor eenvoudige authenticatieflows met één vlag.                                               |
| `cliFlag`             | Nee     | `string`                                        | Naam van CLI-vlag, zoals `--openrouter-api-key`.                                                                    |
| `cliOption`           | Nee     | `string`                                        | Volledige CLI-optievorm, zoals `--openrouter-api-key <key>`.                                                        |
| `cliDescription`      | Nee     | `string`                                        | Beschrijving die wordt gebruikt in CLI-help.                                                                        |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation">` | In welke onboardingsurfaces deze keuze moet verschijnen. Indien weggelaten is de standaard `["text-inference"]`.    |

## Referentie voor commandAliases

Use `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers
per ongeluk in `plugins.allow` kunnen zetten of als root-CLI-opdracht proberen uit te voeren. OpenClaw
gebruikt deze metadata voor diagnostiek zonder plugin-runtimecode te importeren.

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

| Veld         | Vereist | Type              | Wat het betekent                                                        |
| ------------ | ------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Opdrachtnaam die bij deze plugin hoort.                                 |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als een chat-slashopdracht in plaats van een root-CLI-opdracht. |
| `cliCommand` | Nee     | `string`          | Gerelateerde root-CLI-opdracht om voor te stellen voor CLI-bewerkingen, als die bestaat. |

## activation-referentie

Gebruik `activation` wanneer de plugin goedkoop kan declareren welke control-plane-gebeurtenissen
deze moeten opnemen in een activation/load-plan.

Dit blok is planner-metadata, geen lifecycle-API. Het registreert geen
runtimegedrag, vervangt `register(...)` niet, en belooft niet dat
plugincode al is uitgevoerd. De activation-planner gebruikt deze velden om
kandidaatplugins te beperken voordat wordt teruggevallen op bestaande manifest-eigendomsmetadata
zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigendom al beschrijft. Gebruik
`providers`, `channels`, `commandAliases`, setup-descriptors of `contracts`
wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra planner-hints
die niet door die eigendomsvelden kunnen worden weergegeven.
Gebruik `cliBackends` op topniveau voor CLI-runtimealiassen zoals `claude-cli`,
`codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor
ingebedde agent-harness-id's die nog geen eigendomsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag, en het vervangt
`register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet.
Huidige consumenten gebruiken het als een beperkende hint vóór breder plugin laden, dus
ontbrekende non-startup activation-metadata kost meestal alleen prestaties; het
zou de correctheid niet moeten veranderen zolang manifest-eigendomsfallbacks nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen. Zet dit op `true`
alleen wanneer de plugin tijdens Gateway-startup moet draaien. Zet dit op `false` wanneer
de plugin inert is bij startup en alleen vanuit smallere triggers moet laden.
Het weglaten van `onStartup` laadt de plugin niet langer impliciet bij startup; gebruik expliciete
activation-metadata voor startup-, kanaal-, config-, agent-harness-, memory- of
andere smallere activation-triggers.

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

| Veld               | Vereist | Type                                                 | Wat het betekent                                                                                                                                                                             |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-startupactivation. Elke plugin moet dit instellen. `true` importeert de plugin tijdens startup; `false` houdt deze startup-lazy tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze plugin moeten opnemen in activation/load-plannen.                                                                                                                     |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingebedde agent-harness-runtime-id's die deze plugin moeten opnemen in activation/load-plannen. Gebruik `cliBackends` op topniveau voor CLI-backendaliassen.                                |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's die deze plugin moeten opnemen in activation/load-plannen.                                                                                                                     |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's die deze plugin moeten opnemen in activation/load-plannen.                                                                                                                       |
| `onRoutes`         | Nee     | `string[]`                                           | Route-soorten die deze plugin moeten opnemen in activation/load-plannen.                                                                                                                     |
| `onConfigPaths`    | Nee     | `string[]`                                           | Configpaden relatief aan de root die deze plugin moeten opnemen in startup/load-plannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                     |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capability-hints die worden gebruikt door control-plane activation-planning. Geef waar mogelijk de voorkeur aan smallere velden.                                                       |

Huidige live-consumenten:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startup-
  import
- door opdrachten getriggerde CLI-planning valt terug op legacy
  `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-startupplanning gebruikt `activation.onAgentHarnesses` voor
  ingebedde harnesses en `cliBackends[]` op topniveau voor CLI-runtimealiassen
- door kanalen getriggerde setup-/kanaalplanning valt terug op legacy `channels[]`-
  eigendom wanneer expliciete channel-activation-metadata ontbreekt
- startup-pluginplanning gebruikt `activation.onConfigPaths` voor niet-kanaal-root-
  configoppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy
  `providers[]` en `cliBackends[]`-eigendom op topniveau wanneer expliciete provider-
  activation-metadata ontbreekt

Planner-diagnostiek kan expliciete activation-hints onderscheiden van manifest-
eigendomsfallback. Bijvoorbeeld, `activation-command-hint` betekent dat
`activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de
planner in plaats daarvan `commandAliases`-eigendom gebruikte. Deze redenlabels zijn voor
hostdiagnostiek en tests; pluginauteurs moeten de metadata blijven declareren
die eigendom het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners bijdraagt onder
de gedeelde `openclaw qa`-root. Houd deze metadata goedkoop en statisch; de plugin-
runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een licht
`runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

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

| Veld          | Vereist | Type     | Wat het betekent                                                   |
| ------------- | ------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja      | `string` | Subopdracht gemonteerd onder `openclaw qa`, bijvoorbeeld `matrix`. |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stub-opdracht nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboardingoppervlakken goedkope plugin-eigen metadata nodig hebben
voordat runtimes laden.

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

`cliBackends` op topniveau blijft geldig en blijft CLI-inferencebackends
beschrijven. `setup.cliBackends` is het setup-specifieke descriptoroppervlak voor
control-plane-/setupflows die metadata-only moeten blijven.

Wanneer aanwezig, zijn `setup.providers` en `setup.cliBackends` het voorkeursoppervlak
voor descriptor-first lookups bij setup-detectie. Als de descriptor alleen
de kandidaatplugin beperkt en setup nog rijkere setup-time runtime-
hooks nodig heeft, stel dan `requiresRuntime: true` in en houd `setup-api` aanwezig als het
fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en
env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteits-
adapter tijdens de deprecatievenster, maar niet-gebundelde plugins die dit nog gebruiken
krijgen een manifestdiagnostic. Nieuwe plugins moeten setup-/status-env-metadata
op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods`
wanneer geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false`
declareert dat setup-runtime onnodig is. Expliciete `providerAuthChoices`-entries blijven
de voorkeur hebben voor aangepaste labels, CLI-vlaggen, onboardingscope en assistant-metadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor het
setupoppervlak. OpenClaw behandelt expliciet `false` als een descriptor-only contract
en voert `setup-api` of `openclaw.setupEntry` niet uit voor setup-lookups. Als
een descriptor-only plugin toch een van die setup-runtime-entries levert,
rapporteert OpenClaw een additieve diagnostic en blijft deze negeren. Weggelaten
`requiresRuntime` behoudt legacy fallbackgedrag, zodat bestaande plugins die
descriptors zonder de vlag hebben toegevoegd niet breken.

Omdat setup-lookup plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
`setup.providers[].id`- en `setup.cliBackends[]`-waarden uniek blijven over
ontdekte plugins heen. Ambigu eigendom faalt gesloten in plaats van een
winnaar uit detectievolgorde te kiezen.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteert setupregistry-diagnostiek descriptor-
drift als `setup-api` een provider of CLI-backend registreert die de manifest-
descriptors niet declareren, of als een descriptor geen overeenkomende runtime-
registratie heeft. Deze diagnostics zijn additief en wijzen legacy plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                  |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ja      | `string`   | Provider-id dat tijdens setup of onboarding wordt blootgesteld. Houd genormaliseerde id's wereldwijd uniek. |
| `authMethods`  | Nee     | `string[]` | Setup-/auth-methode-id's die deze provider ondersteunt zonder volledige runtime te laden.        |
| `envVars`      | Nee     | `string[]` | Env-vars die generieke setup-/statusoppervlakken kunnen controleren voordat plugin-runtime laadt. |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-evidencecontroles voor providers die kunnen authenticeren via niet-geheime markers. |

`authEvidence` is voor provider-beheerde lokale credential-markeringen die kunnen worden
geverifieerd zonder runtime-code te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkcalls, geen reads uit keychain of secret-manager, geen shell-commando's en geen
provider-API-probes.

Ondersteunde evidence-vermeldingen:

| Veld               | Vereist | Type       | Wat het betekent                                                                                                           |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja      | `string`   | Momenteel `local-file-with-env`.                                                                                           |
| `fileEnvVar`       | Nee     | `string`   | Env-var die een expliciet pad naar een credential-bestand bevat.                                                           |
| `fallbackPaths`    | Nee     | `string[]` | Lokale paden naar credential-bestanden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee     | `string[]` | Minstens één vermelde env-var moet niet leeg zijn voordat de evidence geldig is.                                           |
| `requiresAllEnv`   | Nee     | `string[]` | Elke vermelde env-var moet niet leeg zijn voordat de evidence geldig is.                                                   |
| `credentialMarker` | Ja      | `string`   | Niet-geheime markering die wordt geretourneerd wanneer de evidence aanwezig is.                                            |
| `source`           | Nee     | `string`   | Gebruikersgerichte bronlabel voor auth/status-uitvoer.                                                                     |

### setup-velden

| Veld               | Vereist | Type       | Wat het betekent                                                                                          |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `providers`        | Nee     | `object[]` | Provider-setupdescriptors die tijdens setup en onboarding worden blootgesteld.                            |
| `cliBackends`      | Nee     | `string[]` | Backend-id's voor setuptijd die worden gebruikt voor descriptor-first setup-lookup. Houd genormaliseerde id's wereldwijd uniek. |
| `configMigrations` | Nee     | `string[]` | Configmigratie-id's die eigendom zijn van het setup-oppervlak van deze Plugin.                            |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup nog steeds uitvoering van `setup-api` nodig heeft na descriptor-lookup.                          |

## uiHints-referentie

`uiHints` is een map van configuratieveldnamen naar kleine renderhints.

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

| Veld          | Type       | Wat het betekent                              |
| ------------- | ---------- | --------------------------------------------- |
| `label`       | `string`   | Gebruikersgericht veldlabel.                  |
| `help`        | `string`   | Korte helptekst.                              |
| `tags`        | `string[]` | Optionele UI-tags.                            |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.            |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.     |
| `placeholder` | `string`   | Plaatshoudertekst voor formulierinvoer.       |

## contracts-referentie

Gebruik `contracts` alleen voor statische metadata over capability-eigendom die OpenClaw kan
lezen zonder de Plugin-runtime te importeren.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Elke lijst is optioneel:

| Veld                             | Type       | Wat het betekent                                                          |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-id's van Codex app-server-extensies, momenteel `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor een gebundelde Plugin tool-resultmiddleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze Plugin de externe auth-profielhook bezit.      |
| `speechProviders`                | `string[]` | Speech-provider-id's die deze Plugin bezit.                               |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription-provider-id's die deze Plugin bezit.               |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice-provider-id's die deze Plugin bezit.                       |
| `memoryEmbeddingProviders`       | `string[]` | Memory-embedding-provider-id's die deze Plugin bezit.                     |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-id's die deze Plugin bezit.                  |
| `imageGenerationProviders`       | `string[]` | Image-generation-provider-id's die deze Plugin bezit.                     |
| `videoGenerationProviders`       | `string[]` | Video-generation-provider-id's die deze Plugin bezit.                     |
| `webFetchProviders`              | `string[]` | Web-fetch-provider-id's die deze Plugin bezit.                            |
| `webSearchProviders`             | `string[]` | Web-search-provider-id's die deze Plugin bezit.                           |
| `migrationProviders`             | `string[]` | Importprovider-id's die deze Plugin bezit voor `openclaw migrate`.        |
| `tools`                          | `string[]` | Namen van agenttools die deze Plugin bezit.                               |

`contracts.embeddedExtensionFactories` wordt behouden voor gebundelde Codex
app-server-only extensiefactory's. Gebundelde tool-resulttransformaties moeten
in plaats daarvan `contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe Plugins kunnen geen
tool-resultmiddleware registreren omdat de seam tooluitvoer met veel vertrouwen kan
herschrijven voordat het model die ziet.

Runtime-registraties met `api.registerTool(...)` moeten overeenkomen met `contracts.tools`.
Tooldiscovery gebruikt deze lijst om alleen de Plugin-runtimes te laden die eigenaar kunnen zijn van de
aangevraagde tools.

Provider-Plugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie lopen nog steeds
via een verouderde compatibiliteitsfallback, maar die fallback is trager en
wordt verwijderd na het migratievenster.

Gebundelde memory-embedding-providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die ze blootstellen, inclusief
ingebouwde adapters zoals `local`. Standalone CLI-paden gebruiken dit manifestcontract
om alleen de eigenaar-Plugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, prioriteit voor auto-auth-fallback of native documentondersteuning heeft die
generieke core-helpers nodig hebben voordat runtime laadt. Sleutels moeten ook worden gedeclareerd in
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

Elke provider-vermelding kan bevatten:

| Veld                   | Type                                | Wat het betekent                                                             |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Media-capabilities die door deze provider worden blootgesteld.                |
| `defaultModels`        | `Record<string, string>`            | Capability-naar-model-standaarden die worden gebruikt wanneer config geen model specificeert. |
| `autoPriority`         | `Record<string, number>`            | Lagere nummers worden eerder gesorteerd voor automatische credential-gebaseerde providerfallback. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                 |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een kanaal-Plugin goedkope configuratiemetadata nodig heeft voordat
runtime laadt. Read-only setup/status-discovery voor kanalen kan deze metadata
direct gebruiken voor geconfigureerde externe kanalen wanneer er geen setup-vermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` declareert dat setup-runtime niet nodig is.

`channelConfigs` is Plugin-manifestmetadata, geen nieuwe top-level gebruikersconfiguratiesectie.
Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde
kanaal voordat Plugin-runtimecode wordt uitgevoerd.

Voor een kanaal-Plugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde Plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-vermeldingen declareren. Zonder deze kan OpenClaw de Plugin nog steeds laden, maar
cold-path-configschema-, setup- en Control UI-oppervlakken kunnen de
kanaal-eigen optiestructuur pas kennen wanneer Plugin-runtime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor command-configuratiecontroles
die draaien voordat kanaal-runtime laadt. Gebundelde kanalen kunnen dezelfde standaarden ook publiceren
via `package.json#openclaw.channel.commands` naast hun andere package-eigen kanaalcatalogusmetadata.

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

Elke kanaalvermelding kan bevatten:

| Veld          | Type                     | Wat het betekent                                                                          |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke opgegeven kanaalconfiguratievermelding. |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoelige hints voor die kanaalconfiguratiesectie.       |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in keuze- en inspectieoppervlakken wanneer runtime-metadata nog niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                        |
| `commands`    | `object`                 | Statische native opdracht en native skill-auto-standaarden voor configuratiecontroles vóór runtime. |
| `preferOver`  | `string[]`               | Verouderde of lager geprioriteerde Plugin-id's die dit kanaal moet overtreffen in selectieoppervlakken. |

### Een andere kanaal-Plugin vervangen

Gebruik `preferOver` wanneer je Plugin de voorkeursbeheerder is voor een kanaal-id dat
een andere Plugin ook kan leveren. Veelvoorkomende gevallen zijn een hernoemde Plugin-id, een
zelfstandige Plugin die een gebundelde Plugin vervangt, of een onderhouden fork die
dezelfde kanaal-id behoudt voor configuratiecompatibiliteit.

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

Wanneer `channels.chat` is geconfigureerd, neemt OpenClaw zowel de kanaal-id als
de voorkeurs-Plugin-id mee. Als de lager geprioriteerde Plugin alleen was geselecteerd omdat
deze is gebundeld of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtime-configuratie zodat één Plugin eigenaar is van het kanaal en de tools ervan. Expliciete gebruikersselectie
wint nog steeds: als de gebruiker beide Plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het dubbele kanaal-/tooldiagnostiek in plaats van
stilzwijgend de aangevraagde Plugin-set te wijzigen.

Houd `preferOver` beperkt tot Plugin-id's die echt hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

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

- expliciete `provider/model`-referenties gebruiken de bijbehorende `providers`-manifestmetadata van de eigenaar
- `modelPatterns` winnen van `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, wint de niet-gebundelde
  Plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                              |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden vergeleken met verkorte model-id's.     |
| `modelPatterns` | `string[]` | Regex-bronnen die na verwijdering van het profielsuffix met verkorte model-id's worden vergeleken. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
de Plugin-runtime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en ontdekkingsmodus. Runtime-verversing
hoort nog steeds thuis in provider-runtimecode, maar het manifest vertelt core wanneer runtime
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

| Veld           | Type                                                     | Wat het betekent                                                                                             |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze Plugin. Sleutels moeten ook voorkomen in `providers` op topniveau. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten worden herleid naar een provider in eigendom voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze Plugin onderdrukt om een providerspecifieke reden.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, naar cache kan worden ververst, of runtime vereist. |

`aliases` neemt deel aan het opzoeken van providereigenaarschap voor modelcatalogusplanning.
Aliasdoelen moeten providers op topniveau zijn die eigendom zijn van dezelfde Plugin. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarsmanifest lezen en
API-/basis-URL-overschrijvingen van de alias toepassen zonder provider-runtime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de canonieke
providerrijen van de eigenaar weer.

`suppressions` vervangt de oude provider-runtimehook `suppressBuiltInModel`.
Onderdrukkingsvermeldingen worden alleen gerespecteerd wanneer de provider eigendom is van de Plugin of
is opgegeven als een `modelCatalog.aliases`-sleutel die naar een provider in eigendom verwijst. Runtime-
onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                 |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus. |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.     |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                               |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het prefix `provider/`.                       |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                       |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                       |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                 |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                        |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                        |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                |
| `contextWindow` | `number`                                                       | Native providercontextvenster.                                                |
| `contextTokens` | `number`                                                       | Optionele effectieve runtimecontextlimiet wanneer deze verschilt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximumaantal uitvoertokens wanneer bekend.                                   |
| `cost`          | `object`                                                       | Optionele prijzen in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Onderdruk alleen wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.            |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die dit model vervangt.                      |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                    |
| `tags`          | `string[]`                                                     | Stabiele tags die door keuzelijsten en filters worden gebruikt.               |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                  |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Provider-id voor de upstream-rij die moet worden onderdrukt. Moet eigendom zijn van deze Plugin of zijn opgegeven als een alias in eigendom. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                               |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt aangevraagd.    |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve providerbasis-URL-hosts die vereist zijn voordat de onderdrukking van toepassing is. |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking van toepassing is. |

Plaats geen data die alleen voor runtime bedoeld is in `modelCatalog`. Gebruik `static` alleen wanneer manifestrijen compleet genoeg zijn voor provider-gefilterde lijst- en picker-oppervlakken om registry/runtime-discovery over te slaan. Gebruik `refreshable` wanneer manifestrijen nuttige lijstbare seeds of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen; refreshable rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope provider-eigen opschoning van model-id’s die moet plaatsvinden voordat provider-runtime laadt. Dit houdt aliassen zoals korte modelnamen, provider-lokale legacy-id’s en proxy-prefixregels in het manifest van de eigenaar-Plugin in plaats van in core model-selectietabellen.

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

| Veld                                 | Type                    | Betekenis                                                                                  |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte model-id-aliassen. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Prefixen om vóór aliaslookup te verwijderen, nuttig voor legacy provider/model-duplicatie.  |
| `prefixWhenBare`                     | `string`                | Prefix om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.             |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke bare-id-prefixregels na aliaslookup, op basis van `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek requestbeleid moet kennen voordat provider-runtime laadt. Core blijft eigenaar van de betekenis van elke `endpointClass`; Plugin-manifesten zijn eigenaar van de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Betekenis                                                                                       |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.          |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de endpointklasse worden gekoppeld.                                    |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die aan de endpointklasse worden gekoppeld. Prefix met `.` voor alleen domeinsuffix-matching. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL’s die aan de endpointklasse worden gekoppeld.           |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                        |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van overeenkomende hosts te verwijderen om het Google Vertex-regioprefix bloot te leggen. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata over requestcompatibiliteit die generiek requestbeleid nodig heeft zonder provider-runtime te laden. Houd gedragsspecifieke payload-herschrijving in provider-runtime-hooks of gedeelde helpers voor providerfamilies.

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
| `family`              | `string`     | Providerfamilielabel gebruikt door generieke beslissingen en diagnostiek voor requestcompatibiliteit. |
| `compatibilityFamily` | `"moonshot"` | Optionele providerfamilie-compatibiliteitsbucket voor gedeelde requesthelpers.         |
| `openAICompletions`   | `object`     | OpenAI-compatibele completions-requestvlaggen, momenteel `supportsStreamingUsage`.     |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider control-plane prijsbeleid nodig heeft voordat runtime laadt. De Gateway-prijscache leest deze metadata zonder provider-runtimecode te importeren.

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
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelf-gehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | OpenRouter-prijslookupmapping. `false` schakelt OpenRouter-lookup voor deze provider uit.         |
| `liteLLM`    | `false \| object` | LiteLLM-prijslookupmapping. `false` schakelt LiteLLM-lookup voor deze provider uit.               |

Bronvelden:

| Veld                       | Type               | Betekenis                                                                                                          |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Externe catalogus-provider-id wanneer deze verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id’s met slashes als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra model-id-varianten voor externe catalogi. `version-dots` probeert versie-id’s met punten, zoals `claude-opus-4.6`. |

### OpenClaw Provider Index

De OpenClaw Provider Index is previewmetadata in eigendom van OpenClaw voor providers waarvan de Plugins mogelijk nog niet zijn geïnstalleerd. Het is geen onderdeel van een Plugin-manifest. Plugin-manifesten blijven de autoriteit voor geïnstalleerde Plugins. De Provider Index is het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install modelpickers zullen gebruiken wanneer een provider-Plugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd Plugin-manifest `modelCatalog`.
3. Modelcataloguscache uit expliciete refresh.
4. Previewrijen van OpenClaw Provider Index.

De Provider Index mag geen geheimen, ingeschakelde status, runtime-hooks of live accountspecifieke modeldata bevatten. De previewcatalogi gebruiken dezelfde `modelCatalog`-providerrijvorm als Plugin-manifesten, maar moeten beperkt blijven tot stabiele weergavemetadata, tenzij runtime-adaptervelden zoals `api`, `baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op het geïnstalleerde Plugin-manifest. Providers met live `/models`-discovery moeten vernieuwde rijen schrijven via het expliciete modelcataloguscachepad in plaats van normale lijstweergave of onboarding provider-API’s te laten aanroepen.

Provider Index-vermeldingen kunnen ook metadata voor installeerbare Plugins bevatten voor providers waarvan de Plugin uit core is verplaatst of anderszins nog niet is geïnstalleerd. Deze metadata weerspiegelt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie, verwachte integriteit en goedkope auth-keuzelabels zijn genoeg om een installeerbare setupoptie te tonen. Zodra de Plugin is geïnstalleerd, wint het manifest daarvan en wordt de Provider Index-vermelding voor die provider genegeerd.

Legacy capability-sleutels op topniveau zijn afgeschaft. Gebruik `openclaw doctor --fix` om `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` en `webSearchProviders` onder `contracts` te verplaatsen; normaal manifestladen behandelt die velden op topniveau niet langer als capability-eigenaarschap.

## Manifest versus package.json

De twee bestanden hebben verschillende taken:

| Bestand               | Gebruik het voor                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, configuratievalidatie, auth-keuzemetadata en UI-hints die moeten bestaan voordat Plugin-code draait                 |
| `package.json`         | npm-metadata, dependency-installatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatiegating, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat Plugin-code wordt geladen, plaats het in `openclaw.plugin.json`
- als het gaat over packaging, entry-bestanden of npm-installatiegedrag, plaats het in `package.json`

### package.json-velden die discovery beïnvloeden

Sommige pre-runtime Plugin-metadata staat bewust in `package.json` onder het `openclaw`-blok in plaats van in `openclaw.plugin.json`.
`openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw Plugin-contracten; native Plugins moeten `openclaw.plugin.json` gebruiken plus de ondersteunde velden hieronder in `package.json#openclaw`.

Belangrijke voorbeelden:

| Veld                                                                                       | Wat het betekent                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declareert native Plugin-entrypoints. Moet binnen de Plugin-pakketdirectory blijven.                                                                                                                |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-entrypoints voor geinstalleerde pakketten. Moet binnen de Plugin-pakketdirectory blijven.                                                                   |
| `openclaw.setupEntry`                                                                      | Lichtgewicht entrypoint alleen voor setup, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus/SecretRef-detectie. Moet binnen de Plugin-pakketdirectory blijven.    |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-setup-entrypoint voor geinstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de Plugin-pakketdirectory blijven.                            |
| `openclaw.channel`                                                                         | Goedkope kanaalcatalogusmetadata zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                                        |
| `openclaw.channel.commands`                                                                | Statische native opdracht- en native skill-auto-standaardmetadata die door config-, audit- en opdrachtenlijstoppervlakken wordt gebruikt voordat de kanaalruntime laadt.                           |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht metadata voor configured-state-controle die kan antwoorden "bestaat env-only setup al?" zonder de volledige kanaalruntime te laden.                                                    |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht metadata voor persisted-auth-controle die kan antwoorden "is er al iets aangemeld?" zonder de volledige kanaalruntime te laden.                                                        |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updatehints voor meegeleverde en extern gepubliceerde plugins.                                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | Voorkeurspad voor installatie wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                                    |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm-dist-integriteitsstring zoals `sha512-...`; installatie- en updateflows controleren het opgehaalde artifact daartegen.                                                                |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een smal herstelpad voor herinstallatie van meegeleverde plugins toe wanneer de configuratie ongeldig is.                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat setup-only kanaaloppervlakken laden voordat de volledige kanaal-Plugin tijdens het opstarten laadt.                                                                                            |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes in onboarding
verschijnen voordat runtimes laden. `package.json#openclaw.install` vertelt
onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de
gebruiker een van die keuzes kiest. Verplaats installatiehints niet naar
`openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en bij
het laden van het manifestregister voor niet-meegeleverde Plugin-bronnen.
Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden slaan externe
plugins over op oudere hosts. Meegeleverde bronplugins worden verondersteld
samen met de hostcheckout te zijn geversioneerd.

Officiele install-on-demand-metadata moet `clawhubSpec` gebruiken wanneer de
Plugin op ClawHub is gepubliceerd; onboarding behandelt dat als de
voorkeursbron op afstand en registreert ClawHub-artifactfeiten na installatie.
`npmSpec` blijft de compatibiliteitsfallback voor pakketten die nog niet naar
ClawHub zijn verplaatst.

Exacte npm-versiepinnen staan al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiele externe
catalogusitems moeten exacte specs combineren met `expectedIntegrity`, zodat
updateflows gesloten falen als het opgehaalde npm-artifact niet langer
overeenkomt met de vastgepinde release. Interactieve onboarding biedt nog steeds
vertrouwde register-npm-specs, inclusief kale pakketnamen en dist-tags, voor
compatibiliteit. Catalogusdiagnostiek kan onderscheid maken tussen exacte,
zwevende, met integriteit vastgepinde, ontbrekende-integriteit-, pakketnaam-
mismatch- en ongeldige default-choice-bronnen. Ze waarschuwt ook wanneer
`expectedIntegrity` aanwezig is maar er geen geldige npm-bron is waaraan die kan
worden vastgepind. Wanneer `expectedIntegrity` aanwezig is, dwingen
installatie-/updateflows die af; wanneer deze ontbreekt, wordt de
registerresolutie zonder integriteitspin geregistreerd.

Kanaalplugins moeten `openclaw.setupEntry` leveren wanneer status-, kanaallijst-
of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de
volledige runtime te laden. De setup-entry moet kanaalmetadata plus setup-veilige
config-, status- en secrets-adapters blootstellen; houd netwerkclients,
Gateway-listeners en transportruntimes in het hoofdentrypoint van de extensie.

Runtime-entrypointvelden overschrijven pakketgrenscontroles voor
bronentrypointvelden niet. Bijvoorbeeld: `openclaw.runtimeExtensions` kan een
ontsnappend `openclaw.extensions`-pad niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt niet
willekeurig kapotte configuraties installeerbaar. Vandaag staat het alleen toe
dat installatieflows herstellen van specifieke verouderde upgradefouten van
meegeleverde plugins, zoals een ontbrekend pad naar een meegeleverde Plugin of
een verouderde `channels.<id>`-entry voor diezelfde meegeleverde Plugin.
Ongerelateerde configuratiefouten blokkeren installatie nog steeds en sturen
operators naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine
checkermodule:

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

Gebruik dit wanneer setup-, doctor-, status- of alleen-lezen presence-flows een
goedkope ja/nee-auth-probe nodig hebben voordat de volledige kanaal-Plugin
laadt. Persisted auth state is geen configured channel state: gebruik deze
metadata niet om plugins automatisch in te schakelen, runtimedependencies te
repareren of te beslissen of een kanaalruntime moet laden. De doel-export moet
een kleine functie zijn die alleen persisted state leest; routeer die niet via
de volledige kanaalruntime-barrel.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope env-only
configured checks:

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

Gebruik dit wanneer een kanaal configured-state kan beantwoorden op basis van
env of andere kleine niet-runtime-inputs. Als de controle volledige
configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan
in de Plugin-`config.hasConfiguredState`-hook.

## Discovery-voorrang (dubbele Plugin-id's)

OpenClaw ontdekt plugins vanuit meerdere roots (meegeleverd, globale installatie, workspace, expliciet in config geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste voorrang** behouden; duplicaten met lagere voorrang worden verwijderd in plaats van ernaast geladen.

Voorrang, van hoog naar laag:

1. **Geselecteerd via config** — een pad dat expliciet is vastgezet in `plugins.entries.<id>`
2. **Meegeleverd** — plugins die met OpenClaw worden geleverd
3. **Globale installatie** — plugins die zijn geinstalleerd in de globale OpenClaw-Plugin-root
4. **Workspace** — plugins die relatief aan de huidige workspace worden ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een meegeleverde Plugin in de workspace overschaduwt de meegeleverde build niet.
- Om een meegeleverde Plugin daadwerkelijk te overschrijven met een lokale Plugin, zet je die vast via `plugins.entries.<id>`, zodat deze wint op basis van voorrang in plaats van te vertrouwen op workspace-discovery.
- Verwijderde duplicaten worden gelogd, zodat Doctor en opstartdiagnostiek naar de genegeerde kopie kunnen verwijzen.
- Dubbele overrides die via config zijn geselecteerd, worden in diagnostiek geformuleerd als expliciete overrides, maar waarschuwen nog steeds zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## Vereisten voor JSON Schema

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van configuratie, niet tijdens runtime.
- Wanneer je een meegeleverde Plugin uitbreidt of forked met nieuwe configuratiesleutels, werk dan tegelijkertijd de `configSchema` in `openclaw.plugin.json` van die Plugin bij. Schema's van meegeleverde plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` in gebruikersconfiguratie zonder `myNewKey` toe te voegen aan `configSchema.properties` wordt geweigerd voordat de Plugin-runtime laadt.

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

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id door
  een Plugin-manifest is gedeclareerd.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*`
  moeten verwijzen naar **vindbare** Plugin-id's. Onbekende id's zijn **fouten**.
- Als een Plugin is geinstalleerd maar een kapot of ontbrekend manifest of schema
  heeft, mislukt de validatie en rapporteert Doctor de Plugin-fout.
- Als Plugin-configuratie bestaat maar de Plugin **uitgeschakeld** is, blijft de
  configuratie behouden en wordt een **waarschuwing** getoond in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Notities

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief laden vanaf het lokale bestandssysteem. Runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor ontdekking + validatie.
- Native manifesten worden met JSON5 geparseerd, dus opmerkingen, trailing komma's en sleutels zonder aanhalingstekens worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestlader. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische providercatalogusmetadata of smalle ontdekkingsdescriptors, niet voor uitvoering tijdens aanvragen.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Metadata voor omgevingsvariabelen (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, validatie van Cron-bezorging en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activatiebeleid toe voordat een omgevingsvariabele als geconfigureerd wordt behandeld.
- Zie [Provider-runtimehooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor metadata van runtimewizards waarvoor providercode nodig is.
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlistvereisten van de package manager (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Plugin-architectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitsmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin-SDK-referentie en subpath-imports.
  </Card>
</CardGroup>
