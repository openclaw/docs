---
read_when:
    - Je bouwt een OpenClaw Plugin
    - Je moet een Plugin-configuratieschema opleveren of Plugin-validatiefouten debuggen
summary: Plugin-manifest + JSON-schemavereisten (strikte configuratievalidatie)
title: Pluginmanifest
x-i18n:
    generated_at: "2026-04-30T09:38:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
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
skill-roots, Claude-commandoroots, standaardwaarden voor Claude-bundel `settings.json`,
standaardwaarden voor Claude-bundel-LSP en ondersteunde hook-pakketten wanneer de indeling overeenkomt
met de runtimeverwachtingen van OpenClaw.

Elke native OpenClaw-Plugin **moet** een `openclaw.plugin.json`-bestand meeleveren in de
**Plugin-root**. OpenClaw gebruikt dit manifest om configuratie te valideren
**zonder Plugin-code uit te voeren**. Ontbrekende of ongeldige manifesten worden behandeld als
Plugin-fouten en blokkeren configuratievalidatie.

Zie de volledige gids voor het Plugin-systeem: [Plugins](/nl/tools/plugin).
Voor het native capaciteitsmodel en de huidige richtlijnen voor externe compatibiliteit:
[Capaciteitsmodel](/nl/plugins/architecture#public-capability-model).

## Wat dit bestand doet

`openclaw.plugin.json` is de metadata die OpenClaw leest **voordat het je
Plugin-code laadt**. Alles hieronder moet goedkoop genoeg zijn om te inspecteren zonder de
Plugin-runtime te starten.

**Gebruik het voor:**

- Plugin-identiteit, configuratievalidatie en hints voor de configuratie-UI
- auth, onboarding en setupmetadata (alias, automatisch inschakelen, provider-env-vars, auth-keuzes)
- activatiehints voor control-plane-oppervlakken
- eigenaarschap van model-families in verkorte vorm
- statische momentopnamen van capaciteitseigenaarschap (`contracts`)
- QA-runnermetadata die de gedeelde `openclaw qa`-host kan inspecteren
- kanaalspecifieke configuratiemetadata die wordt samengevoegd in catalogus- en validatieoppervlakken

**Gebruik het niet voor:** het registreren van runtimegedrag, het declareren van code-entrypoints
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

## Referentie voor top-level velden

| Veld                                 | Vereist | Type                             | Betekenis                                                                                                                                                                                                                       |
| ------------------------------------ | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja      | `string`                         | Canonieke Plugin-id. Dit is de id die wordt gebruikt in `plugins.entries.<id>`.                                                                                                                                                 |
| `configSchema`                       | Ja      | `object`                         | Inline JSON Schema voor de configuratie van deze Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | Nee     | `true`                           | Markeert een gebundelde Plugin als standaard ingeschakeld. Laat dit weg, of stel een waarde anders dan `true` in, om de Plugin standaard uitgeschakeld te laten.                                                               |
| `legacyPluginIds`                    | Nee     | `string[]`                       | Verouderde id's die naar deze canonieke Plugin-id normaliseren.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Nee     | `string[]`                       | Provider-id's die deze Plugin automatisch moeten inschakelen wanneer authenticatie, configuratie of modelverwijzingen ze noemen.                                                                                                |
| `kind`                               | Nee     | `"memory"` \| `"context-engine"` | Declareert een exclusieve Plugin-soort die wordt gebruikt door `plugins.slots.*`.                                                                                                                                               |
| `channels`                           | Nee     | `string[]`                       | Kanaal-id's die eigendom zijn van deze Plugin. Gebruikt voor ontdekking en configuratievalidatie.                                                                                                                               |
| `providers`                          | Nee     | `string[]`                       | Provider-id's die eigendom zijn van deze Plugin.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Nee     | `string`                         | Lichtgewicht modulepad voor providerontdekking, relatief ten opzichte van de Plugin-root, voor manifestgebonden provider-catalogusmetadata die kan worden geladen zonder de volledige Plugin-runtime te activeren.              |
| `modelSupport`                       | Nee     | `object`                         | Door het manifest beheerde verkorte metadata voor modelfamilies, gebruikt om de Plugin automatisch te laden vóór de runtime.                                                                                                    |
| `modelCatalog`                       | Nee     | `object`                         | Declaratieve modelcatalogusmetadata voor providers die eigendom zijn van deze Plugin. Dit is het control-planecontract voor toekomstige alleen-lezen-vermeldingen, onboarding, modelkiezers, aliassen en onderdrukking zonder de Plugin-runtime te laden. |
| `modelPricing`                       | Nee     | `object`                         | Door de provider beheerd beleid voor externe prijsopzoekingen. Gebruik dit om lokale/zelfgehoste providers uit externe prijscatalogi te houden of providerverwijzingen aan OpenRouter/LiteLLM-catalogus-id's te koppelen zonder provider-id's hard te coderen in core. |
| `modelIdNormalization`               | Nee     | `object`                         | Door de provider beheerde opschoning van model-id-aliassen/prefixen die moet worden uitgevoerd voordat de provider-runtime laadt.                                                                                                |
| `providerEndpoints`                  | Nee     | `object[]`                       | Door het manifest beheerde metadata voor endpoint-host/baseUrl voor providerroutes die core moet classificeren voordat de provider-runtime laadt.                                                                                |
| `providerRequest`                    | Nee     | `object`                         | Goedkope metadata voor providerfamilie en aanvraagcompatibiliteit die wordt gebruikt door generiek aanvraagbeleid voordat de provider-runtime laadt.                                                                             |
| `cliBackends`                        | Nee     | `string[]`                       | CLI-inferentiebackend-id's die eigendom zijn van deze Plugin. Gebruikt voor automatische activering bij opstarten vanuit expliciete configuratieverwijzingen.                                                                   |
| `syntheticAuthRefs`                  | Nee     | `string[]`                       | Provider- of CLI-backendverwijzingen waarvan de door de Plugin beheerde synthetische authenticatiehook moet worden getest tijdens koude modelontdekking voordat de runtime laadt.                                               |
| `nonSecretAuthMarkers`               | Nee     | `string[]`                       | Door gebundelde Plugins beheerde tijdelijke API-sleutelwaarden die niet-geheime lokale, OAuth- of omgevingscredentialstatus vertegenwoordigen.                                                                                  |
| `commandAliases`                     | Nee     | `object[]`                       | Opdrachtnamen die eigendom zijn van deze Plugin en die Plugin-bewuste configuratie- en CLI-diagnostiek moeten produceren voordat de runtime laadt.                                                                               |
| `providerAuthEnvVars`                | Nee     | `Record<string, string[]>`       | Verouderde compatibiliteitsmetadata voor omgevingsvariabelen voor provider-authenticatie/statusopzoeking. Gebruik bij nieuwe Plugins liever `setup.providers[].envVars`; OpenClaw leest dit nog tijdens de uitfaseringsperiode. |
| `providerAuthAliases`                | Nee     | `Record<string, string>`         | Provider-id's die een andere provider-id moeten hergebruiken voor authenticatieopzoeking, bijvoorbeeld een codeprovider die de API-sleutel en authenticatieprofielen van de basisprovider deelt.                               |
| `channelEnvVars`                     | Nee     | `Record<string, string[]>`       | Goedkope kanaalomgevingsmetadata die OpenClaw kan inspecteren zonder Plugin-code te laden. Gebruik dit voor omgevingsgestuurde kanaalconfiguratie of authenticatieoppervlakken die generieke opstart-/configuratiehelpers moeten zien. |
| `providerAuthChoices`                | Nee     | `object[]`                       | Goedkope metadata voor authenticatiekeuzes voor onboardingkiezers, voorkeursproviderresolutie en eenvoudige CLI-flagbedrading.                                                                                                  |
| `activation`                         | Nee     | `object`                         | Goedkope metadata voor de activatieplanner voor door opstarten, provider, opdracht, kanaal, route en capability getriggerd laden. Alleen metadata; de Plugin-runtime blijft eigenaar van het daadwerkelijke gedrag.              |
| `setup`                              | Nee     | `object`                         | Goedkope setup-/onboardingdescriptors die discovery- en setup-oppervlakken kunnen inspecteren zonder de Plugin-runtime te laden.                                                                                                |
| `qaRunners`                          | Nee     | `object[]`                       | Goedkope QA-runnerdescriptors die worden gebruikt door de gedeelde `openclaw qa`-host voordat de Plugin-runtime laadt.                                                                                                          |
| `contracts`                          | Nee     | `object`                         | Statische gebundelde capability-snapshot voor externe authenticatiehooks, spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldingsgeneratie, muziekgeneratie, videogeneratie, web-fetch, webzoekopdrachten en tool-eigendom. |
| `mediaUnderstandingProviderMetadata` | Nee     | `Record<string, object>`         | Goedkope standaardwaarden voor mediabegrip voor provider-id's die zijn gedeclareerd in `contracts.mediaUnderstandingProviders`.                                                                                                 |
| `channelConfigs`                     | Nee     | `Record<string, object>`         | Door het manifest beheerde kanaalconfiguratiemetadata die wordt samengevoegd in discovery- en validatieoppervlakken voordat de runtime laadt.                                                                                   |
| `skills`                             | Nee     | `string[]`                       | Skill-mappen om te laden, relatief ten opzichte van de Plugin-root.                                                                                                                                                              |
| `name`                               | Nee     | `string`                         | Voor mensen leesbare Plugin-naam.                                                                                                                                                                                               |
| `description`                        | Nee     | `string`                         | Korte samenvatting die in Plugin-oppervlakken wordt weergegeven.                                                                                                                                                                |
| `version`                            | Nee     | `string`                         | Informatieve Plugin-versie.                                                                                                                                                                                                     |
| `uiHints`                            | Nee     | `Record<string, object>`         | UI-labels, placeholders en gevoeligheidshints voor configuratievelden.                                                                                                                                                          |

## providerAuthChoices-referentie

Elke `providerAuthChoices`-vermelding beschrijft één onboarding- of authenticatiekeuze.
OpenClaw leest dit voordat de provider-runtime laadt.
Provider-setuplijsten gebruiken deze manifestkeuzes, uit descriptors afgeleide setupkeuzes
en metadata uit de installatiecatalogus zonder de provider-runtime te laden.

| Veld                  | Vereist | Type                                            | Betekenis                                                                                                |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja       | `string`                                        | Provider-id waartoe deze keuze behoort.                                                                  |
| `method`              | Ja       | `string`                                        | Auth-methode-id waarnaar moet worden doorgestuurd.                                                       |
| `choiceId`            | Ja       | `string`                                        | Stabiele auth-keuze-id die wordt gebruikt door onboarding- en CLI-flows.                                 |
| `choiceLabel`         | Nee      | `string`                                        | Gebruikersgerichte label. Indien weggelaten, valt OpenClaw terug op `choiceId`.                          |
| `choiceHint`          | Nee      | `string`                                        | Korte hulptekst voor de kiezer.                                                                          |
| `assistantPriority`   | Nee      | `number`                                        | Lagere waarden worden eerder gesorteerd in door de assistent aangestuurde interactieve kiezers.          |
| `assistantVisibility` | Nee      | `"visible"` \| `"manual-only"`                  | Verberg de keuze voor assistentkiezers, terwijl handmatige CLI-selectie nog steeds mogelijk blijft.      |
| `deprecatedChoiceIds` | Nee      | `string[]`                                      | Verouderde keuze-id's die gebruikers naar deze vervangende keuze moeten doorverwijzen.                   |
| `groupId`             | Nee      | `string`                                        | Optionele groeps-id voor het groeperen van gerelateerde keuzes.                                          |
| `groupLabel`          | Nee      | `string`                                        | Gebruikersgerichte label voor die groep.                                                                 |
| `groupHint`           | Nee      | `string`                                        | Korte hulptekst voor de groep.                                                                           |
| `optionKey`           | Nee      | `string`                                        | Interne optiesleutel voor eenvoudige auth-flows met een enkele vlag.                                     |
| `cliFlag`             | Nee      | `string`                                        | Naam van de CLI-vlag, zoals `--openrouter-api-key`.                                                      |
| `cliOption`           | Nee      | `string`                                        | Volledige vorm van de CLI-optie, zoals `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nee      | `string`                                        | Beschrijving die in CLI-help wordt gebruikt.                                                             |
| `onboardingScopes`    | Nee      | `Array<"text-inference" \| "image-generation">` | In welke onboarding-oppervlakken deze keuze moet verschijnen. Indien weggelaten, is de standaard `["text-inference"]`. |

## `commandAliases`-referentie

Gebruik `commandAliases` wanneer een plugin eigenaar is van een runtime-commandonaam die gebruikers
per ongeluk in `plugins.allow` kunnen zetten of als root-CLI-commando proberen uit te voeren. OpenClaw
gebruikt deze metadata voor diagnoses zonder plugin-runtimecode te importeren.

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
| `name`       | Ja       | `string`          | Commandonaam die bij deze plugin hoort.                                  |
| `kind`       | Nee      | `"runtime-slash"` | Markeert de alias als een slash-commando in chat in plaats van een root-CLI-commando. |
| `cliCommand` | Nee      | `string`          | Gerelateerd root-CLI-commando om voor CLI-bewerkingen voor te stellen, als er een bestaat. |

## `activation`-referentie

Gebruik `activation` wanneer de plugin goedkoop kan declareren bij welke control-plane-gebeurtenissen
deze in een activatie-/laadplan moet worden opgenomen.

Dit blok is plannermetadata, geen lifecycle-API. Het registreert geen
runtimegedrag, vervangt `register(...)` niet en belooft niet dat
plugincode al is uitgevoerd. De activatieplanner gebruikt deze velden om
kandidaatplugins te beperken voordat wordt teruggevallen op bestaande metadata
voor manifest-eigenaarschap, zoals `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` en hooks.

Geef de voorkeur aan de smalste metadata die eigenaarschap al beschrijft. Gebruik
`providers`, `channels`, `commandAliases`, setup-descriptors of `contracts`
wanneer die velden de relatie uitdrukken. Gebruik `activation` voor extra plannerhints
die niet door die eigenaarschapsvelden kunnen worden weergegeven.
Gebruik top-level `cliBackends` voor CLI-runtimealiassen zoals `claude-cli`,
`codex-cli` of `google-gemini-cli`; `activation.onAgentHarnesses` is alleen voor
ingebedde agent-harness-id's die nog geen eigenaarschapsveld hebben.

Dit blok is alleen metadata. Het registreert geen runtimegedrag en het vervangt
`register(...)`, `setupEntry` of andere runtime-/plugin-entrypoints niet.
Huidige consumers gebruiken het als beperkende hint vóór breder laden van plugins, dus
ontbrekende activatiemetadata kosten meestal alleen performance; ze zouden de
correctheid niet moeten veranderen zolang legacy-fallbacks voor manifest-eigenaarschap nog bestaan.

Elke plugin moet `activation.onStartup` bewust instellen terwijl OpenClaw
afstapt van impliciete startupimports. Zet dit alleen op `true` wanneer de plugin
tijdens Gateway-startup moet draaien. Zet dit op `false` wanneer de plugin bij
startup inert is en alleen via smallere triggers moet laden. Het weglaten van `onStartup` behoudt
de verouderde legacy-fallback voor impliciete startup-sidecars voor plugins zonder
statische capabilitymetadata; toekomstige versies kunnen stoppen met het tijdens startup laden van die
plugins tenzij ze `activation.onStartup: true` declareren. Pluginstatus- en
compatibiliteitsrapporten waarschuwen met `legacy-implicit-startup-sidecar` wanneer een plugin
nog steeds op die fallback vertrouwt.

Voor migratietests zet je
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` om alleen die
verouderde fallback uit te schakelen. Deze opt-inmodus blokkeert geen expliciete
`activation.onStartup: true`-plugins of plugins die worden geladen door kanaal, config,
agent-harness, memory of andere smallere activatietriggers.

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
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Nee      | `boolean`                                            | Expliciete Gateway-startupactivatie. Elke plugin moet dit instellen. `true` importeert de plugin tijdens startup; `false` kiest uit voor de verouderde fallback voor impliciete sidecar-startup, tenzij een andere overeenkomende trigger laden vereist. |
| `onProviders`      | Nee      | `string[]`                                           | Provider-id's die deze plugin in activatie-/laadplannen moeten opnemen.                                                                                                                                                            |
| `onAgentHarnesses` | Nee      | `string[]`                                           | Ingebedde runtime-id's van agent-harnassen die deze plugin in activatie-/laadplannen moeten opnemen. Gebruik top-level `cliBackends` voor CLI-backendaliassen.                                                                     |
| `onCommands`       | Nee      | `string[]`                                           | Commando-id's die deze plugin in activatie-/laadplannen moeten opnemen.                                                                                                                                                            |
| `onChannels`       | Nee      | `string[]`                                           | Kanaal-id's die deze plugin in activatie-/laadplannen moeten opnemen.                                                                                                                                                              |
| `onRoutes`         | Nee      | `string[]`                                           | Routetypen die deze plugin in activatie-/laadplannen moeten opnemen.                                                                                                                                                               |
| `onConfigPaths`    | Nee      | `string[]`                                           | Configpaden relatief aan de root die deze plugin in startup-/laadplannen moeten opnemen wanneer het pad aanwezig is en niet expliciet is uitgeschakeld.                                                                            |
| `onCapabilities`   | Nee      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Brede capabilityhints die worden gebruikt door control-plane-activatieplanning. Geef waar mogelijk de voorkeur aan smallere velden.                                                                                                 |

Huidige live-consumers:

- Gateway-startupplanning gebruikt `activation.onStartup` voor expliciete startup-
  import en opt-out van de verouderde fallback voor impliciete sidecar-startup
- door commando's getriggerde CLI-planning valt terug op legacy
  `commandAliases[].cliCommand` of `commandAliases[].name`
- agent-runtime-startupplanning gebruikt `activation.onAgentHarnesses` voor
  ingebedde harnassen en top-level `cliBackends[]` voor CLI-runtimealiassen
- door kanalen getriggerde setup-/kanaalplanning valt terug op legacy `channels[]`-
  eigenaarschap wanneer expliciete kanaalactivatiemetadata ontbreken
- startup-pluginplanning gebruikt `activation.onConfigPaths` voor niet-kanaal-root-
  configoppervlakken zoals het `browser`-blok van de gebundelde browserplugin
- door providers getriggerde setup-/runtimeplanning valt terug op legacy
  `providers[]` en top-level `cliBackends[]`-eigenaarschap wanneer expliciete provider-
  activatiemetadata ontbreken

Plannerdiagnoses kunnen expliciete activatiehints onderscheiden van fallback op manifest-
eigenaarschap. Bijvoorbeeld: `activation-command-hint` betekent dat
`activation.onCommands` overeenkwam, terwijl `manifest-command-alias` betekent dat de
planner in plaats daarvan `commandAliases`-eigenaarschap gebruikte. Deze redenlabels zijn voor
hostdiagnoses en tests; pluginauteurs moeten de metadata blijven declareren
die eigenaarschap het best beschrijven.

## `qaRunners`-referentie

Gebruik `qaRunners` wanneer een plugin een of meer transportrunners bijdraagt onder
de gedeelde root `openclaw qa`. Houd deze metadata goedkoop en statisch; de plugin-
runtime blijft eigenaar van de daadwerkelijke CLI-registratie via een lichtgewicht
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

| Veld          | Vereist | Type     | Betekenis                                                          |
| ------------- | ------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja      | `string` | Subopdracht gemount onder `openclaw qa`, bijvoorbeeld `matrix`.    |
| `description` | Nee     | `string` | Fallback-helptekst die wordt gebruikt wanneer de gedeelde host een stub-opdracht nodig heeft. |

## setup-referentie

Gebruik `setup` wanneer setup- en onboardingsurfaces goedkope plugin-eigen metadata
nodig hebben voordat runtime wordt geladen.

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

`cliBackends` op het hoogste niveau blijft geldig en blijft CLI-inferentiebackends
beschrijven. `setup.cliBackends` is de setup-specifieke descriptorsurface voor
control-plane-/setupflows die metadata-only moeten blijven.

Wanneer aanwezig zijn `setup.providers` en `setup.cliBackends` de voorkeursurface
voor descriptor-first lookup voor setupdetectie. Als de descriptor alleen de
kandidaatplugin vernauwt en setup nog rijkere runtime-hooks tijdens setup nodig
heeft, stel dan `requiresRuntime: true` in en behoud `setup-api` als het
fallback-uitvoeringspad.

OpenClaw neemt ook `setup.providers[].envVars` op in generieke provider-auth- en
env-var-lookups. `providerAuthEnvVars` blijft ondersteund via een compatibiliteitsadapter
tijdens de deprecationperiode, maar niet-gebundelde plugins die deze nog gebruiken
ontvangen een manifestdiagnose. Nieuwe plugins moeten setup-/status-env-metadata
op `setup.providers[].envVars` plaatsen.

OpenClaw kan ook eenvoudige setupkeuzes afleiden uit `setup.providers[].authMethods`
wanneer er geen setup-entry beschikbaar is, of wanneer `setup.requiresRuntime: false`
verklaart dat setup-runtime onnodig is. Expliciete `providerAuthChoices`-entries
blijven de voorkeur houden voor aangepaste labels, CLI-flags, onboardingscope en
assistentmetadata.

Stel `requiresRuntime: false` alleen in wanneer die descriptors voldoende zijn voor de
setupsurface. OpenClaw behandelt expliciet `false` als een descriptor-only contract
en zal `setup-api` of `openclaw.setupEntry` niet uitvoeren voor setup-lookup. Als
een descriptor-only plugin nog steeds een van die setup-runtime-entries levert,
rapporteert OpenClaw een additieve diagnose en blijft deze negeren. Weggelaten
`requiresRuntime` behoudt legacy fallback-gedrag zodat bestaande plugins die
descriptors zonder de vlag hebben toegevoegd niet breken.

Omdat setup-lookup plugin-eigen `setup-api`-code kan uitvoeren, moeten genormaliseerde
waarden voor `setup.providers[].id` en `setup.cliBackends[]` uniek blijven binnen
ontdekte plugins. Ambigu eigenaarschap faalt gesloten in plaats van een winnaar
te kiezen op basis van detectievolgorde.

Wanneer setup-runtime wel wordt uitgevoerd, rapporteren setupregistrydiagnoses
descriptordrift als `setup-api` een provider of CLI-backend registreert die de
manifestdescriptors niet declareren, of als een descriptor geen overeenkomende
runtimeregistratie heeft. Deze diagnoses zijn additief en wijzen legacy plugins
niet af.

### setup.providers-referentie

| Veld           | Vereist | Type       | Betekenis                                                                                         |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `id`           | Ja      | `string`   | Provider-id die tijdens setup of onboarding wordt blootgesteld. Houd genormaliseerde ids globaal uniek. |
| `authMethods`  | Nee     | `string[]` | Setup-/auth-methode-ids die deze provider ondersteunt zonder de volledige runtime te laden.        |
| `envVars`      | Nee     | `string[]` | Env vars die generieke setup-/statussurfaces kunnen controleren voordat plugin-runtime laadt.      |
| `authEvidence` | Nee     | `object[]` | Goedkope lokale auth-bewijscontroles voor providers die via niet-geheime markers kunnen authenticeren. |

`authEvidence` is bedoeld voor provider-eigen lokale credentialmarkers die kunnen worden
geverifieerd zonder runtimecode te laden. Deze controles moeten goedkoop en lokaal blijven:
geen netwerkcalls, geen keychain- of secret-manager-reads, geen shellopdrachten en geen
provider-API-probes.

Ondersteunde evidence-entries:

| Veld               | Vereist | Type       | Betekenis                                                                                                      |
| ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Ja      | `string`   | Momenteel `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Nee     | `string`   | Env var met een expliciet pad naar een credentialbestand.                                                       |
| `fallbackPaths`    | Nee     | `string[]` | Lokale credentialbestandspaden die worden gecontroleerd wanneer `fileEnvVar` ontbreekt of leeg is. Ondersteunt `${HOME}` en `${APPDATA}`. |
| `requiresAnyEnv`   | Nee     | `string[]` | Ten minste een vermelde env var moet niet-leeg zijn voordat het bewijs geldig is.                              |
| `requiresAllEnv`   | Nee     | `string[]` | Elke vermelde env var moet niet-leeg zijn voordat het bewijs geldig is.                                        |
| `credentialMarker` | Ja      | `string`   | Niet-geheime marker die wordt geretourneerd wanneer het bewijs aanwezig is.                                    |
| `source`           | Nee     | `string`   | Gebruikersgericht bronlabel voor auth-/statusuitvoer.                                                          |

### setup-velden

| Veld               | Vereist | Type       | Betekenis                                                                                             |
| ------------------ | ------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Nee     | `object[]` | Provider-setupdescriptors die tijdens setup en onboarding worden blootgesteld.                         |
| `cliBackends`      | Nee     | `string[]` | Backend-ids tijdens setup die worden gebruikt voor descriptor-first setup-lookup. Houd genormaliseerde ids globaal uniek. |
| `configMigrations` | Nee     | `string[]` | Configmigratie-ids die eigendom zijn van de setupsurface van deze plugin.                              |
| `requiresRuntime`  | Nee     | `boolean`  | Of setup nog steeds uitvoering van `setup-api` nodig heeft na descriptor-lookup.                       |

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

| Veld          | Type       | Betekenis                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Gebruikersgericht veldlabel.               |
| `help`        | `string`   | Korte helptekst.                           |
| `tags`        | `string[]` | Optionele UI-tags.                         |
| `advanced`    | `boolean`  | Markeert het veld als geavanceerd.         |
| `sensitive`   | `boolean`  | Markeert het veld als geheim of gevoelig.  |
| `placeholder` | `string`   | Placeholdertekst voor formulierinvoer.     |

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

| Veld                             | Type       | Betekenis                                                               |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory-ids, momenteel `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | Runtime-ids waarvoor een gebundelde plugin tool-result middleware mag registreren. |
| `externalAuthProviders`          | `string[]` | Provider-ids waarvan deze plugin de externe auth-profielhook bezit.     |
| `speechProviders`                | `string[]` | Speech-provider-ids waarvan deze plugin eigenaar is.                    |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription-provider-ids waarvan deze plugin eigenaar is.    |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice-provider-ids waarvan deze plugin eigenaar is.            |
| `memoryEmbeddingProviders`       | `string[]` | Memory embedding provider-ids waarvan deze plugin eigenaar is.          |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding-provider-ids waarvan deze plugin eigenaar is.       |
| `imageGenerationProviders`       | `string[]` | Image-generation-provider-ids waarvan deze plugin eigenaar is.          |
| `videoGenerationProviders`       | `string[]` | Video-generation-provider-ids waarvan deze plugin eigenaar is.          |
| `webFetchProviders`              | `string[]` | Web-fetch-provider-ids waarvan deze plugin eigenaar is.                 |
| `webSearchProviders`             | `string[]` | Web-search-provider-ids waarvan deze plugin eigenaar is.                |
| `migrationProviders`             | `string[]` | Importprovider-ids waarvan deze plugin eigenaar is voor `openclaw migrate`. |
| `tools`                          | `string[]` | Agenttoolnamen waarvan deze plugin eigenaar is voor gebundelde contractcontroles. |

`contracts.embeddedExtensionFactories` blijft behouden voor gebundelde Codex
app-server-only extension factories. Gebundelde tool-result-transformaties moeten
in plaats daarvan `contracts.agentToolResultMiddleware` declareren en registreren met
`api.registerAgentToolResultMiddleware(...)`. Externe plugins kunnen geen
tool-result middleware registreren omdat de naad high-trust tooluitvoer kan
herschrijven voordat het model die ziet.

Providerplugins die `resolveExternalAuthProfiles` implementeren, moeten
`contracts.externalAuthProviders` declareren. Plugins zonder de declaratie lopen nog steeds
via een verouderde compatibiliteitsfallback, maar die fallback is langzamer en
wordt na de migratieperiode verwijderd.

Gebundelde memory embedding providers moeten
`contracts.memoryEmbeddingProviders` declareren voor elke adapter-id die ze blootstellen, inclusief
ingebouwde adapters zoals `local`. Standalone CLI-paden gebruiken dit manifestcontract
om alleen de eigenaarplugin te laden voordat de volledige Gateway-runtime
providers heeft geregistreerd.

## mediaUnderstandingProviderMetadata-referentie

Gebruik `mediaUnderstandingProviderMetadata` wanneer een media-understanding-provider
standaardmodellen, fallbackprioriteit voor auto-auth of native documentondersteuning heeft die
generieke kernhelpers nodig hebben voordat de runtime laadt. Sleutels moeten ook worden gedeclareerd in
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Mediacapaciteiten die door deze provider worden aangeboden.                       |
| `defaultModels`        | `Record<string, string>`            | Standaardwaarden van capaciteit naar model die worden gebruikt wanneer de configuratie geen model opgeeft. |
| `autoPriority`         | `Record<string, number>`            | Lagere getallen worden eerder gesorteerd voor automatische fallback op basis van providerreferenties. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native documentinvoer die door de provider wordt ondersteund.                     |

## channelConfigs-referentie

Gebruik `channelConfigs` wanneer een kanaal-Plugin goedkope configuratiemetadata nodig heeft voordat
de runtime laadt. Alleen-lezen detectie van kanaalinstelling/status kan deze metadata
rechtstreeks gebruiken voor geconfigureerde externe kanalen wanneer er geen setupvermelding beschikbaar is, of
wanneer `setup.requiresRuntime: false` declareert dat setup-runtime niet nodig is.

`channelConfigs` is metadata van het Plugin-manifest, geen nieuwe top-level gebruikersconfiguratiesectie.
Gebruikers configureren kanaalinstanties nog steeds onder `channels.<channel-id>`.
OpenClaw leest manifestmetadata om te bepalen welke Plugin eigenaar is van dat geconfigureerde
kanaal voordat Plugin-runtimecode wordt uitgevoerd.

Voor een kanaal-Plugin beschrijven `configSchema` en `channelConfigs` verschillende
paden:

- `configSchema` valideert `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valideert `channels.<channel-id>`

Niet-gebundelde plugins die `channels[]` declareren, moeten ook bijpassende
`channelConfigs`-vermeldingen declareren. Zonder die vermeldingen kan OpenClaw de Plugin nog steeds laden, maar
cold-path configuratieschema-, setup- en Control UI-oppervlakken kunnen de
vorm van kanaaleigendom opties pas kennen wanneer de Plugin-runtime wordt uitgevoerd.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` en
`nativeSkillsAutoEnabled` kunnen statische `auto`-standaardwaarden declareren voor command-configuratiecontroles
die worden uitgevoerd voordat de kanaalruntime laadt. Gebundelde kanalen kunnen ook
dezelfde standaardwaarden publiceren via `package.json#openclaw.channel.commands` naast
hun andere kanaalcatalogusmetadata die eigendom is van het pakket.

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

| Veld          | Type                     | Wat het betekent                                                                             |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema voor `channels.<id>`. Vereist voor elke gedeclareerde kanaalconfiguratievermelding. |
| `uiHints`     | `Record<string, object>` | Optionele UI-labels/placeholders/gevoelige hints voor die kanaalconfiguratiesectie.          |
| `label`       | `string`                 | Kanaallabel dat wordt samengevoegd in picker- en inspectieoppervlakken wanneer runtimemetadata niet gereed is. |
| `description` | `string`                 | Korte kanaalbeschrijving voor inspectie- en catalogusoppervlakken.                           |
| `commands`    | `object`                 | Statische native command- en native skill-auto-standaardwaarden voor pre-runtime configuratiecontroles. |
| `preferOver`  | `string[]`               | Verouderde of lagere-prioriteit Plugin-id's die dit kanaal moet overtreffen in selectieoppervlakken. |

### Een andere kanaal-Plugin vervangen

Gebruik `preferOver` wanneer je Plugin de voorkeurs-eigenaar is voor een kanaal-id dat
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

Wanneer `channels.chat` is geconfigureerd, houdt OpenClaw rekening met zowel de kanaal-id als
de voorkeurs-Plugin-id. Als de Plugin met lagere prioriteit alleen was geselecteerd omdat
deze gebundeld is of standaard is ingeschakeld, schakelt OpenClaw deze uit in de effectieve
runtimeconfiguratie zodat één Plugin eigenaar is van het kanaal en de tools. Expliciete gebruikersselectie
wint nog steeds: als de gebruiker beide plugins expliciet inschakelt, behoudt OpenClaw
die keuze en rapporteert het dubbele kanaal-/tooldiagnostiek in plaats van
de gevraagde Plugin-set stilzwijgend te wijzigen.

Houd `preferOver` beperkt tot Plugin-id's die echt hetzelfde kanaal kunnen leveren.
Het is geen algemeen prioriteitsveld en het hernoemt geen gebruikersconfiguratiesleutels.

## modelSupport-referentie

Gebruik `modelSupport` wanneer OpenClaw je provider-Plugin moet afleiden uit
verkorte model-id's zoals `gpt-5.5` of `claude-sonnet-4.6` voordat de Plugin-runtime
laadt.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw past deze prioriteitsvolgorde toe:

- expliciete `provider/model`-referenties gebruiken de eigenaarsmetadata van het `providers`-manifest
- `modelPatterns` hebben voorrang op `modelPrefixes`
- als één niet-gebundelde Plugin en één gebundelde Plugin beide overeenkomen, wint de niet-gebundelde
  Plugin
- resterende ambiguïteit wordt genegeerd totdat de gebruiker of configuratie een provider opgeeft

Velden:

| Veld            | Type       | Wat het betekent                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefixen die met `startsWith` worden gematcht tegen verkorte model-id's.         |
| `modelPatterns` | `string[]` | Regex-bronnen die tegen verkorte model-id's worden gematcht na verwijdering van het profielsuffix. |

## modelCatalog-referentie

Gebruik `modelCatalog` wanneer OpenClaw providermodelmetadata moet kennen voordat
de Plugin-runtime wordt geladen. Dit is de manifest-eigen bron voor vaste catalogusrijen,
provideraliassen, onderdrukkingsregels en discovery-modus. Runtimeverversing
blijft in provider-runtimecode thuishoren, maar het manifest vertelt de kern wanneer runtime
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

| Veld           | Type                                                     | Wat het betekent                                                                                         |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Catalogusrijen voor provider-id's die eigendom zijn van deze Plugin. Sleutels moeten ook voorkomen in top-level `providers`. |
| `aliases`      | `Record<string, object>`                                 | Provideraliassen die moeten worden opgelost naar een provider in eigendom voor catalogus- of onderdrukkingsplanning. |
| `suppressions` | `object[]`                                               | Modelrijen uit een andere bron die deze Plugin onderdrukt om een provider-specifieke reden.               |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Of de providercatalogus kan worden gelezen uit manifestmetadata, kan worden ververst naar cache, of runtime vereist. |

`aliases` neemt deel aan het opzoeken van providereigendom voor modelcatalogusplanning.
Aliasdoelen moeten top-level providers zijn die eigendom zijn van dezelfde Plugin. Wanneer een
providergefilterde lijst een alias gebruikt, kan OpenClaw het eigenaarsmanifest lezen en
alias-API-/base URL-overschrijvingen toepassen zonder de provider-runtime te laden.
Aliassen breiden ongefilterde cataloguslijsten niet uit; brede lijsten geven alleen de eigenaarsrijen van de
canonieke provider weer.

`suppressions` vervangt de oude provider-runtimehook `suppressBuiltInModel`.
Onderdrukkingsvermeldingen worden alleen gerespecteerd wanneer de provider eigendom is van de Plugin of
is gedeclareerd als een `modelCatalog.aliases`-sleutel die naar een provider in eigendom verwijst. Runtime-
onderdrukkingshooks worden niet langer aangeroepen tijdens modelresolutie.

Providervelden:

| Veld      | Type                     | Wat het betekent                                                        |
| --------- | ------------------------ | ----------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Optionele standaard-base URL voor modellen in deze providercatalogus.   |
| `api`     | `ModelApi`               | Optionele standaard-API-adapter voor modellen in deze providercatalogus. |
| `headers` | `Record<string, string>` | Optionele statische headers die van toepassing zijn op deze providercatalogus. |
| `models`  | `object[]`               | Vereiste modelrijen. Rijen zonder `id` worden genegeerd.                |

Modelvelden:

| Veld            | Type                                                           | Betekenis                                                                   |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-lokaal model-id, zonder het voorvoegsel `provider/`.               |
| `name`          | `string`                                                       | Optionele weergavenaam.                                                     |
| `api`           | `ModelApi`                                                     | Optionele API-overschrijving per model.                                     |
| `baseUrl`       | `string`                                                       | Optionele basis-URL-overschrijving per model.                               |
| `headers`       | `Record<string, string>`                                       | Optionele statische headers per model.                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modaliteiten die het model accepteert.                                      |
| `reasoning`     | `boolean`                                                      | Of het model reasoning-gedrag beschikbaar maakt.                            |
| `contextWindow` | `number`                                                       | Native contextvenster van de provider.                                      |
| `contextTokens` | `number`                                                       | Optionele effectieve runtime-contextlimiet wanneer die afwijkt van `contextWindow`. |
| `maxTokens`     | `number`                                                       | Maximale uitvoertokens wanneer bekend.                                      |
| `cost`          | `object`                                                       | Optionele prijsstelling in USD per miljoen tokens, inclusief optionele `tieredPricing`. |
| `compat`        | `object`                                                       | Optionele compatibiliteitsvlaggen die overeenkomen met de OpenClaw-modelconfiguratiecompatibiliteit. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Vermeldingsstatus. Onderdruk alleen wanneer de rij helemaal niet mag verschijnen. |
| `statusReason`  | `string`                                                       | Optionele reden die wordt weergegeven bij een niet-beschikbare status.      |
| `replaces`      | `string[]`                                                     | Oudere provider-lokale model-id's die dit model vervangt.                  |
| `replacedBy`    | `string`                                                       | Vervangend provider-lokaal model-id voor verouderde rijen.                 |
| `tags`          | `string[]`                                                     | Stabiele tags die door kiezers en filters worden gebruikt.                  |

Onderdrukkingsvelden:

| Veld                       | Type       | Betekenis                                                                                                 |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Provider-id voor de upstreamrij die moet worden onderdrukt. Moet eigendom zijn van deze Plugin of zijn gedeclareerd als een eigen alias. |
| `model`                    | `string`   | Provider-lokaal model-id dat moet worden onderdrukt.                                                      |
| `reason`                   | `string`   | Optioneel bericht dat wordt weergegeven wanneer de onderdrukte rij rechtstreeks wordt opgevraagd.         |
| `when.baseUrlHosts`        | `string[]` | Optionele lijst met effectieve provider-basis-URL-hosts die vereist zijn voordat de onderdrukking geldt.  |
| `when.providerConfigApiIn` | `string[]` | Optionele lijst met exacte providerconfiguratie-`api`-waarden die vereist zijn voordat de onderdrukking geldt. |

Plaats geen runtime-only gegevens in `modelCatalog`. Gebruik `static` alleen wanneer manifest
rijen volledig genoeg zijn voor provider-gefilterde lijst- en kiezersoppervlakken om
registry/runtime-detectie over te slaan. Gebruik `refreshable` wanneer manifestrijen nuttige
lijstbare seeds of aanvullingen zijn, maar een refresh/cache later meer rijen kan toevoegen;
refreshable rijen zijn op zichzelf niet gezaghebbend. Gebruik `runtime` wanneer OpenClaw
de provider-runtime moet laden om de lijst te kennen.

## modelIdNormalization-referentie

Gebruik `modelIdNormalization` voor goedkope, provider-eigen opschoning van model-id's die moet
gebeuren voordat de provider-runtime laadt. Dit houdt aliassen zoals korte model
namen, provider-lokale legacy-id's en proxyvoorvoegselregels in het eigenaar-Plugin
manifest in plaats van in kernmodelselectietabellen.

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

| Veld                                 | Type                    | Betekenis                                                                                 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Exacte model-id-aliassen zonder hoofdlettergevoeligheid. Waarden worden teruggegeven zoals geschreven. |
| `stripPrefixes`                      | `string[]`              | Voorvoegsels die vóór het opzoeken van aliassen worden verwijderd, nuttig voor legacy provider/model-duplicatie. |
| `prefixWhenBare`                     | `string`                | Voorvoegsel dat wordt toegevoegd wanneer het genormaliseerde model-id nog geen `/` bevat. |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Voorwaardelijke regels voor kale-id-voorvoegsels na aliasopzoeking, gesleuteld op `modelPrefix` en `prefix`. |

## providerEndpoints-referentie

Gebruik `providerEndpoints` voor endpointclassificatie die generiek aanvraagbeleid
moet kennen voordat de provider-runtime laadt. Core blijft eigenaar van de betekenis van elke
`endpointClass`; Plugin-manifesten zijn eigenaar van de host- en basis-URL-metadata.

Endpointvelden:

| Veld                           | Type       | Betekenis                                                                                      |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Bekende core-endpointklasse, zoals `openrouter`, `moonshot-native` of `google-vertex`.         |
| `hosts`                        | `string[]` | Exacte hostnamen die aan de endpointklasse worden gekoppeld.                                  |
| `hostSuffixes`                 | `string[]` | Hostsuffixen die aan de endpointklasse worden gekoppeld. Gebruik `.` als voorvoegsel voor matching alleen op domeinsuffixen. |
| `baseUrls`                     | `string[]` | Exacte genormaliseerde HTTP(S)-basis-URL's die aan de endpointklasse worden gekoppeld.         |
| `googleVertexRegion`           | `string`   | Statische Google Vertex-regio voor exacte globale hosts.                                      |
| `googleVertexRegionHostSuffix` | `string`   | Suffix om van overeenkomende hosts te verwijderen om het Google Vertex-regiovoorvoegsel bloot te leggen. |

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

| Veld                  | Type         | Betekenis                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Providerfamilielabel dat wordt gebruikt door generieke beslissingen en diagnostiek voor aanvraagcompatibiliteit. |
| `compatibilityFamily` | `"moonshot"` | Optionele providerfamilie-compatibiliteitsbucket voor gedeelde aanvraaghelpers.        |
| `openAICompletions`   | `object`     | OpenAI-compatibele vlaggen voor completions-aanvragen, momenteel `supportsStreamingUsage`. |

## modelPricing-referentie

Gebruik `modelPricing` wanneer een provider prijsstellingsgedrag in het control plane nodig heeft voordat
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
| `openRouter` | `false \| object` | Mapping voor OpenRouter-prijsopzoeking. `false` schakelt OpenRouter-opzoeking voor deze provider uit. |
| `liteLLM`    | `false \| object` | Mapping voor LiteLLM-prijsopzoeking. `false` schakelt LiteLLM-opzoeking voor deze provider uit.    |

Bronvelden:

| Veld                       | Type               | Betekenis                                                                                                              |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Externe catalogus-provider-id wanneer dit afwijkt van het OpenClaw-provider-id, bijvoorbeeld `z-ai` voor een `zai`-provider. |
| `passthroughProviderModel` | `boolean`          | Behandel model-id's met slashes als geneste provider/model-referenties, nuttig voor proxyproviders zoals OpenRouter.  |
| `modelIdTransforms`        | `"version-dots"[]` | Extra externe catalogusvarianten van model-id's. `version-dots` probeert gestippelde versie-id's zoals `claude-opus-4.6`. |

### OpenClaw Provider Index

De OpenClaw Provider Index is previewmetadata van OpenClaw voor providers
waarvan de Plugins mogelijk nog niet zijn geïnstalleerd. Het maakt geen deel uit van een Plugin-manifest.
Plugin-manifesten blijven de autoriteit voor geïnstalleerde Plugins. De Provider Index is
het interne fallbackcontract dat toekomstige installeerbare-provider- en pre-install
modelkiezersoppervlakken zullen gebruiken wanneer een provider-Plugin niet is geïnstalleerd.

Volgorde van catalogusautoriteit:

1. Gebruikersconfiguratie.
2. Geïnstalleerd Plugin-manifest `modelCatalog`.
3. Modelcataloguscache van expliciete refresh.
4. Previewrijen van OpenClaw Provider Index.

De Provider Index mag geen geheimen, ingeschakelde status, runtime-hooks of
live accountspecifieke modelgegevens bevatten. De voorbeeldcatalogi gebruiken
dezelfde providerrij-vorm voor `modelCatalog` als Plugin-manifesten, maar moeten
beperkt blijven tot stabiele weergavemetadata, tenzij runtime-adaptervelden
zoals `api`, `baseUrl`, prijzen of compatibiliteitsvlaggen bewust afgestemd
blijven op het geinstalleerde Plugin-manifest. Providers met live `/models`-
detectie moeten vernieuwde rijen schrijven via het expliciete cachepad voor de
modelcatalogus in plaats van provider-API's aan te roepen tijdens normale
lijsten of onboarding.

Provider Index-items mogen ook metadata voor installeerbare Plugins bevatten
voor providers waarvan de Plugin uit de core is verplaatst of anderszins nog
niet is geinstalleerd. Deze metadata volgt het patroon van de kanaalcatalogus:
pakketnaam, npm-installatiespecificatie, verwachte integriteit en goedkope
labels voor authenticatiekeuzes zijn genoeg om een installeerbare insteloptie
te tonen. Zodra de Plugin is geinstalleerd, wint het manifest daarvan en wordt
het Provider Index-item voor die provider genegeerd.

Verouderde capability-sleutels op topniveau zijn afgeschaft. Gebruik
`openclaw doctor --fix` om `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` en `webSearchProviders` onder
`contracts` te plaatsen; normaal laden van manifesten behandelt die velden op
topniveau niet langer als eigenaarschap van capabilities.

## Manifest versus package.json

De twee bestanden hebben verschillende taken:

| Bestand                | Gebruik het voor                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Detectie, configvalidatie, metadata voor authenticatiekeuzes en UI-hints die moeten bestaan voordat Plugin-code draait           |
| `package.json`         | npm-metadata, dependency-installatie en het `openclaw`-blok dat wordt gebruikt voor entrypoints, installatieregels, setup of catalogusmetadata |

Als je niet zeker weet waar metadata thuishoort, gebruik dan deze regel:

- als OpenClaw het moet weten voordat Plugin-code wordt geladen, zet het dan in `openclaw.plugin.json`
- als het over packaging, entrybestanden of npm-installatiegedrag gaat, zet het dan in `package.json`

### package.json-velden die detectie beinvloeden

Sommige pre-runtime Plugin-metadata staat bewust in `package.json` onder het
`openclaw`-blok in plaats van in `openclaw.plugin.json`.

Belangrijke voorbeelden:

| Veld                                                              | Betekenis                                                                                                                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declareert native Plugin-entrypoints. Moet binnen de Plugin-pakketmap blijven.                                                                                                      |
| `openclaw.runtimeExtensions`                                      | Declareert gebouwde JavaScript-runtime-entrypoints voor geinstalleerde pakketten. Moet binnen de Plugin-pakketmap blijven.                                                         |
| `openclaw.setupEntry`                                             | Lichtgewicht entrypoint alleen voor setup, gebruikt tijdens onboarding, uitgestelde kanaalstart en alleen-lezen kanaalstatus/SecretRef-detectie. Moet binnen de Plugin-pakketmap blijven. |
| `openclaw.runtimeSetupEntry`                                      | Declareert het gebouwde JavaScript-setup-entrypoint voor geinstalleerde pakketten. Moet binnen de Plugin-pakketmap blijven.                                                        |
| `openclaw.channel`                                                | Goedkope kanaalcatalogusmetadata zoals labels, docspaden, aliassen en selectietekst.                                                                                               |
| `openclaw.channel.commands`                                       | Statische native opdracht- en native Skills-auto-defaultmetadata die door config-, audit- en opdrachtlijst-oppervlakken wordt gebruikt voordat de kanaalruntime laadt.              |
| `openclaw.channel.configuredState`                                | Lichtgewicht metadata voor configured-state-controles die kan beantwoorden: "bestaat een env-only setup al?" zonder de volledige kanaalruntime te laden.                            |
| `openclaw.channel.persistedAuthState`                             | Lichtgewicht metadata voor persisted-auth-controles die kan beantwoorden: "is er al ergens ingelogd?" zonder de volledige kanaalruntime te laden.                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installatie-/updatehints voor gebundelde en extern gepubliceerde Plugins.                                                                                                           |
| `openclaw.install.defaultChoice`                                  | Voorkeursinstallatiepad wanneer meerdere installatiebronnen beschikbaar zijn.                                                                                                       |
| `openclaw.install.minHostVersion`                                 | Minimaal ondersteunde OpenClaw-hostversie, met een semver-ondergrens zoals `>=2026.3.22`.                                                                                          |
| `openclaw.install.expectedIntegrity`                              | Verwachte npm-dist-integriteitsstring zoals `sha512-...`; installatie- en updateflows veriferen het opgehaalde artefact hiertegen.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Staat een smal herstelpad voor herinstallatie van gebundelde Plugins toe wanneer config ongeldig is.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Laat setup-only kanaaloppervlakken laden voor de volledige kanaal-Plugin tijdens het opstarten.                                                                                     |

Manifestmetadata bepaalt welke provider-/kanaal-/setupkeuzes in onboarding
verschijnen voordat runtime laadt. `package.json#openclaw.install` vertelt
onboarding hoe die Plugin moet worden opgehaald of ingeschakeld wanneer de
gebruiker een van die keuzes selecteert. Verplaats installatiehints niet naar
`openclaw.plugin.json`.

`openclaw.install.minHostVersion` wordt afgedwongen tijdens installatie en het
laden van het manifestregister. Ongeldige waarden worden geweigerd; nieuwere
maar geldige waarden slaan de Plugin over op oudere hosts.

Exacte npm-versiepins staan al in `npmSpec`, bijvoorbeeld
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Officiele externe
catalogusitems moeten exacte specificaties combineren met `expectedIntegrity`,
zodat updateflows gesloten falen als het opgehaalde npm-artefact niet langer
overeenkomt met de gepinde release. Interactieve onboarding biedt voor
compatibiliteit nog steeds vertrouwde registry-npm-specificaties aan, inclusief
kale pakketnamen en dist-tags. Catalogusdiagnostiek kan onderscheid maken
tussen exacte, zwevende, integriteitsgepinde, ontbrekende integriteit,
pakketnaam-mismatch en ongeldige default-choice-bronnen. Ze waarschuwen ook
wanneer `expectedIntegrity` aanwezig is maar er geen geldige npm-bron is die
ermee kan worden gepind. Wanneer `expectedIntegrity` aanwezig is, dwingen
installatie-/updateflows die af; wanneer het ontbreekt, wordt de
registry-resolutie vastgelegd zonder integriteitspin.

Kanaal-Plugins moeten `openclaw.setupEntry` bieden wanneer status,
kanaallijsten of SecretRef-scans geconfigureerde accounts moeten identificeren
zonder de volledige runtime te laden. Het setup-entrypoint moet kanaalmetadata
plus setup-veilige adapters voor config, status en geheimen blootstellen; houd
netwerkclients, Gateway-listeners en transportruntimes in het hoofdentrypoint
van de extensie.

Runtime-entrypointvelden overschrijven pakketgrenscontroles voor
source-entrypointvelden niet. `openclaw.runtimeExtensions` kan bijvoorbeeld
geen ontsnappend `openclaw.extensions`-pad laadbaar maken.

`openclaw.install.allowInvalidConfigRecovery` is bewust smal. Het maakt niet
willekeurige kapotte configs installeerbaar. Vandaag staat het alleen toe dat
installatieflows herstellen van specifieke verouderde upgradefouten van
gebundelde Plugins, zoals een ontbrekend gebundeld Plugin-pad of een verouderd
`channels.<id>`-item voor diezelfde gebundelde Plugin. Niet-gerelateerde
configfouten blokkeren installatie nog steeds en verwijzen operators naar
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

Gebruik dit wanneer setup, doctor, status of alleen-lezen presence-flows een
goedkope ja/nee-authenticatieprobe nodig hebben voordat de volledige
kanaal-Plugin laadt. Persisted auth-state is geen configured channel-state:
gebruik deze metadata niet om Plugins automatisch in te schakelen,
runtimedependencies te repareren of te beslissen of een kanaalruntime moet
laden. De doel-export moet een kleine functie zijn die alleen persistente status
leest; routeer die niet via de volledige kanaalruntime-barrel.

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

Gebruik dit wanneer een kanaal configured-state kan beantwoorden op basis van
env of andere kleine niet-runtime-inputs. Als de controle volledige
configresolutie of de echte kanaalruntime nodig heeft, houd die logica dan in de
Plugin-hook `config.hasConfiguredState`.

## Detectievoorrang (dubbele Plugin-id's)

OpenClaw detecteert Plugins vanuit meerdere roots (gebundeld, globale installatie, workspace, expliciete via config geselecteerde paden). Als twee detecties dezelfde `id` delen, wordt alleen het manifest met de **hoogste voorrang** behouden; duplicaten met lagere voorrang worden verwijderd in plaats van ernaast te laden.

Voorrang, van hoog naar laag:

1. **Via config geselecteerd** — een pad dat expliciet is vastgepind in `plugins.entries.<id>`
2. **Gebundeld** — Plugins die met OpenClaw worden meegeleverd
3. **Globale installatie** — Plugins die in de globale OpenClaw-Plugin-root zijn geinstalleerd
4. **Workspace** — Plugins die relatief aan de huidige workspace worden gedetecteerd

Gevolgen:

- Een geforkte of verouderde kopie van een gebundelde Plugin in de workspace overschaduwt de gebundelde build niet.
- Om een gebundelde Plugin daadwerkelijk met een lokale te overschrijven, pin je die via `plugins.entries.<id>` zodat die door voorrang wint in plaats van te vertrouwen op workspace-detectie.
- Verwijderde duplicaten worden gelogd zodat Doctor en opstartdiagnostiek naar de weggegooide kopie kunnen wijzen.

## JSON Schema-vereisten

- **Elke Plugin moet een JSON Schema meeleveren**, zelfs als die geen config accepteert.
- Een leeg schema is acceptabel (bijvoorbeeld `{ "type": "object", "additionalProperties": false }`).
- Schema's worden gevalideerd tijdens het lezen/schrijven van config, niet tijdens runtime.

## Validatiegedrag

- Onbekende `channels.*`-sleutels zijn **fouten**, tenzij de kanaal-id is gedeclareerd door
  een pluginmanifest.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` en `plugins.slots.*`
  moeten verwijzen naar **vindbare** plugin-id's. Onbekende id's zijn **fouten**.
- Als een plugin is geïnstalleerd maar een beschadigd of ontbrekend manifest of schema heeft,
  mislukt de validatie en meldt Doctor de pluginfout.
- Als pluginconfiguratie bestaat maar de plugin **uitgeschakeld** is, blijft de configuratie behouden en
  wordt er een **waarschuwing** getoond in Doctor + logboeken.

Zie [Configuratiereferentie](/nl/gateway/configuration) voor het volledige `plugins.*`-schema.

## Opmerkingen

- Het manifest is **verplicht voor native OpenClaw-plugins**, inclusief laden vanaf het lokale bestandssysteem. Runtime laadt de pluginmodule nog steeds afzonderlijk; het manifest is alleen bedoeld voor ontdekking + validatie.
- Native manifesten worden geparseerd met JSON5, dus opmerkingen, afsluitende komma's en sleutels zonder aanhalingstekens worden geaccepteerd zolang de uiteindelijke waarde nog steeds een object is.
- Alleen gedocumenteerde manifestvelden worden gelezen door de manifestlader. Vermijd aangepaste sleutels op het hoogste niveau.
- `channels`, `providers`, `cliBackends` en `skills` kunnen allemaal worden weggelaten wanneer een plugin ze niet nodig heeft.
- `providerDiscoveryEntry` moet lichtgewicht blijven en mag geen brede runtimecode importeren; gebruik het voor statische providercatalogusmetadata of smalle ontdekkingsdescriptors, niet voor uitvoering tijdens aanvragen.
- Exclusieve plugintypen worden geselecteerd via `plugins.slots.*`: `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (standaard `legacy`).
- Declareer het exclusieve plugintype in dit manifest. Runtime-entry `OpenClawPluginDefinition.kind` is verouderd en blijft alleen bestaan als compatibiliteitsfallback voor oudere plugins.
- Env-var-metadata (`setup.providers[].envVars`, verouderde `providerAuthEnvVars` en `channelEnvVars`) is alleen declaratief. Status, audit, Cron-afleveringsvalidatie en andere alleen-lezen oppervlakken passen nog steeds pluginvertrouwen en effectief activeringsbeleid toe voordat een env var als geconfigureerd wordt behandeld.
- Voor runtimewizardmetadata waarvoor providercode nodig is, zie [Providerruntime-hooks](/nl/plugins/architecture-internals#provider-runtime-hooks).
- Als je plugin afhankelijk is van native modules, documenteer dan de buildstappen en eventuele allowlist-vereisten voor package managers (bijvoorbeeld pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Gerelateerd

<CardGroup cols={3}>
  <Card title="Plugins bouwen" href="/nl/plugins/building-plugins" icon="rocket">
    Aan de slag met plugins.
  </Card>
  <Card title="Pluginarchitectuur" href="/nl/plugins/architecture" icon="diagram-project">
    Interne architectuur en capaciteitsmodel.
  </Card>
  <Card title="SDK-overzicht" href="/nl/plugins/sdk-overview" icon="book">
    Plugin-SDK-referentie en subpadimports.
  </Card>
</CardGroup>
