---
read_when:
    - Je wilt een eenvoudige OpenClaw-plugin bouwen die alleen agenttools toevoegt
    - U wilt defineToolPlugin gebruiken in plaats van handmatig metadata voor het Plugin-manifest te schrijven
    - U moet een Plugin met alleen tools opzetten, genereren, valideren, testen of publiceren
sidebarTitle: Tool Plugins
summary: Bouw eenvoudige getypeerde agenttools met defineToolPlugin en openclaw plugins init/build/validate
title: Toolplugins
x-i18n:
    generated_at: "2026-07-12T09:16:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` bouwt een plugin die alleen door agents aanroepbare tools toevoegt: geen
kanaal, modelprovider, hook, service of installatiebackend. De functie genereert de
manifestmetadata die OpenClaw nodig heeft om tools te vinden zonder de runtimecode
van de plugin te laden.

Begin voor plugins met providers, kanalen, hooks, services of gemengde mogelijkheden
in plaats daarvan met [Plugins bouwen](/nl/plugins/building-plugins), [Kanaalplugins](/nl/plugins/sdk-channel-plugins)
of [Providerplugins](/nl/plugins/sdk-provider-plugins).

## Vereisten

- Node 22.19+, Node 23.11+ of Node 24+.
- Pakketuitvoer als TypeScript ESM.
- `typebox` in `dependencies` (niet alleen in `devDependencies` - de gegenereerde
  plugin importeert dit tijdens runtime).
- `openclaw >=2026.5.17`, de eerste versie die
  `openclaw/plugin-sdk/tool-plugin` exporteert.
- Een pakketroot die `dist/`, `openclaw.plugin.json` en
  `package.json` bevat.

## Snelstart

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` genereert:

| Bestand                | Doel                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | `defineToolPlugin`-ingangspunt met één `echo`-tool                |
| `src/index.test.ts`    | Metadatatest die de lijst met tools controleert                   |
| `tsconfig.json`        | NodeNext TypeScript-uitvoer naar `dist/`                          |
| `vitest.config.ts`     | Vitest-configuratie voor `src/**/*.test.ts`                       |
| `package.json`         | Scripts, runtimeafhankelijkheden, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Gegenereerde manifestmetadata voor de aanvankelijke tool          |

`npm run plugin:build` voert `npm run build` (tsc) uit en vervolgens
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
bouwt opnieuw en voert `openclaw plugins validate --entry ./dist/index.js` uit.
Bij een geslaagde validatie wordt het volgende weergegeven:

```text
Plugin stock-quotes is valid.
```

Opties voor `openclaw plugins init <id>`:

| Vlag                 | Standaardwaarde       | Effect                                      |
| -------------------- | --------------------- | ------------------------------------------- |
| `--directory <path>` | `<id>`                | Uitvoermap                                  |
| `--name <name>`      | `<id>` met hoofdletters | Weergavenaam                              |
| `--type <type>`      | `tool`                | Type sjabloon: `tool` of `provider`         |
| `--force`            | uitgeschakeld         | Een bestaande uitvoermap overschrijven      |

## Een tool schrijven

`defineToolPlugin` accepteert de pluginidentiteit, een optioneel configuratieschema en een
statische lijst met tools. Parameter- en configuratietypen worden afgeleid uit de
TypeBox-schema's.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Toolnamen vormen de stabiele API. Kies namen die uniek zijn, uit kleine letters
bestaan en specifiek genoeg zijn om botsingen met kerntools of andere plugins te voorkomen.

## Optionele tools en fabriekstools

Stel `optional: true` in wanneer gebruikers de tool expliciet aan de toelatingslijst moeten
toevoegen voordat deze naar een model wordt verzonden. `openclaw plugins build` schrijft de
bijbehorende manifestvermelding `toolMetadata.<tool>.optional`, zodat OpenClaw kan zien dat de
tool optioneel is zonder de runtimecode van de plugin te laden.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Gebruik `factory` wanneer een tool de runtimecontext van de tool nodig heeft voordat deze kan worden
gemaakt, bijvoorbeeld om een tool voor een specifieke uitvoering uit te sluiten, de sandboxstatus
te controleren of runtimehelpers te koppelen. De metadata blijven statisch, ook al wordt de concrete
tool tijdens runtime gebouwd.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Fabrieken declareren nog steeds vooraf een vaste toolnaam. Gebruik `definePluginEntry`
rechtstreeks wanneer de plugin toolnamen dynamisch berekent of tools combineert
met hooks, services, providers of opdrachten.

## Retourwaarden

`defineToolPlugin` verpakt gewone retourwaarden in de OpenClaw-indeling voor
toolresultaten:

- Retourneer een tekenreeks wanneer het model exact die tekst moet zien.
- Retourneer een JSON-compatibele waarde wanneer u wilt dat het model opgemaakte JSON ziet
  en OpenClaw de oorspronkelijke waarde in `details` bewaart.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Gebruik een fabriekstool wanneer u een aangepast `AgentToolResult` nodig hebt of een
bestaande `api.registerTool`-implementatie opnieuw wilt gebruiken.

## Configuratie

`configSchema` is optioneel. Laat dit weg en OpenClaw past een strikt schema voor een leeg object
toe; het gegenereerde manifest bevat nog steeds `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Met een `configSchema` wordt het tweede argument van `execute` daaruit getypeerd:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw leest de pluginconfiguratie uit de vermelding van de plugin in de Gateway-configuratie. Codeer
geheimen niet rechtstreeks in broncode of documentatievoorbeelden; gebruik configuratie, omgevingsvariabelen
of SecretRefs volgens het beveiligingsmodel van de plugin.

## Gegenereerde metadata

OpenClaw moet het pluginmanifest lezen voordat de runtimecode van de plugin wordt geïmporteerd.
`defineToolPlugin` stelt hiervoor statische metadata beschikbaar en
`openclaw plugins build` schrijft deze naar het pakket. Voer de generator opnieuw uit nadat
u de plugin-id, naam, beschrijving, het configuratieschema, de activering of toolnamen hebt
gewijzigd:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Gegenereerd manifest voor een plugin met één tool:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` is het belangrijke detectiecontract: het vertelt OpenClaw welke
plugin eigenaar is van elke tool zonder de runtime van elke geïnstalleerde plugin te laden. Een
verouderd manifest kan ertoe leiden dat een tool ontbreekt bij de detectie, of dat een registratiefout
aan de verkeerde plugin wordt toegeschreven.

## Pakketmetadata

`openclaw plugins build` stemt ook `package.json` af op het geselecteerde runtime-
ingangspunt:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Lever gebouwde JavaScript (`./dist/index.js`), geen TypeScript-broningangspunt.
Brongangspunten werken alleen voor lokale ontwikkeling binnen de werkruimte.

## Valideren in CI

`plugins build --check` mislukt zonder bestanden te herschrijven wanneer gegenereerde metadata
verouderd zijn:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` controleert of:

- `openclaw.plugin.json` bestaat en door de normale manifestlader wordt geaccepteerd.
- Het huidige ingangspunt `defineToolPlugin`-metadata exporteert.
- Gegenereerde manifestvelden overeenkomen met de metadata van het ingangspunt.
- `contracts.tools` overeenkomt met de gedeclareerde toolnamen.
- `package.json` met `openclaw.extensions` naar het geselecteerde runtime-ingangspunt verwijst.

## Lokaal installeren en inspecteren

Installeer vanuit een afzonderlijke OpenClaw-checkout of geïnstalleerde CLI het pakketpad:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Pak voor een rooktest van het pakket eerst het pakket in en installeer het tar-archief:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Start na de installatie de Gateway opnieuw of laad deze opnieuw en vraag de agent de
tool te gebruiken. Als de tool niet zichtbaar is, inspecteert u de runtime van de plugin en de effectieve
toolcatalogus voordat u code wijzigt (zie [Probleemoplossing](#troubleshooting)).

## Publiceren

Publiceer via ClawHub zodra het pakket gereed is. `clawhub package publish`
accepteert een bron: een lokale map, een GitHub-repository (`owner/repo[@ref]`) of een
URL naar een tar-archief.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installeer met een expliciete ClawHub-locator:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Kale npm-pakketspecificaties worden tijdens de overgang bij de lancering nog steeds vanuit npm geïnstalleerd, maar
ClawHub is het aanbevolen oppervlak voor het vinden en distribueren van OpenClaw-
plugins. Zie [Publiceren op ClawHub](/nl/clawhub/publishing) voor het eigenaarsbereik en
de releasebeoordeling.

## Probleemoplossing

### `plugin entry not found: ./dist/index.js`

Het geselecteerde ingangsbestand bestaat niet. Voer `npm run build` uit en voer vervolgens
`openclaw plugins build --entry ./dist/index.js` of
`openclaw plugins validate --entry ./dist/index.js` opnieuw uit.

### `plugin entry does not expose defineToolPlugin metadata`

Het ingangspunt exporteerde geen waarde die door `defineToolPlugin` is gemaakt. Controleer of de
standaardexport van de module het resultaat van `defineToolPlugin(...)` is, of geef met
`--entry` het juiste ingangspunt door.

### `openclaw.plugin.json generated metadata is stale`

Het manifest komt niet meer overeen met de metadata van het ingangspunt. Voer het volgende uit:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit zowel de wijzigingen aan `openclaw.plugin.json` als die aan `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

De pakketmetadata verwijzen naar een ander runtime-ingangspunt. Voer
`openclaw plugins build --entry ./dist/index.js` uit, zodat de generator de
pakketmetadata afstemt op het ingangspunt dat u wilt leveren.

### `Cannot find package 'typebox'`

De gebouwde plugin importeert `typebox` tijdens runtime. Houd dit pakket in `dependencies`,
installeer de afhankelijkheden opnieuw, bouw opnieuw en voer de validatie opnieuw uit.

### Tool verschijnt niet na installatie

Controleer het volgende in deze volgorde:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` bevat `contracts.tools` met de verwachte toolnamen.
4. `package.json` bevat `openclaw.extensions: ["./dist/index.js"]`.
5. De Gateway is opnieuw gestart of geladen nadat de Plugin is geïnstalleerd.

## Zie ook

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints)
- [Subpaden van de Plugin-SDK](/nl/plugins/sdk-subpaths)
- [Pluginmanifest](/nl/plugins/manifest)
- [CLI voor Plugins](/nl/cli/plugins)
- [Publiceren op ClawHub](/nl/clawhub/publishing)
