---
read_when:
    - Je wilt een eenvoudige OpenClaw-plugin bouwen die alleen agenttools toevoegt
    - Je wilt defineToolPlugin gebruiken in plaats van met de hand metadata voor het Plugin-manifest te schrijven
    - Je moet een Plugin met alleen tools opzetten, genereren, valideren, testen of publiceren
sidebarTitle: Tool Plugins
summary: Bouw eenvoudige getypeerde agenttools met defineToolPlugin en openclaw plugins init/build/validate
title: Toolplugins
x-i18n:
    generated_at: "2026-07-16T16:20:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` bouwt een plugin die alleen door agents aanroepbare tools toevoegt: geen
kanaal, modelprovider, hook, service of setupbackend. Deze genereert de
manifestmetadata die OpenClaw nodig heeft om tools te ontdekken zonder de
runtimecode van de plugin te laden.

Begin voor plugins met een provider, kanaal, hook, service of gemengde mogelijkheden
in plaats daarvan met [Plugins bouwen](/nl/plugins/building-plugins), [Kanaalplugins](/nl/plugins/sdk-channel-plugins)
of [Providerplugins](/nl/plugins/sdk-provider-plugins).

## Vereisten

- Node 22.22.3+, Node 24.15+ of Node 25.9+.
- TypeScript ESM-pakketuitvoer.
- `typebox` in `dependencies` (niet alleen `devDependencies` - de gegenereerde
  plugin importeert dit tijdens runtime).
- `openclaw >=2026.5.17`, de eerste versie die
  `openclaw/plugin-sdk/tool-plugin` exporteert.
- Een pakketroot die `dist/`, `openclaw.plugin.json` en
  `package.json` levert.

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
| `src/index.ts`         | `defineToolPlugin`-ingang met één `echo`-tool                     |
| `src/index.test.ts`    | Metadatatest die de toollijst controleert                         |
| `tsconfig.json`        | NodeNext TypeScript-uitvoer naar `dist/`                          |
| `vitest.config.ts`     | Vitest-configuratie voor `src/**/*.test.ts`                       |
| `package.json`         | Scripts, runtimeafhankelijkheden, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Gegenereerde manifestmetadata voor de eerste tool                  |

`npm run plugin:build` voert `npm run build` (tsc) uit en vervolgens
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
bouwt opnieuw en voert `openclaw plugins validate --entry ./dist/index.js` uit.
Bij geslaagde validatie verschijnt:

```text
Plugin stock-quotes is geldig.
```

Opties voor `openclaw plugins init <id>`:

| Vlag                 | Standaard           | Effect                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Uitvoermap                             |
| `--name <name>`      | `<id>` met hoofdletters als titel | Weergavenaam                           |
| `--type <type>`      | `tool`             | Scaffoldtype: `tool` of `provider`    |
| `--force`            | uit                | Een bestaande uitvoermap overschrijven |

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
  description: "Momentopnamen van aandelenkoersen ophalen.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API-sleutel voor koersen." })),
    baseUrl: Type.Optional(Type.String({ description: "Basis-URL van de koers-API." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Aandelenkoers",
      description: "Een momentopname van een aandelenkoers ophalen.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Tickersymbool, bijvoorbeeld OPEN." }),
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

Toolnamen vormen de stabiele API. Kies namen die uniek zijn, uit kleine letters bestaan en
specifiek genoeg zijn om conflicten met kerntools of andere plugins te voorkomen.

## Optionele tools en factory-tools

Stel `optional: true` in wanneer gebruikers de tool expliciet aan de toelatingslijst moeten toevoegen voordat deze
naar een model wordt verzonden. `openclaw plugins build` schrijft de overeenkomende
`toolMetadata.<tool>.optional`-manifestvermelding, zodat OpenClaw kan zien dat de
tool optioneel is zonder de runtimecode van de plugin te laden.

```typescript
tool({
  name: "workflow_run",
  description: "Een externe workflow uitvoeren.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Gebruik `factory` wanneer een tool de runtimetoolcontext nodig heeft voordat deze kan worden
gemaakt, bijvoorbeeld om zich voor een specifieke uitvoering af te melden, de sandboxstatus te inspecteren of
runtimehelpers te koppelen. De metadata blijven statisch, hoewel de concrete tool
tijdens runtime wordt gebouwd.

```typescript
tool({
  name: "local_workflow",
  description: "Een lokale workflow buiten gesandboxte sessies uitvoeren.",
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

Factories declareren nog steeds vooraf een vaste toolnaam. Gebruik `definePluginEntry`
rechtstreeks wanneer de plugin toolnamen dynamisch berekent of tools combineert
met hooks, services, providers of opdrachten.

## Retourwaarden

`defineToolPlugin` verpakt gewone retourwaarden in de OpenClaw-toolresultaatindeling:

- Retourneer een tekenreeks wanneer het model exact die tekst moet zien.
- Retourneer een JSON-compatibele waarde wanneer je wilt dat het model opgemaakte JSON ziet
  en OpenClaw de oorspronkelijke waarde in `details` bewaart.

```typescript
tool({
  name: "echo_text",
  description: "Invoertekst herhalen.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Invoer als gestructureerde JSON herhalen.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Gebruik een factory-tool wanneer je een aangepaste `AgentToolResult` nodig hebt of een
bestaande `api.registerTool`-implementatie wilt hergebruiken.

## Configuratie

`configSchema` is optioneel. Laat dit weg en OpenClaw past een strikt schema voor een leeg object
toe; het gegenereerde manifest bevat nog steeds `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Tools zonder configuratie",
  description: "Voegt tools toe die geen configuratie nodig hebben.",
  tools: () => [],
});
```

Met een `configSchema` wordt het tweede argument van `execute` hiervan afgeleid:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Geconfigureerde tools",
  description: "Voegt geconfigureerde tools toe.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Controleren of configuratie beschikbaar is.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw leest de pluginconfiguratie uit de vermelding van de plugin in de Gateway-configuratie. Leg
geheimen niet vast in broncode of documentatievoorbeelden; gebruik configuratie, omgevingsvariabelen
of SecretRefs volgens het beveiligingsmodel van de plugin.

## Gegenereerde metadata

OpenClaw moet het pluginmanifest lezen voordat de runtimecode van de plugin wordt geïmporteerd.
`defineToolPlugin` stelt hiervoor statische metadata beschikbaar en
`openclaw plugins build` schrijft deze naar het pakket. Voer de generator opnieuw uit nadat je
de plugin-id, naam, beschrijving, het configuratieschema, de activering of toolnamen hebt
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
  "description": "Momentopnamen van aandelenkoersen ophalen.",
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

`contracts.tools` is het belangrijke ontdekkingscontract: dit vertelt OpenClaw welke
plugin eigenaar is van elke tool zonder de runtime van elke geïnstalleerde plugin te laden. Een
verouderd manifest betekent dat een tool kan ontbreken bij de ontdekking, of dat een registratiefout
aan de verkeerde plugin wordt toegeschreven.

## Pakketmetadata

`openclaw plugins build` lijnt ook `package.json` uit met de geselecteerde runtime-
ingang:

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

Lever gebouwde JavaScript (`./dist/index.js`), geen TypeScript-broningang.
Broningangen werken alleen voor lokale ontwikkeling binnen de workspace.

## Valideren in CI

`plugins build --check` mislukt zonder bestanden te herschrijven wanneer gegenereerde metadata
verouderd zijn:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` controleert het volgende:

- `openclaw.plugin.json` bestaat en doorstaat de normale manifestlader.
- De huidige ingang exporteert `defineToolPlugin`-metadata.
- De gegenereerde manifestvelden komen overeen met de metadata van de ingang.
- `contracts.tools` komt overeen met de gedeclareerde toolnamen.
- `package.json` laat `openclaw.extensions` naar de geselecteerde runtime-ingang verwijzen.

## Lokaal installeren en inspecteren

Installeer het pakketpad vanuit een afzonderlijke OpenClaw-checkout of geïnstalleerde CLI:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Pak voor een verpakte rooktest eerst het pakket in en installeer het tarbestand:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Start of herlaad na de installatie de Gateway en vraag de agent om de
tool te gebruiken. Als de tool niet zichtbaar is, inspecteer dan de pluginruntime en de effectieve
toolcatalogus voordat je code wijzigt (zie [Probleemoplossing](#troubleshooting)).

## Publiceren

Publiceer via ClawHub zodra het pakket gereed is. `clawhub package publish`
accepteert een bron: een lokale map, een GitHub-repository (`owner/repo[@ref]`) of een
tarball-URL.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installeer met een expliciete ClawHub-locator:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Onaangepaste npm-pakketspecificaties worden tijdens de overgang naar de lancering nog steeds vanuit npm geïnstalleerd, maar
ClawHub is het voorkeursoppervlak voor ontdekking en distributie van OpenClaw-
plugins. Zie [Publiceren op ClawHub](/nl/clawhub/publishing) voor het eigenaarsbereik en
de releasebeoordeling.

## Probleemoplossing

### `plugin entry not found: ./dist/index.js`

Het geselecteerde ingangsbestand bestaat niet. Voer `npm run build` uit en voer vervolgens
`openclaw plugins build --entry ./dist/index.js` of
`openclaw plugins validate --entry ./dist/index.js` opnieuw uit.

### `plugin entry does not expose defineToolPlugin metadata`

De ingang exporteerde geen waarde die door `defineToolPlugin` is gemaakt. Controleer of de
standaardexport van de module het resultaat van `defineToolPlugin(...)` is, of geef de
juiste ingang door met `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Het manifest komt niet langer overeen met de metadata van de ingang. Voer het volgende uit:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit zowel de wijzigingen aan `openclaw.plugin.json` als die aan `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

De pakketmetadata verwijzen naar een andere runtime-ingang. Voer
`openclaw plugins build --entry ./dist/index.js` uit, zodat de generator de
pakketmetadata uitlijnt met de ingang die je wilt leveren.

### `Cannot find package 'typebox'`

De gebouwde plugin importeert `typebox` tijdens runtime. Houd dit in `dependencies`,
installeer opnieuw, bouw opnieuw en voer de validatie opnieuw uit.

### Tool verschijnt niet na installatie

Controleer deze in de volgende volgorde:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` heeft `contracts.tools` met de verwachte toolnamen.
4. `package.json` heeft `openclaw.extensions: ["./dist/index.js"]`.
5. De Gateway is opnieuw gestart of geladen na de installatie van de plugin.

## Zie ook

- [Plugins bouwen](/nl/plugins/building-plugins)
- [Plugin-ingangspunten](/nl/plugins/sdk-entrypoints)
- [Subpaden van de Plugin SDK](/nl/plugins/sdk-subpaths)
- [Pluginmanifest](/nl/plugins/manifest)
- [CLI voor plugins](/nl/cli/plugins)
- [Publiceren op ClawHub](/nl/clawhub/publishing)
