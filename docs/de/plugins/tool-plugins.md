---
read_when:
    - Sie möchten ein einfaches OpenClaw-Plugin erstellen, das lediglich Agent-Tools hinzufügt
    - Sie möchten `defineToolPlugin` verwenden, anstatt die Metadaten des Plugin-Manifests manuell zu schreiben
    - Sie müssen ein reines Tool-Plugin einrichten, generieren, validieren, testen oder veröffentlichen.
sidebarTitle: Tool Plugins
summary: Erstellen Sie einfache typisierte Agent-Tools mit defineToolPlugin und openclaw plugins init/build/validate
title: Tool-Plugins
x-i18n:
    generated_at: "2026-07-24T04:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac23d15ba79cbdd1d8b8eab7c87007b44af16361b2866b14123e18f816bf4075
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` erstellt ein Plugin, das ausschließlich von Agenten aufrufbare Tools hinzufügt: keinen
Kanal, Modell-Provider, Hook, Dienst und kein Einrichtungs-Backend. Es generiert die
Manifest-Metadaten, die OpenClaw benötigt, um Tools zu erkennen, ohne den
Plugin-Laufzeitcode zu laden.

Für Provider-, Kanal-, Hook-, Dienst- oder Plugins mit gemischten Funktionen beginnen Sie
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

| Datei                  | Zweck                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | `defineToolPlugin`-Einstieg mit einem `echo`-Tool                 |
| `src/index.test.ts`    | Metadatentest, der die Tool-Liste überprüft                       |
| `tsconfig.json`        | NodeNext-TypeScript-Ausgabe nach `dist/`                          |
| `vitest.config.ts`     | Vitest-Konfiguration für `src/**/*.test.ts`                        |
| `package.json`         | Skripte, Laufzeitabhängigkeiten, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Generierte Manifest-Metadaten für das anfängliche Tool            |

`npm run plugin:build` führt `npm run build` (tsc) und anschließend
`openclaw plugins build --entry ./dist/index.js` aus. `npm run plugin:validate`
erstellt das Projekt neu und führt `openclaw plugins validate --entry ./dist/index.js` aus.
Bei erfolgreicher Validierung wird Folgendes ausgegeben:

```text
Plugin stock-quotes ist gültig.
```

Optionen für `openclaw plugins init <id>`:

| Flag                 | Standardwert       | Wirkung                                |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Ausgabeverzeichnis                     |
| `--name <name>`      | `<id>` in Titelschreibweise | Anzeigename                |
| `--type <type>`      | `tool`             | Grundgerüsttyp: `tool` oder `provider` |
| `--force`            | aus                | Ein vorhandenes Ausgabeverzeichnis überschreiben |

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
  description: "Aktuelle Kursdaten abrufen.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API-Schlüssel für Kursdaten." })),
    baseUrl: Type.Optional(Type.String({ description: "Basis-URL der Kursdaten-API." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Aktueller Kurs",
      description: "Aktuelle Kursdaten abrufen.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Tickersymbol, zum Beispiel OPEN." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
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
spezifisch genug sind, um Kollisionen mit Kern-Tools oder anderen Plugins zu vermeiden.

## Optionale und Factory-Tools

Legen Sie `optional: true` fest, wenn Benutzer das Tool ausdrücklich in die Zulassungsliste aufnehmen sollen, bevor es
an ein Modell gesendet wird. `openclaw plugins build` schreibt den entsprechenden
`toolMetadata.<tool>.optional`-Manifesteintrag, sodass OpenClaw erkennen kann, dass das
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

`defineToolPlugin` verpackt einfache Rückgabewerte in das Tool-Ergebnisformat
von OpenClaw:

- Geben Sie eine Zeichenfolge zurück, wenn das Modell genau diesen Text sehen soll.
- Geben Sie einen JSON-kompatiblen Wert zurück, wenn das Modell formatiertes JSON sehen
  und OpenClaw den ursprünglichen Wert in `details` beibehalten soll.

```typescript
tool({
  name: "echo_text",
  description: "Eingabetext wiedergeben.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Eingabe als strukturiertes JSON wiedergeben.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Verwenden Sie ein Factory-Tool, wenn Sie ein benutzerdefiniertes `AgentToolResult` benötigen oder eine
vorhandene `api.registerTool`-Implementierung wiederverwenden möchten.

## Ausgabeverträge

Fügen Sie `outputSchema` hinzu, wenn ein Tool stabile JSON-kompatible Daten zurückgibt. Es beschreibt
den ursprünglichen, in `AgentToolResult.details` gespeicherten Wert, nicht den formatierten Text
in `content`:

```typescript
tool({
  name: "shipment_list",
  description: "Sendungen auflisten.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[Code Mode](/de/tools/code-mode) und [Tool Search](/de/tools/tool-search) wandeln dieses
Schema in einen begrenzten Ausgabehinweis im TypeScript-Stil um. Dadurch kann ein Modell ein bekanntes
Ergebnis in einem Programm aufrufen und transformieren, statt eine weitere Modellrunde dafür aufzuwenden,
dessen Struktur zu untersuchen.

OpenClaw kompiliert das Schema vor der Ausführung eines Katalogaufrufs und validiert anschließend den
endgültigen Wert `details` nach den Tool-Hooks, bevor es ihn über die Bridge zurückgibt.
Mit einem ungültigen Schema kann das Tool nicht ausgeführt werden; eine Abweichung des Ergebnisses lässt den abgeschlossenen
Aufruf fehlschlagen. Berücksichtigen Sie jede Variante eines Ergebnisses, das keine Ausnahme auslöst, einschließlich strukturierter
Fehlervarianten, oder lassen Sie das Schema weg, wenn das Ergebnis nicht stabil ist. Nehmen Sie keine Geheimnisse
oder sensiblen Werte in Schemabeschreibungen auf, da vertrauenswürdige Ausgabemetadaten
für das Modell sichtbar werden können.
Verwenden Sie `{ additionalProperties: false }` auf Objektebenen, wenn Sie einen vollständigen,
kompakten Ausgabehinweis wünschen; offene oder abgeschnittene Schemas bleiben über
`tools.describe(...)` verfügbar, werden jedoch nicht als vollständige Schnellindexverträge beworben.

Factory-Tools deklarieren `outputSchema` auf dem konkreten `AnyAgentTool`, das sie
zurückgeben. Die statische `tool({ factory })`-Deklaration akzeptiert kein separates
Ausgabeschema, da es vom Laufzeit-Tool abweichen könnte.

## Konfiguration

`configSchema` ist optional. Wenn Sie es weglassen, wendet OpenClaw ein striktes Schema für ein leeres Objekt
an; das generierte Manifest enthält weiterhin `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Tools ohne Konfiguration",
  description: "Fügt Tools hinzu, die keine Konfiguration benötigen.",
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

OpenClaw liest die Plugin-Konfiguration aus dem Eintrag des Plugins in der Gateway-Konfiguration. Betten
Sie keine Geheimnisse fest in den Quellcode oder Dokumentationsbeispiele ein; verwenden Sie entsprechend dem Sicherheitsmodell
des Plugins die Konfiguration, Umgebungsvariablen oder SecretRefs.

## Generierte Metadaten

OpenClaw muss das Plugin-Manifest lesen, bevor es den Plugin-Laufzeitcode importiert.
`defineToolPlugin` stellt dafür statische Metadaten bereit und
`openclaw plugins build` schreibt sie in das Paket. Führen Sie den Generator erneut aus, nachdem Sie
Plugin-ID, Name, Beschreibung, Konfigurationsschema, Aktivierung oder Tool-Namen
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
  "description": "Aktuelle Kursdaten abrufen.",
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
Plugin das jeweilige Tool bereitstellt, ohne die Laufzeit jedes installierten Plugins zu laden. Ein
veraltetes Manifest kann dazu führen, dass ein Tool bei der Erkennung fehlt oder ein Registrierungsfehler
dem falschen Plugin zugeschrieben wird.

## Paketmetadaten

`openclaw plugins build` richtet außerdem `package.json` am ausgewählten
Laufzeiteinstieg aus:

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

Liefern Sie kompiliertes JavaScript (`./dist/index.js`) aus, keinen TypeScript-Quellcode-Einstieg.
Quellcode-Einstiege funktionieren nur für die Workspace-lokale Entwicklung.

## In der CI validieren

`plugins build --check` schlägt ohne Neuschreiben von Dateien fehl, wenn die generierten Metadaten
veraltet sind:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

Die Kompatibilitätsfelder des OpenClaw SDK enthalten TypeScript-`@deprecated`-Annotationen,
die Editoren als Migrationswarnungen anzeigen. Um sie in der CI durchzusetzen, aktivieren Sie eine
typbewusste Regel wie
[`@typescript-eslint/no-deprecated`](https://typescript-eslint.io/rules/no-deprecated/).
Oxlint ist nicht typbewusst und kann diese Annotationen daher nicht durchsetzen. Das generierte
`plugins init`-Grundgerüst fügt deshalb keine Lint-Konfiguration für veraltete APIs hinzu.

`plugins validate` prüft Folgendes:

- `openclaw.plugin.json` ist vorhanden und durchläuft den normalen Manifest-Loader erfolgreich.
- Der aktuelle Einstiegspunkt exportiert `defineToolPlugin`-Metadaten.
- Die generierten Manifest-Felder stimmen mit den Metadaten des Einstiegspunkts überein.
- `contracts.tools` stimmt mit den deklarierten Tool-Namen überein.
- `package.json` verweist für `openclaw.extensions` auf den ausgewählten Laufzeit-Einstiegspunkt.

## Lokal installieren und untersuchen

Installieren Sie den Paketpfad aus einem separaten OpenClaw-Checkout oder einer installierten CLI:

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

Starten oder laden Sie nach der Installation den Gateway neu und fordern Sie den Agenten auf, das
Tool zu verwenden. Wenn das Tool nicht sichtbar ist, untersuchen Sie die Plugin-Laufzeit und den effektiven
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

Reine npm-Paketspezifikationen werden während der Umstellung zur Einführung weiterhin von npm installiert,
ClawHub ist jedoch die bevorzugte Oberfläche zur Auffindung und Verteilung von OpenClaw-
Plugins. Informationen zum Eigentümerbereich und zur Release-Prüfung finden Sie unter [Veröffentlichen über ClawHub](/de/clawhub/publishing).

## Fehlerbehebung

### `plugin entry not found: ./dist/index.js`

Die ausgewählte Einstiegspunktdatei ist nicht vorhanden. Führen Sie `npm run build` aus und führen Sie anschließend
`openclaw plugins build --entry ./dist/index.js` oder
`openclaw plugins validate --entry ./dist/index.js` erneut aus.

### `plugin entry does not expose defineToolPlugin metadata`

Der Einstiegspunkt hat keinen mit `defineToolPlugin` erstellten Wert exportiert. Vergewissern Sie sich, dass der
Standardexport des Moduls das Ergebnis von `defineToolPlugin(...)` ist, oder geben Sie mit
`--entry` den richtigen Einstiegspunkt an.

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
Paketmetadaten mit dem Einstiegspunkt abgleicht, den Sie ausliefern möchten.

### `Cannot find package 'typebox'`

Das erstellte Plugin importiert zur Laufzeit `typebox`. Behalten Sie es in `dependencies`,
installieren und erstellen Sie es erneut und führen Sie die Validierung noch einmal aus.

### Tool wird nach der Installation nicht angezeigt

Prüfen Sie Folgendes in dieser Reihenfolge:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` enthält `contracts.tools` mit den erwarteten Tool-Namen.
4. `package.json` enthält `openclaw.extensions: ["./dist/index.js"]`.
5. Der Gateway wurde nach der Installation des Plugins neu gestartet oder neu geladen.

## Siehe auch

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Einstiegspunkte](/de/plugins/sdk-entrypoints)
- [Unterpfade des Plugin SDK](/de/plugins/sdk-subpaths)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugins-CLI](/de/cli/plugins)
- [Veröffentlichen über ClawHub](/de/clawhub/publishing)
