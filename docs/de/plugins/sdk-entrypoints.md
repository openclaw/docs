---
read_when:
    - Sie benötigen die exakte Typsignatur von defineToolPlugin, definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten)
    - Sie suchen nach Optionen für den Einstiegspunkt
sidebarTitle: Entry Points
summary: Referenz für defineToolPlugin, definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-07-12T15:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein standardmäßiges Einstiegsobjekt. Das SDK stellt für
jede Einstiegsform eine Hilfsfunktion bereit: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Unter [Tool-Plugins](/de/plugins/tool-plugins),
  [Kanal-Plugins](/de/plugins/sdk-channel-plugins) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins) finden Sie detaillierte Anleitungen.
</Tip>

## Paket-Einstiegspunkte

Installierte Plugins verweisen über die `openclaw`-Felder in `package.json` sowohl auf
Quell- als auch auf Build-Einstiegspunkte:

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

- `extensions` und `setupEntry` sind Quell-Einstiegspunkte, die für die Entwicklung
  in Workspaces und Git-Checkouts verwendet werden.
- `runtimeExtensions` und `runtimeSetupEntry` werden bei installierten Paketen
  bevorzugt: Damit können npm-Pakete auf die TypeScript-Kompilierung zur Laufzeit verzichten.
- Wenn `runtimeExtensions` vorhanden ist, muss seine Array-Länge mit der von
  `extensions` übereinstimmen (die Einträge werden positionsweise zugeordnet).
  `runtimeSetupEntry` erfordert `setupEntry`.
- Wenn ein Artefakt für `runtimeExtensions`/`runtimeSetupEntry` deklariert ist,
  aber fehlt, schlägt die Installation/Erkennung mit einem Paketierungsfehler fehl;
  OpenClaw greift nicht stillschweigend auf die Quelle zurück. Der unten beschriebene
  Rückgriff auf die Quelle gilt nur, wenn überhaupt kein Laufzeit-Einstiegspunkt
  deklariert ist.
- Wenn ein installiertes Paket nur einen TypeScript-Quell-Einstiegspunkt deklariert,
  sucht OpenClaw nach einem entsprechenden gebauten Gegenstück unter `dist/*.js`
  (oder `.mjs`/`.cjs`) und verwendet dieses; andernfalls greift es auf die
  TypeScript-Quelle zurück.
- Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben.
  Laufzeit-Einstiegspunkte und abgeleitete gebaute JS-Gegenstücke machen einen aus
  dem Verzeichnis herausführenden Quellpfad in `extensions` oder `setupEntry`
  nicht gültig.

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Für Plugins, die ausschließlich Agenten-Tools hinzufügen. Hält den Quellcode klein,
leitet Konfigurations- und Tool-Parametertypen aus TypeBox-Schemas ab, verpackt
einfache Rückgabewerte in das OpenClaw-Tool-Ergebnisformat und stellt statische
Metadaten bereit, die `openclaw plugins build` in das Plugin-Manifest schreibt
(`contracts.tools`, `configSchema`).

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

- `configSchema` ist optional; wenn es weggelassen wird, kommt ein striktes Schema
  für ein leeres Objekt zum Einsatz (das generierte Manifest enthält dennoch
  `configSchema`).
- `execute` gibt eine einfache Zeichenfolge oder einen JSON-serialisierbaren Wert
  zurück; die Hilfsfunktion verpackt ihn als Text-Tool-Ergebnis, wobei `details`
  auf den ursprünglichen (nicht in eine Zeichenfolge umgewandelten) Rückgabewert
  gesetzt wird.
- Für benutzerdefinierte Tool-Ergebnisse exportiert
  `openclaw/plugin-sdk/tool-results` die Funktionen `textResult` und `jsonResult`.
- Tool-Namen sind statisch, sodass `openclaw plugins build` `contracts.tools`
  aus den deklarierten Tools ableitet, ohne die Namen manuell zu duplizieren.
- Das Laden zur Laufzeit bleibt strikt: Installierte Plugins benötigen weiterhin
  `openclaw.plugin.json` und `openclaw.extensions` in `package.json`. OpenClaw führt
  niemals Plugin-Code aus, um fehlende Manifestdaten abzuleiten.

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
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Feld                      | Typ                                                              | Erforderlich | Standardwert            |
| ------------------------- | ---------------------------------------------------------------- | ------------ | ----------------------- |
| `id`                      | `string`                                                         | Ja           | -                       |
| `name`                    | `string`                                                         | Ja           | -                       |
| `description`             | `string`                                                         | Ja           | -                       |
| `kind`                    | `string` (veraltet, siehe unten)                                 | Nein         | -                       |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Nein         | -                       |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Nein         | -                       |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Nein         | -                       |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ja           | -                       |

- `id` muss mit Ihrem Manifest `openclaw.plugin.json` übereinstimmen.
- Externe Sitzungskataloge verwenden
  `openclaw/plugin-sdk/session-catalog` und
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Der Kern verwaltet die Gateway-Methoden `sessions.catalog.*`; Provider geben
  Host-, Sitzungs- und normalisierte Transkriptprojektionen zurück, ohne RPCs
  zu registrieren.
- `kind` ist veraltet: Deklarieren Sie stattdessen einen exklusiven Slot
  (`"memory"` oder `"context-engine"`) im Feld `kind` des Manifests
  `openclaw.plugin.json`. `kind` im Laufzeit-Einstiegspunkt bleibt nur als
  Kompatibilitätsrückgriff für ältere Plugins bestehen.
- `configSchema` kann für eine verzögerte Auswertung eine Funktion sein. OpenClaw
  löst das Schema beim ersten Zugriff auf und speichert es zwischen, sodass
  aufwendige Schema-Builder nur einmal ausgeführt werden.
- Ein `nodeHostCommands`-Deskriptor kann `isAvailable({ config, env })` definieren.
  Bei der Rückgabe von `false` werden dieser Befehl und seine Fähigkeit aus der
  Gateway-Deklaration des Headless-Nodes weggelassen. OpenClaw wertet dies anhand
  der lokalen Startkonfiguration des Nodes aus; Befehlshandler sollten die
  Verfügbarkeit beim Aufruf dennoch validieren.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung: Die Funktion ruft
automatisch `api.registerChannel({ plugin })` auf, stellt eine optionale
CLI-Metadatenschnittstelle für die Hilfe auf oberster Ebene bereit und beschränkt
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

| Feld                  | Typ                                                              | Erforderlich | Standardwert            |
| --------------------- | ---------------------------------------------------------------- | ------------ | ----------------------- |
| `id`                  | `string`                                                         | Ja           | -                       |
| `name`                | `string`                                                         | Ja           | -                       |
| `description`         | `string`                                                         | Ja           | -                       |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                       |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                       |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                       |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                       |

Callbacks werden je nach Registrierungsmodus ausgeführt (vollständige Tabelle unter
[Registrierungsmodus](#registration-mode)):

- `setRuntime` wird in jedem Modus außer `"cli-metadata"` und
  `"tool-discovery"` ausgeführt. Speichern Sie hier die Laufzeitreferenz,
  üblicherweise über `createPluginRuntimeStore`.
- `registerCliMetadata` wird für `"cli-metadata"`, `"discovery"` und
  `"full"` ausgeführt. Verwenden Sie dies als kanonischen Ort für kanaleigene
  CLI-Deskriptoren, damit die Hilfe auf oberster Ebene nicht aktivierend bleibt,
  Erkennungs-Snapshots statische Befehlsmetadaten enthalten und die normale
  CLI-Registrierung mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` wird nur für `"full"` und `"tool-discovery"` ausgeführt. Bei
  `"tool-discovery"` wird es _anstelle_ der Kanalregistrierung ausgeführt: OpenClaw
  überspringt `registerChannel`/`setRuntime` vollständig und ruft nur
  `registerFull` auf. Daher muss jede Provider-/Tool-Registrierung, die Ihr Kanal
  für die eigenständige Tool-Erkennung oder -Ausführung benötigt, dort erfolgen
  und darf nicht hinter der normalen Kanaleinrichtung liegen.
- Die Erkennungsregistrierung ist nicht aktivierend, aber nicht importfrei:
  OpenClaw kann den vertrauenswürdigen Plugin-Einstiegspunkt und das
  Kanal-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie Importe
  auf oberster Ebene frei von Seiteneffekten und platzieren Sie Sockets, Clients,
  Worker und Dienste hinter Pfaden, die ausschließlich für `"full"` gelten.
- Wie bei `definePluginEntry` kann `configSchema` eine verzögert ausgewertete
  Factory sein; OpenClaw speichert das aufgelöste Schema beim ersten Zugriff
  zwischen.

CLI-Registrierung:

- Verwenden Sie `api.registerCli(..., { descriptors: [...] })` für Plugin-eigene
  CLI-Befehle auf oberster Ebene, die verzögert geladen werden sollen, ohne aus
  dem Parse-Baum der Root-CLI zu verschwinden. Deskriptornamen dürfen nur
  Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten und müssen mit
  einem Buchstaben oder einer Zahl beginnen; OpenClaw lehnt andere Formen ab
  und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor die Hilfe
  dargestellt wird. Decken Sie jeden vom Registrar bereitgestellten
  Befehlsstamm auf oberster Ebene ab. `commands` allein verbleibt auf dem
  sofort geladenen Kompatibilitätspfad.
- Verwenden Sie `api.registerNodeCliFeature(...)` für Funktionsbefehle gekoppelter
  Nodes, damit sie unter `openclaw nodes` eingeordnet werden (entspricht
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Fügen Sie für andere verschachtelte Plugin-Befehle `parentPath` hinzu und
  registrieren Sie Befehle am `program`-Objekt, das dem Registrar übergeben wird;
  OpenClaw löst es zum übergeordneten Befehl auf, bevor das Plugin aufgerufen wird.
- Registrieren Sie bei Kanal-Plugins CLI-Deskriptoren aus `registerCliMetadata`
  und beschränken Sie `registerFull` auf reine Laufzeitarbeiten.
- Wenn `registerFull` auch Gateway-RPC-Methoden registriert, verwenden Sie dafür
  ein Plugin-spezifisches Präfix. Reservierte administrative Kern-Namensräume
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` erzwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt lediglich `{ plugin }` ohne
Laufzeit- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt diesen Einstiegspunkt anstelle des vollständigen Einstiegspunkts,
wenn ein Kanal deaktiviert oder nicht konfiguriert ist oder wenn verzögertes Laden
aktiviert ist. Unter [Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry)
erfahren Sie, wann dies relevant ist.

Kombinieren Sie `defineSetupPluginEntry(...)` mit den schlanken Familien von
Einrichtungshilfsfunktionen:

| Import                              | Verwenden für                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw/plugin-sdk/setup-runtime` | Laufzeitsichere Setup-Hilfsfunktionen: `createSetupTranslator`, importsichere Setup-Patch-Adapter, Ausgabe von Lookup-Hinweisen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
| `openclaw/plugin-sdk/channel-setup` | Setup-Oberflächen für optionale Installationen                                                                                                                                                   |
| `openclaw/plugin-sdk/setup-tools`   | Hilfsfunktionen für Setup-/Installations-CLI, Archive und Dokumentation                                                                                                                           |

Belassen Sie umfangreiche SDKs, die CLI-Registrierung und langlebige Laufzeitdienste im
vollständigen Einstiegspunkt.

Gebündelte Workspace-Kanäle, die Setup- und Laufzeitoberflächen trennen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dadurch kann der Setup-
Einstiegspunkt Setup-sichere Plugin-/Secrets-Exporte beibehalten und gleichzeitig einen Laufzeit-
Setter bereitstellen:

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
        /* Setup-sichere Route */
      },
    });
  },
});
```

Verwenden Sie dies nur, wenn ein Setup-Ablauf tatsächlich einen leichtgewichtigen Laufzeit-Setter oder
eine Setup-sichere Gateway-Oberfläche benötigt, bevor der vollständige Kanaleinstiegspunkt geladen wird.
`registerSetupRuntime` wird nur bei `"setup-runtime"`-Ladevorgängen ausgeführt; beschränken Sie es
auf reine Konfigurationsrouten oder Methoden, die vor der verzögerten
vollständigen Aktivierung vorhanden sein müssen.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus              | Zeitpunkt                                          | Zu registrierende Elemente                                                                                                               |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Normaler Gateway-Start                             | Alles                                                                                                                                    |
| `"discovery"`      | Schreibgeschützte Ermittlung von Fähigkeiten       | Kanalregistrierung plus statische CLI-Deskriptoren; Einstiegscode darf geladen werden, aber Sockets, Worker, Clients und Dienste auslassen |
| `"tool-discovery"` | Begrenztes Laden zum Auflisten oder Ausführen der Tools bestimmter Plugins | Nur Registrierung von Fähigkeiten/Tools; keine Kanalaktivierung                                                              |
| `"setup-only"`     | Deaktivierter/nicht konfigurierter Kanal           | Nur Kanalregistrierung                                                                                                                    |
| `"setup-runtime"`  | Setup-Ablauf mit verfügbarer Laufzeit              | Kanalregistrierung plus nur die leichtgewichtige Laufzeit, die vor dem Laden des vollständigen Einstiegspunkts benötigt wird               |
| `"cli-metadata"`   | Erfassung der Stammhilfe/CLI-Metadaten             | Nur CLI-Deskriptoren                                                                                                                      |

`defineChannelPluginEntry` verarbeitet diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst und beachten Sie,
dass `"tool-discovery"` die Kanalregistrierung überspringt:

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

  if (api.registrationMode === "tool-discovery") {
    // Nur fähigkeitsbezogene Oberflächen (Provider/Tools) registrieren, keinen Kanal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Umfangreiche Registrierungen nur für die Laufzeit
  api.registerService(/* ... */);
}
```

Der Ermittlungsmodus erstellt einen nicht aktivierenden Registry-Snapshot. Dabei können weiterhin
der Plugin-Einstiegspunkt und das Kanal-Plugin-Objekt ausgewertet werden, damit OpenClaw
Kanalfähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandeln Sie die Modul-
auswertung während der Ermittlung als vertrauenswürdig, aber leichtgewichtig: keine Netzwerkclients,
Unterprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker,
Zugangsdaten-Lesevorgänge oder andere aktiven Laufzeit-Nebenwirkungen auf oberster Ebene.

Betrachten Sie `"setup-runtime"` als das Zeitfenster, in dem ausschließlich für das Setup benötigte Startoberflächen
vorhanden sein müssen, ohne erneut in die vollständige Laufzeit des gebündelten Kanals einzutreten. Gut geeignet sind
Kanalregistrierung, Setup-sichere HTTP-Routen, Setup-sichere Gateway-Methoden
und delegierte Setup-Hilfsfunktionen. Umfangreiche Hintergrunddienste, CLI-Registrare und
Initialisierungen von Provider-/Client-SDKs gehören weiterhin in `"full"`.

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins anhand ihres Registrierungsverhaltens:

| Form                  | Beschreibung                                          |
| --------------------- | ----------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)                |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache)    |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                          |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten         |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) - Registrierungs-API und Unterpfadreferenz
- [Laufzeit-Hilfsfunktionen](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Setup und Konfiguration](/de/plugins/sdk-setup) - Manifest, Setup-Einstiegspunkt, verzögertes Laden
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
