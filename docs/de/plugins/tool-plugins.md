---
read_when:
    - Sie möchten ein einfaches OpenClaw-Plugin erstellen, das nur Agent-Tools hinzufügt
    - Sie möchten defineToolPlugin verwenden, statt Plugin-Manifest-Metadaten von Hand zu schreiben
    - Sie müssen ein reines Tool-Plugin als Grundgerüst erstellen, generieren, validieren, testen oder veröffentlichen
sidebarTitle: Tool Plugins
summary: Einfache typisierte Agent-Tools mit defineToolPlugin und openclaw plugins init/build/validate erstellen
title: Tool-Plugins
x-i18n:
    generated_at: "2026-06-27T18:00:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Tool-Plugins fügen OpenClaw agentenaufrufbare Tools hinzu, ohne einen Kanal, Model-Provider, Hook, Dienst oder ein Setup-Backend hinzuzufügen. Verwenden Sie `defineToolPlugin`, wenn das Plugin eine feste Liste von Tools besitzt und OpenClaw die Manifest-Metadaten erzeugen soll, die diese Tools auffindbar halten, ohne Laufzeitcode zu laden.

Der empfohlene Ablauf ist:

1. Erstellen Sie ein Paketgerüst mit `openclaw plugins init`.
2. Schreiben Sie Tools mit `defineToolPlugin`.
3. Bauen Sie JavaScript.
4. Erzeugen Sie `openclaw.plugin.json`- und `package.json`-Metadaten mit
   `openclaw plugins build`.
5. Validieren Sie die erzeugten Metadaten vor der Veröffentlichung oder Installation.

Für Provider-, Kanal-, Hook-, Dienst- oder Plugins mit gemischten Fähigkeiten beginnen Sie stattdessen mit
[Plugins erstellen](/de/plugins/building-plugins), [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
oder [Provider-Plugins](/de/plugins/sdk-provider-plugins).

## Anforderungen

- Node >= 22.
- TypeScript-ESM-Paketausgabe.
- `typebox` für Konfigurations- und Tool-Parameterschemas.
- `openclaw >=2026.5.17`, die erste OpenClaw-Version, die
  `openclaw/plugin-sdk/tool-plugin` exportiert.
- Ein Paket-Root, der `dist/`, `openclaw.plugin.json` und
  `package.json` ausliefern kann.

Das erzeugte Plugin importiert `typebox` zur Laufzeit. Behalten Sie `typebox` daher in
`dependencies`, nicht nur in `devDependencies`.

## Schnellstart

Erstellen Sie ein neues Plugin-Paket:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

Das Gerüst erstellt:

- `src/index.ts`: einen `defineToolPlugin`-Einstieg mit einem `echo`-Tool.
- `src/index.test.ts`: einen kleinen Metadatentest.
- `tsconfig.json`: NodeNext-TypeScript-Ausgabe nach `dist/`.
- `package.json`: Skripte, Laufzeitabhängigkeiten und
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: erzeugte Manifest-Metadaten für das anfängliche Tool.

Erwartete Validierungsausgabe:

```text
Plugin stock-quotes is valid.
```

## Ein Tool schreiben

`defineToolPlugin` übernimmt die Plugin-Identität, ein optionales Konfigurationsschema und eine
statische Liste von Tools. Parameter- und Konfigurationstypen werden aus TypeBox-
Schemas abgeleitet.

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

Tool-Namen sind die stabile API. Wählen Sie Namen, die eindeutig, kleingeschrieben und
spezifisch genug sind, um Kollisionen mit Core-Tools oder anderen Plugins zu vermeiden.

## Optionale und Factory-Tools

Setzen Sie `optional: true`, wenn Benutzer das Tool ausdrücklich auf die Allowlist setzen sollen, bevor es
an ein Modell gesendet wird:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` schreibt den passenden `toolMetadata.<tool>.optional`-
Manifest-Eintrag, damit OpenClaw das Tool erkennen kann, ohne den Plugin-
Laufzeitcode zu laden.

Verwenden Sie `factory`, wenn ein Tool den Laufzeit-Tool-Kontext benötigt, bevor es
erstellt werden kann. Die Factory hält die Metadaten statisch, während das Tool für einen
bestimmten Lauf aussteigen, den Sandbox-Zustand prüfen oder Laufzeithelfer binden kann.

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

Factories sind weiterhin für feste Tool-Namen gedacht. Verwenden Sie `definePluginEntry` direkt, wenn
das Plugin Tool-Namen dynamisch berechnet oder Tools mit Hooks,
Diensten, Providern, Befehlen oder anderen Laufzeitoberflächen kombiniert.

## Rückgabewerte

`defineToolPlugin` umschließt einfache Rückgabewerte in das OpenClaw-Tool-Ergebnisformat:

- Geben Sie einen String zurück, wenn das Modell genau diesen Text sehen soll.
- Geben Sie einen JSON-kompatiblen Wert zurück, wenn das Modell formatiertes JSON sehen soll
  und OpenClaw den ursprünglichen Wert in `details` behalten soll.

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

Verwenden Sie ein Factory-Tool, wenn Sie ein benutzerdefiniertes `AgentToolResult` zurückgeben oder eine
vorhandene `api.registerTool`-Implementierung wiederverwenden müssen. Verwenden Sie `definePluginEntry` statt
`defineToolPlugin`, wenn Sie vollständig dynamische Tools oder gemischte Plugin-
Fähigkeiten benötigen.

## Konfiguration

`configSchema` ist optional. Wenn Sie es weglassen, verwendet OpenClaw ein strikt leeres Objekt-
Schema, und das erzeugte Manifest enthält weiterhin `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Wenn Sie `configSchema` einschließen, wird das zweite `execute`-Argument aus dem
Schema typisiert:

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

OpenClaw liest die Plugin-Konfiguration aus dem Plugin-Eintrag in der Gateway-Konfiguration. Hinterlegen Sie
keine Secrets fest im Quellcode oder in Dokumentationsbeispielen. Verwenden Sie Konfiguration, Umgebungs-
variablen oder SecretRefs gemäß dem Sicherheitsmodell des Plugins.

## Erzeugte Metadaten

OpenClaw erkennt installierte Plugins aus kalten Metadaten. Es muss das
Plugin-Manifest lesen können, bevor Plugin-Laufzeitcode importiert wird. `defineToolPlugin`
stellt daher statische Metadaten bereit, und `openclaw plugins build` schreibt diese
Metadaten in das Paket.

Führen Sie den Generator aus, nachdem Sie Plugin-ID, Name, Beschreibung, Konfigurationsschema,
Aktivierung oder Tool-Namen geändert haben:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Für ein Plugin mit einem Tool sieht das erzeugte Manifest so aus:

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

`contracts.tools` ist der wichtige Discovery-Vertrag. Er teilt OpenClaw mit, welches
Plugin jedes Tool besitzt, ohne jede installierte Plugin-Laufzeit zu laden. Wenn das
Manifest veraltet ist, fehlt das Tool möglicherweise in der Discovery, oder das falsche Plugin
wird für einen Registrierungsfehler verantwortlich gemacht.

## Paketmetadaten

Für den einfachen Tool-Plugin-Workflow richtet `openclaw plugins build`
`package.json` am ausgewählten einzelnen Laufzeiteinstieg aus:

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

Verwenden Sie gebautes JavaScript wie `./dist/index.js` für installierte Pakete. Quell-
Einstiege sind in der Workspace-Entwicklung nützlich, veröffentlichte Pakete sollten jedoch nicht
vom Laden der TypeScript-Laufzeit abhängen.

## In CI validieren

Verwenden Sie `plugins build --check`, damit CI fehlschlägt, wenn erzeugte Metadaten veraltet sind, ohne
Dateien neu zu schreiben:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` prüft, dass:

- `openclaw.plugin.json` existiert und den normalen Manifest-Loader besteht.
- Der aktuelle Einstieg `defineToolPlugin`-Metadaten exportiert.
- Erzeugte Manifest-Felder mit den Einstiegsmetadaten übereinstimmen.
- `contracts.tools` mit den deklarierten Tool-Namen übereinstimmt.
- `package.json` `openclaw.extensions` auf den ausgewählten Laufzeiteinstieg zeigt.

## Lokal installieren und prüfen

Installieren Sie den Paketpfad aus einem separaten OpenClaw-Checkout oder mit installierter CLI:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Für einen Paket-Smoke-Test packen Sie zuerst und installieren dann den Tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Starten oder starten Sie nach der Installation den Gateway neu und bitten Sie den Agenten, das
Tool zu verwenden. Wenn Sie die Sichtbarkeit von Tools debuggen, prüfen Sie die Plugin-Laufzeit und den
effektiven Tool-Katalog, bevor Sie den Code ändern.

## Veröffentlichen

Veröffentlichen Sie über ClawHub, wenn das Paket bereit ist:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Installieren Sie mit einem expliziten ClawHub-Locator:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Bloße npm-Paketspezifikationen bleiben während der Launch-Umstellung unterstützt, aber ClawHub
ist die bevorzugte Discovery- und Distributionsoberfläche für OpenClaw-Plugins.

## Fehlerbehebung

### `plugin entry not found: ./dist/index.js`

Die ausgewählte Einstiegsdatei existiert nicht. Führen Sie `npm run build` aus und anschließend erneut
`openclaw plugins build --entry ./dist/index.js` oder
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Der Einstieg hat keinen von `defineToolPlugin` erzeugten Wert exportiert. Prüfen Sie, dass der
Standardexport des Moduls das Ergebnis von `defineToolPlugin(...)` ist, oder übergeben Sie den richtigen
Einstieg mit `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Das Manifest stimmt nicht mehr mit den Einstiegsmetadaten überein. Führen Sie aus:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Committen Sie sowohl die Änderungen an `openclaw.plugin.json` als auch an `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Die Paketmetadaten zeigen auf einen anderen Laufzeiteinstieg. Führen Sie
`openclaw plugins build --entry ./dist/index.js` aus, damit der Generator die
Paketmetadaten an den Einstieg anpasst, den Sie ausliefern möchten.

### `Cannot find package 'typebox'`

Das gebaute Plugin importiert `typebox` zur Laufzeit. Behalten Sie `typebox` in
`dependencies`, installieren Sie die Paketabhängigkeiten erneut, bauen Sie neu und führen Sie die Validierung erneut aus.

### Tool erscheint nach der Installation nicht

Prüfen Sie Folgendes der Reihe nach:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` enthält `contracts.tools` mit den erwarteten Tool-Namen.
4. `package.json` enthält `openclaw.extensions: ["./dist/index.js"]`.
5. Der Gateway wurde nach der Installation des Plugins neu gestartet oder neu geladen.

## Siehe auch

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugins-CLI](/de/cli/plugins)
- [ClawHub-Veröffentlichung](/de/clawhub/publishing)
