---
read_when:
    - Sie möchten ein einfaches OpenClaw-Plugin erstellen, das lediglich Agentenwerkzeuge hinzufügt
    - Sie möchten `defineToolPlugin` verwenden, anstatt die Metadaten des Plugin-Manifests manuell zu schreiben
    - Sie müssen ein reines Tool-Plugin erstellen, generieren, validieren, testen oder veröffentlichen.
sidebarTitle: Tool Plugins
summary: Erstellen Sie einfache typisierte Agent-Tools mit defineToolPlugin und openclaw plugins init/build/validate
title: Tool-Plugins
x-i18n:
    generated_at: "2026-07-12T02:02:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` erstellt ein Plugin, das ausschließlich von Agenten aufrufbare Tools hinzufügt: keinen
Kanal, Modell-Provider, Hook, Dienst oder Einrichtungs-Backend. Es erzeugt die
Manifest-Metadaten, die OpenClaw benötigt, um Tools zu erkennen, ohne den
Plugin-Laufzeitcode zu laden.

Für Plugins mit Provider-, Kanal-, Hook-, Dienst- oder gemischten Funktionen beginnen Sie stattdessen mit
[Plugins erstellen](/de/plugins/building-plugins), [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
oder [Provider-Plugins](/de/plugins/sdk-provider-plugins).

## Anforderungen

- Node 22.19+, Node 23.11+ oder Node 24+.
- TypeScript-ESM-Paketausgabe.
- `typebox` in `dependencies` (nicht nur in `devDependencies` – das erzeugte
  Plugin importiert es zur Laufzeit).
- `openclaw >=2026.5.17`, die erste Version, die
  `openclaw/plugin-sdk/tool-plugin` exportiert.
- Ein Paketstammverzeichnis, das `dist/`, `openclaw.plugin.json` und
  `package.json` ausliefert.

## Schnellstart

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` erstellt folgende Grundstruktur:

| Datei                  | Zweck                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | `defineToolPlugin`-Einstiegspunkt mit einem `echo`-Tool             |
| `src/index.test.ts`    | Metadatentest, der die Tool-Liste überprüft                         |
| `tsconfig.json`        | NodeNext-TypeScript-Ausgabe nach `dist/`                            |
| `vitest.config.ts`     | Vitest-Konfiguration für `src/**/*.test.ts`                         |
| `package.json`         | Skripte, Laufzeitabhängigkeiten, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Erzeugte Manifest-Metadaten für das anfängliche Tool                |

`npm run plugin:build` führt `npm run build` (tsc) und anschließend
`openclaw plugins build --entry ./dist/index.js` aus. `npm run plugin:validate`
erstellt das Plugin erneut und führt `openclaw plugins validate --entry ./dist/index.js` aus.
Bei erfolgreicher Validierung wird Folgendes ausgegeben:

```text
Plugin stock-quotes is valid.
```

Optionen für `openclaw plugins init <id>`:

| Flag                 | Standardwert                    | Auswirkung                                      |
| -------------------- | ------------------------------- | ----------------------------------------------- |
| `--directory <path>` | `<id>`                          | Ausgabeverzeichnis                              |
| `--name <name>`      | `<id>` mit großgeschriebenen Anfangsbuchstaben | Anzeigename                         |
| `--type <type>`      | `tool`                          | Typ der Grundstruktur: `tool` oder `provider`   |
| `--force`            | deaktiviert                     | Vorhandenes Ausgabeverzeichnis überschreiben    |

## Ein Tool schreiben

`defineToolPlugin` akzeptiert die Plugin-Identität, ein optionales Konfigurationsschema und eine
statische Liste von Tools. Parameter- und Konfigurationstypen werden aus den
TypeBox-Schemas abgeleitet.

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

Tool-Namen bilden die stabile API. Wählen Sie Namen, die eindeutig, kleingeschrieben und
spezifisch genug sind, um Kollisionen mit Kern-Tools oder anderen Plugins zu vermeiden.

## Optionale Tools und Factory-Tools

Legen Sie `optional: true` fest, wenn Benutzer das Tool ausdrücklich in die Positivliste aufnehmen sollen, bevor es
an ein Modell gesendet wird. `openclaw plugins build` schreibt den entsprechenden
Manifesteintrag `toolMetadata.<tool>.optional`, damit OpenClaw erkennen kann, dass das
Tool optional ist, ohne den Plugin-Laufzeitcode zu laden.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Verwenden Sie `factory`, wenn ein Tool den Laufzeit-Tool-Kontext benötigt, bevor es
erstellt werden kann – etwa um es für eine bestimmte Ausführung auszuschließen, den Sandbox-Status zu prüfen oder
Laufzeit-Hilfsfunktionen zu binden. Die Metadaten bleiben statisch, obwohl das konkrete Tool
zur Laufzeit erstellt wird.

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

Factories deklarieren weiterhin vorab einen festen Tool-Namen. Verwenden Sie
`definePluginEntry` direkt, wenn das Plugin Tool-Namen dynamisch berechnet oder Tools
mit Hooks, Diensten, Providern oder Befehlen kombiniert.

## Rückgabewerte

`defineToolPlugin` verpackt einfache Rückgabewerte in das OpenClaw-Tool-Ergebnisformat:

- Geben Sie eine Zeichenfolge zurück, wenn das Modell genau diesen Text sehen soll.
- Geben Sie einen JSON-kompatiblen Wert zurück, wenn das Modell formatiertes JSON sehen
  und OpenClaw den ursprünglichen Wert in `details` beibehalten soll.

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

Verwenden Sie ein Factory-Tool, wenn Sie ein benutzerdefiniertes `AgentToolResult` benötigen oder eine
vorhandene `api.registerTool`-Implementierung wiederverwenden möchten.

## Konfiguration

`configSchema` ist optional. Wenn Sie es weglassen, wendet OpenClaw ein striktes Schema für ein leeres Objekt
an; das erzeugte Manifest enthält weiterhin `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Mit einem `configSchema` wird der zweite `execute`-Parameter daraus typisiert:

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

OpenClaw liest die Plugin-Konfiguration aus dem Eintrag des Plugins in der Gateway-Konfiguration. Hinterlegen
Sie Geheimnisse nicht fest im Quellcode oder in Dokumentationsbeispielen; verwenden Sie entsprechend dem Sicherheitsmodell
des Plugins Konfigurationen, Umgebungsvariablen oder SecretRefs.

## Erzeugte Metadaten

OpenClaw muss das Plugin-Manifest lesen, bevor es Plugin-Laufzeitcode importiert.
`defineToolPlugin` stellt dafür statische Metadaten bereit und
`openclaw plugins build` schreibt sie in das Paket. Führen Sie den Generator erneut aus, nachdem
Sie Plugin-ID, Name, Beschreibung, Konfigurationsschema, Aktivierung oder Tool-Namen
geändert haben:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Erzeugtes Manifest für ein Plugin mit einem Tool:

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

`contracts.tools` ist der entscheidende Erkennungsvertrag: Er teilt OpenClaw mit, welches
Plugin jedes Tool besitzt, ohne die Laufzeit jedes installierten Plugins zu laden. Ein
veraltetes Manifest kann dazu führen, dass ein Tool bei der Erkennung fehlt oder ein Registrierungsfehler
dem falschen Plugin zugeschrieben wird.

## Paketmetadaten

`openclaw plugins build` gleicht außerdem `package.json` an den ausgewählten Laufzeit-
Einstiegspunkt an:

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

Liefern Sie erstelltes JavaScript (`./dist/index.js`) aus, keinen TypeScript-Quellcode-Einstiegspunkt.
Quellcode-Einstiegspunkte funktionieren nur für die lokale Entwicklung im Workspace.

## In CI validieren

`plugins build --check` schlägt ohne Neuschreiben von Dateien fehl, wenn die erzeugten Metadaten
veraltet sind:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` prüft Folgendes:

- `openclaw.plugin.json` ist vorhanden und besteht die Prüfung durch den regulären Manifest-Loader.
- Der aktuelle Einstiegspunkt exportiert `defineToolPlugin`-Metadaten.
- Die erzeugten Manifestfelder stimmen mit den Metadaten des Einstiegspunkts überein.
- `contracts.tools` stimmt mit den deklarierten Tool-Namen überein.
- `package.json` verweist mit `openclaw.extensions` auf den ausgewählten Laufzeit-Einstiegspunkt.

## Lokal installieren und prüfen

Installieren Sie den Paketpfad aus einem separaten OpenClaw-Checkout oder über eine installierte CLI:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Für einen Smoke-Test des gepackten Pakets erstellen Sie zunächst das Paket und installieren dann den Tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Starten oder laden Sie nach der Installation das Gateway neu und bitten Sie den Agenten, das
Tool zu verwenden. Wenn das Tool nicht sichtbar ist, prüfen Sie die Plugin-Laufzeit und den effektiven
Tool-Katalog, bevor Sie Code ändern (siehe [Fehlerbehebung](#troubleshooting)).

## Veröffentlichen

Veröffentlichen Sie das Paket über ClawHub, sobald es bereit ist. `clawhub package publish`
akzeptiert eine Quelle: einen lokalen Ordner, ein GitHub-Repository (`owner/repo[@ref]`) oder eine
Tarball-URL.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installieren Sie es mit einer expliziten ClawHub-Adresse:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Reine npm-Paketspezifikationen werden während der Umstellungsphase beim Start weiterhin von npm installiert, aber
ClawHub ist die bevorzugte Oberfläche für Erkennung und Verteilung von OpenClaw-
Plugins. Informationen zum Eigentümerbereich und zur Freigabeprüfung finden Sie unter [Veröffentlichung über ClawHub](/de/clawhub/publishing).

## Fehlerbehebung

### `plugin entry not found: ./dist/index.js`

Die ausgewählte Einstiegspunktdatei ist nicht vorhanden. Führen Sie `npm run build` aus und anschließend erneut
`openclaw plugins build --entry ./dist/index.js` oder
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Der Einstiegspunkt hat keinen von `defineToolPlugin` erstellten Wert exportiert. Vergewissern Sie sich, dass
der Standardexport des Moduls das Ergebnis von `defineToolPlugin(...)` ist, oder geben Sie mit
`--entry` den korrekten Einstiegspunkt an.

### `openclaw.plugin.json generated metadata is stale`

Das Manifest stimmt nicht mehr mit den Metadaten des Einstiegspunkts überein. Führen Sie Folgendes aus:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Committen Sie sowohl die Änderungen an `openclaw.plugin.json` als auch an `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Die Paketmetadaten verweisen auf einen anderen Laufzeit-Einstiegspunkt. Führen Sie
`openclaw plugins build --entry ./dist/index.js` aus, damit der Generator die
Paketmetadaten an den Einstiegspunkt anpasst, den Sie ausliefern möchten.

### `Cannot find package 'typebox'`

Das erstellte Plugin importiert `typebox` zur Laufzeit. Belassen Sie es in `dependencies`,
installieren Sie die Abhängigkeiten erneut, erstellen Sie das Plugin neu und führen Sie die Validierung erneut aus.

### Tool wird nach der Installation nicht angezeigt

Prüfen Sie der Reihe nach Folgendes:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` enthält unter `contracts.tools` die erwarteten Werkzeugnamen.
4. `package.json` enthält `openclaw.extensions: ["./dist/index.js"]`.
5. Der Gateway wurde nach der Installation des Plugins neu gestartet oder neu geladen.

## Siehe auch

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-CLI](/de/cli/plugins)
- [Veröffentlichung auf ClawHub](/de/clawhub/publishing)
