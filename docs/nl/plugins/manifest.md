---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configuratieschema publiceren of Plugin-validatiefouten debuggen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-05-02T20:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **native OpenClaw-pluginmanifest**.

Zie [Pluginbundels](/nl/plugins/bundles) voor compatibele bundelindelingen.

Compatibele bundelformaten gebruiken andere manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json` of de standaard Claude-componentindeling
  zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert die bundelindelingen ook automatisch, maar ze worden niet gevalideerd
tegen het hier beschreven `openclaw.plugin.json`-schema.

Voor compatibele bundels leest OpenClaw momenteel bundelmetadata plus gedeclareerde
skill-roots, Claude-commandoroots, standaardwaarden uit Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hook-pakketten wanneer de indeling overeenkomt met
de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw-plugin **moet** een `openclaw.plugin.json`-bestand leveren in de
**pluginroot**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder plugincode uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
pluginfouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het pluginsysteem: [Plugins](/nl/tools/plugin).
Voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit:
[Capaciteitsmodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat je
plugincode wordt geladen**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
pluginruntime te starten.

**Gebruik het voor:**

- pluginidentiteit, configuratievalidatie en hints voor de configuratie-UI
- auth, onboarding en setupmetadata (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activatiehints voor control-plane-oppervlakken
- eigenaarschap van verkorte modelfamilies
- statische snapshots van capaciteitseigenaarschap (`contracts`)
- QA-runner-metadata die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die worden samengevoegd in catalogus- en validatieoppervlakken

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

## Referentie voor velden op topniveau

| Veld                                 | Vereist | Type                             | Wat het betekent                                                                                                                                                                                                                       |
| ------------------------------------ | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                                |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een willekeurige niet-`true` waarde in, om de Plugin standaard uitgeschakeld te laten.                                                                 |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde ids die normaliseren naar deze canonieke Plugin-id.                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-ids die deze Plugin automatisch moeten inschakelen wanneer auth-, config- of modelverwijzingen ze noemen.                                                                                                                     |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Nee     | `string[]`                       | Kanaal-ids die eigendom zijn van deze Plugin. Gebruikt voor ontdekking en configuratievalidatie.                                                                                                                                        |
| `providers`                          | Nee     | `string[]`                       | Provider-ids die eigendom zijn van deze Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht modulepad voor provider-ontdekking, relatief ten opzichte van de Plugin-root, voor manifest-gescopeerde providercatalogusmetadata die kunnen worden geladen zonder de volledige Plugin-runtime te activeren.              |
| `modelSupport`                       | Nee     | `object`                         | Manifest-eigen verkorte model-familie-metadata die worden gebruikt om de Plugin vóór runtime automatisch te laden.                                                                                                                      |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-plane-contract voor toekomstige alleen-lezen-lijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Provider-eigen beleid voor externe prijsopzoeking. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te laten stappen of providerverwijzingen naar OpenRouter/LiteLLM-catalogus-ids te mappen zonder provider-ids hardcoded in core te zetten. |
| `modelIdNormalization`               | Nee     | `object`                         | Provider-eigen opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime laadt.                                                                                                                   |
| `providerEndpoints`                  | Nee     | `object[]`                       | Manifest-eigen endpointhost/baseUrl-metadata voor providerroutes die core moet classificeren voordat de provider-runtime laadt.                                                                                                          |
| `providerRequest`                    | Nee     | `object`                         | Goedkope providerfamilie- en request-compatibiliteitsmetadata die worden gebruikt door generiek requestbeleid voordat de provider-runtime laadt.                                                                                         |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inferencebackend-ids die eigendom zijn van deze Plugin. Gebruikt voor automatische startup-activatie vanuit expliciete configuratieverwijzingen.                                                                                    |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backendverwijzingen waarvan de Plugin-eigen synthetic auth hook moet worden getest tijdens koude modelontdekking voordat runtime laadt.                                                                                |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Door gebundelde Plugins beheerde tijdelijke aanduidingen voor API-sleutelwaarden die niet-geheime lokale, OAuth- of ambient credential-status vertegenwoordigen.                                                                        |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en Plugin-bewuste configuratie- en CLI-diagnostiek moeten produceren voordat runtime laadt.                                                                                             |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor provider-auth/status-opzoeking. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de afschrijvingsperiode.                             |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-ids die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codingprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                       |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor env-gestuurde kanaalsetup of auth-oppervlakken die generieke startup/config-helpers moeten zien.                                |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboardingkiezers, resolutie van voorkeursproviders en eenvoudige CLI-flag-bedrading.                                                                                                                  |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activatieplanner voor startup-, provider-, command-, kanaal-, route- en capability-getriggerd laden. Alleen metadata; de Plugin-runtime bezit nog steeds het daadwerkelijke gedrag.                           |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingdescriptors die ontdekking en setup-oppervlakken kunnen inspecteren zonder Plugin-runtime te laden.                                                                                                           |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerdescriptors die worden gebruikt door de gedeelde `openclaw qa` host voordat Plugin-runtime laadt.                                                                                                                     |
| `contracts`                          | Nee     | `object`                         | Statische snapshot van capability-eigenaarschap voor externe auth hooks, spraak, realtime transcriptie, realtime stem, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search en tool-eigenaarschap. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope media-understanding-standaardwaarden voor provider-ids die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                        |
| `imageGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope image-generation-authmetadata voor provider-ids die zijn gedeclareerd in `contracts.imageGenerationProviders`, inclusief provider-eigen auth-aliassen en base-url-guards.                                                      |
| `videoGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope video-generation-authmetadata voor provider-ids die zijn gedeclareerd in `contracts.videoGenerationProviders`, inclusief provider-eigen auth-aliassen en base-url-guards.                                                      |
| `musicGenerationProviderMetadata`    | Nee     | `Record<string, object>`         | Goedkope music-generation-authmetadata voor provider-ids die zijn gedeclareerd in `contracts.musicGenerationProviders`, inclusief provider-eigen auth-aliassen en base-url-guards.                                                      |
| `toolMetadata`                       | Nee     | `Record<string, object>`         | Goedkope beschikbaarheidsmetadata voor Plugin-eigen tools die zijn gedeclareerd in `contracts.tools`. Gebruik dit wanneer een tool geen runtime mag laden tenzij er configuratie-, env- of auth-bewijs bestaat.                         |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Manifest-eigen kanaalconfiguratiemetadata die worden samengevoegd in ontdekking- en validatieoppervlakken voordat runtime laadt.                                                                                                        |
| `skills`                             | Nee     | `string[]`                       | Skills-mappen om te laden, relatief ten opzichte van de Plugin-root.                                                                                                                                                                   |
| `name`                               | Nee     | `string`                         | Voor mensen leesbare Plugin-naam.                                                                                                                                                                                                     |
| `description`                        | Nee      | `string`                         | Korte samenvatting die in Plugin-oppervlakken wordt getoond.                                                                                                                                                                        |
| `version`                            | Nee      | `string`                         | Informatieve Plugin-versie.                                                                                                                                                                                                         |
| `uiHints`                            | Nee      | `Record<string, object>`         | UI-labels, plaatsaanduidingen en gevoeligheidshints voor configuratievelden.                                                                                                                                                        |

## Referentie voor metadata van generatieproviders

De metadatavelden voor generatieproviders beschrijven statische auth-signalen voor
providers die zijn gedeclareerd in de bijbehorende lijst `contracts.*GenerationProviders`.
OpenClaw leest deze velden voordat de provider-runtime wordt geladen, zodat kerntools
kunnen bepalen of een generatieprovider beschikbaar is zonder elke
provider-plugin te importeren.

Gebruik deze velden alleen voor goedkope, declaratieve feiten. Transport, request-
transformaties, tokenvernieuwing, validatie van inloggegevens en daadwerkelijk generatiegedrag
blijven in de plugin-runtime.

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

| Veld            | Vereist | Type       | Betekenis                                                                                                                             |
| --------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Nee     | `string[]` | Aanvullende provider-id's die moeten meetellen als statische auth-aliassen voor de generatieprovider.                                  |
| `authProviders` | Nee     | `string[]` | Provider-id's waarvan geconfigureerde auth-profielen moeten meetellen als auth voor deze generatieprovider.                            |
| `configSignals` | Nee     | `object[]` | Goedkope, alleen op config gebaseerde beschikbaarheidssignalen voor lokale of zelfgehoste providers die zonder auth-profielen of env-vars kunnen worden geconfigureerd. |
| `authSignals`   | Nee     | `object[]` | Expliciete auth-signalen. Wanneer aanwezig vervangen deze de standaard signaalset van de provider-id, `aliases` en `authProviders`.    |

Elke `configSignals`-entry ondersteunt:

| Veld          | Vereist | Type       | Betekenis                                                                                                                                                                             |
| ------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Ja      | `string`   | Puntpad naar het plugin-eigen config-object dat moet worden geïnspecteerd, bijvoorbeeld `plugins.entries.example.config`.                                                             |
| `overlayPath` | Nee     | `string`   | Puntpad binnen de root-config waarvan het object het root-object moet overlappen voordat het signaal wordt geëvalueerd. Gebruik dit voor capability-specifieke config zoals `image`, `video` of `music`. |
| `required`    | Nee     | `string[]` | Puntpaden binnen de effectieve config die geconfigureerde waarden moeten hebben. Strings mogen niet leeg zijn; objecten en arrays mogen niet leeg zijn.                               |
| `requiredAny` | Nee     | `string[]` | Puntpaden binnen de effectieve config waarvan er ten minste één een geconfigureerde waarde moet hebben.                                                                                |
| `mode`        | Nee     | `object`   | Optionele stringmodus-bewaker binnen de effectieve config. Gebruik dit wanneer beschikbaarheid op basis van alleen config slechts op één modus van toepassing is.                     |

Elke `mode`-bewaker ondersteunt:

| Veld         | Vereist | Type       | Betekenis                                                                                         |
| ------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `path`       | Nee     | `string`   | Puntpad binnen de effectieve config. Standaard is `mode`.                                         |
| `default`    | Nee     | `string`   | Moduswaarde om te gebruiken wanneer de config het pad weglaat.                                    |
| `allowed`    | Nee     | `string[]` | Indien aanwezig slaagt het signaal alleen wanneer de effectieve modus een van deze waarden is.    |
| `disallowed` | Nee     | `string[]` | Indien aanwezig faalt het signaal wanneer de effectieve modus een van deze waarden is.            |

Elke `authSignals`-entry ondersteunt:

| Veld              | Vereist | Type     | Betekenis                                                                                                                                                              |
| ----------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string` | Provider-id om te controleren in geconfigureerde auth-profielen.                                                                                                       |
| `providerBaseUrl` | Nee     | `object` | Optionele bewaker waardoor het signaal alleen meetelt wanneer de verwezen geconfigureerde provider een toegestane basis-URL gebruikt. Gebruik dit wanneer een auth-alias alleen geldig is voor bepaalde API's. |

Elke `providerBaseUrl`-bewaker ondersteunt:

| Veld              | Vereist | Type       | Betekenis                                                                                                                                       |
| ----------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Ja      | `string`   | Provider-config-id waarvan `baseUrl` moet worden gecontroleerd.                                                                                 |
| `defaultBaseUrl`  | Nee     | `string`   | Basis-URL die moet worden aangenomen wanneer de provider-config `baseUrl` weglaat.                                                              |
| `allowedBaseUrls` | Ja      | `string[]` | Toegestane basis-URL's voor dit auth-signaal. Het signaal wordt genegeerd wanneer de geconfigureerde of standaard basis-URL niet overeenkomt met een van deze genormaliseerde waarden. |

## Referentie voor toolmetadata

`toolMetadata` gebruikt dezelfde vormen voor `configSignals` en `authSignals` als
metadata van generatieproviders, met toolnaam als sleutel. `contracts.tools` declareert
eigenaarschap. `toolMetadata` declareert goedkoop beschikbaarheidsbewijs zodat OpenClaw
kan vermijden een plugin-runtime te importeren alleen om de tool-factory `null` te laten retourneren.

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
laadt het de eigenaar-plugin wanneer het toolcontract overeenkomt met het beleid. Voor hot-path
tools waarvan de factory afhangt van auth/config, moeten plugin-auteurs
`toolMetadata` declareren in plaats van core runtime te laten importeren om het te vragen.

## Referentie voor providerAuthChoices

Elke `providerAuthChoices`-entry beschrijft één onboarding- of auth-keuze.
OpenClaw leest dit voordat de provider-runtime wordt geladen.
Providerconfiguratielijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide configuratiekeuzes
en install-catalogusmetadata zonder de provider-runtime te laden.

| Veld                  | Vereist | Type                                            | Betekenis                                                                                              |
| --------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Ja      | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                |
| `method`              | Ja      | `string`                                        | Auth-methode-id waarnaar moet worden gedispatcht.                                                      |
| `choiceId`            | Ja      | `string`                                        | Stabiele auth-keuze-id die wordt gebruikt door onboarding- en CLI-flows.                               |
| `choiceLabel`         | Nee     | `string`                                        | Gebruikersgerichte label. Indien weggelaten valt OpenClaw terug op `choiceId`.                         |
| `choiceHint`          | Nee     | `string`                                        | Korte hulptekst voor de kiezer.                                                                        |
| `assistantPriority`   | Nee     | `number`                                        | Lagere waarden worden eerder gesorteerd in assistentgestuurde interactieve kiezers.                    |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistentkiezers terwijl handmatige CLI-selectie nog steeds mogelijk blijft.     |
| `deprecatedChoiceIds` | Nee     | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorverwijzen.                 |
| `groupId`             | Nee     | `string`                                        | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                        |
| `groupLabel`          | Nee     | `string`                                        | Gebruikersgericht label voor die groep.                                                               |
| `groupHint`           | Nee     | `string`                                        | Korte hulptekst voor de groep.                                                                        |
| `optionKey`           | Nee     | `string`                                        | Interne optiesleutel voor eenvoudige auth-flows met één vlag.                                          |
| `cliFlag`             | Nee     | `string`                                        | Naam van CLI-vlag, zoals `--openrouter-api-key`.                                                       |
| `cliOption`           | Nee     | `string`                                        | Volledige vorm van CLI-optie, zoals `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Nee     | `string`                                        | Beschrijving die wordt gebruikt in CLI-hulp.                                                          |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten is de standaardwaarde `["text-inference"]`. |

## Referentie voor commandAliases

Use `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers mogelijk per ongeluk in `plugins.allow` zetten of als root-CLI-opdracht proberen uit te voeren. OpenClaw gebruikt deze metadata voor diagnostiek zonder plugin-runtimecode te importeren.

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

| Veld         | Vereist | Type              | Wat het betekent                                                       |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Opdrachtnaam die bij deze plugin hoort.                                |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als chat-slashopdracht in plaats van root-CLI-opdracht. |
| `cliCommand` | Nee     | `string`          | Gerelateerde root-CLI-opdracht om voor CLI-bewerkingen voor te stellen, als die bestaat. |

## activation-referentie

Gebruik `activation` wanneer de plugin goedkoop kan aangeven welke control-plane-gebeurtenissen deze moeten opnemen in een activatie-/laadplan.

Dit blok is planner-metadata, geen lifecycle-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet, en belooft niet dat plugin-code al is uitgevoerd. De activatieplanner gebruikt deze velden om kandidaatplugins te beperken voordat wordt teruggevallen op bestaande manifest-eigendomsmetadata zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigendom al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, setup-descriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra planner-hints die niet door die eigendomsvelden kunnen worden weergegeven.
Gebruik top-level `cliBackends` voor CLI-runtime-aliassen zoals `claude-cli`, `codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor ingebedde agent-harness-id's die nog geen eigendomsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt `register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet. Huidige consumers gebruiken het als een beperkende hint voordat bredere plugin-loading plaatsvindt, dus ontbrekende non-startup-activatiemetadata kost meestal alleen performance; het zou de correctheid niet moeten veranderen zolang manifest-eigendomsfallbacks nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen. Zet dit alleen op `true` wanneer de plugin tijdens het opstarten van de Gateway moet draaien. Zet dit op `false` wanneer de plugin inert is bij startup en alleen vanuit smallere triggers moet laden. Het weglaten van `onStartup` laadt de plugin niet langer impliciet bij startup; gebruik expliciete activatiemetadata voor startup-, channel-, config-, agent-harness-, memory- of andere smallere activatietriggers.

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
| ------------------ | ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-startupactivatie. Elke plugin moet dit instellen. `true` importeert de plugin tijdens startup; `false` houdt deze startup-lazy tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                      |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingebedde agent-harness-runtime-id's die deze plugin moeten opnemen in activatie-/laadplannen. Gebruik top-level `cliBackends` voor CLI-backendaliassen.                                      |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                      |
| `onChannels`       | Nee     | `string[]`                                           | Channel-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                       |
| `onRoutes`         | Nee     | `string[]`                                           | Routetypen die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                         |
| `onConfigPaths`    | Nee     | `string[]`                                           | Root-relatieve config-paden die deze plugin moeten opnemen in startup-/laadplannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                           |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capability-hints die worden gebruikt door control-plane-activatieplanning. Geef waar mogelijk de voorkeur aan smallere velden.                                                         |

Huidige live-consumers:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startup-import
- door opdrachten getriggerde CLI-planning valt terug op legacy `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-startupplanning gebruikt `activation.onAgentHarnesses` voor ingebedde harnesses en top-level `cliBackends[]` voor CLI-runtime-aliassen
- door channels getriggerde setup-/channel-planning valt terug op legacy-eigendom via `channels[]` wanneer expliciete channel-activatiemetadata ontbreekt
- startup-pluginplanning gebruikt `activation.onConfigPaths` voor niet-channel-root-config-oppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy-eigendom via `providers[]` en top-level `cliBackends[]` wanneer expliciete provider-activatiemetadata ontbreekt

Planner-diagnostiek kan expliciete activatie-hints onderscheiden van manifest-eigendomsfallback. Bijvoorbeeld: `activation-command-hint` betekent dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan `commandAliases`-eigendom gebruikte. Deze redenlabels zijn voor hostdiagnostiek en tests; pluginauteurs moeten de metadata blijven declareren die eigendom het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners onder de gedeelde root `openclaw qa` bijdraagt. Houd deze metadata goedkoop en statisch; de plugin-runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht `runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

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

| Veld          | Vereist | Type     | Wat het betekent                                                    |
| ------------- | ------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Ja      | `string` | Subopdracht gemount onder `openclaw qa`, bijvoorbeeld `matrix`.     |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stubopdracht nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboardingsoppervlakken goedkope plugin-eigen metadata nodig hebben voordat runtimes laden.

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

Top-level `cliBackends` blijft geldig en blijft CLI-inference-backends beschrijven. `setup.cliBackends` is het setup-specifieke descriptoroppervlak voor control-plane-/setup-flows die metadata-only moeten blijven.

Wanneer aanwezig, zijn `setup.providers` en `setup.cliBackends` het voorkeursoppervlak voor descriptor-first lookup bij setup-discovery. Als de descriptor alleen de kandidaatplugin beperkt en setup nog rijkere setup-time-runtimehooks nodig heeft, zet dan `requiresRuntime: true` en houd `setup-api` aanwezig als fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter tijdens de deprecation window, maar niet-gebundelde plugins die het nog gebruiken krijgen een manifestdiagnose. Nieuwe plugins moeten setup-/status-env-metadata op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods` wanneer er geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false` aangeeft dat setup-runtime niet nodig is. Expliciete `providerAuthChoices`-items blijven de voorkeur houden voor aangepaste labels, CLI-flags, onboardingscope en assistant-metadata.

Zet `requiresRuntime: false` alleen wanneer die descriptors voldoende zijn voor het setup-oppervlak. OpenClaw behandelt expliciete `false` als een descriptor-only contract en voert `setup-api` of `openclaw.setupEntry` niet uit voor setup-lookup. Als een descriptor-only plugin nog steeds een van die setup-runtime-items levert, rapporteert OpenClaw een additieve diagnose en blijft deze negeren. Weggelaten `requiresRuntime` behoudt legacy-fallbackgedrag zodat bestaande plugins die descriptors zonder de flag hebben toegevoegd niet breken.

Omdat setup-lookup plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde waarden voor `setup.providers[].id` en `setup.cliBackends[]` uniek blijven over ontdekte plugins heen. Ambigu eigendom faalt gesloten in plaats van een winnaar te kiezen op basis van discovery-volgorde.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteert setup-registry-diagnostiek descriptorafwijkingen als `setup-api` een provider of CLI-backend registreert die de manifestdescriptors niet declareren, of als een descriptor geen overeenkomende runtime-registratie heeft. Deze diagnoses zijn additief en wijzen legacy-plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                         |
| -------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `id`           | Ja      | `string`   | Provider-id die tijdens setup of onboarding wordt getoond. Houd genormaliseerde id's wereldwijd uniek.   |
| `authMethods`  | Nee     | `string[]` | Setup-/auth-method-id's die deze provider ondersteunt zonder volledige runtime te laden.                 |
| `envVars`      | Nee     | `string[]` | Env-vars die generieke setup-/statusoppervlakken kunnen controleren voordat plugin-runtime laadt.         |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-evidence-controles voor providers die kunnen authenticeren via niet-geheime markers. |

`authEvidence` is voor door de provider beheerde lokale referentiemarkeringen die kunnen worden
geverifieerd zonder runtime-code te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkoproepen, geen keychain- of secret-manager-lezingen, geen shellopdrachten en geen
provider-API-probes.

Ondersteunde bewijsvermeldingen:

| Veld               | Vereist | Type       | Wat het betekent                                                                                            |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `type`             | Ja       | `string`   | Momenteel `local-file-with-env`.                                                                           |
| `fileEnvVar`       | Nee      | `string`   | Env var met een expliciet pad naar een referentiebestand.                                                  |
| `fallbackPaths`    | Nee      | `string[]` | Lokale paden naar referentiebestanden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee      | `string[]` | Minstens een vermelde env var moet niet-leeg zijn voordat het bewijs geldig is.                            |
| `requiresAllEnv`   | Nee      | `string[]` | Elke vermelde env var moet niet-leeg zijn voordat het bewijs geldig is.                                    |
| `credentialMarker` | Ja       | `string`   | Niet-geheime markering die wordt geretourneerd wanneer het bewijs aanwezig is.                             |
| `source`           | Nee      | `string`   | Gebruikersgerichte bronlabel voor auth-/statusuitvoer.                                                     |

### setup-velden

| Veld               | Vereist | Type       | Wat het betekent                                                                                     |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Nee      | `object[]` | Provider-setupbeschrijvingen die tijdens setup en onboarding worden aangeboden.                      |
| `cliBackends`      | Nee      | `string[]` | Backend-id's tijdens setup die worden gebruikt voor descriptor-first setup-lookup. Houd genormaliseerde id's wereldwijd uniek. |
| `configMigrations` | Nee      | `string[]` | Config-migratie-id's die eigendom zijn van het setup-oppervlak van deze Plugin.                      |
| `requiresRuntime`  | Nee      | `boolean`  | Of setup na descriptor-lookup nog uitvoering van `setup-api` nodig heeft.                            |

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

Elke veldhint kan het volgende bevatten:

| Veld          | Type       | Wat het betekent                         |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Gebruikersgericht veldlabel.             |
| `help`        | `string`   | Korte helptekst.                         |
| `tags`        | `string[]` | Optionele UI-tags.                       |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.       |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig. |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.   |

## contracts-referentie

Gebruik `contracts` alleen voor statische metadata over capability-eigenaarschap die OpenClaw kan
lezen zonder de plugin-runtime te importeren.

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

| Veld                             | Type       | Wat het betekent                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension-factory-id's, momenteel `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-id's waarvoor een gebundelde Plugin tool-result-middleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-id's waarvan deze Plugin de externe auth-profielhook bezit.   |
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
| `tools`                          | `string[]` | Agent-toolnamen die deze Plugin bezit.                                 |

`contracts.embeddedExtensionFactories` wordt behouden voor gebundelde Codex
app-server-only extension-factories. Gebundelde tool-result-transformaties moeten
in plaats daarvan `contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-result-middleware registreren, omdat de seam tooluitvoer met hoog vertrouwen kan herschrijven
voordat het model die ziet.

Runtime-registraties met `api.registerTool(...)` moeten overeenkomen met `contracts.tools`.
Tooldetectie gebruikt deze lijst om alleen de plugin-runtimes te laden die eigenaar kunnen zijn van de
aangevraagde tools.

Provider-plugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie lopen nog steeds
via een verouderde compatibiliteitsfallback, maar die fallback is trager en
wordt na het migratievenster verwijderd.

Gebundelde memory-embedding-providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die ze aanbieden, inclusief
ingebouwde adapters zoals `local`. Standalone CLI-paden gebruiken dit manifestcontract
om alleen de eigenaars-Plugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, fallbackprioriteit voor automatische auth of native documentondersteuning heeft die
generieke core-helpers nodig hebben voordat de runtime wordt geladen. Sleutels moeten ook worden gedeclareerd in
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

Elke providervermelding kan het volgende bevatten:

| Veld                   | Type                                | Wat het betekent                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediacapabilities die door deze provider worden aangeboden.                   |
| `defaultModels`        | `Record<string, string>`            | Capability-naar-model-standaarden die worden gebruikt wanneer config geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen sorteren eerder voor automatische providerfallback op basis van referenties. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                 |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een channel-Plugin goedkope config-metadata nodig heeft voordat
de runtime wordt geladen. Read-only channel-setup-/statusdetectie kan deze metadata
direct gebruiken voor geconfigureerde externe channels wanneer er geen setupvermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` verklaart dat setup-runtime niet nodig is.

`channelConfigs` is metadata uit het pluginmanifest, geen nieuwe top-level user config
sectie. Gebruikers configureren channelinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde
channel voordat plugin-runtimecode wordt uitgevoerd.

Voor een channel-Plugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-vermeldingen declareren. Zonder die vermeldingen kan OpenClaw de Plugin nog steeds laden, maar
cold-path-configschema, setup en Control UI-oppervlakken kunnen de
channel-eigen optiestructuur niet kennen totdat de plugin-runtime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor commandconfiguratie-
controles die worden uitgevoerd voordat de channel-runtime wordt geladen. Gebundelde channels kunnen ook
dezelfde standaarden publiceren via `package.json#openclaw.channel.commands` naast
hun andere package-eigen channel-catalogusmetadata.

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

Elke channelvermelding kan het volgende bevatten:

| Veld          | Type                     | Wat het betekent                                                                        |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratie.   |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoeligheidsaanwijzingen voor die kanaalconfiguratie. |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in keuzelijsten en inspectieweergaven wanneer runtime-metadata nog niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusweergaven.                         |
| `commands`    | `object`                 | Statische native opdracht en automatische standaardwaarden voor native Skills voor configuratiecontroles vóór runtime. |
| `preferOver`  | `string[]`               | Verouderde Plugin-id's of Plugin-id's met lagere prioriteit die dit kanaal in selectieweergaven moet overtreffen. |

### Een andere kanaal-Plugin vervangen

Gebruik `preferOver` wanneer je Plugin de voorkeursbeheerder is voor een kanaal-id dat
ook door een andere Plugin kan worden geleverd. Veelvoorkomende gevallen zijn een hernoemde Plugin-id, een
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
de voorkeurs-Plugin-id mee. Als de Plugin met lagere prioriteit alleen was geselecteerd omdat
deze gebundeld is of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtimeconfiguratie, zodat één Plugin eigenaar is van het kanaal en de bijbehorende tools. Expliciete gebruikersselectie
heeft nog steeds voorrang: als de gebruiker beide Plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het dubbele kanaal-/tooldiagnostiek in plaats van
de gevraagde Plugin-set stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot Plugin-id's die echt hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## Naslag voor modelSupport

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

- expliciete `provider/model`-verwijzingen gebruiken de eigenaargegevens uit de manifestmetadata van `providers`
- `modelPatterns` hebben voorrang op `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, wint de niet-gebundelde
  Plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden vergeleken met verkorte model-id's.         |
| `modelPatterns` | `string[]` | Regex-bronnen die na verwijdering van profielsuffixen met verkorte model-id's worden vergeleken. |

## Naslag voor modelCatalog

Gebruik `modelCatalog` wanneer OpenClaw provider-modelmetadata moet kennen voordat
de Plugin-runtime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provider-aliassen, onderdrukkingsregels en ontdekkingsmodus. Runtimeverversing
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

Velden op het hoogste niveau:

| Veld           | Type                                                     | Wat het betekent                                                                                         |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze Plugin. Sleutels moeten ook voorkomen in `providers` op het hoogste niveau. |
| `aliases`      | `Record<string, object>`                                 | Provider-aliassen die moeten verwijzen naar een eigen provider voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze Plugin onderdrukt om een providerspecifieke reden.               |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, in de cache kan worden ververst, of runtime vereist. |

`aliases` neemt deel aan het opzoeken van providereigenaarschap voor modelcatalogusplanning.
Aliasdoelen moeten providers op het hoogste niveau zijn die eigendom zijn van dezelfde Plugin. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarsmanifest lezen en
alias-API-/basis-URL-overschrijvingen toepassen zonder de provider-runtime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de eigen
canonieke providerrijen weer.

`suppressions` vervangt de oude provider-runtimehook `suppressBuiltInModel`.
Onderdrukkingsitems worden alleen gerespecteerd wanneer de provider eigendom is van de Plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een eigen provider verwijst. Runtime-
onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                   |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus. |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder `id` worden genegeerd.            |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                                 |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het prefix `provider/`.                          |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                          |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                          |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                    |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                           |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                   |
| `contextWindow` | `number`                                                       | Native contextvenster van de provider.                                           |
| `contextTokens` | `number`                                                       | Optionele effectieve runtimecontextlimiet wanneer die verschilt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximaal aantal uitvoertokens wanneer bekend.                                    |
| `cost`          | `object`                                                       | Optionele prijs in USD per miljoen tokens, inclusief optionele `tieredPricing`.  |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Alleen onderdrukken wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt weergegeven bij een niet-beschikbare status.           |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die dit model vervangt.                         |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                       |
| `tags`          | `string[]`                                                     | Stabiele tags die worden gebruikt door keuzelijsten en filters.                  |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                       |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | Provider-id voor de upstreamrij die moet worden onderdrukt. Moet eigendom zijn van deze Plugin of gedeclareerd zijn als een eigen alias. |
| `model`                    | `string`   | Providerlokale model-id die moet worden onderdrukt.                                                     |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt opgevraagd.           |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve hostnamen van providerbasis-URL's die vereist zijn voordat de onderdrukking van toepassing is. |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking van toepassing is. |

Plaats geen gegevens die alleen tijdens runtime beschikbaar zijn in `modelCatalog`. Gebruik `static` alleen wanneer manifestrijen volledig genoeg zijn zodat door providers gefilterde lijst- en kiezeroppervlakken registry-/runtime-detectie kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige lijstbare zaden of aanvullingen zijn, maar een verversing/cache later meer rijen kan toevoegen; refreshable-rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, door de provider beheerde opschoning van model-id's die moet plaatsvinden voordat provider-runtime laadt. Dit houdt aliassen zoals korte modelnamen, provider-lokale legacy-id's en proxy-prefixregels in het manifest van de eigenaar-Plugin in plaats van in kern-tabellen voor modelselectie.

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
| `stripPrefixes`                      | `string[]`              | Prefixen om te verwijderen vóór het opzoeken van aliassen, nuttig voor legacy-duplicatie van provider/model. |
| `prefixWhenBare`                     | `string`                | Prefix om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke prefixregels voor kale id's na het opzoeken van aliassen, geïndexeerd op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid moet kennen voordat provider-runtime laadt. De kern blijft de betekenis van elke `endpointClass` beheren; Plugin-manifesten beheren de metadata voor host en basis-URL.

Endpointvelden:

| Veld                           | Type       | Wat het betekent                                                                          |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende kern-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.    |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de endpointklasse worden gekoppeld.                              |
| `hostSuffixes`                 | `string[]` | Hostachtervoegsels die aan de endpointklasse worden gekoppeld. Prefix met `.` voor matching alleen op domeinachtervoegsels. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de endpointklasse worden gekoppeld.    |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Achtervoegsel om uit overeenkomende hosts te strippen om de Google Vertex-regioprefix bloot te leggen. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata over aanvraagcompatibiliteit die generiek aanvraagbeleid nodig heeft zonder provider-runtime te laden. Houd gedragsspecifieke payload-herschrijving in provider-runtime-hooks of gedeelde helpers voor providerfamilies.

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

| Veld                  | Type         | Wat het betekent                                                                    |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `family`              | `string`     | Label voor de providerfamilie dat wordt gebruikt door generieke beslissingen over aanvraagcompatibiliteit en diagnostiek. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitsbucket voor providerfamilies voor gedeelde aanvraaghelpers. |
| `openAICompletions`   | `object`     | OpenAI-compatibele vlaggen voor completions-aanvragen, momenteel `supportsStreamingUsage`. |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider control-plane-prijsgedrag nodig heeft voordat runtime laadt. De prijscache van de Gateway leest deze metadata zonder provider-runtimecode te importeren.

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

| Veld         | Type              | Wat het betekent                                                                                      |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelf-gehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking uit voor deze provider. |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking uit voor deze provider.       |

Bronvelden:

| Veld                       | Type               | Wat het betekent                                                                                                     |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogus-provider-id wanneer die verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met schuine strepen als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra model-id-varianten voor externe catalogi. `version-dots` probeert gestippelde versie-id's zoals `claude-opus-4.6`. |

### OpenClaw Provider-index

De OpenClaw Provider-index is door OpenClaw beheerde previewmetadata voor providers waarvan de Plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een Plugin-manifest. Plugin-manifesten blijven de autoriteit voor geïnstalleerde Plugins. De Provider-index is het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install modelkiezers zullen gebruiken wanneer een provider-Plugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd Plugin-manifest `modelCatalog`.
3. Modelcataloguscache van expliciete verversing.
4. Previewrijen van de OpenClaw Provider-index.

De Provider-index mag geen geheimen, ingeschakelde status, runtime-hooks of live accountspecifieke modelgegevens bevatten. De previewcatalogi gebruiken dezelfde `modelCatalog`-providerrijvorm als Plugin-manifesten, maar moeten beperkt blijven tot stabiele weergavemetadata tenzij runtime-adaptervelden zoals `api`, `baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op het geïnstalleerde Plugin-manifest. Providers met live `/models`-detectie moeten ververste rijen schrijven via het expliciete modelcataloguscachepad in plaats van normale listing of onboarding provider-API's te laten aanroepen.

Provider-indexitems kunnen ook metadata voor installeerbare Plugins bevatten voor providers waarvan de Plugin uit de kern is verplaatst of anderszins nog niet is geïnstalleerd. Deze metadata weerspiegelt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie, verwachte integriteit en goedkope labels voor auth-keuzes zijn genoeg om een installeerbare installatieoptie te tonen. Zodra de Plugin is geïnstalleerd, wint het manifest ervan en wordt de Provider-indexvermelding voor die provider genegeerd.

Legacy top-level capability-sleutels zijn verouderd. Gebruik `openclaw doctor --fix` om `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` en `webSearchProviders` onder `contracts` te plaatsen; normaal laden van manifesten behandelt die top-level velden niet langer als capability-eigendom.

## Manifest versus package.json

De twee bestanden dienen verschillende doelen:

| Bestand               | Gebruik het voor                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configuratievalidatie, metadata voor auth-keuzes en UI-hints die moeten bestaan voordat Plugin-code wordt uitgevoerd |
| `package.json`         | npm-metadata, installatie van afhankelijkheden en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatiepoorten, setup of catalogusmetadata |

Als u niet zeker weet waar een stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat Plugin-code wordt geladen, plaats het in `openclaw.plugin.json`
- als het over packaging, entrybestanden of npm-installatiegedrag gaat, plaats het in `package.json`

### package.json-velden die detectie beïnvloeden

Sommige pre-runtime Plugin-metadata staat bewust in `package.json` onder het `openclaw`-blok in plaats van in `openclaw.plugin.json`.
`openclaw.bundle` en `openclaw.bundle.json` zijn geen OpenClaw Plugin-contracten; native Plugins moeten `openclaw.plugin.json` gebruiken plus de ondersteunde `package.json#openclaw`-velden hieronder.

Belangrijke voorbeelden:

| Veld                                                                                       | Wat het betekent                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Declareert native Plugin-ingangspunten. Moet binnen de Plugin-pakketdirectory blijven.                                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Declareert gebouwde JavaScript-runtime-ingangspunten voor geïnstalleerde pakketten. Moet binnen de Plugin-pakketdirectory blijven.                                                                      |
| `openclaw.setupEntry`                                                                      | Lichtgewicht ingangspunt alleen voor setup, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus/SecretRef-detectie. Moet binnen de Plugin-pakketdirectory blijven.        |
| `openclaw.runtimeSetupEntry`                                                               | Declareert het gebouwde JavaScript-setup-ingangspunt voor geïnstalleerde pakketten. Vereist `setupEntry`, moet bestaan en moet binnen de Plugin-pakketdirectory blijven.                                |
| `openclaw.channel`                                                                         | Goedkope kanaalcatalogusmetadata zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                                             |
| `openclaw.channel.commands`                                                                | Statische native opdracht- en native skill-auto-defaultmetadata die wordt gebruikt door configuratie-, audit- en opdrachtenlijstoppervlakken voordat de kanaalruntime laadt.                             |
| `openclaw.channel.configuredState`                                                         | Lichtgewicht metadata voor een configured-state-controle die kan antwoorden op "bestaat setup met alleen env al?" zonder de volledige kanaalruntime te laden.                                           |
| `openclaw.channel.persistedAuthState`                                                      | Lichtgewicht metadata voor een persisted-auth-controle die kan antwoorden op "is er al iets aangemeld?" zonder de volledige kanaalruntime te laden.                                                      |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Installatie-/updatehints voor gebundelde en extern gepubliceerde plugins.                                                                                                                                |
| `openclaw.install.defaultChoice`                                                           | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                                            |
| `openclaw.install.minHostVersion`                                                          | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22` of `>=2026.5.1-beta.1`.                                                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Verwachte npm-dist-integriteitsreeks zoals `sha512-...`; installatie- en updateflows controleren het opgehaalde artefact hiertegen.                                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Staat een smal herstelpad voor herinstallatie van gebundelde plugins toe wanneer de configuratie ongeldig is.                                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Laat kanaaloppervlakken die alleen setup gebruiken laden vóór de volledige kanaalplugin tijdens het opstarten.                                                                                            |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes verschijnen in
onboarding voordat de runtime laadt. `package.json#openclaw.install` vertelt
onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de
gebruiker een van die keuzes selecteert. Verplaats installatiehints niet naar
`openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en het
laden van het manifestregister voor niet-gebundelde Plugin-bronnen. Ongeldige
waarden worden geweigerd; nieuwere maar geldige waarden slaan externe plugins
over op oudere hosts. Gebundelde bronplugins worden geacht dezelfde versie te
hebben als de host-checkout.

Officiële metadata voor installatie op aanvraag moet `clawhubSpec` gebruiken
wanneer de Plugin op ClawHub is gepubliceerd; onboarding behandelt dat als de
voorkeursbron op afstand en registreert ClawHub-artefactfeiten na installatie.
`npmSpec` blijft de compatibiliteitsfallback voor pakketten die nog niet naar
ClawHub zijn verplaatst.

Exacte npm-versievastlegging staat al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiële externe
catalogusitems moeten exacte specs combineren met `expectedIntegrity` zodat
updateflows gesloten falen als het opgehaalde npm-artefact niet meer overeenkomt
met de vastgelegde release. Interactieve onboarding biedt nog steeds vertrouwde
registry-npm-specs aan, inclusief kale pakketnamen en dist-tags, voor
compatibiliteit. Catalogusdiagnostiek kan onderscheid maken tussen exacte,
zwevende, integriteitsvastgelegde, ontbrekende-integriteit-, pakketnaam-mismatch-
en ongeldige default-choice-bronnen. Ze waarschuwen ook wanneer
`expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee kan
worden vastgelegd. Wanneer `expectedIntegrity` aanwezig is, dwingen
installatie-/updateflows deze af; wanneer deze ontbreekt, wordt de
registry-resolutie zonder integriteitsvastlegging geregistreerd.

Kanaalplugins moeten `openclaw.setupEntry` leveren wanneer status, kanaallijst
of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de
volledige runtime te laden. Het setup-ingangspunt moet kanaalmetadata plus
setup-veilige configuratie-, status- en secrets-adapters beschikbaar maken; houd
netwerkclients, Gateway-listeners en transportruntimes in het hoofdingangspunt
van de extensie.

Runtime-ingangspuntvelden overschrijven pakketgrenscontroles voor
broningangspuntvelden niet. `openclaw.runtimeExtensions` kan bijvoorbeeld geen
ontsnappend `openclaw.extensions`-pad laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt niet
willekeurige kapotte configuraties installeerbaar. Vandaag staat het alleen
installatieflows toe om te herstellen van specifieke verouderde upgradefouten
van gebundelde plugins, zoals een ontbrekend gebundeld Plugin-pad of een
verouderd `channels.<id>`-item voor diezelfde gebundelde Plugin. Niet-gerelateerde
configuratiefouten blokkeren installatie nog steeds en sturen operators naar
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine
controlemodule:

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
goedkope ja/nee-auth-probe nodig hebben voordat de volledige kanaalplugin laadt.
Persisted auth-state is geen geconfigureerde kanaalstatus: gebruik deze metadata
niet om plugins automatisch in te schakelen, runtime-afhankelijkheden te
repareren of te beslissen of een kanaalruntime moet laden. De doel-export moet
een kleine functie zijn die alleen persisted state leest; routeer deze niet via
de volledige kanaalruntime-barrel.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope
configured-controles met alleen env:

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

Gebruik dit wanneer een kanaal configured-state kan beantwoorden vanuit env of
andere kleine niet-runtime-invoer. Als de controle volledige
configuratieresolutie of de echte kanaalruntime nodig heeft, houd die logica dan
in de Plugin-`config.hasConfiguredState`-hook.

## Discovery-volgorde (dubbele Plugin-id's)

OpenClaw ontdekt plugins vanuit meerdere roots (gebundeld, globale installatie, workspace, expliciete door configuratie geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste prioriteit** behouden; duplicaten met lagere prioriteit worden verwijderd in plaats van ernaast te laden.

Prioriteit, van hoog naar laag:

1. **Door configuratie geselecteerd** — een pad dat expliciet is vastgezet in `plugins.entries.<id>`
2. **Gebundeld** — plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — plugins die in de globale OpenClaw-Plugin-root zijn geïnstalleerd
4. **Workspace** — plugins die relatief ten opzichte van de huidige workspace worden ontdekt

Gevolgen:

- Een gevorkte of verouderde kopie van een gebundelde Plugin in de workspace overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin daadwerkelijk met een lokale te overschrijven, zet je deze vast via `plugins.entries.<id>` zodat deze op prioriteit wint in plaats van op workspace-detectie te vertrouwen.
- Verwijderde duplicaten worden gelogd zodat Doctor en opstartdiagnostiek naar de verworpen kopie kunnen wijzen.
- Overschrijvingen van door configuratie geselecteerde duplicaten worden in diagnostiek geformuleerd als expliciete overschrijvingen, maar waarschuwen nog steeds zodat verouderde forks en onbedoelde overschaduwingen zichtbaar blijven.

## JSON Schema-vereisten

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd bij het lezen/schrijven van configuratie, niet tijdens runtime.
- Wanneer je een gebundelde Plugin uitbreidt of forkt met nieuwe configuratiesleutels, werk dan tegelijk de `openclaw.plugin.json` `configSchema` van die Plugin bij. Schema's van gebundelde plugins zijn strikt, dus het toevoegen van `plugins.entries.<id>.config.myNewKey` in gebruikersconfiguratie zonder `myNewKey` toe te voegen aan `configSchema.properties` wordt geweigerd voordat de Plugin-runtime laadt.

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
  moeten verwijzen naar **detecteerbare** Plugin-id's. Onbekende id's zijn **fouten**.
- Als een Plugin is geïnstalleerd maar een kapot of ontbrekend manifest of schema heeft,
  mislukt validatie en rapporteert Doctor de Plugin-fout.
- Als Plugin-configuratie bestaat maar de Plugin is **uitgeschakeld**, blijft de configuratie behouden en
  wordt een **waarschuwing** getoond in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief lokale bestandssysteemloads. De runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor detectie + validatie.
- Native manifests worden met JSON5 geparsed, dus opmerkingen, afsluitende komma's en niet-geciteerde sleutels worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden door de manifestloader gelezen. Vermijd aangepaste sleutels op topniveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische metadata van provider-catalogi of smalle discovery-descriptors, niet voor uitvoering tijdens requests.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Metadata voor omgevingsvariabelen (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, validatie van cronlevering en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activeringsbeleid toe voordat een omgevingsvariabele als geconfigureerd wordt behandeld.
- Zie [runtime-hooks voor providers](/nl/plugins/architecture-internals#provider-runtime-hooks) voor metadata van runtimewizards die providercode vereist.
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlist-vereisten van package managers (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Plugin-architectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capability-model.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin SDK-referentie en subpadimports.
  </Card>
</CardGroup>
