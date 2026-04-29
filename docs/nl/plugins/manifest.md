---
read_when:
    - Je bouwt een Plugin voor OpenClaw
    - Je moet een Plugin-configuratieschema leveren of Plugin-validatiefouten debuggen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-04-29T23:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a529f9d4388039d76a6e351b454622b657a1ddcd4f4159f10be988568343cc2
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
Claude-bundel-LSP-standaardwaarden en ondersteunde hook-packs wanneer de indeling overeenkomt
met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw Plugin **moet** een `openclaw.plugin.json`-bestand leveren in de
**Plugin-root**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugin-code uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
Plugin-fouten en blokkeren configuratievalidatie.

Zie de volledige handleiding voor het Plugin-systeem: [Plugins](/nl/tools/plugin).
Voor het native capability-model en de huidige richtlijnen voor externe compatibiliteit:
[Capability-model](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugin-code laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Plugin-runtime te starten.

**Gebruik het voor:**

- Plugin-identiteit, configuratievalidatie en hints voor de configuratie-UI
- metadata voor auth, onboarding en setup (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activatiehints voor control-plane-oppervlakken
- eigenaarschap van steno-model-families
- statische snapshots van capability-eigenaarschap (`contracts`)
- QA-runner-metadata die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die worden samengevoegd in catalogus- en validatie-oppervlakken

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

| Veld                                 | Vereist | Type                             | Wat het betekent                                                                                                                                                                                                                  |
| ------------------------------------ | ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                    |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de configuratie van deze plugin.                                                                                                                                                                          |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde plugin als standaard ingeschakeld. Laat dit weg, of stel een niet-`true` waarde in, om de plugin standaard uitgeschakeld te laten.                                                                         |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde id's die naar deze canonieke plugin-id normaliseren.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-id's die deze plugin automatisch moeten inschakelen wanneer auth, configuratie of modelreferenties ze vermelden.                                                                                                         |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve pluginsoort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                  |
| `channels`                           | Nee     | `string[]`                       | Kanaal-id's die eigendom zijn van deze plugin. Gebruikt voor ontdekking en configuratievalidatie.                                                                                                                                  |
| `providers`                          | Nee     | `string[]`                       | Provider-id's die eigendom zijn van deze plugin.                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht modulepad voor providerontdekking, relatief ten opzichte van de plugin-root, voor manifest-gescopete providercatalogusmetadata die kunnen worden geladen zonder de volledige plugin-runtime te activeren.             |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte metadata voor modelfamilies, gebruikt om de plugin automatisch te laden vóór de runtime.                                                                                                      |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze plugin. Dit is het control-plane-contract voor toekomstige alleen-lezenlijsten, onboarding, modelkiezers, aliassen en onderdrukking zonder plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd extern prijsopzoekbeleid. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te laten stappen of providerreferenties naar OpenRouter/LiteLLM-catalogus-id's te mappen zonder provider-id's hard te coderen in core. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime wordt geladen.                                                                                          |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde endpoint-host/baseUrl-metadata voor providerroutes die core moet classificeren voordat de provider-runtime wordt geladen.                                                                               |
| `providerRequest`                    | Nee     | `object`                         | Goedkope providerfamilie- en request-compatibiliteitsmetadata die door generiek requestbeleid worden gebruikt voordat de provider-runtime wordt geladen.                                                                            |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inference-backend-id's die eigendom zijn van deze plugin. Gebruikt voor automatische activatie bij het opstarten vanuit expliciete configuratiereferenties.                                                                    |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backendreferenties waarvan de plugin-eigen synthetische auth-hook moet worden geprobed tijdens koude modelontdekking voordat de runtime wordt geladen.                                                           |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Placeholder-API-sleutelwaarden die eigendom zijn van gebundelde plugins en niet-geheime lokale, OAuth- of omgevingscredentialstatus vertegenwoordigen.                                                                             |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze plugin en pluginbewuste configuratie- en CLI-diagnostiek moeten produceren voordat de runtime wordt geladen.                                                                              |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor auth-/statusopzoeking van providers. Geef voor nieuwe plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de deprecation window.                    |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-id's die een andere provider-id moeten hergebruiken voor auth-opzoeking, bijvoorbeeld een codingprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                                |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder plugincode te laden. Gebruik dit voor env-gestuurde kanaalsetup of auth-oppervlakken die generieke opstart-/configuratiehelpers moeten zien.                     |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboardingkiezers, resolutie van voorkeursproviders en eenvoudige bedrading van CLI-flags.                                                                                                       |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activatieplanner voor laden dat wordt getriggerd door opstarten, providers, commando's, kanalen, routes en capabilities. Alleen metadata; de plugin-runtime blijft eigenaar van het daadwerkelijke gedrag. |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingdescriptors die ontdekking en setup-oppervlakken kunnen inspecteren zonder de plugin-runtime te laden.                                                                                                  |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerdescriptors die door de gedeelde `openclaw qa`-host worden gebruikt voordat de plugin-runtime wordt geladen.                                                                                                    |
| `contracts`                          | Nee     | `object`                         | Statische momentopname van gebundelde capabilities voor externe auth-hooks, spraak, realtime transcriptie, realtime stem, mediabegrip, beeldgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoekopdrachten en tool-eigendom. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                   |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Door het manifest beheerde kanaalconfiguratiemetadata die worden samengevoegd in ontdekkings- en validatieoppervlakken voordat de runtime wordt geladen.                                                                           |
| `skills`                             | Nee     | `string[]`                       | Skill-mappen om te laden, relatief ten opzichte van de plugin-root.                                                                                                                                                               |
| `name`                               | Nee     | `string`                         | Voor mensen leesbare pluginnaam.                                                                                                                                                                                                  |
| `description`                        | Nee     | `string`                         | Korte samenvatting die wordt getoond in pluginoppervlakken.                                                                                                                                                                       |
| `version`                            | Nee     | `string`                         | Informatieve pluginversie.                                                                                                                                                                                                        |
| `uiHints`                            | Nee     | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidshints voor configuratievelden.                                                                                                                                                            |

## providerAuthChoices-referentie

Elke `providerAuthChoices`-vermelding beschrijft één onboarding- of auth-keuze.
OpenClaw leest dit voordat de provider-runtime wordt geladen.
Providersetuplijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide setupkeuzes
en installatiecatalogusmetadata zonder de provider-runtime te laden.

| Veld                  | Vereist | Type                                            | Betekenis                                                                                                |
| --------------------- | ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                  |
| `method`              | Ja      | `string`                                        | Auth-methode-id waarnaar moet worden doorgestuurd.                                                       |
| `choiceId`            | Ja      | `string`                                        | Stabiele auth-choice-id die wordt gebruikt door onboarding- en CLI-flows.                                |
| `choiceLabel`         | Nee     | `string`                                        | Gebruikersgericht label. Als dit wordt weggelaten, valt OpenClaw terug op `choiceId`.                    |
| `choiceHint`          | Nee     | `string`                                        | Korte helptekst voor de picker.                                                                          |
| `assistantPriority`   | Nee     | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistant aangestuurde interactieve pickers.          |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistant-pickers, maar sta handmatige CLI-selectie nog steeds toe.                |
| `deprecatedChoiceIds` | Nee     | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorsturen.                      |
| `groupId`             | Nee     | `string`                                        | Optionele groep-id voor het groeperen van gerelateerde keuzes.                                           |
| `groupLabel`          | Nee     | `string`                                        | Gebruikersgericht label voor die groep.                                                                  |
| `groupHint`           | Nee     | `string`                                        | Korte helptekst voor de groep.                                                                           |
| `optionKey`           | Nee     | `string`                                        | Interne optionsleutel voor eenvoudige auth-flows met een enkele vlag.                                    |
| `cliFlag`             | Nee     | `string`                                        | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                      |
| `cliOption`           | Nee     | `string`                                        | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nee     | `string`                                        | Beschrijving die wordt gebruikt in CLI-help.                                                             |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Als dit wordt weggelaten, is de standaard `["text-inference"]`. |

## commandAliases-referentie

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers per ongeluk in `plugins.allow` kunnen zetten of als root-CLI-opdracht proberen uit te voeren. OpenClaw gebruikt deze metadata voor diagnostiek zonder plugin-runtimecode te importeren.

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

| Veld         | Vereist | Type              | Betekenis                                                               |
| ------------ | ------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Opdrachtnaam die bij deze plugin hoort.                                 |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als een chat-slashopdracht in plaats van een root-CLI-opdracht. |
| `cliCommand` | Nee     | `string`          | Gerelateerde root-CLI-opdracht om voor CLI-bewerkingen voor te stellen, als die bestaat. |

## activation-referentie

Gebruik `activation` wanneer de plugin goedkoop kan declareren bij welke control-plane-events deze moet worden opgenomen in een activation-/laadplan.

Dit blok is plannermetadata, geen lifecycle-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en belooft niet dat plugincode al is uitgevoerd. De activation-planner gebruikt deze velden om kandidaat-plugins te beperken voordat wordt teruggevallen op bestaande manifest-eigenaarschapsmetadata zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die het eigenaarschap al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, setup-descriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra plannerhints die niet door die eigenaarschapsvelden kunnen worden weergegeven.
Gebruik top-level `cliBackends` voor CLI-runtimealiases zoals `claude-cli`, `codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor ingebedde agent-harness-id's die nog geen eigenaarschapsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt `register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet. Huidige consumers gebruiken het als een beperkende hint voordat breder plugins worden geladen, dus ontbrekende activation-metadata kost meestal alleen prestaties; het zou de correctheid niet moeten veranderen zolang legacy-manifest-eigenaarschapsfallbacks nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen terwijl OpenClaw afstand neemt van impliciete startup-imports. Zet dit alleen op `true` wanneer de plugin tijdens Gateway-startup moet worden uitgevoerd. Zet dit op `false` wanneer de plugin bij startup inert is en alleen via smallere triggers moet laden. Het weglaten van `onStartup` behoudt de verouderde legacy impliciete startup-sidecarfallback voor plugins zonder statische capability-metadata; toekomstige versies stoppen mogelijk met het laden van die plugins bij startup tenzij ze `activation.onStartup: true` declareren. Plugin-status- en compatibiliteitsrapporten waarschuwen met `legacy-implicit-startup-sidecar` wanneer een plugin nog steeds op die fallback vertrouwt.

Stel voor migratietests
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` in om alleen die verouderde fallback uit te schakelen. Deze opt-inmodus blokkeert geen expliciete `activation.onStartup: true`-plugins of plugins die worden geladen door kanaal-, config-, agent-harness-, geheugen- of andere smallere activation-triggers.

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

| Veld               | Vereist | Type                                                 | Betekenis                                                                                                                                                                                                                          |
| ------------------ | ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-startupactivation. Elke plugin moet dit instellen. `true` importeert de plugin tijdens startup; `false` kiest uit voor de verouderde impliciete sidecar-startupfallback, tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze plugin moeten opnemen in activation-/laadplannen.                                                                                                                                                           |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Ingebedde agent-harness-runtime-id's die deze plugin moeten opnemen in activation-/laadplannen. Gebruik top-level `cliBackends` voor CLI-backendaliases.                                                                           |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's die deze plugin moeten opnemen in activation-/laadplannen.                                                                                                                                                           |
| `onChannels`       | Nee     | `string[]`                                           | Kanaal-id's die deze plugin moeten opnemen in activation-/laadplannen.                                                                                                                                                             |
| `onRoutes`         | Nee     | `string[]`                                           | Routesoorten die deze plugin moeten opnemen in activation-/laadplannen.                                                                                                                                                            |
| `onConfigPaths`    | Nee     | `string[]`                                           | Root-relatieve config-paden die deze plugin moeten opnemen in startup-/laadplannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                                                                 |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capability-hints die worden gebruikt door control-plane activation-planning. Geef waar mogelijk de voorkeur aan smallere velden.                                                                                              |

Huidige live consumers:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startup-import en opt-out van de verouderde impliciete sidecar-startupfallback
- door opdrachten getriggerde CLI-planning valt terug op legacy `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-startupplanning gebruikt `activation.onAgentHarnesses` voor ingebedde harnesses en top-level `cliBackends[]` voor CLI-runtimealiases
- door kanalen getriggerde setup-/kanaalplanning valt terug op legacy `channels[]`-eigenaarschap wanneer expliciete kanaal-activation-metadata ontbreekt
- startup-pluginplanning gebruikt `activation.onConfigPaths` voor niet-kanaal-rootconfig-oppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy `providers[]`- en top-level `cliBackends[]`-eigenaarschap wanneer expliciete provider-activation-metadata ontbreekt

Plannerdiagnostiek kan expliciete activation-hints onderscheiden van manifest-eigenaarschapsfallback. Bijvoorbeeld, `activation-command-hint` betekent dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn bedoeld voor hostdiagnostiek en tests; pluginauteurs moeten de metadata blijven declareren die het eigenaarschap het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transport-runners bijdraagt onder de gedeelde `openclaw qa`-root. Houd deze metadata goedkoop en statisch; de plugin-runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht `runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

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
| `commandName` | Ja      | `string` | Subcommando gekoppeld onder `openclaw qa`, bijvoorbeeld `matrix`.  |
| `description` | Nee     | `string` | Terugval-hulptekst die wordt gebruikt wanneer de gedeelde host een stubcommando nodig heeft. |

## naslag voor setup

Gebruik `setup` wanneer setup- en onboarding-oppervlakken goedkope metadata in eigendom van de plugin nodig hebben
voordat de runtime laadt.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Top-level `cliBackends` blijft geldig en blijft CLI-inferentiebackends
beschrijven. `setup.cliBackends` is het setup-specifieke descriptoroppervlak voor
control-plane/setup-stromen die uitsluitend uit metadata moeten blijven bestaan.

Wanneer aanwezig zijn `setup.providers` en `setup.cliBackends` het voorkeursoppervlak
voor descriptor-first lookup bij setup-detectie. Als de descriptor alleen de
kandidaat-plugin beperkt en setup nog rijkere runtime-hooks tijdens setup nodig heeft,
zet dan `requiresRuntime: true` en laat `setup-api` aanwezig als het
terugval-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en
env-var-lookups. `providerAuthEnvVars` blijft tijdens de deprecation window ondersteund
via een compatibiliteitsadapter, maar niet-gebundelde plugins die dit nog gebruiken
krijgen een manifestdiagnose. Nieuwe plugins moeten setup/status-env-metadata
op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setup-keuzes afleiden uit `setup.providers[].authMethods`
wanneer er geen setup-vermelding beschikbaar is, of wanneer `setup.requiresRuntime: false`
verklaart dat setup-runtime niet nodig is. Expliciete `providerAuthChoices`-vermeldingen
blijven de voorkeur houden voor aangepaste labels, CLI-vlaggen, onboarding-scope en assistentmetadata.

Zet `requiresRuntime: false` alleen wanneer die descriptors voldoende zijn voor het
setup-oppervlak. OpenClaw behandelt expliciet `false` als een descriptor-only contract
en zal `setup-api` of `openclaw.setupEntry` niet uitvoeren voor setup-lookup. Als
een descriptor-only plugin nog steeds een van die setup-runtimevermeldingen levert,
rapporteert OpenClaw een additieve diagnose en blijft deze negeren. Een weggelaten
`requiresRuntime` behoudt legacy-terugvalgedrag zodat bestaande plugins die descriptors
zonder de vlag hebben toegevoegd niet breken.

Omdat setup-lookup plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
waarden voor `setup.providers[].id` en `setup.cliBackends[]` uniek blijven over alle
ontdekte plugins heen. Ambigue eigenaarschap faalt gesloten in plaats van een
winnaar uit de detectievolgorde te kiezen.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteren setup-registerdiagnoses
descriptordrift als `setup-api` een provider of CLI-backend registreert die niet door
de manifestdescriptors wordt gedeclareerd, of als een descriptor geen overeenkomende
runtime-registratie heeft. Deze diagnoses zijn additief en wijzen legacy-plugins niet af.

### naslag voor setup.providers

| Veld          | Vereist | Type       | Wat het betekent                                                                    |
| ------------- | ------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Ja      | `string`   | Provider-id getoond tijdens setup of onboarding. Houd genormaliseerde ids wereldwijd uniek. |
| `authMethods` | Nee     | `string[]` | Setup/auth-methode-ids die deze provider ondersteunt zonder de volledige runtime te laden. |
| `envVars`     | Nee     | `string[]` | Env-vars die generieke setup/status-oppervlakken kunnen controleren voordat de plugin-runtime laadt. |

### setup-velden

| Veld               | Vereist | Type       | Wat het betekent                                                                                 |
| ------------------ | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Nee     | `object[]` | Provider-setupdescriptors getoond tijdens setup en onboarding.                                   |
| `cliBackends`      | Nee     | `string[]` | Backend-ids tijdens setup, gebruikt voor descriptor-first setup-lookup. Houd genormaliseerde ids wereldwijd uniek. |
| `configMigrations` | Nee     | `string[]` | Config-migratie-ids die eigendom zijn van het setup-oppervlak van deze plugin.                   |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup na descriptor-lookup nog uitvoering van `setup-api` nodig heeft.                        |

## naslag voor uiHints

`uiHints` is een map van config-veldnamen naar kleine renderhints.

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

| Veld          | Type       | Wat het betekent                              |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Gebruikersgericht veldlabel.                 |
| `help`        | `string`   | Korte hulptekst.                             |
| `tags`        | `string[]` | Optionele UI-tags.                           |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.           |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.    |
| `placeholder` | `string`   | Tijdelijke aanduiding voor formulierinvoer.  |

## naslag voor contracts

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
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Factory-ids voor Codex app-serverextensions, momenteel `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ids waarvoor een gebundelde plugin tool-result-middleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-ids waarvan deze plugin de externe-auth-profielhook bezit.    |
| `speechProviders`                | `string[]` | Speech-provider-ids die deze plugin bezit.                             |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription-provider-ids die deze plugin bezit.             |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice-provider-ids die deze plugin bezit.                     |
| `memoryEmbeddingProviders`       | `string[]` | Memory embedding-provider-ids die deze plugin bezit.                   |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-ids die deze plugin bezit.                |
| `imageGenerationProviders`       | `string[]` | Image-generation-provider-ids die deze plugin bezit.                   |
| `videoGenerationProviders`       | `string[]` | Video-generation-provider-ids die deze plugin bezit.                   |
| `webFetchProviders`              | `string[]` | Web-fetch-provider-ids die deze plugin bezit.                          |
| `webSearchProviders`             | `string[]` | Web-search-provider-ids die deze plugin bezit.                         |
| `migrationProviders`             | `string[]` | Importprovider-ids die deze plugin bezit voor `openclaw migrate`.      |
| `tools`                          | `string[]` | Agent-toolnamen die deze plugin bezit voor gebundelde contractcontroles. |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde, uitsluitend voor de Codex
app-server bestemde extension factories. Gebundelde tool-result-transformaties moeten
`contracts.agentToolResultMiddleware` declareren en in plaats daarvan registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-result-middleware registreren omdat de seam tooloutput met hoge vertrouwenswaarde kan herschrijven
voordat het model deze ziet.

Provider-plugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder die declaratie blijven
via een verouderde compatibiliteitsterugval draaien, maar die terugval is trager en
wordt na de migratieperiode verwijderd.

Gebundelde memory embedding-providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die ze tonen, inclusief
ingebouwde adapters zoals `local`. Standalone CLI-paden gebruiken dit manifestcontract
om alleen de eigenaar-plugin te laden voordat de volledige Gateway-runtime providers heeft
geregistreerd.

## naslag voor mediaUnderstandingProviderMetadata

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, fallbackprioriteit voor auto-auth of native documentondersteuning heeft die
generieke core-helpers nodig hebben voordat de runtime laadt. Sleutels moeten ook worden gedeclareerd in
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
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediacapabilities die door deze provider worden getoond.                     |
| `defaultModels`        | `Record<string, string>`            | Capability-naar-model-standaarden die worden gebruikt wanneer config geen model specificeert. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische fallback op basis van credentials. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                |

## naslag voor channelConfigs

Gebruik `channelConfigs` wanneer een kanaal-plugin goedkope config-metadata nodig heeft voordat
de runtime laadt. Alleen-lezen detectie voor kanaalsetup/status kan deze metadata
rechtstreeks gebruiken voor geconfigureerde externe kanalen wanneer er geen setup-vermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` verklaart dat setup-runtime niet nodig is.

`channelConfigs` is pluginmanifestmetadata, geen nieuwe top-level gebruikersconfigsectie.
Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke plugin dat geconfigureerde
kanaal bezit voordat plugin-runtimecode wordt uitgevoerd.

Voor een kanaal-plugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-items declareren. Zonder deze items kan OpenClaw de plugin nog steeds laden, maar
kunnen het cold-path-configuratieschema, de setup en Control UI-oppervlakken de
door het kanaal beheerde optiestructuur pas kennen zodra de plugin-runtime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaardwaarden declareren voor opdrachtconfiguratiecontroles
die worden uitgevoerd voordat de kanaal-runtime wordt geladen. Gebundelde kanalen kunnen
dezelfde standaardwaarden ook publiceren via `package.json#openclaw.channel.commands`, naast
hun andere pakketbeheerde kanaalcatalogusmetadata.

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

Elk kanaalitem kan het volgende bevatten:

| Veld          | Type                     | Wat het betekent                                                                                |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elk gedeclareerd kanaalconfiguratie-item.        |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoelige hints voor die kanaalconfiguratiesectie.             |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in kiezer- en inspectieoppervlakken wanneer runtime-metadata nog niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                              |
| `commands`    | `object`                 | Statische standaardwaarden voor automatisch ingeschakelde native opdrachten en native Skills voor pre-runtime-configuratiecontroles. |
| `preferOver`  | `string[]`               | Verouderde of lagere-prioriteit-plugin-id's die dit kanaal in selectieoppervlakken moet overtreffen. |

### Een andere kanaalplugin vervangen

Gebruik `preferOver` wanneer je plugin de voorkeursbeheerder is voor een kanaal-id dat
ook door een andere plugin kan worden geleverd. Veelvoorkomende gevallen zijn een hernoemde plugin-id, een
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

Wanneer `channels.chat` is geconfigureerd, overweegt OpenClaw zowel de kanaal-id als
de voorkeursplugin-id. Als de lagere-prioriteit-plugin alleen was geselecteerd omdat
deze gebundeld is of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtime-configuratie, zodat één plugin eigenaar is van het kanaal en de bijbehorende tools. Expliciete gebruikersselectie
blijft leidend: als de gebruiker beide plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het diagnostiek voor dubbele kanalen/tools in plaats van
de gevraagde pluginset stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot plugin-id's die daadwerkelijk hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## modelSupport-referentie

Gebruik `modelSupport` wanneer OpenClaw je providerplugin moet afleiden uit
verkorte model-id's zoals `gpt-5.5` of `claude-sonnet-4.6` voordat de plugin-runtime
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

- expliciete `provider/model`-refs gebruiken de beherende `providers`-manifestmetadata
- `modelPatterns` gaan boven `modelPrefixes`
- als één niet-gebundelde plugin en één gebundelde plugin allebei overeenkomen, wint de niet-gebundelde
  plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden vergeleken met verkorte model-id's.           |
| `modelPatterns` | `string[]` | Regex-bronnen die worden vergeleken met verkorte model-id's na verwijdering van het profielsuffix. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
de plugin-runtime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
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

Velden op het hoogste niveau:

| Veld           | Type                                                     | Wat het betekent                                                                                               |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die door deze plugin worden beheerd. Sleutels moeten ook voorkomen in `providers` op het hoogste niveau. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten worden herleid tot een beheerde provider voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze plugin om een providerspecifieke reden onderdrukt.                     |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, naar cache kan worden ververst, of runtime vereist. |

`aliases` neemt deel aan het opzoeken van providereigenaarschap voor modelcatalogusplanning.
Aliastargets moeten providers op het hoogste niveau zijn die door dezelfde plugin worden beheerd. Wanneer een
op provider gefilterde lijst een alias gebruikt, kan OpenClaw het beherende manifest lezen en
alias-API-/basis-URL-overschrijvingen toepassen zonder provider-runtime te laden.
Aliassen breiden ongefilterde catalogusvermeldingen niet uit; brede lijsten geven alleen de beherende
canonieke providerrijen weer.

`suppressions` vervangt de oude provider-runtimehook `suppressBuiltInModel`.
Onderdrukkingsitems worden alleen gerespecteerd wanneer de provider door de plugin wordt beheerd of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een beheerde provider verwijst. Runtime-
onderdrukkingshooks worden niet meer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                       |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus.  |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die gelden voor deze providercatalogus.    |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.           |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                                  |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Providerlokale model-id, zonder het `provider/`-prefix.                           |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                           |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                           |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                                     |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                            |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                            |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag beschikbaar stelt.                                    |
| `contextWindow` | `number`                                                       | Native providercontextvenster.                                                    |
| `contextTokens` | `number`                                                       | Optionele effectieve runtime-contextlimiet wanneer deze afwijkt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximaal aantal uitvoertokens wanneer bekend.                                     |
| `cost`          | `object`                                                       | Optionele prijsstelling in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Alleen onderdrukken wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.                |
| `replaces`      | `string[]`                                                     | Oudere providerlokale model-id's die dit model vervangt.                          |
| `replacedBy`    | `string`                                                       | Vervangende providerlokale model-id voor verouderde rijen.                        |
| `tags`          | `string[]`                                                     | Stabiele tags die worden gebruikt door kiezers en filters.                        |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                               |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstream-rij die moet worden onderdrukt. Moet eigendom zijn van deze plugin of zijn gedeclareerd als een alias in eigendom. |
| `model`                    | `string`   | Provider-lokaal model-id dat moet worden onderdrukt.                                                           |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt aangevraagd.                 |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve provider-basis-URL-hosts die vereist zijn voordat de onderdrukking geldt.       |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte provider-configuratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen gegevens die alleen tijdens runtime bestaan in `modelCatalog`. Gebruik `static` alleen wanneer manifest
rijen volledig genoeg zijn zodat provider-gefilterde lijst- en pickeroppervlakken
registry-/runtime-detectie kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige
lijstbare seeds of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen;
refreshable rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, door de provider beheerde opschoning van model-id's die moet
plaatsvinden voordat provider-runtime wordt geladen. Dit houdt aliassen zoals korte modelnamen,
provider-lokale legacy-id's en regels voor proxyprefixen in het manifest van de eigenaarplugin
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

| Veld                                 | Type                    | Wat het betekent                                                                         |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exacte model-id-aliassen, niet hoofdlettergevoelig. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Prefixen die vóór aliasopzoeking moeten worden verwijderd, nuttig voor legacy provider/model-duplicatie. |
| `prefixWhenBare`                     | `string`                | Prefix om toe te voegen wanneer het genormaliseerde model-id nog geen `/` bevat.         |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke prefixregels voor kale id's na aliasopzoeking, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat provider-runtime wordt geladen. Core blijft eigenaar van de betekenis van elke
`endpointClass`; pluginmanifesten zijn eigenaar van de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Wat het betekent                                                                                  |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.            |
| `hosts`                        | `string[]` | Exacte hostnamen die naar de endpointklasse verwijzen.                                            |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die naar de endpointklasse verwijzen. Prefix met `.` voor matching alleen op domeinsuffix. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die naar de endpointklasse verwijzen.                  |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                          |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van matchende hosts te strippen om de Google Vertex-regioprefix zichtbaar te maken.     |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope metadata voor aanvraagcompatibiliteit die generiek
aanvraagbeleid nodig heeft zonder provider-runtime te laden. Houd gedragsspecifieke
payload-herschrijving in provider-runtime-hooks of gedeelde helpers voor providerfamilies.

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
| `family`              | `string`     | Providerfamilielabel dat wordt gebruikt door generieke beslissingen en diagnostiek voor aanvraagcompatibiliteit. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitsbucket voor providerfamilies voor gedeelde aanvraaghelpers. |
| `openAICompletions`   | `object`     | OpenAI-compatibele vlaggen voor completions-aanvragen, momenteel `supportsStreamingUsage`. |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider prijsstellingsgedrag in het control plane nodig heeft voordat
runtime wordt geladen. De Gateway-prijscache leest deze metadata zonder
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

| Veld         | Type              | Wat het betekent                                                                                       |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelf-gehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking uit voor deze provider. |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking uit voor deze provider.       |

Bronvelden:

| Veld                       | Type               | Wat het betekent                                                                                                  |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogusprovider-id wanneer dit verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met een slash als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra varianten van model-id's voor externe catalogi. `version-dots` probeert gestippelde versie-id's zoals `claude-opus-4.6`. |

### OpenClaw-providerindex

De OpenClaw-providerindex is door OpenClaw beheerde previewmetadata voor providers
waarvan de plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een pluginmanifest.
Pluginmanifesten blijven de autoriteit voor geïnstalleerde plugins. De providerindex is
het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install
modelpickers zullen gebruiken wanneer een providerplugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd pluginmanifest `modelCatalog`.
3. Modelcataloguscache van expliciete refresh.
4. Previewrijen uit de OpenClaw-providerindex.

De providerindex mag geen geheimen, ingeschakelde status, runtime-hooks of
live accountspecifieke modelgegevens bevatten. De previewcatalogi gebruiken dezelfde
`modelCatalog`-providerrijvorm als pluginmanifesten, maar moeten beperkt blijven
tot stabiele weergavemetadata, tenzij runtime-adaptervelden zoals `api`,
`baseUrl`, prijsstelling of compatibiliteitsvlaggen bewust afgestemd blijven op
het geïnstalleerde pluginmanifest. Providers met live `/models`-detectie moeten
vernieuwde rijen schrijven via het expliciete modelcataloguscachepad in plaats van
normale listing- of onboarding-aanroepen provider-API's te laten gebruiken.

Providerindexitems kunnen ook metadata voor installeerbare plugins bevatten voor providers
waarvan de plugin uit core is verplaatst of anderszins nog niet is geïnstalleerd. Deze
metadata spiegelt het kanaalcataloguspatroon: pakketnaam, npm-installatiespecificatie,
verwachte integriteit en goedkope labels voor auth-keuzes zijn genoeg om een
installeerbare installatieoptie te tonen. Zodra de plugin is geïnstalleerd, wint het manifest
en wordt de providerindexvermelding genegeerd voor die provider.

Legacy capability-sleutels op topniveau zijn verouderd. Gebruik `openclaw doctor --fix` om
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` en `webSearchProviders` onder `contracts` te plaatsen; normaal
manifestladen behandelt die topniveauvelden niet langer als capability-eigendom.

## Manifest versus package.json

De twee bestanden dienen verschillende doelen:

| Bestand                | Gebruik het voor                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configuratievalidatie, auth-keuzemetadata en UI-hints die moeten bestaan voordat plugincode wordt uitgevoerd      |
| `package.json`         | npm-metadata, dependency-installatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatiepoorten, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat plugincode wordt geladen, plaats het in `openclaw.plugin.json`
- als het gaat over packaging, entrybestanden of npm-installatiegedrag, plaats het in `package.json`

### package.json-velden die detectie beïnvloeden

Sommige pre-runtime pluginmetadata staat bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.

Belangrijke voorbeelden:

| Veld                                                              | Wat het betekent                                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declareert native Plugin-entrypoints. Moet binnen de Plugin-pakketdirectory blijven.                                                                                                    |
| `openclaw.runtimeExtensions`                                      | Declareert gebouwde JavaScript-runtime-entrypoints voor geinstalleerde pakketten. Moet binnen de Plugin-pakketdirectory blijven.                                                       |
| `openclaw.setupEntry`                                             | Lichtgewicht setup-only entrypoint dat wordt gebruikt tijdens onboarding, uitgestelde kanaalstart en discovery van alleen-lezen kanaalstatus/SecretRef. Moet binnen de Plugin-pakketdirectory blijven. |
| `openclaw.runtimeSetupEntry`                                      | Declareert het gebouwde JavaScript-setup-entrypoint voor geinstalleerde pakketten. Moet binnen de Plugin-pakketdirectory blijven.                                                      |
| `openclaw.channel`                                                | Goedkope kanaalcatalogusmetadata zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                           |
| `openclaw.channel.commands`                                       | Statische native opdracht- en native skill-auto-defaultmetadata die worden gebruikt door configuratie-, audit- en opdrachtenlijstoppervlakken voordat de kanaalruntime wordt geladen.   |
| `openclaw.channel.configuredState`                                | Lichtgewicht metadata voor configured-state-checkers die "bestaat setup via alleen env al?" kan beantwoorden zonder de volledige kanaalruntime te laden.                               |
| `openclaw.channel.persistedAuthState`                             | Lichtgewicht metadata voor persisted-auth-checkers die "is er al iets ingelogd?" kan beantwoorden zonder de volledige kanaalruntime te laden.                                          |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installatie-/updatehints voor gebundelde en extern gepubliceerde Plugins.                                                                                                              |
| `openclaw.install.defaultChoice`                                  | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                          |
| `openclaw.install.minHostVersion`                                 | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22`.                                                                                              |
| `openclaw.install.expectedIntegrity`                              | Verwachte npm-dist-integriteitsstring zoals `sha512-...`; installatie- en updateflows verifieren het opgehaalde artefact daartegen.                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Staat een smal herstelpad voor herinstallatie van gebundelde Plugins toe wanneer de configuratie ongeldig is.                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Laat setup-only kanaaloppervlakken laden voor de volledige kanaal-Plugin tijdens het opstarten.                                                                                        |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes in onboarding verschijnen voordat runtimes worden geladen. `package.json#openclaw.install` vertelt onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die keuzes selecteert. Verplaats installatiehints niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en het laden van het manifestregister. Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden slaan de Plugin over op oudere hosts.

Exacte npm-versiepinnen staan al in `npmSpec`, bijvoorbeeld `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiele externe catalogusvermeldingen moeten exacte specificaties koppelen aan `expectedIntegrity` zodat updateflows gesloten falen als het opgehaalde npm-artefact niet langer overeenkomt met de gepinde release. Interactieve onboarding blijft vertrouwde npm-specificaties uit het register aanbieden, inclusief kale pakketnamen en dist-tags, voor compatibiliteit. Catalogusdiagnostiek kan onderscheid maken tussen exacte, zwevende, met integriteit gepinde, ontbrekende-integriteit-, pakketnaam-mismatch- en ongeldige default-choice-bronnen. Ze waarschuwen ook wanneer `expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee gepind kan worden. Wanneer `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af; wanneer het ontbreekt, wordt de registerresolutie vastgelegd zonder integriteitspin.

Kanaal-Plugins moeten `openclaw.setupEntry` bieden wanneer status-, kanaallijst- of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige runtime te laden. Het setup-entrypoint moet kanaalmetadata plus setup-veilige adapters voor config, status en geheimen blootstellen; houd netwerkclients, Gateway-listeners en transportruntimes in het hoofdentrypoint van de extensie.

Runtime-entrypointvelden omzeilen pakketgrenscontroles voor bron-entrypointvelden niet. `openclaw.runtimeExtensions` kan er bijvoorbeeld niet voor zorgen dat een ontsnappend `openclaw.extensions`-pad laadbaar wordt.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt niet zomaar willekeurige kapotte configuraties installeerbaar. Tegenwoordig staat het installatieflows alleen toe te herstellen van specifieke verouderde upgradefouten van gebundelde Plugins, zoals een ontbrekend gebundeld Plugin-pad of een verouderde `channels.<id>`-vermelding voor diezelfde gebundelde Plugin. Niet-gerelateerde configuratiefouten blokkeren installatie nog steeds en sturen operators naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine checker-module:

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

Gebruik dit wanneer setup-, doctor-, status- of alleen-lezen presence-flows een goedkope ja/nee-auth-probe nodig hebben voordat de volledige kanaal-Plugin wordt geladen. Persisted auth state is geen geconfigureerde kanaalstatus: gebruik deze metadata niet om Plugins automatisch in te schakelen, runtime-afhankelijkheden te repareren of te bepalen of een kanaalruntime moet laden. De doel-export moet een kleine functie zijn die alleen persisted state leest; leid deze niet via de volledige barrel van de kanaalruntime.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope configured-checks op basis van alleen env:

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

Gebruik dit wanneer een kanaal configured-state kan beantwoorden op basis van env of andere kleine niet-runtime-invoer. Als de check volledige configresolutie of de echte kanaalruntime nodig heeft, houd die logica dan in de Plugin-hook `config.hasConfiguredState`.

## Discovery-volgorde (dubbele Plugin-id's)

OpenClaw ontdekt Plugins vanuit verschillende roots (gebundeld, globale installatie, workspace, expliciete door configuratie geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste prioriteit** behouden; duplicaten met lagere prioriteit worden verwijderd in plaats van ernaast geladen.

Prioriteit, van hoog naar laag:

1. **Door configuratie geselecteerd** — een pad dat expliciet is gepind in `plugins.entries.<id>`
2. **Gebundeld** — Plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — Plugins die zijn geinstalleerd in de globale OpenClaw Plugin-root
4. **Workspace** — Plugins die relatief tot de huidige workspace worden ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde Plugin in de workspace overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin daadwerkelijk te overschrijven met een lokale versie, pin je die via `plugins.entries.<id>` zodat deze wint op basis van prioriteit in plaats van te vertrouwen op workspace-discovery.
- Verwijderde duplicaten worden gelogd zodat Doctor en opstartdiagnostiek naar de weggegooide kopie kunnen wijzen.

## JSON Schema-vereisten

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als deze geen configuratie accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd tijdens het lezen/schrijven van configuratie, niet tijdens runtime.

## Validatiegedrag

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id door een Plugin-manifest wordt gedeclareerd.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*` moeten verwijzen naar **ontdekbare** Plugin-id's. Onbekende id's zijn **fouten**.
- Als een Plugin is geinstalleerd maar een kapot of ontbrekend manifest of schema heeft, mislukt validatie en rapporteert Doctor de Plugin-fout.
- Als Plugin-configuratie bestaat maar de Plugin is **uitgeschakeld**, blijft de configuratie behouden en wordt een **waarschuwing** weergegeven in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Notities

- Het manifest is **vereist voor native OpenClaw-Plugins**, inclusief loads vanaf het lokale bestandssysteem. Runtime laadt de Plugin-module nog steeds afzonderlijk; het manifest is alleen voor discovery + validatie.
- Native manifests worden geparsed met JSON5, dus opmerkingen, afsluitende komma's en niet-gequote sleutels worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestloader. Vermijd aangepaste top-level sleutels.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een Plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtime-code importeren; gebruik het voor statische providercatalogusmetadata of smalle discovery-descriptors, niet voor uitvoering tijdens aanvragen.
- Exclusieve Plugin-soorten worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer de exclusieve Plugin-soort in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere Plugins.
- Env-var-metadata (`setup.providers[].envVars`, verouderd `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, Cron-bezorgvalidatie en andere alleen-lezen oppervlakken passen nog steeds Plugin-vertrouwen en effectief activeringsbeleid toe voordat ze een env-var als geconfigureerd beschouwen.
- Voor runtime-wizardmetadata waarvoor providercode nodig is, zie [Provider-runtimehooks](/nl/plugins/architecture-internals#provider-runtime-hooks).
- Als je Plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlist-vereisten voor pakketbeheerders (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met Plugins.
  </Card>
  <Card title="Plugin-architectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capabilitymodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin SDK-referentie en subpath-imports.
  </Card>
</CardGroup>
