---
read_when:
    - Je hebt de exacte typesignatuur van definePluginEntry of defineChannelPluginEntry nodig
    - Je wilt de registratiemodus begrijpen (volledig vs configuratie vs CLI-metadata)
    - Je zoekt opties voor toegangspunten op
sidebarTitle: Entry Points
summary: Referentie voor definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-entrypoints
x-i18n:
    generated_at: "2026-05-06T09:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke Plugin exporteert een standaard entry-object. De SDK biedt drie helpers voor
het maken ervan.

Voor geinstalleerde Plugins moet `package.json` runtime-laden naar gebouwde
JavaScript laten verwijzen wanneer beschikbaar:

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

`extensions` en `setupEntry` blijven geldige source-entries voor workspace- en git
checkout-ontwikkeling. `runtimeExtensions` en `runtimeSetupEntry` hebben de voorkeur
wanneer OpenClaw een geinstalleerd pakket laadt en laten npm-pakketten runtime
TypeScript-compilatie vermijden. Expliciete runtime-entries zijn vereist: `runtimeSetupEntry`
vereist `setupEntry`, en ontbrekende `runtimeExtensions`- of `runtimeSetupEntry`-
artifacts laten installatie/discovery falen in plaats van stil terug te vallen op source. Als
een geinstalleerd pakket alleen een TypeScript source-entry declareert, gebruikt OpenClaw een
overeenkomende gebouwde `dist/*.js`-peer wanneer die bestaat, en valt daarna terug op de TypeScript
source.

Alle entry-paden moeten binnen de Plugin-pakketdirectory blijven. Runtime-entries
en afgeleide gebouwde JavaScript-peers maken een ontsnappend `extensions`- of
`setupEntry`-sourcepad niet geldig.

<Tip>
  **Op zoek naar een walkthrough?** Zie [Channel Plugins](/nl/plugins/sdk-channel-plugins)
  of [Provider Plugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze handleidingen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor provider-Plugins, tool-Plugins, hook-Plugins, en alles wat **geen**
messagingkanaal is.

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

| Veld           | Type                                                             | Vereist | Standaard          |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------ |
| `id`           | `string`                                                         | Ja      | -                  |
| `name`         | `string`                                                         | Ja      | -                  |
| `description`  | `string`                                                         | Ja      | -                  |
| `kind`         | `string`                                                         | Nee     | -                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja      | -                  |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- `kind` is voor exclusieve slots: `"memory"` of `"context-engine"`.
- `configSchema` kan een functie zijn voor luie evaluatie.
- OpenClaw lost dat schema op en memoizet het bij de eerste toegang, zodat dure schema-
  builders maar een keer worden uitgevoerd.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Omhult `definePluginEntry` met kanaalspecifieke wiring. Roept automatisch
`api.registerChannel({ plugin })` aan, stelt een optionele root-help CLI-metadata
seam beschikbaar, en gate `registerFull` op registratiemodus.

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

| Veld                  | Type                                                             | Vereist | Standaard          |
| --------------------- | ---------------------------------------------------------------- | ------- | ------------------ |
| `id`                  | `string`                                                         | Ja      | -                  |
| `name`                | `string`                                                         | Ja      | -                  |
| `description`         | `string`                                                         | Ja      | -                  |
| `plugin`              | `ChannelPlugin`                                                  | Ja      | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee     | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee     | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee     | -                  |

- `setRuntime` wordt aangeroepen tijdens registratie zodat je de runtime-referentie kunt opslaan
  (meestal via `createPluginRuntimeStore`). Het wordt overgeslagen tijdens het vastleggen van CLI-metadata.
- `registerCliMetadata` wordt uitgevoerd tijdens `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, en
  `api.registrationMode === "full"`.
  Gebruik het als de canonieke plek voor CLI-descriptors die eigendom zijn van het kanaal, zodat root-help
  niet-activerend blijft, discovery-snapshots statische command-metadata bevatten, en
  normale CLI-commandregistratie compatibel blijft met volledige Plugin-ladingen.
- Discovery-registratie is niet-activerend, niet importvrij. OpenClaw kan
  de vertrouwde Plugin-entry en kanaal-Plugin-module evalueren om de
  snapshot te bouwen, dus houd top-level imports vrij van side effects en plaats sockets,
  clients, workers en services achter paden die alleen voor `"full"` zijn.
- `registerFull` wordt alleen uitgevoerd wanneer `api.registrationMode === "full"`. Het wordt overgeslagen
  tijdens setup-only laden.
- Net als `definePluginEntry` kan `configSchema` een luie factory zijn en memoizet OpenClaw
  het opgeloste schema bij de eerste toegang.
- Voor root-CLI-commands die eigendom zijn van de Plugin, geef de voorkeur aan `api.registerCli(..., { descriptors: [...] })`
  wanneer je wilt dat het command lui geladen blijft zonder uit de
  root CLI-parse tree te verdwijnen. Voor kanaal-Plugins geef je de voorkeur aan het registreren van die descriptors
  vanuit `registerCliMetadata(...)` en houd je `registerFull(...)` gericht op werk dat alleen runtime is.
- Als `registerFull(...)` ook Gateway RPC-methoden registreert, houd ze dan op een
  Pluginspecifiek prefix. Gereserveerde core-admin-namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd gedwongen naar
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Voor het lichte `setup-entry.ts`-bestand. Retourneert alleen `{ plugin }` zonder
runtime- of CLI-wiring.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw laadt dit in plaats van de volledige entry wanneer een kanaal is uitgeschakeld,
niet is geconfigureerd, of wanneer uitgesteld laden is ingeschakeld. Zie
[Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit van belang is.

In de praktijk combineer je `defineSetupPluginEntry(...)` met de smalle setup-helper-
families:

- `openclaw/plugin-sdk/setup-runtime` voor runtime-veilige setup-helpers zoals
  importveilige setup-patchadapters, lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries`, en gedelegeerde setup-proxies
- `openclaw/plugin-sdk/channel-setup` voor optional-install setup-surfaces
- `openclaw/plugin-sdk/setup-tools` voor setup/install CLI/archive/docs-helpers

Houd zware SDK's, CLI-registratie en langlevende runtime-services in de volledige
entry.

Gebundelde workspace-kanalen die setup- en runtime-surfaces splitsen, kunnen in plaats daarvan
`defineBundledChannelSetupEntry(...)` uit
`openclaw/plugin-sdk/channel-entry-contract` gebruiken. Dat contract laat de
setup-entry setup-veilige Plugin/secrets-exports behouden en tegelijk een
runtime-setter beschikbaar stellen:

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
});
```

Gebruik dat gebundelde contract alleen wanneer setup-flows echt een lichte runtime-
setter nodig hebben voordat de volledige kanaal-entry laadt.

## Registratiemodus

`api.registrationMode` vertelt je Plugin hoe die is geladen:

| Modus             | Wanneer                          | Wat te registreren                                                                                                      |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normale Gateway-startup          | Alles                                                                                                                   |
| `"discovery"`     | Alleen-lezen capability-discovery | Kanaalregistratie plus statische CLI-descriptors; entry-code kan laden, maar sla sockets, workers, clients en services over |
| `"setup-only"`    | Uitgeschakeld/niet-geconfigureerd kanaal | Alleen kanaalregistratie                                                                                         |
| `"setup-runtime"` | Setup-flow met beschikbare runtime | Kanaalregistratie plus alleen de lichte runtime die nodig is voordat de volledige entry laadt                           |
| `"cli-metadata"`  | Root-help / vastleggen van CLI-metadata | Alleen CLI-descriptors                                                                                             |

`defineChannelPluginEntry` handelt deze splitsing automatisch af. Als je
`definePluginEntry` rechtstreeks voor een kanaal gebruikt, controleer dan zelf de modus:

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

Discovery-modus bouwt een niet-activerende registry-snapshot. Het kan nog steeds
de Plugin-entry en het kanaal-Plugin-object evalueren zodat OpenClaw kanaal-
capabilities en statische CLI-descriptors kan registreren. Behandel module-evaluatie in discovery als
vertrouwd maar licht: geen network clients, subprocessen, listeners, database-
connections, background workers, credential reads, of andere live runtime side
effects op top-level.

Behandel `"setup-runtime"` als het venster waarin setup-only startup-surfaces moeten
bestaan zonder opnieuw de volledige gebundelde kanaal-runtime binnen te gaan. Goede keuzes zijn
kanaalregistratie, setup-veilige HTTP-routes, setup-veilige Gateway-methoden, en
gedelegeerde setup-helpers. Zware background services, CLI-registrars, en
provider/client SDK-bootstraps horen nog steeds thuis in `"full"`.

Specifiek voor CLI-registrars:

- gebruik `descriptors` wanneer de registrar een of meer root-commands bezit en je
  wilt dat OpenClaw de echte CLI-module lui laadt bij de eerste aanroep
- zorg ervoor dat die descriptors elk top-level command root dekken dat door de
  registrar wordt blootgesteld
- beperk descriptor-commandnamen tot letters, cijfers, koppelteken en underscore,
  beginnend met een letter of cijfer; OpenClaw weigert descriptor-namen buiten
  die vorm en verwijdert terminal control sequences uit beschrijvingen voordat
  help wordt gerenderd
- gebruik `commands` alleen voor eager compatibiliteitspaden

## Plugin-vormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                  | Beschrijving                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Eén capability-type (bijv. alleen provider)       |
| **hybrid-capability** | Meerdere capability-typen (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen capabilities                   |
| **non-capability**    | Tools/opdrachten/services maar geen capabilities  |

Gebruik `openclaw plugins inspect <id>` om de vorm van een plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) - registratie-API en subpath-referentie
- [Runtime Helpers](/nl/plugins/sdk-runtime) - `api.runtime` en `createPluginRuntimeStore`
- [Installatie en configuratie](/nl/plugins/sdk-setup) - manifest, setup-entry, uitgesteld laden
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) - het `ChannelPlugin`-object bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) - providerregistratie en hooks
