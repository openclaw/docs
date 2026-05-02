---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configuratieschema leveren of Plugin-validatiefouten debuggen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-05-02T11:23:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **native OpenClaw Plugin-manifest**.

Zie [Plugin-bundels](/nl/plugins/bundles) voor compatibele bundelindelingen.

Compatibele bundelindelingen gebruiken andere manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json` of de standaard Claude-componentindeling
  zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert die bundelindelingen ook automatisch, maar ze worden niet gevalideerd
tegen het hier beschreven `openclaw.plugin.json`-schema.

Voor compatibele bundels leest OpenClaw momenteel bundelmetadata plus gedeclareerde
skill-roots, Claude-commandoroots, standaardwaarden uit Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hookpakketten wanneer de indeling
overeenkomt met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw Plugin **moet** een `openclaw.plugin.json`-bestand meeleveren in de
**Plugin-root**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugin-code uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
Plugin-fouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het Plugin-systeem: [Plugins](/nl/tools/plugin).
Voor het native capabilitiesmodel en de huidige richtlijnen voor externe compatibiliteit:
[Capabilitiesmodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugin-code laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Plugin-runtime op te starten.

**Gebruik het voor:**

- Plugin-identiteit, configuratievalidatie en hints voor de configuratie-UI
- auth-, onboarding- en setupmetadata (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activatiehints voor control-plane-oppervlakken
- verkorte eigendomstoewijzing van modelfamilies
- statische snapshots van capability-eigenaarschap (`contracts`)
- metadata voor QA-runners die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die worden samengevoegd in catalogus- en validatieoppervlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints,
of npm-installatiemetadata. Die horen thuis in je Plugin-code en `package.json`.

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

## Referentie voor velden op topniveau

| Veld                                 | Vereist | Type                             | Wat het betekent                                                                                                                                                                                                                                   |
| ------------------------------------ | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                                    |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                                           |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een meegeleverde Plugin als standaard ingeschakeld. Laat dit weg, of stel een waarde in die niet `true` is, om de Plugin standaard uitgeschakeld te laten.                                                                                |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde ids die naar deze canonieke Plugin-id worden genormaliseerd.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-ids die deze Plugin automatisch moeten inschakelen wanneer auth-, configuratie- of modelverwijzingen ze noemen.                                                                                                                           |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Nee     | `string[]`                       | Kanaal-ids die eigendom zijn van deze Plugin. Gebruikt voor detectie en configuratievalidatie.                                                                                                                                                      |
| `providers`                          | Nee     | `string[]`                       | Provider-ids die eigendom zijn van deze Plugin.                                                                                                                                                                                                    |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht modulepad voor providerdetectie, relatief aan de Plugin-root, voor provider-catalogusmetadata binnen de manifest-scope die kan worden geladen zonder de volledige Plugin-runtime te activeren.                                       |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte metadata voor modelfamilies die wordt gebruikt om de Plugin automatisch te laden vóór runtime.                                                                                                                  |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-plane-contract voor toekomstige alleen-lezen lijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd extern prijsopzoekbeleid. Gebruik dit om lokale/zelfgehoste providers af te melden voor externe prijscatalogi of providerverwijzingen naar OpenRouter/LiteLLM-catalogus-ids te mappen zonder provider-ids hard te coderen in core. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime laadt.                                                                                                                   |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde host-/baseUrl-metadata voor eindpunten voor providerroutes die core moet classificeren voordat de provider-runtime laadt.                                                                                               |
| `providerRequest`                    | Nee     | `object`                         | Goedkope providerfamilie- en aanvraagcompatibiliteitsmetadata die door generiek aanvraagbeleid wordt gebruikt voordat de provider-runtime laadt.                                                                                                    |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inferentiebackend-ids die eigendom zijn van deze Plugin. Gebruikt voor automatische activering bij het opstarten vanuit expliciete configuratieverwijzingen.                                                                                    |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backendverwijzingen waarvan de door de Plugin beheerde synthetische auth-hook moet worden gepeild tijdens koude modeldetectie voordat runtime laadt.                                                                               |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Placeholder-API-sleutelwaarden die eigendom zijn van meegeleverde Plugins en niet-geheime lokale, OAuth- of omgevingsreferentiestatus vertegenwoordigen.                                                                                           |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en Plugin-bewuste configuratie- en CLI-diagnostiek moeten produceren voordat runtime laadt.                                                                                                        |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor provider-auth/statusopzoeking. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de deprecatiefase.                                              |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-ids die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codeerprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                                   |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor env-gestuurde kanaalconfiguratie of auth-oppervlakken die generieke opstart-/configuratiehelpers moeten zien.                              |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboardingkiezers, voorkeursproviderresolutie en eenvoudige CLI-flag-bedrading.                                                                                                                                   |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activeringsplanner voor laden op basis van opstarten, provider, commando, kanaal, route en capability-triggers. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.                        |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingbeschrijvingen die detectie- en setup-oppervlakken kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                                                  |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerbeschrijvingen die worden gebruikt door de gedeelde `openclaw qa`-host voordat de Plugin-runtime laadt.                                                                                                                          |
| `contracts`                          | Nee     | `object`                         | Statische snapshot van capability-eigenaarschap voor externe auth-hooks, spraak, realtime transcriptie, realtime spraak, mediabegrip, beeldgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoeken en tool-eigenaarschap.                |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-ids die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                                     |
| `imageGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor beeldgeneratie voor provider-ids die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief providerbeheerde auth-aliassen en base-url-guards.                                                           |
| `videoGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor videogeneratie voor provider-ids die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief providerbeheerde auth-aliassen en base-url-guards.                                                           |
| `musicGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope auth-metadata voor muziekgeneratie voor provider-ids die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief providerbeheerde auth-aliassen en base-url-guards.                                                          |
| `toolMetadata`                       | Nee     | `Record<string, object>`         | Goedkope beschikbaarheidsmetadata voor Plugin-tools die zijn gedeclareerd in `contracts.tools`. Gebruik dit wanneer een tool runtime niet moet laden tenzij er configuratie-, env- of auth-bewijs bestaat.                                         |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Door het manifest beheerde kanaalconfiguratiemetadata die wordt samengevoegd in detectie- en validatie-oppervlakken voordat runtime laadt.                                                                                                         |
| `skills`                             | Nee     | `string[]`                       | Skill-mappen om te laden, relatief aan de Plugin-root.                                                                                                                                                                                            |
| `name`                               | Nee     | `string`                         | Voor mensen leesbare Plugin-naam.                                                                                                                                                                                                                 |
| `description`                        | Nee      | `string`                         | Korte samenvatting die wordt getoond in Plugin-oppervlakken.                                                                                                                                                                        |
| `version`                            | Nee      | `string`                         | Informatieve Plugin-versie.                                                                                                                                                                                                         |
| `uiHints`                            | Nee      | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidsaanwijzingen voor configuratievelden.                                                                                                                                                       |

## Referentie voor metadata van generatieproviders

De metadatavelden van generatieproviders beschrijven statische authenticatiesignalen voor
providers die zijn gedeclareerd in de overeenkomende lijst `contracts.*GenerationProviders`.
OpenClaw leest deze velden voordat de runtime van de provider wordt geladen, zodat kerntools kunnen
bepalen of een generatieprovider beschikbaar is zonder elke
provider-Plugin te importeren.

Gebruik deze velden alleen voor goedkope, declaratieve feiten. Transport, aanvraagtransformaties,
tokenvernieuwing, validatie van referenties en het daadwerkelijke generatiegedrag
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

| Veld            | Vereist | Type       | Betekenis                                                                                                                                            |
| --------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nee     | `string[]` | Aanvullende provider-id's die moeten meetellen als statische authenticatie-aliassen voor de generatieprovider.                                      |
| `authProviders` | Nee     | `string[]` | Provider-id's waarvan de geconfigureerde authenticatieprofielen moeten meetellen als authenticatie voor deze generatieprovider.                     |
| `configSignals` | Nee     | `object[]` | Goedkope beschikbaarheidssignalen op basis van alleen configuratie voor lokale of zelf gehoste providers die zonder authenticatieprofielen of env-vars kunnen worden geconfigureerd. |
| `authSignals`   | Nee     | `object[]` | Expliciete authenticatiesignalen. Wanneer aanwezig vervangen deze de standaardset signalen op basis van de provider-id, `aliases` en `authProviders`. |

Elke `configSignals`-entry ondersteunt:

| Veld          | Vereist | Type       | Betekenis                                                                                                                                                                                 |
| ------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja      | `string`   | Puntpad naar het configuratieobject dat eigendom is van de Plugin en moet worden geïnspecteerd, bijvoorbeeld `plugins.entries.example.config`.                                           |
| `overlayPath` | Nee     | `string`   | Puntpad binnen de rootconfiguratie waarvan het object over het rootobject moet worden gelegd voordat het signaal wordt geëvalueerd. Gebruik dit voor capability-specifieke configuratie zoals `image`, `video` of `music`. |
| `required`    | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie die geconfigureerde waarden moeten hebben. Strings mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                            |
| `requiredAny` | Nee     | `string[]` | Puntpaden binnen de effectieve configuratie waarvan er minstens één een geconfigureerde waarde moet hebben.                                                                               |
| `mode`        | Nee     | `object`   | Optionele stringmodusbewaking binnen de effectieve configuratie. Gebruik dit wanneer beschikbaarheid op basis van alleen configuratie slechts op één modus van toepassing is.            |

Elke `mode`-bewaking ondersteunt:

| Veld         | Vereist | Type       | Betekenis                                                                                 |
| ------------ | ------- | ---------- | ----------------------------------------------------------------------------------------- |
| `path`       | Nee     | `string`   | Puntpad binnen de effectieve configuratie. Standaardwaarde is `mode`.                     |
| `default`    | Nee     | `string`   | Moduswaarde die moet worden gebruikt wanneer de configuratie het pad weglaat.             |
| `allowed`    | Nee     | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is. |
| `disallowed` | Nee     | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is.    |

Elke `authSignals`-entry ondersteunt:

| Veld              | Vereist | Type     | Betekenis                                                                                                                                                          |
| ----------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja      | `string` | Provider-id om te controleren in geconfigureerde authenticatieprofielen.                                                                                           |
| `providerBaseUrl` | Nee     | `object` | Optionele bewaking waardoor het signaal alleen meetelt wanneer de gerefereerde geconfigureerde provider een toegestane basis-URL gebruikt. Gebruik dit wanneer een authenticatiealias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-bewaking ondersteunt:

| Veld              | Vereist | Type       | Betekenis                                                                                                                                              |
| ----------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja      | `string`   | Providerconfiguratie-id waarvan `baseUrl` moet worden gecontroleerd.                                                                                   |
| `defaultBaseUrl`  | Nee     | `string`   | Basis-URL om aan te nemen wanneer de providerconfiguratie `baseUrl` weglaat.                                                                           |
| `allowedBaseUrls` | Ja      | `string[]` | Toegestane basis-URL's voor dit authenticatiesignaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaard basis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Referentie voor toolmetadata

`toolMetadata` gebruikt dezelfde vormen voor `configSignals` en `authSignals` als
metadata van generatieproviders, met toolnaam als sleutel. `contracts.tools` declareert
eigenaarschap. `toolMetadata` declareert goedkoop beschikbaarheidsbewijs zodat OpenClaw kan
voorkomen dat een Plugin-runtime wordt geïmporteerd alleen om de toolfactory `null` te laten retourneren.

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
laadt de eigenaar-Plugin wanneer het toolcontract overeenkomt met het beleid. Voor hot-path
tools waarvan de factory afhankelijk is van authenticatie/configuratie, moeten Plugin-auteurs
`toolMetadata` declareren in plaats van core de runtime te laten importeren om het te vragen.

## Referentie voor providerAuthChoices

Elke `providerAuthChoices`-entry beschrijft één onboarding- of authenticatiekeuze.
OpenClaw leest dit voordat de provider-runtime wordt geladen.
Providerinstallatielijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide installatiekeuzes
en metadata uit de installatiecatalogus zonder de provider-runtime te laden.

| Veld                  | Vereist | Type                                            | Betekenis                                                                                                      |
| --------------------- | ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                        |
| `method`              | Ja      | `string`                                        | Authenticatiemethode-id waarnaar moet worden gedispatcht.                                                      |
| `choiceId`            | Ja      | `string`                                        | Stabiele authenticatiekeuze-id die wordt gebruikt door onboarding- en CLI-flows.                               |
| `choiceLabel`         | Nee     | `string`                                        | Gebruikersgerichte label. Indien weggelaten valt OpenClaw terug op `choiceId`.                                |
| `choiceHint`          | Nee     | `string`                                        | Korte hulptekst voor de keuzelijst.                                                                            |
| `assistantPriority`   | Nee     | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistent gestuurde interactieve keuzelijsten.              |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistentkeuzelijsten terwijl handmatige CLI-selectie nog steeds is toegestaan.          |
| `deprecatedChoiceIds` | Nee     | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten omleiden.                              |
| `groupId`             | Nee     | `string`                                        | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                                |
| `groupLabel`          | Nee     | `string`                                        | Gebruikersgerichte label voor die groep.                                                                       |
| `groupHint`           | Nee     | `string`                                        | Korte hulptekst voor de groep.                                                                                 |
| `optionKey`           | Nee     | `string`                                        | Interne optiesleutel voor eenvoudige authenticatieflows met één vlag.                                          |
| `cliFlag`             | Nee     | `string`                                        | Naam van CLI-vlag, zoals `--openrouter-api-key`.                                                               |
| `cliOption`           | Nee     | `string`                                        | Volledige CLI-optievorm, zoals `--openrouter-api-key <key>`.                                                   |
| `cliDescription`      | Nee     | `string`                                        | Beschrijving die wordt gebruikt in CLI-help.                                                                   |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten is de standaardwaarde `["text-inference"]`. |

## Referentie voor commandAliases

Gebruik `commandAliases` wanneer een Plugin eigenaar is van een runtime-commandonaam die gebruikers per ongeluk in `plugins.allow` kunnen zetten of als root-CLI-command kunnen proberen uit te voeren. OpenClaw gebruikt deze metadata voor diagnostiek zonder plugin-runtimecode te importeren.

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

| Veld         | Vereist | Type              | Wat het betekent                                                               |
| ------------ | ------- | ----------------- | ------------------------------------------------------------------------------ |
| `name`       | Ja      | `string`          | Commandonaam die bij deze Plugin hoort.                                        |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als chat-slashcommand in plaats van als root-CLI-command.    |
| `cliCommand` | Nee     | `string`          | Gerelateerd root-CLI-command om voor CLI-bewerkingen voor te stellen, als er een bestaat. |

## activatiereferentie

Gebruik `activation` wanneer de Plugin goedkoop kan declareren welke control-plane-gebeurtenissen deze moeten opnemen in een activatie-/laadplan.

Dit blok is plannermetadata, geen levenscyclus-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en belooft niet dat plugincode al is uitgevoerd. De activatieplanner gebruikt deze velden om kandidaat-Plugins te beperken voordat wordt teruggevallen op bestaande manifestmetadata over eigenaarschap, zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die het eigenaarschap al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, setup-descriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra plannerhints die niet door die eigenaarschapsvelden kunnen worden weergegeven.
Gebruik `cliBackends` op topniveau voor CLI-runtimealiassen zoals `claude-cli`, `codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor ingesloten agent-harness-id's die nog geen eigenaarschapsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt `register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet. Huidige consumers gebruiken het als een beperkende hint vóór breder laden van Plugins, dus ontbrekende niet-opstart-activatiemetadata kost meestal alleen prestaties; het zou de correctheid niet moeten veranderen zolang manifestfallbacks voor eigenaarschap nog bestaan.

Elke Plugin moet `activation.onStartup` bewust instellen. Stel dit alleen in op `true` wanneer de Plugin tijdens het opstarten van de Gateway moet worden uitgevoerd. Stel dit in op `false` wanneer de Plugin inert is bij het opstarten en alleen via nauwere triggers moet laden. Het weglaten van `onStartup` laadt de Plugin bij het opstarten niet langer impliciet; gebruik expliciete activatiemetadata voor opstart-, kanaal-, configuratie-, agent-harness-, geheugen- of andere nauwere activatietriggers.

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

| Veld               | Vereist | Type                                                 | Wat het betekent                                                                                                                                                                                       |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-opstartactivatie. Elke Plugin moet dit instellen. `true` importeert de Plugin tijdens het opstarten; `false` houdt deze opstart-lazy tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze Plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingesloten runtime-id's van agent-harnesses die deze Plugin moeten opnemen in activatie-/laadplannen. Gebruik `cliBackends` op topniveau voor CLI-backendaliassen.                                    |
| `onCommands`       | Nee     | `string[]`                                           | Commando-id's die deze Plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's die deze Plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                  |
| `onRoutes`         | Nee     | `string[]`                                           | Route-soorten die deze Plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                |
| `onConfigPaths`    | Nee     | `string[]`                                           | Configuratiepaden relatief aan de root die deze Plugin moeten opnemen in opstart-/laadplannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                         |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capaciteitshints die worden gebruikt door activatieplanning in de control-plane. Geef waar mogelijk de voorkeur aan nauwere velden.                                                              |

Huidige live-consumers:

- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimport
- commandogestuurde CLI-planning valt terug op legacy `commandAliases[].cliCommand` of `commandAliases[].name`
- opstartplanning van agent-runtime gebruikt `activation.onAgentHarnesses` voor ingesloten harnesses en `cliBackends[]` op topniveau voor CLI-runtimealiassen
- kanaalgestuurde setup-/kanaalplanning valt terug op legacy `channels[]`-eigenaarschap wanneer expliciete kanaalactivatiemetadata ontbreekt
- opstartplanning van Plugins gebruikt `activation.onConfigPaths` voor niet-kanaalgebonden root-configuratieoppervlakken, zoals het `browser`-blok van de gebundelde browser-Plugin
- provider-gestuurde setup-/runtimeplanning valt terug op legacy `providers[]` en `cliBackends[]`-eigenaarschap op topniveau wanneer expliciete provideractivatiemetadata ontbreekt

Plannerdiagnostiek kan expliciete activatiehints onderscheiden van manifestfallback voor eigenaarschap. `activation-command-hint` betekent bijvoorbeeld dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn voor hostdiagnostiek en tests; Plugin-auteurs moeten de metadata blijven declareren die het eigenaarschap het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een Plugin een of meer transportrunners bijdraagt onder de gedeelde root `openclaw qa`. Houd deze metadata goedkoop en statisch; de plugin-runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht `runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

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

| Veld          | Vereist | Type     | Wat het betekent                                                      |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Ja      | `string` | Subcommand dat onder `openclaw qa` wordt gekoppeld, bijvoorbeeld `matrix`. |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stubcommand nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboarding-oppervlakken goedkope metadata nodig hebben waarvan de Plugin eigenaar is voordat de runtime laadt.

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

`cliBackends` op topniveau blijft geldig en blijft CLI-inference-backends beschrijven. `setup.cliBackends` is het setup-specifieke descriptoroppervlak voor control-plane-/setupflows die metadata-only moeten blijven.

Wanneer aanwezig zijn `setup.providers` en `setup.cliBackends` het voorkeursoppervlak voor descriptor-first lookup bij setupdetectie. Als de descriptor alleen de kandidaat-Plugin beperkt en setup nog rijkere runtimehooks tijdens setup nodig heeft, stel dan `requiresRuntime: true` in en behoud `setup-api` als het fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter tijdens de afschrijvingsperiode, maar niet-gebundelde Plugins die dit nog gebruiken, krijgen een manifestdiagnose. Nieuwe Plugins moeten env-metadata voor setup/status op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods` wanneer er geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false` declareert dat setup-runtime niet nodig is. Expliciete `providerAuthChoices`-entries blijven de voorkeur houden voor aangepaste labels, CLI-flags, onboardingscope en assistantmetadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor het setup-oppervlak. OpenClaw behandelt expliciet `false` als een descriptor-only contract en voert `setup-api` of `openclaw.setupEntry` niet uit voor setup-lookup. Als een descriptor-only Plugin nog steeds een van die setup-runtime-entries levert, rapporteert OpenClaw een additieve diagnose en blijft het deze negeren. Een weggelaten `requiresRuntime` behoudt legacy fallbackgedrag, zodat bestaande Plugins die descriptors zonder de flag hebben toegevoegd niet breken.

Omdat setup-lookup plugineigen `setup-api`-code kan uitvoeren, moeten genormaliseerde waarden van `setup.providers[].id` en `setup.cliBackends[]` uniek blijven over ontdekte Plugins heen. Ambigu eigenaarschap faalt gesloten in plaats van een winnaar te kiezen op basis van detectievolgorde.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteert diagnostiek van het setupregister descriptordrift als `setup-api` een provider of CLI-backend registreert die de manifestdescriptors niet declareren, of als een descriptor geen overeenkomende runtime-registratie heeft. Deze diagnostiek is additief en wijst legacy Plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                      |
| -------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `id`           | Ja      | `string`   | Provider-id die tijdens setup of onboarding wordt getoond. Houd genormaliseerde id's globaal uniek.   |
| `authMethods`  | Nee     | `string[]` | Setup-/auth-methode-id's die deze provider ondersteunt zonder volledige runtime te laden.             |
| `envVars`      | Nee     | `string[]` | Env-vars die generieke setup-/statusoppervlakken kunnen controleren voordat plugin-runtime laadt.     |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-bewijscontroles voor providers die kunnen authenticeren via niet-geheime markers. |

`authEvidence` is bedoeld voor provider-eigen lokale referentiemarkeringen die kunnen worden
geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkoproepen, geen keychain- of secret-manager-reads, geen shell-opdrachten en geen
provider-API-probes.

Ondersteunde bewijsvermeldingen:

| Veld               | Vereist | Type       | Betekenis                                                                                                             |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja      | `string`   | Momenteel `local-file-with-env`.                                                                                      |
| `fileEnvVar`       | Nee     | `string`   | Env-var die een expliciet pad naar een referentiebestand bevat.                                                       |
| `fallbackPaths`    | Nee     | `string[]` | Lokale paden naar referentiebestanden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee     | `string[]` | Ten minste een vermelde env-var moet niet leeg zijn voordat het bewijs geldig is.                                     |
| `requiresAllEnv`   | Nee     | `string[]` | Elke vermelde env-var moet niet leeg zijn voordat het bewijs geldig is.                                               |
| `credentialMarker` | Ja      | `string`   | Niet-geheime markering die wordt geretourneerd wanneer het bewijs aanwezig is.                                       |
| `source`           | Nee     | `string`   | Gebruikersgericht bronlabel voor auth-/statusuitvoer.                                                                |

### setup-velden

| Veld               | Vereist | Type       | Betekenis                                                                                                 |
| ------------------ | ------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `providers`        | Nee     | `object[]` | Descriptors voor providersetup die tijdens setup en onboarding worden blootgesteld.                       |
| `cliBackends`      | Nee     | `string[]` | Backend-id's tijdens setup die worden gebruikt voor descriptor-first setup-lookup. Houd genormaliseerde id's globaal uniek. |
| `configMigrations` | Nee     | `string[]` | Configmigratie-id's die eigendom zijn van het setup-oppervlak van deze plugin.                            |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup na descriptor-lookup nog steeds uitvoering van `setup-api` nodig heeft.                          |

## uiHints-referentie

`uiHints` is een map van configveldnamen naar kleine renderinghints.

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

| Veld          | Type       | Betekenis                                 |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Gebruikersgericht veldlabel.              |
| `help`        | `string`   | Korte helptekst.                          |
| `tags`        | `string[]` | Optionele UI-tags.                        |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.        |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig. |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.    |

## contracts-referentie

Gebruik `contracts` alleen voor statische metadata over capability-eigendom die OpenClaw kan
lezen zonder de pluginruntime te importeren.

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

| Veld                             | Type       | Betekenis                                                              |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory-id's, momenteel `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor een gebundelde Plugin tool-result-middleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze Plugin de externe auth-profile-hook bezit.  |
| `speechProviders`                | `string[]` | Speech-provider-id's die deze Plugin bezit.                            |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription-provider-id's die deze Plugin bezit.            |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice-provider-id's die deze Plugin bezit.                    |
| `memoryEmbeddingProviders`       | `string[]` | Memory-embedding-provider-id's die deze Plugin bezit.                  |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-id's die deze Plugin bezit.               |
| `imageGenerationProviders`       | `string[]` | Image-generation-provider-id's die deze Plugin bezit.                  |
| `videoGenerationProviders`       | `string[]` | Video-generation-provider-id's die deze Plugin bezit.                  |
| `webFetchProviders`              | `string[]` | Web-fetch-provider-id's die deze Plugin bezit.                         |
| `webSearchProviders`             | `string[]` | Web-search-provider-id's die deze Plugin bezit.                        |
| `migrationProviders`             | `string[]` | Importprovider-id's die deze Plugin bezit voor `openclaw migrate`.     |
| `tools`                          | `string[]` | Namen van agenttools die deze Plugin bezit.                            |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde Codex
app-server-only extension factories. Gebundelde tool-result-transformaties moeten
in plaats daarvan `contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-result-middleware registreren, omdat de seam high-trust tooluitvoer kan
herschrijven voordat het model die ziet.

Runtime-registraties met `api.registerTool(...)` moeten overeenkomen met `contracts.tools`.
Tooldiscovery gebruikt deze lijst om alleen de pluginruntimes te laden die eigenaar kunnen zijn van de
aangevraagde tools.

Providerplugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie lopen nog steeds
via een verouderde compatibiliteitsfallback, maar die fallback is trager en
wordt na het migratievenster verwijderd.

Gebundelde memory-embedding-providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die ze blootstellen, inclusief
ingebouwde adapters zoals `local`. Zelfstandige CLI-paden gebruiken dit manifestcontract
om alleen de eigenaar-Plugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, auto-auth fallback-prioriteit of native documentondersteuning heeft die
generieke corehelpers nodig hebben voordat runtime laadt. Sleutels moeten ook worden gedeclareerd in
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

| Veld                   | Type                                | Betekenis                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediacapabilities die door deze provider worden blootgesteld.           |
| `defaultModels`        | `Record<string, string>`            | Capability-naar-model-standaarden die worden gebruikt wanneer config geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische credential-based providerfallback. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.           |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een channelplugin goedkope configmetadata nodig heeft voordat
runtime laadt. Alleen-lezen channelsetup-/statusdiscovery kan deze metadata
rechtstreeks gebruiken voor geconfigureerde externe channels wanneer geen setupvermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` declareert dat setupruntime onnodig is.

`channelConfigs` is metadata van het pluginmanifest, geen nieuwe top-level user-configsectie.
Gebruikers configureren channelinstances nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde
channel voordat pluginruntimecode wordt uitgevoerd.

Voor een channelplugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-vermeldingen declareren. Zonder die vermeldingen kan OpenClaw de Plugin nog steeds laden, maar
cold-path configschema-, setup- en Control UI-oppervlakken kunnen de
channel-eigen optievorm pas kennen wanneer pluginruntime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor commandconfigcontroles
die worden uitgevoerd voordat channelruntime laadt. Gebundelde channels kunnen dezelfde
standaarden ook publiceren via `package.json#openclaw.channel.commands` naast
hun andere package-eigen channelcatalogusmetadata.

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

Elke channelvermelding kan bevatten:

| Veld          | Type                     | Wat het betekent                                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratievermelding.              |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels, tijdelijke aanduidingen en hints voor gevoelige waarden voor die kanaalconfiguratiesectie. |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in picker- en inspectieweergaven wanneer runtime-metadata nog niet klaar is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusweergaven.                                               |
| `commands`    | `object`                 | Statische native opdracht en automatische standaardwaarden voor native Skills voor pre-runtime configuratiecontroles. |
| `preferOver`  | `string[]`               | Verouderde plugin-id's of plugin-id's met lagere prioriteit die dit kanaal moet overtreffen in selectieweergaven. |

### Een andere kanaalplugin vervangen

Gebruik `preferOver` wanneer je plugin de voorkeursbeheerder is voor een kanaal-id dat
een andere plugin ook kan leveren. Veelvoorkomende gevallen zijn een hernoemde plugin-id, een
zelfstandige plugin die een gebundelde plugin vervangt, of een onderhouden fork die
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

Wanneer `channels.chat` is geconfigureerd, houdt OpenClaw rekening met zowel de kanaal-id als
de voorkeursplugin-id. Als de plugin met lagere prioriteit alleen was geselecteerd omdat
deze is gebundeld of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtime-configuratie zodat één plugin eigenaar is van het kanaal en de tools ervan. Expliciete gebruikersselectie
blijft leidend: als de gebruiker beide plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het dubbele kanaal-/tooldiagnoses in plaats van
de gevraagde pluginset stilzwijgend te wijzigen.

Beperk `preferOver` tot plugin-id's die daadwerkelijk hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## modelSupport-referentie

Gebruik `modelSupport` wanneer OpenClaw je providerplugin moet afleiden uit
verkorte model-id's zoals `gpt-5.5` of `claude-sonnet-4.6` voordat de pluginruntime
wordt geladen.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw past deze prioriteitsvolgorde toe:

- expliciete `provider/model`-verwijzingen gebruiken de bijbehorende `providers`-manifestmetadata
- `modelPatterns` gaan voor `modelPrefixes`
- als één niet-gebundelde plugin en één gebundelde plugin allebei overeenkomen, wint de niet-gebundelde
  plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Voorvoegsels die met `startsWith` worden vergeleken met verkorte model-id's.     |
| `modelPatterns` | `string[]` | Regex-bronnen die na verwijdering van het profielsuffix met verkorte model-id's worden vergeleken. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
de pluginruntime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en ontdekkingsmodus. Runtime-verversing
hoort nog steeds thuis in providerruntimecode, maar het manifest vertelt de kern wanneer runtime
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

Velden op hoogste niveau:

| Veld           | Type                                                     | Wat het betekent                                                                                             |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze plugin. Sleutels moeten ook voorkomen in `providers` op hoogste niveau. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten verwijzen naar een provider in eigendom voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze plugin onderdrukt om een providerspecifieke reden.                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, kan worden ververst naar de cache, of runtime vereist. |

`aliases` neemt deel aan het opzoeken van providereigenaarschap voor modelcatalogusplanning.
Aliasdoelen moeten providers op hoogste niveau zijn die eigendom zijn van dezelfde plugin. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het bijbehorende manifest lezen en
alias-API-/basis-URL-overschrijvingen toepassen zonder de providerruntime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de bijbehorende
canonieke providerrijen uit.

`suppressions` vervangt de oude providerruntime-hook `suppressBuiltInModel`.
Onderdrukkingsvermeldingen worden alleen gerespecteerd wanneer de provider eigendom is van de plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een provider in eigendom verwijst. Runtime-
onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                       |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus.  |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.           |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het voorvoegsel `provider/`.                   |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                        |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                        |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                  |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                         |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                 |
| `contextWindow` | `number`                                                       | Native contextvenster van de provider.                                         |
| `contextTokens` | `number`                                                       | Optionele effectieve runtime-contextlimiet wanneer die afwijkt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximumaantal uitvoertokens wanneer bekend.                                    |
| `cost`          | `object`                                                       | Optionele USD-prijs per miljoen tokens, inclusief optionele `tieredPricing`.   |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Lijststatus. Onderdruk alleen wanneer de rij helemaal niet mag verschijnen.    |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.             |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die dit model vervangt.                       |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                     |
| `tags`          | `string[]`                                                     | Stabiele tags die door pickers en filters worden gebruikt.                     |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                           |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstreamrij die moet worden onderdrukt. Moet eigendom zijn van deze plugin of gedeclareerd zijn als een alias in eigendom. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                                        |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt aangevraagd.             |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve basis-URL-hosts van providers die vereist zijn voordat de onderdrukking geldt. |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen data die alleen tijdens runtime bestaat in `modelCatalog`. Gebruik `static` alleen wanneer manifest
rijen volledig genoeg zijn zodat provider-gefilterde lijst- en picker-oppervlakken
registry-/runtime-detectie kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige
lijstbare seeds of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen;
refreshable rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
de provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, provider-eigen opschoning van model-id's die moet
gebeuren voordat de provider-runtime laadt. Dit houdt aliassen zoals korte modelnamen,
provider-lokale legacy-id's en proxy-prefixregels in het manifest van de eigenaar-Plugin
in plaats van in kern-tabellen voor modelselectie.

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

| Veld                                 | Type                    | Wat het betekent                                                                        |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte model-id-aliassen. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Prefixen om te verwijderen vóór aliasopzoeking, nuttig voor legacy provider/model-duplicatie. |
| `prefixWhenBare`                     | `string`                | Prefix om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke bare-id-prefixregels na aliasopzoeking, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat de provider-runtime laadt. Core blijft eigenaar van de betekenis van elke
`endpointClass`; Plugin-manifesten zijn eigenaar van de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Wat het betekent                                                                           |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.     |
| `hosts`                        | `string[]` | Exacte hostnamen die naar de endpointklasse mappen.                                       |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die naar de endpointklasse mappen. Prefix met `.` voor alleen domeinsuffix-matching. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die naar de endpointklasse mappen.             |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van overeenkomende hosts te strippen om de Google Vertex-regioprefix bloot te leggen. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata voor aanvraagcompatibiliteit die generiek
aanvraagbeleid nodig heeft zonder de provider-runtime te laden. Houd gedragsspecifieke
payload-herschrijving in provider-runtimehooks of gedeelde providerfamiliehelpers.

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

| Veld                  | Type         | Wat het betekent                                                                         |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | Providerfamilielabel gebruikt door generieke beslissingen en diagnostiek voor aanvraagcompatibiliteit. |
| `compatibilityFamily` | `"moonshot"` | Optionele providerfamilie-compatibiliteitsbucket voor gedeelde aanvraaghelpers.          |
| `openAICompletions`   | `object`     | OpenAI-compatibele completions-aanvraagvlaggen, momenteel `supportsStreamingUsage`.      |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider control-plane-prijsgedrag nodig heeft voordat
runtime laadt. De Gateway-prijscache leest deze metadata zonder
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

| Veld         | Type              | Wat het betekent                                                                                         |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelf-gehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking voor deze provider uit.   |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking voor deze provider uit.         |

Bronvelden:

| Veld                       | Type               | Wat het betekent                                                                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogus-provider-id wanneer die verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met slashes als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Extra varianten van externe catalogus-model-id's. `version-dots` probeert versie-id's met punten zoals `claude-opus-4.6`.  |

### OpenClaw-providerindex

De OpenClaw-providerindex is door OpenClaw beheerde previewmetadata voor providers
waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Hij maakt geen deel uit van een Plugin-manifest.
Plugin-manifesten blijven de autoriteit voor geïnstalleerde plugins. De providerindex is
het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install
modelpickers zullen gebruiken wanneer een provider-Plugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd Plugin-manifest `modelCatalog`.
3. Modelcataloguscache van expliciete refresh.
4. Previewrijen uit de OpenClaw-providerindex.

De providerindex mag geen geheimen, ingeschakelde status, runtimehooks of
live accountspecifieke modeldata bevatten. De previewcatalogi gebruiken dezelfde
`modelCatalog`-providerrijvorm als Plugin-manifesten, maar moeten beperkt blijven
tot stabiele weergavemetadata, tenzij runtime-adaptervelden zoals `api`,
`baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op
het geïnstalleerde Plugin-manifest. Providers met live `/models`-detectie moeten
ververste rijen schrijven via het expliciete modelcataloguscachepad in plaats van
normale lijsten of onboarding provider-API's te laten aanroepen.

Providerindexitems mogen ook metadata voor installeerbare plugins bevatten voor providers
waarvan de Plugin uit core is verplaatst of anderszins nog niet is geïnstalleerd. Deze
metadata volgt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie,
verwachte integriteit en goedkope auth-keuzelabels zijn genoeg om een
installeerbare setupoptie te tonen. Zodra de Plugin is geïnstalleerd, wint het manifest en
wordt het providerindexitem voor die provider genegeerd.

Legacy top-level capability keys zijn verouderd. Gebruik `openclaw doctor --fix` om
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` en `webSearchProviders` onder `contracts` te verplaatsen; normaal
laden van manifesten behandelt die top-level velden niet langer als capability-eigenaarschap.

## Manifest versus package.json

De twee bestanden hebben verschillende taken:

| Bestand                | Waarvoor gebruiken                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Detectie, configuratievalidatie, auth-keuzemetadata en UI-hints die moeten bestaan voordat Plugin-code wordt uitgevoerd        |
| `package.json`         | npm-metadata, dependency-installatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatieblokkering, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata hoort, gebruik dan deze regel:

- als OpenClaw het moet kennen voordat Plugin-code wordt geladen, plaats het dan in `openclaw.plugin.json`
- als het gaat over packaging, entrybestanden of npm-installatiegedrag, plaats het dan in `package.json`

### package.json-velden die detectie beïnvloeden

Sommige pre-runtime Plugin-metadata staat bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.

Belangrijke voorbeelden:

| Veld                                                              | Wat het betekent                                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declareert native Plugin-entrypoints. Moet binnen de Plugin-pakketdirectory blijven.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Declareert gebouwde JavaScript-runtime-entrypoints voor geinstalleerde pakketten. Moet binnen de Plugin-pakketdirectory blijven.                                                     |
| `openclaw.setupEntry`                                             | Lichtgewicht entrypoint alleen voor setup, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus/SecretRef-detectie. Moet binnen de Plugin-pakketdirectory blijven. |
| `openclaw.runtimeSetupEntry`                                      | Declareert het gebouwde JavaScript-setup-entrypoint voor geinstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de Plugin-pakketdirectory blijven.              |
| `openclaw.channel`                                                | Goedkope kanaalcatalogusmetadata zoals labels, docspaden, aliassen en selectietekst.                                                                                                  |
| `openclaw.channel.commands`                                       | Statische native opdracht- en native skill-auto-standaardmetadata die door configuratie-, audit- en opdrachtenlijstoppervlakken worden gebruikt voordat de kanaalruntime laadt.       |
| `openclaw.channel.configuredState`                                | Lichtgewicht metadata voor controle van geconfigureerde status die kan antwoorden op "bestaat setup alleen via env al?" zonder de volledige kanaalruntime te laden.                   |
| `openclaw.channel.persistedAuthState`                             | Lichtgewicht metadata voor controle van behouden auth-status die kan antwoorden op "is er al iets ingelogd?" zonder de volledige kanaalruntime te laden.                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installatie-/updatehints voor gebundelde en extern gepubliceerde Plugins.                                                                                                            |
| `openclaw.install.defaultChoice`                                  | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                         |
| `openclaw.install.minHostVersion`                                 | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                     |
| `openclaw.install.expectedIntegrity`                              | Verwachte npm dist-integriteitstekenreeks zoals `sha512-...`; installatie- en updateflows veriferen het opgehaalde artefact hiertegen.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Staat een smal herstelpad voor herinstallatie van gebundelde Plugins toe wanneer configuratie ongeldig is.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Laat kanaaloppervlakken die alleen setup nodig hebben laden vóór de volledige kanaal-Plugin tijdens het opstarten.                                                                    |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes in onboarding verschijnen voordat runtimes laden. `package.json#openclaw.install` vertelt onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die keuzes selecteert. Verplaats installatiehints niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en bij het laden van het manifestregister voor niet-gebundelde Plugin-bronnen. Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden slaan externe Plugins over op oudere hosts. Gebundelde bron-Plugins worden geacht mee geversioneerd te zijn met de hostcheckout.

Exacte npm-versiepinnen staan al in `npmSpec`, bijvoorbeeld `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiele externe catalogusvermeldingen moeten exacte specs koppelen aan `expectedIntegrity`, zodat updateflows gesloten falen als het opgehaalde npm-artefact niet langer overeenkomt met de gepinde release. Interactieve onboarding biedt nog steeds vertrouwde registry-npm-specs, inclusief kale pakketnamen en dist-tags, voor compatibiliteit. Catalogusdiagnostiek kan onderscheid maken tussen exacte, zwevende, integriteit-gepinde, ontbrekende-integriteit-, pakketnaam-mismatch- en ongeldige standaardkeuzebronnen. Ze waarschuwen ook wanneer `expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee kan worden gepind. Wanneer `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows deze af; wanneer deze ontbreekt, wordt de registry-resolutie vastgelegd zonder integriteitspin.

Kanaal-Plugins moeten `openclaw.setupEntry` bieden wanneer status-, kanaallijst- of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige runtime te laden. De setup-entry moet kanaalmetadata plus setup-veilige adapters voor configuratie, status en geheimen blootstellen; houd netwerkclients, Gateway-listeners en transportruntimes in het hoofd-entrypoint van de extensie.

Runtime-entrypointvelden overschrijven pakketgrenscontroles voor bron-entrypointvelden niet. `openclaw.runtimeExtensions` kan bijvoorbeeld een ontsnappend `openclaw.extensions`-pad niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt willekeurige kapotte configuraties niet installeerbaar. Vandaag staat het alleen toe dat installatieflows herstellen van specifieke verouderde upgradefouten van gebundelde Plugins, zoals een ontbrekend pad voor een gebundelde Plugin of een verouderde `channels.<id>`-vermelding voor diezelfde gebundelde Plugin. Niet-gerelateerde configuratiefouten blokkeren installatie nog steeds en verwijzen operators naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine checkermodule:

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

Gebruik dit wanneer setup-, doctor-, status- of alleen-lezen-aanwezigheidsflows een goedkope ja/nee-auth-probe nodig hebben voordat de volledige kanaal-Plugin laadt. Behouden auth-status is geen geconfigureerde kanaalstatus: gebruik deze metadata niet om Plugins automatisch in te schakelen, runtime-afhankelijkheden te repareren of te beslissen of een kanaalruntime moet laden. De doelsexport moet een kleine functie zijn die alleen behouden status leest; routeer deze niet via de volledige runtime-barrel van het kanaal.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope geconfigureerde controles alleen via env:

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

Gebruik dit wanneer een kanaal geconfigureerde status kan beantwoorden vanuit env of andere kleine niet-runtime-inputs. Als de controle volledige configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan in de Plugin-hook `config.hasConfiguredState`.

## Ontdekkingsprioriteit (dubbele Plugin-id's)

OpenClaw ontdekt Plugins vanuit meerdere roots (gebundeld, globale installatie, workspace, expliciete door configuratie geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste prioriteit** behouden; duplicaten met lagere prioriteit worden verwijderd in plaats van ernaast te laden.

Prioriteit, van hoog naar laag:

1. **Door configuratie geselecteerd** — een pad dat expliciet is gepind in `plugins.entries.<id>`
2. **Gebundeld** — Plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — Plugins die zijn geinstalleerd in de globale OpenClaw-Plugin-root
4. **Workspace** — Plugins die relatief ten opzichte van de huidige workspace worden ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde Plugin in de workspace overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin daadwerkelijk te overschrijven met een lokale, pin je die via `plugins.entries.<id>` zodat die wint op basis van prioriteit in plaats van te vertrouwen op workspace-ontdekking.
- Verwijderde duplicaten worden gelogd zodat Doctor en opstartdiagnostiek naar de weggegooide kopie kunnen wijzen.
- Dubbele overrides die door configuratie zijn geselecteerd worden in diagnostiek verwoord als expliciete overrides, maar waarschuwen nog steeds zodat verouderde forks en accidentele overschaduwingen zichtbaar blijven.

## JSON Schema-vereisten

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van configuratie, niet tijdens runtime.
- Wanneer je een gebundelde Plugin uitbreidt of forkt met nieuwe configuratiesleutels, werk dan tegelijk de `configSchema` in `openclaw.plugin.json` van die Plugin bij. Schema's van gebundelde Plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` in gebruikersconfiguratie zonder `myNewKey` toe te voegen aan `configSchema.properties` wordt geweigerd voordat de Plugin-runtime laadt.

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

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id door een Plugin-manifest is gedeclareerd.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*` moeten verwijzen naar **ontdekbare** Plugin-id's. Onbekende id's zijn **fouten**.
- Als een Plugin is geinstalleerd maar een kapot of ontbrekend manifest of schema heeft, faalt validatie en rapporteert Doctor de Plugin-fout.
- Als Plugin-configuratie bestaat maar de Plugin **uitgeschakeld** is, wordt de configuratie behouden en verschijnt er een **waarschuwing** in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief lokale bestandssysteemladingen. Runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor ontdekking + validatie.
- Native manifesten worden geparseerd met JSON5, dus opmerkingen, afsluitende komma's en niet-geciteerde sleutels worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestlader. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische metagegevens van de providercatalogus of beperkte ontdekkingsdescriptors, niet voor uitvoering tijdens verzoeken.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Metagegevens voor omgevingsvariabelen (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) zijn alleen declaratief. Status, audit, validatie van Cron-bezorging en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activeringsbeleid toe voordat een omgevingsvariabele als geconfigureerd wordt behandeld.
- Voor runtime-wizardmetagegevens waarvoor providercode nodig is, zie [Provider-runtimehooks](/nl/plugins/architecture-internals#provider-runtime-hooks).
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlist-vereisten van de pakketbeheerder (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Pluginarchitectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitsmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Referentie voor de Plugin SDK en subpadimports.
  </Card>
</CardGroup>
