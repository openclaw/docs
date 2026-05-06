---
read_when:
    - Sie benötigen die exakte Typsignatur von definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (full vs setup vs CLI metadata)
    - Sie suchen nach Optionen für Einstiegspunkte
sidebarTitle: Entry Points
summary: Referenz für definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-05-06T06:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein Standard-Eintragsobjekt. Das SDK stellt drei Hilfsfunktionen zum
Erstellen bereit.

Für installierte Plugins sollte `package.json` das Laden zur Laufzeit auf gebautes
JavaScript verweisen, sofern verfügbar:

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

`extensions` und `setupEntry` bleiben gültige Quell-Einträge für die Entwicklung
im Workspace und in Git-Checkouts. `runtimeExtensions` und `runtimeSetupEntry`
werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und ermöglichen es
npm-Paketen, TypeScript-Kompilierung zur Laufzeit zu vermeiden. Explizite
Laufzeit-Einträge sind erforderlich: `runtimeSetupEntry` erfordert `setupEntry`,
und fehlende Artefakte für `runtimeExtensions` oder `runtimeSetupEntry` lassen
Installation/Erkennung fehlschlagen, statt stillschweigend auf den Quellcode
zurückzufallen. Wenn ein installiertes Paket nur einen TypeScript-Quell-Eintrag
deklariert, verwendet OpenClaw einen passenden gebauten `dist/*.js`-Peer, wenn
einer vorhanden ist, und fällt dann auf die TypeScript-Quelle zurück.

Alle Eintragspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben.
Laufzeit-Einträge und abgeleitete gebaute JavaScript-Peers machen keinen
ausbrechenden `extensions`- oder `setupEntry`-Quellpfad gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider-Plugins](/de/plugins/sdk-provider-plugins) für schrittweise Anleitungen.
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

| Feld           | Typ                                                              | Erforderlich | Standardwert           |
| -------------- | ---------------------------------------------------------------- | ------------ | ---------------------- |
| `id`           | `string`                                                         | Ja           | -                      |
| `name`         | `string`                                                         | Ja           | -                      |
| `description`  | `string`                                                         | Ja           | -                      |
| `kind`         | `string`                                                         | Nein         | -                      |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | -                      |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion für verzögerte Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und merkt es sich, sodass
  teure Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt einen optionalen Metadaten-Seam
für die Root-Hilfe der CLI bereit und beschränkt `registerFull` anhand des
Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standardwert           |
| --------------------- | ---------------------------------------------------------------- | ------------ | ---------------------- |
| `id`                  | `string`                                                         | Ja           | -                      |
| `name`                | `string`                                                         | Ja           | -                      |
| `description`         | `string`                                                         | Ja           | -                      |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                      |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                      |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                      |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                      |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die Laufzeitreferenz
  speichern können (typischerweise über `createPluginRuntimeStore`). Während der
  CLI-Metadatenerfassung wird dies übersprungen.
- `registerCliMetadata` wird während `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` und
  `api.registrationMode === "full"` ausgeführt.
  Verwenden Sie es als kanonischen Ort für kanaleigene CLI-Deskriptoren, damit
  Root-Hilfe nicht aktiviert, Erkennungs-Snapshots statische Befehlsmetadaten
  enthalten und die normale CLI-Befehlsregistrierung mit vollständigen
  Plugin-Ladevorgängen kompatibel bleibt.
- Die Erkennungsregistrierung ist nicht aktivierend, aber nicht importfrei. OpenClaw kann
  den vertrauenswürdigen Plugin-Eintrag und das Kanal-Plugin-Modul auswerten, um den
  Snapshot zu erstellen. Halten Sie Importe auf oberster Ebene daher frei von
  Seiteneffekten und legen Sie Sockets, Clients, Worker und Dienste hinter Pfade,
  die nur für `"full"` gelten.
- `registerFull` wird nur ausgeführt, wenn `api.registrationMode === "full"` ist. Beim
  reinen Setup-Laden wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine verzögerte Factory sein, und OpenClaw
  merkt sich das aufgelöste Schema beim ersten Zugriff.
- Für plugin-eigene Root-CLI-Befehle bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`,
  wenn der Befehl verzögert geladen bleiben soll, ohne aus dem
  Root-CLI-Parsebaum zu verschwinden. Für Kanal-Plugins bevorzugen Sie, diese Deskriptoren
  aus `registerCliMetadata(...)` zu registrieren, und halten Sie `registerFull(...)` auf reine Laufzeitarbeit fokussiert.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, halten Sie diese unter einem
  plugin-spezifischen Präfix. Reservierte zentrale Admin-Namensräume (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` gezwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne
Laufzeit- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Eintrags, wenn ein Kanal deaktiviert,
nicht konfiguriert oder verzögertes Laden aktiviert ist. Siehe
[Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry), wann dies relevant ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen
Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für laufzeitsichere Setup-Hilfen wie
  importsichere Setup-Patch-Adapter, Lookup-Note-Ausgabe,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für Setup-Oberflächen mit optionaler Installation
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentationshilfen

Halten Sie schwere SDKs, CLI-Registrierung und langlebige Laufzeitdienste im
vollständigen Eintrag.

Gebündelte Workspace-Kanäle, die Setup- und Laufzeitoberflächen trennen, können
stattdessen `defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht es dem
Setup-Eintrag, setup-sichere Plugin-/Secrets-Exporte beizubehalten und dennoch einen
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

Verwenden Sie diesen gebündelten Vertrag nur, wenn Setup-Abläufe wirklich einen schlanken
Laufzeit-Setter benötigen, bevor der vollständige Kanaleintrag geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                              | Was registriert werden soll                                                                                                   |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start            | Alles                                                                                                                         |
| `"discovery"`     | Schreibgeschützte Fähigkeitserkennung | Kanalregistrierung plus statische CLI-Deskriptoren; Eintragscode kann geladen werden, aber Sockets, Worker, Clients und Dienste überspringen |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Kanal | Nur Kanalregistrierung                                                                                                        |
| `"setup-runtime"` | Setup-Ablauf mit verfügbarer Laufzeit | Kanalregistrierung plus nur die schlanke Laufzeit, die benötigt wird, bevor der vollständige Eintrag geladen wird              |
| `"cli-metadata"`  | Root-Hilfe / CLI-Metadatenerfassung | Nur CLI-Deskriptoren                                                                                                          |

`defineChannelPluginEntry` behandelt diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst:

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

Der Erkennungsmodus erstellt einen nicht aktivierenden Registry-Snapshot. Er kann dennoch
den Plugin-Eintrag und das Kanal-Plugin-Objekt auswerten, damit OpenClaw Kanal-
Fähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandeln Sie
Modulauswertung in der Erkennung als vertrauenswürdig, aber leichtgewichtig: keine
Netzwerk-Clients, Unterprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker,
Anmeldedaten-Lesevorgänge oder andere Live-Laufzeit-Seiteneffekte auf oberster Ebene.

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem reine Setup-Startoberflächen
existieren müssen, ohne erneut in die vollständige gebündelte Kanallaufzeit einzutreten.
Gut geeignet sind Kanalregistrierung, setup-sichere HTTP-Routen, setup-sichere
Gateway-Methoden und delegierte Setup-Hilfen. Schwere Hintergrunddienste,
CLI-Registrare und Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das echte CLI-Modul beim ersten Aufruf verzögert lädt
- stellen Sie sicher, dass diese Deskriptoren jeden Befehlsstamm der obersten Ebene abdecken, der vom
  Registrar offengelegt wird
- beschränken Sie Deskriptor-Befehlsnamen auf Buchstaben, Zahlen, Bindestrich und Unterstrich,
  beginnend mit einem Buchstaben oder einer Zahl; OpenClaw weist Deskriptornamen außerhalb
  dieser Form zurück und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor
  Hilfe gerendert wird
- verwenden Sie `commands` allein nur für eifrige Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                  | Beschreibung                                      |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)            |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                      |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten     |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) - Registrierungs-API und Subpfad-Referenz
- [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Einrichtung und Konfiguration](/de/plugins/sdk-setup) - Manifest, Setup-Einstiegspunkt, verzögertes Laden
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
