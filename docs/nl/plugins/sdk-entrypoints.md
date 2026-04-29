---
read_when:
    - Je hebt de exacte typesignatuur van definePluginEntry of defineChannelPluginEntry nodig
    - U wilt de registratiemodus begrijpen (volledig versus installatie versus CLI-metadata)
    - Je zoekt opties voor toegangspunten op
sidebarTitle: Entry Points
summary: Referentie voor definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-ingangspunten
x-i18n:
    generated_at: "2026-04-29T23:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke Plugin exporteert een standaard-entryobject. De SDK biedt drie helpers voor
het maken ervan.

Voor geinstalleerde plugins moet `package.json` runtime-laden waar mogelijk naar
gebouwde JavaScript laten wijzen:

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

`extensions` en `setupEntry` blijven geldige bronentries voor workspace- en git
checkout-ontwikkeling. `runtimeExtensions` en `runtimeSetupEntry` hebben de
voorkeur wanneer OpenClaw een geinstalleerd pakket laadt en laten npm-pakketten
runtime-TypeScript-compilatie vermijden. Als een geinstalleerd pakket alleen een
TypeScript-bronentry declareert, gebruikt OpenClaw een overeenkomende gebouwde
`dist/*.js`-peer wanneer die bestaat, en valt daarna terug op de TypeScript-bron.

Alle entrypaden moeten binnen de Plugin-pakketdirectory blijven. Runtime-entries
en afgeleide gebouwde JavaScript-peers maken een ontsnappend `extensions`- of
`setupEntry`-bronpad niet geldig.

<Tip>
  **Zoek je een walkthrough?** Zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins)
  of [Providerplugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze gidsen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor providerplugins, toolplugins, hookplugins en alles wat **geen**
berichtenkanaal is.

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
| `id`           | `string`                                                         | Ja      | —                   |
| `name`         | `string`                                                         | Ja      | —                   |
| `description`  | `string`                                                         | Ja      | —                   |
| `kind`         | `string`                                                         | Nee     | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja      | —                   |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- `kind` is voor exclusieve slots: `"memory"` of `"context-engine"`.
- `configSchema` kan een functie zijn voor luie evaluatie.
- OpenClaw lost dat schema op en memoizet het bij de eerste toegang, zodat dure schemabouwers
  maar een keer worden uitgevoerd.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Wikkelt `definePluginEntry` met kanaalspecifieke bedrading. Roept automatisch
`api.registerChannel({ plugin })` aan, stelt een optionele root-help CLI-metadata-
seam beschikbaar en gate `registerFull` op registratiemodus.

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
| `id`                  | `string`                                                         | Ja      | —                   |
| `name`                | `string`                                                         | Ja      | —                   |
| `description`         | `string`                                                         | Ja      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee     | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee     | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee     | —                   |

- `setRuntime` wordt tijdens registratie aangeroepen zodat je de runtimereferentie kunt opslaan
  (meestal via `createPluginRuntimeStore`). Dit wordt overgeslagen tijdens het vastleggen van CLI-metadata.
- `registerCliMetadata` wordt uitgevoerd tijdens `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` en
  `api.registrationMode === "full"`.
  Gebruik dit als de canonieke plek voor CLI-descriptoren die eigendom zijn van het kanaal, zodat root help
  niet-activerend blijft, discoverysnapshots statische commandometadata bevatten en
  normale CLI-commandoregistratie compatibel blijft met volledige Plugin-loads.
- Discovery-registratie is niet-activerend, niet importvrij. OpenClaw kan
  de vertrouwde Plugin-entry en kanaalpluginmodule evalueren om de
  snapshot te bouwen, dus houd imports op topniveau vrij van neveneffecten en plaats sockets,
  clients, workers en services achter paden die alleen voor `"full"` zijn.
- `registerFull` wordt alleen uitgevoerd wanneer `api.registrationMode === "full"`. Dit wordt overgeslagen
  tijdens setup-only laden.
- Net als bij `definePluginEntry` kan `configSchema` een luie factory zijn en memoizet OpenClaw
  het opgeloste schema bij de eerste toegang.
- Voor root-CLI-commando's die eigendom zijn van een Plugin, geef de voorkeur aan `api.registerCli(..., { descriptors: [...] })`
  wanneer je wilt dat het commando lui geladen blijft zonder uit de
  root-CLI-parseboom te verdwijnen. Voor kanaalplugins verdient het de voorkeur die descriptoren
  te registreren vanuit `registerCliMetadata(...)` en `registerFull(...)` gericht te houden op werk dat alleen runtime betreft.
- Als `registerFull(...)` ook Gateway-RPC-methoden registreert, houd ze dan op een
  Plugin-specifiek prefix. Gereserveerde core-adminnamespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd naar
  `operator.admin` gedwongen.

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
[Setup en configuratie](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit relevant is.

In de praktijk combineer je `defineSetupPluginEntry(...)` met de smalle setup-helper-
families:

- `openclaw/plugin-sdk/setup-runtime` voor runtime-veilige setuphelpers zoals
  importveilige setup-patchadapters, lookup-note-uitvoer,
  `promptResolvedAllowFrom`, `splitSetupEntries` en gedelegeerde setupproxy's
- `openclaw/plugin-sdk/channel-setup` voor optionele-installatie-setupsurfaces
- `openclaw/plugin-sdk/setup-tools` voor setup-/installatie-CLI-/archief-/docshelpers

Houd zware SDK's, CLI-registratie en langlevende runtimeservices in de volledige
entry.

Gebundelde workspace-kanalen die setup- en runtimesurfaces splitsen, kunnen in plaats daarvan
`defineBundledChannelSetupEntry(...)` gebruiken uit
`openclaw/plugin-sdk/channel-entry-contract`. Dat contract laat de
setupentry setupveilige Plugin-/secrets-exports behouden terwijl nog steeds een
runtimesetter wordt blootgesteld:

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

Gebruik dat gebundelde contract alleen wanneer setupflows echt een lichte runtimesetter
nodig hebben voordat de volledige kanaalentry laadt.

## Registratiemodus

`api.registrationMode` vertelt je Plugin hoe deze is geladen:

| Modus             | Wanneer                          | Wat te registreren                                                                                                          |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normale Gateway-start            | Alles                                                                                                                       |
| `"discovery"`     | Read-only capabilities ontdekken | Kanaalregistratie plus statische CLI-descriptoren; entrycode kan laden, maar sla sockets, workers, clients en services over |
| `"setup-only"`    | Uitgeschakeld/niet-geconfigureerd kanaal | Alleen kanaalregistratie                                                                                             |
| `"setup-runtime"` | Setupflow met runtime beschikbaar | Kanaalregistratie plus alleen de lichte runtime die nodig is voordat de volledige entry laadt                              |
| `"cli-metadata"`  | Root help / CLI-metadata vastleggen | Alleen CLI-descriptoren                                                                                                  |

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

Discovery-modus bouwt een niet-activerende registrysnapshot. Deze kan nog steeds
de Plugin-entry en het kanaalpluginobject evalueren zodat OpenClaw kanaal-
capabilities en statische CLI-descriptoren kan registreren. Behandel module-evaluatie in discovery als
vertrouwd maar licht: geen netwerkclients, subprocessen, listeners, database-
verbindingen, achtergrondworkers, credential-reads of andere live runtime-
neveneffecten op topniveau.

Behandel `"setup-runtime"` als het venster waarin setup-only startup-surfaces moeten
bestaan zonder de volledige gebundelde kanaalruntime opnieuw binnen te gaan. Goede matches zijn
kanaalregistratie, setupveilige HTTP-routes, setupveilige Gateway-methoden en
gedelegeerde setuphelpers. Zware achtergrondservices, CLI-registrars en
provider-/client-SDK-bootstraps horen nog steeds in `"full"`.

Specifiek voor CLI-registrars:

- gebruik `descriptors` wanneer de registrar een of meer rootcommando's bezit en je
  wilt dat OpenClaw de echte CLI-module lui laadt bij de eerste aanroep
- zorg dat die descriptoren elke top-level commandoroot dekken die door de
  registrar wordt blootgesteld
- houd descriptornamen voor commando's beperkt tot letters, cijfers, koppeltekens en underscores,
  beginnend met een letter of cijfer; OpenClaw weigert descriptornamen buiten
  die vorm en stript terminalbesturingsreeksen uit beschrijvingen voordat
  help wordt weergegeven
- gebruik alleen `commands` uitsluitend voor eager compatibiliteitspaden

## Plugin-vormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                  | Beschrijving                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Eén capaciteitstype (bijv. alleen provider)       |
| **hybrid-capability** | Meerdere capaciteitstypen (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen capaciteiten                   |
| **non-capability**    | Tools/opdrachten/services maar geen capaciteiten  |

Gebruik `openclaw plugins inspect <id>` om de vorm van een Plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) — registratie-API en subpadreferentie
- [Runtime Helpers](/nl/plugins/sdk-runtime) — `api.runtime` en `createPluginRuntimeStore`
- [Installatie en configuratie](/nl/plugins/sdk-setup) — manifest, installatie-entry, uitgesteld laden
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) — het `ChannelPlugin`-object bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) — providerregistratie en hooks
