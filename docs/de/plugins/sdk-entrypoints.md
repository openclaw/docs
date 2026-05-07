---
read_when:
    - Sie benötigen die exakte Typsignatur von definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten)
    - Sie suchen nach Optionen für Einstiegspunkte
sidebarTitle: Entry Points
summary: Referenz für definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-05-07T13:23:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein standardmäßiges Entry-Objekt. Das SDK stellt drei Hilfsfunktionen zum Erstellen bereit.

Für installierte Plugins sollte `package.json` das Runtime-Laden auf gebautes JavaScript verweisen, wenn verfügbar:

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

`extensions` und `setupEntry` bleiben gültige Quell-Entries für Workspace- und Git-Checkout-Entwicklung. `runtimeExtensions` und `runtimeSetupEntry` werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und ermöglichen npm-Paketen, Runtime-TypeScript-Kompilierung zu vermeiden. Explizite Runtime-Entries sind erforderlich: `runtimeSetupEntry` erfordert `setupEntry`, und fehlende `runtimeExtensions`- oder `runtimeSetupEntry`-Artefakte lassen Installation/Discovery fehlschlagen, statt stillschweigend auf die Quelle zurückzufallen. Wenn ein installiertes Paket nur einen TypeScript-Quell-Entry deklariert, verwendet OpenClaw einen passenden gebauten `dist/*.js`-Peer, wenn einer vorhanden ist, und fällt dann auf die TypeScript-Quelle zurück.

Alle Entry-Pfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Runtime-Entries und abgeleitete gebaute JavaScript-Peers machen einen ausbrechenden `extensions`- oder `setupEntry`-Quellpfad nicht gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, Tool-Plugins, Hook-Plugins und alles, was **kein**
Messaging-Channel ist.

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

| Feld           | Typ                                                              | Erforderlich | Standard              |
| -------------- | ---------------------------------------------------------------- | ------------ | --------------------- |
| `id`           | `string`                                                         | Ja           | -                     |
| `name`         | `string`                                                         | Ja           | -                     |
| `description`  | `string`                                                         | Ja           | -                     |
| `kind`         | `string`                                                         | Nein         | -                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | -                     |

- `id` muss Ihrem `openclaw.plugin.json`-Manifest entsprechen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion für Lazy-Evaluation sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass aufwendige Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit channelspezifischer Verdrahtung. Ruft automatisch `api.registerChannel({ plugin })` auf, stellt eine optionale Root-Help-CLI-Metadaten-Seam bereit und beschränkt `registerFull` auf den Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standard              |
| --------------------- | ---------------------------------------------------------------- | ------------ | --------------------- |
| `id`                  | `string`                                                         | Ja           | -                     |
| `name`                | `string`                                                         | Ja           | -                     |
| `description`         | `string`                                                         | Ja           | -                     |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                     |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die Runtime-Referenz speichern können (typischerweise über `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten wird es übersprungen.
- `registerCliMetadata` läuft während `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` und
  `api.registrationMode === "full"`.
  Verwenden Sie es als kanonischen Ort für channel-eigene CLI-Deskriptoren, damit die Root-Hilfe nicht aktivierend bleibt, Discovery-Snapshots statische Befehlsmetadaten enthalten und die normale CLI-Befehlsregistrierung mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- Discovery-Registrierung ist nicht aktivierend, aber nicht importfrei. OpenClaw kann den vertrauenswürdigen Plugin-Entry und das Channel-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie daher Top-Level-Imports frei von Seiteneffekten und legen Sie Sockets, Clients, Worker und Dienste hinter Pfade, die nur für `"full"` verwendet werden.
- `registerFull` läuft nur, wenn `api.registrationMode === "full"`. Während setup-only-Laden wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy-Factory sein, und OpenClaw memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für Plugin-eigene Root-CLI-Befehle bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`, wenn der Befehl lazy-loaded bleiben soll, ohne aus dem Root-CLI-Parse-Baum zu verschwinden. Für Paired-Node-Feature-Befehle bevorzugen Sie `api.registerNodeCliFeature(...)`, damit der Befehl unter `openclaw nodes` landet. Für andere verschachtelte Plugin-Befehle fügen Sie `parentPath` hinzu und registrieren Befehle am `program`-Objekt, das an den Registrar übergeben wird; OpenClaw löst es vor dem Aufruf des Plugins zum übergeordneten Befehl auf. Für Channel-Plugins bevorzugen Sie, diese Deskriptoren aus `registerCliMetadata(...)` zu registrieren, und halten Sie `registerFull(...)` auf reine Runtime-Arbeit fokussiert.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, behalten Sie sie auf einem Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu `operator.admin` erzwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne Runtime- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Entry, wenn ein Channel deaktiviert oder nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry), wann dies relevant ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für runtime-sichere Setup-Hilfsfunktionen wie importsichere Setup-Patch-Adapter, Lookup-Note-Ausgabe, `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für Setup-Oberflächen für optionale Installation
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentationshilfen

Belassen Sie schwere SDKs, CLI-Registrierung und langlebige Runtime-Dienste im vollständigen Entry.

Gebündelte Workspace-Channels, die Setup- und Runtime-Oberflächen trennen, können stattdessen `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht dem Setup-Entry, setup-sichere Plugin-/Secrets-Exporte beizubehalten und dennoch einen Runtime-Setter bereitzustellen:

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

Verwenden Sie diesen gebündelten Vertrag nur, wenn Setup-Flows wirklich einen schlanken Runtime-Setter benötigen, bevor der vollständige Channel-Entry geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                              | Was registriert werden soll                                                                                                      |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start            | Alles                                                                                                                            |
| `"discovery"`     | Schreibgeschützte Capability-Discovery | Channel-Registrierung plus statische CLI-Deskriptoren; Entry-Code kann laden, aber überspringen Sie Sockets, Worker, Clients und Dienste |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Channel | Nur Channel-Registrierung                                                                                                        |
| `"setup-runtime"` | Setup-Flow mit verfügbarer Runtime | Channel-Registrierung plus nur die schlanke Runtime, die vor dem Laden des vollständigen Entry benötigt wird                      |
| `"cli-metadata"`  | Root-Hilfe / CLI-Metadatenerfassung | Nur CLI-Deskriptoren                                                                                                             |

`defineChannelPluginEntry` übernimmt diese Aufteilung automatisch. Wenn Sie `definePluginEntry` direkt für einen Channel verwenden, prüfen Sie den Modus selbst:

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

Der Discovery-Modus erstellt einen nicht aktivierenden Registry-Snapshot. Er kann dennoch den Plugin-Entry und das Channel-Plugin-Objekt auswerten, damit OpenClaw Channel-Capabilities und statische CLI-Deskriptoren registrieren kann. Behandeln Sie Modulauswertung in Discovery als vertrauenswürdig, aber leichtgewichtig: keine Netzwerk-Clients, Subprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker, Anmeldedaten-Lesevorgänge oder andere Live-Runtime-Seiteneffekte auf Top-Level.

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem setup-only-Startup-Oberflächen existieren müssen, ohne erneut in die vollständige gebündelte Channel-Runtime einzutreten. Gut geeignet sind Channel-Registrierung, setup-sichere HTTP-Routen, setup-sichere Gateway-Methoden und delegierte Setup-Hilfsfunktionen. Schwere Hintergrunddienste, CLI-Registrare und Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das eigentliche CLI-Modul beim ersten Aufruf per Lazy Loading lädt
- stellen Sie sicher, dass diese Deskriptoren jeden Top-Level-Command-Root abdecken, den der
  Registrar bereitstellt
- beschränken Sie Deskriptor-Befehlsnamen auf Buchstaben, Zahlen, Bindestrich und Unterstrich,
  beginnend mit einem Buchstaben oder einer Zahl; OpenClaw weist Deskriptor-Namen außerhalb
  dieser Form zurück und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor die Hilfe
  gerendert wird
- verwenden Sie `commands` allein nur für Kompatibilitätspfade mit eager loading

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                  | Beschreibung                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)           |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                      |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten     |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview) - Registrierungs-API und Subpfad-Referenz
- [Runtime Helpers](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Einrichtung und Konfiguration](/de/plugins/sdk-setup) - Manifest, Einrichtungseinstieg, verzögertes Laden
- [Channel Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
