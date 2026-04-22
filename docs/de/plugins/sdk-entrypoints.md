---
read_when:
    - Sie benötigen die genaue Typsignatur von `definePluginEntry` oder `defineChannelPluginEntry`
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Setup vs. CLI-Metadaten)
    - Sie suchen Einstiegspunktoptionen nach
sidebarTitle: Entry Points
summary: Referenz für `definePluginEntry`, `defineChannelPluginEntry` und `defineSetupPluginEntry`
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-04-22T04:24:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin-Einstiegspunkte

Jedes Plugin exportiert ein Standard-Einstiegsobjekt. Das SDK stellt drei Helfer zu dessen Erstellung bereit.

Für installierte Plugins sollte `package.json` das Laufzeitladen, wenn verfügbar, auf gebautes
JavaScript verweisen lassen:

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

`extensions` und `setupEntry` bleiben gültige Quell-Einstiegspunkte für die Entwicklung im Workspace und in Git-Checkouts.
`runtimeExtensions` und `runtimeSetupEntry` werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und erlauben es npm-Paketen, die TypeScript-Kompilierung zur Laufzeit zu vermeiden. Wenn ein installiertes Paket nur einen TypeScript-Quell-Einstiegspunkt deklariert, verwendet OpenClaw einen passenden gebauten `dist/*.js`-Peer, wenn einer vorhanden ist, und greift andernfalls auf die TypeScript-Quelle zurück.

Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Laufzeiteinstiege
und erschlossene gebaute JavaScript-Peers machen einen ausbrechenden Quellpfad in `extensions` oder
`setupEntry` nicht gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen.
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

| Feld           | Typ                                                              | Erforderlich | Standard            |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`           | `string`                                                         | Ja           | —                   |
| `name`         | `string`                                                         | Ja           | —                   |
| `description`  | `string`                                                         | Ja           | —                   |
| `kind`         | `string`                                                         | Nein         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | —                   |

- `id` muss mit Ihrem Manifest `openclaw.plugin.json` übereinstimmen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion zur verzögerten Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass teure
  Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt eine optionale CLI-Metadatenschnittstelle für die Root-Hilfe bereit und schaltet `registerFull` anhand des Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standard            |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                  | `string`                                                         | Ja           | —                   |
| `name`                | `string`                                                         | Ja           | —                   |
| `description`         | `string`                                                         | Ja           | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die Laufzeitreferenz speichern können
  (typischerweise über `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten wird es übersprungen.
- `registerCliMetadata` läuft sowohl während `api.registrationMode === "cli-metadata"`
  als auch während `api.registrationMode === "full"`.
  Verwenden Sie es als den kanonischen Ort für kanalbesessene CLI-Deskriptoren, damit die Root-Hilfe
  nicht aktivierend bleibt, während die normale Registrierung von CLI-Befehlen weiterhin mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` läuft nur, wenn `api.registrationMode === "full"` gilt. Während des reinen Setup-Ladens wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy-Factory sein, und OpenClaw
  memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für Root-CLI-Befehle in Plugin-Besitz bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`,
  wenn der Befehl lazy geladen bleiben soll, ohne aus dem Root-CLI-Parse-Baum zu verschwinden. Für Kanal-Plugins registrieren Sie diese Deskriptoren bevorzugt in `registerCliMetadata(...)` und halten `registerFull(...)` auf reine Laufzeitarbeit fokussiert.
- Wenn `registerFull(...)` außerdem Gateway-RPC-Methoden registriert, behalten Sie sie unter einem
  pluginspezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer auf
  `operator.admin` umgeschrieben.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die leichtgewichtige Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne
Laufzeit- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn ein Kanal deaktiviert,
nicht konfiguriert ist oder wenn Deferred Loading aktiviert ist. Siehe
[Setup and Config](/de/plugins/sdk-setup#setup-entry), wann dies wichtig ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Helferfamilien:

- `openclaw/plugin-sdk/setup-runtime` für laufzeitsichere Setup-Helfer wie
  importsichere Setup-Patch-Adapter, Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für optionale Installations-Setup-Oberflächen
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentations-Helfer

Behalten Sie schwere SDKs, CLI-Registrierung und langlebige Laufzeitdienste im vollständigen
Einstiegspunkt.

Gebündelte Workspace-Kanäle, die Setup- und Laufzeitoberflächen aufteilen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht es dem
Setup-Einstiegspunkt, Setup-sichere Exporte für Plugin/Secrets beizubehalten und gleichzeitig einen
Laufzeit-Setter bereitzustellen:

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

Verwenden Sie diesen gebündelten Vertrag nur, wenn Setup-Abläufe wirklich einen leichtgewichtigen Laufzeit-Setter benötigen, bevor der vollständige Kanaleinstiegspunkt geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus            | Wann                               | Was registriert werden soll                                                              |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`         | Normaler Gateway-Start             | Alles                                                                                    |
| `"setup-only"`   | Deaktivierter/nicht konfigurierter Kanal | Nur Kanalregistrierung                                                              |
| `"setup-runtime"`| Setup-Ablauf mit verfügbarer Laufzeit | Kanalregistrierung plus nur die leichtgewichtige Laufzeit, die vor dem vollständigen Einstiegspunkt benötigt wird |
| `"cli-metadata"` | Root-Hilfe / Erfassung von CLI-Metadaten | Nur CLI-Deskriptoren                                                                 |

`defineChannelPluginEntry` behandelt diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Schwere, nur zur Laufzeit benötigte Registrierungen
  api.registerService(/* ... */);
}
```

Behandeln Sie `"setup-runtime"` als das Fenster, in dem Setup-only-Startoberflächen
existieren müssen, ohne erneut in die vollständige gebündelte Kanallaufzeit einzutreten. Gute Einsatzzwecke sind
Kanalregistrierung, Setup-sichere HTTP-Routen, Setup-sichere Gateway-Methoden und
delegierte Setup-Helfer. Schwere Hintergrunddienste, CLI-Registrare und Bootsraps von
Provider-/Client-SDKs gehören weiterhin in `"full"`.

Speziell für CLI-Registrare:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das echte CLI-Modul beim ersten Aufruf lazy lädt
- stellen Sie sicher, dass diese Deskriptoren jeden Top-Level-Befehls-Root abdecken, der durch den
  Registrar bereitgestellt wird
- verwenden Sie nur `commands` für eager Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins anhand ihres Registrierungsverhaltens:

| Form                | Beschreibung                                         |
| ------------------- | ---------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)             |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                       |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten      |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview) — Registrierungs-API und Subpath-Referenz
- [Runtime Helpers](/de/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Setup and Config](/de/plugins/sdk-setup) — Manifest, Setup-Einstiegspunkt, Deferred Loading
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Erstellen des Objekts `ChannelPlugin`
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
