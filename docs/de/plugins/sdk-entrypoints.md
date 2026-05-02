---
read_when:
    - Sie benötigen die genaue Typsignatur von definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (full vs setup vs CLI-Metadaten)
    - Sie suchen nach Einstiegspunktoptionen
sidebarTitle: Entry Points
summary: Referenz für definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-05-02T06:41:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein Standard-Einstiegsobjekt. Das SDK stellt drei Hilfsfunktionen zum Erstellen bereit.

Für installierte Plugins sollte `package.json` das Laufzeitladen auf gebautes JavaScript verweisen lassen, wenn verfügbar:

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

`extensions` und `setupEntry` bleiben gültige Quell-Einstiege für Workspace- und Git-Checkout-Entwicklung. `runtimeExtensions` und `runtimeSetupEntry` werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und ermöglichen npm-Paketen, Laufzeit-TypeScript-Kompilierung zu vermeiden. Explizite Laufzeit-Einstiege sind erforderlich: `runtimeSetupEntry` erfordert `setupEntry`, und fehlende `runtimeExtensions`- oder `runtimeSetupEntry`-Artefakte lassen Installation/Erkennung fehlschlagen, statt stillschweigend auf die Quelle zurückzufallen. Wenn ein installiertes Paket nur einen TypeScript-Quell-Einstieg deklariert, verwendet OpenClaw einen passenden gebauten `dist/*.js`-Peer, sofern einer vorhanden ist, und fällt dann auf die TypeScript-Quelle zurück.

Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Laufzeit-Einstiege und abgeleitete gebaute JavaScript-Peers machen keinen ausbrechenden `extensions`- oder `setupEntry`-Quellpfad gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, Tool-Plugins, Hook-Plugins und alles, was **kein**
Messaging-Kanal ist.

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
| `id`           | `string`                                                         | Ja           | —                     |
| `name`         | `string`                                                         | Ja           | —                     |
| `description`  | `string`                                                         | Ja           | —                     |
| `kind`         | `string`                                                         | Nein         | —                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | —                     |

- `id` muss Ihrem `openclaw.plugin.json`-Manifest entsprechen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion für verzögerte Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass teure Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch `api.registerChannel({ plugin })` auf, stellt eine optionale Schnittstelle für Root-Help-CLI-Metadaten bereit und schränkt `registerFull` nach Registrierungsmodus ein.

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
| `id`                  | `string`                                                         | Ja           | —                     |
| `name`                | `string`                                                         | Ja           | —                     |
| `description`         | `string`                                                         | Ja           | —                     |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | —                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | —                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | —                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | —                     |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die Laufzeitreferenz speichern können (typischerweise über `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten wird dies übersprungen.
- `registerCliMetadata` wird während `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` und
  `api.registrationMode === "full"` ausgeführt.
  Verwenden Sie dies als kanonischen Ort für kanaleigene CLI-Deskriptoren, damit Root-Help nicht aktivierend bleibt, Discovery-Snapshots statische Befehlsmetadaten enthalten und die normale CLI-Befehlsregistrierung mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- Discovery-Registrierung ist nicht aktivierend, aber nicht importfrei. OpenClaw kann den vertrauenswürdigen Plugin-Einstieg und das Kanal-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie daher Top-Level-Importe frei von Seiteneffekten und legen Sie Sockets, Clients, Worker und Dienste hinter Pfade, die nur für `"full"` gelten.
- `registerFull` wird nur ausgeführt, wenn `api.registrationMode === "full"`. Während des reinen Setup-Ladens wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine verzögerte Factory sein, und OpenClaw memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für plugin-eigene Root-CLI-Befehle bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`, wenn der Befehl lazy-loaded bleiben soll, ohne aus dem Root-CLI-Parse-Baum zu verschwinden. Bei Kanal-Plugins registrieren Sie diese Deskriptoren bevorzugt aus `registerCliMetadata(...)` und konzentrieren `registerFull(...)` auf reine Laufzeitarbeit.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, halten Sie sie unter einem plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` erzwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne Laufzeit- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies statt des vollständigen Einstiegs, wenn ein Kanal deaktiviert oder nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry), um zu erfahren, wann dies relevant ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für laufzeitsichere Setup-Hilfen wie importsichere Setup-Patch-Adapter, Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für Setup-Oberflächen optionaler Installationen
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Docs-Hilfen

Belassen Sie umfangreiche SDKs, CLI-Registrierung und langlebige Laufzeitdienste im vollständigen Einstieg.

Gebündelte Workspace-Kanäle, die Setup- und Laufzeitoberflächen trennen, können stattdessen `defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht dem Setup-Einstieg, setup-sichere Plugin-/Secrets-Exporte beizubehalten und dennoch einen Laufzeit-Setter bereitzustellen:

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

Verwenden Sie diesen gebündelten Vertrag nur, wenn Setup-Flows wirklich einen schlanken Laufzeit-Setter benötigen, bevor der vollständige Kanaleinstieg geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                              | Was registriert werden soll                                                                                                      |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start            | Alles                                                                                                                           |
| `"discovery"`     | Schreibgeschützte Fähigkeitserkennung | Kanalregistrierung plus statische CLI-Deskriptoren; Einstiegscode kann geladen werden, aber Sockets, Worker, Clients und Dienste überspringen |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Kanal | Nur Kanalregistrierung                                                                                                          |
| `"setup-runtime"` | Setup-Flow mit verfügbarer Laufzeit | Kanalregistrierung plus nur die schlanke Laufzeit, die vor dem Laden des vollständigen Einstiegs benötigt wird                  |
| `"cli-metadata"`  | Root-Help-/CLI-Metadatenerfassung | Nur CLI-Deskriptoren                                                                                                            |

`defineChannelPluginEntry` übernimmt diese Aufteilung automatisch. Wenn Sie `definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst:

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

Der Discovery-Modus erstellt einen nicht aktivierenden Registry-Snapshot. Er kann dennoch den Plugin-Einstieg und das Kanal-Plugin-Objekt auswerten, damit OpenClaw Kanalfähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandeln Sie Modulauswertung in Discovery als vertrauenswürdig, aber schlank: keine Netzwerk-Clients, Subprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker, Credential-Lesevorgänge oder andere Live-Laufzeit-Seiteneffekte auf Top-Level-Ebene.

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem reine Setup-Startoberflächen existieren müssen, ohne erneut in die vollständige gebündelte Kanallaufzeit einzutreten. Gut geeignet sind Kanalregistrierung, setup-sichere HTTP-Routen, setup-sichere Gateway-Methoden und delegierte Setup-Hilfen. Umfangreiche Hintergrunddienste, CLI-Registrare und Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und OpenClaw das echte CLI-Modul bei der ersten Ausführung lazy-loaden soll
- stellen Sie sicher, dass diese Deskriptoren jeden vom Registrar bereitgestellten Top-Level-Befehls-Root abdecken
- beschränken Sie Deskriptor-Befehlsnamen auf Buchstaben, Zahlen, Bindestrich und Unterstrich, beginnend mit einem Buchstaben oder einer Zahl; OpenClaw lehnt Deskriptornamen außerhalb dieser Form ab und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor Hilfe gerendert wird
- verwenden Sie `commands` allein nur für eifrige Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                  | Beschreibung                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)           |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                      |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten    |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Zugehörige Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) — Registrierungs-API und Subpfad-Referenz
- [Runtime-Helfer](/de/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Einrichtung und Konfiguration](/de/plugins/sdk-setup) — Manifest, Setup-Einstieg, verzögertes Laden
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
