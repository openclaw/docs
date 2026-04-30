---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configschema leveren of Plugin-validatiefouten debuggen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-04-30T00:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4209b10042eaa88dca33073f3f5b8a024ee760bbe096fc2f476e12c2a874628e
    source_path: plugins/manifest.md
    workflow: 16
---

Deze pagina is alleen voor het **native OpenClaw Plugin-manifest**.

Voor compatibele bundelindelingen, zie [Plugin-bundels](/nl/plugins/bundles).

Compatibele bundelindelingen gebruiken andere manifestbestanden:

- Codex-bundel: `.codex-plugin/plugin.json`
- Claude-bundel: `.claude-plugin/plugin.json` of de standaard Claude-componentindeling
  zonder manifest
- Cursor-bundel: `.cursor-plugin/plugin.json`

OpenClaw detecteert die bundelindelingen ook automatisch, maar ze worden niet gevalideerd
tegen het hier beschreven schema `openclaw.plugin.json`.

Voor compatibele bundels leest OpenClaw momenteel bundelmetadata plus gedeclareerde
skill-roots, Claude-commandoroots, standaardwaarden voor Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hook-pakketten wanneer de indeling overeenkomt
met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw Plugin **moet** een bestand `openclaw.plugin.json` leveren in de
**pluginroot**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugincode uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
Plugin-fouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het Pluginsysteem: [Plugins](/nl/tools/plugin).
Voor het native capabilitymodel en de huidige richtlijnen voor externe compatibiliteit:
[Capabilitymodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugincode laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Plugin-runtime te starten.

**Gebruik het voor:**

- Plugin-identiteit, configuratievalidatie en hints voor de configuratie-UI
- metadata voor auth, onboarding en setup (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activeringshints voor control-plane-oppervlakken
- eigenaarschap van model families via verkorte notatie
- statische momentopnamen van capability-eigenaarschap (`contracts`)
- metadata voor QA-runner die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die worden samengevoegd in catalogus- en validatieoppervlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints,
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
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                   |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de config van deze Plugin.                                                                                                                                                                                |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een waarde in die niet `true` is, om de Plugin standaard uitgeschakeld te laten.                                                                 |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde id's die worden genormaliseerd naar deze canonieke Plugin-id.                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer auth-, config- of model refs ze vermelden.                                                                                                                   |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                                 |
| `channels`                           | Nee     | `string[]`                       | Kanaal-id's die eigendom zijn van deze Plugin. Gebruikt voor ontdekking en configvalidatie.                                                                                                                                       |
| `providers`                          | Nee     | `string[]`                       | Provider-id's die eigendom zijn van deze Plugin.                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht provider-discovery-modulepad, relatief ten opzichte van de Plugin-root, voor provider-catalogmetadata binnen manifestbereik die kan worden geladen zonder de volledige Plugin-runtime te activeren.                 |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte model-family-metadata die wordt gebruikt om de Plugin automatisch te laden vóór runtime.                                                                                                       |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-plane-contract voor toekomstige alleen-lezen-vermelding, onboarding, modelkiezers, aliassen en onderdrukking zonder Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd extern beleid voor prijsopzoekingen. Gebruik dit om lokale/zelfgehoste providers uit te sluiten van externe prijscatalogi of provider refs te koppelen aan OpenRouter/LiteLLM-catalogus-id's zonder provider-id's hard te coderen in core. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde opschoning van model-id-alias/prefix die moet worden uitgevoerd voordat de provider-runtime laadt.                                                                                                      |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde endpoint-host/baseUrl-metadata voor providerroutes die core moet classificeren voordat de provider-runtime laadt.                                                                                       |
| `providerRequest`                    | Nee     | `object`                         | Goedkope provider-family- en request-compatibility-metadata die door generiek requestbeleid wordt gebruikt voordat de provider-runtime laadt.                                                                                      |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inference-backend-id's die eigendom zijn van deze Plugin. Gebruikt voor automatische activatie bij opstarten vanuit expliciete config refs.                                                                                   |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backend refs waarvan de door de Plugin beheerde synthetic-auth-hook tijdens koude modelontdekking moet worden gecontroleerd voordat de runtime laadt.                                                            |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Door gebundelde Plugins beheerde placeholder-API-sleutelwaarden die niet-geheime lokale, OAuth- of omgevingscredentialstatus vertegenwoordigen.                                                                                   |
| `commandAliases`                     | Nee     | `object[]`                       | Commandonamen die eigendom zijn van deze Plugin en Plugin-bewuste config- en CLI-diagnostiek moeten produceren voordat de runtime laadt.                                                                                          |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteits-env-metadata voor provider-auth/status-opzoekingen. Geef voor nieuwe Plugins de voorkeur aan `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de deprecatiefase.                           |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-id's die een andere provider-id moeten hergebruiken voor auth-opzoekingen, bijvoorbeeld een codeerprovider die de API-sleutel en auth-profielen van de basisprovider deelt.                                             |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaal-env-metadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor env-gestuurde kanaalsetup of auth-oppervlakken die generieke opstart/config-helpers moeten zien.                         |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope auth-keuzemetadata voor onboarding-kiezers, voorkeursprovider-resolutie en eenvoudige CLI-flag-bedrading.                                                                                                                |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activatieplanner voor opstarten, provider, commando, kanaal, route en door capability getriggerd laden. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.              |
| `setup`                              | Nee     | `object`                         | Goedkope setup/onboarding-descriptors die ontdekking en setup-oppervlakken kunnen inspecteren zonder Plugin-runtime te laden.                                                                                                      |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerdescriptors die door de gedeelde `openclaw qa`-host worden gebruikt voordat de Plugin-runtime laadt.                                                                                                            |
| `contracts`                          | Nee     | `object`                         | Statische gebundelde capability-snapshot voor externe auth-hooks, spraak, realtime transcriptie, realtime stem, mediabegrip, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoekopdracht en tool-eigendom. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                   |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Door het manifest beheerde kanaalconfigmetadata die wordt samengevoegd in ontdekkings- en validatieoppervlakken voordat de runtime laadt.                                                                                        |
| `skills`                             | Nee     | `string[]`                       | Skill-mappen om te laden, relatief ten opzichte van de Plugin-root.                                                                                                                                                               |
| `name`                               | Nee     | `string`                         | Voor mensen leesbare Plugin-naam.                                                                                                                                                                                                 |
| `description`                        | Nee     | `string`                         | Korte samenvatting die wordt weergegeven in Plugin-oppervlakken.                                                                                                                                                                  |
| `version`                            | Nee     | `string`                         | Informatieve Plugin-versie.                                                                                                                                                                                                      |
| `uiHints`                            | Nee     | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidshints voor configvelden.                                                                                                                                                                  |

## `providerAuthChoices`-referentie

Elke `providerAuthChoices`-vermelding beschrijft één onboarding- of auth-keuze.
OpenClaw leest dit voordat de provider-runtime laadt.
Provider-setuplijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide setupkeuzes
en install-catalog-metadata zonder de provider-runtime te laden.

| Veld                  | Vereist | Type                                            | Wat het betekent                                                                                                                                                |
| --------------------- | ------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja      | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                                                                          |
| `method`              | Ja      | `string`                                        | Auth-methode-id waarnaar moet worden gedispatcht.                                                                                                                |
| `choiceId`            | Ja      | `string`                                        | Stabiele auth-keuze-id die wordt gebruikt door onboarding- en CLI-flows.                                                                                         |
| `choiceLabel`         | Nee     | `string`                                        | Gebruikersgerichte label. Indien weggelaten valt OpenClaw terug op `choiceId`.                                                                                   |
| `choiceHint`          | Nee     | `string`                                        | Korte hulptekst voor de keuzelijst.                                                                                                                              |
| `assistantPriority`   | Nee     | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistent aangestuurde interactieve keuzelijsten.                                                             |
| `assistantVisibility` | Nee     | `"visible"` \| `"manual-only"`                  | Verberg de keuze in assistentkeuzelijsten, terwijl handmatige CLI-selectie mogelijk blijft.                                                                      |
| `deprecatedChoiceIds` | Nee     | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorsturen.                                                                               |
| `groupId`             | Nee     | `string`                                        | Optionele groeps-id voor het groeperen van verwante keuzes.                                                                                                      |
| `groupLabel`          | Nee     | `string`                                        | Gebruikersgerichte label voor die groep.                                                                                                                         |
| `groupHint`           | Nee     | `string`                                        | Korte hulptekst voor de groep.                                                                                                                                   |
| `optionKey`           | Nee     | `string`                                        | Interne optiesleutel voor eenvoudige auth-flows met een enkele vlag.                                                                                             |
| `cliFlag`             | Nee     | `string`                                        | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                                                                              |
| `cliOption`           | Nee     | `string`                                        | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                                                                             |
| `cliDescription`      | Nee     | `string`                                        | Beschrijving die wordt gebruikt in CLI-help.                                                                                                                     |
| `onboardingScopes`    | Nee     | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten is de standaardwaarde `["text-inference"]`.                                      |

## commandAliases-referentie

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-opdrachtnaam die gebruikers mogelijk per ongeluk in `plugins.allow` plaatsen of proberen uit te voeren als root-CLI-opdracht. OpenClaw gebruikt deze metadata voor diagnostiek zonder plugin-runtimecode te importeren.

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

| Veld         | Vereist | Type              | Wat het betekent                                                                 |
| ------------ | ------- | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Ja      | `string`          | Opdrachtnaam die bij deze plugin hoort.                                          |
| `kind`       | Nee     | `"runtime-slash"` | Markeert de alias als chat-slashopdracht in plaats van een root-CLI-opdracht.    |
| `cliCommand` | Nee     | `string`          | Verwante root-CLI-opdracht om voor CLI-bewerkingen voor te stellen, als die bestaat. |

## activation-referentie

Gebruik `activation` wanneer de plugin goedkoop kan declareren welke control-plane-gebeurtenissen deze in een activatie-/laadplan moeten opnemen.

Dit blok is planner-metadata, geen lifecycle-API. Het registreert geen runtimegedrag, vervangt `register(...)` niet en belooft niet dat plugincode al is uitgevoerd. De activatieplanner gebruikt deze velden om kandidaat-plugins te beperken voordat wordt teruggevallen op bestaande manifest-eigendomsmetadata zoals `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigenaarschap al beschrijft. Gebruik `providers`, `channels`, `commandAliases`, setup-descriptors of `contracts` wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra planner-hints die niet door die eigendomsvelden kunnen worden weergegeven.
Gebruik top-level `cliBackends` voor CLI-runtimealiases zoals `claude-cli`, `codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor embedded agent-harness-id's die nog geen eigendomsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en vervangt `register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet. Huidige consumers gebruiken het als een beperkende hint vóór bredere plugin-lading, dus ontbrekende activatiemetadata kost meestal alleen prestaties; het zou de correctheid niet moeten veranderen zolang legacy manifest-eigendomsfallbacks nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen terwijl OpenClaw afstapt van impliciete startup-imports. Stel dit alleen in op `true` wanneer de plugin tijdens Gateway-startup moet draaien. Stel dit in op `false` wanneer de plugin inert is bij startup en alleen via nauwere triggers moet laden. Het weglaten van `onStartup` behoudt de verouderde legacy impliciete startup-sidecar-fallback voor plugins zonder statische capability-metadata; toekomstige versies stoppen mogelijk met het laden van die plugins bij startup tenzij ze `activation.onStartup: true` declareren. Pluginstatus- en compatibiliteitsrapporten waarschuwen met `legacy-implicit-startup-sidecar` wanneer een plugin nog steeds op die fallback vertrouwt.

Voor migratietests stel je `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` in om alleen die verouderde fallback uit te schakelen. Deze opt-inmodus blokkeert geen expliciete `activation.onStartup: true`-plugins of plugins die worden geladen door channel-, config-, agent-harness-, memory- of andere nauwere activatietriggers.

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

| Veld               | Vereist | Type                                                 | Wat het betekent                                                                                                                                                                                                                     |
| ------------------ | ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee     | `boolean`                                            | Expliciete Gateway-startupactivatie. Elke plugin moet dit instellen. `true` importeert de plugin tijdens startup; `false` meldt zich af voor de verouderde impliciete sidecar-startupfallback tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee     | `string[]`                                           | Provider-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                                              |
| `onAgentHarnesses` | Nee     | `string[]`                                           | Embedded agent-harness-runtime-id's die deze plugin moeten opnemen in activatie-/laadplannen. Gebruik top-level `cliBackends` voor CLI-backendaliases.                                                                               |
| `onCommands`       | Nee     | `string[]`                                           | Opdracht-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                                              |
| `onChannels`       | Nee     | `string[]`                                           | Channel-id's die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                                               |
| `onRoutes`         | Nee     | `string[]`                                           | Routetypen die deze plugin moeten opnemen in activatie-/laadplannen.                                                                                                                                                                 |
| `onConfigPaths`    | Nee     | `string[]`                                           | Configpaden relatief aan de root die deze plugin moeten opnemen in startup-/laadplannen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                                                              |
| `onCapabilities`   | Nee     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capability-hints die worden gebruikt door control-plane-activatieplanning. Geef waar mogelijk de voorkeur aan nauwere velden.                                                                                                  |

Huidige live consumers:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startupimport en opt-out van de verouderde impliciete sidecar-startupfallback
- door opdrachten getriggerde CLI-planning valt terug op legacy `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-startupplanning gebruikt `activation.onAgentHarnesses` voor embedded harnesses en top-level `cliBackends[]` voor CLI-runtimealiases
- door channels getriggerde setup-/channelplanning valt terug op legacy `channels[]`-eigenaarschap wanneer expliciete channel-activatiemetadata ontbreekt
- startup-pluginplanning gebruikt `activation.onConfigPaths` voor niet-channel-rootconfigoppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy `providers[]`- en top-level `cliBackends[]`-eigenaarschap wanneer expliciete provider-activatiemetadata ontbreekt

Plannerdiagnostiek kan expliciete activatiehints onderscheiden van manifest-eigendomsfallback. Bijvoorbeeld: `activation-command-hint` betekent dat `activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn voor hostdiagnostiek en tests; plugin-auteurs moeten de metadata blijven declareren die eigenaarschap het best beschrijft.

## qaRunners-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners bijdraagt onder de gedeelde `openclaw qa`-root. Houd deze metadata goedkoop en statisch; de plugin-runtime blijft eigenaar van daadwerkelijke CLI-registratie via een lichtgewicht `runtime-api.ts`-oppervlak dat `qaRunnerCliRegistrations` exporteert.

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
| `commandName` | Ja      | `string` | Subopdracht gekoppeld onder `openclaw qa`, bijvoorbeeld `matrix`.   |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stubopdracht nodig heeft. |

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

`cliBackends` op topniveau blijft geldig en blijft CLI-inferentiebackends
beschrijven. `setup.cliBackends` is de setup-specifieke descriptorsurface voor
control-plane-/setupflows die metadata-only moeten blijven.

Wanneer aanwezig zijn `setup.providers` en `setup.cliBackends` de voorkeurs-
descriptor-first opzoeksurface voor setupdetectie. Als de descriptor alleen de
kandidaat-Plugin vernauwt en setup nog steeds rijkere runtimehooks tijdens setup
nodig heeft, stel dan `requiresRuntime: true` in en laat `setup-api` staan als het
fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en
env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
tijdens de afschaffingsperiode, maar niet-gebundelde plugins die het nog gebruiken
ontvangen een manifestdiagnose. Nieuwe plugins moeten setup-/status-env-metadata
op `setup.providers[].envVars` zetten.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods`
wanneer er geen setupvermelding beschikbaar is, of wanneer `setup.requiresRuntime: false`
verklaart dat setup-runtime niet nodig is. Expliciete `providerAuthChoices`-vermeldingen
blijven de voorkeur houden voor aangepaste labels, CLI-flags, onboarding-scope en
assistentmetadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor de
setupsurface. OpenClaw behandelt expliciete `false` als een descriptor-only contract
en voert `setup-api` of `openclaw.setupEntry` niet uit voor setup lookup. Als
een descriptor-only Plugin nog steeds een van die setup-runtimevermeldingen levert,
rapporteert OpenClaw een additieve diagnose en blijft die negeren. Weggelaten
`requiresRuntime` behoudt legacy fallbackgedrag zodat bestaande plugins die
descriptors zonder de flag hebben toegevoegd niet stukgaan.

Omdat setup lookup Plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
waarden van `setup.providers[].id` en `setup.cliBackends[]` uniek blijven over
ontdekte plugins heen. Ambigu eigenaarschap faalt gesloten in plaats van een
winnaar uit de ontdekkingsvolgorde te kiezen.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteren setupregistrydiagnoses
descriptordrift als `setup-api` een provider of CLI-backend registreert die de
manifestdescriptors niet declareren, of als een descriptor geen overeenkomende
runtimeregistratie heeft. Deze diagnoses zijn additief en wijzen legacy plugins niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Wat het betekent                                                                                 |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Ja      | `string`   | Provider-id die tijdens setup of onboarding wordt blootgesteld. Houd genormaliseerde ids wereldwijd uniek. |
| `authMethods`  | Nee     | `string[]` | Setup-/authmethode-ids die deze provider ondersteunt zonder de volledige runtime te laden.        |
| `envVars`      | Nee     | `string[]` | Env vars die generieke setup-/statussurfaces kunnen controleren voordat de Plugin-runtime laadt.  |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-bewijscontroles voor providers die via niet-geheime markers kunnen authenticeren. |

`authEvidence` is bedoeld voor provider-eigen lokale credentialmarkers die kunnen worden
geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkcalls, geen keychain- of secret-manager-reads, geen shellopdrachten en geen
provider-API-probes.

Ondersteunde bewijsvermeldingen:

| Veld               | Vereist | Type       | Wat het betekent                                                                                |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `type`             | Ja      | `string`   | Momenteel `local-file-with-env`.                                                                |
| `fileEnvVar`       | Nee     | `string`   | Env var met een expliciet credentialbestandspad.                                                 |
| `fallbackPaths`    | Nee     | `string[]` | Lokale credentialbestandspaden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}`. |
| `requiresAnyEnv`   | Nee     | `string[]` | Ten minste een vermelde env var moet niet leeg zijn voordat het bewijs geldig is.                |
| `requiresAllEnv`   | Nee     | `string[]` | Elke vermelde env var moet niet leeg zijn voordat het bewijs geldig is.                          |
| `credentialMarker` | Ja      | `string`   | Niet-geheime marker die wordt geretourneerd wanneer het bewijs aanwezig is.                      |
| `source`           | Nee     | `string`   | Gebruikersgerichte bronlabel voor auth-/statusuitvoer.                                          |

### setup-velden

| Veld               | Vereist | Type       | Wat het betekent                                                                                   |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Nee     | `object[]` | Providersetupdescriptors die tijdens setup en onboarding worden blootgesteld.                       |
| `cliBackends`      | Nee     | `string[]` | Backend-ids tijdens setup die worden gebruikt voor descriptor-first setup lookup. Houd genormaliseerde ids wereldwijd uniek. |
| `configMigrations` | Nee     | `string[]` | Configmigratie-ids die eigendom zijn van de setupsurface van deze Plugin.                           |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup nog steeds uitvoering van `setup-api` nodig heeft na descriptor lookup.                    |

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

| Veld          | Type       | Wat het betekent                         |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Gebruikersgericht veldlabel.             |
| `help`        | `string`   | Korte hulptekst.                         |
| `tags`        | `string[]` | Optionele UI-tags.                       |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.       |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig. |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.   |

## contracts-referentie

Gebruik `contracts` alleen voor statische capability-eigenaarschapsmetadata die OpenClaw kan
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

| Veld                             | Type       | Wat het betekent                                                        |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension-factory-ids, momenteel `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ids waarvoor een gebundelde Plugin tool-resultmiddleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-ids waarvan deze Plugin eigenaar is van de externe auth-profielhook. |
| `speechProviders`                | `string[]` | Speech-provider-ids waarvan deze Plugin eigenaar is.                    |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription-provider-ids waarvan deze Plugin eigenaar is.    |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice-provider-ids waarvan deze Plugin eigenaar is.            |
| `memoryEmbeddingProviders`       | `string[]` | Memory embedding-provider-ids waarvan deze Plugin eigenaar is.          |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-ids waarvan deze Plugin eigenaar is.       |
| `imageGenerationProviders`       | `string[]` | Image-generation-provider-ids waarvan deze Plugin eigenaar is.          |
| `videoGenerationProviders`       | `string[]` | Video-generation-provider-ids waarvan deze Plugin eigenaar is.          |
| `webFetchProviders`              | `string[]` | Web-fetch-provider-ids waarvan deze Plugin eigenaar is.                 |
| `webSearchProviders`             | `string[]` | Web-search-provider-ids waarvan deze Plugin eigenaar is.                |
| `migrationProviders`             | `string[]` | Importprovider-ids waarvan deze Plugin eigenaar is voor `openclaw migrate`. |
| `tools`                          | `string[]` | Namen van agenttools waarvan deze Plugin eigenaar is voor gebundelde contractcontroles. |

`contracts.embeddedExtensionFactories` wordt behouden voor gebundelde Codex
app-server-only extension factories. Gebundelde tool-resulttransforms moeten
`contracts.agentToolResultMiddleware` declareren en in plaats daarvan registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-resultmiddleware registreren omdat de seam high-trust tooluitvoer kan herschrijven
voordat het model die ziet.

Providerplugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie blijven
via een verouderde compatibiliteitsfallback lopen, maar die fallback is trager en
wordt na de migratieperiode verwijderd.

Gebundelde memory embedding-providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die zij blootstellen,
inclusief ingebouwde adapters zoals `local`. Standalone CLI-paden gebruiken dit
manifestcontract om alleen de eigenaar-Plugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, auto-auth fallbackprioriteit of native documentondersteuning heeft die
generieke corehelpers nodig hebben voordat de runtime laadt. Sleutels moeten ook worden
gedeclareerd in `contracts.mediaUnderstandingProviders`.

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

| Veld                   | Type                                | Wat het betekent                                                                 |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediamogelijkheden die door deze provider worden aangeboden.                     |
| `defaultModels`        | `Record<string, string>`            | Standaardmodellen per mogelijkheid die worden gebruikt wanneer config geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische fallback van providers op basis van referenties. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                    |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een kanaal-Plugin goedkope configmetadata nodig heeft voordat
runtime wordt geladen. Alleen-lezen kanaalinstallatie/statusdetectie kan deze metadata
rechtstreeks gebruiken voor geconfigureerde externe kanalen wanneer er geen installatievermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` verklaart dat installatieruntime niet nodig is.

`channelConfigs` is Plugin-manifestmetadata, geen nieuwe top-level gebruikersconfigsectie.
Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde
kanaal voordat Plugin-runtimecode wordt uitgevoerd.

Voor een kanaal-Plugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook overeenkomende
`channelConfigs`-vermeldingen declareren. Zonder deze vermeldingen kan OpenClaw de Plugin nog steeds laden, maar
cold-path-configschema, installatie en Control UI-oppervlakken kunnen de
kanaaleigen optiestructuur niet kennen totdat Plugin-runtime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaarden declareren voor commandoconfigcontroles
die worden uitgevoerd voordat kanaalruntime wordt geladen. Gebundelde kanalen kunnen dezelfde standaarden ook publiceren
via `package.json#openclaw.channel.commands` naast hun andere pakket-eigen kanaalcatalogusmetadata.

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

| Veld          | Type                     | Wat het betekent                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfigvermelding.   |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoeligheidshints voor die kanaalconfigsectie.            |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in kiezer- en inspectieoppervlakken wanneer runtimemetadata nog niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                          |
| `commands`    | `object`                 | Statische auto-standaarden voor native commands en native skills voor pre-runtime configcontroles. |
| `preferOver`  | `string[]`               | Verouderde of lagere-prioriteit Plugin-id's die dit kanaal moet overtreffen in selectieoppervlakken. |

### Een andere kanaal-Plugin vervangen

Gebruik `preferOver` wanneer je Plugin de voorkeurs-eigenaar is voor een kanaal-id dat
ook door een andere Plugin kan worden geleverd. Veelvoorkomende gevallen zijn een hernoemde Plugin-id, een
standalone Plugin die een gebundelde Plugin vervangt, of een onderhouden fork die
dezelfde kanaal-id behoudt voor configcompatibiliteit.

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
de voorkeurs-Plugin-id. Als de lagere-prioriteit Plugin alleen was geselecteerd omdat
deze gebundeld is of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtimeconfig zodat één Plugin eigenaar is van het kanaal en de bijbehorende tools. Expliciete gebruikersselectie
heeft nog steeds voorrang: als de gebruiker beide plugins expliciet inschakelt, bewaart OpenClaw
die keuze en rapporteert dubbele kanaal/tool-diagnostiek in plaats van
de gevraagde Plugin-set stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot Plugin-id's die echt hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfigsleutels.

## modelSupport-referentie

Gebruik `modelSupport` wanneer OpenClaw je provider-Plugin moet afleiden uit
verkorte model-id's zoals `gpt-5.5` of `claude-sonnet-4.6` voordat Plugin-runtime
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

- expliciete `provider/model`-refs gebruiken de eigen `providers`-manifestmetadata
- `modelPatterns` winnen van `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, wint de niet-gebundelde
  Plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of config een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                               |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden vergeleken met verkorte model-id's.      |
| `modelPatterns` | `string[]` | Regex-bronnen die met verkorte model-id's worden vergeleken nadat het profielsuffix is verwijderd. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
Plugin-runtime wordt geladen. Dit is de door het manifest beheerde bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en detectiemodus. Runtimeverversing
blijft in providerruntimecode, maar het manifest vertelt core wanneer runtime
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

Top-level velden:

| Veld           | Type                                                     | Wat het betekent                                                                                            |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's waarvan deze Plugin eigenaar is. Sleutels moeten ook voorkomen in top-level `providers`. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten resolven naar een eigen provider voor catalogus- of onderdrukkingsplanning.    |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze Plugin onderdrukt om een providerspecifieke reden.                 |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, naar cache kan worden ververst, of runtime vereist. |

`aliases` neemt deel aan provider-eigenaarslookup voor modelcatalogusplanning.
Aliasdoelen moeten top-level providers zijn waarvan dezelfde Plugin eigenaar is. Wanneer een
providergefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarmanifest lezen en
alias-API/base-URL-overschrijvingen toepassen zonder providerruntime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de eigen
canonieke providerrijen uit.

`suppressions` vervangt de oude providerruntimehook `suppressBuiltInModel`.
Onderdrukkingsvermeldingen worden alleen gehonoreerd wanneer de provider eigendom is van de Plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een eigen provider verwijst. Runtime
onderdrukkingshooks worden niet langer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                          |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Optionele standaardbasis-URL voor modellen in deze providercatalogus.    |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder een `id` worden genegeerd.             |

Modelvelden:

| Veld            | Type                                                           | Wat het betekent                                                          |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokale model-id, zonder het voorvoegsel `provider/`.             |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                   |
| `api`           | `ModelApi`                                                     | Optionele API-override per model.                                         |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-override per model.                                   |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                    |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                    |
| `reasoning`     | `boolean`                                                      | Of het model redeneergedrag aanbiedt.                                     |
| `contextWindow` | `number`                                                       | Native contextvenster van de provider.                                    |
| `contextTokens` | `number`                                                       | Optionele effectieve runtime-contextlimiet wanneer die afwijkt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximumaantal outputtokens wanneer bekend.                                |
| `cost`          | `object`                                                       | Optionele prijs in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Alleen onderdrukken wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt getoond bij een niet-beschikbare status.        |
| `replaces`      | `string[]`                                                     | Oudere provider-lokale model-id's die dit model vervangt.                 |
| `replacedBy`    | `string`                                                       | Vervangende provider-lokale model-id voor verouderde rijen.               |
| `tags`          | `string[]`                                                     | Stabiele tags die door keuzelijsten en filters worden gebruikt.           |

Onderdrukkingsvelden:

| Veld                       | Type       | Wat het betekent                                                                                         |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstream-rij die moet worden onderdrukt. Moet eigendom zijn van deze Plugin of als eigen alias zijn gedeclareerd. |
| `model`                    | `string`   | Provider-lokale model-id die moet worden onderdrukt.                                                      |
| `reason`                   | `string`   | Optioneel bericht dat wordt getoond wanneer de onderdrukte rij rechtstreeks wordt opgevraagd.             |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve basis-URL-hosts van de provider die vereist zijn voordat de onderdrukking geldt. |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen data die alleen voor runtime is bedoeld in `modelCatalog`. Gebruik `static` alleen wanneer manifestrijen
volledig genoeg zijn zodat provider-gefilterde lijst- en keuzelijstoppervlakken
registry/runtime-detectie kunnen overslaan. Gebruik `refreshable` wanneer manifestrijen nuttige
opsombare zaden of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen;
refreshable-rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
de provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope provider-eigen opschoning van model-id's die moet
gebeuren voordat de provider-runtime laadt. Dit houdt aliassen zoals korte modelnamen,
provider-lokale legacy-id's en proxyvoorvoegselregels in het manifest van de eigenaar-Plugin
in plaats van in kerntabellen voor modelselectie.

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

| Veld                                 | Type                    | Wat het betekent                                                                          |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Hoofdletterongevoelige exacte model-id-aliassen. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Voorvoegsels om te verwijderen vóór alias-opzoeking, nuttig voor legacyduplicatie van provider/model. |
| `prefixWhenBare`                     | `string`                | Voorvoegsel om toe te voegen wanneer de genormaliseerde model-id nog geen `/` bevat.       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke voorvoegselregels voor bare id's na alias-opzoeking, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat de provider-runtime laadt. Core blijft eigenaar van de betekenis van elke
`endpointClass`; Plugin-manifesten zijn eigenaar van de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Wat het betekent                                                                                 |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.            |
| `hosts`                        | `string[]` | Exacte hostnamen die naar de endpointklasse verwijzen.                                           |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die naar de endpointklasse verwijzen. Voorzie van `.` voor alleen-domeinsuffixmatching. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die naar de endpointklasse verwijzen.                  |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                         |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van overeenkomende hosts te strippen zodat het Google Vertex-regiovoorvoegsel zichtbaar wordt. |

## providerRequest-referentie

Gebruik `providerRequest` voor goedkope request-compatibiliteitsmetadata die generiek
aanvraagbeleid nodig heeft zonder de provider-runtime te laden. Houd gedragsspecifieke
payloadherschrijving in provider-runtimehooks of gedeelde helpers voor providerfamilies.

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

| Veld                  | Type         | Wat het betekent                                                                       |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Providerfamilielabel dat wordt gebruikt door generieke request-compatibiliteitsbeslissingen en diagnostiek. |
| `compatibilityFamily` | `"moonshot"` | Optionele compatibiliteitsbucket voor providerfamilies voor gedeelde requesthelpers.    |
| `openAICompletions`   | `object`     | OpenAI-compatibele vlaggen voor completions-requests, momenteel `supportsStreamingUsage`. |

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

| Veld         | Type              | Wat het betekent                                                                                       |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | Stel in op `false` voor lokale/zelfgehoste providers die nooit OpenRouter- of LiteLLM-prijzen mogen ophalen. |
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking uit voor deze provider.  |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking uit voor deze provider.        |

Bronvelden:

| Veld                       | Type               | Wat het betekent                                                                                         |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogusprovider-id wanneer die verschilt van de OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met slashes als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Extra model-id-varianten voor externe catalogi. `version-dots` probeert versie-id's met punten, zoals `claude-opus-4.6`. |

### OpenClaw Provider Index

De OpenClaw Provider Index is previewmetadata die eigendom is van OpenClaw voor providers
waarvan de Plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een Plugin-manifest.
Plugin-manifesten blijven de autoriteit voor geïnstalleerde Plugins. De Provider Index is
het interne fallbackcontract dat toekomstige oppervlakken voor installeerbare providers en pre-install
modelkeuzelijsten zullen gebruiken wanneer een provider-Plugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. `modelCatalog` van geïnstalleerd Plugin-manifest.
3. Modelcataloguscache van expliciete refresh.
4. Previewrijen uit de OpenClaw Provider Index.

De Providerindex mag geen geheimen, ingeschakelde status, runtime-hooks of
live accountspecifieke modelgegevens bevatten. De voorbeeldcatalogi gebruiken dezelfde
`modelCatalog`-providerrijvorm als pluginmanifests, maar moeten beperkt blijven
tot stabiele weergavemetadata, tenzij runtime-adaptervelden zoals `api`,
`baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd blijven op
het geinstalleerde pluginmanifest. Providers met live `/models`-detectie moeten
ververste rijen schrijven via het expliciete cachepad voor modelcatalogi in plaats van
normale lijstweergave- of onboarding-aanroepen provider-API's te laten aanroepen.

Providerindexvermeldingen kunnen ook metadata voor installeerbare plugins bevatten voor providers
waarvan de plugin uit core is verplaatst of anderszins nog niet is geinstalleerd. Deze
metadata volgt het patroon van de kanaalcatalogus: pakketnaam, npm-installatiespecificatie,
verwachte integriteit en goedkope labels voor auth-keuzes zijn genoeg om een
installeerbare installatieoptie te tonen. Zodra de plugin is geinstalleerd, wint
het manifest en wordt de Providerindexvermelding voor die provider genegeerd.

Verouderde capability-sleutels op topniveau zijn afgeschaft. Gebruik `openclaw doctor --fix` om
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` en `webSearchProviders` onder `contracts` te plaatsen; normaal
manifestladen behandelt die topniveauvelden niet langer als capability-
eigenaarschap.

## Manifest versus package.json

De twee bestanden dienen verschillende doelen:

| Bestand                | Gebruik het voor                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Detectie, configvalidatie, metadata voor auth-keuzes en UI-hints die moeten bestaan voordat plugincode draait                  |
| `package.json`         | npm-metadata, dependency-installatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatiegating, setup of catalogusmetadata |

Als je niet zeker weet waar een stuk metadata hoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat plugincode wordt geladen, zet het in `openclaw.plugin.json`
- als het gaat over packaging, entrybestanden of npm-installatiegedrag, zet het in `package.json`

### package.json-velden die detectie beinvloeden

Sommige preruntime-pluginmetadata staat bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.

Belangrijke voorbeelden:

| Veld                                                              | Wat het betekent                                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declareert native plugin-entrypoints. Moet binnen de pluginpakketdirectory blijven.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Declareert gebouwde JavaScript-runtime-entrypoints voor geinstalleerde pakketten. Moet binnen de pluginpakketdirectory blijven.                                                      |
| `openclaw.setupEntry`                                             | Lichtgewicht entrypoint alleen voor setup, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus-/SecretRef-detectie. Moet binnen de pluginpakketdirectory blijven. |
| `openclaw.runtimeSetupEntry`                                      | Declareert het gebouwde JavaScript-setupentrypoint voor geinstalleerde pakketten. Moet binnen de pluginpakketdirectory blijven.                                                      |
| `openclaw.channel`                                                | Goedkope kanaalcatalogusmetadata zoals labels, documentatiepaden, aliassen en selectietekst.                                                                                         |
| `openclaw.channel.commands`                                       | Statische native commando- en native skill-auto-defaultmetadata die door config-, audit- en commandolijstoppervlakken wordt gebruikt voordat de kanaalruntime laadt.                 |
| `openclaw.channel.configuredState`                                | Lichtgewicht metadata voor configured-state-controle die kan antwoorden op "bestaat env-only setup al?" zonder de volledige kanaalruntime te laden.                                  |
| `openclaw.channel.persistedAuthState`                             | Lichtgewicht metadata voor persisted-auth-controle die kan antwoorden op "is er al iets ingelogd?" zonder de volledige kanaalruntime te laden.                                       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installatie-/updatehints voor gebundelde en extern gepubliceerde plugins.                                                                                                            |
| `openclaw.install.defaultChoice`                                  | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                        |
| `openclaw.install.minHostVersion`                                 | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22`.                                                                                            |
| `openclaw.install.expectedIntegrity`                              | Verwachte npm-dist-integriteitsreeks zoals `sha512-...`; installatie- en updateflows verifieren het opgehaalde artefact hiertegen.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Staat een smal herstelpad voor herinstallatie van gebundelde plugins toe wanneer config ongeldig is.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Laat setup-only kanaaloppervlakken laden voor de volledige kanaalplugin tijdens het opstarten.                                                                                       |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes in onboarding verschijnen
voordat runtime laadt. `package.json#openclaw.install` vertelt
onboarding hoe die plugin moet worden opgehaald of ingeschakeld wanneer de gebruiker een van die
keuzes selecteert. Verplaats installatiehints niet naar `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en het laden van het
manifestregister. Ongeldige waarden worden geweigerd; nieuwere maar geldige waarden slaan de
plugin over op oudere hosts.

Exacte npm-versiepinnen staat al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiele externe catalogus-
vermeldingen moeten exacte specs combineren met `expectedIntegrity`, zodat updateflows
gesloten falen als het opgehaalde npm-artefact niet langer overeenkomt met de gepinde release.
Interactieve onboarding biedt voor compatibiliteit nog steeds vertrouwde registry-npm-specs aan,
inclusief kale pakketnamen en dist-tags. Catalogusdiagnostiek kan
exacte, zwevende, integriteitsgepinde, ontbrekende-integriteit-, pakketnaam-
mismatch- en ongeldige default-choice-bronnen onderscheiden. Ze waarschuwen ook wanneer
`expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die ermee kan worden gepind.
Wanneer `expectedIntegrity` aanwezig is,
dwingen installatie-/updateflows dit af; wanneer het ontbreekt, wordt de registry-resolutie
vastgelegd zonder integriteitspin.

Kanaalplugins moeten `openclaw.setupEntry` bieden wanneer status, kanaallijst
of SecretRef-scans geconfigureerde accounts moeten identificeren zonder de volledige
runtime te laden. De setup-entry moet kanaalmetadata plus setup-veilige config-,
status- en secrets-adapters blootstellen; houd netwerkclients, gateway-listeners en
transportruntimes in het hoofdentrypoint van de extensie.

Runtime-entrypointvelden overschrijven geen pakketgrenscontroles voor bron-
entrypointvelden. Bijvoorbeeld: `openclaw.runtimeExtensions` kan een
ontsnappend `openclaw.extensions`-pad niet laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt
willekeurig kapotte configs niet installeerbaar. Vandaag staat het alleen installatieflows toe
te herstellen van specifieke verouderde upgradefouten van gebundelde plugins, zoals een
ontbrekend gebundeld-pluginpad of een verouderde `channels.<id>`-vermelding voor diezelfde
gebundelde plugin. Niet-gerelateerde configfouten blokkeren installatie nog steeds en sturen operators
naar `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` is pakketmetadata voor een kleine checker-
module:

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

Gebruik dit wanneer setup, doctor, status of alleen-lezen presence-flows een goedkope
ja/nee-auth-probe nodig hebben voordat de volledige kanaalplugin laadt. Persisted auth-state is
geen geconfigureerde kanaalstatus: gebruik deze metadata niet om plugins automatisch in te schakelen,
runtime-dependencies te repareren of te bepalen of een kanaalruntime moet laden.
De doel-export moet een kleine functie zijn die alleen persisted state leest; stuur
dit niet via de volledige kanaalruntime-barrel.

`openclaw.channel.configuredState` volgt dezelfde vorm voor goedkope env-only
configured-controles:

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

Gebruik dit wanneer een kanaal configured-state kan beantwoorden vanuit env of andere kleine
niet-runtime-invoer. Als de controle volledige configresolutie of de echte
kanaalruntime nodig heeft, houd die logica dan in de plugin-`config.hasConfiguredState`-
hook.

## Detectievoorrang (dubbele plugin-id's)

OpenClaw ontdekt plugins vanuit meerdere roots (gebundeld, globale installatie, workspace, expliciet via config geselecteerde paden). Als twee ontdekkingen dezelfde `id` delen, wordt alleen het manifest met de **hoogste voorrang** behouden; duplicaten met lagere voorrang worden verwijderd in plaats van ernaast te laden.

Voorrang, van hoog naar laag:

1. **Via config geselecteerd** — een pad dat expliciet is vastgepind in `plugins.entries.<id>`
2. **Gebundeld** — plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — plugins die in de globale OpenClaw-pluginroot zijn geinstalleerd
4. **Workspace** — plugins die relatief ten opzichte van de huidige workspace worden ontdekt

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde plugin in de workspace zal de gebundelde build niet overschaduwen.
- Om een gebundelde plugin echt te overschrijven met een lokale plugin, pin je die via `plugins.entries.<id>` zodat die wint op basis van voorrang in plaats van te vertrouwen op workspace-detectie.
- Het verwijderen van duplicaten wordt gelogd, zodat Doctor en opstartdiagnostiek naar de verworpen kopie kunnen wijzen.

## Vereisten voor JSON Schema

- **Elke plugin moet een JSON Schema meeleveren**, zelfs als die geen config accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd op het moment dat config wordt gelezen/geschreven, niet tijdens runtime.

## Validatiegedrag

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de channel-id is gedeclareerd door
  een pluginmanifest.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*`
  moeten verwijzen naar **vindbare** plugin-id's. Onbekende id's zijn **fouten**.
- Als een plugin is geïnstalleerd maar een kapot of ontbrekend manifest of schema heeft,
  mislukt de validatie en rapporteert Doctor de pluginfout.
- Als pluginconfiguratie bestaat maar de plugin **uitgeschakeld** is, blijft de configuratie behouden en
  wordt een **waarschuwing** weergegeven in Doctor + logs.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **vereist voor native OpenClaw-plugins**, inclusief lokale bestandssysteemladingen. Runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor discovery + validatie.
- Native manifesten worden geparsed met JSON5, dus opmerkingen, trailing comma's en sleutels zonder aanhalingstekens worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestlader. Vermijd aangepaste sleutels op topniveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtime-code importeren; gebruik het voor statische provider-catalogusmetadata of smalle discovery-descriptors, niet voor uitvoering tijdens verzoeken.
- Exclusieve pluginsoorten worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer de exclusieve pluginsoort in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Env-varmetadata (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, cron-leveringsvalidatie en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activeringsbeleid toe voordat een env var als geconfigureerd wordt behandeld.
- Zie [Provider runtime hooks](/nl/plugins/architecture-internals#provider-runtime-hooks) voor runtime-wizardmetadata waarvoor providercode vereist is.
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlist-vereisten voor package managers (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Plugin-architectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capabilitymodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin SDK-referentie en subpath-imports.
  </Card>
</CardGroup>
