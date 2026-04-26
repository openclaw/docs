---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'OpenClaw-Überblick zu Tools und Plugins: was der Agent tun kann und wie er erweitert werden kann'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-26T11:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browst,
Nachrichten sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Tools** mit und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills bringen dem Agenten bei, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und schrittweise Anleitungen für
    die effektive Nutzung von Tools. Skills liegen in Ihrem Workspace, in gemeinsamen Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modellanbieter, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Abruf, Websuche und mehr. Manche Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigene erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind ohne Installation zusätzlicher Plugins verfügbar:

| Tool                                       | Funktion                                                              | Seite                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten                | [Exec](/de/tools/exec), [Exec-Freigaben](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                             | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)      | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Posts durchsuchen, Seiteninhalte abrufen       | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-E/A im Workspace                                                |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunk-Blöcken                               | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                            | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (present, eval, snapshot)                         |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und ansprechen                             |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                    | [Bildgenerierung](/de/tools/image-generation)                   |
| `music_generate`                           | Musikstücke generieren                                                | [Musikgenerierung](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                     | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Umwandlung                                  | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Orchestrierung von Unteragenten        | [Unteragenten](/de/tools/subagents)                             |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und sitzungsbezogene Modellüberschreibung | [Sitzungstools](/de/concepts/session-tool)                      |

Für Bildarbeit verwenden Sie `image` zur Analyse und `image_generate` zur Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bildanbieter verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musikanbieter verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Videoanbieter verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-to-Speech ist.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sitzungsgruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional eine sitzungsbezogene Modellüberschreibung setzen; `model=default` entfernt diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Laufzeitmodellbezeichnung aus dem neuesten Nutzungs-Eintrag des Transkripts nachtragen.

`gateway` ist das nur für Owner gedachte Laufzeit-Tool für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Teilbaum der Konfiguration vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für den vollständigen Ersatz der Konfiguration
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden
Sie `config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
veraltete Aliase `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und -Renderer
- [LLM Task](/de/tools/llm-task) — Nur-JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — Typisierte Workflow-Laufzeit mit wiederaufnehmbaren Freigaben
- [Musikgenerierung](/de/tools/music-generation) — Gemeinsames Tool `music_generate` mit workflowgestützten Anbietern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — Kompaktiert verrauschte Tool-Ergebnisse von `exec` und `bash`

## Tool-Konfiguration

### Zulassungs- und Sperrlisten

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen kann. `deny` hat immer Vorrang vor `allow`.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt standardmäßig fehl, wenn eine explizite Zulassungsliste zu keinen aufrufbaren Tools aufgelöst wird.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes Tool, Plugin oder gebündeltes MCP-Tool mit der
Zulassungsliste übereinstimmt, stoppt der Lauf vor dem Modellaufruf, anstatt als reiner Textlauf
fortzufahren, der Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` setzt eine Basis-Zulassungsliste, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Enthaltene Inhalte                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Nur `session_status`                                                                                                                              |

`coding` umfasst leichtgewichtige Web-Tools (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Tool zur Browsersteuerung. Browserautomatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder einem agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

Die Profile `coding` und `messaging` erlauben auch konfigurierte gebündelte MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools verbirgt.
Das Profil `minimal` umfasst keine gebündelten MCP-Tools.

### Tool-Gruppen

Verwenden Sie Kurzformen `group:*` in Zulassungs-/Sperrlisten:

| Gruppe             | Tools                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                             |
| `group:fs`         | read, write, edit, apply_patch                                                                           |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                |
| `group:web`        | web_search, x_search, web_fetch                                                                          |
| `group:ui`         | browser, canvas                                                                                          |
| `group:automation` | cron, gateway                                                                                            |
| `group:messaging`  | message                                                                                                  |
| `group:nodes`      | nodes                                                                                                    |
| `group:agents`     | agents_list                                                                                              |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                               |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (ohne Plugin-Tools)                                                     |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Recall-Ansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Scaffolding, Plain-Text-XML-Payloads von Tool-Calls
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Scaffolding, geleakte ASCII-/Full-Width-
Modellsteuerungstokens und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text und wendet dann
Schwärzung/Kürzung sowie gegebenenfalls Platzhalter für übergroße Zeilen an, anstatt
als roher Transkript-Dump zu dienen.

### Anbieterspezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Tools für bestimmte Anbieter einzuschränken, ohne
globale Standardwerte zu ändern:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
