---
read_when:
    - Sie möchten, dass OpenClaw-Agenten einen umfangreichen Werkzeugkatalog verwenden, ohne jedes Werkzeugschema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine einzige kompakte Laufzeitoberfläche bereitstellen
    - Sie implementieren oder debuggen die Tool-Erkennung für OpenClaw-Ausführungen
summary: 'Werkzeugsuche: Große OpenClaw-Werkzeugkataloge kompakt über Suche, Beschreibung und Aufruf zugänglich machen'
title: Werkzeugsuche
x-i18n:
    generated_at: "2026-07-12T02:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search ist eine experimentelle Funktion der OpenClaw-Agentenlaufzeit. Sie bietet Agenten eine kompakte Möglichkeit, große Toolkataloge zu durchsuchen und daraus Tools aufzurufen. Sie ist nützlich, wenn für einen Lauf viele Tools verfügbar sind, das Modell aber voraussichtlich nur wenige davon benötigt.

Diese Seite dokumentiert OpenClaw Tool Search. Sie behandelt nicht die Codex-native Toolsuche oder die Oberfläche für dynamische Tools. Der Codex-native Codemodus, die Toolsuche, verzögert bereitgestellte dynamische Tools und verschachtelte Toolaufrufe sind stabile Oberflächen der Codex-Testumgebung und hängen nicht von `tools.toolSearch` ab.

Wenn Tool Search für OpenClaw-Läufe aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool sowie alle ausschließlich direkt verfügbaren Tools, deren strukturierte Ergebnisse nicht über die kompakte Brücke übertragen werden können. Das Code-Tool führt einen kurzen JavaScript-Block in einem isolierten Node-Unterprozess mit einer `openclaw.tools`-Brücke aus:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Der Katalog kann katalogfähige OpenClaw-Tools, Plugin-Tools, MCP-Tools und vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht vorab jedes katalogisierte Schema. Stattdessen durchsucht es kompakte Beschreibungen, ruft bei Bedarf für ein ausgewähltes Tool das exakte Schema ab und ruft dieses Tool über OpenClaw auf. Ausschließlich direkt verfügbare Tools bleiben für das Modell sichtbar und werden nicht zum Katalog hinzugefügt.

Läufe in der Codex-Testumgebung erhalten diese experimentellen Steuerelemente von OpenClaw Tool Search nicht. OpenClaw übergibt Produktfunktionen als dynamische Tools an Codex. Codex stellt den stabilen nativen Codemodus, die native Toolsuche, verzögert bereitgestellte dynamische Tools und verschachtelte Toolaufrufe bereit.

## Ablauf eines Durchgangs

Während der Planung erstellt der eingebettete OpenClaw-Runner den effektiven Katalog für den Lauf:

1. Ermitteln der aktiven Toolrichtlinie für Agent, Profil, Sandbox und Sitzung.
2. Auflisten zulässiger OpenClaw- und Plugin-Tools.
3. Auflisten zulässiger MCP-Tools über die MCP-Laufzeit der Sitzung.
4. Hinzufügen zulässiger Client-Tools, die für den aktuellen Lauf bereitgestellt wurden.
5. Ausschließlich direkt verfügbare Tools für das Modell sichtbar halten und kompakte Beschreibungen für die übrigen katalogfähigen Tools indizieren.
6. Die OpenClaw-Codebrücke, die strukturierten Ausweich-Tools oder die kompakte Verzeichnisoberfläche zusammen mit diesen ausschließlich direkt verfügbaren Tools bereitstellen.

Während der Ausführung kehrt jeder tatsächliche Toolaufruf zu OpenClaw zurück. Die isolierte Node-Laufzeit enthält weder Plugin-Implementierungen noch MCP-Clientobjekte oder Geheimnisse. `openclaw.tools.call(...)` überquert die Brücke zurück zum Gateway, wo weiterhin die normalen Richtlinien sowie Genehmigungs-, Hook-, Protokollierungs- und Ergebnisverarbeitungsmechanismen gelten.

## Modi

`tools.toolSearch` verfügt über drei für das Modell sichtbare Modi:

- `code`: Stellt `tool_search_code`, die standardmäßige kompakte JavaScript-Brücke, zusammen mit ausschließlich direkt verfügbaren Tools bereit.
- `tools`: Stellt `tool_search`, `tool_describe` und `tool_call` als einfache strukturierte Tools für Provider bereit, die keinen Code erhalten sollen, zusammen mit ausschließlich direkt verfügbaren Tools.
- `directory`: Stellt `tool_search`, `tool_describe` und `tool_call` sowie ein begrenztes Prompt-Verzeichnis verfügbarer Toolnamen und -beschreibungen für Provider bereit, die Toolnamen sehen sollen, ohne jedes vollständige Schema zu erhalten. OpenClaw kann außerdem eine kleine, begrenzte Menge wahrscheinlicher oder erforderlicher Toolschemas für den aktuellen Durchgang direkt bereitstellen. Auch in diesem Modus bleiben ausschließlich direkt verfügbare Tools sichtbar.

Alle Modi verwenden denselben richtliniengefilterten Katalog und den normalen OpenClaw-Ausführungspfad. Mit `catalogMode: "direct-only"` gekennzeichnete Tools bleiben außerhalb dieses Katalogs und für das Modell sichtbar. Wenn die aktuelle Laufzeit den isolierten Node-Kindprozess für den Codemodus nicht starten kann, weicht der standardmäßige `code`-Modus vor der Compaction des Katalogs auf `tools` aus. Im `directory`-Modus bleiben vom Client bereitgestellte Tools für den aktuellen Lauf direkt sichtbar, während OpenClaw-Tools, Plugin-Tools und MCP-Tools hinter dem Verzeichniskatalog komprimiert werden können. Ein direkter Aufruf eines exakten verborgenen Verzeichnisnamens wird vor der Ausführung aus demselben autorisierten Katalog geladen.

Alle Modi sind experimentell. Bevorzugen Sie die direkte Toolbereitstellung für kleine OpenClaw-Toolkataloge und die stabilen Codex-nativen Oberflächen für Läufe in der Codex-Testumgebung.

Es gibt keine separate Konfiguration für die Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der Katalog nach der normalen Richtlinienfilterung katalogfähige OpenClaw-, MCP- und Client-Tools. Ausschließlich direkt verfügbare Tools werden separat beibehalten.

## Zweck

Große Kataloge sind nützlich, aber aufwendig. Wenn jedes Toolschema an das Modell gesendet wird, vergrößert dies die Anfrage, verlangsamt die Planung und erhöht die Wahrscheinlichkeit einer unbeabsichtigten Toolauswahl.

Tool Search verändert die Struktur:

- Direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token.
- Codemodus von Tool Search: Das Modell sieht ein kompaktes Code-Tool, einen kurzen API-Vertrag und alle ausschließlich direkt verfügbaren Tools.
- Toolmodus von Tool Search: Das Modell sieht drei kompakte strukturierte Ausweich-Tools sowie alle ausschließlich direkt verfügbaren Tools.
- Verzeichnismodus von Tool Search: Das Modell sieht ein begrenztes Verzeichnis sowie Steuerelemente zum Suchen, Beschreiben und Aufrufen, eine kleine begrenzte Menge wahrscheinlicher oder erforderlicher Schemas und alle ausschließlich direkt verfügbaren Tools.
- Während des Durchgangs: Das Modell kann die übrigen Schemas nach Bedarf laden.

Die direkte Toolbereitstellung ist weiterhin die richtige Standardeinstellung für kleine Kataloge. Tool Search eignet sich am besten, wenn ein Lauf auf viele Tools zugreifen kann, insbesondere auf solche von MCP-Servern oder vom Client bereitgestellte Anwendungstools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für den aktuellen Lauf. Die Ergebnisse sind kompakt und können sicher wieder in den Prompt-Kontext eingefügt werden.

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

Der strukturierte Ausweichmodus stellt dieselben Operationen als Tools bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Der Verzeichnismodus stellt Folgendes bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Er hält außerdem vom Client bereitgestellte Tools und alle ausschließlich direkt verfügbaren Tools direkt sichtbar und kann eine kleine, begrenzte Menge wahrscheinlicher oder erforderlicher Schemas von Katalog-Tools für den aktuellen Durchgang direkt bereitstellen. Wenn das begrenzte Verzeichnis Einträge auslässt, verwenden Sie `tool_search`, um sie zu finden. Wenn das Modell direkt den exakten Namen eines verborgenen Verzeichnis-Tools anfordert, lädt OpenClaw es vor der normalen Ausführung aus dem autorisierten Katalog.
Die Namen von Client-Tools im Verzeichnismodus dürfen nicht mit Namen von OpenClaw-, Plugin- oder MCP-Tools kollidieren, da die exakte verzögerte Weiterleitung diese Namen verwendet.

## Laufzeitgrenze

Die Codebrücke wird in einem kurzlebigen Node-Unterprozess ausgeführt. Der Unterprozess startet mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Datei- oder Netzwerkberechtigungen und ohne Berechtigungen für Kindprozesse oder Worker. OpenClaw erzwingt im übergeordneten Prozess eine Zeitüberschreitung nach verstrichener Echtzeit und beendet den Unterprozess bei Überschreitung, auch nach asynchronen Fortsetzungen.

Die Laufzeit stellt ausschließlich Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Für abschließende Aufrufe gilt weiterhin das normale OpenClaw-Verhalten:

- Richtlinien zum Zulassen und Verweigern von Tools
- Toolbeschränkungen pro Agent und pro Sandbox
- Toolrichtlinie für Kanal und Laufzeit
- Genehmigungs-Hooks
- Plugin-Hooks vom Typ `before_tool_call`
- Sitzungsidentität, Protokolle und Telemetrie

## Konfiguration

Aktivieren Sie Tool Search für OpenClaw-Läufe mit der standardmäßigen Codebrücke:

```bash
openclaw config set tools.toolSearch true
```

Entsprechendes JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Verwenden Sie stattdessen die strukturierten Ausweich-Tools für OpenClaw-Läufe:

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

Passen Sie die Zeitüberschreitung des Codemodus und die Grenzwerte für Suchergebnisse an. Die dargestellten Werte sind die Standardwerte:

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

Die Laufzeit begrenzt `codeTimeoutMs` auf 1000–60000, `maxSearchLimit` auf 1–50 und `searchDefaultLimit` auf 1 bis `maxSearchLimit`.

Deaktivieren:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt und Telemetrie

Tool Search zeichnet genügend Telemetriedaten auf, um einen Vergleich mit der direkten Toolbereitstellung zu ermöglichen:

- Gesamtzahl der serialisierten Tool- und Prompt-Bytes, die an die Testumgebung gesendet wurden
- Kataloggröße und Aufschlüsselung nach Quellen
- Anzahl der Such-, Beschreibungs- und Aufrufvorgänge
- Abschließende Toolaufrufe, die über OpenClaw ausgeführt wurden
- IDs und Quellen der ausgewählten Tools

Anhand der Sitzungsprotokolle sollten sich folgende Fragen beantworten lassen:

- Wie viele Toolschemas das Modell vorab gesehen hat
- Wie viele Such- und Beschreibungsvorgänge es ausgeführt hat
- Welches abschließende Tool aufgerufen wurde
- Ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool stammte

## E2E-Validierung

Das Gateway-Szenario des QA Lab weist beide Pfade mit der OpenClaw-Laufzeit nach:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Es erstellt ein temporäres simuliertes Plugin mit einem großen Toolkatalog, startet den simulierten OpenAI-Provider und startet ein Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search. Anschließend vergleicht es die Anfrage-Nutzlasten des Providers und die Sitzungsprotokolle.

Die Regression weist Folgendes nach:

1. Der direkte Modus kann das Tool des simulierten Plugins aufrufen.
2. Tool Search kann dasselbe Tool des simulierten Plugins aufrufen.
3. Der direkte Modus stellt dem Provider die Schemas der Tools des simulierten Plugins direkt bereit.
4. Tool Search stellt ausschließlich die kompakte Brücke sowie alle ausschließlich direkt verfügbaren Tools bereit.
5. Die Anfrage-Nutzlast von Tool Search ist für den großen simulierten Katalog kleiner.
6. Die Sitzungsprotokolle zeigen die erwartete Anzahl von Toolaufrufen und die Telemetrie der über die Brücke ausgeführten Aufrufe.

## Fehlerverhalten

Tool Search sollte nach dem Prinzip „geschlossen bei Fehlern“ arbeiten:

- Wenn ein Tool nicht durch die effektive Richtlinie zugelassen ist, darf die Suche es nicht zurückgeben.
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, muss `tool_call` fehlschlagen.
- Wenn eine Richtlinie oder Genehmigung die Ausführung blockiert, muss das Aufrufergebnis diese Blockierung melden, statt sie zu umgehen.
- Wenn die Codebrücke keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder deaktivieren Sie Tool Search für diese Bereitstellung.

## Verwandte Themen

- [Tools und Plugins](/de/tools)
- [Multi-Agenten-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
