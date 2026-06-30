---
read_when:
    - Sie möchten, dass OpenClaw-Agenten einen großen Tool-Katalog verwenden, ohne jedes Tool-Schema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine kompakte Runtime-Oberfläche bereitstellen
    - Sie implementieren oder debuggen die Tool-Erkennung für OpenClaw-Läufe
summary: 'Tool-Suche: große OpenClaw-Toolkataloge hinter Suche, Beschreibung und Aufruf kompakt bündeln'
title: Tool-Suche
x-i18n:
    generated_at: "2026-06-30T13:56:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Die Werkzeugsuche ist eine experimentelle Laufzeitfunktion für OpenClaw-Agenten. Sie gibt Agenten eine
kompakte Möglichkeit, große Tool-Kataloge zu entdecken und aufzurufen. Sie ist nützlich, wenn der Lauf
viele verfügbare Tools hat, das Modell aber wahrscheinlich nur einige davon benötigt.

Diese Seite dokumentiert die OpenClaw-Werkzeugsuche. Sie ist nicht die Codex-native
Werkzeugsuche oder Dynamic-Tools-Oberfläche. Codex-nativer Code-Modus, Werkzeugsuche, verzögerte
dynamische Tools und verschachtelte Tool-Aufrufe sind stabile Codex-Harness-Oberflächen und
hängen nicht von `tools.toolSearch` ab.

Wenn sie für OpenClaw-Läufe aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool.
Dieses Tool führt einen kurzen JavaScript-Body in einem isolierten Node-Unterprozess
mit einer `openclaw.tools`-Bridge aus:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Der Katalog kann OpenClaw-Tools, Plugin-Tools, MCP-Tools und
vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht jedes vollständige Schema vorab.
Stattdessen durchsucht es kompakte Deskriptoren, beschreibt ein ausgewähltes Tool, wenn es
das exakte Schema benötigt, und ruft dieses Tool über OpenClaw auf.

Codex-Harness-Läufe erhalten diese experimentellen Steuerelemente der OpenClaw-Werkzeugsuche
nicht. OpenClaw übergibt Produktfähigkeiten als dynamische Tools an Codex, und
Codex besitzt den stabilen nativen Code-Modus, die native Werkzeugsuche, verzögerte dynamische
Tools und verschachtelte Tool-Aufrufe.

## Wie ein Turn abläuft

Zur Planungszeit baut der eingebettete OpenClaw-Runner den effektiven Katalog für den
Lauf auf:

1. Die aktive Tool-Policy für Agent, Profil, Sandbox und Sitzung auflösen.
2. Berechtigte OpenClaw- und Plugin-Tools auflisten.
3. Berechtigte MCP-Tools über die Sitzungs-MCP-Laufzeit auflisten.
4. Berechtigte Client-Tools hinzufügen, die für den aktuellen Lauf bereitgestellt wurden.
5. Kompakte Deskriptoren für die Suche indexieren.
6. Dem Modell die OpenClaw-Code-Bridge, die strukturierten Fallback-Tools oder die
   kompakte Verzeichnisoberfläche bereitstellen.

Zur Ausführungszeit kehrt jeder echte Tool-Aufruf zu OpenClaw zurück. Die isolierte Node-
Laufzeit enthält keine Plugin-Implementierungen, MCP-Client-Objekte oder Secrets.
`openclaw.tools.call(...)` überquert die Bridge zurück in den Gateway, wo die
normale Policy-, Freigabe-, Hook-, Logging- und Ergebnisverarbeitung weiterhin gilt.

## Modi

`tools.toolSearch` hat drei modellseitige Modi:

- `code`: stellt `tool_search_code` bereit, die standardmäßige kompakte JavaScript-Bridge.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache
  strukturierte Tools für Provider bereit, die keinen Code erhalten sollen.
- `directory`: stellt `tool_search`, `tool_describe` und `tool_call` sowie ein
  begrenztes Prompt-Verzeichnis verfügbarer Tool-Namen und Beschreibungen für
  Provider bereit, die Tool-Namen ohne jedes vollständige Schema sehen sollen. OpenClaw kann
  außerdem eine kleine begrenzte Menge wahrscheinlich benötigter oder erforderlicher Tool-Schemata
  direkt für den aktuellen Turn bereitstellen.

Alle Modi verwenden denselben policy-gefilterten Katalog und den normalen OpenClaw-Ausführungspfad.
Wenn die aktuelle Laufzeit den isolierten Node-Kindprozess für den Code-Modus nicht starten kann,
fällt der Standardmodus `code` vor der Katalog-Compaction auf `tools` zurück. Im Modus
`directory` bleiben vom Client bereitgestellte Tools für den aktuellen Lauf direkt sichtbar,
während OpenClaw-Tools, Plugin-Tools und MCP-Tools hinter dem Verzeichniskatalog
kompaktiert werden können. Ein direkter Aufruf eines exakten verborgenen
Verzeichnisnamens wird vor der Ausführung aus demselben autorisierten Katalog hydriert.

Alle Modi sind experimentell. Bevorzugen Sie direkte Tool-Bereitstellung für kleine OpenClaw-Tool-
Kataloge und die Codex-nativen stabilen Oberflächen für Codex-Harness-Läufe.

Es gibt keine separate Quellenauswahlkonfiguration. Wenn die Werkzeugsuche aktiviert ist, enthält der
Katalog berechtigte OpenClaw-, MCP- und Client-Tools nach normaler Policy-
Filterung.

## Warum dies existiert

Große Kataloge sind nützlich, aber teuer. Jedes Tool-Schema an das Modell zu senden,
macht die Anfrage größer, verlangsamt die Planung und erhöht die Wahrscheinlichkeit versehentlicher
Tool-Auswahl.

Die Werkzeugsuche ändert die Form:

- direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token
- Code-Modus der Werkzeugsuche: Das Modell sieht ein kompaktes Code-Tool und einen kurzen API-
  Vertrag
- Tools-Modus der Werkzeugsuche: Das Modell sieht drei kompakte strukturierte Fallback-
  Tools
- Verzeichnismodus der Werkzeugsuche: Das Modell sieht ein begrenztes Verzeichnis sowie
  Such-/Beschreibungs-/Aufruf-Steuerelemente und eine kleine begrenzte Menge wahrscheinlicher oder erforderlicher
  Schemata
- während des Turns: Das Modell kann verbleibende Schemata bei Bedarf laden

Direkte Tool-Bereitstellung ist weiterhin die richtige Voreinstellung für kleine Kataloge. Die Werkzeugsuche
ist am besten geeignet, wenn ein Lauf viele Tools sehen kann, insbesondere von MCP-Servern oder
vom Client bereitgestellten App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für den aktuellen Lauf. Ergebnisse sind kompakt und sicher
zurück in den Prompt-Kontext zu geben.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Lädt vollständige Metadaten für ein Suchergebnis, einschließlich des exakten Eingabeschemas.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Ruft ein ausgewähltes Tool über OpenClaw auf.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Der strukturierte Fallback-Modus stellt dieselben Operationen als Tools bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Der Verzeichnismodus stellt bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Er hält außerdem vom Client bereitgestellte Tools direkt sichtbar und kann eine kleine
begrenzte Menge wahrscheinlicher oder erforderlicher Katalog-Tool-Schemata direkt für den aktuellen
Turn bereitstellen. Wenn das begrenzte Verzeichnis Einträge auslässt, verwenden Sie `tool_search`, um sie zu finden. Wenn
das Modell einen exakten verborgenen Verzeichnis-Tool-Namen direkt anfordert, hydriert OpenClaw
ihn vor der normalen Ausführung aus dem autorisierten Katalog.
Tool-Namen von Client-Tools im Verzeichnismodus dürfen nicht mit OpenClaw-, Plugin- oder MCP-
Tool-Namen kollidieren, weil der exakte verzögerte Dispatch diese Namen verwendet.

## Laufzeitgrenze

Die Code-Bridge läuft in einem kurzlebigen Node-Unterprozess. Der Unterprozess startet
mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder
Netzwerkfreigaben und ohne Kindprozess- oder Worker-Freigaben. OpenClaw erzwingt einen
Wall-Clock-Timeout im Elternprozess und beendet den Unterprozess bei Timeout, einschließlich
nach asynchronen Fortsetzungen.

Die Laufzeit stellt nur bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normales OpenClaw-Verhalten gilt weiterhin für finale Aufrufe:

- Tool-Allow- und Deny-Policies
- Tool-Einschränkungen pro Agent und pro Sandbox
- Channel-/Laufzeit-Tool-Policy
- Freigabe-Hooks
- Plugin-`before_tool_call`-Hooks
- Sitzungsidentität, Logs und Telemetrie

## Konfiguration

Aktivieren Sie die Werkzeugsuche für OpenClaw-Läufe mit der standardmäßigen Code-Bridge:

```bash
openclaw config set tools.toolSearch true
```

Äquivalentes JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Verwenden Sie stattdessen die strukturierten Fallback-Tools für OpenClaw-Läufe:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Verwenden Sie stattdessen die kompakte Verzeichnisoberfläche für OpenClaw-Läufe:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Passen Sie Timeout und Suchergebnisgrenzen für den Code-Modus an:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Deaktivieren:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt und Telemetrie

Die Werkzeugsuche zeichnet genug Telemetrie auf, um sie mit direkter Tool-Bereitstellung zu vergleichen:

- insgesamt serialisierte Tool- und Prompt-Bytes, die an den Harness gesendet wurden
- Kataloggröße und Quellenaufschlüsselung
- Such-, Beschreibungs- und Aufrufanzahlen
- finale Tool-Aufrufe, die über OpenClaw ausgeführt wurden
- ausgewählte Tool-IDs und Quellen

Sitzungslogs sollten es ermöglichen, Folgendes zu beantworten:

- wie viele Tool-Schemata das Modell vorab gesehen hat
- wie viele Such- und Beschreibungsoperationen es ausgeführt hat
- welches finale Tool aufgerufen wurde
- ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool kam

## E2E-Validierung

Das Gateway-Szenario im QA Lab beweist beide Pfade mit der OpenClaw-Laufzeit:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Es erstellt ein temporäres gefälschtes Plugin mit einem großen Tool-Katalog, startet den Mock-
OpenAI-Provider, startet einen Gateway einmal im direkten Modus und einmal mit aktivierter Werkzeugsuche
und vergleicht anschließend Provider-Request-Payloads und Sitzungslogs.

Die Regression beweist:

1. Der direkte Modus kann das gefälschte Plugin-Tool aufrufen.
2. Die Werkzeugsuche kann dasselbe gefälschte Plugin-Tool aufrufen.
3. Der direkte Modus stellt die Schemata des gefälschten Plugin-Tools direkt dem Provider bereit.
4. Die Werkzeugsuche stellt nur die kompakte Bridge bereit.
5. Die Request-Payload der Werkzeugsuche ist für den großen gefälschten Katalog kleiner.
6. Sitzungslogs zeigen die erwarteten Tool-Aufrufanzahlen und die Telemetrie für gebridgte Aufrufe.

## Fehlerverhalten

Die Werkzeugsuche sollte fail-closed sein:

- Wenn ein Tool nicht in der effektiven Policy enthalten ist, sollte die Suche es nicht zurückgeben
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, sollte `tool_call` fehlschlagen
- Wenn Policy oder Freigabe die Ausführung blockieren, sollte das Aufrufergebnis diese
  Blockierung melden, statt sie zu umgehen
- Wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder
  deaktivieren Sie die Werkzeugsuche für diese Bereitstellung

## Verwandte Themen

- [Tools und Plugins](/de/tools)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [ACP-Agenten einrichten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
