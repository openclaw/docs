---
read_when:
    - Je hebt de exacte typehandtekening nodig van defineToolPlugin, definePluginEntry of defineChannelPluginEntry
    - U wilt de registratiemodus begrijpen (volledig vs. setup vs. CLI-metadata)
    - Je zoekt opties voor het toegangspunt
sidebarTitle: Entry Points
summary: Referentie voor defineToolPlugin, definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-toegangspunten
x-i18n:
    generated_at: "2026-06-27T18:06:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke Plugin exporteert een standaard entry-object. De SDK biedt helpers om ze te maken.

Voor geinstalleerde Plugins moet `package.json` runtime-laden naar gebouwde JavaScript verwijzen wanneer beschikbaar:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` en `setupEntry` blijven geldige source entries voor workspace- en git-checkoutontwikkeling. `runtimeExtensions` en `runtimeSetupEntry` hebben de voorkeur wanneer OpenClaw een geinstalleerd pakket laadt en laten npm-pakketten runtime-TypeScriptcompilatie vermijden. Expliciete runtime entries zijn vereist: `runtimeSetupEntry` vereist `setupEntry`, en ontbrekende `runtimeExtensions`- of `runtimeSetupEntry`-artefacten laten installatie/discovery mislukken in plaats van stil terug te vallen op source. Als een geinstalleerd pakket alleen een TypeScript-source entry declareert, gebruikt OpenClaw een overeenkomende gebouwde `dist/*.js`-peer wanneer die bestaat, en valt daarna terug op de TypeScript-source.

Alle entrypaden moeten binnen de Plugin-pakketdirectory blijven. Runtime entries en afgeleide gebouwde JavaScript-peers maken een ontsnappend `extensions`- of `setupEntry`-sourcepad niet geldig.

<Tip>
  **Zoek je een walkthrough?** Zie [Tool-Plugins](/nl/plugins/tool-plugins),
  [Channel-Plugins](/nl/plugins/sdk-channel-plugins) of
  [Provider-Plugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze handleidingen.
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Voor eenvoudige Plugins die alleen agenttools toevoegen. `defineToolPlugin` houdt de authoring-source klein, leidt configuratie- en toolparametertypen af uit TypeBox-schema's, verpakt gewone retourwaarden in het OpenClaw tool-result-formaat en stelt statische metadata beschikbaar die `openclaw plugins build` in het Plugin-manifest schrijft.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` is optioneel. Wanneer weggelaten, gebruikt OpenClaw een strikt schema voor een leeg object en bevat het gegenereerde manifest nog steeds `configSchema`.
- `execute` retourneert een gewone tekenreeks of JSON-serialiseerbare waarde. De helper verpakt deze als een teksttoolresultaat met `details`.
- Toolnamen zijn statisch. `openclaw plugins build` leidt `contracts.tools` af uit de gedeclareerde tools, zodat auteurs namen niet handmatig dupliceren.
- Runtime-laden blijft strikt. Geinstalleerde Plugins hebben nog steeds `openclaw.plugin.json` en `package.json` `openclaw.extensions` nodig; OpenClaw voert geen Plugincode uit om ontbrekende manifestgegevens af te leiden.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor provider-Plugins, geavanceerde tool-Plugins, hook-Plugins en alles wat **geen** berichtenkanaal is.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Veld           | Type                                                             | Vereist | Standaard           |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Ja      | -                   |
| `name`         | `string`                                                         | Ja      | -                   |
| `description`  | `string`                                                         | Ja      | -                   |
| `kind`         | `string`                                                         | Nee     | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Schema voor leeg object |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja      | -                   |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- `kind` is voor exclusieve slots: `"memory"` of `"context-engine"`.
- `configSchema` kan een functie zijn voor lazy evaluation.
- OpenClaw lost dat schema op en memoizet het bij eerste toegang, zodat dure schemabuilders slechts eenmaal worden uitgevoerd.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Verpakt `definePluginEntry` met kanaalspecifieke wiring. Roept automatisch `api.registerChannel({ plugin })` aan, stelt een optionele root-help CLI-metadatanaad beschikbaar en gate `registerFull` op registratiemodus.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Veld                  | Type                                                             | Vereist | Standaard           |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`                  | `string`                                                         | Ja      | -                   |
| `name`                | `string`                                                         | Ja      | -                   |
| `description`         | `string`                                                         | Ja      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Schema voor leeg object |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee     | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee     | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee     | -                   |

- `setRuntime` wordt tijdens registratie aangeroepen zodat je de runtimereferentie kunt opslaan (meestal via `createPluginRuntimeStore`). Dit wordt overgeslagen tijdens het vastleggen van CLI-metadata.
- `registerCliMetadata` wordt uitgevoerd tijdens `api.registrationMode === "cli-metadata"`, `api.registrationMode === "discovery"` en `api.registrationMode === "full"`.
  Gebruik dit als de canonieke plek voor kanaaleigen CLI-descriptors, zodat root-help niet-activerend blijft, discovery-snapshots statische commandmetadata bevatten en normale CLI-commandregistratie compatibel blijft met volledige Plugin-loads.
- Discovery-registratie is niet-activerend, niet importvrij. OpenClaw kan de vertrouwde Plugin-entry en kanaal-Pluginmodule evalueren om de snapshot te bouwen, dus houd top-level imports vrij van side effects en zet sockets, clients, workers en services achter paden die alleen voor `"full"` zijn.
- `registerFull` wordt alleen uitgevoerd wanneer `api.registrationMode === "full"`. Het wordt overgeslagen tijdens alleen-setup laden.
- Net als `definePluginEntry` kan `configSchema` een lazy factory zijn en memoizet OpenClaw het opgeloste schema bij eerste toegang.
- Voor Plugin-eigen root-CLI-commands geef je de voorkeur aan `api.registerCli(..., { descriptors: [...] })` wanneer je wilt dat de command lazy-loaded blijft zonder uit de root-CLI-parse tree te verdwijnen. Voor paired-node feature commands geef je de voorkeur aan `api.registerNodeCliFeature(...)`, zodat de command onder `openclaw nodes` terechtkomt. Voor andere geneste Plugin-commands voeg je `parentPath` toe en registreer je commands op het `program`-object dat aan de registrar wordt doorgegeven; OpenClaw lost dit op naar de parent command voordat de Plugin wordt aangeroepen. Voor channel-Plugins geef je de voorkeur aan het registreren van die descriptors vanuit `registerCliMetadata(...)` en houd je `registerFull(...)` gericht op werk dat alleen runtime is.
- Als `registerFull(...)` ook Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifiek prefix. Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd naar `operator.admin` gecorceerd.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Voor het lightweight `setup-entry.ts`-bestand. Retourneert alleen `{ plugin }` zonder runtime- of CLI-wiring.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw laadt dit in plaats van de volledige entry wanneer een kanaal is uitgeschakeld, niet geconfigureerd is of wanneer uitgesteld laden is ingeschakeld. Zie [Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit relevant is.

In de praktijk combineer je `defineSetupPluginEntry(...)` met de smalle setup-helperfamilies:

- `openclaw/plugin-sdk/setup-runtime` voor runtime-veilige setuphelpers zoals `createSetupTranslator`, importveilige setup-patchadapters, lookup-note-output, `promptResolvedAllowFrom`, `splitSetupEntries` en gedelegeerde setup-proxy's
- `openclaw/plugin-sdk/channel-setup` voor optional-install setupsufaces
- `openclaw/plugin-sdk/setup-tools` voor setup-/installatie-CLI-/archief-/docshelpers

Houd zware SDK's, CLI-registratie en langlevende runtimeservices in de volledige entry.

Gebundelde workspace-kanalen die setup- en runtimesurfaces splitsen, kunnen in plaats daarvan `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken. Dat contract laat de setup-entry setup-veilige Plugin-/secrets-exports behouden terwijl nog steeds een runtimesetter wordt blootgesteld:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Gebruik dat gebundelde contract alleen wanneer setupflows echt een lightweight runtimesetter of setup-veilige Gateway-surface nodig hebben voordat de volledige channel-entry laadt. `registerSetupRuntime` wordt alleen uitgevoerd voor `"setup-runtime"`-loads; houd het beperkt tot config-only routes of methoden die moeten bestaan voordat uitgestelde volledige activatie plaatsvindt.

## Registratiemodus

`api.registrationMode` vertelt je Plugin hoe die is geladen:

| Modus             | Wanneer                          | Wat registreren                                                                                                        |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normale Gateway-start            | Alles                                                                                                                  |
| `"discovery"`     | Alleen-lezen capability-detectie | Kanaalregistratie plus statische CLI-descriptors; entrycode mag laden, maar sla sockets, workers, clients en services over |
| `"setup-only"`    | Uitgeschakeld/niet-geconfigureerd kanaal | Alleen kanaalregistratie                                                                                               |
| `"setup-runtime"` | Setupflow met beschikbare runtime | Kanaalregistratie plus alleen de lichte runtime die nodig is voordat de volledige entry laadt                           |
| `"cli-metadata"`  | Roothulp / vastleggen van CLI-metadata | Alleen CLI-descriptors                                                                                                 |

`defineChannelPluginEntry` handelt deze splitsing automatisch af. Als je
`definePluginEntry` direct voor een kanaal gebruikt, controleer dan zelf de modus:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Discovery-modus bouwt een niet-activerende registrysnapshot. Deze mag nog steeds
de Plugin-entry en het kanaalpluginobject evalueren, zodat OpenClaw kanaal-
capabilities en statische CLI-descriptors kan registreren. Behandel module-
evaluatie in discovery als vertrouwd maar lichtgewicht: geen netwerkclients,
subprocessen, listeners, databaseverbindingen, achtergrondworkers,
credential-reads of andere live runtime-side-effects op topniveau.

Behandel `"setup-runtime"` als het venster waarin setup-only startoppervlakken
moeten bestaan zonder de volledige gebundelde kanaalruntime opnieuw binnen te
gaan. Goede toepassingen zijn kanaalregistratie, setup-veilige HTTP-routes,
setup-veilige Gateway-methoden en gedelegeerde setuphelpers. Zware
achtergrondservices, CLI-registrars en provider/client-SDK-bootstraps horen nog
steeds thuis in `"full"`.

Specifiek voor CLI-registrars:

- gebruik `descriptors` wanneer de registrar een of meer rootcommands bezit en je
  wilt dat OpenClaw de echte CLI-module lazy-loadt bij de eerste aanroep
- zorg dat die descriptors elke commandroot op topniveau dekken die door de
  registrar wordt blootgesteld
- beperk descriptornamen voor commands tot letters, cijfers, koppeltekens en
  underscores, beginnend met een letter of cijfer; OpenClaw wijst
  descriptornamen buiten die vorm af en verwijdert terminalcontrolsequenties uit
  beschrijvingen voordat hulp wordt weergegeven
- gebruik alleen `commands` uitsluitend voor eager compatibiliteitspaden

## Plugin-vormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                  | Beschrijving                                       |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Eén capabilitytype (bijv. alleen provider)         |
| **hybrid-capability** | Meerdere capabilitytypen (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen capabilities                    |
| **non-capability**    | Tools/commands/services maar geen capabilities     |

Gebruik `openclaw plugins inspect <id>` om de vorm van een plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) - registratie-API en subpathreferentie
- [Runtimehelpers](/nl/plugins/sdk-runtime) - `api.runtime` en `createPluginRuntimeStore`
- [Setup en configuratie](/nl/plugins/sdk-setup) - manifest, setup-entry, uitgesteld laden
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - het `ChannelPlugin`-object bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerregistratie en hooks
