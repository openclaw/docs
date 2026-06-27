---
read_when:
    - Sie benötigen die exakte Typsignatur von defineToolPlugin, definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten)
    - Sie sehen Optionen für Einstiegspunkte nach
sidebarTitle: Entry Points
summary: Referenz für defineToolPlugin, definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-06-27T17:58:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein Standard-Einstiegsobjekt. Das SDK stellt Hilfsfunktionen zum
Erstellen dieser Objekte bereit.

Für installierte Plugins sollte `package.json` das Laden zur Laufzeit auf gebautes
JavaScript verweisen, wenn verfügbar:

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

`extensions` und `setupEntry` bleiben gültige Quelleinstiege für die Entwicklung
in Workspaces und Git-Checkouts. `runtimeExtensions` und `runtimeSetupEntry`
werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und ermöglichen
npm-Paketen, TypeScript-Kompilierung zur Laufzeit zu vermeiden. Explizite
Laufzeiteinstiege sind erforderlich: `runtimeSetupEntry` erfordert `setupEntry`,
und fehlende `runtimeExtensions`- oder `runtimeSetupEntry`-Artefakte lassen
Installation/Erkennung fehlschlagen, statt stillschweigend auf Quellen
zurückzufallen. Wenn ein installiertes Paket nur einen TypeScript-Quelleinstieg
deklariert, verwendet OpenClaw ein passendes gebautes `dist/*.js`-Gegenstück,
wenn eines vorhanden ist, und fällt danach auf die TypeScript-Quelle zurück.

Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben.
Laufzeiteinstiege und abgeleitete gebaute JavaScript-Gegenstücke machen keinen
ausbrechenden `extensions`- oder `setupEntry`-Quellpfad gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Tool-Plugins](/de/plugins/tool-plugins),
  [Channel-Plugins](/de/plugins/sdk-channel-plugins) oder
  [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen.
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Für einfache Plugins, die nur Agent-Tools hinzufügen. `defineToolPlugin` hält die
Autor-Quelle klein, leitet Konfigurations- und Tool-Parametertypen aus TypeBox-
Schemas ab, verpackt einfache Rückgabewerte im OpenClaw-Tool-Ergebnisformat und
stellt statische Metadaten bereit, die `openclaw plugins build` in das
Plugin-Manifest schreibt.

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

- `configSchema` ist optional. Wenn es weggelassen wird, verwendet OpenClaw ein
  striktes leeres Objektschema, und das generierte Manifest enthält weiterhin
  `configSchema`.
- `execute` gibt eine einfache Zeichenfolge oder einen JSON-serialisierbaren Wert
  zurück. Die Hilfsfunktion verpackt ihn als Text-Tool-Ergebnis mit `details`.
- Tool-Namen sind statisch. `openclaw plugins build` leitet `contracts.tools`
  aus den deklarierten Tools ab, sodass Autoren Namen nicht manuell duplizieren.
- Das Laden zur Laufzeit bleibt strikt. Installierte Plugins benötigen weiterhin
  `openclaw.plugin.json` und `package.json` `openclaw.extensions`; OpenClaw
  führt keinen Plugin-Code aus, um fehlende Manifestdaten abzuleiten.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, erweiterte Tool-Plugins, Hook-Plugins und alles, was
**kein** Nachrichtenkanal ist.

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

| Feld           | Typ                                                              | Erforderlich | Standard             |
| -------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`           | `string`                                                         | Ja           | -                    |
| `name`         | `string`                                                         | Ja           | -                    |
| `description`  | `string`                                                         | Ja           | -                    |
| `kind`         | `string`                                                         | Nein         | -                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | -                    |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion für verzögerte Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und merkt es sich, sodass
  teure Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit channelspezifischer Verkabelung. Ruft
automatisch `api.registerChannel({ plugin })` auf, stellt eine optionale
Metadaten-Schnittstelle für Root-Hilfe der CLI bereit und beschränkt
`registerFull` auf den Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standard             |
| --------------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`                  | `string`                                                         | Ja           | -                    |
| `name`                | `string`                                                         | Ja           | -                    |
| `description`         | `string`                                                         | Ja           | -                    |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                    |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die
  Laufzeitreferenz speichern können (typischerweise über
  `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten wird es
  übersprungen.
- `registerCliMetadata` läuft während `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` und
  `api.registrationMode === "full"`.
  Verwenden Sie es als kanonischen Ort für channeleigene CLI-Deskriptoren, damit
  Root-Hilfe nicht aktivierend bleibt, Erkennungs-Snapshots statische
  Befehlsmetadaten enthalten und die normale CLI-Befehlsregistrierung mit
  vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- Die Erkennungsregistrierung ist nicht aktivierend, aber nicht importfrei.
  OpenClaw kann den vertrauenswürdigen Plugin-Einstieg und das Channel-Plugin-
  Modul auswerten, um den Snapshot zu erstellen. Halten Sie daher Top-Level-
  Imports frei von Seiteneffekten und platzieren Sie Sockets, Clients, Worker und
  Dienste hinter Pfaden, die nur für `"full"` gelten.
- `registerFull` läuft nur, wenn `api.registrationMode === "full"` ist. Beim
  Laden nur für die Einrichtung wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine verzögerte Factory sein,
  und OpenClaw merkt sich das aufgelöste Schema beim ersten Zugriff.
- Für plugin-eigene Root-CLI-Befehle bevorzugen Sie
  `api.registerCli(..., { descriptors: [...] })`, wenn der Befehl verzögert
  geladen bleiben soll, ohne aus dem Parse-Baum der Root-CLI zu verschwinden.
  Für Funktionsbefehle gekoppelter Knoten bevorzugen Sie
  `api.registerNodeCliFeature(...)`, damit der Befehl unter `openclaw nodes`
  landet. Für andere verschachtelte Plugin-Befehle fügen Sie `parentPath` hinzu
  und registrieren Befehle am `program`-Objekt, das an den Registrar übergeben
  wird; OpenClaw löst es auf den übergeordneten Befehl auf, bevor das Plugin
  aufgerufen wird. Für Channel-Plugins bevorzugen Sie, diese Deskriptoren aus
  `registerCliMetadata(...)` zu registrieren, und halten Sie `registerFull(...)`
  auf reine Laufzeitarbeit fokussiert.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, halten Sie sie
  unter einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` erzwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne Laufzeit-
oder CLI-Verkabelung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies statt des vollständigen Einstiegs, wenn ein Channel deaktiviert
oder nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe
[Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry), wann dies
relevant ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen
Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für laufzeitsichere Setup-Hilfsfunktionen
  wie `createSetupTranslator`, importsichere Setup-Patch-Adapter,
  Lookup-Note-Ausgabe, `promptResolvedAllowFrom`, `splitSetupEntries` und
  delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für Setup-Oberflächen optionaler
  Installationen
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Docs-
  Hilfsfunktionen

Behalten Sie schwere SDKs, CLI-Registrierung und langlebige Laufzeitdienste im
vollständigen Einstieg.

Gebündelte Workspace-Channels, die Setup- und Laufzeitoberflächen trennen, können
stattdessen `defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht
dem Setup-Einstieg, setup-sichere Plugin-/Secrets-Exporte beizubehalten und
gleichzeitig einen Laufzeit-Setter bereitzustellen:

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
        /* setup-safe route */
      },
    });
  },
});
```

Verwenden Sie diesen gebündelten Vertrag nur, wenn Setup-Abläufe wirklich einen
schlanken Laufzeit-Setter oder eine setup-sichere Gateway-Oberfläche benötigen,
bevor der vollständige Channel-Einstieg geladen wird. `registerSetupRuntime`
läuft nur für `"setup-runtime"`-Ladevorgänge; beschränken Sie es auf reine
Konfigurationsrouten oder Methoden, die vor der verzögerten vollständigen
Aktivierung existieren müssen.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                              | Was zu registrieren ist                                                                                                       |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start            | Alles                                                                                                                         |
| `"discovery"`     | Schreibgeschützte Capability-Erkennung | Channel-Registrierung plus statische CLI-Deskriptoren; Einstiegscode darf geladen werden, aber Sockets, Worker, Clients und Dienste überspringen |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Channel | Nur Channel-Registrierung                                                                                                     |
| `"setup-runtime"` | Setup-Ablauf mit verfügbarer Runtime | Channel-Registrierung plus nur die leichtgewichtige Runtime, die benötigt wird, bevor der vollständige Einstieg lädt           |
| `"cli-metadata"`  | Root-Hilfe / CLI-Metadatenerfassung | Nur CLI-Deskriptoren                                                                                                          |

`defineChannelPluginEntry` verarbeitet diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Channel verwenden, prüfen Sie den Modus selbst:

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

Der Discovery-Modus erstellt einen nicht aktivierenden Registry-Snapshot. Er darf
weiterhin den Plugin-Einstieg und das Channel-Plugin-Objekt auswerten, damit OpenClaw
Channel-Capabilities und statische CLI-Deskriptoren registrieren kann. Behandeln Sie
die Modulauswertung bei der Discovery als vertrauenswürdig, aber leichtgewichtig:
keine Netzwerk-Clients, Subprozesse, Listener, Datenbankverbindungen,
Hintergrund-Worker, Lesevorgänge für Anmeldedaten oder andere Live-Runtime-Nebeneffekte
auf oberster Ebene.

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem setup-only-Startoberflächen
vorhanden sein müssen, ohne erneut in die vollständige gebündelte Channel-Runtime
einzutreten. Gut geeignet sind Channel-Registrierung, setup-sichere HTTP-Routen,
setup-sichere Gateway-Methoden und delegierte Setup-Helfer. Schwere Hintergrunddienste,
CLI-Registrare und Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare gilt:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das echte CLI-Modul beim ersten Aufruf lazy lädt
- stellen Sie sicher, dass diese Deskriptoren jeden vom Registrar offengelegten Befehlsstamm der obersten Ebene abdecken
- beschränken Sie Deskriptor-Befehlsnamen auf Buchstaben, Zahlen, Bindestrich und Unterstrich,
  beginnend mit einem Buchstaben oder einer Zahl; OpenClaw weist Deskriptornamen außerhalb
  dieser Form zurück und entfernt terminale Steuersequenzen aus Beschreibungen, bevor
  Hilfe gerendert wird
- verwenden Sie `commands` allein nur für eager geladene Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                  | Beschreibung                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Capability-Typ (z. B. nur Provider)           |
| **hybrid-capability** | Mehrere Capability-Typen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Capabilities                     |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Capabilities    |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins zu sehen.

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview) - Registrierungs-API und Subpath-Referenz
- [Runtime-Helfer](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Setup und Konfiguration](/de/plugins/sdk-setup) - Manifest, Setup-Einstieg, verzögertes Laden
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
