---
read_when:
    - Sie möchten den OpenClaw-Codemodus für einen Agentenlauf aktivieren
    - Sie müssen erklären, warum sich der Code-Modus vom Codex-Code-Modus unterscheidet.
    - Sie überprüfen den kompakten Tool-Vertrag, die QuickJS-WASI-Sandbox, die TypeScript-Transformation oder die verborgene Toolkatalog-Bridge
    - Sie fügen eine interne Namespace-Registry-Integration für den Code-Modus hinzu oder überprüfen sie.
sidebarTitle: Code mode
summary: 'OpenClaw-Code-Modus: eine optional aktivierbare kompakte Tool-Oberfläche auf Basis von QuickJS-WASI und einem verborgenen, laufbezogenen Tool-Katalog'
title: Code-Modus
x-i18n:
    generated_at: "2026-07-12T15:57:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

Code Mode ist eine experimentelle OpenClaw-Agent-Runtime-Funktion, die ausdrücklich aktiviert werden muss. Wenn
sie aktiviert ist, sieht das Modell nicht mehr jedes aktivierte Toolschema; stattdessen sieht es
`exec`, `wait` und alle ausschließlich direkt verwendbaren Tools, deren strukturiertes Ergebnis nicht über
die reine JSON-Gast-Bridge übertragen werden kann. Das Modell schreibt ein kleines JavaScript- oder TypeScript-
Programm, das den verborgenen Toolkatalog durchsucht, beschreibt und daraus Tools aufruft.

Diese Seite dokumentiert den OpenClaw Code Mode, nicht den Codex Code Mode. Die beiden Funktionen
haben denselben Namen und dieselben Namen für Steuerungstools (`exec`, `wait`), sind jedoch
separate Implementierungen:

- Codex Code Mode wird innerhalb der Codex-Programmierumgebung ausgeführt. Sein `exec`-Tool ist ein
  Tool mit freier Grammatik: Das Modell schreibt JavaScript-Quelltext im Rohformat (optional
  mit einer vorangestellten `// @exec: {...}`-Pragma-Zeile für Ausführungsoptionen), der
  in einer Deno/V8-Runtime ausgeführt wird.
- OpenClaw Code Mode wird in der generischen OpenClaw-Agent-Runtime ausgeführt und ist
  deaktiviert, sofern nicht `tools.codeMode.enabled: true` konfiguriert ist. Sein `exec`-
  Tool akzeptiert eine JSON-Nutzlast vom Typ `{ code, language }`, die in einem QuickJS-WASI-
  Worker ausgeführt wird.

Beide sind Oberflächen zur JavaScript-Ausführung, nicht zur Ausführung von Shell-Befehlen. Behandeln Sie sie
als unabhängige, unterschiedlich implementierte Funktionen, die zufällig
gleichnamige `exec`-/`wait`-Tools bereitstellen.

## Funktionsweise

- Die für das Modell sichtbare Toolliste besteht aus `exec`, `wait` sowie allen ausschließlich direkt verwendbaren Tools
  wie `computer`, deren Bildergebnis die Gast-Bridge nicht passieren kann.
- `exec` wertet vom Modell generiertes JavaScript oder TypeScript in einem isolierten
  QuickJS-WASI-Worker-Thread aus.
- Jedes aktivierte und für den Katalog geeignete Tool (OpenClaw-Kern, Plugin, MCP, Client) wird vor
  dem Modell-Prompt verborgen und innerhalb des Gastprogramms über `ALL_TOOLS`
  und `tools` bereitgestellt.
- Gastcode durchsucht den verborgenen Katalog, beschreibt das Schema eines Tools und ruft
  ein Tool über denselben Ausführungspfad auf, der bei normalen Agent-Durchläufen verwendet wird (Richtlinien,
  Genehmigungen, Hooks und Telemetrie gelten weiterhin).
- MCP-Tools sind unter dem Namespace `MCP` gruppiert; im Code Mode ist dies die
  einzige unterstützte Möglichkeit, sie aufzurufen.
- `wait` setzt einen unterbrochenen Code-Mode-Durchlauf fort, wenn verschachtelte Toolaufrufe noch
  ausstehen.

Code Mode ändert nur die modellseitige Orchestrierungsoberfläche. Er ersetzt weder
Tools, Plugin-Tools, MCP-Tools, Authentifizierung, Genehmigungsrichtlinien, das
Kanalverhalten noch die Modellauswahl.

## Gründe für die Verwendung

- Kleinere Prompt-Oberfläche: Provider erhalten zwei Steuerungstools und nur die wenigen
  erforderlichen direkten Tools anstelle von Dutzenden oder Hunderten vollständiger Toolschemas.
- Bessere Orchestrierung: Das Modell kann Schleifen, Zusammenführungen, kleine Transformationen,
  bedingte Logik und parallele verschachtelte Toolaufrufe innerhalb einer Codezelle verwenden.
- Provider-neutral: Funktioniert für OpenClaw-, Plugin-, MCP- und Client-Tools, ohne
  von der nativen Codeausführung eines Providers abhängig zu sein.
- Sicheres Fehlschlagen: Wenn Code Mode aktiviert, die QuickJS-WASI-Runtime jedoch
  nicht verfügbar ist, schlägt der Durchlauf fehl, anstatt stillschweigend auf eine umfassende direkte
  Toolbereitstellung zurückzufallen.

Am nützlichsten ist Code Mode für Agenten mit einem großen aktivierten Toolkatalog oder für Workflows, bei denen
das Modell mehrere Tools suchen, kombinieren und aufrufen muss, bevor es antwortet.

## Aktivierung

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Kurzform:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Code Mode bleibt deaktiviert, wenn `tools.codeMode` weggelassen wird, `false` ist oder ein Objekt
ohne `enabled: true` enthält.

Wenn Sie Sandbox-Agenten mit konfigurierten MCP-Servern verwenden, erlauben Sie außerdem das
mitgelieferte MCP-Plugin in der Sandbox-Toolrichtlinie, beispielsweise
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Siehe
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Legen Sie für engere Grenzen explizite Limits fest:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Um beim Debuggen die Form der Modellnutzlast zu bestätigen, führen Sie den Gateway mit
gezielter Protokollierung aus:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Bei aktivem Code Mode sollten die protokollierten modellseitigen Toolnamen `exec` und
`wait` lauten. Um die vollständige geschwärzte Provider-Nutzlast zu erhalten, fügen Sie für eine kurze Debugging-Sitzung
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` hinzu.

## Technischer Überblick

Der Rest dieser Seite behandelt den Runtime-Vertrag und Implementierungsdetails
für Maintainer, Plugin-Autoren, die die Toolbereitstellung debuggen, sowie Betreiber,
die risikoreiche Bereitstellungen validieren.

## Runtime-Status

|                     |                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                                        |
| Standardzustand     | deaktiviert                                                                                          |
| Stabilität          | experimentelle OpenClaw-Oberfläche (Codex Code Mode ist eine separate, stabile Codex-Harness-Oberfläche) |
| Zieloberfläche      | generische OpenClaw-Agent-Durchläufe                                                                 |
| Sicherheitsmodell   | Modellcode ist nicht vertrauenswürdig                                                                |
| Benutzerseitige Zusage | Das Aktivieren von Code Mode führt niemals stillschweigend zu einer umfassenden direkten Toolbereitstellung |

## Umfang

Der Code-Modus bestimmt die dem Modell präsentierte Orchestrierungsstruktur für einen vorbereiteten Lauf. Er
ist nicht für die Modellauswahl, das Kanalverhalten, die Authentifizierung, die Tool-Richtlinie oder die Tool-
Implementierungen zuständig.

Zum Umfang gehören: für das Modell sichtbare Definitionen von Steuerungs-/Direkt-Tools, die Erstellung des
verborgenen Tool-Katalogs, die Ausführung von JavaScript/TypeScript im Gastsystem, die QuickJS-WASI-Worker-
Runtime, Host-Callbacks für Suche/Beschreibung/Aufruf, fortsetzbarer Zustand für angehaltene Gastprogramme,
Grenzwerte für Ausgabe/Timeout/Arbeitsspeicher/ausstehende Aufrufe/Snapshots sowie die Telemetrie-/Trajektorienprojektion
für verschachtelte Tool-Aufrufe.

Nicht zum Umfang gehören: Provider-eigene Remote-Codeausführung, die Semantik der Shell-Ausführung,
Änderungen an der bestehenden Tool-Autorisierung, persistente, von Benutzern erstellte Skripte,
Paketmanager-/Datei-/Netzwerk-/Modulzugriff im Gastcode und die direkte Wiederverwendung interner
Komponenten des Codex Code Mode.

Provider-eigene Tools wie Remote-Python-Sandboxes sind separate Tools. Siehe
[Codeausführung](/de/tools/code-execution).

## Begriffe

- **Code-Modus**: der OpenClaw-Runtime-Modus, der katalogkompatible Modell-
  Tools verbirgt und `exec`, `wait` sowie erforderliche ausschließlich direkte Tools bereitstellt.
- **Gast-Runtime**: die QuickJS-WASI-JavaScript-VM, die Modellcode auswertet.
- **Host-Bridge**: die schmale, JSON-kompatible Callback-Schnittstelle vom Gastcode
  zurück zu OpenClaw.
- **Katalog**: die laufbezogene Liste effektiver Tools nach der normalen Auflösung von Tool-
  Richtlinie, Plugin, MCP und Client-Tools.
- **Verschachtelter Tool-Aufruf**: ein Tool-Aufruf, der aus Gastcode über die Host-
  Bridge erfolgt.
- **Snapshot**: serialisierter QuickJS-WASI-VM-Zustand, der gespeichert wird, damit `wait`
  einen angehaltenen Code-Modus-Lauf fortsetzen kann.

## Konfiguration

`tools.codeMode.enabled` ist die Aktivierungssperre; das Festlegen anderer Felder
aktiviert die Funktion nicht von selbst.

| Feld                  | Standardwert                   | Begrenzung                                      |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolesch; nur `true` aktiviert den Code-Modus   |
| `runtime`             | `"quickjs-wasi"`               | einziger unterstützter Wert                     |
| `mode`                | `"only"`                       | stellt Steuerungs-/Direkt-Tools bereit und katalogisiert den Rest |
| `languages`           | `["javascript", "typescript"]` | beliebige Teilmenge der beiden                  |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | auf `maxSearchLimit` begrenzt                    |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Wenn der Code-Modus aktiviert ist, QuickJS-WASI jedoch nicht geladen werden kann, bricht OpenClaw
diesen Lauf sicher ab; normale Tools werden nicht stillschweigend als Ausweichlösung bereitgestellt.

## Aktivierung

Der Code-Modus wird ausgewertet, nachdem die effektive Tool-Richtlinie bekannt ist und bevor die
abschließende Modellanfrage zusammengestellt wird:

1. Agent, Modell, Provider, Sandbox, Kanal, Absender und Ausführungsrichtlinie
   auflösen.
2. Die effektive OpenClaw-Tool-Liste erstellen und zulässige Plugin-, MCP- und
   Client-Tools hinzufügen.
3. Zulassen-/Ablehnen-Richtlinie anwenden.
4. Wenn `tools.codeMode.enabled` auf false gesetzt ist, mit der normalen Tool-Bereitstellung fortfahren.
5. Wenn die Option aktiviert ist und Tools für die Ausführung aktiv sind, die erforderlichen
   ausschließlich direkten Tools beibehalten und jedes katalogfähige effektive Tool im Code-Modus-Katalog
   registrieren.
6. Die katalogisierten Tools aus der für das Modell sichtbaren Liste entfernen; `exec` und
   `wait` zusammen mit den beibehaltenen ausschließlich direkten Tools hinzufügen.

Ausführungen, die absichtlich keine Tools haben (unverarbeitete Modellaufrufe, `disableTools: true`
oder eine leere `tools.allow`-Liste), aktivieren die Code-Modus-Oberfläche auch dann nicht,
wenn `tools.codeMode.enabled: true` konfiguriert ist. Code-Modus und OpenClaw Tool
Search schließen sich für eine Ausführung gegenseitig aus; wenn der Code-Modus aktiviert wird, findet die
Compaction von Tool Search nicht statt.

Der Code-Modus-Katalog ist auf die Ausführung beschränkt und darf keine Tools eines anderen
Agenten, einer anderen Sitzung, eines anderen Absenders oder einer anderen Ausführung offenlegen.

## Für das Modell sichtbare Tools

Wenn der Code-Modus aktiv ist, sieht das Modell `exec`, `wait` und alle erforderlichen
ausschließlich direkten Tools. Jedes andere aktivierte Tool wird aus der für das Modell sichtbaren
Tool-Liste ausgeblendet und im Code-Modus-Katalog registriert.

Verwenden Sie `exec` für die Tool-Orchestrierung, das Zusammenführen von Daten, Schleifen, parallele verschachtelte Aufrufe
und strukturierte Transformationen. Verwenden Sie `wait` nur, wenn `exec` ein fortsetzbares
`waiting`-Ergebnis zurückgibt.

## `exec`

`exec` startet eine Code-Mode-Zelle und gibt ein Ergebnis zurück. Der Eingabecode wird vom Modell
generiert und muss als potenziell schädlich behandelt werden.

Eingabe:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Regeln:

- Eines von `code` oder `command` darf nicht leer sein.
- `code` ist das dokumentierte, dem Modell bereitgestellte Feld.
- `command` wird als mit exec kompatibler Alias für Hook-Richtlinien und
  vertrauenswürdige Umschreibungen akzeptiert (das normale OpenClaw-Shell-exec-Werkzeug verwendet ebenfalls ein
  `command`-Feld); wenn beide vorhanden sind, müssen die Werte übereinstimmen.
- `language` hat standardmäßig den Wert `"javascript"`; das Schema stellt es als flache
  String-Enumeration (`"javascript" | "typescript"`) bereit, nicht als `oneOf`-/`anyOf`-Union,
  da einige Provider diese Strukturen ablehnen.
- Wenn `language` den Wert `"typescript"` hat, transpiliert OpenClaw den Code vor der Auswertung.
- `exec` lehnt `import`, `require`, dynamische Importe und Modullader-
  Muster ab.
- `exec` stellt die normale Shell-`exec`-Implementierung niemals rekursiv bereit.
- Äußere `exec`-Hook-Ereignisse im Code-Modus enthalten `toolKind: "code_mode_exec"` und
  `toolInputKind: "javascript" | "typescript"` (sofern bekannt), damit Richtlinien
  Code-Modus-Zellen von Shell-artigen `exec`-Aufrufen unterscheiden können, die denselben
  Werkzeugnamen verwenden.

Ergebnis:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` gibt `waiting` zurück, wenn die QuickJS-VM mit einem fortsetzbaren Zustand angehalten wird, der
noch eine für das Modell sichtbare Fortsetzung benötigt; das Ergebnis enthält eine `runId` für
`wait`. Namespace-Bridge-Aufrufe, einschließlich MCP-Namespace-Aufrufen, werden
innerhalb desselben `exec`-/`wait`-Aufrufs automatisch vollständig verarbeitet, solange sie bereit sind, sodass ein kompakter Codeblock
ein MCP-Tool aufrufen kann, ohne pro awaited Namespace-Aufruf einen Modell-Tool-Aufruf zu
erzwingen.

`exec` gibt nur dann `completed` zurück, wenn die Gast-VM keine ausstehenden Aufgaben mehr hat und der
endgültige Wert nach der Ausführung des Ausgabeadapters von OpenClaw JSON-kompatibel ist.

## `wait`

`wait` setzt eine angehaltene Code-Mode-VM fort.

Eingabe:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Die Ausgabe ist dieselbe von `exec` zurückgegebene `CodeModeResult`-Union.

`wait` ist erforderlich, weil verschachtelte OpenClaw-Tools langsam, interaktiv oder durch Genehmigungen
beschränkt sein können oder Teilaktualisierungen streamen; das Modell sollte nicht einen langen
`exec`-Aufruf geöffnet halten müssen, während der Host auf externe Arbeit wartet.

QuickJS-WASI-Snapshot/Wiederherstellung dient als Fortsetzungsmechanismus:

1. `exec` wertet Code bis zum Abschluss, einem Fehler oder einer Unterbrechung aus.
2. Bei einer Unterbrechung erstellt OpenClaw einen Snapshot der QuickJS-VM und zeichnet ausstehende Host-
   Arbeit auf.
3. Sobald die ausstehende Arbeit abgeschlossen ist, stellt `wait` den VM-Snapshot wieder her und
   registriert Host-Callbacks anhand stabiler Namen erneut.
4. OpenClaw übergibt Ergebnisse verschachtelter Tools an die wiederhergestellte VM und arbeitet
   ausstehende QuickJS-Jobs ab.
5. `wait` gibt `completed`, `failed` oder ein weiteres `waiting`-Ergebnis zurück.

Snapshots sind Laufzeitstatus und keine Benutzerartefakte: Sie befinden sich ausschließlich in einer
prozessinternen Map (kein Datenbank- oder Festplattenschreibvorgang), sind größenbeschränkt, laufen ab und sind
auf den Lauf und die Sitzung beschränkt, die sie erstellt haben.

`wait` schlägt (mit einem `failed`-Ergebnis) fehl, wenn:

- `runId` ist unbekannt oder der zugehörige Snapshot ist bereits abgelaufen.
- Der Aufrufer befindet sich nicht im selben Ausführungs-/Sitzungsbereich wie die angehaltene Ausführung.
- Für diese `runId` wird bereits ein `wait` ausgeführt.
- Die Wiederherstellung von QuickJS-WASI schlägt fehl.
- Eine Fortsetzung würde `maxOutputBytes` oder `maxSnapshotBytes` überschreiten.

## Gast-Laufzeit-API

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` enthält kompakte Metadaten für den ausführungsbezogenen Katalog; vollständige Schemas sind standardmäßig
nicht enthalten.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

Plugin-Tools verwenden `source: "openclaw"`, wobei `sourceName` auf die ID des zugehörigen
Plugins gesetzt ist; es gibt keinen separaten Quellwert `"plugin"`. `source: "mcp"` wird
nur für MCP-Einträge in den Metadaten `sourceName`/`mcp` verwendet (und aus
`ALL_TOOLS`/`tools.*` herausgefiltert, siehe unten).

Das vollständige Schema wird nur bei Bedarf geladen:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Katalog-Hilfsfunktionen:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Komfortfunktionen für Tools werden nur für eindeutige, sichere Namen installiert:

```typescript
const files = await tools.search("Lokale Datei lesen");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// Wenn der ausgeblendete Katalog einen eindeutigen `web_search`-Eintrag enthält:
const hits = await tools.web_search({ query: "OpenClaw-Code-Modus" });
```

MCP-Katalogeinträge können im Code-Modus nicht über `tools.call(...)` oder Komfortfunktionen
aufgerufen werden; sie werden ausschließlich über den generierten `MCP`-Namespace
bereitgestellt. Deklarationsdateien im TypeScript-Stil sind über die schreibgeschützte
virtuelle `API`-Dateioberfläche verfügbar, sodass Agenten MCP-Signaturen prüfen können,
ohne dem Prompt MCP-Schemas hinzuzufügen:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Gateway-Protokolle untersuchen",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` gibt kompakte Deklarationen zurück, die aus den Metadaten der MCP-Tools abgeleitet wurden:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Diesen API-Header im TypeScript-Stil zurückgeben. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Ein GitHub-Issue erstellen.
   * @param owner Repository-Eigentümer
   * @param repo Repository-Name
   * @param title Issue-Titel
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Deklarationsdateien sind virtuell und werden nicht im Workspace- oder Zustandsverzeichnis gespeichert. Für jeden `exec`-Aufruf im Code-Modus erstellt OpenClaw den ausführungsbezogenen Tool-Katalog, behält die sichtbaren MCP-Einträge bei, rendert `mcp/index.d.ts` sowie eine Datei `mcp/<server>.d.ts` pro sichtbarem Server und injiziert diese kleine schreibgeschützte Tabelle in den QuickJS-Worker. Gastcode sieht nur das `API`-Objekt: `API.list(prefix?)` gibt Dateimetadaten zurück und `API.read(path)` gibt den Inhalt der ausgewählten Deklaration zurück. Unbekannte Pfade und `.`/`..`-Segmente werden abgelehnt.

Dadurch bleiben große MCP-Schemas aus dem Modell-Prompt heraus: Der Agent erfährt aus der Beschreibung des `exec`-Tools, dass die virtuelle API vorhanden ist, liest nur die benötigte Deklarationsdatei und ruft anschließend `MCP.<server>.<tool>()` mit einem einzelnen Objektargument auf. `MCP.<server>.$api()` bleibt als Inline-Fallback für eine Schemaantwort zu einem einzelnen Tool innerhalb des Programms verfügbar.

Die Gast-Laufzeit sieht Hostobjekte niemals direkt. Ein- und Ausgaben passieren die Brücke als JSON-kompatible Werte mit expliziten Größenbeschränkungen.

## Interne Namespaces

Interne Namespaces stellen dem Code-Modus eine kompakte Domänen-API bereit, ohne weitere für das Modell sichtbare Tools hinzuzufügen. Eine vom Loader verwaltete Integration registriert einen Namespace wie `Issues` oder `Calendar`; Gastcode ruft diesen Namespace anschließend innerhalb des QuickJS-Programms auf, während das Modell weiterhin nur die kompakte Steuerungs-/Direktoberfläche sieht.

Namespaces sind vorerst intern. Es gibt keine öffentliche Namespace-API im Plugin-SDK: Externe Plugin-Namespaces benötigen einen vom Loader verwalteten Vertrag, damit Plugin-Identität, installierte Manifeste, Authentifizierungsstatus und zwischengespeicherte Katalogdeskriptoren nicht von den Plugin-Tools abweichen können, auf denen der Namespace basiert. Der Kern des Code-Modus ist ausschließlich für Sandbox, Serialisierung, Katalogzugriffskontrolle und Bridge-Dispatch zuständig.

Gastcode kann entweder das direkte globale Objekt oder die `namespaces`-Map verwenden:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Lebenszyklus der Registry

Die Namespace-Registry ist prozesslokal und nach Namespace-ID indiziert:

1. Ein vertrauenswürdiger Loader ruft `registerCodeModeNamespaceForPlugin(pluginId, registration)` auf.
2. Der Code-Modus erstellt die verborgene `ToolSearchRuntime` für die Ausführung und liest deren ausführungsbezogenen Katalog.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` behält nur Registrierungen bei, deren `requiredToolNames` alle sichtbar sind und demselben `pluginId` gehören.
4. Jeder sichtbare Namespace ruft für die aktuelle Ausführung `createScope(ctx)` auf und erhält Ausführungskontext wie `agentId`, `sessionKey`, `sessionId`, `runId`, Konfiguration und Abbruchstatus.
5. Scope-Daten werden in einen einfachen Deskriptor serialisiert und als direkte globale Objekte sowie als `namespaces.<globalName>` in QuickJS injiziert.
6. Gastaufrufe werden über die Worker-Bridge ausgesetzt, lösen den Namespace-Pfad auf dem Host auf, ordnen den Aufruf einem deklarierten, Plugin-eigenen Katalog-Tool zu und führen dieses Tool über `ToolSearchRuntime.callExactId` aus.
7. Bereite Namespace-Bridge-Aufrufe werden innerhalb des aktiven `exec`-/`wait`-Aufrufs automatisch abgearbeitet; wenn beim Timeout noch Namespace-Arbeit aussteht oder der Gast explizit die Ausführung abgibt, setzt `wait` dieselbe Namespace-Laufzeit später fort.
8. Beim Rollback oder bei der Deinstallation eines Plugins wird `clearCodeModeNamespacesForPlugin(pluginId)` aufgerufen, damit veraltete globale Objekte einen fehlgeschlagenen Plugin-Ladevorgang nicht überdauern.

Namespace-Aufrufe sind Katalog-Tool-Aufrufe: Sie verwenden dieselben Richtlinien-Hooks, Genehmigungen, dieselbe Abbruchbehandlung, Telemetrie, Transkriptprojektion und dasselbe Aussetzen/Fortsetzen-Verhalten wie `tools.call(...)`.

### Registrierungsstruktur

Registrieren Sie Namespaces aus der Integration, der die zugrunde liegenden Tools gehören. Halten Sie den Scope klein und stellen Sie nur Domänenverben bereit, die deklarierten Katalog-Tools zugeordnet werden.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub-Issue-Hilfsfunktionen für das aktuelle Repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Verwenden Sie Issues.list(params) und Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` kennzeichnet ein Scope-Mitglied als aufrufbare Namespace-Funktion. Der optionale `inputMapper` empfängt die Gastargumente und gibt das Eingabeobjekt für das zugrunde liegende Katalog-Tool zurück; ohne einen solchen Mapper wird das erste Gastargument verwendet oder `{}`, wenn es fehlt.

Unverarbeitete Hostfunktionen werden abgelehnt, bevor Gastcode ausgeführt wird:

```typescript
createScope: () => ({
  // Falsch: Dies umgeht den Lebenszyklus des Katalog-Tools und wird abgelehnt.
  list: async () => githubClient.listIssues(),
});
```

### Eigentümerschaft und Sichtbarkeit

Die Eigentümerschaft eines Namespaces ist an die `pluginId` des Registrierungsaufrufers gebunden. `requiredToolNames` dient sowohl als Sichtbarkeitsbarriere als auch als Eigentümerschaftsprüfung:

- Jedes erforderliche Tool muss im Ausführungskatalog vorhanden sein.
- Jedes erforderliche Tool muss `sourceName === pluginId` aufweisen.
- Der Namespace wird ausgeblendet, wenn ein erforderliches Tool fehlt oder einem anderen Plugin gehört.
- Jeder aufrufbare Pfad darf ausschließlich auf ein in `requiredToolNames` genanntes Tool verweisen.

Dies verhindert, dass ein anderes Plugin durch die Registrierung eines gleichnamigen Tools einen Namespace verfügbar macht, und hält Namespaces mit den gewöhnlichen Agent-Richtlinien in Einklang: Wenn die Ausführung die zugrunde liegenden Tools nicht sehen kann, kann sie auch den Namespace nicht sehen.

Ein GitHub-Namespace sollte beispielsweise hinter einem GitHub-eigenen Plugin liegen, dem die GitHub-Authentifizierung, REST-/GraphQL-Clients, Ratenbegrenzungen, Schreibgenehmigungen und Tests gehören. Der Kern des Code-Modus sollte keine GitHub-spezifischen APIs, Token-Verarbeitung oder Provider-Richtlinien enthalten.

### Regeln für die Scope-Serialisierung

`createScope(ctx)` darf ein einfaches Objekt zurückgeben, das JSON-kompatible Werte, Arrays, verschachtelte Objekte und Aufrufmarkierungen von `createCodeModeNamespaceTool(...)` enthält. Hostobjekte gelangen niemals direkt in QuickJS.

Der Serializer lehnt Folgendes ab:

- rohe Funktionen
- zirkuläre Objektgraphen
- unsichere Pfadsegmente: `__proto__`, `constructor`, `prototype`, leere Schlüssel
  oder Schlüssel, die das interne Pfadtrennzeichen enthalten
- `globalName`-Werte, die keine JavaScript-Bezeichner sind
- `globalName`-Kollisionen mit integrierten globalen Code-Mode-Variablen wie `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` oder
  `__openclaw*`

Werte, die nicht als JSON serialisiert werden können, werden vor dem
Überqueren der Bridge in JSON-sichere Fallback-Werte umgewandelt. Binärdaten,
Handles, Sockets, Clients und Klasseninstanzen sollten hinter gewöhnlichen
Katalog-Tools verbleiben.

### Prompts

Die `description` des Namespace und der optionale `prompt` werden nur dann an
das für das Modell sichtbare `exec`-Schema angehängt, wenn der Namespace für
diesen Lauf sichtbar ist. Verwenden Sie sie, um die kleinste nützliche
Oberfläche zu vermitteln:

```typescript
{
  description: "Hilfsfunktionen für den Fiction-Produktionsdienst.",
  prompt:
    "Verwenden Sie Fictions.riskAudit(), Fictions.promoteIfReady(id, status) und Fictions.unpaidOver(amount).",
}
```

Beschränken Sie Prompts auf den Vertrag des Namespace, nicht auf die
Authentifizierungseinrichtung, den Implementierungsverlauf oder nicht
zugehöriges Plugin-Verhalten.

### Bereinigung

Namespaces sind prozesslokale Registrierungen. Entfernen Sie sie, wenn das
besitzende Plugin deaktiviert, deinstalliert oder zurückgesetzt wird:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Die Bereinigung im Code-Mode liegt in der Verantwortung des Plugins. Löschen
Sie die Namespace-Registrierungen des Plugins, wenn dessen Lebenszyklus endet,
anstatt für jeden Namespace eigene Teardown-Handles vorzuhalten. Tests können
`clearCodeModeNamespacesForTest()` aufrufen, um zu verhindern, dass
Registrierungen zwischen Testfällen bestehen bleiben.

### Testprüfliste

Änderungen an Namespaces sollten die Sicherheitsgrenze und das Gastverhalten
abdecken:

- Der Namespace-Prompttext erscheint nur, wenn die zugrunde liegenden Tools sichtbar sind
- Gleichnamige Tools aus einem anderen `sourceName` legen den Namespace nicht offen
- Rohe Scope-Funktionen werden abgelehnt
- Gefälschte Namespace-IDs und gefälschte Pfade werden abgelehnt
- Aufrufbare Pfade können nicht auf nicht deklarierte Tools verweisen
- Verschachtelte Objekte und gemeinsam genutzte Referenzen werden korrekt serialisiert
- Namespace-Aufrufe werden über Katalog-Tools ausgeführt und geben JSON-sichere Details zurück
- Fehler können vom Gastcode abgefangen werden
- Angehaltene Namespace-Aufrufe werden über `wait` fortgesetzt
- Ein Plugin-Rollback löscht die Namespace-Registrierungen des besitzenden Plugins

Namespaces ergänzen den generischen Katalog `tools.search`/`tools.call`:
Verwenden Sie den Katalog für beliebige aktivierte OpenClaw-, Plugin- und
Client-Tools, `MCP` für MCP-Tools und andere Namespaces für dokumentierte,
Plugin-eigene Domänen-APIs, bei denen prägnanter Code zuverlässiger ist als
wiederholte Schemaabfragen.

## Ausgabe-API

- `text(value)` fügt dem Array `output` eine menschenlesbare Ausgabe hinzu.
- `json(value)` fügt nach einer JSON-kompatiblen Serialisierung ein strukturiertes
  Ausgabeelement hinzu.
- Der abschließend zurückgegebene Wert des Gastcodes wird in einem
  `completed`-Ergebnis zu `value`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Regeln: Die Ausgabereihenfolge entspricht den Gastaufrufen; die Ausgabe wird durch
`maxOutputBytes` begrenzt; nicht serialisierbare Werte werden in einfache Zeichenfolgen oder
Fehler umgewandelt; Binärwerte werden nicht unterstützt. Bilder und Dateien werden über
gewöhnliche OpenClaw-Tools übertragen, nicht über die Code-Modus-Bridge.

## Tool-Katalog

Der verborgene Katalog enthält Tools nach der effektiven Richtlinienfilterung, und zwar in dieser
Reihenfolge: OpenClaw-Core-Tools, gebündelte Plugin-Tools, externe Plugin-Tools, MCP-
Tools und anschließend vom Client bereitgestellte Tools für den aktuellen Lauf.

Katalog-IDs sind innerhalb eines Laufs stabil und über äquivalente
Tool-Sätze hinweg nach Möglichkeit deterministisch. Tatsächliches Format:

```text
<source>:<owner>:<tool-name>
```

Dabei ist `<source>` entweder `openclaw`, `mcp` oder `client` (Plugin-Tools verwenden
`openclaw` mit der Plugin-ID als `<owner>`; Core-Tools verwenden `openclaw:core:*`).
Beispiele:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Der Katalog lässt die Steuerungs-Tools des Code-Modus (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) sowie ausschließlich direkt aufrufbare Tools aus. Steuerungs-Tools
dürfen nicht rekursiv über den Katalog aufgerufen werden; ausschließlich direkt aufrufbare Tools bleiben für das Modell sichtbar,
da ihre strukturierten Ergebnisse die QuickJS-Bridge nicht passieren können.

MCP-Einträge verbleiben im ausführungsbezogenen Katalog, sodass Richtlinien, Genehmigungen, Hooks,
Telemetrie, Transkriptprojektion und exakte Tool-IDs mit der
normalen Tool-Ausführung gemeinsam genutzt werden. Die für den Gast sichtbaren Ansichten `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` und `tools.call(...)` lassen MCP-Einträge aus. Der
generierte Namespace `MCP.<server>.<tool>({ ...input })` wird wieder zur
exakten Katalog-ID aufgelöst und über denselben Executor-Pfad ausgeführt.

## Interaktion mit der Tool-Suche

Der Code-Modus ersetzt die OpenClaw-Modelloberfläche für die Tool-Suche bei Ausführungen, in denen er
aktiv ist.

Wenn `tools.codeMode.enabled` auf true gesetzt ist und der Codemodus aktiviert wird:

- OpenClaw stellt `tool_search_code`, `tool_search`, `tool_describe`
  oder `tool_call` nicht als für das Modell sichtbare Tools bereit.
- Dasselbe Katalogisierungskonzept wird in die Gastlaufzeit verlagert.
- Die Gastlaufzeit erhält kompakte `ALL_TOOLS`-Metadaten sowie Hilfsfunktionen
  zum Suchen, Beschreiben und Aufrufen von Nicht-MCP-Tools.
- MCP-Aufrufe verwenden den generierten `MCP`-Namespace und dessen `$api()`-Header
  anstelle von `tools.call(...)`.
- Verschachtelte Aufrufe werden über denselben OpenClaw-Ausführungspfad weitergeleitet,
  den die Tool-Suche verwendet.

Weitere Informationen finden Sie unter [Tool-Suche](/de/tools/tool-search). Dort wird
die kompakte Katalogschnittstelle von OpenClaw beschrieben, die der Codemodus bei
aktiven Ausführungen ersetzt.

## Toolnamen und Kollisionen

Das für das Modell sichtbare `exec`-Tool ist das Tool des Codemodus. Wenn das normale
OpenClaw-Shell-Tool `exec` aktiviert ist, wird es vor dem Modell verborgen und wie
jedes andere Tool katalogisiert.

Innerhalb der Gast-Laufzeit:

- `tools.call("openclaw:core:exec", input)` kann das Shell-Ausführungswerkzeug aufrufen, wenn
  die Richtlinie dies zulässt.
- `tools.exec(...)` wird nur installiert, wenn der Katalogeintrag für die Shell-Ausführung einen
  eindeutigen sicheren Namen hat.
- das Code-Mode-Werkzeug `exec` ist über `tools` niemals rekursiv verfügbar.

Wenn zwei Werkzeuge auf denselben sicheren Komfortnamen normalisiert werden, lässt OpenClaw die
Komfortfunktion weg und erfordert `tools.call(id, input)`.

## Verschachtelte Werkzeugausführung

Jeder verschachtelte Werkzeugaufruf durchläuft die Host-Bridge und tritt erneut in OpenClaw ein,
wobei Folgendes erhalten bleibt: aktive Agent-ID, Sitzungs-ID und -Schlüssel, Absender- und Kanalkontext,
Sandbox-Richtlinie, Genehmigungsrichtlinie, Plugin-Hooks `before_tool_call`, Abbruchsignal,
Streaming-Aktualisierungen, sofern verfügbar, sowie Verlaufs-/Audit-Ereignisse.

Verschachtelte Aufrufe werden als echte Werkzeugaufrufe in das Transkript projiziert, sodass Support-
Pakete zeigen, was geschehen ist, wobei die Projektion den übergeordneten Code-Mode-Werkzeugaufruf
und die ID des verschachtelten Werkzeugs angibt.

Parallele verschachtelte Aufrufe sind bis zu `maxPendingToolCalls` zulässig.

## Lebenszyklus von Ausführung und Snapshot

Jede Code-Mode-Ausführung wird in einer prozessinternen, nach `runId` indizierten Map verfolgt (nicht
auf der Festplatte oder in einer Datenbank gespeichert). `exec`/`wait` geben einen von drei
Ergebnisstatus zurück: `completed`, `waiting` oder `failed`.

- Ein Ergebnis mit `waiting` speichert den QuickJS-Snapshot, ausstehende Bridge-Anfragen und
  Gültigkeitsbereichsmetadaten (Agent-Ausführungs-ID, Sitzungs-ID/-Schlüssel), bis `wait` die Ausführung
  fortsetzt oder sie abläuft.
- Ablauf, falsche Sitzung, falsche Ausführung sowie unbekannte/bereits in Fortsetzung befindliche
  `runId`-Werte erzeugen keinen eigenen terminalen Status; sie erscheinen als Ergebnis mit
  `failed` (`code: "invalid_input"`) und einer Meldung wie `code mode
run is unavailable or expired.` oder `code mode run belongs to a different
session.`.
- Der Snapshot einer Ausführung wird aus der Map entfernt, sobald sie mit `completed` oder `failed`
  abgeschlossen ist, oder beim Herunterfahren des Gateways verworfen (nichts übersteht einen Neustart:
  Dies ist vorübergehender Laufzeitzustand).
- Für schreibgeschützte Arbeit kann `exec` `restartSafe: true` setzen. OpenClaw weist dann
  Katalogaufrufe mit Nebenwirkungen und Plugin-Namespaces vor der Ausführung zurück und
  kennzeichnet angehaltene Ergebnisse als sicher wiederholbar. Wenn ein Neustart `wait` unterbricht,
  rekonstruiert die [Neustartwiederherstellung](/gateway/restart-recovery) den Turn aus dem
  Transkript, anstatt den prozesslokalen Snapshot wiederherzustellen. Der Wiederherstellungs-Turn
  selbst bleibt auf auditierte schreibgeschützte Kernwerkzeuge und ausdrücklich sicher
  wiederholbare Plugin-Werkzeuge beschränkt.
- OpenClaw begrenzt die Anzahl gleichzeitig angehaltener Ausführungen pro Prozess (64) und
  weist neue Anhaltungen oberhalb dieser Grenze mit `too many suspended code mode
runs.` zurück.

Der Snapshot-Speicher wird durch `maxSnapshotBytes` pro Ausführung, die oben genannte prozessweite
Obergrenze für angehaltene Ausführungen und `snapshotTtlSeconds` begrenzt.

## QuickJS-WASI-Laufzeit

OpenClaw lädt `quickjs-wasi` als direkte Abhängigkeit im zuständigen Paket; es verwendet keine
transitive Kopie, die für eine nicht damit zusammenhängende Abhängigkeit installiert wurde.

Aufgaben der Laufzeit: das QuickJS-WASI-WebAssembly-Modul kompilieren/laden; pro Code-Mode-Ausführung
oder -Fortsetzung eine isolierte VM erstellen; Host-Callbacks unter stabilen Namen registrieren;
Speicher- und Unterbrechungsgrenzen setzen; JavaScript auswerten; ausstehende Jobs abarbeiten;
den Zustand angehaltener VMs als Snapshot speichern; Snapshots für `wait` wiederherstellen;
VM-Handles und Snapshots nach terminalen Zuständen freigeben.

Die Laufzeit wird in einem Node.js-Worker-Thread außerhalb der Haupt-Ereignisschleife von OpenClaw
ausgeführt. Eine Endlosschleife im Gast darf den Gateway-Prozess nicht unbegrenzt blockieren;
der Unterbrechungs-Handler des Workers erzwingt das Echtzeit-Timeout unabhängig davon, ob der
Gastcode kooperiert.

## TypeScript

Die TypeScript-Unterstützung ist ausschließlich eine Quellcodetransformation: Als Eingabe wird eine
TypeScript-Codezeichenfolge akzeptiert; die Ausgabe ist eine von QuickJS-WASI ausgewertete
JavaScript-Zeichenfolge. Es gibt weder Typprüfung noch Modulauflösung noch `import`/`require`.
Diagnosen werden als Ergebnisse mit `failed` zurückgegeben.

Der TypeScript-Compiler wird nur für TypeScript-Zellen verzögert geladen; reine JavaScript-Zellen
und ein deaktivierter Code-Mode laden ihn niemals.

## Sicherheitsgrenze

Modellcode ist potenziell schädlich. Die Laufzeit nutzt mehrschichtige Sicherheit:

- führt QuickJS-WASI außerhalb der Haupt-Ereignisschleife in einem Worker-Thread aus
- lädt `quickjs-wasi` als direkte Abhängigkeit, nicht über Codex oder ein
  transitives Paket
- kein Dateisystem, Netzwerk, Unterprozess, Modulimport, keine Umgebungsvariablen
  und keine globalen Hostobjekte im Gast
- verwendet QuickJS-Speicher- und Unterbrechungsgrenzen sowie ein Echtzeit-
  Timeout des übergeordneten Prozesses
- erzwingt Obergrenzen für Ausgabe, Snapshots, Protokolle und ausstehende Aufrufe
- serialisiert Werte der Host-Bridge über einen eingeschränkten JSON-Adapter
- konvertiert Hostfehler in einfache Gastfehler, niemals in Objekte des Host-Realms
- verwirft Snapshots bei Timeout, Abbruch, Sitzungsende oder Ablauf
- weist rekursiven Zugriff auf `exec`, `wait` und Tool Search-Steuerungswerkzeuge zurück
- verhindert, dass Kollisionen von Komfortnamen Katalog-Hilfsfunktionen verdecken

Die Sandbox ist eine Sicherheitsebene; Betreiber benötigen für risikoreiche Bereitstellungen
möglicherweise dennoch eine Härtung auf Betriebssystemebene.

## Fehlercodes

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` umfasst ungültige `exec`-/`wait`-Argumente, deaktivierte Sprachen,
zurückgewiesenen Modulzugriff, Fehler bei der TypeScript-Transformation, unbekannte/abgelaufene/
dem falschen Gültigkeitsbereich zugeordnete `runId`-Werte und zu viele angehaltene Ausführungen.
`runtime_unavailable` umfasst einen QuickJS-Worker, der nicht gestartet werden kann oder mit einem
von null abweichenden Status beendet wird.

An den Gast zurückgegebene Fehler sind einfache Daten; Host-`Error`-Instanzen, Stack-
Objekte, Prototypen und Hostfunktionen werden nicht an QuickJS übergeben.

## Telemetrie

Das Feld `telemetry` jedes Ergebnisses meldet: die Größe des ausgeblendeten Katalogs und eine
Aufschlüsselung nach Quelle (`openclaw`-/`mcp`-/`client`-Anzahlen), kumulative
Such-/Beschreibungs-/Aufrufanzahlen für den Katalog der Ausführung sowie die für das Modell
sichtbaren Werkzeugnamen (`exec`, `wait` und beibehaltene ausschließlich direkte Werkzeuge).

Die Telemetrie darf keine Geheimnisse, rohen Umgebungswerte oder nicht redigierte
Werkzeugeingaben enthalten, die über die bestehende Verlaufsrichtlinie von OpenClaw hinausgehen.

## Fehlerdiagnose

Verwenden Sie eine gezielte Modelltransport-Protokollierung, wenn sich der Code-Mode anders als
eine normale Werkzeugausführung verhält:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Verwenden Sie zur Fehlerdiagnose der Payload-Struktur `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Dies protokolliert einen größenbegrenzten, redigierten JSON-Snapshot der Modellanfrage; verwenden
Sie ihn nur während der Fehlerdiagnose, da Prompts und Nachrichtentext dennoch erscheinen können.

Verwenden Sie zum Debuggen von Streams `OPENCLAW_DEBUG_SSE=peek`, um die ersten fünf
redigierten SSE-Ereignisse zu protokollieren. Der Code-Modus schlägt außerdem geschlossen fehl, wenn die endgültige Provider-
Nutzlast nicht genau ein `exec`, ein `wait` und ausschließlich genehmigte
Nur-direkt-Tools enthält, nachdem die Oberfläche des Code-Modus aktiviert wurde.

## Implementierungsstruktur

- Konfigurationsvertrag: `tools.codeMode`
- Katalog-Builder: effektive Tools zu kompakten Einträgen und ID-Zuordnung
- Modelloberflächenadapter: sichtbare Tools durch Steuerungs-/Direkt-Tools ersetzen
- QuickJS-WASI-Laufzeitadapter: laden, auswerten, Snapshot erstellen, wiederherstellen, verwerfen
- Worker-Supervisor: Zeitüberschreitung, Abbruch, Absturzisolierung
- Bridge-Adapter: JSON-sichere Host-Callbacks und Ergebnisübermittlung
- TypeScript-Transformationsadapter
- Snapshot-Speicher: TTL, Größenbegrenzungen, Lauf-/Sitzungsgültigkeit
- Trajektionsprojektion für verschachtelte Tool-Aufrufe
- Telemetriezähler und Diagnoseinformationen

Die Implementierung verwendet Katalog- und Executor-Konzepte aus der Tool-Suche wieder,
nutzt jedoch keinen `node:vm`-Child-Prozess als Sandbox.

## Validierungscheckliste

Die Abdeckung des Code-Modus sollte Folgendes nachweisen:

- eine deaktivierte Konfiguration lässt die bestehende Tool-Bereitstellung unverändert
- eine Objektkonfiguration ohne `enabled: true` lässt den Code-Modus deaktiviert
- eine aktivierte Konfiguration stellt dem Modell `exec`, `wait` und ausschließlich erforderliche Nur-direkt-Tools
  bereit, wenn Tools für den Lauf aktiv sind
- reine Läufe ohne Tools, `disableTools` und leere Zulassungslisten lösen keine
  Erzwingung der Code-Modus-Nutzlast aus
- alle katalogfähigen effektiven Nicht-MCP-Tools erscheinen in `ALL_TOOLS`
- Nur-direkt-Tools bleiben für das Modell sichtbar und erscheinen nicht in `ALL_TOOLS`
- verweigerte Tools erscheinen nicht in `ALL_TOOLS`
- `tools.search`, `tools.describe` und `tools.call` funktionieren für OpenClaw-Tools
- `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` stellen TypeScript-artige
  MCP-Deklarationen ohne Bridge-/Tool-Aufruf bereit
- `$api()` im MCP-Namensraum bleibt als Inline-Fallback für Schemas verfügbar
- Aufrufe im MCP-Namensraum funktionieren für sichtbare MCP-Tools mit einer Objekteingabe, während
  direkte MCP-Katalogeinträge in `tools.*` fehlen
- Steuerungs-Tools der Tool-Suche sind sowohl auf der Modelloberfläche als auch im
  verborgenen Katalog ausgeblendet
- verschachtelte Aufrufe bewahren das Genehmigungs- und Hook-Verhalten
- Shell-`exec` ist für das Modell ausgeblendet, kann jedoch bei entsprechender
  Zulassung über die Katalog-ID aufgerufen werden
- rekursive Code-Modus-Aufrufe von `exec` und `wait` können nicht aus Gastcode aufgerufen werden
- TypeScript-Eingaben werden transformiert und ausgewertet, ohne TypeScript in
  deaktivierten oder reinen JavaScript-Pfaden zu laden
- `import`, `require` sowie der Zugriff auf Dateisystem, Netzwerk und Umgebung schlagen fehl
- Endlosschleifen führen zu einer Zeitüberschreitung und können das Gateway nicht blockieren
- Fehler bei der Speicherbegrenzung beenden die Gast-VM
- Ausgabe- und Snapshot-Begrenzungen werden für abgeschlossene und ausgesetzte Aufrufe durchgesetzt
- `wait` setzt einen ausgesetzten Snapshot fort und gibt den endgültigen Wert zurück
- abgelaufene, abgebrochene, sitzungsfremde und unbekannte `runId`-Werte schlagen fehl
- Transkriptwiedergabe und Persistenz bewahren Steuerungsaufrufe des Code-Modus
- Transkript und Telemetrie zeigen verschachtelte Tool-Aufrufe deutlich an

## E2E-Testplan

Führen Sie diese beim Ändern der Laufzeit als Integrations- oder End-to-End-Tests aus:

1. Starten Sie ein Gateway mit `tools.codeMode.enabled: false`.
2. Senden Sie einen Agenten-Durchlauf mit einer kleinen Menge direkter Tools.
3. Stellen Sie sicher, dass die für das Modell sichtbaren Tools unverändert sind.
4. Starten Sie mit `tools.codeMode.enabled: true` neu.
5. Senden Sie einen Agenten-Durchlauf mit OpenClaw-, Plugin-, MCP- und Client-Test-Tools.
6. Stellen Sie sicher, dass die für das Modell sichtbare Tool-Liste `exec`, `wait` sowie ausschließlich konfigurierte
   Nur-direkt-Tools enthält.
7. Lesen Sie in `exec` `ALL_TOOLS` und stellen Sie sicher, dass die katalogfähigen effektiven Test-
   Tools vorhanden sind, während Nur-direkt-Tools fehlen.
8. Rufen Sie in `exec` OpenClaw-/Plugin-/Client-Tools über `tools.search`,
   `tools.describe` und `tools.call` auf.
9. Rufen Sie in `exec` `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` auf und
   stellen Sie sicher, dass die Deklarationsdateien sichtbare MCP-Tools beschreiben.
10. Rufen Sie in `exec` MCP-Tools über `MCP.<server>.<tool>({ ...input })` auf und
    stellen Sie sicher, dass direkte MCP-Katalogeinträge in `ALL_TOOLS` und
    `tools.*` fehlen.
11. Stellen Sie sicher, dass verweigerte Tools fehlen und nicht über eine erratene ID aufgerufen werden können.
12. Starten Sie einen verschachtelten Tool-Aufruf, der abgeschlossen wird, nachdem `exec` `waiting` zurückgibt.
13. Rufen Sie `wait` auf und stellen Sie sicher, dass die wiederhergestellte VM das Tool-Ergebnis empfängt.
14. Stellen Sie sicher, dass die endgültige Antwort eine nach der Wiederherstellung erzeugte Ausgabe enthält.
15. Stellen Sie sicher, dass Zeitüberschreitung, Abbruch und Ablauf des Snapshots den Laufzeitzustand bereinigen.
16. Exportieren Sie die Trajektorie und stellen Sie sicher, dass verschachtelte Aufrufe unter dem übergeordneten
    Code-Modus-Aufruf sichtbar sind.

Reine Dokumentationsänderungen an dieser Seite sollten weiterhin `pnpm check:docs` ausführen.

## Verwandte Themen

- [Tool-Suche](/de/tools/tool-search)
- [Agentenlaufzeiten](/de/concepts/agent-runtimes)
- [Exec-Tool](/de/tools/exec)
- [Codeausführung](/de/tools/code-execution)
