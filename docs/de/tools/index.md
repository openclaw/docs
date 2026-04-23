---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und Plugins: was der Agent tun kann und wie er erweitert werden kann'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-23T06:36:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c32414dfa99969372e9b0c846305a1af1ffb18a282e6dfc8a6adabe3fab145a
    source_path: tools/index.md
    workflow: 15
---

# Tools und Plugins

Alles, was der Agent über das Erzeugen von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet
und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe **integrierter Tools** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills bringen dem Agenten bei, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen für die
    effektive Nutzung von Tools. Skills liegen in Ihrem Workspace, in gemeinsam genutzten Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins paketieren alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeitstimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Fetch, Web-Suche und mehr. Einige Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (werden von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigene erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Tool                                       | Funktion                                                           | Seite                                       |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------- |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten             | [Exec](/de/tools/exec)                         |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                          | [Code Execution](/de/tools/code-execution)     |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)   | [Browser](/de/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Im Web suchen, X-Posts durchsuchen, Seiteninhalt abrufen           | [Web](/de/tools/web)                           |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                             |                                             |
| `apply_patch`                              | Datei-Patches mit mehreren Hunk-Blöcken                            | [Apply Patch](/de/tools/apply-patch)           |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                         | [Agent Send](/de/tools/agent-send)             |
| `canvas`                                   | Node-Canvas steuern (present, eval, snapshot)                      |                                             |
| `nodes`                                    | Gepaarte Geräte erkennen und ansprechen                            |                                             |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                             |
| `image` / `image_generate`                 | Bilder analysieren oder erzeugen                                   | [Image Generation](/de/tools/image-generation) |
| `music_generate`                           | Musikstücke erzeugen                                               | [Music Generation](/de/tools/music-generation) |
| `video_generate`                           | Videos erzeugen                                                    | [Video Generation](/de/tools/video-generation) |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                            | [TTS](/de/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Subagent-Orchestrierung             | [Sub-agents](/de/tools/subagents)              |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und sitzungsweites Modell-Override | [Session Tools](/de/concepts/session-tool)     |

Für Bildarbeit verwenden Sie `image` für Analyse und `image_generate` für Erzeugung oder Bearbeitung. Wenn Sie auf `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider zielen, konfigurieren Sie zuerst die Authentifizierung/den API-Key dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie auf `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider zielen, konfigurieren Sie zuerst die Authentifizierung/den API-Key dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie auf `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider zielen, konfigurieren Sie zuerst die Authentifizierung/den API-Key dieses Providers.

Für workflowgetriebene Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sitzungsgruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional ein sitzungsweites Modell-Override setzen; `model=default` löscht dieses
Override. Wie `/status` kann es spärliche Token-/Cache-Zähler und das
aktive Laufzeitmodell-Label aus dem neuesten Nutzungseintrag des Transkripts auffüllen.

`gateway` ist das nur für Eigentümer verfügbare Laufzeit-Tool für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbezogenen Konfigurationsunterbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsupdates mit Neustart
- `config.apply` nur für das Ersetzen der vollständigen Konfiguration
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und danach `config.patch`. Verwenden Sie
`config.apply` nur dann, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
veraltete `tools.bash.*`-Aliasse werden auf dieselben geschützten `exec`-Pfade normalisiert.

### Plugin-bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — Nur-JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — Typisierte Workflow-Laufzeit mit fortsetzbaren Genehmigungen
- [Music Generation](/de/tools/music-generation) — gemeinsames Tool `music_generate` mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — kompakte Ergebnisse für verrauschte `exec`- und `bash`-Tools

## Tool-Konfiguration

### Zulassen- und Verweigern-Listen

Steuern Sie, welche Tools der Agent aufrufen kann, über `tools.allow` / `tools.deny` in der
Konfiguration. Verweigern hat immer Vorrang vor Zulassen.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist, bevor `allow`/`deny` angewendet wird.
Override pro Agent: `agents.list[].tools.profile`.

| Profil      | Was enthalten ist                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (entspricht nicht gesetzt)                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Nur `session_status`                                                                                                                              |

Die Profile `coding` und `messaging` erlauben auch konfigurierte gebündelte MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine gebündelten MCP-Tools.

### Tool-Gruppen

Verwenden Sie Kurzformen `group:*` in Zulassen-/Verweigern-Listen:

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
Thinking-Tags, Gerüst von `<relevant-memories>`, XML-
Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittenen Tool-Call-Blöcken),
herabgestuftes Tool-Call-Gerüst, geleakte ASCII-/Full-Width-
Modell-Steuertokens und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text, und wendet dann
Redaction/Kürzung sowie bei Bedarf Platzhalter für übergroße Zeilen an, statt
als Rohdump des Transkripts zu fungieren.

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
