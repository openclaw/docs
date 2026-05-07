---
read_when:
    - Je hebt de exacte typesignatuur van definePluginEntry of defineChannelPluginEntry nodig
    - Je wilt de registratiemodus begrijpen (volledig vs. setup vs. CLI-metadata)
    - U zoekt opties voor toegangspunten op
sidebarTitle: Entry Points
summary: Referentie voor definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-ingangspunten
x-i18n:
    generated_at: "2026-05-07T13:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke plugin exporteert een standaard entry-object. De SDK biedt drie helpers om
deze te maken.

Voor geinstalleerde plugins moet `package.json` runtime-laden naar gebouwde
JavaScript laten verwijzen wanneer dat beschikbaar is:

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

`extensions` en `setupEntry` blijven geldige bron-entries voor workspace- en git
checkout-ontwikkeling. `runtimeExtensions` en `runtimeSetupEntry` hebben de voorkeur
wanneer OpenClaw een geinstalleerd pakket laadt en zorgen ervoor dat npm-pakketten
runtime TypeScript-compilatie kunnen vermijden. Expliciete runtime-entries zijn vereist: `runtimeSetupEntry`
vereist `setupEntry`, en ontbrekende `runtimeExtensions`- of `runtimeSetupEntry`-
artefacten laten installatie/discovery falen in plaats van stilzwijgend terug te vallen op de bron. Als
een geinstalleerd pakket alleen een TypeScript-bronentry declareert, gebruikt OpenClaw een
overeenkomende gebouwde `dist/*.js`-peer wanneer die bestaat, en valt daarna terug op de TypeScript-
bron.

Alle entry-paden moeten binnen de pluginpakketdirectory blijven. Runtime-entries
en afgeleide gebouwde JavaScript-peers maken een ontsnappend `extensions`- of
`setupEntry`-bronpad niet geldig.

<Tip>
  **Op zoek naar een rondleiding?** Zie [Channel Plugins](/nl/plugins/sdk-channel-plugins)
  of [Provider Plugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze handleidingen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor providerplugins, toolplugins, hookplugins en alles wat **geen**
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

| Veld           | Type                                                             | Vereist | Standaard           |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------- |
| `id`           | `string`                                                         | Ja      | -                   |
| `name`         | `string`                                                         | Ja      | -                   |
| `description`  | `string`                                                         | Ja      | -                   |
| `kind`         | `string`                                                         | Nee     | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja      | -                   |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- `kind` is voor exclusieve slots: `"memory"` of `"context-engine"`.
- `configSchema` kan een functie zijn voor luie evaluatie.
- OpenClaw lost dat schema op en memoiseert het bij de eerste toegang, zodat dure schema-
  builders maar een keer worden uitgevoerd.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Omhult `definePluginEntry` met kanaalspecifieke bedrading. Roept automatisch
`api.registerChannel({ plugin })` aan, exposeert een optionele root-help CLI-metadata
seam, en gated `registerFull` op registratiemodus.

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
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee     | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee     | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee     | -                   |

- `setRuntime` wordt aangeroepen tijdens registratie zodat je de runtimeverwijzing kunt opslaan
  (meestal via `createPluginRuntimeStore`). Dit wordt overgeslagen tijdens het vastleggen van CLI-metadata.
- `registerCliMetadata` wordt uitgevoerd tijdens `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` en
  `api.registrationMode === "full"`.
  Gebruik dit als de canonieke plek voor kanaaleigen CLI-descriptors, zodat root-help
  niet-activerend blijft, discovery-snapshots statische commandmetadata bevatten en
  normale CLI-commandregistratie compatibel blijft met volledige pluginladingen.
- Discovery-registratie is niet-activerend, niet importvrij. OpenClaw kan
  de vertrouwde plugin-entry en kanaalpluginmodule evalueren om de
  snapshot te bouwen, dus houd imports op topniveau vrij van side-effects en plaats sockets,
  clients, workers en services achter paden die alleen voor `"full"` zijn.
- `registerFull` wordt alleen uitgevoerd wanneer `api.registrationMode === "full"`. Dit wordt overgeslagen
  tijdens setup-only laden.
- Net als `definePluginEntry` kan `configSchema` een luie factory zijn en memoiseert OpenClaw
  het opgeloste schema bij de eerste toegang.
- Voor plugineigen root-CLI-commands geef je de voorkeur aan `api.registerCli(..., { descriptors: [...] })`
  wanneer je wilt dat het command lazy-loaded blijft zonder uit de
  root-CLI-parse tree te verdwijnen. Voor featurecommands met gekoppelde nodes geef je de voorkeur aan
  `api.registerNodeCliFeature(...)` zodat het command onder `openclaw nodes` terechtkomt.
  Voor andere geneste plugincommands voeg je `parentPath` toe en registreer je commands op
  het `program`-object dat aan de registrar wordt doorgegeven; OpenClaw lost dit op naar het
  parent-command voordat de plugin wordt aangeroepen. Voor kanaalplugins geef je de voorkeur aan
  het registreren van die descriptors vanuit `registerCliMetadata(...)` en houd je
  `registerFull(...)` gericht op werk dat alleen runtime is.
- Als `registerFull(...)` ook Gateway-RPC-methoden registreert, houd die dan op een
  pluginspecifiek prefix. Gereserveerde core-admin-namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd afgedwongen naar
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Voor het lichte `setup-entry.ts`-bestand. Retourneert alleen `{ plugin }` zonder
runtime- of CLI-bedrading.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw laadt dit in plaats van de volledige entry wanneer een kanaal is uitgeschakeld,
niet geconfigureerd is, of wanneer uitgesteld laden is ingeschakeld. Zie
[Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit relevant is.

Koppel in de praktijk `defineSetupPluginEntry(...)` aan de smalle setuphelper-
families:

- `openclaw/plugin-sdk/setup-runtime` voor runtime-veilige setuphelpers zoals
  importveilige setup-patchadapters, lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en gedelegeerde setup-proxy's
- `openclaw/plugin-sdk/channel-setup` voor optional-install setupoppervlakken
- `openclaw/plugin-sdk/setup-tools` voor setup/install CLI/archive/docs-helpers

Houd zware SDK's, CLI-registratie en langlevende runtimeservices in de volledige
entry.

Gebundelde workspace-kanalen die setup- en runtimeoppervlakken splitsen, kunnen in plaats daarvan
`defineBundledChannelSetupEntry(...)` uit
`openclaw/plugin-sdk/channel-entry-contract` gebruiken. Dat contract laat de
setup-entry setup-veilige plugin/secrets-exports behouden terwijl er nog steeds een
runtime-setter wordt geexposeerd:

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

Gebruik dat gebundelde contract alleen wanneer setupflows echt een lichte runtime-
setter nodig hebben voordat de volledige kanaalentry laadt.

## Registratiemodus

`api.registrationMode` vertelt je plugin hoe deze is geladen:

| Modus             | Wanneer                          | Wat te registreren                                                                                                      |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normale Gateway-startup          | Alles                                                                                                                   |
| `"discovery"`     | Alleen-lezen capability discovery | Kanaalregistratie plus statische CLI-descriptors; entrycode kan laden, maar sla sockets, workers, clients en services over |
| `"setup-only"`    | Uitgeschakeld/niet-geconfigureerd kanaal | Alleen kanaalregistratie                                                                                         |
| `"setup-runtime"` | Setupflow met beschikbare runtime | Kanaalregistratie plus alleen de lichte runtime die nodig is voordat de volledige entry laadt                            |
| `"cli-metadata"`  | Root-help / CLI-metadata vastleggen | Alleen CLI-descriptors                                                                                                |

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

Discovery-modus bouwt een niet-activerende registrysnapshot. Deze kan nog steeds
de plugin-entry en het kanaalpluginobject evalueren zodat OpenClaw kanaal-
capabilities en statische CLI-descriptors kan registreren. Behandel module-evaluatie in discovery als
vertrouwd maar lichtgewicht: geen netwerkclients, subprocessen, listeners, database-
verbindingen, background workers, credential-reads of andere live runtime-side-
effects op topniveau.

Behandel `"setup-runtime"` als het venster waarin setup-only startup-oppervlakken moeten
bestaan zonder opnieuw de volledige gebundelde kanaalruntime binnen te gaan. Goede toepassingen zijn
kanaalregistratie, setup-veilige HTTP-routes, setup-veilige Gateway-methoden en
gedelegeerde setuphelpers. Zware achtergrondservices, CLI-registrars en
provider/client-SDK-bootstraps horen nog steeds thuis in `"full"`.

Specifiek voor CLI-registrars:

- gebruik `descriptors` wanneer de registrar eigenaar is van een of meer rootopdrachten en je
  wilt dat OpenClaw de echte CLI-module lazy-loadt bij de eerste aanroep
- zorg ervoor dat die descriptors elke root van een top-level opdracht dekken die door de
  registrar wordt blootgesteld
- beperk descriptornamen voor opdrachten tot letters, cijfers, koppeltekens en underscores,
  beginnend met een letter of cijfer; OpenClaw weigert descriptornamen buiten
  die vorm en verwijdert terminalbesturingsreeksen uit beschrijvingen voordat
  hulp wordt weergegeven
- gebruik `commands` alleen voor eager compatibiliteitspaden

## Plugin-vormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                  | Beschrijving                                       |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Eén capabilitytype (bijv. alleen provider)         |
| **hybrid-capability** | Meerdere capabilitytypen (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen capabilities                    |
| **non-capability**    | Tools/opdrachten/services, maar geen capabilities  |

Gebruik `openclaw plugins inspect <id>` om de vorm van een plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) - registratie-API en subpadreferentie
- [Runtime-helpers](/nl/plugins/sdk-runtime) - `api.runtime` en `createPluginRuntimeStore`
- [Installatie en configuratie](/nl/plugins/sdk-setup) - manifest, setup-entry, uitgesteld laden
- [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins) - het `ChannelPlugin`-object bouwen
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) - providerregistratie en hooks
