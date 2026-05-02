---
read_when:
    - Je hebt de exacte typesignatuur van definePluginEntry of defineChannelPluginEntry nodig
    - Je wilt de registratiemodus begrijpen (volledig versus installatie versus CLI-metagegevens)
    - U zoekt opties voor ingangspunten op
sidebarTitle: Entry Points
summary: Referentie voor definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-toegangspunten
x-i18n:
    generated_at: "2026-05-02T11:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke plugin exporteert een standaard entry-object. De SDK biedt drie helpers om
ze te maken.

Voor geïnstalleerde plugins moet `package.json` runtime-laden naar gebouwde
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

`extensions` en `setupEntry` blijven geldige bron-entries voor ontwikkeling in een workspace en git
checkout. `runtimeExtensions` en `runtimeSetupEntry` hebben de voorkeur
wanneer OpenClaw een geïnstalleerd package laadt en laten npm-packages runtime
TypeScript-compilatie vermijden. Expliciete runtime-entries zijn vereist: `runtimeSetupEntry`
vereist `setupEntry`, en ontbrekende `runtimeExtensions`- of `runtimeSetupEntry`-
artefacten laten installatie/discovery mislukken in plaats van stil terug te vallen op de bron. Als
een geïnstalleerd package alleen een TypeScript-bronentry declareert, gebruikt OpenClaw een
bijbehorende gebouwde `dist/*.js`-peer wanneer die bestaat, en valt daarna terug op de TypeScript-
bron.

Alle entry-paden moeten binnen de plugin-package-directory blijven. Runtime-entries
en afgeleide gebouwde JavaScript-peers maken een ontsnappend `extensions`- of
`setupEntry`-bronpad niet geldig.

<Tip>
  **Op zoek naar een walkthrough?** Zie [Channel Plugins](/nl/plugins/sdk-channel-plugins)
  of [Provider Plugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze handleidingen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor provider-plugins, tool-plugins, hook-plugins en alles wat **geen**
messaging-kanaal is.

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
| `id`           | `string`                                                         | Ja      | —                  |
| `name`         | `string`                                                         | Ja      | —                  |
| `description`  | `string`                                                         | Ja      | —                  |
| `kind`         | `string`                                                         | Nee     | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja      | —                  |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- `kind` is voor exclusieve slots: `"memory"` of `"context-engine"`.
- `configSchema` kan een functie zijn voor luie evaluatie.
- OpenClaw lost dat schema op en memoizeert het bij de eerste toegang, zodat dure schema-
  builders maar één keer worden uitgevoerd.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Wikkelt `definePluginEntry` in met kanaalspecifieke wiring. Roept automatisch
`api.registerChannel({ plugin })` aan, stelt een optionele root-help CLI-metadata-
seam beschikbaar en gated `registerFull` op registratiemodus.

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
| `id`                  | `string`                                                         | Ja      | —                  |
| `name`                | `string`                                                         | Ja      | —                  |
| `description`         | `string`                                                         | Ja      | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Ja      | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee     | Leeg objectschema  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee     | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee     | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee     | —                  |

- `setRuntime` wordt aangeroepen tijdens registratie zodat je de runtime-referentie kunt opslaan
  (meestal via `createPluginRuntimeStore`). Het wordt overgeslagen tijdens CLI-metadata-
  capture.
- `registerCliMetadata` wordt uitgevoerd tijdens `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` en
  `api.registrationMode === "full"`.
  Gebruik dit als de canonieke plek voor kanaal-eigen CLI-descriptors, zodat root-help
  niet-activerend blijft, discovery-snapshots statische command-metadata bevatten en
  normale CLI-commandregistratie compatibel blijft met volledige plugin-loads.
- Discovery-registratie is niet-activerend, niet importvrij. OpenClaw kan
  de vertrouwde plugin-entry en kanaalpluginmodule evalueren om de
  snapshot te bouwen, dus houd top-level imports vrij van side effects en plaats sockets,
  clients, workers en services achter paden die alleen voor `"full"` zijn.
- `registerFull` wordt alleen uitgevoerd wanneer `api.registrationMode === "full"`. Het wordt overgeslagen
  tijdens setup-only laden.
- Net als bij `definePluginEntry` kan `configSchema` een luie factory zijn en memoizeert OpenClaw
  het opgeloste schema bij de eerste toegang.
- Voor plugin-eigen root-CLI-commands geef je de voorkeur aan `api.registerCli(..., { descriptors: [...] })`
  wanneer je wilt dat de command lazy-loaded blijft zonder uit de
  root-CLI-parsetree te verdwijnen. Voor kanaalplugins geef je er de voorkeur aan die descriptors
  vanuit `registerCliMetadata(...)` te registreren en `registerFull(...)` gericht te houden op alleen runtime-werk.
- Als `registerFull(...)` ook gateway-RPC-methoden registreert, houd ze dan op een
  plugin-specifieke prefix. Gereserveerde core-admin-namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd afgedwongen naar
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
[Setup en Config](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit relevant is.

In de praktijk combineer je `defineSetupPluginEntry(...)` met de smalle setup-helper-
families:

- `openclaw/plugin-sdk/setup-runtime` voor runtime-veilige setup-helpers zoals
  importveilige setup-patchadapters, lookup-note-output,
  `promptResolvedAllowFrom`, `splitSetupEntries` en gedelegeerde setup-proxy's
- `openclaw/plugin-sdk/channel-setup` voor optional-install setup-surfaces
- `openclaw/plugin-sdk/setup-tools` voor setup/install CLI/archive/docs-helpers

Houd zware SDK's, CLI-registratie en langlevende runtime-services in de volledige
entry.

Gebundelde workspace-kanalen die setup- en runtime-surfaces splitsen, kunnen in plaats daarvan
`defineBundledChannelSetupEntry(...)` gebruiken vanuit
`openclaw/plugin-sdk/channel-entry-contract`. Dat contract laat de
setup-entry setup-veilige plugin-/secrets-exports behouden terwijl het nog steeds een
runtime-setter aanbiedt:

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

`api.registrationMode` vertelt je plugin hoe die is geladen:

| Modus             | Wanneer                            | Wat te registreren                                                                                                     |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normale gateway-startup            | Alles                                                                                                                  |
| `"discovery"`     | Alleen-lezen capability-discovery  | Kanaalregistratie plus statische CLI-descriptors; entry-code kan laden, maar sla sockets, workers, clients en services over |
| `"setup-only"`    | Uitgeschakeld/niet-geconfigureerd kanaal | Alleen kanaalregistratie                                                                                          |
| `"setup-runtime"` | Setup-flow met runtime beschikbaar | Kanaalregistratie plus alleen de lichte runtime die nodig is voordat de volledige entry laadt                          |
| `"cli-metadata"`  | Root-help / CLI-metadata-capture   | Alleen CLI-descriptors                                                                                                 |

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

Discovery-modus bouwt een niet-activerende registry-snapshot. Die kan nog steeds
de plugin-entry en het kanaalpluginobject evalueren zodat OpenClaw kanaal-
capabilities en statische CLI-descriptors kan registreren. Behandel module-evaluatie in discovery als
vertrouwd maar lichtgewicht: geen netwerkclients, subprocessen, listeners, database-
verbindingen, achtergrondworkers, credential-reads of andere live runtime-side
effects op top-level.

Behandel `"setup-runtime"` als het venster waarin setup-only startup-surfaces moeten
bestaan zonder opnieuw de volledige gebundelde kanaalruntime binnen te gaan. Goede opties zijn
kanaalregistratie, setup-veilige HTTP-routes, setup-veilige gateway-methoden en
gedelegeerde setup-helpers. Zware achtergrondservices, CLI-registrars en
provider-/client-SDK-bootstraps horen nog steeds thuis in `"full"`.

Specifiek voor CLI-registrars:

- gebruik `descriptors` wanneer de registrar een of meer root-commands beheert en je
  wilt dat OpenClaw de echte CLI-module lazy-loadt bij de eerste aanroep
- zorg ervoor dat die descriptors elke command-root op topniveau dekken die door de
  registrar wordt aangeboden
- beperk descriptor-commandnamen tot letters, cijfers, koppeltekens en underscores,
  beginnend met een letter of cijfer; OpenClaw weigert descriptor-namen buiten
  die vorm en verwijdert terminal-controlsequenties uit beschrijvingen voordat
  help wordt weergegeven
- gebruik alleen `commands` alleen voor eager compatibility-paden

## Plugin-vormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                  | Beschrijving                                       |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Eén mogelijkheidstype (bijv. alleen provider)      |
| **hybrid-capability** | Meerdere mogelijkheidstypen (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen mogelijkheden                   |
| **non-capability**    | Tools/commando's/services maar geen mogelijkheden  |

Gebruik `openclaw plugins inspect <id>` om de vorm van een plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) — registratie-API en subpadreferentie
- [Runtime-helpers](/nl/plugins/sdk-runtime) — `api.runtime` en `createPluginRuntimeStore`
- [Installatie en configuratie](/nl/plugins/sdk-setup) — manifest, setup-invoer, uitgesteld laden
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) — het `ChannelPlugin`-object bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) — providerregistratie en hooks
