---
read_when:
    - Sie möchten, dass OpenClaw-Agenten einen umfangreichen Werkzeugkatalog verwenden, ohne jedes Werkzeugschema zum Prompt hinzuzufügen
    - Sie möchten OpenClaw-Tools, MCP-Tools und Client-Tools über eine einzige kompakte Laufzeitschnittstelle bereitstellen.
    - Sie implementieren oder debuggen die Tool-Erkennung für OpenClaw-Ausführungen
summary: 'Tool-Suche: Große OpenClaw-Toolkataloge kompakt über Suche, Beschreibung und Aufruf zugänglich machen'
title: Werkzeugsuche
x-i18n:
    generated_at: "2026-07-12T16:00:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search ist eine experimentelle Funktion der OpenClaw-Agentenlaufzeit. Sie bietet Agenten eine
kompakte Möglichkeit, große Tool-Kataloge zu durchsuchen und daraus Tools aufzurufen. Dies ist nützlich, wenn für die Ausführung
viele Tools verfügbar sind, das Modell aber voraussichtlich nur wenige davon benötigt.

Diese Seite dokumentiert OpenClaw Tool Search. Sie behandelt nicht die Codex-native
Tool-Suche oder die Oberfläche für dynamische Tools. Der Codex-native Codemodus, die Tool-Suche, verzögert bereitgestellte
dynamische Tools und verschachtelte Tool-Aufrufe sind stabile Oberflächen des Codex-Harness und
hängen nicht von `tools.toolSearch` ab.

Wenn Tool Search für OpenClaw-Ausführungen aktiviert ist, erhält das Modell standardmäßig ein Tool namens `tool_search_code`
sowie alle Direct-only-Tools, deren strukturierte Ergebnisse nicht über
die kompakte Bridge übertragen werden können. Das Code-Tool führt einen kurzen JavaScript-Block in einem isolierten
Node-Unterprozess mit einer `openclaw.tools`-Bridge aus:

```js
const hits = await openclaw.tools.search("GitHub-Issue erstellen");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Absturz beim Start",
  body: "Schritte zum Reproduzieren...",
});
```

Der Katalog kann katalogfähige OpenClaw-Tools, Plugin-Tools, MCP-
Tools und vom Client bereitgestellte Tools enthalten. Das Modell sieht nicht jedes katalogisierte Schema
im Voraus. Stattdessen durchsucht es kompakte Deskriptoren, ruft bei Bedarf für ein ausgewähltes
Tool das exakte Schema ab und ruft dieses Tool über OpenClaw auf.
Direct-only-Tools bleiben für das Modell sichtbar und werden dem Katalog nicht hinzugefügt.

Ausführungen im Codex-Harness erhalten diese experimentellen Steuerelemente von OpenClaw Tool Search
nicht. OpenClaw übergibt Produktfunktionen als dynamische Tools an Codex, und
Codex verwaltet den stabilen nativen Codemodus, die native Tool-Suche, verzögert bereitgestellte dynamische
Tools und verschachtelte Tool-Aufrufe.

## Ablauf eines Turns

Während der Planung erstellt der eingebettete OpenClaw-Runner den effektiven Katalog für die
Ausführung:

1. Die aktive Tool-Richtlinie für Agent, Profil, Sandbox und Sitzung auflösen.
2. Berechtigte OpenClaw- und Plugin-Tools auflisten.
3. Berechtigte MCP-Tools über die MCP-Laufzeit der Sitzung auflisten.
4. Berechtigte Client-Tools hinzufügen, die für die aktuelle Ausführung bereitgestellt wurden.
5. Direct-only-Tools für das Modell sichtbar halten und kompakte Deskriptoren für die
   verbleibenden katalogfähigen Tools indizieren.
6. Die OpenClaw-Code-Bridge, die strukturierten Fallback-Tools oder die
   kompakte Verzeichnisoberfläche zusammen mit diesen Direct-only-Tools bereitstellen.

Während der Ausführung kehrt jeder tatsächliche Tool-Aufruf zu OpenClaw zurück. Die isolierte Node-
Laufzeit enthält weder Plugin-Implementierungen noch MCP-Clientobjekte oder Geheimnisse.
`openclaw.tools.call(...)` überquert die Bridge zurück zum Gateway, wo weiterhin die
normalen Richtlinien-, Genehmigungs-, Hook-, Protokollierungs- und Ergebnisverarbeitungsmechanismen gelten.

## Modi

`tools.toolSearch` bietet drei dem Modell zugängliche Modi:

- `code`: stellt `tool_search_code`, die standardmäßige kompakte JavaScript-Bridge,
  zusammen mit Direct-only-Tools bereit.
- `tools`: stellt `tool_search`, `tool_describe` und `tool_call` als einfache
  strukturierte Tools für Provider bereit, die keinen Code erhalten sollen, zusammen mit
  Direct-only-Tools.
- `directory`: stellt `tool_search`, `tool_describe` und `tool_call` sowie ein
  begrenztes Prompt-Verzeichnis der verfügbaren Tool-Namen und -Beschreibungen für
  Provider bereit, die Tool-Namen sehen sollen, ohne jedes vollständige Schema zu erhalten. OpenClaw kann
  außerdem einen kleinen begrenzten Satz wahrscheinlicher oder erforderlicher Tool-Schemas direkt
  für den aktuellen Turn bereitstellen. Direct-only-Tools bleiben auch in diesem Modus sichtbar.

Alle Modi verwenden denselben richtliniengefilterten Katalog und den normalen OpenClaw-Ausführungspfad.
Tools mit `catalogMode: "direct-only"` bleiben außerhalb dieses Katalogs und
für das Modell sichtbar. Wenn die aktuelle Laufzeit den isolierten untergeordneten Node-Prozess für den Codemodus
nicht starten kann, weicht der standardmäßige Modus `code` vor der Katalog-
Compaction auf `tools` aus. Im Modus `directory` bleiben vom Client bereitgestellte Tools
für die aktuelle Ausführung direkt sichtbar, während OpenClaw-Tools, Plugin-Tools und MCP-Tools
hinter dem Verzeichniskatalog komprimiert werden können. Ein direkter Aufruf eines exakten verborgenen
Verzeichnisnamens wird vor der Ausführung aus demselben autorisierten Katalog hydratisiert.

Alle Modi sind experimentell. Bevorzugen Sie die direkte Bereitstellung von Tools für kleine OpenClaw-Tool-
Kataloge und die stabilen Codex-nativen Oberflächen für Ausführungen im Codex-Harness.

Es gibt keine separate Konfiguration für die Quellenauswahl. Wenn Tool Search aktiviert ist, enthält der
Katalog nach der normalen Richtlinienfilterung katalogfähige OpenClaw-, MCP- und Client-Tools;
Direct-only-Tools werden separat beibehalten.

## Zweck

Große Kataloge sind nützlich, aber aufwendig. Wenn jedes Tool-Schema an das Modell gesendet wird,
wird die Anfrage größer, die Planung langsamer und die Wahrscheinlichkeit einer versehentlichen Tool-
Auswahl steigt.

Tool Search verändert die Struktur:

- direkte Tools: Das Modell sieht jedes ausgewählte Schema vor dem ersten Token
- Codemodus von Tool Search: Das Modell sieht ein kompaktes Code-Tool, einen kurzen API-
  Vertrag und alle Direct-only-Tools
- Tool-Modus von Tool Search: Das Modell sieht drei kompakte strukturierte Fallback-
  Tools sowie alle Direct-only-Tools
- Verzeichnismodus von Tool Search: Das Modell sieht ein begrenztes Verzeichnis sowie
  Steuerelemente zum Suchen, Beschreiben und Aufrufen und einen kleinen begrenzten Satz wahrscheinlicher oder erforderlicher
  Schemas sowie alle Direct-only-Tools
- während des Turns: Das Modell kann die verbleibenden Schemas bei Bedarf laden

Die direkte Bereitstellung von Tools ist für kleine Kataloge weiterhin die richtige Standardeinstellung. Tool Search
eignet sich am besten, wenn eine Ausführung viele Tools sehen kann, insbesondere von MCP-Servern oder
vom Client bereitgestellte App-Tools.

## API

`openclaw.tools.search(query, options?)`

Durchsucht den effektiven Katalog der aktuellen Ausführung. Die Ergebnisse sind kompakt und können sicher
wieder in den Prompt-Kontext eingefügt werden.

```js
const hits = await openclaw.tools.search("Kalendertermin", { limit: 5 });
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
  summary: "Planung",
  start: "2026-05-09T14:00:00Z",
});
```

Der strukturierte Fallback-Modus stellt dieselben Vorgänge als Tools bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Der Verzeichnismodus stellt Folgendes bereit:

- `tool_search`
- `tool_describe`
- `tool_call`

Er hält außerdem vom Client bereitgestellte Tools und alle Direct-only-Tools direkt sichtbar
und kann einen kleinen begrenzten Satz wahrscheinlicher oder erforderlicher Schemas von Katalog-Tools
direkt für den aktuellen Turn bereitstellen. Wenn das begrenzte Verzeichnis Einträge auslässt, verwenden Sie
`tool_search`, um sie zu finden. Wenn das Modell direkt den exakten Namen eines verborgenen Verzeichnis-
Tools anfordert, hydratisiert OpenClaw es vor der normalen Ausführung aus dem autorisierten Katalog.
Die Namen von Client-Tools im Verzeichnismodus dürfen nicht mit Namen von OpenClaw-, Plugin- oder MCP-
Tools kollidieren, da die exakte verzögerte Weiterleitung diese Namen verwendet.

## Laufzeitgrenze

Die Code-Bridge wird in einem kurzlebigen Node-Unterprozess ausgeführt. Der Unterprozess startet
mit aktiviertem Node-Berechtigungsmodus, einer leeren Umgebung, ohne Dateisystem- oder
Netzwerkberechtigungen und ohne Berechtigungen für untergeordnete Prozesse oder Worker. OpenClaw erzwingt ein
Echtzeitlimit im übergeordneten Prozess und beendet den Unterprozess bei einer Zeitüberschreitung, auch
nach asynchronen Fortsetzungen.

Die Laufzeit stellt ausschließlich Folgendes bereit:

- `console.log`, `console.warn` und `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Für die endgültigen Aufrufe gilt weiterhin das normale OpenClaw-Verhalten:

- Richtlinien zum Zulassen und Verweigern von Tools
- Tool-Einschränkungen pro Agent und pro Sandbox
- Tool-Richtlinien für Kanal und Laufzeit
- Genehmigungs-Hooks
- Plugin-Hooks vom Typ `before_tool_call`
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

Verwenden Sie stattdessen die strukturierten Fallback-Tools für OpenClaw-Ausführungen:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Verwenden Sie stattdessen die kompakte Verzeichnisoberfläche für OpenClaw-Ausführungen:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Passen Sie das Zeitlimit des Codemodus und die Begrenzungen der Suchergebnisse an (die gezeigten Werte sind die Standardwerte):

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

Die Laufzeit begrenzt `codeTimeoutMs` auf 1000-60000, `maxSearchLimit` auf 1-50 und
`searchDefaultLimit` auf 1..`maxSearchLimit`.

Deaktivieren Sie Tool Search:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt und Telemetrie

Tool Search erfasst ausreichend Telemetrie, um einen Vergleich mit der direkten Bereitstellung von Tools zu ermöglichen:

- Gesamtzahl der serialisierten Tool- und Prompt-Bytes, die an das Harness gesendet wurden
- Kataloggröße und Aufschlüsselung nach Quellen
- Anzahl der Such-, Beschreibungs- und Aufrufvorgänge
- endgültige Tool-Aufrufe, die über OpenClaw ausgeführt wurden
- ausgewählte Tool-IDs und Quellen

Die Sitzungsprotokolle sollten die Beantwortung folgender Fragen ermöglichen:

- wie viele Tool-Schemas das Modell im Voraus gesehen hat
- wie viele Such- und Beschreibungsvorgänge es durchgeführt hat
- welches Tool letztendlich aufgerufen wurde
- ob das Ergebnis von OpenClaw, MCP oder einem Client-Tool stammt

## E2E-Validierung

Das Gateway-Szenario des QA Lab weist beide Pfade mit der OpenClaw-Laufzeit nach:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Es erstellt ein temporäres simuliertes Plugin mit einem großen Tool-Katalog, startet den simulierten
OpenAI-Provider und startet ein Gateway einmal im direkten Modus und einmal mit aktivierter Tool Search.
Anschließend vergleicht es die Anfrage-Nutzlasten des Providers und die Sitzungsprotokolle.

Die Regression weist Folgendes nach:

1. Der direkte Modus kann das Tool des simulierten Plugins aufrufen.
2. Tool Search kann dasselbe Tool des simulierten Plugins aufrufen.
3. Der direkte Modus stellt die Schemas des simulierten Plugin-Tools direkt für den Provider bereit.
4. Tool Search stellt nur die kompakte Bridge sowie alle Direct-only-Tools bereit.
5. Die Anfrage-Nutzlast von Tool Search ist für den großen simulierten Katalog kleiner.
6. Die Sitzungsprotokolle zeigen die erwartete Anzahl von Tool-Aufrufen und die Telemetrie der über die Bridge übertragenen Aufrufe.

## Fehlerverhalten

Tool Search sollte bei Fehlern den Zugriff verweigern:

- Wenn ein Tool nicht von der effektiven Richtlinie abgedeckt ist, darf die Suche es nicht zurückgeben.
- Wenn ein ausgewähltes Tool nicht mehr verfügbar ist, muss `tool_call` fehlschlagen.
- Wenn eine Richtlinie oder Genehmigung die Ausführung blockiert, muss das Aufrufergebnis diese
  Blockierung melden, anstatt sie zu umgehen.
- Wenn die Code-Bridge keine isolierte Laufzeit erstellen kann, verwenden Sie `mode: "tools"` oder
  deaktivieren Sie Tool Search für diese Bereitstellung.

## Verwandte Themen

- [Tools und Plugins](/de/tools)
- [Multi-Agenten-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools)
- [Exec-Tool](/de/tools/exec)
- [Einrichtung von ACP-Agenten](/de/tools/acp-agents-setup)
- [Plugins entwickeln](/de/plugins/building-plugins)
