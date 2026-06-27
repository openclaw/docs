---
read_when:
    - Sie möchten den OpenClaw-Code-Modus für einen Agentenlauf aktivieren
    - Sie müssen erklären, warum der Code-Modus sich vom Codex Code-Modus unterscheidet
    - Sie prüfen den exec/wait-Vertrag, die QuickJS-WASI-Sandbox, die TypeScript-Transformation oder die verborgene Tool-Katalog-Brücke
    - Sie fügen eine interne Integration der code-mode-Namespace-Registry hinzu oder überprüfen sie.
sidebarTitle: Code mode
summary: 'OpenClaw-Code-Modus: eine optionale exec/wait-Tool-Oberfläche, gestützt durch QuickJS-WASI und einen verborgenen laufbezogenen Tool-Katalog'
title: Code-Modus
x-i18n:
    generated_at: "2026-06-27T18:09:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Der Codemodus ist ein experimentelles Agent-Runtime-Feature von OpenClaw. Er ist
standardmäßig deaktiviert. Wenn Sie ihn aktivieren, ändert OpenClaw, was das
Modell für eine Ausführung sieht: Statt jedes aktivierte Tool-Schema direkt
offenzulegen, sieht das Modell nur `exec` und `wait`.

Diese Seite dokumentiert den OpenClaw-Codemodus. Er ist nicht der
Codex-Codemodus. Die beiden Features teilen sich einen Namen, werden aber von
unterschiedlichen Runtimes implementiert und stellen unterschiedliche
`exec`-Verträge bereit:

- Der Codex-Codemodus ist für Codex-App-Server-Threads aktiviert, sofern eine
  eingeschränkte Tool-Richtlinie den nativen Codemodus nicht deaktiviert. Er
  läuft im Codex-Coding-Harness, in dem das Modell Shell-Befehle über einen
  `exec.command`-Vertrag schreibt.
- Der OpenClaw-Codemodus ist deaktiviert, sofern nicht
  `tools.codeMode.enabled: true` konfiguriert ist. Er läuft in der generischen
  Agent-Runtime von OpenClaw, in der das Modell JavaScript- oder
  TypeScript-Programme über einen `exec.code`-Vertrag schreibt.

Der Codex-Codemodus und die Codex-native dynamische Tool-Suche sind stabile
Oberflächen des Codex-Harness. Der OpenClaw-Codemodus ist ein von OpenClaw
verwalteter experimenteller Tool-Oberflächenadapter für generische
OpenClaw-Ausführungen. Er verwendet `quickjs-wasi`, einen verborgenen
OpenClaw-Toolkatalog und den normalen OpenClaw-Tool-Executor.

## Was ist das?

Der OpenClaw-Codemodus lässt das Modell ein kleines JavaScript- oder
TypeScript-Programm schreiben, statt direkt aus einer langen Liste von Tools
auszuwählen.

Wenn der Codemodus aktiv ist:

- Die für das Modell sichtbare Tool-Liste besteht genau aus `exec` und `wait`.
- `exec` wertet modellgeneriertes JavaScript oder TypeScript in einem
  eingeschränkten QuickJS-WASI-Worker aus.
- Normale OpenClaw-Tools werden aus dem Modell-Prompt verborgen und innerhalb des
  Gastprogramms über `ALL_TOOLS` und `tools` bereitgestellt.
- Gastcode kann den verborgenen Katalog durchsuchen, ein Tool beschreiben und
  ein Tool über denselben OpenClaw-Ausführungspfad aufrufen, der von normalen
  Agent-Ausführungen verwendet wird.
- MCP-Tools werden unter dem Namespace `MCP` gruppiert. Im Codemodus ist dieser
  Namespace die einzige unterstützte Methode, MCP-Tools aufzurufen.
- `wait` setzt eine angehaltene Codemodus-Ausführung fort, wenn verschachtelte
  Tool-Aufrufe noch ausstehen.

Der wichtige Unterschied: Der Codemodus ändert die modellseitige
Orchestrierungsoberfläche. Er ersetzt nicht OpenClaw-Tools, Plugin-Tools,
MCP-Tools, Authentifizierung, Genehmigungsrichtlinien, Kanalverhalten oder
Modellauswahl.

## Warum ist das gut?

Der Codemodus erleichtert Modellen die Nutzung großer Tool-Kataloge.

- Kleinere Prompt-Oberfläche: Provider erhalten zwei Steuerungs-Tools statt
  Dutzender oder Hunderter vollständiger Tool-Schemas.
- Bessere Orchestrierung: Das Modell kann Schleifen, Joins, kleine
  Transformationen, bedingte Logik und parallele verschachtelte Tool-Aufrufe
  innerhalb einer Codezelle verwenden.
- Provider-neutral: Er funktioniert für OpenClaw-, Plugin-, MCP- und
  Client-Tools, ohne von provider-nativer Codeausführung abhängig zu sein.
- Bestehende Richtlinien bleiben wirksam: Verschachtelte Tool-Aufrufe laufen
  weiterhin durch OpenClaw-Richtlinien, Genehmigungen, Hooks, Sitzungskontext
  und Audit-Pfade.
- Klarer Fehlermodus: Wenn der Codemodus ausdrücklich aktiviert ist und die
  Runtime nicht verfügbar ist, schlägt OpenClaw geschlossen fehl, statt auf eine
  breite direkte Tool-Offenlegung zurückzufallen.

Der Codemodus ist besonders nützlich für Agenten mit einem großen aktivierten
Tool-Katalog oder für Workflows, in denen das Modell wiederholt Tools suchen,
kombinieren und aufrufen muss, bevor es eine Antwort erzeugt.

## Aktivierung

Fügen Sie der Agent- oder Runtime-Konfiguration
`tools.codeMode.enabled: true` hinzu:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Die Kurzform wird ebenfalls akzeptiert:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Der Codemodus bleibt deaktiviert, wenn `tools.codeMode` ausgelassen wird,
`false` ist oder ein Objekt ohne `enabled: true` ist.

Wenn Sie sandboxed Agents mit konfigurierten MCP-Servern verwenden, stellen Sie
außerdem sicher, dass die Sandbox-Tool-Richtlinie das gebündelte MCP-Plugin
erlaubt, zum Beispiel mit
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Siehe
[Konfiguration - Tools und benutzerdefinierte Provider](/de/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Verwenden Sie ausdrückliche Limits, wenn Sie engere Grenzen festlegen möchten:

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

Um die Form der Modell-Payload beim Debugging zu bestätigen, führen Sie den
Gateway mit gezieltem Logging aus:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Bei aktivem Codemodus sollten die protokollierten modellseitigen Tool-Namen
`exec` und `wait` sein. Wenn Sie die redigierte Provider-Payload benötigen,
fügen Sie für eine kurze Debugging-Sitzung
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` hinzu.

## Technische Tour

Der Rest dieser Seite beschreibt den Runtime-Vertrag und
Implementierungsdetails. Er richtet sich an Maintainer, Plugin-Autoren, die die
Tool-Offenlegung debuggen, und Operatoren, die Hochrisiko-Deployments
validieren.

## Runtime-Status

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Standardzustand: deaktiviert.
- Stabilität: experimentelle OpenClaw-Oberfläche; der Codex-Codemodus ist eine
  separate stabile Codex-Harness-Oberfläche.
- Zieloberfläche: generische OpenClaw-Agent-Ausführungen.
- Sicherheitsposition: Modellcode ist feindlich.
- Benutzerseitiges Versprechen: Die Aktivierung des Codemodus fällt niemals
  stillschweigend auf breite direkte Tool-Offenlegung zurück.

## Umfang

Der Codemodus besitzt die modellseitige Orchestrierungsform für eine vorbereitete
Ausführung. Er besitzt nicht Modellauswahl, Kanalverhalten, Authentifizierung,
Tool-Richtlinien oder Tool-Implementierungen.

Im Umfang:

- für das Modell sichtbare Tool-Definitionen `exec` und `wait`
- Aufbau des verborgenen Tool-Katalogs
- JavaScript- und TypeScript-Gastausführung
- QuickJS-WASI-Worker-Runtime
- Host-Callbacks für Katalogsuche, Schemabeschreibung und Tool-Aufruf
- fortsetzbarer Zustand für angehaltene Gastprogramme
- Limits für Ausgabe, Timeout, Speicher, ausstehende Aufrufe und Snapshots
- Telemetrie und Trajektorienprojektion für verschachtelte Tool-Aufrufe

Außerhalb des Umfangs:

- provider-native Remote-Codeausführung
- Shell-Ausführungssemantik
- Änderung bestehender Tool-Autorisierung
- persistente, von Benutzern verfasste Skripte
- Paketmanager-, Datei-, Netzwerk- oder Modulzugriff in Gastcode
- direkte Wiederverwendung von Codex-Codemodus-Interna

Provider-eigene Tools wie Remote-Python-Sandboxes bleiben separate Tools. Siehe
[Codeausführung](/de/tools/code-execution).

## Begriffe

**Codemodus** ist der OpenClaw-Runtime-Modus, der normale Modell-Tools verbirgt
und nur `exec` und `wait` offenlegt.

**Gast-Runtime** ist die QuickJS-WASI-JavaScript-VM, die Modellcode auswertet.

**Host-Bridge** ist die schmale JSON-kompatible Callback-Oberfläche vom Gastcode
zurück in OpenClaw.

**Katalog** ist die ausführungsbezogene Liste wirksamer Tools nach normaler
Tool-Richtlinie sowie Plugin-, MCP- und Client-Tool-Auflösung.

**Verschachtelter Tool-Aufruf** ist ein Tool-Aufruf, der aus Gastcode über die
Host-Bridge erfolgt.

**Snapshot** ist serialisierter QuickJS-WASI-VM-Zustand, der gespeichert wird,
damit `wait` eine angehaltene Codemodus-Ausführung fortsetzen kann.

## Konfiguration

`tools.codeMode.enabled` ist die Aktivierungsschranke. Das Setzen anderer
Codemodus-Felder aktiviert das Feature nicht.

Unterstützte Felder:

- `enabled`: boolesch. Standard `false`. Aktiviert den Codemodus nur bei `true`.
- `runtime`: `"quickjs-wasi"`. Einzige unterstützte Runtime.
- `mode`: `"only"`. Legt `exec` und `wait` offen, verbirgt normale Modell-Tools.
- `languages`: Array aus `"javascript"` und `"typescript"`. Standard enthält
  beide.
- `timeoutMs`: Echtzeitgrenze für ein `exec` oder `wait`. Standard `10000`.
  Runtime-Begrenzung: `100` bis `60000`.
- `memoryLimitBytes`: QuickJS-Heap-Grenze. Standard `67108864`.
  Runtime-Begrenzung: `1048576` bis `1073741824`.
- `maxOutputBytes`: Grenze für zurückgegebenen Text, JSON und Logs. Standard
  `65536`. Runtime-Begrenzung: `1024` bis `10485760`.
- `maxSnapshotBytes`: Grenze für serialisierte VM-Snapshots. Standard
  `10485760`. Runtime-Begrenzung: `1024` bis `268435456`.
- `maxPendingToolCalls`: Grenze für gleichzeitige verschachtelte Tool-Aufrufe.
  Standard `16`. Runtime-Begrenzung: `1` bis `128`.
- `snapshotTtlSeconds`: wie lange eine angehaltene VM fortgesetzt werden kann.
  Standard `900`. Runtime-Begrenzung: `1` bis `86400`.
- `searchDefaultLimit`: Standardanzahl für Suchergebnisse im verborgenen
  Katalog. Standard `8`. Die Runtime begrenzt dies auf `maxSearchLimit`.
- `maxSearchLimit`: maximale Anzahl für Suchergebnisse im verborgenen Katalog.
  Standard `50`. Runtime-Begrenzung: `1` bis `50`.

Wenn der Codemodus aktiviert ist, QuickJS-WASI aber nicht geladen werden kann,
schlägt OpenClaw für diese Ausführung geschlossen fehl. Normale Tools werden
nicht stillschweigend als Fallback offengelegt.

## Aktivierung

Der Codemodus wird ausgewertet, nachdem die wirksame Tool-Richtlinie bekannt ist
und bevor die endgültige Modellanfrage zusammengesetzt wird.

Aktivierungsreihenfolge:

1. Agent, Modell, Provider, Sandbox, Kanal, Absender und Ausführungsrichtlinie
   auflösen.
2. Die wirksame OpenClaw-Tool-Liste erstellen.
3. Geeignete Plugin-, MCP- und Client-Tools hinzufügen.
4. Allow- und Deny-Richtlinie anwenden.
5. Wenn `tools.codeMode.enabled` falsch ist, mit normaler Tool-Offenlegung
   fortfahren.
6. Wenn aktiviert und Tools für die Ausführung aktiv sind, die wirksamen Tools
   im Codemodus-Katalog registrieren.
7. Alle normalen Tools aus der für das Modell sichtbaren Tool-Liste entfernen.
8. Codemodus-`exec` und `wait` hinzufügen.

Ausführungen, die absichtlich keine Tools haben, etwa rohe Modellaufrufe,
`disableTools` oder eine leere Allowlist, aktivieren die Codemodus-Oberfläche
nicht, selbst wenn die Konfiguration `tools.codeMode.enabled: true` enthält.

Der Codemodus-Katalog ist ausführungsbezogen. Er darf keine Tools aus einem
anderen Agenten, einer anderen Sitzung, einem anderen Absender oder einer anderen
Ausführung preisgeben.

## Für das Modell sichtbare Tools

Wenn der Codemodus aktiv ist, sieht das Modell genau diese Top-Level-Tools:

- `exec`
- `wait`

Alle anderen aktivierten Tools werden aus der modellseitigen Tool-Liste verborgen
und im Codemodus-Katalog registriert.

Das Modell sollte `exec` für Tool-Orchestrierung, Datenzusammenführung,
Schleifen, parallele verschachtelte Aufrufe und strukturierte Transformationen
verwenden. Das Modell sollte `wait` nur verwenden, wenn `exec` ein fortsetzbares
`waiting`-Ergebnis zurückgibt.

## `exec`

`exec` startet eine Codemodus-Zelle und gibt ein Ergebnis zurück. Der Eingabecode
wird vom Modell generiert und muss als feindlich behandelt werden.

Eingabe:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Eingaberegeln:

- Eines von `code` oder `command` muss nicht leer sein.
- `code` ist das dokumentierte modellseitige Feld.
- `command` wird als exec-kompatibler Alias für Hook-Richtlinien und
  vertrauenswürdige Umschreibungen akzeptiert; wenn beide vorhanden sind, müssen
  die Werte übereinstimmen.
- Äußere Codemodus-`exec`-Hook-Events enthalten `toolKind: "code_mode_exec"` und
  enthalten `toolInputKind: "javascript" | "typescript"`, wenn die
  Eingabesprache bekannt ist, damit Richtlinien Codemodus-Zellen von
  shellartigen `exec`-Aufrufen unterscheiden können, die denselben Tool-Namen
  teilen.
- `language` ist standardmäßig `"javascript"`.
- Wenn `language` `"typescript"` ist, transpiliert OpenClaw vor der Auswertung.
- `exec` lehnt in v1 `import`, `require`, dynamischen Import und
  Modul-Loader-Muster ab.
- `exec` legt die normale Shell-`exec`-Implementierung nicht rekursiv offen.

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

`exec` gibt `waiting` zurück, wenn die QuickJS-VM mit fortsetzbarem Zustand
angehalten wird, der noch eine für das Modell sichtbare Fortsetzung benötigt.
Das Ergebnis enthält eine `runId` für `wait`. Namespace-Bridge-Aufrufe,
einschließlich MCP-Namespace-Aufrufen, werden innerhalb desselben
`exec`-/`wait`-Aufrufs automatisch geleert, während sie bereit sind, sodass ein
kompakter Codeblock `$api()` inspizieren und ein MCP-Tool aufrufen kann, ohne
einen Modell-Tool-Aufruf pro Namespace-`await` zu erzwingen.

`exec` gibt `completed` nur zurück, wenn die Gast-VM keine ausstehende Arbeit hat und der
Endwert JSON-kompatibel ist, nachdem der Ausgabeadapter von OpenClaw ausgeführt wurde.

## `wait`

`wait` setzt eine angehaltene VM im Code-Modus fort.

Eingabe:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Die Ausgabe ist dieselbe `CodeModeResult`-Union, die von `exec` zurückgegeben wird.

`wait` existiert, weil verschachtelte OpenClaw-Tools langsam, interaktiv, genehmigungspflichtig
sein oder Teilaktualisierungen streamen können. Das Modell sollte keinen langen
`exec`-Aufruf offen halten müssen, während der Host auf externe Arbeit wartet.

QuickJS-WASI-Snapshot und -Wiederherstellung ist der Fortsetzungsmechanismus in v1:

1. `exec` wertet Code bis zum Abschluss, Fehler oder Anhalten aus.
2. Beim Anhalten erstellt OpenClaw einen Snapshot der QuickJS-VM und zeichnet ausstehende Host-Arbeit auf.
3. Wenn ausstehende Arbeit abgeschlossen ist, stellt `wait` den VM-Snapshot wieder her.
4. OpenClaw registriert Host-Callbacks erneut über stabile Namen.
5. OpenClaw liefert verschachtelte Tool-Ergebnisse in die wiederhergestellte VM.
6. OpenClaw leert ausstehende QuickJS-Jobs.
7. `wait` gibt `completed`, `failed` oder ein weiteres `waiting`-Ergebnis zurück.

Snapshots sind Laufzeitstatus, keine Benutzerartefakte. Sie sind größenbegrenzt, laufen ab
und sind auf den Run und die Sitzung beschränkt, die sie erstellt haben.

`wait` schlägt fehl, wenn:

- `runId` unbekannt ist.
- der Snapshot abgelaufen ist.
- der übergeordnete Run oder die Sitzung abgebrochen wurde.
- der Aufrufer sich nicht im selben Run-/Sitzungsumfang befindet.
- die QuickJS-WASI-Wiederherstellung fehlschlägt.
- die Wiederherstellung konfigurierte Grenzen überschreiten würde.

## API der Gast-Laufzeitumgebung

Die Gast-Laufzeitumgebung stellt eine kleine globale API bereit:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` sind kompakte Metadaten für den Run-spezifischen Katalog. Standardmäßig enthält es
keine vollständigen Schemas.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Das vollständige Schema wird nur bei Bedarf geladen:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Katalog-Helfer:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Komfort-Tool-Funktionen werden nur für eindeutige sichere Namen installiert:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP-Katalogeinträge sind im Code-Modus nicht über `tools.call(...)` oder Komfortfunktionen
aufrufbar. Sie werden nur über den generierten `MCP`-Namespace bereitgestellt. Deklarationsdateien
im TypeScript-Stil sind über die schreibgeschützte virtuelle `API`-Dateioberfläche verfügbar,
sodass Agenten MCP-Signaturen prüfen können, ohne MCP-Schemas zum Prompt hinzuzufügen:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` gibt kompakte Deklarationen zurück, die aus MCP-Tool-Metadaten
abgeleitet wurden:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Die Deklarationsdateien sind virtuell, keine Dateien, die unter dem Arbeitsbereich oder dem
Statusverzeichnis geschrieben werden. Für jeden Code-Modus-`exec`-Aufruf erstellt OpenClaw den
Run-spezifischen Tool-Katalog, behält die sichtbaren MCP-Einträge bei, rendert `mcp/index.d.ts`
plus eine `mcp/<server>.d.ts`-Deklaration pro sichtbarem Server und injiziert diese kleine
schreibgeschützte Tabelle in den QuickJS-Worker. Gastcode sieht nur das `API`-Objekt:
`API.list(prefix?)` gibt Dateimetadaten zurück und `API.read(path)` gibt den ausgewählten
Deklarationsinhalt zurück. Unbekannte Pfade und Segmente `.` / `..` werden abgelehnt.

Dadurch bleiben große MCP-Schemas aus dem Modell-Prompt heraus. Der Agent erfährt aus der
Beschreibung des `exec`-Tools, dass die virtuelle API existiert, liest nur die benötigte
Deklarationsdatei und ruft dann `MCP.<server>.<tool>()` mit einem Objektargument auf.
`MCP.<server>.$api()` bleibt als Inline-Fallback verfügbar, wenn der Agent innerhalb des
Programms eine Schemaantwort für ein einzelnes Tool benötigt.

Die Gast-Laufzeitumgebung darf Host-Objekte nicht direkt offenlegen. Eingaben und Ausgaben
überqueren die Bridge als JSON-kompatible Werte mit expliziten Größenobergrenzen.

## Interne Namespaces

Interne Namespaces geben dem Code-Modus eine knappe Domänen-API, ohne weitere
modell-sichtbare Tools hinzuzufügen. Eine vom Loader verwaltete Integration kann einen Namespace
wie `Issues`, `Fictions` oder `Calendar` registrieren; Gastcode ruft diesen Namespace dann
innerhalb des QuickJS-Programms auf, während OpenClaw dem Modell weiterhin nur `exec` und `wait`
anzeigt.

Namespaces sind vorerst intern. Es gibt keine öffentliche Plugin-SDK-Namespace-API:
Externe Plugin-Namespaces benötigen einen vom Loader verwalteten Vertrag, damit Plugin-Identität,
installierte Manifeste, Auth-Status und zwischengespeicherte Katalogdeskriptoren nicht von den
Plugin-Tools abweichen können, die den Namespace stützen. Der zentrale Code-Modus besitzt nur
Sandbox, Serialisierung, Katalog-Gating und Bridge-Dispatch.

Gastcode kann dann entweder das direkte globale Objekt oder die `namespaces`-Map verwenden:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Registry-Lebenszyklus

Die Namespace-Registry ist prozesslokal und nach Namespace-ID verschlüsselt. Ein typischer
Run folgt diesem Pfad:

1. Ein vertrauenswürdiger Loader ruft `registerCodeModeNamespaceForPlugin(pluginId, registration)` auf.
2. Der Code-Modus erstellt die verborgene `ToolSearchRuntime` für den Run und liest ihren
   Run-spezifischen Katalog.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` behält nur Registrierungen bei,
   deren `requiredToolNames` alle sichtbar sind und demselben `pluginId` gehören.
4. Jeder sichtbare Namespace ruft `createScope(ctx)` für den aktuellen Run auf. Der
   Scope erhält Run-Kontext wie `agentId`, `sessionKey`, `sessionId`,
   `runId`, Konfiguration und Abbruchstatus.
5. Scope-Daten werden in einen einfachen Deskriptor serialisiert und als direkte Globals und
   `namespaces.<globalName>` in QuickJS injiziert.
6. Gastaufrufe werden über die Worker-Bridge angehalten, lösen den Namespace-Pfad auf dem
   Host auf, ordnen den Aufruf einem deklarierten Plugin-eigenen Katalog-Tool zu und führen
   dieses Tool über `ToolSearchRuntime.call` aus.
7. OpenClaw leert bereite Namespace-Bridge-Aufrufe automatisch innerhalb des aktiven
   `exec`-/`wait`-Tool-Aufrufs. Wenn Namespace-Arbeit beim Timeout noch aussteht oder der
   Gast explizit die Kontrolle abgibt, setzt `wait` dieselbe Namespace-Laufzeit später fort.
8. Plugin-Rollback oder -Deinstallation ruft `clearCodeModeNamespacesForPlugin(pluginId)` auf,
   damit veraltete Globals einen fehlgeschlagenen Plugin-Ladevorgang nicht überdauern.

Die wichtige Invariante: Namespace-Aufrufe sind Katalog-Tool-Aufrufe. Sie verwenden dieselben
Policy-Hooks, Genehmigungen, Abbruchbehandlung, Telemetrie, Transkriptprojektion und dasselbe
Anhalte-/Fortsetzungsverhalten wie `tools.call(...)`.

### Registrierungsform

Registrieren Sie Namespaces aus der Integration, die die zugrunde liegenden Tools besitzt. Halten
Sie den Scope klein und legen Sie nur Domänenverben offen, die deklarierte Katalog-Tools abbilden.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` markiert ein Scope-Mitglied als aufrufbare
Namespace-Funktion. Der optionale `inputMapper` erhält die Gastargumente und gibt das Eingabeobjekt
für das zugrunde liegende Katalog-Tool zurück. Ohne Eingabe-Mapper wird das erste Gastargument
verwendet oder `{}`, wenn es ausgelassen wird.

Raw-Host-Funktionen werden abgelehnt, bevor Gastcode ausgeführt wird:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Besitz und Sichtbarkeit

Namespace-Besitz ist an die `pluginId` des Registrierungsaufrufers gebunden.
`requiredToolNames` ist sowohl Sichtbarkeits-Gate als auch Besitzprüfung:

- jedes erforderliche Tool muss im Run-Katalog vorhanden sein
- jedes erforderliche Tool muss `sourceName === pluginId` haben
- der Namespace wird verborgen, wenn ein erforderliches Tool fehlt oder einem anderen
  Plugin gehört
- jeder aufrufbare Pfad darf nur auf ein Tool zielen, das in `requiredToolNames` benannt ist

Dies verhindert, dass ein anderes Plugin einen Namespace offenlegt, indem es ein gleichnamiges
Tool registriert. Außerdem bleiben Namespaces mit der gewöhnlichen Agent-Policy ausgerichtet:
Wenn der Run die zugrunde liegenden Tools nicht sehen kann, kann er den Namespace nicht sehen.

Ein GitHub-Namespace sollte zum Beispiel hinter einer GitHub-eigenen Erweiterung leben, die
GitHub-Auth, REST- oder GraphQL-Clients, Ratenlimits, Schreibgenehmigungen und Tests besitzt.
Der zentrale Code-Modus sollte keine GitHub-spezifischen APIs, Token-Behandlung oder
Provider-Policy einbetten.

### Regeln für Scope-Serialisierung

`createScope(ctx)` kann ein einfaches Objekt zurückgeben, das JSON-kompatible Werte,
Arrays, verschachtelte Objekte und Aufrufmarker von `createCodeModeNamespaceTool(...)` enthält.
Host-Objekte gelangen nie direkt in QuickJS.

Der Serializer lehnt ab:

- rohe Funktionen
- zirkuläre Objektgraphen
- unsichere Pfadsegmente: `__proto__`, `constructor`, `prototype`, leere Schlüssel oder
  Schlüssel, die den internen Pfadseparator enthalten
- `globalName`-Werte, die keine JavaScript-Bezeichner sind
- `globalName`-Kollisionen mit integrierten Code-Modus-Globals wie `tools`,
  `namespaces`, `text`, `json`, `yield_control` oder `__openclaw*`

Werte, die nicht als JSON serialisiert werden können, werden in JSON-sichere Fallback-Werte
umgewandelt, bevor sie die Bridge überqueren. Binärdaten, Handles, Sockets, Clients und
Klasseninstanzen sollten hinter gewöhnlichen Katalog-Tools bleiben.

### Prompts

Die Namespace-`description` und der optionale `prompt` werden nur dann an das für das Modell
sichtbare `exec`-Schema angehängt, wenn der Namespace für diesen Run sichtbar ist. Verwenden Sie
sie, um die kleinste nützliche Oberfläche zu vermitteln:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Halten Sie Prompts auf den Namespace-Vertrag beschränkt, nicht auf Auth-Einrichtung,
Implementierungshistorie oder nicht verwandtes Plugin-Verhalten.

### Bereinigung

Namespaces sind prozesslokale Registrierungen. Entfernen Sie sie, wenn das besitzende Plugin
deaktiviert, deinstalliert oder zurückgerollt wird:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Die Code-Modus-Bereinigung gehört dem Plugin; löschen Sie die Namespace-Registrierungen
des Plugins, wenn sein Lebenszyklus endet, statt Teardown-Handles pro Namespace
beizubehalten. Tests können `clearCodeModeNamespacesForTest()` aufrufen, um zu vermeiden,
dass Registrierungen zwischen Fällen weiterbestehen.

### Test-Checkliste

Namespace-Änderungen sollten die Sicherheitsgrenze und das Gastverhalten abdecken:

- Namespace-Prompttext erscheint nur, wenn die zugrunde liegenden Tools sichtbar sind
- gleichnamige Tools von einem anderen `sourceName` legen den Namespace nicht offen
- rohe Scope-Funktionen werden abgewiesen
- gefälschte Namespace-IDs und gefälschte Pfade werden abgewiesen
- aufrufbare Pfade können nicht auf nicht deklarierte Tools zielen
- verschachtelte Objekte und gemeinsam genutzte Referenzen werden korrekt serialisiert
- Namespace-Aufrufe werden über Katalog-Tools ausgeführt und geben JSON-sichere Details zurück
- Fehler können von Gastcode abgefangen werden
- angehaltene Namespace-Aufrufe werden über `wait` fortgesetzt
- Plugin-Rollback löscht die besitzenden Namespace-Registrierungen

Namespaces ergänzen den generischen Katalog `tools.search` / `tools.call`. Verwenden Sie den
Katalog für beliebige aktivierte OpenClaw-, Plugin- und Client-Tools; verwenden Sie `MCP` für
MCP-Tools; verwenden Sie andere Namespaces für Plugin-eigene, dokumentierte Domain-APIs, bei denen
knapper Code zuverlässiger ist als wiederholte Schema-Lookups.

## Ausgabe-API

`text(value)` hängt menschenlesbare Ausgabe an das Array `output` an.

`json(value)` hängt nach JSON-kompatibler Serialisierung ein strukturiertes Ausgabeelement an.

Der endgültig zurückgegebene Wert des Gastcodes wird in einem `completed`-Ergebnis zu `value`.

Ausgabeelement:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Ausgaberegeln:

- die Ausgabereihenfolge entspricht den Gastaufrufen
- die Ausgabe ist durch `maxOutputBytes` begrenzt
- nicht serialisierbare Werte werden in einfache Strings oder Fehler umgewandelt
- Binärwerte werden in v1 nicht unterstützt
- Bilder und Dateien laufen über normale OpenClaw-Tools, nicht über die
  Code-Modus-Bridge

## Tool-Katalog

Der verborgene Katalog enthält Tools nach effektiver Richtlinienfilterung:

1. OpenClaw-Core-Tools.
2. Gebündelte Plugin-Tools.
3. Externe Plugin-Tools.
4. MCP-Tools.
5. Vom Client bereitgestellte Tools für den aktuellen Lauf.

Katalog-IDs sind innerhalb eines Laufs stabil und nach Möglichkeit über äquivalente Tool-Sets hinweg deterministisch.

Empfohlene ID-Form:

```text
<source>:<owner>:<tool-name>
```

Beispiele:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Der Katalog lässt Code-Modus-Steuerungstools aus:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Dies verhindert Rekursion und hält den modellseitigen Vertrag schmal.

MCP-Einträge bleiben im laufbezogenen Katalog, damit Richtlinien, Genehmigungen, Hooks,
Telemetry, Transcript-Projektion und exakte Tool-IDs mit normaler
Tool-Ausführung geteilt bleiben. Die gastseitigen Ansichten `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` und `tools.call(...)` lassen MCP-Einträge aus. Der generierte Namespace
`MCP.<server>.<tool>({ ...input })` wird zurück auf die exakte Katalog-ID aufgelöst und dann über
denselben Executor-Pfad dispatcht.

## Interaktion mit Tool Search

Der Code-Modus ersetzt die OpenClaw-Tool-Search-Modelloberfläche für Läufe, in denen er
aktiv ist.

Wenn `tools.codeMode.enabled` wahr ist und der Code-Modus aktiviert wird:

- OpenClaw stellt `tool_search_code`, `tool_search`, `tool_describe`
  oder `tool_call` nicht als modellsichtbare Tools bereit.
- Die gleiche Katalogisierungsidee wandert in die Gastlaufzeit.
- Die Gastlaufzeit erhält kompakte `ALL_TOOLS`-Metadaten sowie Such-, Beschreibungs-
  und Aufruf-Helper für Nicht-MCP-Tools.
- MCP-Aufrufe verwenden den generierten Namespace `MCP` und dessen `$api()`-Header
  statt `tools.call(...)`.
- Verschachtelte Aufrufe dispatchen über denselben OpenClaw-Executor-Pfad, den Tool Search
  verwendet.

Die bestehende Seite [Tool Search](/de/tools/tool-search) beschreibt die kompakte OpenClaw-
Katalog-Bridge. Der Code-Modus ist die generische OpenClaw-Alternative für Läufe, die
`exec` und `wait` verwenden können.

## Tool-Namen und Kollisionen

Das modellsichtbare Tool `exec` ist das Code-Modus-Tool. Wenn das normale OpenClaw-
Shell-Tool `exec` aktiviert ist, wird es vor dem Modell verborgen und wie jedes
andere Tool katalogisiert.

Innerhalb der Gastlaufzeit:

- `tools.call("openclaw:core:exec", input)` kann das Shell-Exec-Tool aufrufen, wenn
  die Richtlinie es erlaubt.
- `tools.exec(...)` wird nur installiert, wenn der Shell-Exec-Katalogeintrag einen
  eindeutigen sicheren Namen hat.
- das Code-Modus-Tool `exec` ist niemals rekursiv über `tools` verfügbar.

Wenn zwei Tools auf denselben sicheren Convenience-Namen normalisiert werden, lässt OpenClaw die
Convenience-Funktion aus und verlangt `tools.call(id, input)`.

## Verschachtelte Tool-Ausführung

Jeder verschachtelte Tool-Aufruf überschreitet die Host-Bridge und tritt erneut in OpenClaw ein.

Verschachtelte Ausführung erhält:

- aktive Agent-ID
- Sitzungs-ID und Sitzungsschlüssel
- Sender- und Channel-Kontext
- Sandbox-Richtlinie
- Genehmigungsrichtlinie
- Plugin-`before_tool_call`-Hooks
- Abbruchsignal
- Streaming-Updates, wo verfügbar
- Trajectory- und Audit-Ereignisse

Verschachtelte Aufrufe werden als echte Tool-Aufrufe in das Transcript projiziert, sodass
Support-Bundles zeigen können, was passiert ist. Die Projektion identifiziert den übergeordneten
Code-Modus-Tool-Aufruf und die verschachtelte Tool-ID.

Parallele verschachtelte Aufrufe sind bis zu `maxPendingToolCalls` erlaubt.

## Laufzeitstatus

Jeder Code-Modus-Lauf hat eine Zustandsmaschine:

- `running`: VM führt aus oder verschachtelte Aufrufe sind unterwegs.
- `waiting`: VM-Snapshot existiert und kann mit `wait` fortgesetzt werden.
- `completed`: endgültiger Wert zurückgegeben; Snapshot gelöscht.
- `failed`: Fehler zurückgegeben; Snapshot gelöscht.
- `expired`: Snapshot oder ausstehender Zustand hat die Aufbewahrung überschritten; kann nicht fortgesetzt werden.
- `aborted`: übergeordneter Lauf/Sitzung abgebrochen; Snapshot gelöscht.

Der Status ist nach Agent-Lauf, Sitzung und Tool-Aufruf-ID abgegrenzt. Ein `wait`-Aufruf aus einem
anderen Lauf oder einer anderen Sitzung schlägt fehl.

Snapshot-Speicherung ist begrenzt:

- maximale Snapshot-Bytes pro Lauf
- maximale Live-Snapshots pro Prozess
- Snapshot-TTL
- Bereinigung bei Laufende
- Bereinigung beim Herunterfahren des Gateway, wo Persistenz nicht unterstützt wird

## QuickJS-WASI-Laufzeit

OpenClaw lädt `quickjs-wasi` als direkte Abhängigkeit im besitzenden Paket. Die
Laufzeit verlässt sich nicht auf eine transitive Kopie, die für Proxy, PAC oder andere
nicht verwandte Abhängigkeiten installiert wurde.

Laufzeitverantwortlichkeiten:

- das QuickJS-WASI-WebAssembly-Modul kompilieren oder laden
- pro Code-Modus-Lauf oder Fortsetzung eine isolierte VM erstellen
- Host-Callbacks unter stabilen Namen registrieren
- Speicher- und Interrupt-Limits setzen
- JavaScript auswerten
- ausstehende Jobs abarbeiten
- angehaltenen VM-Status als Snapshot speichern
- Snapshots für `wait` wiederherstellen
- VM-Handles und Snapshots nach terminalen Zuständen entsorgen

Die Laufzeit wird außerhalb der Haupt-Event-Loop von OpenClaw in einem Worker ausgeführt. Eine
unendliche Gastschleife darf den Gateway-Prozess nicht unbegrenzt blockieren.

## TypeScript

TypeScript-Unterstützung ist nur eine Quelltransformation:

- akzeptierte Eingabe: ein TypeScript-Code-String
- Ausgabe: JavaScript-String, der von QuickJS-WASI ausgewertet wird
- kein Typechecking
- keine Modulauflösung
- kein `import` oder `require` in v1
- Diagnosemeldungen werden als `failed`-Ergebnisse zurückgegeben

Der TypeScript-Compiler wird nur für TypeScript-Zellen lazy geladen. Reine
JavaScript-Zellen und deaktivierter Code-Modus laden den Compiler nicht.

Die Transformation sollte nützliche Zeilennummern erhalten, wo das praktikabel ist.

## Sicherheitsgrenze

Modellcode ist feindlich. Die Laufzeit nutzt mehrschichtige Verteidigung:

- QuickJS-WASI außerhalb der Haupt-Event-Loop ausführen
- `quickjs-wasi` als direkte Abhängigkeit laden, nicht über Codex oder ein transitives
  Paket
- kein Dateisystem, Netzwerk, Subprozess, Modulimport, keine Umgebungsvariablen oder
  Host-globalen Objekte im Gast
- QuickJS-Speicher- und Interrupt-Limits verwenden
- Wall-Clock-Timeout des übergeordneten Prozesses erzwingen
- Ausgabe-, Snapshot-, Log- und Pending-Call-Grenzen erzwingen
- Host-Bridge-Werte über einen schmalen JSON-Adapter serialisieren
- Host-Fehler in einfache Gastfehler umwandeln, niemals in Host-Realm-Objekte
- Snapshots bei Timeout, Abbruch, Sitzungsende oder Ablauf verwerfen
- rekursiven Zugriff auf `exec`, `wait` und Tool-Search-Steuerungstools abweisen
- verhindern, dass Convenience-Namen-Kollisionen Katalog-Helper verdecken

Die Sandbox ist eine Sicherheitsschicht. Betreiber können für Hochrisiko-Deployments weiterhin
Härtung auf Betriebssystemebene benötigen.

## Fehlercodes

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

An den Gast zurückgegebene Fehler sind einfache Daten. Host-`Error`-Instanzen, Stack-
Objekte, Prototypen und Host-Funktionen gelangen nicht in QuickJS.

## Telemetry

Der Code-Modus meldet:

- sichtbare Tool-Namen, die an das Modell gesendet wurden
- verborgene Kataloggröße und Aufschlüsselung nach Quelle
- `exec`- und `wait`-Zählwerte
- Zählwerte für verschachtelte Suchen, Beschreibungen und Aufrufe
- aufgerufene verschachtelte Tool-IDs
- Fehler durch Timeout-, Speicher-, Snapshot- und Ausgabegrenzen
- Snapshot-Lebenszyklusereignisse

Telemetry darf keine Secrets, rohen Umgebungswerte oder nicht redigierten Tool-
Eingaben über die bestehende OpenClaw-Trajectory-Richtlinie hinaus enthalten.

## Debugging

Verwenden Sie gezieltes Modelltransport-Logging, wenn sich der Code-Modus anders verhält als ein
normaler Tool-Lauf:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Für Payload-Shape-Debugging verwenden Sie `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Dies protokolliert einen begrenzten, redigierten JSON-Snapshot der Modellanfrage; es sollte nur
während des Debuggings verwendet werden, weil Prompts und Nachrichtentext weiterhin erscheinen können.

Für Stream-Debugging verwenden Sie `OPENCLAW_DEBUG_SSE=peek`, um die ersten fünf
redigierten SSE-Ereignisse zu protokollieren. Der Code-Modus schlägt außerdem fail-closed fehl, wenn die finale Provider-Payload
nicht exakt `exec` und `wait` enthält, nachdem die Code-Modus-Oberfläche
aktiviert wurde.

## Implementierungsaufbau

Implementierungseinheiten:

- Konfigurationsvertrag: `tools.codeMode`
- Katalog-Builder: effektive Tools zu kompakten Einträgen und ID-Map
- Modelloberflächenadapter: sichtbare Tools durch `exec` und `wait` ersetzen
- QuickJS-WASI-Laufzeitadapter: laden, auswerten, Snapshot erstellen, wiederherstellen, entsorgen
- Worker-Supervisor: Timeout, Abbruch, Crash-Isolation
- Bridge-Adapter: JSON-sichere Host-Callbacks und Ergebniszustellung
- TypeScript-Transformationsadapter
- Snapshot-Speicher: TTL, Größengrenzen, Lauf-/Sitzungsabgrenzung
- Trajectory-Projektion für verschachtelte Tool-Aufrufe
- Telemetry-Zähler und Diagnosen

Die Implementierung verwendet Katalog- und Executor-Konzepte aus Tool Search wieder, nutzt aber
nicht das `node:vm`-Child als Sandbox.

## Validierungs-Checkliste

Die Code-Modus-Abdeckung sollte beweisen:

- deaktivierte Konfiguration lässt die bestehende Tool-Freigabe unverändert
- Objektkonfiguration ohne `enabled: true` lässt den Code-Modus deaktiviert
- aktivierte Konfiguration gibt dem Modell nur `exec` und `wait` frei, wenn Tools für den Lauf aktiv sind
- rohe Läufe ohne Tools, `disableTools` und leere Allowlists lösen keine Payload-Durchsetzung für den Code-Modus aus
- alle effektiv verfügbaren Nicht-MCP-Tools erscheinen in `ALL_TOOLS`
- abgelehnte Tools erscheinen nicht in `ALL_TOOLS`
- `tools.search`, `tools.describe` und `tools.call` funktionieren für OpenClaw-Tools
- `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` stellen TypeScript-artige MCP-Deklarationen ohne Bridge-/Tool-Aufruf bereit
- der MCP-Namespace `$api()` bleibt als Inline-Fallback für Schemas verfügbar
- MCP-Namespace-Aufrufe funktionieren für sichtbare MCP-Tools mit einer Objekteingabe, während direkte MCP-Katalogeinträge in `tools.*` fehlen
- Steuerungs-Tools für Tool Search sind sowohl vor der Modelloberfläche als auch vor dem versteckten Katalog verborgen
- verschachtelte Aufrufe behalten Genehmigungs- und Hook-Verhalten bei
- Shell-`exec` ist vor dem Modell verborgen, aber bei Erlaubnis über die Katalog-ID aufrufbar
- rekursive Code-Modus-Aufrufe von `exec` und `wait` sind aus Gast-Code nicht aufrufbar
- TypeScript-Eingabe wird transformiert und ausgewertet, ohne TypeScript auf deaktivierten oder nur JavaScript nutzenden Pfaden zu laden
- `import`, `require`, Dateisystem-, Netzwerk- und Umgebungszugriff schlagen fehl
- Endlosschleifen laufen in ein Timeout und können den Gateway nicht blockieren
- Fehler durch Speicherlimits beenden die Gast-VM
- Ausgabe- und Snapshot-Limits werden für abgeschlossene und angehaltene Aufrufe durchgesetzt
- `wait` setzt einen angehaltenen Snapshot fort und gibt den endgültigen Wert zurück
- abgelaufene, abgebrochene, sitzungsfremde und unbekannte `runId`-Werte schlagen fehl
- Transkriptwiedergabe und Persistenz bewahren Code-Modus-Steuerungsaufrufe
- Transkript und Telemetrie zeigen verschachtelte Tool-Aufrufe klar an

## E2E-Testplan

Führen Sie diese als Integrations- oder End-to-End-Tests aus, wenn Sie die Runtime ändern:

1. Starten Sie einen Gateway mit `tools.codeMode.enabled: false`.
2. Senden Sie einen Agent-Turn mit einem kleinen direkten Tool-Set.
3. Stellen Sie sicher, dass die für das Modell sichtbaren Tools unverändert sind.
4. Starten Sie mit `tools.codeMode.enabled: true` neu.
5. Senden Sie einen Agent-Turn mit OpenClaw-, Plugin-, MCP- und Client-Test-Tools.
6. Stellen Sie sicher, dass die für das Modell sichtbare Tool-Liste exakt `exec`, `wait` ist.
7. Lesen Sie in `exec` `ALL_TOOLS` und stellen Sie sicher, dass die effektiven Test-Tools vorhanden sind.
8. Rufen Sie in `exec` OpenClaw-/Plugin-/Client-Tools über `tools.search`, `tools.describe` und `tools.call` auf.
9. Rufen Sie in `exec` `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` auf und stellen Sie sicher, dass die Deklarationsdateien sichtbare MCP-Tools beschreiben.
10. Rufen Sie in `exec` MCP-Tools über `MCP.<server>.<tool>({ ...input })` auf und stellen Sie sicher, dass direkte MCP-Katalogeinträge in `ALL_TOOLS` und `tools.*` fehlen.
11. Stellen Sie sicher, dass abgelehnte Tools fehlen und nicht über eine erratene ID aufgerufen werden können.
12. Starten Sie einen verschachtelten Tool-Aufruf, der aufgelöst wird, nachdem `exec` `waiting` zurückgegeben hat.
13. Rufen Sie `wait` auf und stellen Sie sicher, dass die wiederhergestellte VM das Tool-Ergebnis erhält.
14. Stellen Sie sicher, dass die endgültige Antwort Ausgaben enthält, die nach der Wiederherstellung erzeugt wurden.
15. Stellen Sie sicher, dass Timeout, Abbruch und Snapshot-Ablauf den Runtime-Zustand bereinigen.
16. Exportieren Sie die Trajektorie und stellen Sie sicher, dass verschachtelte Aufrufe unter dem übergeordneten Code-Modus-Aufruf sichtbar sind.

Bei reinen Dokumentationsänderungen an dieser Seite sollte dennoch `pnpm check:docs` ausgeführt werden.

## Verwandt

- [Tool Search](/de/tools/tool-search)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Exec-Tool](/de/tools/exec)
- [Codeausführung](/de/tools/code-execution)
