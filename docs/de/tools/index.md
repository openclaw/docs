---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'OpenClaw-Übersicht zu Tools und Plugins: was der Agent tun kann und wie er erweitert werden kann'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-25T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Mittel, mit denen der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet
und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw enthält eine Reihe von **integrierten Tools**, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills vermitteln dem Agenten wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und schrittweise Anleitungen für
    die effektive Nutzung von Tools. Skills befinden sich in Ihrem Workspace, in freigegebenen Ordnern
    oder werden innerhalb von Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Channels, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Abruf, Websuche und mehr. Einige Plugins sind **core** (werden mit
    OpenClaw ausgeliefert), andere sind **external** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne dass Plugins installiert werden müssen:

| Tool                                       | Was es tut                                                           | Seite                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec), [Exec-Freigaben](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analysen ausführen                           | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Im Web suchen, X-Posts durchsuchen, Seiteninhalt abrufen             | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Channels senden                                | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (present, eval, snapshot)                        |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und ansteuern                             |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                   | [Bildgenerierung](/de/tools/image-generation)                   |
| `music_generate`                           | Musikstücke generieren                                               | [Musikgenerierung](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                    | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Umwandlung                                 | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung              | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges Auslesen im `/status`-Stil und Modellüberschreibung pro Sitzung | [Sitzungs-Tools](/de/concepts/session-tool)                     |

Für Bildarbeit verwenden Sie `image` für die Analyse und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider verwenden möchten, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider verwenden möchten, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider verwenden möchten, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Auslese-Tool in der Sitzungsgruppe.
Es beantwortet Fragen im `/status`-Stil zur aktuellen Sitzung und kann
optional eine Modellüberschreibung pro Sitzung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es lückenhafte Token-/Cache-Zähler und das
aktive Runtime-Modell-Label aus dem neuesten Usage-Eintrag des Transkripts nachtragen.

`gateway` ist das Runtime-Tool nur für Eigentümer für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständiges Ersetzen der Konfiguration
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
veraltete Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — JSON-only-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Runtime mit fortsetzbaren Freigaben
- [Music Generation](/de/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — komprimiert verrauschte Tool-Ergebnisse von `exec` und `bash`

## Tool-Konfiguration

### Zulassungs- und Verweigerungslisten

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen kann. Verweigern hat immer Vorrang vor Zulassen.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt im geschlossenen Zustand fehl, wenn eine explizite Zulassungsliste zu keinen aufrufbaren Tools aufgelöst wird.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes Tool, Plugin oder gebündeltes MCP-Tool mit der
Zulassungsliste übereinstimmt, stoppt der Lauf vor dem Modellaufruf, anstatt als
reiner Textlauf fortzufahren, der Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` setzt eine Basis-Zulassungsliste, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es umfasst                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                               |

Die Profile `coding` und `messaging` erlauben außerdem konfigurierte Bundle-MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine Bundle-MCP-Tools.

### Tool-Gruppen

Verwenden Sie die Kurzformen `group:*` in Zulassungs-/Verweigerungslisten:

| Gruppe             | Tools                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                                |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (ohne Plugin-Tools)                                                       |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Recall-Ansicht zurück. Es entfernt
Thinking-Tags, Gerüst von `<relevant-memories>`, XML-Nutzlasten von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Gerüst, durchgesickerte ASCII-/Vollbreiten-Modell-Steuer-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text und wendet dann
Schwärzung/Kürzung sowie mögliche Platzhalter für übergroße Zeilen an, anstatt
als roher Transcript-Dump zu fungieren.

### Provider-spezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Tools für bestimmte Provider einzuschränken, ohne
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
