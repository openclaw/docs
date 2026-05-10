---
read_when:
    - Sie möchten, dass PI-Agenten einen umfangreichen Tool-Katalog verwenden, ohne jedes Tool-Schema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine einzige kompakte PI-Oberfläche bereitstellen
    - Sie implementieren oder debuggen die Tool-Erkennung für PI-Ausführungen
summary: 'Tool-Suche: große Pi-Tool-Kataloge hinter Suchen, Beschreiben und Aufrufen komprimieren'
title: Tool-Suche
x-i18n:
    generated_at: "2026-05-10T19:56:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Die Tool Search bietet PI-Agenten eine kompakte Möglichkeit, große Tool-Kataloge zu entdecken und aufzurufen. Sie ist nützlich, wenn für den Lauf viele Tools verfügbar sind, das Modell aber wahrscheinlich nur wenige davon benötigt.

Wenn sie für PI aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool. Dieses Tool führt einen kurzen JavaScript-Body in einem isolierten Node-Unterprozess mit einer `openclaw.tools`-Bridge aus:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Der Katalog kann OpenClaw-Tools, Plugin-Tools, MCP-Tools und vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht jedes vollständige Schema im Voraus. Stattdessen durchsucht es kompakte Deskriptoren, beschreibt bei Bedarf ein ausgewähltes Tool, wenn es das genaue Schema benötigt, und ruft dieses Tool über OpenClaw auf.

Läufe des Codex-Harness erhalten diese OpenClaw-Steuerelemente für Tool Search nicht. OpenClaw übergibt Produktfunktionen als dynamische Tools an Codex, und Codex besitzt nativen Code-Modus, native Tool-Suche, verzögerte dynamische Tools und verschachtelte Tool-Aufrufe.

## Wie ein Turn abläuft

Zur Planungszeit erstellt der eingebettete PI-Runner den effektiven Katalog für den Lauf:

1. Die aktive Tool-Richtlinie für Agent, Profil, Sandbox und Sitzung auflösen.
2. Geeignete OpenClaw- und Plugin-Tools auflisten.
3. Geeignete MCP-Tools über die MCP-Laufzeit der Sitzung auflisten.
4. Geeignete Client-Tools hinzufügen, die für den aktuellen Lauf bereitgestellt wurden.
5. Kompakte Deskriptoren für die Suche indizieren.
6. Dem Modell entweder die PI-Code-Bridge oder die strukturierten Fallback-Tools bereitstellen.

Zur Ausführungszeit geht jeder echte Tool-Aufruf zurück an OpenClaw. Die isolierte Node-Laufzeit enthält keine Plugin-Implementierungen, MCP-Client-Objekte oder Secrets. `openclaw.tools.call(...)` überquert die Bridge zurück in den Gateway, wo die normalen Richtlinien-, Genehmigungs-, Hook-, Logging- und Ergebnisbehandlungen weiterhin gelten.

## Modi

`tools.toolSearch` hat zwei modellseitige Modi:

- `code`: stellt `tool_search_code` bereit, die standardmäßige kompakte JavaScript-Bridge.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache strukturierte Tools für Provider bereit, die keinen Code erhalten sollen.

Beide Modi verwenden denselben Katalog und denselben Ausführungspfad. Der einzige Unterschied ist die Form, die das Modell sieht. Wenn die aktuelle Laufzeit den isolierten Node-Kindprozess für den Code-Modus nicht starten kann, fällt der standardmäßige Modus `code` vor der Katalog-Compaction auf `tools` zurück.

Es gibt keine separate Konfiguration für die Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der Katalog nach normaler Richtlinienfilterung geeignete OpenClaw-, MCP- und Client-Tools.

## Warum es das gibt

Große Kataloge sind nützlich, aber teuer. Wenn jedes Tool-Schema an das Modell gesendet wird, wird die Anfrage größer, die Planung langsamer und die Wahrscheinlichkeit versehentlicher Tool-Auswahl höher.

Tool Search ändert die Form:

- direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token
- Tool Search im Code-Modus: Das Modell sieht ein kompaktes Code-Tool und einen kurzen API-Vertrag
- Tool Search im Tools-Modus: Das Modell sieht drei kompakte strukturierte Fallback-Tools
- während des Turns: Das Modell lädt nur die Tool-Schemata, die es tatsächlich benötigt

Direkte Tool-Bereitstellung bleibt für kleine Kataloge die richtige Voreinstellung. Tool Search eignet sich am besten, wenn ein Lauf viele Tools sehen kann, insbesondere von MCP-Servern oder vom Client bereitgestellten App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für den aktuellen Lauf. Ergebnisse sind kompakt und können sicher wieder in den Prompt-Kontext eingefügt werden.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Lädt die vollständigen Metadaten für ein Suchergebnis, einschließlich des exakten Eingabeschemas.

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

## Laufzeitgrenze

Die Code-Bridge läuft in einem kurzlebigen Node-Unterprozess. Der Unterprozess startet mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder Netzwerkfreigaben und ohne Freigaben für Kindprozesse oder Worker. OpenClaw erzwingt im Elternprozess ein Wall-Clock-Timeout und beendet den Unterprozess bei Timeout, einschließlich nach asynchronen Fortsetzungen.

Die Laufzeit stellt nur Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Das normale OpenClaw-Verhalten gilt weiterhin für finale Aufrufe:

- Richtlinien zum Erlauben und Ablehnen von Tools
- Tool-Einschränkungen pro Agent und pro Sandbox
- Gating nur für Besitzer
- Genehmigungs-Hooks
- Plugin-`before_tool_call`-Hooks
- Sitzungsidentität, Logs und Telemetrie

## Konfiguration

Aktivieren Sie Tool Search für PI-Läufe mit der standardmäßigen Code-Bridge:

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

Verwenden Sie stattdessen die strukturierten Fallback-Tools für PI-Läufe:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Passen Sie Timeout im Code-Modus und Limits für Suchergebnisse an:

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

Deaktivieren Sie sie:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt und Telemetrie

Tool Search erfasst ausreichend Telemetrie, um sie mit direkter Tool-Bereitstellung zu vergleichen:

- insgesamt serialisierte Tool- und Prompt-Bytes, die an das Harness gesendet wurden
- Kataloggröße und Aufschlüsselung nach Quelle
- Anzahl von Such-, Beschreibungs- und Aufrufvorgängen
- finale Tool-Aufrufe, die über OpenClaw ausgeführt wurden
- ausgewählte Tool-IDs und Quellen

Sitzungslogs sollten es ermöglichen, Folgendes zu beantworten:

- wie viele Tool-Schemata das Modell im Voraus gesehen hat
- wie viele Such- und Beschreibungsvorgänge es durchgeführt hat
- welches finale Tool aufgerufen wurde
- ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool kam

## E2E-Validierung

Der Gateway-E2E-Runner weist beide Pfade mit dem PI-Harness nach:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Er erstellt ein temporäres Fake-Plugin mit einem großen Tool-Katalog, startet den Mock-OpenAI-Provider, startet einen Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search und vergleicht dann Provider-Anfrage-Payloads und Sitzungslogs.

Die Regression weist nach:

1. Der direkte Modus kann das Fake-Plugin-Tool aufrufen.
2. Tool Search kann dasselbe Fake-Plugin-Tool aufrufen.
3. Der direkte Modus stellt die Schemata des Fake-Plugin-Tools direkt dem Provider bereit.
4. Tool Search stellt nur die kompakte Bridge bereit.
5. Die Anfrage-Payload von Tool Search ist für den großen Fake-Katalog kleiner.
6. Sitzungslogs zeigen die erwarteten Tool-Aufrufzahlen und Telemetrie der über die Bridge ausgeführten Aufrufe.

## Fehlerverhalten

Tool Search sollte geschlossen fehlschlagen:

- Wenn ein Tool nicht in der effektiven Richtlinie enthalten ist, sollte die Suche es nicht zurückgeben
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, sollte `tool_call` fehlschlagen
- Wenn Richtlinie oder Genehmigung die Ausführung blockieren, sollte das Aufrufergebnis diese Blockierung melden, statt sie zu umgehen
- Wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder deaktivieren Sie Tool Search für diese Bereitstellung

## Verwandte Themen

- [Tools und Plugins](/de/tools)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [ACP-Agenten einrichten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
