---
read_when:
    - Sie möchten den OpenClaw-Codemodus für einen Agentenlauf aktivieren
    - Sie müssen erklären, warum sich der Code-Modus vom Codex-Code-Modus unterscheidet.
    - Sie überprüfen den kompakten Tool-Vertrag, die QuickJS-WASI-Sandbox, die TypeScript-Transformation oder die verborgene Tool-Katalog-Bridge
    - Sie fügen eine interne Namespace-Registry-Integration für den Code-Modus hinzu oder überprüfen sie
sidebarTitle: Code Mode
summary: Verwenden Sie den OpenClaw-Code-Modus, um umfangreiche Tool-Kataloge zu entdecken, aufzurufen und in kompakten JavaScript- oder TypeScript-Workflows zu kombinieren
title: Code-Modus
x-i18n:
    generated_at: "2026-07-24T04:08:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a21df3bcfb11668da6dde1f7c69adcc284a28dc491c95f95097ce7f41e5c45bf
    source_path: tools/code-mode.md
    workflow: 16
---

Der Code-Modus ist eine experimentelle, optional aktivierbare Funktion der OpenClaw-Agentenlaufzeit. Wenn
er aktiviert ist, sieht das Modell nicht mehr jedes aktivierte Toolschema; stattdessen sieht es
`exec`, `wait` und jedes ausschließlich direkte Tool, dessen strukturiertes Ergebnis nicht über
die reine JSON-Gast-Bridge übertragen werden kann. Das Modell schreibt ein kleines JavaScript- oder TypeScript-
Programm, das den verborgenen Toolkatalog durchsucht, beschreibt und aufruft.

Diese Seite dokumentiert den OpenClaw-Code-Modus, nicht den Codex Code Mode. Die beiden Funktionen
haben denselben Namen und dieselben Namen für Steuerungstools (`exec`, `wait`), sind jedoch
separate Implementierungen:

- Codex Code Mode wird innerhalb der Codex-Coding-Umgebung ausgeführt. Sein Tool `exec` ist ein
  Tool mit freier Grammatik: Das Modell schreibt JavaScript-Quellcode im Rohformat (optional
  mit einer vorangestellten `// @exec: {...}`-Pragmazeile für Ausführungsoptionen), der
  in der prozessinternen V8-Code-Mode-Laufzeit von Codex ausgeführt wird.
- Der OpenClaw-Code-Modus wird in der generischen OpenClaw-Agentenlaufzeit ausgeführt und ist
  deaktiviert, sofern `tools.codeMode.enabled: true` nicht konfiguriert ist. Sein Tool `exec`
  akzeptiert eine JSON-Nutzlast `{ code, language }`, die in einem QuickJS-WASI-
  Worker ausgeführt wird.

Beide sind JavaScript-Ausführungsoberflächen, keine Oberflächen für Shell-Befehle. Behandeln Sie sie
als unabhängige, unterschiedlich implementierte Funktionen, die zufällig
gleichnamige Tools `exec`/`wait` bereitstellen.

## Funktionsweise

- Die für das Modell sichtbare Toolliste besteht aus `exec`, `wait` sowie allen ausschließlich direkten Tools
  wie `computer` oder dem nativen Vision-Loader `image`, dessen Bildergebnis
  die Gast-Bridge nicht passieren kann.
- `exec` wertet vom Modell generiertes JavaScript oder TypeScript in einem isolierten
  QuickJS-WASI-Worker-Thread aus.
- Jedes aktivierte, katalogfähige Tool (OpenClaw-Core, Plugin, MCP, Client) wird als
  eigenständiges Modelltool verborgen und innerhalb des Gastprogramms über `ALL_TOOLS`
  und `tools` bereitgestellt.
- Die Beschreibung von `exec` enthält einen begrenzten Schnellindex mit exakten OpenClaw-/Plugin-
  Katalog-IDs, kompakten Eingabehinweisen und kompakten Hinweisen zu deklarierten Ausgaben, wenn ein
  vertrauenswürdiges Tool ein Ausgabeschema bereitstellt. Beschreibungen, vollständige Schemas,
  MCP-Einträge und überzählige Einträge werden ausgelassen; die katalogseitige Suche im Gast bleibt der Rückfallmechanismus.
- Der Gastcode durchsucht den verborgenen Katalog, beschreibt das Schema eines Tools und ruft
  ein Tool über denselben Ausführungspfad auf, der bei normalen Agentendurchläufen verwendet wird (Richtlinien,
  Genehmigungen, Hooks und Telemetrie gelten weiterhin).
- MCP-Tools werden unter dem Namespace `MCP` gruppiert; im Code-Modus ist dies die
  einzige unterstützte Möglichkeit, sie aufzurufen.
- `wait` setzt einen angehaltenen Code-Mode-Durchlauf fort, wenn verschachtelte Toolaufrufe noch
  ausstehen.

Der Code-Modus ändert nur die modellseitige Orchestrierungsoberfläche. Er ersetzt weder
Tools noch Plugin-Tools, MCP-Tools, Authentifizierung, Genehmigungsrichtlinien, Kanalverhalten
oder Modellauswahl.

## Gründe für die Verwendung

- Kleinere Prompt-Oberfläche: Provider erhalten zwei Steuerungstools, einen begrenzten Index nativer Tools
  und nur die wenigen erforderlichen direkten Tools statt Dutzender oder Hunderter
  vollständiger Toolschemas.
- Bessere Orchestrierung: Das Modell kann Schleifen, Zusammenführungen, kleine Transformationen,
  bedingte Logik und parallele verschachtelte Toolaufrufe innerhalb einer Codezelle verwenden.
- Weniger Modell-Roundtrips: Ein deklarierter Ausgabevertrag ermöglicht dem Modell, ein Toolergebnis
  in einem einzigen `exec` aufzurufen und zu transformieren; unbekannte Ausgaben bleiben zunächst unverarbeitet.
- Provider-neutral: Funktioniert für OpenClaw-, Plugin-, MCP- und Client-Tools, ohne
  von der nativen Codeausführung eines Providers abhängig zu sein.
- Sicheres Fehlschlagen: Wenn der Code-Modus aktiviert, die QuickJS-WASI-Laufzeit jedoch
  nicht verfügbar ist, schlägt der Durchlauf fehl, statt stillschweigend auf eine breite direkte
  Toolbereitstellung zurückzufallen.

Dies ist besonders nützlich für Agenten mit einem großen aktivierten Toolkatalog oder für Workflows, bei denen
das Modell mehrere Tools suchen, kombinieren und aufrufen muss, bevor es antwortet.

Behalten Sie die direkte Toolbereitstellung für einen kleinen Katalog oder ein Modell bei, das nicht zuverlässig
kurze Programme schreibt. Verwenden Sie die [Toolsuche](/de/tools/tool-search), wenn Sie einen
kompakten Katalog wünschen, aber strukturierte Steuerelemente zum Suchen, Beschreiben und Aufrufen dem
QuickJS-WASI-Gast vorziehen.

## Schnellstart

### Code-Modus aktivieren

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

Der Code-Modus bleibt deaktiviert, wenn `tools.codeMode` ausgelassen wird, `false` ist oder ein Objekt
ohne `enabled: true` angegeben wird.

Wenn Sie Sandbox-Agenten mit konfigurierten MCP-Servern verwenden, erlauben Sie außerdem das
gebündelte MCP-Plugin in der Sandbox-Toolrichtlinie, beispielsweise
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Siehe
[Konfiguration – Tools und benutzerdefinierte Provider](/de/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Legen Sie explizite Grenzwerte für engere Beschränkungen fest:

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

### Vorgehensweise des Modells

Bei einem Tool mit einer deklarierten Ausgabe wie
`Array<{ id: string; paid: boolean; tons: number }>` kann ein einziges Gastprogramm
es auswählen, aufrufen und transformieren:

```javascript
const [shipmentTool] = await tools.search("list shipments");
const shipments = await tools.callValue(shipmentTool.id, {});
return shipments.filter((shipment) => !shipment.paid && shipment.tons > 10);
```

Wenn eine Schnellindexzeile mit `-> ?` endet, ist die Ausgabeform unbekannt. Der erste
`exec` muss `await tools.callValue(...)` unverändert zurückgeben. Ein späterer `exec` kann
den beobachteten Wert transformieren. Dies erfordert einen zusätzlichen Modelldurchlauf, verhindert jedoch, dass das
Modell Feldnamen errät.

### Aktive Oberfläche überprüfen

Um beim Debuggen die Form der Modellnutzlast zu bestätigen, führen Sie den Gateway mit
gezielter Protokollierung aus:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Bei aktivem Code-Modus sollten die protokollierten modellseitigen Toolnamen `exec` und
`wait` sein. Fügen Sie für eine kurze Debugging-Sitzung
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` hinzu, um die vollständige bereinigte Provider-Nutzlast zu erhalten.

## Swarm für die Agentenauffächerung verwenden

[Swarm](/tools/swarm) fügt die Gast-Globals `agents.run()`, `phase()` und `log()`
zur Orchestrierung gleichzeitiger Unteragenten aus Code-Mode-Skripten hinzu. Aktivieren Sie sowohl
`tools.codeMode` als auch `tools.swarm` und verwenden Sie dann den normalen JavaScript-Kontrollfluss für
Auffächerung, Entscheidungsschranken und strukturierte Erfassung. Swarm ist eine separate optionale
Schranke; die alleinige Aktivierung des Code-Modus stellt die API `agents.*` nicht bereit.

## Technischer Überblick

Der übrige Teil dieser Seite behandelt den Laufzeitvertrag und Implementierungsdetails
für Maintainer, Plugin-Autoren, die die Toolbereitstellung debuggen, sowie Betreiber,
die risikoreiche Bereitstellungen validieren.

## Laufzeitstatus

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Laufzeit            | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Standardzustand     | deaktiviert                                                                                 |
| Stabilität          | experimentelle OpenClaw-Oberfläche (Codex Code Mode ist eine separate, stabile Codex-Harness-Oberfläche) |
| Zieloberfläche      | generische OpenClaw-Agentendurchläufe                                                       |
| Sicherheitsmodell   | Modellcode ist feindlich                                                                    |
| Benutzerzusage      | die Aktivierung des Code-Modus fällt niemals stillschweigend auf eine breite direkte Toolbereitstellung zurück |

## Umfang

Der Code-Modus ist für die modellseitige Orchestrierungsform eines vorbereiteten Durchlaufs zuständig. Er
ist nicht für die Modellauswahl, das Kanalverhalten, die Authentifizierung, die Toolrichtlinie oder
Toolimplementierungen zuständig.

Im Umfang enthalten: für das Modell sichtbare Definitionen von Steuerungs-/Direkttools, Aufbau des verborgenen Toolkatalogs,
Ausführung von JavaScript-/TypeScript-Gastcode, QuickJS-WASI-Worker-
Laufzeit, Host-Callbacks für Suche/Beschreibung/Aufruf, fortsetzbarer Zustand für
angehaltene Gastprogramme, Grenzwerte für Ausgabe/Zeitüberschreitung/Speicher/ausstehende Aufrufe/Snapshots
sowie Telemetrie-/Trajektionsprojektion für verschachtelte Toolaufrufe.

Nicht im Umfang enthalten: Provider-native entfernte Codeausführung, Semantik der Shell-Ausführung,
Änderungen bestehender Toolautorisierungen, persistente benutzerverfasste
Skripte, Zugriff auf Paketmanager/Dateien/Netzwerk/Module im Gastcode und die direkte
Wiederverwendung interner Bestandteile des Codex Code Mode.

Provider-eigene Tools wie entfernte Python-Sandboxes sind separate Tools. Siehe
[Codeausführung](/de/tools/code-execution).

## Begriffe

- **Code-Modus**: der OpenClaw-Laufzeitmodus, der katalogkompatible Modell-
  tools verbirgt und `exec`, `wait` sowie erforderliche ausschließlich direkte Tools bereitstellt.
- **Gastlaufzeit**: die QuickJS-WASI-JavaScript-VM, die Modellcode auswertet.
- **Host-Bridge**: die schmale JSON-kompatible Callback-Oberfläche vom Gastcode
  zurück zu OpenClaw.
- **Katalog**: die durchlaufbezogene Liste effektiver Tools nach der normalen Auflösung von
  Toolrichtlinien, Plugins, MCP und Client-Tools.
- **Verschachtelter Toolaufruf**: ein Toolaufruf, der aus dem Gastcode über die Host-
  Bridge erfolgt.
- **Snapshot**: serialisierter Zustand der QuickJS-WASI-VM, der gespeichert wird, damit `wait`
  einen angehaltenen Code-Mode-Durchlauf fortsetzen kann.

## Konfiguration

`tools.codeMode.enabled` ist die Aktivierungsschranke; das Festlegen anderer Felder
aktiviert die Funktion nicht von selbst.

| Feld                  | Standard                       | Begrenzung                                      |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolesch; nur `true` aktiviert den Code-Modus  |
| `runtime`             | `"quickjs-wasi"`               | einziger unterstützter Wert                     |
| `mode`                | `"only"`                       | stellt Steuerungs-/Direkttools bereit und katalogisiert den Rest |
| `languages`           | `["javascript", "typescript"]` | beliebige Teilmenge der beiden                  |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | auf `maxSearchLimit` begrenzt                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Wenn der Code-Modus aktiviert ist, QuickJS-WASI jedoch nicht geladen werden kann, schlägt OpenClaw
für diesen Durchlauf sicher fehl; normale Tools werden nicht stillschweigend als Rückfalllösung bereitgestellt.

## Aktivierung

Der Code-Modus wird ausgewertet, nachdem die effektive Toolrichtlinie bekannt ist und bevor die
endgültige Modellanforderung zusammengestellt wird:

1. Agent, Modell, Provider, Sandbox, Kanal, Absender und Ausführungsrichtlinie
   auflösen.
2. Die effektive OpenClaw-Werkzeugliste erstellen und zulässige Plugin-, MCP- und
   Client-Werkzeuge hinzufügen.
3. Zulassen-/Verweigern-Richtlinie anwenden.
4. Wenn `tools.codeMode.enabled` false ist, mit der normalen Werkzeugbereitstellung fortfahren.
5. Wenn diese Option aktiviert ist und Werkzeuge für die Ausführung aktiv sind, erforderliche
   ausschließlich direkte Werkzeuge beibehalten und jedes katalogfähige effektive Werkzeug
   im Code-Mode-Katalog registrieren.
6. Die katalogisierten Werkzeuge aus der für das Modell sichtbaren Liste entfernen; `exec` und
   `wait` zusammen mit den beibehaltenen ausschließlich direkten Werkzeugen hinzufügen.

Ausführungen, die absichtlich keine Werkzeuge haben (unverarbeitete Modellaufrufe, `disableTools: true`
oder eine leere `tools.allow`-Liste), aktivieren die Code-Mode-Oberfläche auch dann nicht,
wenn `tools.codeMode.enabled: true` konfiguriert ist. Code Mode und die OpenClaw-Werkzeugsuche
schließen sich für eine Ausführung gegenseitig aus; wenn Code Mode aktiviert wird, findet
die Compaction der Werkzeugsuche nicht statt.

Der Code-Mode-Katalog ist auf die Ausführung beschränkt und darf keine Werkzeuge eines anderen
Agenten, einer anderen Sitzung, eines anderen Absenders oder einer anderen Ausführung offenlegen.

## Für das Modell sichtbare Werkzeuge

Wenn Code Mode aktiv ist, sieht das Modell `exec`, `wait` und alle erforderlichen
ausschließlich direkten Werkzeuge. Jedes andere aktivierte Werkzeug wird aus der
für das Modell sichtbaren Werkzeugliste ausgeblendet und im Code-Mode-Katalog registriert.

Verwenden Sie `exec` für die Werkzeugorchestrierung, das Zusammenführen von Daten, Schleifen, parallele
verschachtelte Aufrufe und strukturierte Transformationen. Verwenden Sie `wait` nur, wenn `exec` ein fortsetzbares
`waiting`-Ergebnis zurückgibt.

## `exec`

`exec` startet eine Code-Mode-Zelle und gibt ein Ergebnis zurück. Der Eingabecode wird vom
Modell erzeugt und muss als feindlich behandelt werden.

Eingabe:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Regeln:

- Entweder `code` oder `command` darf nicht leer sein.
- `code` ist das dokumentierte, für das Modell sichtbare Feld.
- `command` wird als exec-kompatibler Alias für Hook-Richtlinien und
  vertrauenswürdige Umschreibungen akzeptiert (das normale OpenClaw-Shell-exec-Werkzeug verwendet ebenfalls
  ein `command`-Feld); wenn beide vorhanden sind, müssen die Werte übereinstimmen.
- `language` verwendet standardmäßig `"javascript"`; das Schema stellt es als flache
  Zeichenfolgen-Enumeration (`"javascript" | "typescript"`) bereit, nicht als `oneOf`-/`anyOf`-Union,
  da einige Provider solche Strukturen ablehnen.
- Wenn `language` den Wert `"typescript"` hat, transpiliert OpenClaw vor der Auswertung.
- `exec` lehnt `import`, `require`, dynamische Importe und Modullader-
  Muster ab.
- `exec` stellt die normale Shell-Implementierung von `exec` niemals rekursiv bereit.
- Äußere Code-Mode-Hook-Ereignisse für `exec` enthalten `toolKind: "code_mode_exec"` und
  `toolInputKind: "javascript" | "typescript"` (sofern bekannt), damit Richtlinien
  Code-Mode-Zellen von Shell-artigen `exec`-Aufrufen unterscheiden können, die denselben
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

`exec` gibt `waiting` zurück, wenn das Gastsystem mit fortsetzbarem Zustand angehalten wird, der weiterhin
eine für das Modell sichtbare Fortsetzung benötigt – ein explizites `yield_control(...)` oder einen
Bridge-Werkzeugaufruf, der nicht innerhalb der exec-Frist abgeschlossen wurde. Das Ergebnis
enthält eine `runId` für `wait`. Bridge-Werkzeugaufrufe – `tools.search`/`describe`/
`call` sowie Namespace-Aufrufe einschließlich MCP-Namespace-Aufrufen – werden innerhalb
desselben `exec`-/`wait`-Aufrufs automatisch abgearbeitet, sofern sie innerhalb der Frist abgeschlossen werden. Dadurch
wird ein kompakter Codeblock, der auf mehrere Werkzeuge wartet, in einem Modell-
Durchlauf vollständig ausgeführt, statt für jedes Warten einen Modell-Werkzeugaufruf zu erzwingen. Neustartsichere Ausführungen werden
niemals automatisch abgearbeitet; ihre ausstehenden Arbeiten durchlaufen weiterhin die wiedergabesicheren Prüfungen.

`exec` gibt `completed` nur zurück, wenn die Gast-VM keine ausstehenden Arbeiten hat und der
endgültige Wert nach Ausführung des OpenClaw-Ausgabeadapters JSON-kompatibel ist.

## `wait`

`wait` setzt eine angehaltene Code-Mode-VM fort.

Eingabe:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Die Ausgabe ist dieselbe `CodeModeResult`-Union, die von `exec` zurückgegeben wird.

`wait` ist erforderlich, weil verschachtelte OpenClaw-Werkzeuge langsam, interaktiv oder
genehmigungspflichtig sein oder Teilaktualisierungen streamen können; das Modell sollte nicht
einen langen `exec`-Aufruf offen halten müssen, während der Host auf externe Arbeiten wartet.

QuickJS-WASI-Snapshot/-Wiederherstellung dient als Fortsetzungsmechanismus:

1. `exec` wertet Code bis zum Abschluss, Fehlschlag oder Anhalten aus.
2. Beim Anhalten erstellt OpenClaw einen Snapshot der QuickJS-VM und zeichnet ausstehende Host-
   Arbeiten auf.
3. Wenn die ausstehenden Arbeiten abgeschlossen sind, stellt `wait` den VM-Snapshot wieder her und
   registriert Host-Callbacks anhand stabiler Namen erneut.
4. OpenClaw übergibt die Ergebnisse verschachtelter Werkzeuge an die wiederhergestellte VM und arbeitet
   ausstehende QuickJS-Aufträge ab.
5. `wait` gibt `completed`, `failed` oder ein weiteres `waiting`-Ergebnis zurück.

Snapshots sind Laufzeitzustand und keine Benutzerartefakte: Sie befinden sich ausschließlich in einer
prozessinternen Zuordnung (keine Datenbank- oder Datenträgerschreibvorgänge), sind größenbegrenzt, laufen ab und sind
auf die Ausführung und Sitzung beschränkt, die sie erstellt haben.

`wait` schlägt (als `failed`-Ergebnis) fehl, wenn:

- `runId` unbekannt oder sein Snapshot bereits abgelaufen ist.
- der Aufrufer sich nicht im selben Ausführungs-/Sitzungsbereich wie die angehaltene Ausführung befindet.
- für diese `runId` bereits ein `wait` ausgeführt wird.
- die QuickJS-WASI-Wiederherstellung fehlschlägt.
- die Fortsetzung `maxOutputBytes` oder `maxSnapshotBytes` überschreiten würde.

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

`ALL_TOOLS` sind kompakte Metadaten für den ausführungsbezogenen Katalog; sie enthalten standardmäßig
keine vollständigen Schemas. Die für das Modell sichtbare Beschreibung von `exec` enthält außerdem eine
begrenzte, deterministische Teilmenge exakter OpenClaw-/Plugin-IDs, kompakte Eingabehinweise
und vertrauenswürdige deklarierte Ausgabehinweise. Beschreibungen werden weiterhin verzögert geladen, damit
feindliche Katalogtexte das Modell nicht beeinflussen können. Wenn dieses Verzeichnis ein Werkzeug auslässt,
lesen Sie `ALL_TOOLS` oder rufen Sie `tools.search(...)` innerhalb des Gastprogramms auf.

Der Pfeil in jeder Zeile des Schnellverzeichnisses beschreibt den `tools.callValue(...)`-Wert.
`-> Array<{ id: string }>` ist ein deklarierter Ausgabehinweis; `-> ?` bedeutet eine unbekannte Ausgabe.
Unbekannte Ausgaben bleiben rohwertorientiert: Geben Sie den Wert unverändert zurück, prüfen Sie ihn und
filtern oder transformieren Sie ihn anschließend in einem späteren `exec`, statt Feldnamen zu erraten. Dies
gilt auch, wenn das Lesen einer deklarierten Ausgabe in einen abschließenden `-> ?`-Aufruf einfließt: Geben Sie den
Rohwert dieses Aufrufs zurück, ohne ihn in die angeforderte Antwortstruktur einzubetten.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
  input: string;
  output?: string;
};
```

`input` ist eine begrenzte TypeScript-artige Signatur für den häufigen Anwendungsfall. Verwenden Sie
`tools.describe(...)`, wenn weiterhin das exakte vollständige Schema benötigt wird. Entfernte MCP-
und Client-Einträge verwenden `input: "unknown"`, damit ihre nicht vertrauenswürdigen Schemas
bis `describe` zurückgestellt bleiben. `output` ist
nur für einen vollständigen kompakten Hinweis vorhanden, der aus einem vertrauenswürdigen OpenClaw-Core-
oder Plugin-`outputSchema` abgeleitet wurde. Angaben zu Ausgabeschemas von MCP und Clients werden
nicht in diesen vertrauenswürdigen Kataloghinweis übernommen.

Plugin-Werkzeuge verwenden `source: "openclaw"`, wobei `sourceName` auf die ID des besitzenden
Plugins gesetzt ist; es gibt keinen separaten `"plugin"`-Quellwert. `source: "mcp"` wird
nur für MCP-Einträge in den Metadaten `sourceName`/`mcp` verwendet (und aus
`ALL_TOOLS`/`tools.*` herausgefiltert, siehe unten).

Das vollständige Schema wird nur bei Bedarf geladen:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
  outputSchema?: unknown;
};
```

Katalog-Hilfsfunktionen:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  callValue(id: string, input?: unknown): Promise<unknown>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Komfortable Werkzeugfunktionen werden nur für eindeutige sichere Namen installiert:

```typescript
const files = await tools.search("lokale Datei lesen");
const fileRead = await tools.describe(files[0].id);
const content = await tools.callValue(fileRead.id, { path: "README.md" });

// Wenn der ausgeblendete Katalog einen eindeutigen `web_search`-Eintrag enthält:
const hits = await tools.web_search({ query: "OpenClaw Code Mode" });
```

`tools.callValue(...)` gibt den JSON-`details`-Wert eines normalen Werkzeugs direkt zurück.
`tools.call(...)` bewahrt den unverarbeiteten `{ tool, result }`-Umschlag für Aufrufer,
die Inhaltsblöcke oder andere Ergebnis-Metadaten benötigen.

## Deklarierte Ausgabeverträge

OpenClaw-Werkzeuge können `outputSchema` für den strukturierten Wert deklarieren, der in
`AgentToolResult.details` abgelegt wird. Dies ist für Code Mode und die Werkzeugsuche nützlich; es handelt sich
nicht um ein Provider-natives Schema für Werkzeugantworten, und die direkte
Werkzeugbereitstellung ändert sich dadurch nicht.

Deklarieren Sie für ein mit `defineToolPlugin` erstelltes Werkzeug das Schema neben
`parameters`:

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const Shipment = Type.Object(
  {
    id: Type.String(),
    paid: Type.Boolean(),
    tons: Type.Number(),
  },
  { additionalProperties: false },
);

export default defineToolPlugin({
  id: "shipping",
  name: "Versand",
  description: "Werkzeuge für Sendungen.",
  tools: (tool) => [
    tool({
      name: "shipping_list",
      description: "Sendungen auflisten.",
      parameters: Type.Object({}),
      outputSchema: Type.Array(Shipment),
      execute: async () => loadShipments(),
    }),
  ],
});
```

Fügen Sie für `api.registerTool(...)` oder ein Factory-Werkzeug dieselbe `outputSchema`-
Eigenschaft zum zurückgegebenen `AnyAgentTool`-Objekt hinzu.

Zu den aktuellen integrierten Verträgen gehören `agents_list`, `apply_patch`,
`conversations_list`, `conversations_send`, `conversations_turn`, `edit`,
`openclaw`, `read`, `screen`,
`sessions_history`, `sessions_list`, `sessions_search`, `sessions_send`,
`session_status`, `spawn_task`, `terminal`, `web_fetch` und `web_search`.
Exakte Durchleitungen können das Schema ihres zugrunde liegenden Protokolls
wiederverwenden, anstatt einen ausschließlich modellspezifischen Vertrag zu
duplizieren. Beispielsweise stellen die Konversations-Tools dieselben
Gateway-Ergebnisschemas bereit, die von `conversations.list`,
`conversations.send` und `conversations.turn` verwendet werden; `web_fetch`
besitzt ein Tool-lokales Schema, dessen Hinweis stabile Metadaten, Text,
Cache-Status und verschachtelte Auslagerungsmetadaten bereitstellt;
`web_search` deklariert seine exakte Union aus normalisierten
Ergebnissen, Antworten, Fehlern und Rohdaten als vollständigen
Schnellindex-Hinweis. Dateisystemverträge geben strukturierte Ergebnisse für
gelesenen Text, Bilder, Kürzungen und optional nicht gefundene Elemente
zurück; außerdem einen expliziten Bearbeitungsänderungsstatus samt
Diff-/Patch-Daten sowie Pfadzusammenfassungen für angewendete Patches. Wenn
der Schnellindex die Felder deklariert, kann eine Zelle Ermittlung und
Zustellung ohne separaten Inspektionsdurchlauf kombinieren:

```javascript
const listed = await tools.conversations_list({ query: "build bot" });
const target = listed.conversations.find((item) => item.label === "Build bot");
if (!target) throw new Error("conversation not found");
return await tools.conversations_send({
  conversationRef: target.conversationRef,
  message: "Build finished.",
});
```

Die verschachtelten Aufrufe verwenden weiterhin die normalen Tool-Richtlinien,
Hooks und Genehmigungen. Wenn ein vollständiger Vertrag exakt, aber für den
begrenzten Schnellindex zu groß ist, bleibt er über `tools.describe(...)`
verfügbar und der Pfeil bleibt `-> ?`.

Die Vertragsregeln sind strikt:

- Beschreiben Sie den exakten JSON-kompatiblen Wert `details`, nicht gerenderte
  `content`-Blöcke oder eine Provider-Hülle.
- Nehmen Sie jede Erfolgs- oder Fehlervariante auf, die keine Ausnahme auslöst. Lassen Sie
  `outputSchema` weg, wenn das Tool kein stabiles strukturiertes Ergebnis besitzt.
- Schließen Sie Objektebenen mit `{ additionalProperties: false }`, um einen vollständigen
  Schnellindex-Hinweis zu erhalten. Offene, übergroße oder anderweitig
  unvollständige Schemas bleiben über `tools.describe(...)` verfügbar,
  ermöglichen jedoch keine Feldnutzung in einem Durchlauf.
- OpenClaw kompiliert das Schema vor der Ausführung des Tools und validiert anschließend das
  endgültige `details` nach den normalen Tool-Hooks und bevor ein
  Katalogaufruf zurückkehrt. Ein ungültiges Schema kann das Tool nicht
  ausführen; eine Abweichung schlägt fehl, ohne den Wert auszugeben.
- Kompakte Hinweise sind deterministisch und begrenzt. `tools.describe(...)` stellt
  das vollständige vertrauenswürdige Schema bereit, wenn der kompakte Hinweis
  nicht ausreicht.
- Installierter Plugin-Code ist bereits vertrauenswürdiger lokaler Code. Metadaten von
  Remote-MCPs und Clients bleiben nicht vertrauenswürdig und können diese
  Schnellindex-Hinweise nicht aktivieren.

Details zur Plugin-Erstellung finden Sie unter [Tool-Plugins](/de/plugins/tool-plugins#output-contracts).

MCP-Katalogeinträge können im Codemodus nicht über `tools.callValue(...)`,
`tools.call(...)` oder Komfortfunktionen aufgerufen werden; sie werden
ausschließlich über den generierten Namespace `MCP`
bereitgestellt. Deklarationsdateien im TypeScript-Stil sind über die
schreibgeschützte virtuelle Dateioberfläche `API` verfügbar,
sodass Agenten MCP-Signaturen prüfen können, ohne dem Prompt MCP-Schemas
hinzuzufügen:

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

`API.read("mcp/<server>.d.ts")` gibt kompakte Deklarationen zurück, die aus den
MCP-Tool-Metadaten abgeleitet werden:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Gibt diesen API-Header im TypeScript-Stil zurück. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Erstellt ein GitHub-Issue.
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

Deklarationsdateien sind virtuell und werden nicht im Arbeitsbereich oder
Statusverzeichnis gespeichert. Für jeden Codemodus-Aufruf
`exec` erstellt OpenClaw den laufbezogenen Tool-Katalog, behält
die sichtbaren MCP-Einträge bei, rendert `mcp/index.d.ts` sowie jeweils
eine Datei `mcp/<server>.d.ts` pro sichtbarem Server und fügt diese kleine
schreibgeschützte Tabelle in den QuickJS-Worker ein. Gastcode sieht nur das
Objekt `API`: `API.list(prefix?)` gibt Dateimetadaten zurück und
`API.read(path)` den Inhalt der ausgewählten Deklaration. Unbekannte Pfade
und Segmente vom Typ `.`/`..` werden abgelehnt.

Dadurch bleiben große MCP-Schemas außerhalb des Modell-Prompts: Der Agent
erfährt aus der Beschreibung des Tools `exec`, dass die virtuelle
API existiert, liest nur die benötigte Deklarationsdatei und ruft anschließend
`MCP.<server>.<tool>()` mit einem Objektargument auf. `MCP.<server>.$api()` bleibt als
Inline-Ausweichlösung für die Schemaantwort eines einzelnen Tools innerhalb
des Programms verfügbar.

Die Gastlaufzeit sieht niemals direkt Hostobjekte. Ein- und Ausgaben
überqueren die Brücke als JSON-kompatible Werte mit expliziten
Größenbegrenzungen.

## Interne Namespaces

Interne Namespaces stellen dem Codemodus eine kompakte Domänen-API bereit,
ohne weitere für das Modell sichtbare Tools hinzuzufügen. Eine vom Loader
verwaltete Integration registriert einen Namespace wie `Issues`
oder `Calendar`; der Gastcode ruft diesen Namespace dann innerhalb
des QuickJS-Programms auf, während das Modell weiterhin nur die kompakte
Steuerungs-/Direktoberfläche sieht.

Namespaces sind vorerst intern. Es gibt keine öffentliche Namespace-API des
Plugin-SDK: Externe Plugin-Namespaces benötigen einen vom Loader verwalteten
Vertrag, damit Plugin-Identität, installierte Manifeste, Authentifizierungsstatus
und zwischengespeicherte Katalogdeskriptoren nicht von den Plugin-Tools
abweichen können, auf denen der Namespace basiert. Der Kern-Codemodus besitzt
nur Sandbox, Serialisierung, Katalogzugriffskontrolle und Brückenweiterleitung.

Gastcode kann entweder die direkte globale Variable oder die Zuordnung
`namespaces` verwenden:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Lebenszyklus der Registry

Die Namespace-Registry ist prozesslokal und nach Namespace-ID indiziert:

1. Ein vertrauenswürdiger Loader ruft `registerCodeModeNamespaceForPlugin(pluginId, registration)` auf.
2. Der Codemodus erstellt für den Lauf das verborgene `ToolSearchRuntime` und liest dessen
   laufbezogenen Katalog.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` behält nur Registrierungen bei,
   deren `requiredToolNames` alle sichtbar sind und demselben `pluginId` gehören.
4. Jeder sichtbare Namespace ruft für den aktuellen Lauf `createScope(ctx)` auf
   und erhält Laufkontext wie `agentId`, `sessionKey`, `sessionId`,
   `runId`, Konfiguration und Abbruchstatus.
5. Bereichsdaten werden in einen einfachen Deskriptor serialisiert und als direkte
   globale Variablen sowie als `namespaces.<globalName>` in QuickJS eingefügt.
6. Gastaufrufe werden über die Worker-Brücke ausgesetzt, lösen den Namespace-Pfad
   auf dem Host auf, ordnen den Aufruf einem deklarierten, Plugin-eigenen
   Katalog-Tool zu und führen dieses Tool über `ToolSearchRuntime.callExactId` aus.
7. Bereite Namespace-Brückenaufrufe werden innerhalb des aktiven
   Aufrufs `exec`/`wait` automatisch abgearbeitet; wenn beim Timeout
   noch Namespace-Arbeit aussteht oder der Gast explizit abgibt, setzt
   `wait` dieselbe Namespace-Laufzeit später fort.
8. Beim Zurücksetzen oder Deinstallieren eines Plugins wird
   `clearCodeModeNamespacesForPlugin(pluginId)` aufgerufen, damit veraltete globale Variablen einen
   fehlgeschlagenen Plugin-Ladevorgang nicht überdauern.

Namespace-Aufrufe sind Katalog-Tool-Aufrufe: Sie verwenden dieselben
Richtlinien-Hooks, Genehmigungen, dieselbe Abbruchbehandlung, Telemetrie,
Transkriptprojektion und dasselbe Aussetzungs-/Fortsetzungsverhalten wie
`tools.call(...)`.

### Registrierungsstruktur

Registrieren Sie Namespaces aus der Integration heraus, der die zugrunde
liegenden Tools gehören. Halten Sie den Bereich klein und stellen Sie nur
Domänenaktionen bereit, die deklarierten Katalog-Tools zugeordnet sind.

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

`createCodeModeNamespaceTool(toolName, inputMapper)` kennzeichnet ein Bereichselement als aufrufbare
Namespace-Funktion. Das optionale `inputMapper` empfängt die
Gastargumente und gibt das Eingabeobjekt für das zugrunde liegende
Katalog-Tool zurück; ohne diese Funktion wird das erste Gastargument oder,
falls es fehlt, `{}` verwendet.

Unverarbeitete Hostfunktionen werden abgelehnt, bevor Gastcode ausgeführt wird:

```typescript
createScope: () => ({
  // Falsch: Dies umgeht den Lebenszyklus des Katalog-Tools und wird abgelehnt.
  list: async () => githubClient.listIssues(),
});
```

### Eigentümerschaft und Sichtbarkeit

Die Eigentümerschaft eines Namespace ist an `pluginId` des
Registrierungsaufrufers gebunden. `requiredToolNames` dient sowohl als
Sichtbarkeitsschranke als auch als Eigentümerschaftsprüfung:

- Jedes erforderliche Tool muss im Laufkatalog vorhanden sein.
- Jedes erforderliche Tool muss über `sourceName === pluginId` verfügen.
- Der Namespace wird ausgeblendet, wenn ein erforderliches Tool fehlt oder einem
  anderen Plugin gehört.
- Jeder aufrufbare Pfad darf nur auf ein Tool abzielen, das in `requiredToolNames`
  genannt ist.

Dies verhindert, dass ein anderes Plugin einen Namespace bereitstellt, indem
es ein gleichnamiges Tool registriert, und sorgt dafür, dass Namespaces mit
den gewöhnlichen Agentenrichtlinien übereinstimmen: Wenn der Lauf die
zugrunde liegenden Tools nicht sehen kann, kann er auch den Namespace nicht
sehen.

Ein GitHub-Namespace sollte beispielsweise hinter einem GitHub-eigenen Plugin
liegen, das GitHub-Authentifizierung, REST-/GraphQL-Clients,
Ratenbegrenzungen, Schreibgenehmigungen und Tests besitzt. Der Kern-Codemodus
sollte keine GitHub-spezifischen APIs, Token-Verarbeitung oder
Provider-Richtlinien enthalten.

### Regeln für die Bereichsserialisierung

`createScope(ctx)` kann ein einfaches Objekt zurückgeben, das
JSON-kompatible Werte, Arrays, verschachtelte Objekte und
`createCodeModeNamespaceTool(...)`-Aufrufmarkierungen enthält. Hostobjekte gelangen niemals
direkt in QuickJS.

Der Serialisierer lehnt Folgendes ab:

- Unverarbeitete Funktionen
- Zyklische Objektgraphen
- Unsichere Pfadsegmente: `__proto__`, `constructor`, `prototype`, leere Schlüssel
  oder Schlüssel, die das interne Pfadtrennzeichen enthalten
- `globalName`-Werte, die keine JavaScript-Bezeichner sind
- `globalName`-Kollisionen mit integrierten globalen Variablen des Codemodus wie
  `tools`, `namespaces`, `text`, `json`,
  `yield_control`, `MCP`, `API`, `ALL_TOOLS` oder
  `__openclaw*`

Werte, die nicht als JSON serialisiert werden können, werden vor dem
Überqueren der Brücke in JSON-sichere Ausweichwerte umgewandelt. Binärdaten,
Handles, Sockets, Clients und Klasseninstanzen sollten hinter gewöhnlichen
Katalog-Tools verbleiben.

### Prompts

Der Namespace `description` und das optionale `prompt` werden
nur dann an das für das Modell sichtbare Schema `exec` angehängt,
wenn der Namespace für diesen Lauf sichtbar ist. Verwenden Sie sie, um die
kleinstmögliche nützliche Oberfläche zu vermitteln:

```typescript
{
  description: "Hilfsfunktionen für einen Dienst zur Erstellung fiktionaler Inhalte.",
  prompt:
    "Verwenden Sie Fictions.riskAudit(), Fictions.promoteIfReady(id, status) und Fictions.unpaidOver(amount).",
}
```

Beschränken Sie Prompts auf den Namespace-Vertrag, nicht auf die Authentifizierungseinrichtung, die Implementierungshistorie oder nicht zusammenhängendes Plugin-Verhalten.

### Bereinigung

Namespaces sind prozesslokale Registrierungen. Entfernen Sie sie, wenn das zugehörige Plugin deaktiviert, deinstalliert oder zurückgesetzt wird:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Die Bereinigung im Code-Modus liegt in der Verantwortung des Plugins; löschen Sie die Namespace-Registrierungen des Plugins, wenn dessen Lebenszyklus endet, statt separate Bereinigungs-Handles für jeden Namespace vorzuhalten. Tests können `clearCodeModeNamespacesForTest()` aufrufen, um zu verhindern, dass Registrierungen zwischen Testfällen bestehen bleiben.

### Testprüfliste

Namespace-Änderungen sollten die Sicherheitsgrenze und das Verhalten des Gastcodes abdecken:

- Namespace-Prompttext wird nur angezeigt, wenn die zugrunde liegenden Tools sichtbar sind
- gleichnamige Tools aus einem anderen `sourceName` legen den Namespace nicht offen
- unverarbeitete Bereichsfunktionen werden abgelehnt
- gefälschte Namespace-IDs und gefälschte Pfade werden abgelehnt
- aufrufbare Pfade können nicht auf nicht deklarierte Tools verweisen
- verschachtelte Objekte und gemeinsam verwendete Referenzen werden korrekt serialisiert
- Namespace-Aufrufe werden über Katalog-Tools ausgeführt und geben JSON-kompatible Details zurück
- Fehler können vom Gastcode abgefangen werden
- angehaltene Namespace-Aufrufe werden über `wait` fortgesetzt
- ein Plugin-Rollback löscht die zugehörigen Namespace-Registrierungen

Namespaces ergänzen den generischen `tools.search`-Katalog/`tools.call`-Katalog: Verwenden Sie den Katalog für beliebige aktivierte OpenClaw-, Plugin- und Client-Tools; verwenden Sie `MCP` für MCP-Tools; verwenden Sie andere Namespaces für dokumentierte, Plugin-eigene Domänen-APIs, bei denen kompakter Code zuverlässiger ist als wiederholte Schemaabfragen.

## Ausgabe-API

- `text(value)` fügt dem Array `output` eine menschenlesbare Ausgabe hinzu.
- `json(value)` fügt nach JSON-kompatibler Serialisierung ein strukturiertes Ausgabeelement hinzu.
- Der endgültige Rückgabewert des Gastcodes wird in einem `completed`-Ergebnis zu `value`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Regeln: Die Ausgabereihenfolge entspricht den Aufrufen des Gastcodes; die Ausgabe ist durch `maxOutputBytes` begrenzt; nicht serialisierbare Werte werden in einfache Zeichenfolgen oder Fehler umgewandelt; Binärwerte werden nicht unterstützt. Bilder und Dateien werden über gewöhnliche OpenClaw-Tools übertragen, nicht über die Code-Modus-Bridge.

## Tool-Katalog

Der ausgeblendete Katalog enthält Tools nach der effektiven Richtlinienfilterung in dieser Reihenfolge: OpenClaw-Kern-Tools, gebündelte Plugin-Tools, externe Plugin-Tools, MCP-Tools und anschließend vom Client bereitgestellte Tools für den aktuellen Lauf.

Katalog-IDs sind innerhalb eines Laufs stabil und nach Möglichkeit über gleichwertige Tool-Sätze hinweg deterministisch. Tatsächliche Form:

```text
<source>:<owner>:<tool-name>
```

Dabei ist `<source>` entweder `openclaw`, `mcp` oder `client` (Plugin-Tools verwenden `openclaw` mit der Plugin-ID als `<owner>`; Kern-Tools verwenden `openclaw:core:*`). Beispiele:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Der Katalog lässt Code-Modus-Steuerungs-Tools (`exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`, `tool_call`) und ausschließlich direkt aufrufbare Tools aus. Steuerungen dürfen nicht rekursiv über den Katalog aufgerufen werden; ausschließlich direkt aufrufbare Tools bleiben für das Modell sichtbar, da ihre strukturierten Ergebnisse die QuickJS-Bridge nicht passieren können.

MCP-Einträge verbleiben im laufbezogenen Katalog, sodass Richtlinien, Genehmigungen, Hooks, Telemetrie, Transkriptprojektion und exakte Tool-IDs mit der normalen Tool-Ausführung gemeinsam genutzt werden. Die für den Gastcode bestimmten Ansichten `ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)`, `tools.callValue(...)` und `tools.call(...)` lassen MCP-Einträge aus. Der generierte Namespace `MCP.<server>.<tool>({ ...input })` wird wieder zur exakten Katalog-ID aufgelöst und über denselben Ausführungspfad weitergeleitet.

## Interaktion mit der Tool-Suche

Der Code-Modus ersetzt die OpenClaw-Modelloberfläche für die Tool-Suche bei Läufen, in denen er aktiv ist.

Wenn `tools.codeMode.enabled` wahr ist und der Code-Modus aktiviert wird:

- OpenClaw stellt `tool_search_code`, `tool_search`, `tool_describe` oder `tool_call` nicht als für das Modell sichtbare Tools bereit.
- Dasselbe Katalogisierungskonzept wird in die Gastlaufzeit verlagert.
- Die Gastlaufzeit erhält kompakte `ALL_TOOLS`-Metadaten sowie Hilfsfunktionen zum Suchen, Beschreiben und Aufrufen von Nicht-MCP-Tools.
- MCP-Aufrufe verwenden den generierten Namespace `MCP` und dessen `$api()`-Header anstelle von `tools.call(...)`.
- Verschachtelte Aufrufe werden über denselben OpenClaw-Ausführungspfad weitergeleitet, den die Tool-Suche verwendet.

Siehe [Tool-Suche](/de/tools/tool-search) für die kompakte Katalog-Bridge von OpenClaw, die der Code-Modus bei aktiven Läufen ersetzt.

## Tool-Namen und Kollisionen

Das für das Modell sichtbare Tool `exec` ist das Code-Modus-Tool. Wenn das normale OpenClaw-Shell-Tool `exec` aktiviert ist, wird es vor dem Modell ausgeblendet und wie jedes andere Tool katalogisiert.

Innerhalb der Gastlaufzeit:

- `tools.call("openclaw:core:exec", input)` kann das Shell-Ausführungs-Tool aufrufen, wenn die Richtlinie dies zulässt.
- `tools.exec(...)` wird nur installiert, wenn der Katalogeintrag für die Shell-Ausführung einen eindeutigen sicheren Namen besitzt.
- Das Code-Modus-Tool `exec` ist niemals rekursiv über `tools` verfügbar.

Wenn zwei Tools auf denselben sicheren Komfortnamen normalisiert werden, lässt OpenClaw die Komfortfunktion aus und verlangt `tools.call(id, input)`.

## Verschachtelte Tool-Ausführung

Jeder verschachtelte Tool-Aufruf überquert die Host-Bridge und tritt erneut in OpenClaw ein, wobei Folgendes erhalten bleibt: aktive Agenten-ID, Sitzungs-ID und -Schlüssel, Absender- und Kanalkontext, Sandbox-Richtlinie, Genehmigungsrichtlinie, Plugin-Hooks `before_tool_call`, Abbruchsignal, Streaming-Aktualisierungen, sofern verfügbar, sowie Verlaufs-/Audit-Ereignisse.

Verschachtelte Aufrufe werden im Transkript als echte Tool-Aufrufe dargestellt, sodass Support-Pakete zeigen, was geschehen ist. Die Darstellung identifiziert dabei den übergeordneten Code-Modus-Tool-Aufruf und die verschachtelte Tool-ID.

Bis zu `maxPendingToolCalls` parallele verschachtelte Aufrufe sind zulässig.

## Lauf- und Snapshot-Lebenszyklus

Jeder Code-Modus-Lauf wird in einer prozessinternen Map verfolgt, deren Schlüssel `runId` ist (keine Persistierung auf dem Datenträger oder in einer Datenbank). `exec`/`wait` geben einen von drei Ergebnisstatus zurück: `completed`, `waiting` oder `failed`.

- Ein `waiting`-Ergebnis speichert den QuickJS-Snapshot, ausstehende Bridge-Anfragen und Bereichsmetadaten (Agentenlauf-ID, Sitzungs-ID/-Schlüssel), bis `wait` ihn fortsetzt oder er abläuft.
- Abgelaufene, sitzungsfremde, lauffremde und unbekannte/bereits fortgesetzte `runId`-Werte erzeugen keinen eigenen Endstatus; sie werden als `failed`-Ergebnis (`code: "invalid_input"`) mit einer Meldung wie `code mode
run is unavailable or expired.` oder `code mode run belongs to a different
session.` ausgegeben.
- Der Snapshot eines Laufs wird aus der Map entfernt, sobald er mit `completed` oder `failed` abgeschlossen ist, oder beim Herunterfahren des Gateways verworfen (nichts übersteht einen Neustart: Dies ist flüchtiger Laufzeitstatus).
- Für schreibgeschützte Arbeit kann `exec` den Wert `restartSafe: true` festlegen. OpenClaw lehnt dann Katalogaufrufe mit Seiteneffekten und Plugin-Namespaces vor der Ausführung ab und kennzeichnet angehaltene Ergebnisse als sicher wiederholbar. Wenn ein Neustart `wait` unterbricht, rekonstruiert die [Neustartwiederherstellung](/de/gateway/restart-recovery) den Turn aus dem Transkript, statt den prozesslokalen Snapshot wiederherzustellen. Der Wiederherstellungs-Turn selbst bleibt auf geprüfte schreibgeschützte Kern-Tools und ausdrücklich wiederholungssichere Plugin-Tools beschränkt.
- OpenClaw begrenzt die Anzahl gleichzeitig angehaltener Läufe pro Prozess auf 64 und lehnt neue Anhaltevorgänge oberhalb dieser Grenze mit `too many suspended code mode
runs.` ab.

Der Snapshot-Speicher ist durch `maxSnapshotBytes` pro Lauf, die oben genannte prozessbezogene Grenze für angehaltene Läufe und `snapshotTtlSeconds` begrenzt.

## QuickJS-WASI-Laufzeit

OpenClaw lädt `quickjs-wasi` als direkte Abhängigkeit im zuständigen Paket; es verlässt sich nicht auf eine transitive Kopie, die für eine nicht zusammenhängende Abhängigkeit installiert wurde.

Aufgaben der Laufzeit: das QuickJS-WASI-WebAssembly-Modul kompilieren/laden; für jeden Code-Modus-Lauf oder jede Fortsetzung eine isolierte VM erstellen; Host-Callbacks unter stabilen Namen registrieren; Speicher- und Unterbrechungsgrenzen festlegen; JavaScript auswerten; ausstehende Jobs abarbeiten; angehaltenen VM-Zustand als Snapshot speichern; Snapshots für `wait` wiederherstellen; VM-Handles und Snapshots nach Endstatus freigeben.

Die Laufzeit wird in einem Node.js-Worker-Thread außerhalb der Haupt-Ereignisschleife von OpenClaw ausgeführt. Eine Endlosschleife im Gastcode darf den Gateway-Prozess nicht unbegrenzt blockieren; der Unterbrechungs-Handler des Workers erzwingt das Zeitlimit für die verstrichene Zeit unabhängig von der Mitwirkung des Gastcodes.

## TypeScript

Die TypeScript-Unterstützung ist lediglich eine Quellcodetransformation: Als Eingabe wird eine einzelne TypeScript-Codezeichenfolge akzeptiert; die Ausgabe ist eine JavaScript-Zeichenfolge, die von QuickJS-WASI ausgewertet wird. Es gibt keine Typprüfung, keine Modulauflösung und kein `import`/`require`. Diagnosen werden als `failed`-Ergebnisse zurückgegeben.

Der TypeScript-Compiler wird nur für TypeScript-Zellen verzögert geladen; reine JavaScript-Zellen und ein deaktivierter Code-Modus laden ihn nie.

## Sicherheitsgrenze

Modellcode ist nicht vertrauenswürdig. Die Laufzeit verwendet mehrschichtige Sicherheitsmaßnahmen:

- führt QuickJS-WASI außerhalb der Haupt-Ereignisschleife in einem Worker-Thread aus
- lädt `quickjs-wasi` als direkte Abhängigkeit, nicht über Codex oder ein transitives Paket
- kein Dateisystem, Netzwerk, Unterprozess, Modulimport, keine Umgebungsvariablen oder globalen Host-Objekte im Gastcode
- verwendet QuickJS-Speicher- und Unterbrechungsgrenzen sowie ein Zeitlimit für die verstrichene Zeit im übergeordneten Prozess
- erzwingt Grenzen für Ausgabe, Snapshots, Protokolle und ausstehende Aufrufe
- serialisiert Werte der Host-Bridge über einen eng begrenzten JSON-Adapter
- wandelt Host-Fehler in einfache Gastfehler um, niemals in Objekte des Host-Kontexts
- verwirft Snapshots bei Zeitüberschreitung, Abbruch, Sitzungsende oder Ablauf
- lehnt rekursiven Zugriff auf `exec`, `wait` und Steuerungs-Tools der Tool-Suche ab
- verhindert, dass Kollisionen von Komfortnamen Katalog-Hilfsfunktionen verdecken

Die Sandbox ist eine Sicherheitsebene; Betreiber benötigen für Hochrisikobereitstellungen möglicherweise dennoch eine Härtung auf Betriebssystemebene.

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

`invalid_input` deckt ungültige `exec`-/`wait`-Argumente, deaktivierte Sprachen, abgelehnten Modulzugriff, Fehler bei der TypeScript-Transformation, unbekannte/abgelaufene/bereichsfremde `runId`-Werte und zu viele angehaltene Läufe ab. `runtime_unavailable` deckt einen QuickJS-Worker ab, der nicht gestartet werden kann oder mit einem von null verschiedenen Status beendet wird.

An den Gastcode zurückgegebene Fehler sind einfache Daten; Host-Instanzen von `Error`, Stack-Objekte, Prototypen und Host-Funktionen werden nicht an QuickJS übergeben.

## Telemetrie

Das Feld `telemetry` jedes Ergebnisses meldet: die Größe des ausgeblendeten Katalogs und eine Aufschlüsselung nach Quelle (`openclaw`-/`mcp`-/`client`-Anzahlen), kumulierte Anzahlen der Such-, Beschreibungs- und Aufrufvorgänge für den Katalog des Laufs sowie die für das Modell sichtbaren Tool-Namen (`exec`, `wait` und beibehaltene ausschließlich direkt aufrufbare Tools).

Die Telemetrie darf keine Geheimnisse, unverarbeiteten Umgebungswerte oder ungeschwärzten Tool-Eingaben enthalten, die über die bestehende OpenClaw-Verlaufsrichtlinie hinausgehen.

## Fehlerbehebung

Verwenden Sie gezielte Protokollierung des Modelltransports, wenn sich der Code-Modus anders als ein normaler Tool-Lauf verhält:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Für das Debugging der Payload-Struktur verwenden Sie `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Dadurch wird ein größenbegrenzter, bereinigter JSON-Snapshot der Modellanfrage protokolliert; verwenden Sie ihn nur
während des Debuggings, da Prompts und Nachrichtentext weiterhin erscheinen können.

Für das Stream-Debugging verwenden Sie `OPENCLAW_DEBUG_SSE=peek`, um die ersten fünf
bereinigten SSE-Ereignisse zu protokollieren. Der Codemodus schlägt außerdem sicher fehl, wenn die endgültige Provider-
Payload nicht genau ein `exec`, ein `wait` und ausschließlich genehmigte
nur direkt aufrufbare Tools enthält, nachdem die Codemodus-Oberfläche aktiviert wurde.

## Implementierungsstruktur

- Konfigurationsvertrag: `tools.codeMode`
- Katalog-Builder: effektive Tools in kompakte Einträge und ID-Zuordnung umwandeln
- Adapter für die Modelloberfläche: sichtbare Tools durch Steuerungs-/Direkt-Tools ersetzen
- QuickJS-WASI-Laufzeitadapter: laden, auswerten, Snapshot erstellen, wiederherstellen, freigeben
- Worker-Supervisor: Zeitüberschreitung, Abbruch, Absturzisolation
- Bridge-Adapter: JSON-sichere Host-Callbacks und Ergebnisübermittlung
- TypeScript-Transformationsadapter
- Snapshot-Speicher: TTL, Größenbegrenzungen, Lauf-/Sitzungsgültigkeitsbereich
- Trajektionsprojektion für verschachtelte Tool-Aufrufe
- Telemetriezähler und Diagnoseinformationen

Die Implementierung verwendet Katalog- und Executor-Konzepte aus Tool Search wieder,
nutzt jedoch kein `node:vm`-Child als Sandbox.

## Validierungscheckliste

Die Abdeckung des Codemodus sollte Folgendes nachweisen:

- Eine deaktivierte Konfiguration lässt die bestehende Tool-Bereitstellung unverändert
- Eine Objektkonfiguration ohne `enabled: true` lässt den Codemodus deaktiviert
- Eine aktivierte Konfiguration stellt dem Modell `exec`, `wait` und ausschließlich erforderliche
  nur direkt aufrufbare Tools bereit, wenn Tools für den Lauf aktiv sind
- Unverarbeitete Läufe ohne Tools, `disableTools` und leere Zulassungslisten lösen
  keine Durchsetzung der Codemodus-Payload aus
- Alle katalogfähigen effektiven Nicht-MCP-Tools erscheinen in `ALL_TOOLS`
- Nur direkt aufrufbare Tools bleiben für das Modell sichtbar und erscheinen nicht in `ALL_TOOLS`
- Abgelehnte Tools erscheinen nicht in `ALL_TOOLS`
- `tools.search`, `tools.describe`, `tools.callValue` und `tools.call` funktionieren für OpenClaw-Tools
- `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` stellen MCP-Deklarationen im TypeScript-Stil
  ohne Bridge-/Tool-Aufruf bereit
- Der MCP-Namespace `$api()` bleibt als Inline-Fallback für Schemas verfügbar
- MCP-Namespace-Aufrufe funktionieren für sichtbare MCP-Tools mit einer Objekteingabe, während
  direkte MCP-Katalogeinträge in `tools.*` fehlen
- Tool-Search-Steuerungs-Tools sind sowohl auf der Modelloberfläche als auch im
  verborgenen Katalog ausgeblendet
- Verschachtelte Aufrufe bewahren das Genehmigungs- und Hook-Verhalten
- Shell-`exec` ist für das Modell ausgeblendet, kann jedoch bei entsprechender
  Zulassung über die Katalog-ID aufgerufen werden
- Rekursive Codemodus-`exec` und `wait` können nicht aus Gastcode aufgerufen werden
- TypeScript-Eingaben werden transformiert und ausgewertet, ohne TypeScript auf
  deaktivierten oder reinen JavaScript-Pfaden zu laden
- Der Zugriff auf `import`, `require`, Dateisystem, Netzwerk und Umgebung schlägt fehl
- Endlosschleifen führen zu einer Zeitüberschreitung und können den Gateway nicht blockieren
- Fehler aufgrund der Speicherbegrenzung beenden die Gast-VM
- Ausgabe- und Snapshot-Begrenzungen werden für abgeschlossene und ausgesetzte Aufrufe durchgesetzt
- `wait` setzt einen ausgesetzten Snapshot fort und gibt den endgültigen Wert zurück
- Abgelaufene, abgebrochene, sitzungsfremde und unbekannte `runId`-Werte schlagen fehl
- Transkriptwiedergabe und Persistenz bewahren Codemodus-Steuerungsaufrufe
- Transkript und Telemetrie zeigen verschachtelte Tool-Aufrufe deutlich an

## E2E-Testplan

Führen Sie diese beim Ändern der Laufzeit als Integrations- oder End-to-End-Tests aus:

1. Starten Sie einen Gateway mit `tools.codeMode.enabled: false`.
2. Senden Sie einen Agent-Durchlauf mit einem kleinen Satz direkter Tools.
3. Stellen Sie sicher, dass die für das Modell sichtbaren Tools unverändert sind.
4. Starten Sie mit `tools.codeMode.enabled: true` neu.
5. Senden Sie einen Agent-Durchlauf mit OpenClaw-, Plugin-, MCP- und Client-Test-Tools.
6. Stellen Sie sicher, dass die für das Modell sichtbare Tool-Liste aus `exec`, `wait` sowie ausschließlich den konfigurierten
   nur direkt aufrufbaren Tools besteht.
7. Lesen Sie in `exec` den Wert `ALL_TOOLS` und stellen Sie sicher, dass die katalogfähigen effektiven Test-
   Tools vorhanden sind, während nur direkt aufrufbare Tools fehlen.
8. Rufen Sie in `exec` OpenClaw-/Plugin-/Client-Tools über `tools.search`,
   `tools.describe` und `tools.callValue` (oder unverarbeitetes `tools.call`) auf.
9. Rufen Sie in `exec` `API.list("mcp")` und `API.read("mcp/<server>.d.ts")` auf und
   stellen Sie sicher, dass die Deklarationsdateien sichtbare MCP-Tools beschreiben.
10. Rufen Sie in `exec` MCP-Tools über `MCP.<server>.<tool>({ ...input })` auf und
    stellen Sie sicher, dass direkte MCP-Katalogeinträge in `ALL_TOOLS` und
    `tools.*` fehlen.
11. Stellen Sie sicher, dass abgelehnte Tools fehlen und nicht über eine erratene ID aufgerufen werden können.
12. Starten Sie einen verschachtelten Tool-Aufruf, der abgeschlossen wird, nachdem `exec` den Wert `waiting` zurückgibt.
13. Rufen Sie `wait` auf und stellen Sie sicher, dass die wiederhergestellte VM das Tool-Ergebnis empfängt.
14. Stellen Sie sicher, dass die endgültige Antwort eine nach der Wiederherstellung erzeugte Ausgabe enthält.
15. Stellen Sie sicher, dass Zeitüberschreitung, Abbruch und Snapshot-Ablauf den Laufzeitzustand bereinigen.
16. Exportieren Sie die Trajektorie und stellen Sie sicher, dass verschachtelte Aufrufe unter dem übergeordneten
    Codemodus-Aufruf sichtbar sind.

Bei reinen Dokumentationsänderungen an dieser Seite sollte weiterhin `pnpm check:docs` ausgeführt werden.

## Verwandte Themen

- [Swarm](/tools/swarm) für die Agent-Orchestrierung mit Auffächerung aus Codemodus-Skripten
- [Tool Search](/de/tools/tool-search)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Exec-Tool](/de/tools/exec)
- [Codeausführung](/de/tools/code-execution)
