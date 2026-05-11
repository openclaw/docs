---
read_when:
    - Sie möchten, dass PI-Agenten einen umfangreichen Tool-Katalog verwenden, ohne jedes Tool-Schema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine kompakte PI-Oberfläche bereitstellen
    - Sie implementieren oder debuggen die Tool-Erkennung für Pi-Ausführungen
summary: 'Tool-Suche: große PI-Tool-Kataloge hinter Suche, Beschreibung und Aufruf komprimieren'
title: Werkzeugsuche
x-i18n:
    generated_at: "2026-05-11T20:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search ist eine experimentelle OpenClaw-PI-Agentenfunktion. Sie gibt PI-Agenten eine
kompakte Möglichkeit, große Tool-Kataloge zu entdecken und aufzurufen. Sie ist nützlich, wenn der Lauf
viele verfügbare Tools hat, das Modell aber voraussichtlich nur wenige davon benötigt.

Diese Seite dokumentiert OpenClaw PI Tool Search. Es ist nicht die Codex-native
Tool-Suche oder Dynamic-Tools-Oberfläche. Codex-nativer Code-Modus, Tool-Suche, verzögerte
dynamische Tools und verschachtelte Tool-Aufrufe sind stabile Codex-Harness-Oberflächen und
hängen nicht von `tools.toolSearch` ab.

Wenn sie für PI aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool.
Dieses Tool führt einen kurzen JavaScript-Body in einem isolierten Node-Unterprozess mit einer
`openclaw.tools`-Bridge aus:

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
das exakte Schema benötigt, und ruft dieses Tool über OpenClaw auf.

Codex-Harness-Läufe erhalten diese experimentellen OpenClaw-Tool-Search-Steuerelemente nicht.
OpenClaw übergibt Produktfunktionen als dynamische Tools an Codex, und
Codex besitzt den stabilen nativen Code-Modus, die native Tool-Suche, verzögerte dynamische
Tools und verschachtelte Tool-Aufrufe.

## Wie ein Turn abläuft

Zur Planungszeit baut der eingebettete PI-Runner den effektiven Katalog für den
Lauf auf:

1. Aktive Tool-Richtlinie für Agent, Profil, Sandbox und Sitzung auflösen.
2. Zulässige OpenClaw- und Plugin-Tools auflisten.
3. Zulässige MCP-Tools über die MCP-Laufzeit der Sitzung auflisten.
4. Zulässige Client-Tools hinzufügen, die für den aktuellen Lauf bereitgestellt wurden.
5. Kompakte Deskriptoren für die Suche indexieren.
6. Dem Modell entweder die PI-Code-Bridge oder die strukturierten Fallback-Tools
   bereitstellen.

Zur Ausführungszeit kehrt jeder echte Tool-Aufruf zu OpenClaw zurück. Die isolierte Node-
Laufzeit enthält keine Plugin-Implementierungen, MCP-Client-Objekte oder Secrets.
`openclaw.tools.call(...)` überquert die Bridge zurück in das Gateway, wo weiterhin
die normale Richtlinie, Freigabe, Hook-Ausführung, Protokollierung und Ergebnisbehandlung gelten.

## Modi

`tools.toolSearch` hat zwei modellseitige Modi:

- `code`: stellt `tool_search_code` bereit, die standardmäßige kompakte JavaScript-Bridge.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache
  strukturierte Tools für Provider bereit, die keinen Code erhalten sollten.

Beide Modi verwenden denselben Katalog und Ausführungspfad. Der einzige Unterschied ist die
Form, die das Modell sieht. Wenn die aktuelle Laufzeit den isolierten Node-
Kindprozess für den Code-Modus nicht starten kann, fällt der standardmäßige `code`-Modus vor
der Katalog-Compaction auf `tools` zurück.

Beide Modi sind experimentell. Bevorzugen Sie direkte Tool-Bereitstellung für kleine PI-Tool-
Kataloge und die Codex-nativen stabilen Oberflächen für Codex-Harness-Läufe.

Es gibt keine separate Konfiguration zur Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der
Katalog zulässige OpenClaw-, MCP- und Client-Tools nach normaler Richtlinienfilterung.

## Warum es das gibt

Große Kataloge sind nützlich, aber teuer. Jedes Tool-Schema an das Modell zu senden,
macht die Anfrage größer, verlangsamt die Planung und erhöht die Wahrscheinlichkeit versehentlicher
Tool-Auswahl.

Tool Search ändert die Form:

- direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token
- Tool-Search-Code-Modus: Das Modell sieht ein kompaktes Code-Tool und einen kurzen API-
  Vertrag
- Tool-Search-Tools-Modus: Das Modell sieht drei kompakte strukturierte Fallback-
  Tools
- während des Turns: Das Modell lädt nur die Tool-Schemas, die es tatsächlich benötigt

Direkte Tool-Bereitstellung bleibt für kleine Kataloge der richtige Standard. Tool Search
eignet sich am besten, wenn ein Lauf viele Tools sehen kann, insbesondere von MCP-Servern oder
vom Client bereitgestellten App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für den aktuellen Lauf. Ergebnisse sind kompakt und sicher
wieder in den Prompt-Kontext einzufügen.

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

## Laufzeitgrenze

Die Code-Bridge läuft in einem kurzlebigen Node-Unterprozess. Der Unterprozess startet
mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder
Netzwerkfreigaben und ohne Kindprozess- oder Worker-Freigaben. OpenClaw erzwingt ein
Wall-Clock-Timeout im Elternprozess und beendet den Unterprozess bei Timeout, auch
nach asynchronen Fortsetzungen.

Die Laufzeit stellt nur Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Normales OpenClaw-Verhalten gilt weiterhin für finale Aufrufe:

- Tool-Zulassungs- und Sperrrichtlinien
- Tool-Einschränkungen pro Agent und pro Sandbox
- Nur-Owner-Gating
- Freigabe-Hooks
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

Tool Search zeichnet genug Telemetrie auf, um es mit direkter Tool-Bereitstellung zu vergleichen:

- gesamte serialisierte Tool- und Prompt-Bytes, die an das Harness gesendet wurden
- Kataloggröße und Quellenaufschlüsselung
- Anzahl von Suchen, Beschreibungen und Aufrufen
- finale Tool-Aufrufe, die über OpenClaw ausgeführt wurden
- ausgewählte Tool-IDs und Quellen

Sitzungslogs sollten es ermöglichen, Folgendes zu beantworten:

- wie viele Tool-Schemas das Modell im Voraus gesehen hat
- wie viele Such- und Beschreibungsoperationen es durchgeführt hat
- welches finale Tool aufgerufen wurde
- ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool kam

## E2E-Validierung

Der Gateway-E2E-Runner weist beide Pfade mit dem PI-Harness nach:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Er erstellt ein temporäres Fake-Plugin mit einem großen Tool-Katalog, startet den Mock-
OpenAI-Provider, startet ein Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search
und vergleicht dann Provider-Anfragepayloads und Sitzungslogs.

Die Regression weist nach:

1. Der direkte Modus kann das Fake-Plugin-Tool aufrufen.
2. Tool Search kann dasselbe Fake-Plugin-Tool aufrufen.
3. Der direkte Modus stellt die Schemas des Fake-Plugin-Tools direkt dem Provider bereit.
4. Tool Search stellt nur die kompakte Bridge bereit.
5. Der Tool-Search-Anfragepayload ist für den großen Fake-Katalog kleiner.
6. Sitzungslogs zeigen die erwarteten Tool-Aufrufzahlen und Telemetrie für überbrückte Aufrufe.

## Fehlerverhalten

Tool Search sollte geschlossen fehlschlagen:

- wenn ein Tool nicht in der effektiven Richtlinie enthalten ist, sollte die Suche es nicht zurückgeben
- wenn ein ausgewähltes Tool nicht mehr verfügbar ist, sollte `tool_call` fehlschlagen
- wenn Richtlinie oder Freigabe die Ausführung blockieren, sollte das Aufrufergebnis diese
  Blockade melden, statt sie zu umgehen
- wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder
  deaktivieren Sie Tool Search für diese Bereitstellung

## Verwandt

- [Tools und Plugins](/de/tools)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
