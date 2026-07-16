---
read_when:
    - Sie benötigen die genaue Typsignatur von defineToolPlugin, definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten)
    - Sie suchen nach Optionen für Einstiegspunkte
sidebarTitle: Entry Points
summary: Referenz für defineToolPlugin, definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-07-16T13:25:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein standardmäßiges Einstiegsobjekt. Das SDK stellt eine Hilfsfunktion für
jede Einstiegsform bereit: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Sie suchen eine Schritt-für-Schritt-Anleitung?** Unter [Tool-Plugins](/de/plugins/tool-plugins),
  [Channel-Plugins](/de/plugins/sdk-channel-plugins) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins) finden Sie entsprechende Anleitungen.
</Tip>

## Paketeinstiege

Installierte Plugins verweisen mit den Feldern `package.json` und `openclaw` sowohl auf Quell- als auch auf
Build-Einstiege:

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

- `extensions` und `setupEntry` sind Quelleinstiege, die für die Entwicklung in Workspaces und
  Git-Checkouts verwendet werden.
- `runtimeExtensions` und `runtimeSetupEntry` werden für installierte
  Pakete bevorzugt: Dadurch können npm-Pakete auf die TypeScript-Kompilierung zur Laufzeit verzichten.
- `runtimeExtensions` muss, sofern vorhanden, dieselbe Array-Länge wie `extensions` aufweisen
  (die Einträge werden positionsweise zugeordnet). `runtimeSetupEntry` erfordert `setupEntry`.
- Wenn ein `runtimeExtensions`-/`runtimeSetupEntry`-Artefakt deklariert wurde, aber
  fehlt, schlägt die Installation/Erkennung mit einem Paketierungsfehler fehl; OpenClaw
  weicht nicht stillschweigend auf den Quellcode aus. Der nachfolgend beschriebene Rückgriff auf den Quellcode gilt nur, wenn überhaupt
  kein Laufzeiteinstieg deklariert wurde.
- Wenn ein installiertes Paket nur einen TypeScript-Quelleinstieg deklariert, sucht OpenClaw
  nach einem passenden erstellten `dist/*.js`-Peer (oder `.mjs`-/`.cjs`-Peer) und verwendet ihn;
  andernfalls greift es auf den TypeScript-Quellcode zurück.
- Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Laufzeit-
  einstiege und abgeleitete Build-JS-Peers machen einen ausbrechenden `extensions`- oder
  `setupEntry`-Quellpfad nicht gültig.

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Für Plugins, die nur Agent-Tools hinzufügen. Hält den Quellcode kompakt, leitet Konfigurations-
und Tool-Parametertypen aus TypeBox-Schemas ab, verpackt einfache Rückgabewerte im
OpenClaw-Tool-Ergebnisformat und stellt statische Metadaten bereit, die
`openclaw plugins build` in das Plugin-Manifest schreibt (`contracts.tools`,
`configSchema`).

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

- `configSchema` ist optional; wird es weggelassen, kommt ein striktes Schema für ein leeres Objekt zum Einsatz
  (das generierte Manifest enthält weiterhin `configSchema`).
- `execute` gibt eine einfache Zeichenfolge oder einen JSON-serialisierbaren Wert zurück; die Hilfsfunktion
  verpackt ihn als Text-Tool-Ergebnis, wobei `details` auf den ursprünglichen
  (nicht in eine Zeichenfolge umgewandelten) Rückgabewert gesetzt wird.
- Für benutzerdefinierte Tool-Ergebnisse exportiert `openclaw/plugin-sdk/tool-results`
  `textResult` und `jsonResult`.
- Tool-Namen sind statisch, daher leitet `openclaw plugins build`
  `contracts.tools` aus den deklarierten Tools ab, ohne Namen manuell zu duplizieren.
- Das Laden zur Laufzeit bleibt strikt: Installierte Plugins benötigen weiterhin
  `openclaw.plugin.json` und `package.json` `openclaw.extensions`. OpenClaw
  führt niemals Plugin-Code aus, um fehlende Manifestdaten abzuleiten.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, fortgeschrittene Tool-Plugins, Hook-Plugins und alles,
was **kein** Messaging-Channel ist.

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

| Feld                      | Typ                                                              | Erforderlich | Standardwert        |
| ------------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                      | `string`                                                         | Ja           | -                   |
| `name`                    | `string`                                                         | Ja           | -                   |
| `description`             | `string`                                                         | Ja           | -                   |
| `kind`                    | `string` (veraltet, siehe unten)                                 | Nein         | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Nein         | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Nein         | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Nein         | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ja           | -                   |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- Externe Sitzungskataloge verwenden
  `openclaw/plugin-sdk/session-catalog` und
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Der Kern besitzt die `sessions.catalog.*`-Gateway-Methoden; Provider geben Host-,
  Sitzungs- und normalisierte Transkriptprojektionen zurück, ohne RPCs zu registrieren.
- `kind` ist veraltet: Deklarieren Sie stattdessen einen exklusiven Slot (`"memory"` oder
  `"context-engine"`) im Feld `kind` des `openclaw.plugin.json`-Manifests.
  Der Laufzeiteinstieg `kind` bleibt nur als Kompatibilitätsrückgriff für
  ältere Plugins erhalten.
- `configSchema` kann zur verzögerten Auswertung eine Funktion sein. OpenClaw löst das
  Schema beim ersten Zugriff auf und speichert es zwischen, sodass aufwendige Schema-Builder nur
  einmal ausgeführt werden.
- Ein `nodeHostCommands`-Deskriptor kann `isAvailable({ config, env })` definieren.
  Die Rückgabe von `false` lässt diesen Befehl und seine Fähigkeit aus der Gateway-
  Deklaration des Headless-Nodes weg. OpenClaw wertet dies anhand der lokalen
  Startkonfiguration des Nodes aus; Befehlshandler sollten die Verfügbarkeit beim
  Aufruf dennoch validieren.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit Channel-spezifischer Verdrahtung: Die Funktion ruft automatisch
`api.registerChannel({ plugin })` auf, stellt eine optionale CLI-
Metadatenschnittstelle für die Root-Hilfe bereit und beschränkt `registerFull` auf den Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standardwert        |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                  | `string`                                                         | Ja           | -                   |
| `name`                | `string`                                                         | Ja           | -                   |
| `description`         | `string`                                                         | Ja           | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                   |

Callbacks werden je nach Registrierungsmodus ausgeführt (vollständige Tabelle unter
[Registrierungsmodus](#registration-mode)):

- `setRuntime` wird in jedem Modus außer `"cli-metadata"` und
  `"tool-discovery"` ausgeführt. Speichern Sie hier die Laufzeitreferenz, typischerweise über
  `createPluginRuntimeStore`.
- `registerCliMetadata` wird für `"cli-metadata"`, `"discovery"` und
  `"full"` ausgeführt. Verwenden Sie dies als kanonische Stelle für Channel-eigene CLI-Deskriptoren,
  damit die Root-Hilfe nicht aktivierend bleibt, Erkennungs-Snapshots statische
  Befehlsmetadaten enthalten und die normale CLI-Registrierung mit vollständigen
  Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` wird nur für `"full"` und `"tool-discovery"` ausgeführt. Für
  `"tool-discovery"` wird es _anstelle der_ Channel-Registrierung ausgeführt: OpenClaw
  überspringt `registerChannel`/`setRuntime` vollständig und ruft nur
  `registerFull` auf. Daher muss jede Provider-/Tool-Registrierung, die Ihr Channel für
  die eigenständige Tool-Erkennung oder -Ausführung benötigt, dort erfolgen und darf nicht hinter der normalen
  Channel-Einrichtung liegen.
- Die Erkennungsregistrierung ist nicht aktivierend, aber nicht importfrei: OpenClaw kann
  den vertrauenswürdigen Plugin-Einstieg und das Channel-Plugin-Modul auswerten, um den
  Snapshot zu erstellen. Halten Sie Importe auf oberster Ebene frei von Seiteneffekten und platzieren Sie Sockets,
  Clients, Worker und Dienste hinter Pfaden, die ausschließlich `"full"` verwenden.
- Wie `definePluginEntry` kann auch `configSchema` eine verzögerte Factory sein; OpenClaw
  speichert das aufgelöste Schema beim ersten Zugriff zwischen.

CLI-Registrierung:

- Verwenden Sie `api.registerCli(..., { descriptors: [...] })` für Plugin-eigene Root-
  CLI-Befehle, die verzögert geladen werden sollen, ohne aus dem Parse-Baum der Root-CLI
  zu verschwinden. Deskriptornamen dürfen nur Buchstaben, Zahlen, Bindestriche und
  Unterstriche enthalten und müssen mit einem Buchstaben oder einer Zahl beginnen; OpenClaw lehnt andere
  Formen ab und entfernt Terminal-Steuersequenzen aus Beschreibungen, bevor
  die Hilfe dargestellt wird. Decken Sie jeden vom Registrar bereitgestellten Root-Befehl der obersten Ebene ab.
  `commands` allein verbleibt auf dem früh geladenen Kompatibilitätspfad.
- Verwenden Sie `api.registerNodeCliFeature(...)` für Funktionsbefehle gekoppelter Nodes, damit
  sie unter `openclaw nodes` eingeordnet werden (entspricht
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Fügen Sie für andere verschachtelte Plugin-Befehle `parentPath` hinzu und registrieren Sie Befehle
  am `program`-Objekt, das dem Registrar übergeben wird; OpenClaw löst es in den
  übergeordneten Befehl auf, bevor das Plugin aufgerufen wird.
- Registrieren Sie bei Channel-Plugins CLI-Deskriptoren aus `registerCliMetadata`
  und beschränken Sie `registerFull` auf reine Laufzeitarbeit.
- Wenn `registerFull` auch Gateway-RPC-Methoden registriert, verwenden Sie dafür ein
  Plugin-spezifisches Präfix. Reservierte administrative Kern-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer in
  `operator.admin` umgewandelt.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` zurück, ohne
Laufzeit- oder CLI-Verdrahtung.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn ein Channel deaktiviert oder
nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Unter
[Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry) erfahren Sie, wann dies relevant ist.

Kombinieren Sie `defineSetupPluginEntry(...)` mit den spezialisierten Familien von Einrichtungshilfen:

| Import                              | Verwendungszweck                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Laufzeitsichere Einrichtungshilfen: `createSetupTranslator`, importsichere Adapter für Einrichtungs-Patches, Ausgabe von Suchhinweisen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
| `openclaw/plugin-sdk/channel-setup` | Einrichtungsoberflächen für optionale Installationen                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Hilfen für Einrichtungs-/Installations-CLI, Archiv und Dokumentation                                                                                                               |

Belassen Sie umfangreiche SDKs, die CLI-Registrierung und langlebige Laufzeitdienste im
vollständigen Einstiegspunkt.

Gebündelte Workspace-Channels, die Einrichtungs- und Laufzeitoberflächen trennen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dadurch kann der Einrichtungs-Einstiegspunkt
einrichtungssichere Plugin-/Secrets-Exporte beibehalten und gleichzeitig einen Laufzeit-
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
        /* einrichtungssichere Route */
      },
    });
  },
});
```

Verwenden Sie dies nur, wenn ein Einrichtungsablauf tatsächlich einen leichtgewichtigen Laufzeit-Setter oder
eine einrichtungssichere Gateway-Oberfläche benötigt, bevor der vollständige Channel-Einstiegspunkt geladen wird.
`registerSetupRuntime` wird nur für `"setup-runtime"`-Ladevorgänge ausgeführt; beschränken Sie ihn
auf reine Konfigurationsrouten oder Methoden, die vor der verzögerten
vollständigen Aktivierung verfügbar sein müssen.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus              | Zeitpunkt                                          | Zu registrierende Elemente                                                                                              |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Normaler Gateway-Start                             | Alles                                                                                                                   |
| `"discovery"`      | Schreibgeschützte Ermittlung von Fähigkeiten       | Channel-Registrierung plus statische CLI-Deskriptoren; Einstiegscode darf geladen werden, aber Sockets, Worker, Clients und Dienste sind zu überspringen |
| `"tool-discovery"` | Bereichsbegrenztes Laden zum Auflisten oder Ausführen der Tools bestimmter Plugins | Nur Fähigkeiten-/Tool-Registrierung; keine Channel-Aktivierung                                                          |
| `"setup-only"`     | Deaktivierter/nicht konfigurierter Channel         | Nur Channel-Registrierung                                                                                                |
| `"setup-runtime"`  | Einrichtungsablauf mit verfügbarer Laufzeit        | Channel-Registrierung plus ausschließlich die leichtgewichtige Laufzeit, die vor dem Laden des vollständigen Einstiegspunkts benötigt wird |
| `"cli-metadata"`   | Erfassung der Stammhilfe/CLI-Metadaten             | Nur CLI-Deskriptoren                                                                                                     |

`defineChannelPluginEntry` verarbeitet diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Channel verwenden, prüfen Sie den Modus selbst und beachten Sie,
dass `"tool-discovery"` die Channel-Registrierung überspringt:

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
    // Nur auf Fähigkeiten beschränkte Oberflächen (Provider/Tools) registrieren, keinen Channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Umfangreiche Registrierungen ausschließlich für die Laufzeit
  api.registerService(/* ... */);
}
```

Langlebige Dienste können über ihren Dienstkontext kleine Invalidierungs- oder Lebenszyklusereignisse
ausgeben:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw versieht dies mit dem Namespace `plugin.<plugin-id>.changed`. Ereignisnamen bestehen aus einem
kleingeschriebenen Segment, Nutzdaten müssen begrenztes JSON sein und der Geltungsbereich muss
`operator.read`, `operator.write` oder `operator.admin` sein. Der Emitter ist nur
während der Lebensdauer des Dienstes vorhanden und wird nach dem Stoppen oder einem fehlgeschlagenen Start widerrufen. Verwenden Sie vorzugsweise
Versions- oder Invalidierungsnutzdaten statt vollständiger Datensätze, damit autorisierte Clients den
kanonischen Zustand über die bereichsbegrenzten Gateway-Methoden des Plugins erneut einlesen.

Der Ermittlungsmodus erstellt einen nicht aktivierenden Registry-Snapshot. Dabei können weiterhin
der Plugin-Einstiegspunkt und das Channel-Plugin-Objekt ausgewertet werden, damit OpenClaw
Channel-Fähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandeln Sie die Modulauswertung
während der Ermittlung als vertrauenswürdig, aber leichtgewichtig: keine Netzwerkclients,
Unterprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker,
Anmeldedatenzugriffe oder andere aktive Laufzeitnebeneffekte auf oberster Ebene.

Betrachten Sie `"setup-runtime"` als das Zeitfenster, in dem reine Einrichtungs-Startoberflächen
verfügbar sein müssen, ohne erneut in die vollständige gebündelte Channel-Laufzeit einzutreten. Geeignet sind
Channel-Registrierung, einrichtungssichere HTTP-Routen, einrichtungssichere Gateway-Methoden
und delegierte Einrichtungshilfen. Umfangreiche Hintergrunddienste, CLI-Registrare und
Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins anhand ihres Registrierungsverhaltens:

| Form                  | Beschreibung                                       |
| --------------------- | -------------------------------------------------- |
| **einfache Fähigkeit**  | Ein Fähigkeitstyp (z. B. nur Provider)           |
| **hybride Fähigkeit** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **nur Hooks**         | Nur Hooks, keine Fähigkeiten                        |
| **keine Fähigkeit**   | Tools/Befehle/Dienste, aber keine Fähigkeiten       |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) - Registrierungs-API und Unterpfadreferenz
- [Laufzeithilfen](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Einrichtung und Konfiguration](/de/plugins/sdk-setup) - Manifest, Einrichtungs-Einstiegspunkt, verzögertes Laden
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
