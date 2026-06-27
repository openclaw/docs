---
read_when:
    - Je wilt een eenvoudige OpenClaw-plugin bouwen die alleen agenttools toevoegt
    - Je wilt defineToolPlugin gebruiken in plaats van pluginmanifestmetadata handmatig te schrijven
    - Je moet een Plugin met alleen tools scaffolden, genereren, valideren, testen of publiceren
sidebarTitle: Tool Plugins
summary: Bouw eenvoudige getypeerde agenttools met defineToolPlugin en openclaw plugins init/build/validate
title: Toolplugins
x-i18n:
    generated_at: "2026-06-27T18:08:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Toolplugins voegen door agents aanroepbare tools toe aan OpenClaw zonder een kanaal,
modelprovider, hook, service of setup-backend toe te voegen. Gebruik `defineToolPlugin` wanneer de
plugin een vaste lijst met tools bezit en je wilt dat OpenClaw de manifestmetadata genereert
die die tools vindbaar houdt zonder runtimecode te laden.

De aanbevolen flow is:

1. Scaffold een pakket met `openclaw plugins init`.
2. Schrijf tools met `defineToolPlugin`.
3. Bouw JavaScript.
4. Genereer metadata voor `openclaw.plugin.json` en `package.json` met
   `openclaw plugins build`.
5. Valideer de gegenereerde metadata voordat je publiceert of installeert.

Voor provider-, kanaal-, hook-, service- of mixed-capability-plugins begin je in plaats daarvan met
[Plugins bouwen](/nl/plugins/building-plugins), [Kanaalplugins](/nl/plugins/sdk-channel-plugins),
of [Provider-plugins](/nl/plugins/sdk-provider-plugins).

## Vereisten

- Node >= 22.
- TypeScript ESM-pakketuitvoer.
- `typebox` voor configuratie- en toolparameterschema's.
- `openclaw >=2026.5.17`, de eerste OpenClaw-versie die
  `openclaw/plugin-sdk/tool-plugin` exporteert.
- Een pakketroot die `dist/`, `openclaw.plugin.json` en
  `package.json` kan leveren.

De gegenereerde plugin importeert `typebox` tijdens runtime, dus houd `typebox` in
`dependencies`, niet alleen in `devDependencies`.

## Snelstart

Maak een nieuw pluginpakket:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

De scaffold maakt:

- `src/index.ts`: een `defineToolPlugin`-entry met een `echo`-tool.
- `src/index.test.ts`: een kleine metadatatest.
- `tsconfig.json`: NodeNext TypeScript-uitvoer naar `dist/`.
- `package.json`: scripts, runtimeafhankelijkheden en
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: gegenereerde manifestmetadata voor de eerste tool.

Verwachte validatie-uitvoer:

```text
Plugin stock-quotes is valid.
```

## Een tool schrijven

`defineToolPlugin` neemt pluginidentiteit, een optioneel configuratieschema en een
statische lijst met tools. Parameter- en configuratietypen worden afgeleid uit TypeBox-
schema's.

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

Toolnamen zijn de stabiele API. Kies namen die uniek, lowercase en
specifiek genoeg zijn om botsingen met core-tools of andere plugins te voorkomen.

## Optionele tools en factory-tools

Stel `optional: true` in wanneer gebruikers de tool expliciet moeten allowlisten voordat deze
naar een model wordt gestuurd:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` schrijft de bijpassende `toolMetadata.<tool>.optional`-
manifestentry, zodat OpenClaw de tool kan ontdekken zonder pluginruntimecode te laden.

Gebruik `factory` wanneer een tool de runtime-toolcontext nodig heeft voordat deze kan worden
gemaakt. De factory houdt metadata statisch terwijl de tool zich kan afmelden voor een
specifieke run, sandboxstatus kan inspecteren of runtimehelpers kan binden.

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

Factories zijn nog steeds bedoeld voor vaste toolnamen. Gebruik `definePluginEntry` rechtstreeks wanneer
de plugin toolnamen dynamisch berekent of tools combineert met hooks,
services, providers, commando's of andere runtime-oppervlakken.

## Retourwaarden

`defineToolPlugin` verpakt gewone retourwaarden in de toolresultaatindeling van OpenClaw:

- Retourneer een string wanneer het model exact die tekst moet zien.
- Retourneer een JSON-compatibele waarde wanneer je wilt dat het model geformatteerde JSON ziet
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

Gebruik een factory-tool wanneer je een aangepaste `AgentToolResult` moet retourneren of een
bestaande `api.registerTool`-implementatie moet hergebruiken. Gebruik `definePluginEntry` in plaats
van `defineToolPlugin` wanneer je volledig dynamische tools of gemengde plugin-
capabilities nodig hebt.

## Configuratie

`configSchema` is optioneel. Als je het weglaat, gebruikt OpenClaw een strikt leeg object-
schema en bevat het gegenereerde manifest nog steeds `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Wanneer je `configSchema` opneemt, wordt het tweede `execute`-argument getypeerd vanuit het
schema:

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

OpenClaw leest pluginconfiguratie uit de pluginentry in de Gateway-configuratie. Hardcode geen
secrets in broncode of in documentatievoorbeelden. Gebruik configuratie, omgevings-
variabelen of SecretRefs volgens het beveiligingsmodel van de plugin.

## Gegenereerde metadata

OpenClaw ontdekt geïnstalleerde plugins via koude metadata. Het moet het
pluginmanifest kunnen lezen voordat pluginruntimecode wordt geïmporteerd. `defineToolPlugin`
stelt daarom statische metadata beschikbaar, en `openclaw plugins build` schrijft die
metadata naar het pakket.

Voer de generator uit nadat je plugin-id, naam, beschrijving, configuratieschema,
activering of toolnamen hebt gewijzigd:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Voor een plugin met één tool ziet het gegenereerde manifest er zo uit:

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

`contracts.tools` is het belangrijke discovery-contract. Het vertelt OpenClaw welke
plugin elke tool bezit zonder elke geïnstalleerde pluginruntime te laden. Als het
manifest verouderd is, ontbreekt de tool mogelijk in discovery of kan de verkeerde plugin
de schuld krijgen van een registratiefout.

## Pakketmetadata

Voor de eenvoudige toolplugin-workflow lijnt `openclaw plugins build`
`package.json` uit met de geselecteerde enkele runtime-entry:

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

Gebruik gebouwd JavaScript zoals `./dist/index.js` voor geïnstalleerde pakketten. Source-
entries zijn nuttig bij workspace-ontwikkeling, maar gepubliceerde pakketten mogen niet
afhankelijk zijn van TypeScript-runtime-laden.

## Valideren in CI

Gebruik `plugins build --check` om CI te laten falen wanneer gegenereerde metadata verouderd is zonder
bestanden te herschrijven:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` controleert dat:

- `openclaw.plugin.json` bestaat en door de normale manifestloader komt.
- De huidige entry `defineToolPlugin`-metadata exporteert.
- Gegenereerde manifestvelden overeenkomen met de entrymetadata.
- `contracts.tools` overeenkomt met de gedeclareerde toolnamen.
- `package.json` `openclaw.extensions` naar de geselecteerde runtime-entry laat wijzen.

## Lokaal installeren en inspecteren

Installeer het pakketpad vanuit een aparte OpenClaw-checkout of geïnstalleerde CLI:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Voor een packaged smoke pak je eerst in en installeer je de tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Start of herstart na installatie de Gateway en vraag de agent om de
tool te gebruiken. Als je toolzichtbaarheid debugt, inspecteer dan de pluginruntime en de
effectieve toolcatalogus voordat je de code wijzigt.

## Publiceren

Publiceer via ClawHub wanneer het pakket klaar is:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Installeer met een expliciete ClawHub-locator:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Kale npm-pakketspecificaties blijven ondersteund tijdens de launch-cutover, maar ClawHub
is het voorkeursoppervlak voor discovery en distributie voor OpenClaw-plugins.

## Problemen oplossen

### `plugin entry not found: ./dist/index.js`

Het geselecteerde entrybestand bestaat niet. Voer `npm run build` uit en voer daarna opnieuw
`openclaw plugins build --entry ./dist/index.js` of
`openclaw plugins validate --entry ./dist/index.js` uit.

### `plugin entry does not expose defineToolPlugin metadata`

De entry exporteerde geen waarde die door `defineToolPlugin` is gemaakt. Controleer of de
standaardexport van de module het resultaat van `defineToolPlugin(...)` is, of geef de juiste
entry door met `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Het manifest komt niet langer overeen met de entrymetadata. Voer uit:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit zowel de wijzigingen in `openclaw.plugin.json` als in `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

De pakketmetadata wijst naar een andere runtime-entry. Voer
`openclaw plugins build --entry ./dist/index.js` uit zodat de generator de
pakketmetadata uitlijnt met de entry die je wilt leveren.

### `Cannot find package 'typebox'`

De gebouwde plugin importeert `typebox` tijdens runtime. Houd `typebox` in
`dependencies`, installeer pakketafhankelijkheden opnieuw, bouw opnieuw en voer validatie opnieuw uit.

### Tool verschijnt niet na installatie

Controleer deze in volgorde:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` heeft `contracts.tools` met de verwachte toolnamen.
4. `package.json` heeft `openclaw.extensions: ["./dist/index.js"]`.
5. De Gateway is herstart of opnieuw geladen na installatie van de plugin.

## Zie ook

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-entrypoints](/nl/plugins/sdk-entrypoints)
- [Plugin SDK-subpaden](/nl/plugins/sdk-subpaths)
- [Pluginmanifest](/nl/plugins/manifest)
- [Plugins-CLI](/nl/cli/plugins)
- [Publiceren met ClawHub](/nl/clawhub/publishing)
