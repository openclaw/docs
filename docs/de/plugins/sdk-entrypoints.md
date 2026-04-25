---
read_when:
    - Du benötigst die exakte Typsignatur von `definePluginEntry` oder `defineChannelPluginEntry`.
    - Du möchtest den Registrierungsmodus verstehen (full vs setup vs CLI-Metadaten).
    - Du suchst nach Optionen für Einstiegspunkte.
sidebarTitle: Entry Points
summary: Referenz für `definePluginEntry`, `defineChannelPluginEntry` und `defineSetupPluginEntry`
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-04-25T13:52:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Jedes Plugin exportiert ein Standard-Entry-Objekt. Das SDK stellt drei Helper zum
Erstellen dieser Objekte bereit.

Für installierte Plugins sollte `package.json` das Runtime-Laden auf gebautes
JavaScript verweisen, wenn vorhanden:

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

`extensions` und `setupEntry` bleiben gültige Source-Entries für die Entwicklung in Workspace und Git-
Checkout. `runtimeExtensions` und `runtimeSetupEntry` werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und erlauben npm-Paketen, die Runtime-
Kompilierung von TypeScript zu vermeiden. Wenn ein installiertes Paket nur einen TypeScript-
Source-Entry deklariert, verwendet OpenClaw einen passenden gebauten Peer `dist/*.js`, wenn vorhanden, und fällt andernfalls auf den TypeScript-Source-Entry zurück.

Alle Entry-Pfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Runtime-Entries
und abgeleitete gebaute JavaScript-Peers machen einen ausbrechenden Source-Pfad `extensions` oder
`setupEntry` nicht gültig.

<Tip>
  **Du suchst eine Schritt-für-Schritt-Anleitung?** Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider Plugins](/de/plugins/sdk-provider-plugins) für schrittweise Anleitungen.
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

- `id` muss zu deinem Manifest `openclaw.plugin.json` passen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann für Lazy Evaluation eine Funktion sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass teure Schema-
  Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt einen optionalen CLI-Metadaten-Seam für Root-Help bereit und begrenzt `registerFull` nach Registrierungsmodus.

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

- `setRuntime` wird während der Registrierung aufgerufen, damit du die Runtime-Referenz speichern kannst
  (typischerweise über `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten
  wird es übersprungen.
- `registerCliMetadata` läuft während `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` und
  `api.registrationMode === "full"`.
  Verwende es als kanonischen Ort für kanal-eigene CLI-Deskriptoren, damit Root-Help
  nicht aktivierend bleibt, Discovery-Snapshots statische Befehlsmetadaten enthalten und
  die normale CLI-Befehlsregistrierung mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- Discovery-Registrierung ist nicht aktivierend, aber nicht importfrei. OpenClaw kann
  den vertrauenswürdigen Plugin-Entry und das Kanal-Plugin-Modul auswerten, um den
  Snapshot zu erstellen. Halte daher Importe auf Top-Level frei von Seiteneffekten und lege Sockets,
  Clients, Worker und Services hinter Pfade, die nur für `"full"` gelten.
- `registerFull` läuft nur, wenn `api.registrationMode === "full"`. Es wird
  beim Setup-only-Laden übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy Factory sein, und OpenClaw
  memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für plugin-eigene Root-CLI-Befehle verwende bevorzugt `api.registerCli(..., { descriptors: [...] })`,
  wenn du möchtest, dass der Befehl lazy geladen bleibt, ohne aus dem
  Parse-Tree der Root-CLI zu verschwinden. Bei Kanal-Plugins solltest du diese Deskriptoren bevorzugt aus
  `registerCliMetadata(...)` registrieren und `registerFull(...)` auf Laufzeit-
  Arbeit beschränken.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, halte sie auf einem
  plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` gezwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die leichtgewichtige Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne
Runtime- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies statt des vollständigen Entries, wenn ein Kanal deaktiviert,
unkonfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe
[Setup and Config](/de/plugins/sdk-setup#setup-entry), wann dies relevant ist.

In der Praxis paare `defineSetupPluginEntry(...)` mit den schmalen Setup-Helper-
Familien:

- `openclaw/plugin-sdk/setup-runtime` für runtime-sichere Setup-Helper wie
  importsichere Setup-Patch-Adapter, Ausgabe für Lookup-Notes,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für optionale Installationsoberflächen im Setup
- `openclaw/plugin-sdk/setup-tools` für CLI-/Archiv-/Docs-Helper für Setup/Installation

Halte schwere SDKs, CLI-Registrierung und langlebige Runtime-Services im vollständigen
Entry.

Gebündelte Workspace-Kanäle, die Setup- und Runtime-Oberflächen aufteilen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht es dem
Setup-Entry, setup-sichere Exporte für Plugin/Secrets beizubehalten und dennoch einen
Runtime-Setter bereitzustellen:

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

Verwende diesen gebündelten Vertrag nur, wenn Setup-Abläufe wirklich einen leichtgewichtigen Runtime-
Setter benötigen, bevor der vollständige Kanal-Entry geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt deinem Plugin mit, wie es geladen wurde:

| Modus             | Wann                                 | Was registriert werden soll                                                                                               |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start               | Alles                                                                                                                     |
| `"discovery"`     | Read-only-Fähigkeitserkennung        | Kanalregistrierung plus statische CLI-Deskriptoren; Entry-Code kann geladen werden, aber Sockets, Worker, Clients und Services überspringen |
| `"setup-only"`    | Deaktivierter/unkonfigurierter Kanal | Nur Kanalregistrierung                                                                                                    |
| `"setup-runtime"` | Setup-Ablauf mit verfügbarer Runtime | Kanalregistrierung plus nur die leichtgewichtige Runtime, die benötigt wird, bevor der vollständige Entry geladen wird   |
| `"cli-metadata"`  | Root-Help / Erfassung von CLI-Metadaten | Nur CLI-Deskriptoren                                                                                                    |

`defineChannelPluginEntry` behandelt diese Aufteilung automatisch. Wenn du
`definePluginEntry` direkt für einen Kanal verwendest, prüfe den Modus selbst:

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

  // Schwere Registrierungen nur für die Runtime
  api.registerService(/* ... */);
}
```

Der Discovery-Modus baut einen nicht aktivierenden Registry-Snapshot. Er kann trotzdem
den Plugin-Entry und das Kanal-Plugin-Objekt auswerten, damit OpenClaw Kanal-
Fähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandle Modulauswertung in Discovery als
vertrauenswürdig, aber leichtgewichtig: keine Netzwerk-Clients, Subprozesse, Listener, Datenbank-
Verbindungen, Background-Worker, Credential-Lesevorgänge oder andere Live-Runtime-
Seiteneffekte auf Top-Level.

Behandle `"setup-runtime"` als das Fenster, in dem Setup-only-Startup-Oberflächen
vorhanden sein müssen, ohne die vollständige gebündelte Kanal-Runtime erneut zu betreten. Gute Kandidaten sind
Kanalregistrierung, setup-sichere HTTP-Routen, setup-sichere Gateway-Methoden und
delegierte Setup-Helper. Schwere Background-Services, CLI-Registrare und
Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare:

- Verwende `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und du
  möchtest, dass OpenClaw das echte CLI-Modul beim ersten Aufruf lazy lädt
- Stelle sicher, dass diese Deskriptoren jeden Top-Level-Befehls-Root abdecken, der vom
  Registrar bereitgestellt wird
- Halte Deskriptor-Befehlsnamen bei Buchstaben, Zahlen, Bindestrich und Unterstrich,
  beginnend mit einem Buchstaben oder einer Zahl; OpenClaw lehnt Deskriptor-Namen außerhalb
  dieser Form ab und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor Help
  gerendert wird
- Verwende `commands` allein nur für Eager-Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                  | Beschreibung                                        |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)              |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache)  |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                        |
| **non-capability**    | Tools/Befehle/Services, aber keine Fähigkeiten      |

Verwende `openclaw plugins inspect <id>`, um die Form eines Plugins zu sehen.

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview) — Registrierungs-API und Subpfad-Referenz
- [Runtime Helpers](/de/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Setup and Config](/de/plugins/sdk-setup) — Manifest, Setup-Entry, verzögertes Laden
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Aufbau des Objekts `ChannelPlugin`
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
