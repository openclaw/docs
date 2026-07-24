---
read_when:
    - Sie benötigen die exakte Typsignatur von defineToolPlugin, definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten)
    - Sie suchen nach Optionen für den Einstiegspunkt
sidebarTitle: Entry Points
summary: Referenz für defineToolPlugin, definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-07-24T05:17:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Jedes Plugin exportiert ein standardmäßiges Einstiegsobjekt. Das SDK stellt für
jede Einstiegsform eine Hilfsfunktion bereit: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Suchen Sie nach einer schrittweisen Anleitung?** Unter [Tool-Plugins](/de/plugins/tool-plugins),
  [Channel-Plugins](/de/plugins/sdk-channel-plugins) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins) finden Sie Schritt-für-Schritt-Anleitungen.
</Tip>

## Paketeinstiege

Installierte Plugins verweisen mit den Feldern `package.json` und `openclaw` sowohl auf Quell-
als auch auf erstellte Einstiege:

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
  greift nicht stillschweigend auf die Quelle zurück. Der unten beschriebene Rückgriff auf die Quelle gilt nur, wenn
  überhaupt kein Laufzeiteinstieg deklariert wurde.
- Wenn ein installiertes Paket nur einen TypeScript-Quelleinstieg deklariert, sucht OpenClaw
  nach einem passenden erstellten `dist/*.js`- (oder `.mjs`-/`.cjs`-)Gegenstück und verwendet es;
  andernfalls greift es auf die TypeScript-Quelle zurück.
- Alle Einstiegspfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Laufzeit-
  einstiege und abgeleitete erstellte JS-Gegenstücke machen einen aus dem Verzeichnis herausführenden `extensions`- oder
  `setupEntry`-Quellpfad nicht gültig.

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Für Plugins, die ausschließlich Agent-Tools hinzufügen. Hält den Quellcode kompakt, leitet Konfigurations-
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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` ist optional; wenn es weggelassen wird, kommt ein striktes Schema für ein leeres Objekt zum Einsatz
  (das generierte Manifest enthält weiterhin `configSchema`).
- `execute` gibt eine einfache Zeichenfolge oder einen JSON-serialisierbaren Wert zurück; die Hilfsfunktion
  verpackt ihn als Text-Tool-Ergebnis, wobei `details` auf den ursprünglichen
  (nicht in eine Zeichenfolge umgewandelten) Rückgabewert gesetzt wird.
- `outputSchema` beschreibt optional diesen ursprünglichen `details`-Wert für den Code-
  Modus und die Tool-Suche. Katalogaufrufe lehnen ein ungültiges Schema vor der Ausführung ab
  und validieren den endgültigen Wert, bevor sie ihn zurückgeben.
- Für benutzerdefinierte Tool-Ergebnisse exportiert `openclaw/plugin-sdk/tool-results`
  `textResult` und `jsonResult`.
- Tool-Namen sind statisch, daher leitet `openclaw plugins build`
  `contracts.tools` aus den deklarierten Tools ab, ohne die Namen manuell zu duplizieren.
- Das Laden zur Laufzeit bleibt strikt: Installierte Plugins benötigen weiterhin
  `openclaw.plugin.json` und `package.json` `openclaw.extensions`. OpenClaw
  führt niemals Plugin-Code aus, um fehlende Manifestdaten abzuleiten.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, erweiterte Tool-Plugins, Hook-Plugins und alles, was
**kein** Messaging-Channel ist.

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

| Feld                      | Typ                                                              | Erforderlich | Standardwert         |
| ------------------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`                      | `string`                                                         | Ja           | -                    |
| `name`                    | `string`                                                         | Ja           | -                    |
| `description`             | `string`                                                         | Ja           | -                    |
| `kind`                    | `string` (veraltet, siehe unten)                                 | Nein         | -                    |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Nein         | -                    |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Nein         | -                    |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Nein         | -                    |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ja           | -                    |

- `id` muss Ihrem `openclaw.plugin.json`-Manifest entsprechen.
- Externe Sitzungskataloge verwenden
  `openclaw/plugin-sdk/session-catalog` und
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Der Core ist für die `sessions.catalog.*`-Gateway-Methoden zuständig; Provider geben Host-,
  Sitzungs- und normalisierte Transkriptprojektionen zurück, ohne RPCs zu registrieren. Ein
  Listen-Provider sollte den optionalen `onHost(host)`-Callback aufrufen, sobald jeder Host
  abgeschlossen ist; das zurückgegebene Host-Array bleibt als abschließender Kompatibilitäts-
  Snapshot erforderlich.
- `kind` ist veraltet: Deklarieren Sie stattdessen einen exklusiven Slot (`"memory"` oder
  `"context-engine"`) im Feld `kind` des `openclaw.plugin.json`-Manifests.
  Der Laufzeiteinstieg `kind` bleibt nur als Kompatibilitätsrückgriff für
  ältere Plugins bestehen.
- `configSchema` kann für eine verzögerte Auswertung eine Funktion sein. OpenClaw löst das
  Schema beim ersten Zugriff auf und speichert es zwischen, sodass aufwendige Schema-Builder nur
  einmal ausgeführt werden.
- Ein `nodeHostCommands`-Deskriptor kann `isAvailable({ config, env })` definieren.
  Die Rückgabe von `false` lässt diesen Befehl und seine Fähigkeit in der Gateway-Deklaration
  der Headless-Node aus. OpenClaw wertet dies anhand der lokalen Startkonfiguration
  der Node aus; Befehlshandler sollten die Verfügbarkeit beim Aufruf dennoch
  validieren.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit Channel-spezifischer Verdrahtung: Es ruft automatisch
`api.registerChannel({ plugin })` auf, stellt eine optionale CLI-Metadatenschnittstelle
für die Stammhilfe bereit und beschränkt `registerFull` auf den Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standardwert         |
| --------------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`                  | `string`                                                         | Ja           | -                    |
| `name`                | `string`                                                         | Ja           | -                    |
| `description`         | `string`                                                         | Ja           | -                    |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | -                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | -                    |

Callbacks werden abhängig vom Registrierungsmodus ausgeführt (vollständige Tabelle unter
[Registrierungsmodus](#registration-mode)):

- `setRuntime` wird in jedem Modus außer `"cli-metadata"` und
  `"tool-discovery"` ausgeführt. Speichern Sie hier die Laufzeitreferenz, üblicherweise über
  `createPluginRuntimeStore`.
- `registerCliMetadata` wird für `"cli-metadata"`, `"discovery"` und
  `"full"` ausgeführt. Verwenden Sie dies als kanonischen Ort für CLI-Deskriptoren
  des Channels, damit die Stammhilfe nicht aktivierend bleibt, Erkennungs-Snapshots statische
  Befehlsmetadaten enthalten und die normale CLI-Registrierung mit vollständigen
  Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` wird nur für `"full"` und `"tool-discovery"` ausgeführt. Bei
  `"tool-discovery"` wird es _anstelle der_ Channel-Registrierung ausgeführt: OpenClaw
  überspringt `registerChannel`/`setRuntime` vollständig und ruft nur
  `registerFull` auf. Daher muss jede Provider-/Tool-Registrierung, die Ihr Channel für
  die eigenständige Tool-Erkennung oder -Ausführung benötigt, dort erfolgen und darf nicht hinter der normalen
  Channel-Einrichtung liegen.
- Die Erkennungsregistrierung ist nicht aktivierend, aber nicht importfrei: OpenClaw kann
  den vertrauenswürdigen Plugin-Einstieg und das Channel-Plugin-Modul auswerten, um den
  Snapshot zu erstellen. Halten Sie Importe auf oberster Ebene frei von Seiteneffekten und platzieren Sie Sockets,
  Clients, Worker und Dienste ausschließlich hinter `"full"`-Pfaden.
- Wie `definePluginEntry` kann auch `configSchema` eine verzögerte Factory sein; OpenClaw
  speichert das aufgelöste Schema beim ersten Zugriff zwischen.

CLI-Registrierung:

- Verwenden Sie `api.registerCli(..., { descriptors: [...] })` für Plugin-eigene Stamm-
  CLI-Befehle, die verzögert geladen werden sollen, ohne aus dem Analysebaum
  der Stamm-CLI zu verschwinden. Deskriptornamen dürfen nur Buchstaben, Zahlen,
  Bindestriche und Unterstriche enthalten und müssen mit einem Buchstaben oder
  einer Zahl beginnen; OpenClaw lehnt andere Formen ab und entfernt vor der
  Darstellung der Hilfe Terminal-Steuersequenzen aus Beschreibungen. Decken Sie
  jeden vom Registrar bereitgestellten Stamm eines Befehls der obersten Ebene ab.
  `commands` allein verbleibt im vorab geladenen Kompatibilitätspfad.
- Verwenden Sie `api.registerNodeCliFeature(...)` für Funktionsbefehle gekoppelter Nodes, damit
  sie unter `openclaw nodes` eingeordnet werden (entspricht
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Fügen Sie für andere verschachtelte Plugin-Befehle `parentPath` hinzu und registrieren Sie Befehle
  auf dem an den Registrar übergebenen `program`-Objekt; OpenClaw löst es in
  den übergeordneten Befehl auf, bevor das Plugin aufgerufen wird.
- Registrieren Sie für Kanal-Plugins CLI-Deskriptoren über `registerCliMetadata`
  und beschränken Sie `registerFull` auf reine Laufzeitaufgaben.
- Wenn `registerFull` auch Gateway-RPC-Methoden registriert, verwenden Sie dafür ein
  Plugin-spezifisches Präfix. Reservierte administrative Kern-Namensräume (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer in
  `operator.admin` umgewandelt.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt lediglich `{ plugin }` ohne
Laufzeit- oder CLI-Verknüpfung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt diesen Einstieg anstelle des vollständigen Einstiegs, wenn ein Kanal deaktiviert
oder nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Unter
[Einrichtung und Konfiguration](/de/plugins/sdk-setup#setup-entry) erfahren Sie, wann dies relevant ist.

Kombinieren Sie `defineSetupPluginEntry(...)` mit den spezifischen Familien von Einrichtungshilfen:

| Import                              | Verwendungszweck                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Laufzeitsichere Einrichtungshilfen: `createSetupTranslator`, importsichere Adapter für Einrichtungspatches, Ausgabe von Suchhinweisen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
| `openclaw/plugin-sdk/channel-setup` | Einrichtungsoberflächen für optionale Installationen                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Hilfen für Einrichtungs-/Installations-CLI, Archive und Dokumentation                                                                                                              |

Belassen Sie umfangreiche SDKs, die CLI-Registrierung und langlebige Laufzeitdienste im
vollständigen Einstieg.

Gebündelte Arbeitsbereichskanäle, die Einrichtungs- und Laufzeitoberflächen trennen, können
stattdessen `defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dadurch kann der Einrichtungseinstieg
einrichtungssichere Plugin-/Secret-Exporte beibehalten und zugleich einen Laufzeit-
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

Verwenden Sie dies nur, wenn ein Einrichtungsablauf tatsächlich einen schlanken Laufzeit-Setter oder
eine einrichtungssichere Gateway-Oberfläche benötigt, bevor der vollständige Kanaleinstieg geladen wird.
`registerSetupRuntime` wird nur bei `"setup-runtime"`-Ladevorgängen ausgeführt; beschränken Sie es
auf reine Konfigurationsrouten oder -methoden, die vor der verzögerten
vollständigen Aktivierung verfügbar sein müssen.

## Registrierungsmodus

`api.registrationMode` zeigt Ihrem Plugin, wie es geladen wurde:

| Modus              | Zeitpunkt                                          | Zu registrierende Elemente                                                                                              |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Normaler Gateway-Start                             | Alles                                                                                                                   |
| `"discovery"`      | Schreibgeschützte Fähigkeitserkennung              | Kanalregistrierung plus statische CLI-Deskriptoren; Einstiegscode darf geladen werden, aber Sockets, Worker, Clients und Dienste müssen übersprungen werden |
| `"tool-discovery"` | Begrenztes Laden zum Auflisten oder Ausführen der Tools bestimmter Plugins | Nur Fähigkeiten-/Tool-Registrierung; keine Kanalaktivierung                                                   |
| `"setup-only"`     | Deaktivierter/nicht konfigurierter Kanal           | Nur Kanalregistrierung                                                                                                  |
| `"setup-runtime"`  | Einrichtungsablauf mit verfügbarer Laufzeit        | Kanalregistrierung plus nur die schlanke Laufzeit, die vor dem Laden des vollständigen Einstiegs benötigt wird          |
| `"cli-metadata"`   | Erfassung der Stammhilfe/CLI-Metadaten             | Nur CLI-Deskriptoren                                                                                                    |

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
    // Nur Fähigkeitsoberflächen (Provider/Tools) registrieren, keinen Kanal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Umfangreiche, reine Laufzeitregistrierungen
  api.registerService(/* ... */);
}
```

Langlebige Dienste können über ihren Dienstkontext kleine Invalidierungs- oder
Lebenszyklusereignisse ausgeben:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw versieht dies mit dem Namensraum `plugin.<plugin-id>.changed`. Ereignisnamen bestehen aus einem
Kleinbuchstabensegment, Nutzlasten müssen begrenztes JSON sein und der Geltungsbereich muss
`operator.read`, `operator.write` oder `operator.admin` sein. Der Emitter ist nur
für die Lebensdauer des Dienstes verfügbar und wird nach dem Beenden oder einem fehlgeschlagenen Start widerrufen. Verwenden Sie
vorzugsweise Versions- oder Invalidierungsnutzlasten statt vollständiger Datensätze, damit autorisierte Clients
den kanonischen Zustand über die bereichsgebundenen Gateway-Methoden des Plugins erneut lesen.

Der Erkennungsmodus erstellt einen nicht aktivierenden Snapshot der Registry. Dabei können dennoch
der Plugin-Einstieg und das Kanal-Plugin-Objekt ausgewertet werden, damit OpenClaw
Kanalfähigkeiten und statische CLI-Deskriptoren registrieren kann. Behandeln Sie die
Modulauswertung bei der Erkennung als vertrauenswürdig, aber schlank: keine Netzwerkclients,
Unterprozesse, Listener, Datenbankverbindungen, Hintergrund-Worker,
Zugangsdatenzugriffe oder andere aktive Laufzeitnebeneffekte auf oberster Ebene.

Betrachten Sie `"setup-runtime"` als das Zeitfenster, in dem ausschließlich für die Einrichtung benötigte Startoberflächen
vorhanden sein müssen, ohne erneut in die vollständige gebündelte Kanallaufzeit einzutreten. Gut geeignet sind
Kanalregistrierung, einrichtungssichere HTTP-Routen, einrichtungssichere Gateway-Methoden
und delegierte Einrichtungshilfen. Umfangreiche Hintergrunddienste, CLI-Registrare und
Initialisierungen von Provider-/Client-SDKs gehören weiterhin in `"full"`.

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins anhand ihres Registrierungsverhaltens:

| Form                  | Beschreibung                                       |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)             |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                       |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten      |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) - Registrierungs-API und Subpfadreferenz
- [Laufzeithilfen](/de/plugins/sdk-runtime) - `api.runtime` und `createPluginRuntimeStore`
- [Einrichtung und Konfiguration](/de/plugins/sdk-setup) - Manifest, Einrichtungseinstieg, verzögertes Laden
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Registrierung und Hooks
