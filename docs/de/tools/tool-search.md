---
read_when:
    - Sie möchten, dass OpenClaw-Agenten einen umfangreichen Werkzeugkatalog verwenden, ohne jedes Werkzeugschema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine einzige kompakte Runtime-Oberfläche bereitstellen
    - Sie implementieren oder debuggen die Tool-Erkennung für OpenClaw-Ausführungen
summary: 'Werkzeugsuche: Große OpenClaw-Werkzeugkataloge kompakt hinter Suche, Beschreibung und Aufruf bündeln'
title: Werkzeugsuche
x-i18n:
    generated_at: "2026-07-24T04:46:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d31322d5ef108c52fd14d48771cc3c6c43fcfbc4bfb95652bc29a55fd706c903
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search ist eine experimentelle Funktion der OpenClaw-Agent-Runtime. Sie bietet Agenten eine
kompakte Möglichkeit, große Tool-Kataloge zu durchsuchen und Tools daraus aufzurufen. Sie ist nützlich, wenn für die Ausführung
viele Tools verfügbar sind, das Modell davon aber wahrscheinlich nur wenige benötigt.

Diese Seite dokumentiert OpenClaw Tool Search. Sie beschreibt nicht die Codex-native
Toolsuche oder die Oberfläche für dynamische Tools. Codex-nativer Codemodus, Toolsuche, verzögert bereitgestellte
dynamische Tools und verschachtelte Tool-Aufrufe sind stabile Oberflächen des Codex-Harness und
hängen nicht von `tools.toolSearch` ab.

Informationen zur generischen OpenClaw-Runtime, die statt Tool-Search-Steuerelementen eine QuickJS-WASI-Oberfläche für `exec`/`wait`
bereitstellt, finden Sie unter [Codemodus](/tools/code-mode).

Wenn die Funktion für OpenClaw-Ausführungen aktiviert ist, erhält das Modell standardmäßig ein `tool_search_code`-Tool
sowie alle ausschließlich direkten Tools, deren strukturierte Ergebnisse die
kompakte Bridge nicht passieren können. Das Code-Tool führt einen kurzen JavaScript-Block in einem isolierten
Node-Unterprozess mit einer `openclaw.tools`-Bridge aus:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Der Katalog kann katalogfähige OpenClaw-Tools, Plugin-Tools, MCP-
Tools und vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht jedes katalogisierte Schema
von Anfang an. Stattdessen durchsucht es kompakte Deskriptoren, ruft bei Bedarf das exakte Schema
eines ausgewählten Tools ab und ruft dieses Tool über OpenClaw auf.
Ausschließlich direkte Tools bleiben für das Modell sichtbar und werden dem Katalog nicht hinzugefügt.

Ausführungen im Codex-Harness erhalten diese experimentellen OpenClaw-Tool-Search-
Steuerelemente nicht. OpenClaw übergibt Produktfunktionen als dynamische Tools an Codex, während
Codex den stabilen nativen Codemodus, die native Toolsuche, verzögert bereitgestellte dynamische
Tools und verschachtelte Tool-Aufrufe verwaltet.

## Ablauf eines Durchgangs

Während der Planung erstellt der eingebettete OpenClaw-Runner den effektiven Katalog für die
Ausführung:

1. Die aktive Tool-Richtlinie für Agent, Profil, Sandbox und Sitzung auflösen.
2. Berechtigte OpenClaw- und Plugin-Tools auflisten.
3. Berechtigte MCP-Tools über die MCP-Runtime der Sitzung auflisten.
4. Berechtigte, für die aktuelle Ausführung bereitgestellte Client-Tools hinzufügen.
5. Ausschließlich direkte Tools für das Modell sichtbar halten und kompakte Deskriptoren für die
   verbleibenden katalogfähigen Tools indizieren.
6. Die OpenClaw-Code-Bridge, die strukturierten Fallback-Tools oder die
   kompakte Verzeichnisoberfläche zusammen mit diesen ausschließlich direkten Tools bereitstellen.

Während der Ausführung kehrt jeder tatsächliche Tool-Aufruf zu OpenClaw zurück. Die isolierte Node-
Runtime enthält weder Plugin-Implementierungen noch MCP-Clientobjekte oder Secrets.
`openclaw.tools.call(...)` passiert die Bridge zurück zum Gateway, wo weiterhin die
normalen Richtlinien sowie Genehmigungs-, Hook-, Protokollierungs- und Ergebnisverarbeitung gelten.

## Modi

`tools.toolSearch` verfügt über drei dem Modell bereitgestellte Modi:

- `code`: stellt `tool_search_code`, die standardmäßige kompakte JavaScript-Bridge,
  zusammen mit ausschließlich direkten Tools bereit.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache
  strukturierte Tools für Provider bereit, die keinen Code erhalten sollen, zusammen mit
  ausschließlich direkten Tools.
- `directory`: stellt `tool_search`, `tool_describe` und `tool_call` sowie ein
  begrenztes Prompt-Verzeichnis der verfügbaren Tool-Namen und -Beschreibungen für
  Provider bereit, die Tool-Namen ohne jedes vollständige Schema sehen sollen. OpenClaw kann
  außerdem eine kleine begrenzte Menge wahrscheinlicher oder erforderlicher Tool-Schemas
  für den aktuellen Durchgang direkt bereitstellen. Ausschließlich direkte Tools bleiben auch in diesem Modus sichtbar.

Alle Modi verwenden denselben durch Richtlinien gefilterten Katalog und den normalen OpenClaw-Ausführungspfad.
Als `catalogMode: "direct-only"` gekennzeichnete Tools bleiben außerhalb dieses Katalogs und
für das Modell sichtbar. Wenn die aktuelle Runtime den isolierten Node-Unterprozess für den Codemodus nicht starten kann,
wechselt der standardmäßige `code`-Modus vor der Katalogkomprimierung auf `tools`. Im
`directory`-Modus bleiben vom Client bereitgestellte Tools für die aktuelle Ausführung direkt sichtbar,
während OpenClaw-Tools, Plugin-Tools und MCP-Tools hinter dem Verzeichniskatalog
komprimiert werden können. Ein direkter Aufruf eines exakten verborgenen
Verzeichnisnamens wird vor der Ausführung aus demselben autorisierten Katalog geladen.

Alle Modi sind experimentell. Bevorzugen Sie für kleine OpenClaw-Tool-
Kataloge die direkte Tool-Bereitstellung und für Ausführungen im Codex-Harness die stabilen Codex-nativen Oberflächen.

Es gibt keine separate Konfiguration zur Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der
Katalog nach der normalen Richtlinienfilterung katalogfähige OpenClaw-, MCP- und Client-Tools;
ausschließlich direkte Tools werden separat beibehalten.

## Zweck

Große Kataloge sind nützlich, aber aufwendig. Wenn jedes Tool-Schema an das Modell gesendet wird,
wird die Anfrage größer, die Planung langsamer und die Wahrscheinlichkeit einer versehentlichen Tool-
Auswahl höher.

Tool Search ändert die Struktur:

- Direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token.
- Tool-Search-Codemodus: Das Modell sieht ein kompaktes Code-Tool, einen kurzen API-
  Vertrag und alle ausschließlich direkten Tools.
- Tool-Search-Toolmodus: Das Modell sieht drei kompakte strukturierte Fallback-
  Tools sowie alle ausschließlich direkten Tools.
- Tool-Search-Verzeichnismodus: Das Modell sieht ein begrenztes Verzeichnis sowie
  Steuerelemente zum Suchen, Beschreiben und Aufrufen und eine kleine begrenzte Menge wahrscheinlicher oder erforderlicher
  Schemas sowie alle ausschließlich direkten Tools.
- Während des Durchgangs: Das Modell kann die verbleibenden Schemas nach Bedarf laden.

Die direkte Tool-Bereitstellung bleibt die richtige Standardeinstellung für kleine Kataloge. Tool Search
eignet sich am besten, wenn eine Ausführung auf viele Tools zugreifen kann, insbesondere von MCP-Servern oder
vom Client bereitgestellten App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog für die aktuelle Ausführung. Die Ergebnisse sind kompakt und können sicher
wieder in den Prompt-Kontext eingefügt werden. Jeder Treffer enthält eine begrenzte TypeScript-artige
`input`-Signatur, beispielsweise `{ id: string; mode?: "drip" | "flood" }`, sodass das
Modell `describe` überspringen kann, wenn diese Signatur ausreicht. Ein vertrauenswürdiges
OpenClaw-Core- oder Plugin-Tool kann außerdem einen kompakten `output`-Hinweis enthalten, beispielsweise
`Array<{ id: string; paid: boolean }>`. Angaben zu Ausgabeschemas von MCP und Clients werden
nicht in diesen vertrauenswürdigen Hinweis übernommen. Deren nicht vertrauenswürdige Eingabeschemas werden außerdem
als `input: "unknown"` verzögert bereitgestellt; verwenden Sie vor dem Aufruf `describe`. Bei offenen,
übermäßig großen oder anderweitig unvollständigen Ausgabeschemas wird der Hinweis weggelassen; sie bleiben
stattdessen über `describe` verfügbar.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Lädt die vollständigen Metadaten für ein Suchergebnis, einschließlich des exakten Eingabeschemas und
des vertrauenswürdigen vollständigen `outputSchema`, sofern das Tool eines deklariert.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Ruft ein ausgewähltes Tool über OpenClaw auf und gibt den unverarbeiteten `{ tool, result }`-
Umschlag zurück. Tools, die JSON zurückgeben, legen ihren Wert normalerweise in
`result.details` ab. Wenn ein vertrauenswürdiges Tool `outputSchema` deklariert, kompiliert OpenClaw
das Schema vor der Ausführung und validiert den endgültigen Wert von `details` nach den normalen Tool-
Hooks, bevor der Katalogaufruf zurückgegeben wird.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Tool-Autoren deklarieren Ausgabeverträge in der Eigenschaft `outputSchema` des Tools.
Sie beschreibt `AgentToolResult.details`, nicht gerenderte Inhaltsblöcke. Schließen Sie
alle Varianten ein, die keine Ausnahme auslösen, oder lassen Sie die Eigenschaft bei instabilen Ergebnissen weg. Siehe
[Ausgabeverträge des Codemodus](/tools/code-mode#declared-output-contracts) und
[Tool-Plugins](/de/plugins/tool-plugins#output-contracts).

Der strukturierte Fallback-Modus stellt dieselben Operationen als Tools bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Der Verzeichnismodus stellt Folgendes bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Er hält außerdem vom Client bereitgestellte Tools und alle ausschließlich direkten Tools direkt sichtbar
und kann eine kleine begrenzte Menge wahrscheinlicher oder erforderlicher Schemas von Katalog-Tools
für den aktuellen Durchgang direkt bereitstellen. Wenn das begrenzte Verzeichnis Einträge auslässt, verwenden Sie
`tool_search`, um sie zu finden. Wenn das Modell direkt den exakten Namen eines verborgenen Verzeichnis-
Tools anfordert, lädt OpenClaw es vor der normalen Ausführung aus dem autorisierten Katalog.
Die Namen von Client-Tools im Verzeichnismodus dürfen nicht mit Namen von OpenClaw-, Plugin- oder MCP-
Tools kollidieren, da die exakte verzögerte Weiterleitung diese Namen verwendet.

## Runtime-Grenze

Die Code-Bridge wird in einem kurzlebigen Node-Unterprozess ausgeführt. Der Unterprozess startet
mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder
Netzwerkberechtigungen und ohne Berechtigungen für untergeordnete Prozesse oder Worker. OpenClaw erzwingt ein
Zeitlimit der verstrichenen Zeit im übergeordneten Prozess und beendet den Unterprozess bei einer Zeitüberschreitung, auch
nach asynchronen Fortsetzungen.

Die Runtime stellt nur Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Das normale OpenClaw-Verhalten gilt weiterhin für endgültige Aufrufe:

- Richtlinien zum Zulassen und Ablehnen von Tools
- Tool-Einschränkungen pro Agent und Sandbox
- Tool-Richtlinie für Kanal und Runtime
- Genehmigungs-Hooks
- Plugin-Hooks für `before_tool_call`
- Sitzungsidentität, Protokolle und Telemetrie

## Konfiguration

Aktivieren Sie Tool Search für OpenClaw-Ausführungen mit der standardmäßigen Code-Bridge:

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

Verwenden Sie für OpenClaw-Ausführungen stattdessen die strukturierten Fallback-Tools:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Verwenden Sie für OpenClaw-Ausführungen stattdessen die kompakte Verzeichnisoberfläche:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Passen Sie das Zeitlimit des Codemodus und die Grenzwerte für Suchergebnisse an (die gezeigten Werte sind die Standardwerte):

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

Die Runtime begrenzt `codeTimeoutMs` auf 1000-60000, `maxSearchLimit` auf 1-50 und
`searchDefaultLimit` auf 1..`maxSearchLimit`.

Deaktivieren:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt und Telemetrie

Tool Search erfasst genügend Telemetriedaten, um die Funktion mit der direkten Tool-Bereitstellung zu vergleichen:

- Gesamtzahl der serialisierten Tool- und Prompt-Bytes, die an das Harness gesendet werden
- Kataloggröße und Aufschlüsselung nach Quellen
- Anzahl der Such-, Beschreibungs- und Aufrufvorgänge
- Über OpenClaw ausgeführte endgültige Tool-Aufrufe
- IDs und Quellen der ausgewählten Tools

Anhand der Sitzungsprotokolle sollte Folgendes ermittelt werden können:

- Wie viele Tool-Schemas das Modell von Anfang an gesehen hat
- Wie viele Such- und Beschreibungsvorgänge es ausgeführt hat
- Welches endgültige Tool aufgerufen wurde
- Ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool stammt

## E2E-Validierung

Das Gateway-Szenario im QA Lab weist beide Pfade mit der OpenClaw-Runtime nach:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Es erstellt ein temporäres simuliertes Plugin mit einem großen Tool-Katalog, startet den simulierten
OpenAI-Provider, startet ein Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search
und vergleicht anschließend die Anfrage-Payloads des Providers und die Sitzungsprotokolle.

Der Regressionstest weist Folgendes nach:

1. Der Direktmodus kann das simulierte Plugin-Tool aufrufen.
2. Tool Search kann dasselbe simulierte Plugin-Tool aufrufen.
3. Der Direktmodus stellt dem Provider die Schemas des simulierten Plugin-Tools direkt bereit.
4. Tool Search stellt nur die kompakte Bridge sowie alle ausschließlich direkt verfügbaren Tools bereit.
5. Die Anfragenutzlast von Tool Search ist für den großen simulierten Katalog kleiner.
6. Die Sitzungsprotokolle zeigen die erwartete Anzahl von Tool-Aufrufen und die Telemetrie der über die Bridge ausgeführten Aufrufe.

## Fehlerverhalten

Tool Search sollte nach dem Fail-Closed-Prinzip vorgehen:

- Wenn ein Tool nicht in der wirksamen Richtlinie enthalten ist, sollte die Suche es nicht zurückgeben.
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, sollte `tool_call` fehlschlagen.
- Wenn eine Richtlinie oder Genehmigung die Ausführung blockiert, sollte das Aufrufergebnis diese
  Blockierung melden, statt sie zu umgehen.
- Wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder
  deaktivieren Sie Tool Search für diese Bereitstellung.

## Verwandte Themen

- [Tools und Plugins](/de/tools)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
