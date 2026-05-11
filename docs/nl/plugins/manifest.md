---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configuratieschema leveren of Plugin-validatiefouten opsporen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-05-11T20:40:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **native OpenClaw-Pluginmanifest**.

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

Elke native OpenClaw-Plugin **moet** een `openclaw.plugin.json`-bestand leveren in de
**Plugin-root**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugin-code uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
Plugin-fouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het Pluginsysteem: [Plugins](/nl/tools/plugin).
Voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit:
[Capaciteitsmodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugin-code laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Plugin-runtime te starten.

**Gebruik het voor:**

- Plugin-identiteit, configuratievalidatie en hints voor de configuratie-UI
- metadata voor auth, onboarding en installatie (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activeringshints voor control-plane-oppervlakken
- eigenaarschap van verkorte modelfamilies
- statische momentopnamen van capaciteits-eigenaarschap (`contracts`)
- metadata voor de QA-runner die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata samengevoegd in catalogus- en validatieoppervlakken

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

| Veld                                 | Vereist  | Type                             | Wat het betekent                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja       | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                      |
| `configSchema`                       | Ja       | `object`                         | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                            |
| `enabledByDefault`                   | Nee      | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een niet-`true` waarde in, om de Plugin standaard uitgeschakeld te laten.                                                                          |
| `enabledByDefaultOnPlatforms`        | Nee      | `string[]`                       | Markeert een gebundelde Plugin alleen als standaard ingeschakeld op de vermelde Node.js-platforms, bijvoorbeeld `["darwin"]`. Expliciete configuratie heeft nog steeds voorrang.                                                    |
| `legacyPluginIds`                    | Nee      | `string[]`                       | Verouderde ids die naar deze canonieke Plugin-id worden genormaliseerd.                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | Nee      | `string[]`                       | Provider-ids die deze Plugin automatisch moeten inschakelen wanneer auth, configuratie of modelverwijzingen ze noemen.                                                                                                             |
| `kind`                               | Nee      | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                   |
| `channels`                           | Nee      | `string[]`                       | Kanaal-ids die eigendom zijn van deze Plugin. Gebruikt voor discovery en configuratievalidatie.                                                                                                                                      |
| `providers`                          | Nee      | `string[]`                       | Provider-ids die eigendom zijn van deze Plugin.                                                                                                                                                                                     |
| `providerCatalogEntry`               | Nee      | `string`                         | Lichtgewicht modulepad voor de provider-catalogus, relatief aan de Plugin-root, voor manifest-gebonden provider-catalogusmetadata die kan worden geladen zonder de volledige Plugin-runtime te activeren.                           |
| `modelSupport`                       | Nee      | `object`                         | Door het manifest beheerde verkorte metadata voor modelfamilies die wordt gebruikt om de Plugin vóór runtime automatisch te laden.                                                                                                  |
| `modelCatalog`                       | Nee      | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-plane contract voor toekomstige alleen-lezenlijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder Plugin-runtime te laden. |
| `modelPricing`                       | Nee      | `object`                         | Door de provider beheerd beleid voor externe prijsopzoeking. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te laten stappen of providerverwijzingen naar OpenRouter/LiteLLM-catalogus-ids te mappen zonder provider-ids hard te coderen in de core. |
| `modelIdNormalization`               | Nee      | `object`                         | Door de provider beheerde opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime wordt geladen.                                                                                            |
| `providerEndpoints`                  | Nee      | `object[]`                       | Door het manifest beheerde endpoint host/baseUrl-metadata voor providerroutes die de core moet classificeren voordat de provider-runtime wordt geladen.                                                                              |
| `providerRequest`                    | Nee      | `object`                         | Goedkope providerfamilie- en verzoekcompatibiliteitsmetadata die door generiek aanvraagbeleid wordt gebruikt voordat de provider-runtime wordt geladen.                                                                              |
| `cliBackends`                        | Nee      | `string[]`                       | CLI-inferentiebackend-ids die eigendom zijn van deze Plugin. Gebruikt voor automatische activering bij opstarten vanuit expliciete configuratieverwijzingen.                                                                         |
| `syntheticAuthRefs`                  | Nee      | `string[]`                       | Provider- of CLI-backendverwijzingen waarvan de door de Plugin beheerde synthetische auth-hook moet worden onderzocht tijdens koude modeldiscovery voordat runtime wordt geladen.                                                    |
| `nonSecretAuthMarkers`               | Nee      | `string[]`                       | Door gebundelde Plugins beheerde tijdelijke API-sleutelwaarden die niet-geheime lokale, OAuth- of ambient credential-status vertegenwoordigen.                                                                                      |
| `commandAliases`                     | Nee      | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en die Plugin-bewuste configuratie- en CLI-diagnostiek moeten produceren voordat runtime wordt geladen.                                                                              |
| `providerAuthEnvVars`                | Nee      | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor provider-auth/statusopzoeking. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog steeds tijdens de afschrijvingsperiode.                   |
| `providerAuthAliases`                | Nee      | `Record<string, string>`         | Provider-ids die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codingprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                   |
| `channelEnvVars`                     | Nee      | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor env-gestuurde kanaalsetup of auth-oppervlakken die generieke opstart-/configuratiehelpers moeten zien.                     |
| `providerAuthChoices`                | Nee      | `object[]`                       | Goedkope metadata voor auth-keuzes voor onboardingkiezers, voorkeursproviderresolutie en eenvoudige CLI-flagbedrading.                                                                                                             |
| `activation`                         | Nee      | `object`                         | Goedkope metadata voor activatieplanning voor opstarten en door provider-, commando-, kanaal-, route- en capability getriggerd laden. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.             |
| `setup`                              | Nee      | `object`                         | Goedkope setup-/onboardingbeschrijvingen die discovery- en setup-oppervlakken kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                                 |
| `qaRunners`                          | Nee      | `object[]`                       | Goedkope QA-runnerbeschrijvingen die worden gebruikt door de gedeelde `openclaw qa`-host voordat de Plugin-runtime wordt geladen.                                                                                                  |
| `contracts`                          | Nee      | `object`                         | Statische momentopname van capability-eigendom voor externe auth-hooks, spraak, realtime transcriptie, realtime spraak, mediabegrip, beeldgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoekopdrachten en tool-eigendom. |
| `mediaUnderstandingProviderMetadata` | Nee      | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-ids die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                      |
| `imageGenerationProviderMetadata`    | Nee      | `Record<string, object>`         | Goedkope auth-metadata voor beeldgeneratie voor provider-ids die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief door providers beheerde auth-aliassen en base-url-bewakers.                                   |
| `videoGenerationProviderMetadata`    | Nee      | `Record<string, object>`         | Goedkope auth-metadata voor videogeneratie voor provider-ids die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief door providers beheerde auth-aliassen en base-url-bewakers.                                  |
| `musicGenerationProviderMetadata`    | Nee      | `Record<string, object>`         | Goedkope auth-metadata voor muziekgeneratie voor provider-ids die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief door providers beheerde auth-aliassen en base-url-bewakers.                                 |
| `toolMetadata`                       | Nee      | `Record<string, object>`         | Goedkope beschikbaarheidsmetadata voor door Plugins beheerde tools die zijn gedeclareerd in `contracts.tools`. Gebruik dit wanneer een tool geen runtime mag laden tenzij er configuratie-, env- of auth-bewijs bestaat.             |
| `channelConfigs`                     | Nee      | `Record<string, object>`         | Door het manifest beheerde kanaalconfiguratiemetadata die in discovery- en validatie-oppervlakken wordt samengevoegd voordat runtime wordt geladen.                                                                                  |
| `skills`                             | Nee      | `string[]`                       | Skill-mappen om te laden, relatief aan de Plugin-root.                                                                                                                                                                             |
| `name`                               | Nee      | `string`                         | Menselijk leesbare pluginnaam.                                                                                                                                                                                                      |
| `description`                        | Nee      | `string`                         | Korte samenvatting die in pluginoppervlakken wordt getoond.                                                                                                                                                                         |
| `version`                            | Nee      | `string`                         | Informatieve pluginversie.                                                                                                                                                                                                          |
| `uiHints`                            | Nee      | `Record<string, object>`         | UI-labels, plaatsaanduidingen en aanwijzingen voor gevoeligheid van configuratievelden.                                                                                                                                             |

## Referentie voor metagegevens van generatieproviders

De metagegevensvelden van generatieproviders beschrijven statische auth-signalen voor
providers die zijn gedeclareerd in de bijbehorende lijst `contracts.*GenerationProviders`.
OpenClaw leest deze velden voordat de runtime van de provider wordt geladen, zodat kerntools
kunnen bepalen of een generatieprovider beschikbaar is zonder elke
providerplugin te importeren.

Gebruik deze velden alleen voor goedkope, declaratieve feiten. Transport, aanvraag-
transformaties, tokenvernieuwing, validatie van inloggegevens en daadwerkelijk generatiegedrag
blijven in de pluginruntime.

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

Elke metagegevensvermelding ondersteunt:

| Veld            | Vereist | Type       | Wat het betekent                                                                                                                        |
| --------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nee      | `string[]` | Extra provider-id's die moeten meetellen als statische auth-aliassen voor de generatieprovider.                                         |
| `authProviders` | Nee      | `string[]` | Provider-id's waarvan de geconfigureerde auth-profielen moeten meetellen als auth voor deze generatieprovider.                          |
| `configSignals` | Nee      | `object[]` | Goedkope, alleen op configuratie gebaseerde beschikbaarheidssignalen voor lokale of zelf gehoste providers die kunnen worden geconfigureerd zonder auth-profielen of env-vars. |
| `authSignals`   | Nee      | `object[]` | Expliciete auth-signalen. Indien aanwezig vervangen deze de standaardset signalen uit de provider-id, `aliases` en `authProviders`.      |

Elke `configSignals`-vermelding ondersteunt:

| Veld          | Vereist | Type       | Wat het betekent                                                                                                                                                                           |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | Ja       | `string`   | Puntpad naar het configuratieobject dat eigendom is van de plugin om te inspecteren, bijvoorbeeld `plugins.entries.example.config`.                                                        |
| `overlayPath` | Nee      | `string`   | Puntpad binnen de rootconfiguratie waarvan het object het rootobject moet overlayen voordat het signaal wordt geëvalueerd. Gebruik dit voor capability-specifieke configuratie zoals `image`, `video` of `music`. |
| `required`    | Nee      | `string[]` | Puntpaden binnen de effectieve configuratie die geconfigureerde waarden moeten hebben. Strings mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                              |
| `requiredAny` | Nee      | `string[]` | Puntpaden binnen de effectieve configuratie waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                              |
| `mode`        | Nee      | `object`   | Optionele stringmodusguard binnen de effectieve configuratie. Gebruik dit wanneer alleen-configuratiebeschikbaarheid slechts op één modus van toepassing is.                              |

Elke `mode`-guard ondersteunt:

| Veld         | Vereist | Type       | Wat het betekent                                                                    |
| ------------ | -------- | ---------- | ----------------------------------------------------------------------------------- |
| `path`       | Nee      | `string`   | Puntpad binnen de effectieve configuratie. Standaard is `mode`.                     |
| `default`    | Nee      | `string`   | Moduswaarde om te gebruiken wanneer de configuratie het pad weglaat.                |
| `allowed`    | Nee      | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is. |
| `disallowed` | Nee      | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is. |

Elke `authSignals`-vermelding ondersteunt:

| Veld              | Vereist | Type     | Wat het betekent                                                                                                                                                                  |
| ----------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja       | `string` | Provider-id om te controleren in geconfigureerde auth-profielen.                                                                                                                  |
| `providerBaseUrl` | Nee      | `object` | Optionele guard die het signaal alleen laat meetellen wanneer de gerefereerde geconfigureerde provider een toegestane basis-URL gebruikt. Gebruik dit wanneer een auth-alias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-guard ondersteunt:

| Veld              | Vereist | Type       | Wat het betekent                                                                                                                                       |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`        | Ja       | `string`   | Providerconfiguratie-id waarvan `baseUrl` moet worden gecontroleerd.                                                                                   |
| `defaultBaseUrl`  | Nee      | `string`   | Basis-URL om aan te nemen wanneer de providerconfiguratie `baseUrl` weglaat.                                                                           |
| `allowedBaseUrls` | Ja       | `string[]` | Toegestane basis-URL's voor dit auth-signaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaardbasis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Referentie voor toolmetagegevens

`toolMetadata` gebruikt dezelfde vormen voor `configSignals` en `authSignals` als
metagegevens van generatieproviders, geïndexeerd op toolnaam. `contracts.tools` declareert
eigenaarschap. `toolMetadata` declareert goedkoop beschikbaarheidsbewijs zodat OpenClaw kan
voorkomen dat een pluginruntime wordt geïmporteerd alleen om de toolfactory `null` te laten retourneren.

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
laadt het de eigenaarplugin wanneer het toolcontract overeenkomt met beleid. Voor hot-path
tools waarvan de factory afhankelijk is van auth/configuratie, moeten pluginauteurs
`toolMetadata` declareren in plaats van core runtime te laten importeren om het te vragen.

## Referentie voor providerAuthChoices

Elke `providerAuthChoices`-vermelding beschrijft één onboarding- of auth-keuze.
OpenClaw leest dit voordat de runtime van de provider wordt geladen.
Providerinstallatielijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide installatiekeuzes
en metagegevens uit de installatiecatalogus zonder de runtime van de provider te laden.

| Veld                  | Vereist | Type                                            | Wat het betekent                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja       | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                    |
| `method`              | Ja       | `string`                                        | Auth-method-id waarnaar moet worden gedispatcht.                                                           |
| `choiceId`            | Ja       | `string`                                        | Stabiele auth-keuze-id die wordt gebruikt door onboarding- en CLI-flows.                                   |
| `choiceLabel`         | Nee      | `string`                                        | Gebruikersgericht label. Indien weggelaten valt OpenClaw terug op `choiceId`.                              |
| `choiceHint`          | Nee      | `string`                                        | Korte helptekst voor de kiezer.                                                                            |
| `assistantPriority`   | Nee      | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistent gestuurde interactieve kiezers.               |
| `assistantVisibility` | Nee      | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistentkiezers terwijl handmatige CLI-selectie nog steeds mogelijk blijft.         |
| `deprecatedChoiceIds` | Nee      | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten omleiden.                          |
| `groupId`             | Nee      | `string`                                        | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                            |
| `groupLabel`          | Nee      | `string`                                        | Gebruikersgericht label voor die groep.                                                                    |
| `groupHint`           | Nee      | `string`                                        | Korte helptekst voor de groep.                                                                             |
| `optionKey`           | Nee      | `string`                                        | Interne optiesleutel voor eenvoudige auth-flows met één flag.                                              |
| `cliFlag`             | Nee      | `string`                                        | CLI-flagnaam, zoals `--openrouter-api-key`.                                                                |
| `cliOption`           | Nee      | `string`                                        | Volledige CLI-optievorm, zoals `--openrouter-api-key <key>`.                                               |
| `cliDescription`      | Nee      | `string`                                        | Beschrijving die wordt gebruikt in CLI-help.                                                               |
| `onboardingScopes`    | Nee      | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten is de standaard `["text-inference"]`. |

## Referentie voor commandAliases

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers
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
| `cliCommand` | Nee     | `string`          | Gerelateerde root-CLI-opdracht om voor CLI-bewerkingen voor te stellen, als die bestaat. |

## activatiereferentie

Gebruik `activation` wanneer de plugin goedkoop kan declareren welke control-plane-gebeurtenissen
deze moeten opnemen in een activatie-/laadplan.

Dit blok is planner-metadata, geen levenscyclus-API. Het registreert geen
runtimegedrag, vervangt `register(...)` niet en belooft niet dat
plugincode al is uitgevoerd. De activatieplanner gebruikt deze velden om
kandidaat-plugins te beperken voordat wordt teruggevallen op bestaande manifest-eigenaarschapsmetadata
zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigenaarschap al beschrijft. Gebruik
`providers`, `channels`, `commandAliases`, setup-descriptors of `contracts`
wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra planner-hints
die niet door die eigenaarschapsvelden kunnen worden weergegeven.
Gebruik top-level `cliBackends` voor CLI-runtimealiases zoals `claude-cli`,
`codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor
ingebedde agent-harness-id's die nog geen eigenaarschapsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt
`register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet.
Huidige consumers gebruiken het als een beperkende hint vóór breder laden van plugins, dus
ontbrekende niet-opstartactivatiemetadata kost meestal alleen prestaties; het
zou de correctheid niet moeten veranderen zolang manifest-eigenaarschapsfallbacks nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen. Stel dit alleen in op `true`
wanneer de plugin tijdens het opstarten van de Gateway moet draaien. Stel dit in op `false` wanneer
de plugin inert is bij het opstarten en alleen via smallere triggers moet laden.
Het weglaten van `onStartup` laadt de plugin niet langer impliciet bij het opstarten; gebruik expliciete
activatiemetadata voor opstart-, kanaal-, config-, agent-harness-, geheugen- of
andere smallere activatietriggers.

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

| Veld               | Vereist | Type                                                 | Wat het betekent                                                                                                                                                                               |
| ------------------ | ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-opstartactivatie. Elke plugin moet dit instellen. `true` importeert de plugin tijdens het opstarten; `false` houdt deze opstart-lazy tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                        |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingebedde agent-harness-runtime-id's die deze plugin moeten opnemen in activatie-/laadplannen. Gebruik top-level `cliBackends` voor CLI-backendaliases.                                       |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                        |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                          |
| `onRoutes`         | Nee     | `string[]`                                           | Route-soorten die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                        |
| `onConfigPaths`    | Nee     | `string[]`                                           | Root-relatieve configpaden die deze plugin moeten opnemen in opstart-/laadplannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                             |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capaciteitshints die worden gebruikt door control-plane-activatieplanning. Geef waar mogelijk de voorkeur aan smallere velden.                                                           |

Huidige live consumers:

- Gateway-opstartplanning gebruikt `activation.onStartup` voor expliciete opstartimport
- door opdrachten getriggerde CLI-planning valt terug op legacy
  `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-opstartplanning gebruikt `activation.onAgentHarnesses` voor
  ingebedde harnesses en top-level `cliBackends[]` voor CLI-runtimealiases
- door kanalen getriggerde setup-/kanaalplanning valt terug op legacy `channels[]`-eigenaarschap
  wanneer expliciete kanaalactivatiemetadata ontbreekt
- pluginplanning bij opstarten gebruikt `activation.onConfigPaths` voor niet-kanaal-root
  config-oppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy
  `providers[]` en top-level `cliBackends[]`-eigenaarschap wanneer expliciete provideractivatiemetadata
  ontbreekt

Planner-diagnostiek kan expliciete activatiehints onderscheiden van manifest-eigenaarschapsfallback.
Bijvoorbeeld, `activation-command-hint` betekent dat
`activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de
planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn voor
hostdiagnostiek en tests; plugin-auteurs moeten de metadata blijven declareren
die eigenaarschap het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners toevoegt onder
de gedeelde `openclaw qa`-root. Houd deze metadata goedkoop en statisch; de plugin-runtime
blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht
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

| Veld          | Vereist | Type     | Wat het betekent                                                      |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Ja      | `string` | Subopdracht gekoppeld onder `openclaw qa`, bijvoorbeeld `matrix`.     |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stubopdracht nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboardingoppervlakken goedkope plugin-eigen metadata
nodig hebben voordat runtimes laden.

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

Top-level `cliBackends` blijft geldig en blijft CLI-inferentiebackends beschrijven.
`setup.cliBackends` is het setup-specifieke descriptoroppervlak voor
control-plane-/setupflows die metadata-only moeten blijven.

Wanneer aanwezig, zijn `setup.providers` en `setup.cliBackends` het voorkeursoppervlak
voor descriptor-first lookup bij setupdetectie. Als de descriptor alleen
de kandidaat-plugin beperkt en setup nog rijkere runtimehooks voor setup nodig heeft,
stel dan `requiresRuntime: true` in en houd `setup-api` op zijn plaats als het
fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-authenticatie- en
env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
tijdens de deprecatieperiode, maar niet-gebundelde plugins die dit nog gebruiken
ontvangen een manifestdiagnose. Nieuwe plugins moeten setup-/status-env-metadata
op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods`
wanneer er geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false`
declareert dat setup-runtime niet nodig is. Expliciete `providerAuthChoices`-entries blijven
de voorkeur houden voor aangepaste labels, CLI-flags, onboardingbereik en assistentmetadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor het
setupoppervlak. OpenClaw behandelt expliciet `false` als een descriptor-only contract
en voert `setup-api` of `openclaw.setupEntry` niet uit voor setup-lookup. Als
een descriptor-only plugin nog steeds een van die setup-runtime-entries levert,
rapporteert OpenClaw een additieve diagnose en blijft die negeren. Een weggelaten
`requiresRuntime` behoudt legacy fallbackgedrag zodat bestaande plugins die
descriptors zonder de vlag hebben toegevoegd niet breken.

Omdat setup-lookup plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
waarden voor `setup.providers[].id` en `setup.cliBackends[]` uniek blijven in alle
ontdekte plugins. Ambigu eigenaarschap faalt gesloten in plaats van een
winnaar uit ontdekkingsvolgorde te kiezen.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteert setupregistry-diagnostiek descriptorafwijking
als `setup-api` een provider of CLI-backend registreert die de manifestdescriptors
niet declareren, of als een descriptor geen overeenkomende runtimeregistratie
heeft. Deze diagnoses zijn additief en wijzen legacy plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                     |
| -------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `id`           | Ja      | `string`   | Provider-id zichtbaar tijdens setup of onboarding. Houd genormaliseerde id's wereldwijd uniek.       |
| `authMethods`  | Nee     | `string[]` | Setup-/authenticatiemethode-id's die deze provider ondersteunt zonder volledige runtime te laden.    |
| `envVars`      | Nee     | `string[]` | Env-vars die generieke setup-/statusoppervlakken kunnen controleren voordat de plugin-runtime laadt. |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale authenticatiebewijscontroles voor providers die kunnen authenticeren via niet-geheime markers. |

`authEvidence` is voor lokale credentialmarkers die eigendom zijn van de provider en kunnen worden
geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkaanroepen, geen leesbewerkingen uit keychains of secretmanagers, geen shellopdrachten en geen
provider-API-probes.

Ondersteunde bewijsvermeldingen:

| Veld               | Vereist | Type       | Betekenis                                                                                                           |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja       | `string`   | Momenteel `local-file-with-env`.                                                                                    |
| `fileEnvVar`       | Nee      | `string`   | Omgevingsvariabele met een expliciet credentialbestandspad.                                                         |
| `fallbackPaths`    | Nee      | `string[]` | Lokale credentialbestandspaden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee      | `string[]` | Minstens een van de vermelde omgevingsvariabelen moet niet-leeg zijn voordat het bewijs geldig is.                  |
| `requiresAllEnv`   | Nee      | `string[]` | Elke vermelde omgevingsvariabele moet niet-leeg zijn voordat het bewijs geldig is.                                  |
| `credentialMarker` | Ja       | `string`   | Niet-geheime marker die wordt geretourneerd wanneer het bewijs aanwezig is.                                         |
| `source`           | Nee      | `string`   | Gebruikersgericht bronlabel voor auth/status-uitvoer.                                                               |

### setup-velden

| Veld               | Vereist | Type       | Betekenis                                                                                              |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nee      | `object[]` | Provider-setupdescriptors die tijdens setup en onboarding worden weergegeven.                          |
| `cliBackends`      | Nee      | `string[]` | Backend-id's voor setuptijd die worden gebruikt voor descriptor-eerst setup-lookup. Houd genormaliseerde id's wereldwijd uniek. |
| `configMigrations` | Nee      | `string[]` | Configmigratie-id's die eigendom zijn van het setup-oppervlak van deze plugin.                         |
| `requiresRuntime`  | Nee      | `boolean`  | Of setup na descriptor-lookup nog uitvoering van `setup-api` nodig heeft.                              |

## uiHints-referentie

`uiHints` is een map van configveldnamen naar kleine rendering-hints.

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

| Veld          | Type       | Betekenis                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Gebruikersgericht veldlabel.               |
| `help`        | `string`   | Korte helptekst.                           |
| `tags`        | `string[]` | Optionele UI-tags.                         |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.         |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.  |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.     |

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
| `embeddedExtensionFactories`     | `string[]` | Codex app-server-extensiefactory-id's, momenteel `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor een gebundelde plugin tool-result-middleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze plugin de externe-auth-profielhook bezit.   |
| `speechProviders`                | `string[]` | Spraakprovider-id's die eigendom zijn van deze plugin.                 |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcriptieprovider-id's die eigendom zijn van deze plugin.  |
| `realtimeVoiceProviders`         | `string[]` | Realtime-spraakprovider-id's die eigendom zijn van deze plugin.        |
| `memoryEmbeddingProviders`       | `string[]` | Memory-embeddingprovider-id's die eigendom zijn van deze plugin.       |
| `mediaUnderstandingProviders`    | `string[]` | Media-understandingprovider-id's die eigendom zijn van deze plugin.    |
| `imageGenerationProviders`       | `string[]` | Afbeeldingsgeneratieprovider-id's die eigendom zijn van deze plugin.   |
| `videoGenerationProviders`       | `string[]` | Videogeneratieprovider-id's die eigendom zijn van deze plugin.         |
| `webFetchProviders`              | `string[]` | Web-fetchprovider-id's die eigendom zijn van deze plugin.              |
| `webSearchProviders`             | `string[]` | Web-searchprovider-id's die eigendom zijn van deze plugin.             |
| `migrationProviders`             | `string[]` | Importprovider-id's die deze plugin bezit voor `openclaw migrate`.     |
| `tools`                          | `string[]` | Agent-toolnamen die eigendom zijn van deze plugin.                     |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde Codex
app-server-only extensiefactories. Gebundelde tool-result-transformaties moeten
in plaats daarvan `contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-result-middleware registreren omdat de seam tooluitvoer met veel vertrouwen kan herschrijven
voordat het model die ziet.

Runtime-registraties met `api.registerTool(...)` moeten overeenkomen met `contracts.tools`.
Tool-discovery gebruikt deze lijst om alleen de pluginruntimes te laden die eigenaar kunnen zijn van de
aangevraagde tools.

Providerplugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie lopen nog steeds
via een verouderde compatibiliteitsfallback, maar die fallback is trager en
wordt na de migratieperiode verwijderd.

Gebundelde memory-embeddingproviders moeten
`contracts.memoryEmbeddingProviders` declareren voor elk adapter-id dat ze beschikbaar maken, inclusief
ingebouwde adapters zoals `local`. Zelfstandige CLI-paden gebruiken dit manifestcontract
om alleen de eigenaar-plugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understandingprovider
standaardmodellen, fallback-prioriteit voor auto-auth of native documentondersteuning heeft die
generieke core-helpers nodig hebben voordat runtimes laden. Sleutels moeten ook worden gedeclareerd in
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

| Veld                   | Type                                | Betekenis                                                                        |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediacapabilities die door deze provider worden aangeboden.                      |
| `defaultModels`        | `Record<string, string>`            | Capability-naar-model-standaarden die worden gebruikt wanneer config geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische credentialgebaseerde providerfallback. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                    |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een kanaalplugin goedkope configmetadata nodig heeft voordat
runtime laadt. Alleen-lezen discovery voor kanaalsetup/status kan deze metadata
direct gebruiken voor geconfigureerde externe kanalen wanneer er geen setupvermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` verklaart dat setupruntime overbodig is.

`channelConfigs` is pluginmanifestmetadata, geen nieuwe top-level gebruikersconfigsectie.
Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke plugin eigenaar is van dat geconfigureerde
kanaal voordat pluginruntimecode wordt uitgevoerd.

Voor een kanaalplugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-vermeldingen declareren. Zonder deze kan OpenClaw de plugin nog steeds laden, maar
cold-path configschema-, setup- en Control UI-oppervlakken kunnen de
kanaaleigen optiestructuur pas kennen wanneer pluginruntime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor command-config
checks die worden uitgevoerd voordat de kanaalruntime laadt. Gebundelde kanalen kunnen ook
dezelfde standaarden publiceren via `package.json#openclaw.channel.commands` naast
hun andere package-eigen kanaalcatalogusmetadata.

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

| Veld          | Type                     | Wat het betekent                                                                         |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratie.    |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoeligheidshints voor die kanaalconfiguratiesectie.   |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in selectie- en inspectieoppervlakken wanneer runtime-metadata niet klaar is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                       |
| `commands`    | `object`                 | Statische native command- en native skill-auto-standaarden voor configuratiecontroles vóór runtime. |
| `preferOver`  | `string[]`               | Verouderde of lager geprioriteerde plugin-id's die dit kanaal moet overtreffen in selectieoppervlakken. |

### Een andere kanaalplugin vervangen

Gebruik `preferOver` wanneer je plugin de voorkeurs-eigenaar is voor een kanaal-id dat
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
de voorkeurs-plugin-id. Als de lager geprioriteerde plugin alleen was geselecteerd omdat
deze gebundeld is of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtimeconfiguratie zodat één plugin eigenaar is van het kanaal en de tools ervan. Expliciete gebruikersselectie
wint nog steeds: als de gebruiker beide plugins expliciet inschakelt, behoudt OpenClaw
die keuze en meldt het dubbele kanaal-/tooldiagnostiek in plaats van
de aangevraagde pluginset stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot plugin-id's die echt hetzelfde kanaal kunnen leveren.
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

OpenClaw past deze volgorde toe:

- expliciete `provider/model`-referenties gebruiken de metadata van het eigenaar-`providers`-manifest
- `modelPatterns` gaan vóór `modelPrefixes`
- als één niet-gebundelde plugin en één gebundelde plugin beide overeenkomen, wint de niet-gebundelde
  plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider specificeert

Velden:

| Veld            | Type       | Wat het betekent                                                               |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden gematcht tegen verkorte model-id's.       |
| `modelPatterns` | `string[]` | Regex-bronnen die tegen verkorte model-id's worden gematcht na verwijdering van profielsuffixen. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw provider-modelmetadata moet kennen voordat
de pluginruntime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en ontdekkingsmodus. Runtimeverversing
hoort nog steeds thuis in providerruntimecode, maar het manifest vertelt core wanneer runtime
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

Topnivelevelden:

| Veld           | Type                                                     | Wat het betekent                                                                                              |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's waarvan deze plugin eigenaar is. Sleutels moeten ook voorkomen in `providers` op topniveau. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten verwijzen naar een provider in eigendom voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze plugin om providerspecifieke reden onderdrukt.                         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus uit manifestmetadata kan worden gelezen, in cache kan worden ververst, of runtime vereist. |

`aliases` neemt deel aan provider-eigenaarschaplookup voor modelcatalogusplanning.
Aliasdoelen moeten providers op topniveau zijn waarvan dezelfde plugin eigenaar is. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarmanifest lezen en
alias-API-/basis-URL-overschrijvingen toepassen zonder providerruntime te laden.
Aliassen breiden ongefilterde catalogusvermeldingen niet uit; brede lijsten geven alleen
de canonieke providerrijen van de eigenaar weer.

`suppressions` vervangt de oude providerruntime-hook `suppressBuiltInModel`.
Onderdrukkingsitems worden alleen gerespecteerd wanneer de provider eigendom is van de plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die verwijst naar een provider in eigendom. Runtime-
onderdrukkingshooks worden niet langer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                   |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus. |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder `id` worden genegeerd.           |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het `provider/`-prefix.                        |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                        |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                        |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                  |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                         |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                         |
| `reasoning`     | `boolean`                                                      | Of het model reasoning-gedrag beschikbaar maakt.                               |
| `contextWindow` | `number`                                                       | Native providercontextvenster.                                                 |
| `contextTokens` | `number`                                                       | Optionele effectieve runtimecontextlimiet wanneer die verschilt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximumaantal outputtokens wanneer bekend.                                     |
| `cost`          | `object`                                                       | Optionele USD-prijzen per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Alleen onderdrukken wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.             |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die door dit model worden vervangen.          |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                     |
| `tags`          | `string[]`                                                     | Stabiele tags die door pickers en filters worden gebruikt.                     |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                           |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstreamrij die moet worden onderdrukt. Moet eigendom zijn van deze plugin of gedeclareerd zijn als een alias in eigendom. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                                        |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij direct wordt aangevraagd.                   |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve provider-basis-URL-hosts die vereist zijn voordat de onderdrukking geldt.   |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen gegevens die alleen runtime zijn in `modelCatalog`. Gebruik `static` alleen wanneer manifest
rijen volledig genoeg zijn zodat op provider gefilterde lijst- en kiezeroppervlakken
registry-/runtime-detectie kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige
lijstbare zaden of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen;
refreshable-rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
de provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, door de provider beheerde opschoning van model-id's die moet
gebeuren voordat de provider-runtime wordt geladen. Dit houdt aliassen zoals korte modelnamen,
provider-lokale verouderde id's en proxy-prefixregels in het manifest van de eigenaar-Plugin
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

| Veld                                 | Type                    | Wat het betekent                                                                                  |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exacte model-id-aliassen, hoofdletterongevoelig. Waarden worden teruggegeven zoals geschreven.    |
| `stripPrefixes`                      | `string[]`              | Prefixen om te verwijderen voor aliassen worden opgezocht, nuttig voor verouderde provider/model-duplicatie. |
| `prefixWhenBare`                     | `string`                | Prefix om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.                   |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke bare-id-prefixregels na alias-opzoeking, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat de provider-runtime wordt geladen. De kern blijft eigenaar van de betekenis van elke
`endpointClass`; pluginmanifests bezitten de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Wat het betekent                                                                                 |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | Bekende kern-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.           |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de endpointklasse worden gekoppeld.                                     |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die aan de endpointklasse worden gekoppeld. Prefix met `.` voor alleen domeinsuffix-matching. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de endpointklasse worden gekoppeld.           |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                         |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van overeenkomende hosts te verwijderen om de Google Vertex-regioprefix zichtbaar te maken. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata voor aanvraagcompatibiliteit die generiek
aanvraagbeleid nodig heeft zonder de provider-runtime te laden. Houd gedragsspecifieke
payload-herschrijving in provider-runtimehooks of gedeelde helpers voor providerfamilies.

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

| Veld                  | Type         | Wat het betekent                                                                          |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `family`              | `string`     | Providerfamilielabel dat wordt gebruikt door generieke beslissingen en diagnostiek voor aanvraagcompatibiliteit. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitsbucket voor providerfamilies voor gedeelde aanvraaghelpers.     |
| `openAICompletions`   | `object`     | OpenAI-compatibele completions-aanvraagvlaggen, momenteel `supportsStreamingUsage`.       |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider control-plane-prijsgedrag nodig heeft voordat
de runtime wordt geladen. De Gateway-prijscache leest deze metadata zonder
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

| Veld         | Type              | Wat het betekent                                                                                 |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelfgehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking voor deze provider uit. |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking voor deze provider uit.   |

Bronvelden:

| Veld                       | Type               | Wat het betekent                                                                                                        |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogusprovider-id wanneer die afwijkt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met schuine strepen als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra externe catalogusvarianten voor model-id's. `version-dots` probeert gestippelde versie-id's zoals `claude-opus-4.6`. |

### OpenClaw Provider Index

De OpenClaw Provider Index is door OpenClaw beheerde previewmetadata voor providers
waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een pluginmanifest.
Pluginmanifests blijven de autoriteit voor geïnstalleerde plugins. De Provider Index is
het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install
modelkiezers zullen gebruiken wanneer een providerplugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd pluginmanifest `modelCatalog`.
3. Modelcataloguscache van expliciete refresh.
4. Previewrijen van OpenClaw Provider Index.

De Provider Index mag geen geheimen, ingeschakelde status, runtimehooks of
live accountspecifieke modelgegevens bevatten. De previewcatalogi gebruiken dezelfde
`modelCatalog`-provider-rijvorm als pluginmanifests, maar moeten beperkt blijven
tot stabiele weergavemetadata tenzij runtime-adaptervelden zoals `api`,
`baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op
het geïnstalleerde pluginmanifest. Providers met live `/models`-detectie moeten
ververste rijen schrijven via het expliciete cachepad voor de modelcatalogus in plaats van
normale lijst- of onboarding-aanroepen provider-API's te laten aanroepen.

Provider Index-items kunnen ook metadata voor installeerbare plugins bevatten voor providers
waarvan de plugin uit de kern is verplaatst of anders nog niet is geïnstalleerd. Deze
metadata weerspiegelt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie,
verwachte integriteit en goedkope labels voor auth-keuzes zijn genoeg om een
installeerbare setupoptie te tonen. Zodra de plugin is geïnstalleerd, wint het manifest ervan en
wordt het Provider Index-item voor die provider genegeerd.

Verouderde capability-sleutels op topniveau zijn verouderd. Gebruik `openclaw doctor --fix` om
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` en `webSearchProviders` onder `contracts` te plaatsen; normaal
laden van manifests behandelt die velden op topniveau niet langer als capability-eigenaarschap.

## Manifest versus package.json

De twee bestanden dienen verschillende doelen:

| Bestand                | Gebruik het voor                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configvalidatie, auth-keuzemetadata en UI-hints die moeten bestaan voordat plugincode wordt uitgevoerd                |
| `package.json`         | npm-metadata, installatie van afhankelijkheden en het `openclaw`-blok dat wordt gebruikt voor entrypoints, install gating, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat plugincode wordt geladen, zet het dan in `openclaw.plugin.json`
- als het gaat over packaging, entrybestanden of npm-installatiegedrag, zet het dan in `package.json`

### package.json-velden die detectie beïnvloeden

Sommige pre-runtime pluginmetadata leeft bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.
`openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw-plugincontracten;
native plugins moeten `openclaw.plugin.json` plus de ondersteunde
`package.json#openclaw`-velden hieronder gebruiken.

Belangrijke voorbeelden:

| Veld                                                                                       | Wat het betekent                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Declareert native plugin-ingangspunten. Moet binnen de pakketmap van de plugin blijven.                                                                                                    |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-ingangspunten voor geïnstalleerde pakketten. Moet binnen de pakketmap van de plugin blijven.                                                       |
| `openclaw.setupEntry`                                                                      | Lichtgewicht ingangspunt uitsluitend voor installatie, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus/SecretRef-detectie. Moet binnen de pakketmap van de plugin blijven. |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-installatie-ingangspunt voor geïnstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de pakketmap van de plugin blijven.           |
| `openclaw.channel`                                                                         | Goedkope kanaalcatalogusmetadata zoals labels, docspaden, aliassen en selectietekst.                                                                                                       |
| `openclaw.channel.commands`                                                                | Statische native opdracht- en native skill-auto-defaultmetadata die door configuratie-, audit- en opdrachtenlijst-oppervlakken wordt gebruikt voordat de kanaalruntime laadt.             |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht checker-metadata voor geconfigureerde status die kan antwoorden: "bestaat env-only setup al?" zonder de volledige kanaalruntime te laden.                                     |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht checker-metadata voor persistente authenticatie die kan antwoorden: "is er al iets aangemeld?" zonder de volledige kanaalruntime te laden.                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updatehints voor meegeleverde en extern gepubliceerde plugins.                                                                                                                |
| `openclaw.install.defaultChoice`                                                           | Voorkeurspad voor installatie wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                        |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm dist-integriteitsstring zoals `sha512-...`; installatie- en updateflows verifiëren het opgehaalde artefact daartegen.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een smal herstelpad voor herinstallatie van meegeleverde plugins toe wanneer configuratie ongeldig is.                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat installatie-only kanaaloppervlakken laden vóór de volledige kanaalplugin tijdens het opstarten.                                                                                       |

Manifestmetadata bepaalt welke provider-/kanaal-/installatiekeuzes in
onboarding verschijnen voordat runtimes laden. `package.json#openclaw.install` vertelt
onboarding hoe die plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die
keuzes selecteert. Verplaats installatiehints niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en bij het laden van het
manifestregister voor niet-meegeleverde plugin-bronnen. Ongeldige waarden worden geweigerd;
nieuwere-maar-geldige waarden slaan externe plugins over op oudere hosts. Meegeleverde bronplugins
worden geacht mee-geversioneerd te zijn met de host-checkout.

Officiële metadata voor installatie op aanvraag moet `clawhubSpec` gebruiken wanneer de plugin op
ClawHub is gepubliceerd; onboarding behandelt dat als de voorkeursbron op afstand en
registreert ClawHub-artefactfeiten na installatie. `npmSpec` blijft de compatibiliteitsfallback
voor pakketten die nog niet naar ClawHub zijn verhuisd.

Exacte npm-versiepinnen staan al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiële externe catalogusitems
moeten exacte specs combineren met `expectedIntegrity`, zodat updateflows gesloten falen
als het opgehaalde npm-artefact niet langer overeenkomt met de gepinde release.
Interactieve onboarding biedt voor compatibiliteit nog steeds vertrouwde registry-npm-specs,
waaronder kale pakketnamen en dist-tags. Catalogusdiagnostiek kan
onderscheid maken tussen exacte, zwevende, integriteit-gepinde, ontbrekende-integriteit,
pakketnaam-mismatch en ongeldige default-choice-bronnen. Ze waarschuwt ook wanneer
`expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee kan worden gepind.
Wanneer `expectedIntegrity` aanwezig is,
dwingen installatie-/updateflows dit af; wanneer het ontbreekt, wordt de registry-resolutie
geregistreerd zonder integriteitspin.

Kanaalplugins moeten `openclaw.setupEntry` leveren wanneer status, kanaallijst
of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige
runtime te laden. Het installatie-ingangspunt moet kanaalmetadata plus installatieveilige config-,
status- en secrets-adapters beschikbaar maken; houd netwerkclients, gateway-listeners en
transportruntimes in het hoofd-ingangspunt van de extensie.

Runtime-ingangspuntvelden overschrijven pakketgrenscontroles voor bron-ingangspuntvelden niet.
Bijvoorbeeld: `openclaw.runtimeExtensions` kan een ontsnappend
`openclaw.extensions`-pad niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt niet
willekeurige kapotte configs installeerbaar. Vandaag staat het alleen installatieflows toe
te herstellen van specifieke verouderde upgradefouten van meegeleverde plugins, zoals een
ontbrekend pad naar een meegeleverde plugin of een verouderde `channels.<id>`-entry voor diezelfde
meegeleverde plugin. Niet-gerelateerde configfouten blokkeren installatie nog steeds en sturen operators
naar `openclaw doctor --fix`.

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

Gebruik dit wanneer installatie-, doctor-, status- of alleen-lezen presenceflows een goedkope
ja/nee-authenticatieprobe nodig hebben voordat de volledige kanaalplugin laadt. Persistente authenticatiestatus is
geen geconfigureerde kanaalstatus: gebruik deze metadata niet om plugins automatisch in te schakelen,
runtimedependencies te repareren of te beslissen of een kanaalruntime moet laden.
De doel-export moet een kleine functie zijn die alleen persistente status leest; routeer deze
niet via de volledige kanaalruntime-barrel.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope env-only
geconfigureerde checks:

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

Gebruik dit wanneer een kanaal geconfigureerde status kan beantwoorden vanuit env of andere kleine
niet-runtime-inputs. Als de check volledige configresolutie of de echte
kanaalruntime nodig heeft, houd die logica dan in de plugin-`config.hasConfiguredState`-
hook.

## Ontdekkingsvoorrang (dubbele plugin-id's)

OpenClaw ontdekt plugins vanuit meerdere roots (meegeleverd, globale installatie, workspace, expliciete door configuratie geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste voorrang** behouden; duplicaten met lagere voorrang worden weggelaten in plaats van ernaast te laden.

Voorrang, van hoog naar laag:

1. **Door configuratie geselecteerd** — een pad dat expliciet is vastgepind in `plugins.entries.<id>`
2. **Meegeleverd** — plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — plugins die in de globale OpenClaw-pluginroot zijn geïnstalleerd
4. **Workspace** — plugins die relatief ten opzichte van de huidige workspace worden ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een meegeleverde plugin in de workspace overschaduwt de meegeleverde build niet.
- Om een meegeleverde plugin daadwerkelijk met een lokale plugin te overschrijven, pin je die via `plugins.entries.<id>`, zodat die op basis van voorrang wint in plaats van te vertrouwen op workspace-ontdekking.
- Weggelaten duplicaten worden gelogd zodat Doctor en opstartdiagnostiek naar de weggegooide kopie kunnen verwijzen.
- Door configuratie geselecteerde duplicate overrides worden in diagnostiek geformuleerd als expliciete overrides, maar waarschuwen nog steeds zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## JSON Schema-vereisten

- **Elke plugin moet een JSON Schema meeleveren**, zelfs als deze geen config accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van config, niet tijdens runtime.
- Wanneer je een meegeleverde plugin uitbreidt of forkt met nieuwe configkeys, werk dan tegelijk de `configSchema` van die plugin in `openclaw.plugin.json` bij. Schema's van meegeleverde plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` aan gebruikersconfig zonder `myNewKey` toe te voegen aan `configSchema.properties` wordt geweigerd voordat de pluginruntime laadt.

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

- Onbekende `channels.*`-keys zijn **fouten**, tenzij de kanaal-id door
  een pluginmanifest is gedeclareerd.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*`
  moeten verwijzen naar **ontdekbare** plugin-id's. Onbekende id's zijn **fouten**.
- Als een plugin is geïnstalleerd maar een kapot of ontbrekend manifest of schema heeft,
  mislukt validatie en rapporteert Doctor de pluginfout.
- Als pluginconfig bestaat maar de plugin **uitgeschakeld** is, wordt de config bewaard en
  verschijnt er een **waarschuwing** in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Notities

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief laden vanuit het lokale bestandssysteem. Runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor ontdekking + validatie.
- Native manifests worden geparseerd met JSON5, dus opmerkingen, afsluitende komma's en niet-geciteerde sleutels worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestloader. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerCatalogEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische provider-catalogusmetadata of smalle ontdekkingsdescriptors, niet voor uitvoering tijdens verzoeken. `providerDiscoveryEntry` is de verouderde spelling en werkt nog steeds voor bestaande plugins.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Env-var-metadata (`setup.providers[].envVars`, verouderd `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, cron-bezorgvalidatie en andere alleen-lezen-oppervlakken passen nog steeds pluginvertrouwen en effectief activatiebeleid toe voordat ze een env var als geconfigureerd behandelen.
- Voor runtime-wizardmetadata waarvoor providercode vereist is, zie [Provider-runtimehooks](/nl/plugins/architecture-internals#provider-runtime-hooks).
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlistvereisten voor pakketbeheerders (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Plugin-architectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capability-model.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin SDK-referentie en subpad-imports.
  </Card>
</CardGroup>
