---
read_when:
    - Sie möchten ein einfaches OpenClaw-Plugin erstellen, das lediglich Agent-Tools hinzufügt
    - Sie möchten defineToolPlugin verwenden, anstatt die Metadaten des Plugin-Manifests manuell zu schreiben
    - Sie müssen ein ausschließlich aus Tools bestehendes Plugin vorbereiten, generieren, validieren, testen oder veröffentlichen
sidebarTitle: Tool Plugins
summary: Erstellen Sie einfache typisierte Agent-Tools mit defineToolPlugin und openclaw plugins init/build/validate
title: Tool-Plugins
x-i18n:
    generated_at: "2026-07-16T13:28:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` erstellt ein Plugin, das ausschließlich vom Agenten aufrufbare Tools hinzufügt: keinen
Kanal, Modell-Provider, Hook, Dienst oder Einrichtungs-Backend. Es generiert die
Manifest-Metadaten, die OpenClaw benötigt, um Tools zu erkennen, ohne den
Plugin-Laufzeitcode zu laden.

Für Provider-, Kanal-, Hook-, Dienst- oder Plugins mit gemischten Fähigkeiten beginnen Sie
stattdessen mit [Plugins erstellen](/de/plugins/building-plugins), [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
oder [Provider-Plugins](/de/plugins/sdk-provider-plugins).

## Anforderungen

- Node 22.22.3+, Node 24.15+ oder Node 25.9+.
- TypeScript-ESM-Paketausgabe.
- `typebox` in `dependencies` (nicht nur `devDependencies` – das generierte
  Plugin importiert es zur Laufzeit).
- `openclaw >=2026.5.17`, die erste Version, die
  `openclaw/plugin-sdk/tool-plugin` exportiert.
- Ein Paketstamm, der `dist/`, `openclaw.plugin.json` und
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

`plugins init` erzeugt das Grundgerüst für:

| Datei                   | Zweck                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | `defineToolPlugin`-Einstieg mit einem `echo`-Tool                     |
| `src/index.test.ts`    | Metadatentest, der die Tool-Liste prüft                             |
| `tsconfig.json`        | NodeNext-TypeScript-Ausgabe nach `dist/`                             |
| `vitest.config.ts`     | Vitest-Konfiguration für `src/**/*.test.ts`                              |
| `package.json`         | Skripte, Laufzeitabhängigkeiten, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Generierte Manifest-Metadaten für das ursprüngliche Tool                  |

`npm run plugin:build` führt `npm run build` (tsc) und anschließend
`openclaw plugins build --entry ./dist/index.js` aus. `npm run plugin:validate`
erstellt neu und führt `openclaw plugins validate --entry ./dist/index.js` aus.
Bei erfolgreicher Validierung wird Folgendes ausgegeben:

```text
Plugin stock-quotes ist gültig.
```

Optionen für `openclaw plugins init <id>`:

| Flag                 | Standardwert            | Wirkung                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Ausgabeverzeichnis                       |
| `--name <name>`      | `<id>` in Titelschreibweise | Anzeigename                           |
| `--type <type>`      | `tool`             | Grundgerüsttyp: `tool` oder `provider`    |
| `--force`            | deaktiviert                | Vorhandenes Ausgabeverzeichnis überschreiben |

## Ein Tool schreiben

`defineToolPlugin` akzeptiert die Plugin-Identität, ein optionales Konfigurationsschema und eine
statische Tool-Liste. Parameter- und Konfigurationstypen werden aus den
TypeBox-Schemas abgeleitet.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Aktienkurs-Snapshots abrufen.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Kurs-API-Schlüssel." })),
    baseUrl: Type.Optional(Type.String({ description: "Basis-URL der Kurs-API." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Aktienkurs",
      description: "Einen Aktienkurs-Snapshot abrufen.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Tickersymbol, zum Beispiel OPEN." }),
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

Tool-Namen bilden die stabile API. Wählen Sie eindeutige, kleingeschriebene Namen, die
spezifisch genug sind, um Kollisionen mit Core-Tools oder anderen Plugins zu vermeiden.

## Optionale Tools und Factory-Tools

Setzen Sie `optional: true`, wenn Benutzer das Tool ausdrücklich in die Positivliste aufnehmen sollen, bevor es
an ein Modell gesendet wird. `openclaw plugins build` schreibt den entsprechenden
`toolMetadata.<tool>.optional`-Manifesteintrag, damit OpenClaw erkennen kann, dass das
Tool optional ist, ohne den Plugin-Laufzeitcode zu laden.

```typescript
tool({
  name: "workflow_run",
  description: "Einen externen Workflow ausführen.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Verwenden Sie `factory`, wenn ein Tool den Laufzeit-Tool-Kontext benötigt, bevor es
erstellt werden kann – um es für einen bestimmten Lauf auszuschließen, den Sandbox-Status zu prüfen oder
Laufzeit-Hilfsfunktionen zu binden. Die Metadaten bleiben statisch, obwohl das konkrete Tool
zur Laufzeit erstellt wird.

```typescript
tool({
  name: "local_workflow",
  description: "Einen lokalen Workflow außerhalb von Sandbox-Sitzungen ausführen.",
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

Factories deklarieren weiterhin im Voraus einen festen Tool-Namen. Verwenden Sie `definePluginEntry`
direkt, wenn das Plugin Tool-Namen dynamisch berechnet oder Tools
mit Hooks, Diensten, Providern oder Befehlen kombiniert.

## Rückgabewerte

`defineToolPlugin` verpackt einfache Rückgabewerte in das OpenClaw-Tool-Ergebnisformat:

- Geben Sie eine Zeichenfolge zurück, wenn das Modell genau diesen Text sehen soll.
- Geben Sie einen JSON-kompatiblen Wert zurück, wenn das Modell formatiertes JSON sehen
  und OpenClaw den ursprünglichen Wert in `details` beibehalten soll.

```typescript
tool({
  name: "echo_text",
  description: "Eingabetext zurückgeben.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Eingabe als strukturiertes JSON zurückgeben.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Verwenden Sie ein Factory-Tool, wenn Sie ein benutzerdefiniertes `AgentToolResult` benötigen oder eine
vorhandene `api.registerTool`-Implementierung wiederverwenden möchten.

## Konfiguration

`configSchema` ist optional. Lassen Sie es weg, wendet OpenClaw ein striktes Schema für ein leeres Objekt
an; das generierte Manifest enthält weiterhin `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Keine Konfigurationstools",
  description: "Fügt Tools hinzu, die keine Konfiguration benötigen.",
  tools: () => [],
});
```

Mit einem `configSchema` wird der Typ des zweiten `execute`-Arguments daraus abgeleitet:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Konfigurierte Tools",
  description: "Fügt konfigurierte Tools hinzu.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Prüfen, ob eine Konfiguration verfügbar ist.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw liest die Plugin-Konfiguration aus dem Eintrag des Plugins in der Gateway-Konfiguration. Codieren
Sie Geheimnisse nicht fest im Quellcode oder in Dokumentationsbeispielen; verwenden Sie gemäß dem Sicherheitsmodell
des Plugins die Konfiguration, Umgebungsvariablen oder SecretRefs.

## Generierte Metadaten

OpenClaw muss das Plugin-Manifest lesen, bevor der Plugin-Laufzeitcode importiert wird.
`defineToolPlugin` stellt dafür statische Metadaten bereit, und
`openclaw plugins build` schreibt sie in das Paket. Führen Sie den Generator erneut aus, nachdem
Sie Plugin-ID, Namen, Beschreibung, Konfigurationsschema, Aktivierung oder Tool-Namen
geändert haben:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Generiertes Manifest für ein Plugin mit einem Tool:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Aktienkurs-Snapshots abrufen.",
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

`contracts.tools` ist der wichtige Erkennungsvertrag: Er teilt OpenClaw mit, welches
Plugin jedes Tool besitzt, ohne die Laufzeit jedes installierten Plugins zu laden. Ein
veraltetes Manifest kann dazu führen, dass ein Tool bei der Erkennung fehlt oder ein Registrierungsfehler
dem falschen Plugin zugeschrieben wird.

## Paketmetadaten

`openclaw plugins build` richtet außerdem `package.json` am ausgewählten Laufzeit-
Einstieg aus:

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

Liefern Sie erstelltes JavaScript (`./dist/index.js`) aus, keinen TypeScript-Quellcode-Einstieg.
Quellcode-Einstiege funktionieren nur für die lokale Entwicklung im Workspace.

## In CI validieren

`plugins build --check` schlägt fehl, ohne Dateien neu zu schreiben, wenn generierte Metadaten
veraltet sind:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` prüft Folgendes:

- `openclaw.plugin.json` ist vorhanden und besteht den normalen Manifest-Loader.
- Der aktuelle Einstieg exportiert `defineToolPlugin`-Metadaten.
- Die generierten Manifestfelder stimmen mit den Einstiegsmetadaten überein.
- `contracts.tools` stimmt mit den deklarierten Tool-Namen überein.
- `package.json` verweist mit `openclaw.extensions` auf den ausgewählten Laufzeiteinstieg.

## Lokal installieren und prüfen

Installieren Sie den Paketpfad aus einem separaten OpenClaw-Checkout oder über eine installierte CLI:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Für einen Smoke-Test des gepackten Pakets erstellen Sie zunächst das Paket und installieren anschließend den Tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Starten oder laden Sie nach der Installation den Gateway neu und bitten Sie den Agenten, das
Tool zu verwenden. Wenn das Tool nicht sichtbar ist, prüfen Sie die Plugin-Laufzeit und den effektiven
Tool-Katalog, bevor Sie den Code ändern (siehe [Fehlerbehebung](#troubleshooting)).

## Veröffentlichen

Veröffentlichen Sie über ClawHub, sobald das Paket bereit ist. `clawhub package publish`
akzeptiert eine Quelle: einen lokalen Ordner, ein GitHub-Repository (`owner/repo[@ref]`) oder eine
Tarball-URL.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installieren Sie mit einem expliziten ClawHub-Locator:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Reine npm-Paketspezifikationen werden während der Umstellung beim Start weiterhin von npm installiert, aber
ClawHub ist die bevorzugte Erkennungs- und Verteilungsoberfläche für OpenClaw-
Plugins. Informationen zum Eigentümerbereich und zur Release-Prüfung finden Sie unter [Veröffentlichung auf ClawHub](/de/clawhub/publishing).

## Fehlerbehebung

### `plugin entry not found: ./dist/index.js`

Die ausgewählte Einstiegsdatei ist nicht vorhanden. Führen Sie `npm run build` aus und anschließend erneut
`openclaw plugins build --entry ./dist/index.js` oder
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Der Einstieg hat keinen von `defineToolPlugin` erstellten Wert exportiert. Bestätigen Sie, dass der
Standardexport des Moduls das Ergebnis von `defineToolPlugin(...)` ist, oder übergeben Sie mit
`--entry` den richtigen Einstieg.

### `openclaw.plugin.json generated metadata is stale`

Das Manifest stimmt nicht mehr mit den Einstiegsmetadaten überein. Führen Sie Folgendes aus:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Committen Sie sowohl die Änderungen an `openclaw.plugin.json` als auch an `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Die Paketmetadaten verweisen auf einen anderen Laufzeiteinstieg. Führen Sie
`openclaw plugins build --entry ./dist/index.js` aus, damit der Generator die
Paketmetadaten am Einstieg ausrichtet, den Sie ausliefern möchten.

### `Cannot find package 'typebox'`

Das erstellte Plugin importiert `typebox` zur Laufzeit. Behalten Sie es in `dependencies`,
installieren und erstellen Sie erneut und führen Sie die Validierung noch einmal aus.

### Tool erscheint nach der Installation nicht

Prüfen Sie Folgendes in dieser Reihenfolge:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` verfügt über `contracts.tools` mit den erwarteten Tool-Namen.
4. `package.json` verfügt über `openclaw.extensions: ["./dist/index.js"]`.
5. Der Gateway wurde nach der Installation des Plugins neu gestartet oder neu geladen.

## Siehe auch

- [Plugins entwickeln](/de/plugins/building-plugins)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-CLI](/de/cli/plugins)
- [Veröffentlichung auf ClawHub](/de/clawhub/publishing)
