---
read_when:
    - Sie möchten, dass OpenClaw-Agenten einen großen Tool-Katalog verwenden, ohne jedes Tool-Schema zum Prompt hinzuzufügen.
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine einzige kompakte Runtime-Oberfläche verfügbar machen
    - Sie implementieren oder debuggen die Tool-Erkennung für OpenClaw-Ausführungen
summary: 'Tool-Suche: große OpenClaw-Toolkataloge hinter Suche, Beschreibung und Aufruf kompakt halten'
title: Tool-Suche
x-i18n:
    generated_at: "2026-06-27T18:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search ist ein experimentelles Laufzeitfeature für OpenClaw-Agenten. Es gibt Agenten eine
kompakte Möglichkeit, große Tool-Kataloge zu entdecken und aufzurufen. Es ist nützlich, wenn der Lauf
viele verfügbare Tools hat, das Modell aber wahrscheinlich nur wenige davon benötigt.

Diese Seite dokumentiert die OpenClaw Tool-Suche. Sie ist nicht die Codex-native Tool-
Suche oder die Oberfläche für dynamische Tools. Codex-nativer Code-Modus, Tool-Suche, zurückgestellte
dynamische Tools und verschachtelte Tool-Aufrufe sind stabile Codex-Harness-Oberflächen und hängen
nicht von `tools.toolSearch` ab.

Wenn sie für OpenClaw-Läufe aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool.
Dieses Tool führt einen kurzen JavaScript-Body in einem isolierten Node-
Unterprozess mit einer `openclaw.tools`-Bridge aus:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Der Katalog kann OpenClaw-Tools, Plugin-Tools, MCP-Tools und
vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht jedes vollständige Schema im Voraus.
Stattdessen durchsucht es kompakte Deskriptoren, beschreibt ein ausgewähltes Tool, wenn es
das genaue Schema benötigt, und ruft dieses Tool über OpenClaw auf.

Codex-Harness-Läufe erhalten diese experimentellen OpenClaw-Tool-Search-
Steuerelemente nicht. OpenClaw übergibt Produktfähigkeiten als dynamische Tools an Codex, und
Codex besitzt den stabilen nativen Code-Modus, die native Tool-Suche, zurückgestellte dynamische
Tools und verschachtelte Tool-Aufrufe.

## Wie ein Turn abläuft

Zur Planungszeit erstellt der eingebettete OpenClaw-Runner den effektiven Katalog für den
Lauf:

1. Die aktive Tool-Richtlinie für Agent, Profil, Sandbox und Sitzung auflösen.
2. Zulässige OpenClaw- und Plugin-Tools auflisten.
3. Zulässige MCP-Tools über die MCP-Laufzeit der Sitzung auflisten.
4. Zulässige Client-Tools hinzufügen, die für den aktuellen Lauf bereitgestellt wurden.
5. Kompakte Deskriptoren für die Suche indexieren.
6. Die OpenClaw-Code-Bridge, die strukturierten Fallback-Tools oder die
   kompakte Verzeichnisoberfläche für das Modell verfügbar machen.

Zur Ausführungszeit kehrt jeder echte Tool-Aufruf zu OpenClaw zurück. Die isolierte Node-
Laufzeit hält keine Plugin-Implementierungen, MCP-Client-Objekte oder Secrets.
`openclaw.tools.call(...)` geht über die Bridge zurück in den Gateway, wo die
normale Richtlinien-, Freigabe-, Hook-, Logging- und Ergebnisverarbeitung weiterhin gilt.

## Modi

`tools.toolSearch` hat drei modellseitige Modi:

- `code`: stellt `tool_search_code` bereit, die standardmäßige kompakte JavaScript-Bridge.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache
  strukturierte Tools für Provider bereit, die keinen Code erhalten sollten.
- `directory`: stellt `tool_search`, `tool_describe` und `tool_call` plus ein
  begrenztes Prompt-Verzeichnis verfügbarer Tool-Namen und Beschreibungen für
  Provider bereit, die Tool-Namen ohne jedes vollständige Schema sehen sollten. OpenClaw kann
  auch einen kleinen begrenzten Satz wahrscheinlicher oder erforderlicher Tool-Schemas direkt
  für den aktuellen Turn bereitstellen.

Alle Modi verwenden denselben richtliniengefilterten Katalog und den normalen OpenClaw-
Ausführungspfad. Wenn die aktuelle Laufzeit den isolierten Node-Child-Prozess für den Code-Modus
nicht starten kann, fällt der Standardmodus `code` vor der Katalog-
Compaction auf `tools` zurück. Im Modus `directory` bleiben vom Client bereitgestellte Tools
für den aktuellen Lauf direkt sichtbar, während OpenClaw-Tools, Plugin-Tools und MCP-Tools
hinter dem Verzeichniskatalog kompaktiert werden können. Ein direkter Aufruf eines exakten ausgeblendeten
Verzeichnisnamens wird vor der Ausführung aus demselben autorisierten Katalog hydratisiert.

Alle Modi sind experimentell. Bevorzugen Sie direkte Tool-Bereitstellung für kleine OpenClaw-Tool-
Kataloge und bevorzugen Sie die Codex-nativen stabilen Oberflächen für Codex-Harness-Läufe.

Es gibt keine separate Konfiguration für die Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der
Katalog zulässige OpenClaw-, MCP- und Client-Tools nach normaler Richtlinien-
Filterung.

## Warum es das gibt

Große Kataloge sind nützlich, aber teuer. Jedes Tool-Schema an das Modell zu senden
macht die Anfrage größer, verlangsamt die Planung und erhöht die Wahrscheinlichkeit unbeabsichtigter Tool-
Auswahl.

Tool Search verändert die Form:

- direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token
- Code-Modus von Tool Search: Das Modell sieht ein kompaktes Code-Tool und einen kurzen API-
  Vertrag
- Tools-Modus von Tool Search: Das Modell sieht drei kompakte strukturierte Fallback-
  Tools
- Verzeichnismodus von Tool Search: Das Modell sieht ein begrenztes Verzeichnis plus
  Such-/Beschreibungs-/Aufruf-Steuerelemente und einen kleinen begrenzten Satz wahrscheinlicher oder erforderlicher
  Schemas
- während des Turns: Das Modell kann verbleibende Schemas nach Bedarf laden

Direkte Tool-Bereitstellung bleibt der richtige Standard für kleine Kataloge. Tool Search
ist am besten, wenn ein Lauf viele Tools sehen kann, insbesondere von MCP-Servern oder
vom Client bereitgestellten App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für den aktuellen Lauf. Ergebnisse sind kompakt und sicher
in den Prompt-Kontext zurückzugeben.

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

Er hält außerdem vom Client bereitgestellte Tools direkt sichtbar und kann einen kleinen
begrenzten Satz wahrscheinlicher oder erforderlicher Katalog-Tool-Schemas direkt für den aktuellen
Turn bereitstellen. Wenn das begrenzte Verzeichnis Einträge auslässt, verwenden Sie `tool_search`, um sie zu finden. Wenn
das Modell direkt einen exakten ausgeblendeten Verzeichnis-Tool-Namen anfordert, hydratisiert OpenClaw
ihn vor der normalen Ausführung aus dem autorisierten Katalog.
Client-Tool-Namen im Verzeichnismodus dürfen nicht mit OpenClaw-, Plugin- oder MCP-
Tool-Namen kollidieren, da der exakte zurückgestellte Dispatch diese Namen verwendet.

## Laufzeitgrenze

Die Code-Bridge läuft in einem kurzlebigen Node-Unterprozess. Der Unterprozess startet
mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder
Netzwerkberechtigungen und ohne Child-Prozess- oder Worker-Berechtigungen. OpenClaw erzwingt ein
Wall-Clock-Timeout im Parent-Prozess und beendet den Unterprozess bei Timeout, einschließlich
nach asynchronen Fortsetzungen.

Die Laufzeit stellt nur Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normales OpenClaw-Verhalten gilt weiterhin für finale Aufrufe:

- Tool-Zulassungs- und Ablehnungsrichtlinien
- Tool-Einschränkungen pro Agent und pro Sandbox
- Tool-Richtlinie für Kanal/Laufzeit
- Freigabe-Hooks
- Plugin-`before_tool_call`-Hooks
- Sitzungsidentität, Logs und Telemetrie

## Konfiguration

Aktivieren Sie Tool Search für OpenClaw-Läufe mit der Standard-Code-Bridge:

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

Passen Sie Timeout im Code-Modus und Suchergebnislimits an:

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

Tool Search zeichnet genug Telemetrie auf, um sie mit direkter Tool-Bereitstellung zu vergleichen:

- insgesamt serialisierte Tool- und Prompt-Bytes, die an das Harness gesendet wurden
- Kataloggröße und Quellenaufschlüsselung
- Such-, Beschreibungs- und Aufrufzahlen
- finale Tool-Aufrufe, die über OpenClaw ausgeführt wurden
- ausgewählte Tool-IDs und Quellen

Sitzungslogs sollten es ermöglichen, Folgendes zu beantworten:

- wie viele Tool-Schemas das Modell im Voraus gesehen hat
- wie viele Such- und Beschreibungsvorgänge es ausgeführt hat
- welches finale Tool aufgerufen wurde
- ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool kam

## E2E-Validierung

Der Gateway-E2E-Runner weist beide Pfade mit der OpenClaw-Laufzeit nach:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Er erstellt ein temporäres Fake-Plugin mit einem großen Tool-Katalog, startet den Mock-
OpenAI-Provider, startet einen Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search
und vergleicht dann Provider-Anfragepayloads und Sitzungslogs.

Die Regression weist nach:

1. Der direkte Modus kann das Fake-Plugin-Tool aufrufen.
2. Tool Search kann dasselbe Fake-Plugin-Tool aufrufen.
3. Der direkte Modus stellt die Fake-Plugin-Tool-Schemas direkt für den Provider bereit.
4. Tool Search stellt nur die kompakte Bridge bereit.
5. Der Tool-Search-Anfragepayload ist für den großen Fake-Katalog kleiner.
6. Sitzungslogs zeigen die erwarteten Tool-Aufrufzahlen und Telemetrie für Bridge-Aufrufe.

## Fehlerverhalten

Tool Search sollte geschlossen fehlschlagen:

- Wenn ein Tool nicht in der effektiven Richtlinie enthalten ist, sollte die Suche es nicht zurückgeben
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, sollte `tool_call` fehlschlagen
- Wenn Richtlinie oder Freigabe die Ausführung blockieren, sollte das Aufrufergebnis diese
  Blockierung melden, statt sie zu umgehen
- Wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder
  deaktivieren Sie Tool Search für diese Bereitstellung

## Verwandt

- [Tools und Plugins](/de/tools)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [ACP-Agenten einrichten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
