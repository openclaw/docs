---
read_when:
    - Je hebt de exacte typesignatuur van defineToolPlugin, definePluginEntry of defineChannelPluginEntry nodig
    - Je wilt de registratiemodus begrijpen (volledig versus installatie versus CLI-metadata)
    - Je zoekt opties voor het toegangspunt
sidebarTitle: Entry Points
summary: Naslag voor defineToolPlugin, definePluginEntry, defineChannelPluginEntry en defineSetupPluginEntry
title: Plugin-invoerpunten
x-i18n:
    generated_at: "2026-07-16T16:18:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Elke plugin exporteert een standaard entry-object. De SDK biedt een helper voor
elke entry-vorm: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Op zoek naar een stapsgewijze uitleg?** Zie [Toolplugins](/nl/plugins/tool-plugins),
  [Kanaalplugins](/nl/plugins/sdk-channel-plugins) of
  [Providerplugins](/nl/plugins/sdk-provider-plugins) voor stapsgewijze handleidingen.
</Tip>

## Package-entries

Geïnstalleerde plugins laten de `package.json` `openclaw`-velden naar zowel bron- als
gebouwde entries verwijzen:

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

- `extensions` en `setupEntry` zijn bronentries die worden gebruikt voor ontwikkeling
  in workspaces en git-checkouts.
- `runtimeExtensions` en `runtimeSetupEntry` hebben de voorkeur voor geïnstalleerde
  packages: hierdoor kunnen npm-packages TypeScript-compilatie tijdens runtime overslaan.
- `runtimeExtensions` moet, indien aanwezig, qua arraylengte overeenkomen met `extensions`
  (entries worden positioneel gekoppeld). `runtimeSetupEntry` vereist `setupEntry`.
- Als een `runtimeExtensions`-/`runtimeSetupEntry`-artefact is gedeclareerd maar
  ontbreekt, mislukt installatie/detectie met een packagefout; OpenClaw valt
  niet stilzwijgend terug op de bron. Terugvallen op de bron (hieronder) is alleen van toepassing als er
  helemaal geen runtime-entry is gedeclareerd.
- Als een geïnstalleerd package alleen een TypeScript-bronentry declareert, zoekt OpenClaw
  naar een bijbehorende gebouwde `dist/*.js`-peer (of `.mjs`/`.cjs`) en gebruikt die;
  anders valt het terug op de TypeScript-bron.
- Alle entrypaden moeten binnen de directory van het pluginpackage blijven. Runtime-
  entries en afgeleide gebouwde JS-peers maken een ontsnappend `extensions`- of
  `setupEntry`-bronpad niet geldig.

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Voor plugins die alleen agenttools toevoegen. Houdt de broncode compact, leidt configuratie-
en toolparametertypen af uit TypeBox-schema's, verpakt gewone retourwaarden in
de OpenClaw-toolresultaatindeling en stelt statische metadata beschikbaar die
`openclaw plugins build` naar het pluginmanifest schrijft (`contracts.tools`,
`configSchema`).

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

- `configSchema` is optioneel; bij weglating wordt een strikt leeg objectschema gebruikt
  (het gegenereerde manifest bevat nog steeds `configSchema`).
- `execute` retourneert een gewone tekenreeks of JSON-serialiseerbare waarde; de helper
  verpakt deze als een teksttoolresultaat waarbij `details` is ingesteld op de oorspronkelijke
  (niet naar een tekenreeks omgezette) retourwaarde.
- Voor aangepaste toolresultaten exporteert `openclaw/plugin-sdk/tool-results`
  `textResult` en `jsonResult`.
- Toolnamen zijn statisch, zodat `openclaw plugins build`
  `contracts.tools` afleidt uit de gedeclareerde tools zonder handmatig gedupliceerde namen.
- Het laden tijdens runtime blijft strikt: geïnstalleerde plugins hebben nog steeds
  `openclaw.plugin.json` en `package.json` `openclaw.extensions` nodig. OpenClaw
  voert nooit plugincode uit om ontbrekende manifestgegevens af te leiden.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Voor providerplugins, geavanceerde toolplugins, hookplugins en alles wat
**geen** berichtenkanaal is.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Veld                      | Type                                                             | Vereist  | Standaardwaarde      |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | Ja       | -                   |
| `name`                    | `string`                                                         | Ja       | -                   |
| `description`             | `string`                                                         | Ja       | -                   |
| `kind`                    | `string` (verouderd, zie hieronder)                              | Nee      | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee      | Leeg objectschema   |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Nee      | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Nee      | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Nee      | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ja       | -                   |

- `id` moet overeenkomen met je `openclaw.plugin.json`-manifest.
- Externe sessiecatalogi gebruiken
  `openclaw/plugin-sdk/session-catalog` en
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Core beheert de `sessions.catalog.*`-Gateway-methoden; providers retourneren host-,
  sessie- en genormaliseerde transcriptprojecties zonder RPC's te registreren.
- `kind` is verouderd: declareer in plaats daarvan een exclusief slot (`"memory"` of
  `"context-engine"`) in het `openclaw.plugin.json`-manifestveld `kind`.
  `kind` van de runtime-entry blijft alleen bestaan als compatibiliteitsfallback voor
  oudere plugins.
- `configSchema` kan een functie zijn voor luie evaluatie. OpenClaw lost het schema op en
  slaat het bij de eerste toegang in het geheugen op, zodat kostbare schemabouwers slechts
  eenmaal worden uitgevoerd.
- Een `nodeHostCommands`-descriptor kan `isAvailable({ config, env })` definiëren.
  Als `false` wordt geretourneerd, worden die opdracht en de bijbehorende capability weggelaten uit de Gateway-
  declaratie van de headless Node. OpenClaw evalueert dit aan de hand van de lokale
  opstartconfiguratie van de Node; opdrachthandlers moeten bij
  aanroep nog steeds de beschikbaarheid valideren.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Verpakt `definePluginEntry` met kanaalspecifieke bedrading: roept automatisch
`api.registerChannel({ plugin })` aan, biedt een optionele metadata-interface voor CLI-
hoofdhulp en beperkt `registerFull` op basis van de registratiemodus.

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

| Veld                  | Type                                                             | Vereist  | Standaardwaarde      |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Ja       | -                   |
| `name`                | `string`                                                         | Ja       | -                   |
| `description`         | `string`                                                         | Ja       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nee      | Leeg objectschema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nee      | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nee      | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nee      | -                   |

Callbacks worden per registratiemodus uitgevoerd (volledige tabel onder
[Registratiemodus](#registration-mode)):

- `setRuntime` wordt in elke modus uitgevoerd, behalve `"cli-metadata"` en
  `"tool-discovery"`. Sla hier de runtimeverwijzing op, doorgaans via
  `createPluginRuntimeStore`.
- `registerCliMetadata` wordt uitgevoerd voor `"cli-metadata"`, `"discovery"` en
  `"full"`. Gebruik dit als de canonieke plaats voor CLI-descriptors die eigendom zijn van het kanaal,
  zodat de hoofdhulp niet-activerend blijft, detectiesnapshots statische
  opdrachtmetadata bevatten en normale CLI-registratie compatibel blijft met volledige
  pluginladingen.
- `registerFull` wordt alleen uitgevoerd voor `"full"` en `"tool-discovery"`. Voor
  `"tool-discovery"` wordt dit _in plaats van_ kanaalregistratie uitgevoerd: OpenClaw
  slaat `registerChannel`/`setRuntime` volledig over en roept alleen
  `registerFull` aan. Provider-/toolregistratie die je kanaal nodig heeft voor
  zelfstandige tooldetectie of -uitvoering moet daarom daar staan en niet achter de normale
  kanaalconfiguratie.
- Detectieregistratie is niet-activerend, maar niet importvrij: OpenClaw mag
  de vertrouwde pluginentry en kanaalpluginmodule evalueren om de
  snapshot op te bouwen. Houd imports op het hoogste niveau vrij van neveneffecten en plaats sockets,
  clients, workers en services achter paden die uitsluitend voor `"full"` bestemd zijn.
- Net als `definePluginEntry` kan `configSchema` een luie factory zijn; OpenClaw
  slaat het opgeloste schema bij de eerste toegang in het geheugen op.

CLI-registratie:

- Gebruik `api.registerCli(..., { descriptors: [...] })` voor hoofdniveau-
  CLI-opdrachten van de plugin die je lui wilt laden zonder dat ze uit de parseerboom van de hoofd-CLI
  verdwijnen. Descriptornamen mogen alleen letters, cijfers, koppeltekens en
  underscores bevatten en moeten beginnen met een letter of cijfer; OpenClaw weigert andere
  vormen en verwijdert terminalbesturingsreeksen uit beschrijvingen voordat
  hulp wordt weergegeven. Dek elke opdrachthoofdstructuur op het hoogste niveau af die de registrar beschikbaar stelt.
  Alleen `commands` blijft het gretige compatibiliteitspad gebruiken.
- Gebruik `api.registerNodeCliFeature(...)` voor featureopdrachten van gekoppelde Nodes, zodat
  ze onder `openclaw nodes` terechtkomen (gelijkwaardig aan
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Voeg voor andere geneste pluginopdrachten `parentPath` toe en registreer opdrachten
  op het `program`-object dat aan de registrar wordt doorgegeven; OpenClaw zet dit om naar
  de bovenliggende opdracht voordat de plugin wordt aangeroepen.
- Registreer voor kanaalplugins CLI-descriptors vanuit `registerCliMetadata`
  en houd `registerFull` gericht op werk dat uitsluitend tijdens runtime plaatsvindt.
- Als `registerFull` ook Gateway-RPC-methoden registreert, plaats ze dan onder een
  pluginspecifiek voorvoegsel. Gereserveerde beheernaamruimten van Core (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) worden altijd omgezet naar
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Voor het lichtgewicht `setup-entry.ts`-bestand. Retourneert alleen `{ plugin }`, zonder
runtime- of CLI-bedrading.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw laadt dit in plaats van het volledige toegangspunt wanneer een kanaal is uitgeschakeld,
niet is geconfigureerd of wanneer uitgesteld laden is ingeschakeld. Zie
[Installatie en configuratie](/nl/plugins/sdk-setup#setup-entry) voor wanneer dit van belang is.

Combineer `defineSetupPluginEntry(...)` met de specifieke families van installatiehelpers:

| Import                              | Gebruiken voor                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Runtime-veilige installatiehelpers: `createSetupTranslator`, importveilige adapters voor installatiepatches, uitvoer van opzoeknotities, `promptResolvedAllowFrom`, `splitSetupEntries`, gedelegeerde installatieproxy's |
| `openclaw/plugin-sdk/channel-setup` | Installatieoppervlakken voor optionele installaties                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | CLI-, archief- en documentatiehelpers voor installatie                                                                                                                                       |

Houd zware SDK's, CLI-registratie en langlopende runtimeservices in het
volledige toegangspunt.

Gebundelde werkruimtekanalen die installatie- en runtimeoppervlakken splitsen, kunnen in plaats daarvan
`defineBundledChannelSetupEntry(...)` uit
`openclaw/plugin-sdk/channel-entry-contract` gebruiken. Hiermee kan het installatie-
toegangspunt installatieveilige exports voor plugins/geheimen behouden en tegelijk een runtime-
setter beschikbaar stellen:

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
        /* installatieveilige route */
      },
    });
  },
});
```

Gebruik dit alleen wanneer een installatieproces werkelijk een lichtgewicht runtime-setter of
installatieveilig Gateway-oppervlak nodig heeft voordat het volledige kanaaltoegangspunt wordt geladen.
`registerSetupRuntime` wordt alleen uitgevoerd voor `"setup-runtime"`-laadacties; beperk dit
tot routes of methoden die alleen configuratie betreffen en moeten bestaan voordat de uitgestelde
volledige activering plaatsvindt.

## Registratiemodus

`api.registrationMode` geeft je plugin aan hoe deze is geladen:

| Modus               | Wanneer                                               | Wat te registreren                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Normale opstart van de Gateway                             | Alles                                                                                                              |
| `"discovery"`      | Alleen-lezen-detectie van mogelijkheden                     | Kanaalregistratie plus statische CLI-descriptors; toegangspuntcode mag worden geladen, maar sla sockets, workers, clients en services over |
| `"tool-discovery"` | Afgebakend laden om tools van specifieke plugins weer te geven of uit te voeren | Alleen registratie van mogelijkheden/tools; geen kanaalactivering                                                                |
| `"setup-only"`     | Uitgeschakeld/niet-geconfigureerd kanaal                      | Alleen kanaalregistratie                                                                                               |
| `"setup-runtime"`  | Installatieproces met beschikbare runtime                  | Kanaalregistratie plus alleen de lichtgewicht runtime die nodig is voordat het volledige toegangspunt wordt geladen                               |
| `"cli-metadata"`   | Hoofdhulp / vastlegging van CLI-metadata                   | Alleen CLI-descriptors                                                                                                    |

`defineChannelPluginEntry` verwerkt deze splitsing automatisch. Als je
`definePluginEntry` rechtstreeks voor een kanaal gebruikt, controleer dan zelf de modus en onthoud dat
`"tool-discovery"` kanaalregistratie overslaat:

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

  if (api.registrationMode === "tool-discovery") {
    // Registreer alleen oppervlakken voor mogelijkheden (providers/tools), geen kanaal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Zware registraties die alleen voor de runtime zijn
  api.registerService(/* ... */);
}
```

Langlopende services kunnen kleine invalidatie- of levenscyclusgebeurtenissen uitsturen via
hun servicecontext:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw voorziet dit van de naamruimte `plugin.<plugin-id>.changed`. Gebeurtenisnamen bestaan uit één
segment in kleine letters, payloads moeten begrensde JSON zijn en het bereik moet
`operator.read`, `operator.write` of `operator.admin` zijn. De emitter bestaat alleen
gedurende de levensduur van de service en wordt ingetrokken na het stoppen of een mislukte start. Geef
de voorkeur aan versie- of invalidatiepayloads boven volledige records, zodat geautoriseerde clients
de canonieke status opnieuw lezen via de afgebakende Gateway-methoden van de plugin.

De detectiemodus bouwt een niet-activerende momentopname van het register. Deze kan nog steeds
het plugintoegangspunt en het kanaalpluginobject evalueren, zodat OpenClaw
kanaalmogelijkheden en statische CLI-descriptors kan registreren. Behandel module-
evaluatie tijdens detectie als vertrouwd maar lichtgewicht: geen netwerkclients,
subprocessen, listeners, databaseverbindingen, achtergrondworkers,
lezingen van referenties of andere actieve runtime-neveneffecten op het hoogste niveau.

Beschouw `"setup-runtime"` als het venster waarin opstartoppervlakken die alleen voor installatie zijn
moeten bestaan zonder de volledige gebundelde kanaalruntime opnieuw binnen te gaan. Goede toepassingen zijn
kanaalregistratie, installatieveilige HTTP-routes, installatieveilige Gateway-methoden
en gedelegeerde installatiehelpers. Zware achtergrondservices, CLI-registrators en
initialisaties van provider-/client-SDK's horen nog steeds thuis in `"full"`.

## Pluginvormen

OpenClaw classificeert geladen plugins op basis van hun registratiegedrag:

| Vorm                 | Beschrijving                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Eén type mogelijkheid (bijv. alleen provider)           |
| **hybrid-capability** | Meerdere typen mogelijkheden (bijv. provider + spraak) |
| **hook-only**         | Alleen hooks, geen mogelijkheden                        |
| **non-capability**    | Tools/opdrachten/services, maar geen mogelijkheden        |

Gebruik `openclaw plugins inspect <id>` om de vorm van een plugin te bekijken.

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) - registratie-API en subpadreferentie
- [Runtimehelpers](/nl/plugins/sdk-runtime) - `api.runtime` en `createPluginRuntimeStore`
- [Installatie en configuratie](/nl/plugins/sdk-setup) - manifest, installatietoegangspunt, uitgesteld laden
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - het `ChannelPlugin`-object bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerregistratie en hooks
