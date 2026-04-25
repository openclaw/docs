---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen eingebauten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie er erweitert werden kann'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-25T18:22:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browst, Nachrichten sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **eingebauten Tools** mit und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und schrittweise Anleitungen für
    die effektive Nutzung von Tools. Skills befinden sich in Ihrem Workspace, in gemeinsam genutzten Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Echtzeittranskription,
    Echtzeitstimme, Medienverständnis, Bilderzeugung, Videoerzeugung,
    Web Fetch, Websuche und mehr. Einige Plugins sind **core** (werden mit
    OpenClaw ausgeliefert), andere sind **external** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigene Plugins erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Eingebaute Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind ohne Installation von Plugins verfügbar:

| Tool                                       | Was es tut                                                           | Seite                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                            | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Im Web suchen, X-Posts durchsuchen, Seiteninhalte abrufen            | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                           | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (präsentieren, auswerten, Snapshot)              |                                                              |
| `nodes`                                    | Gepaarte Geräte entdecken und ansprechen                             |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder erzeugen                                     | [Image Generation](/de/tools/image-generation)                  |
| `music_generate`                           | Musikstücke erzeugen                                                 | [Music Generation](/de/tools/music-generation)                  |
| `video_generate`                           | Videos erzeugen                                                      | [Video Generation](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                              | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung              | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und sitzungsspezifische Modellüberschreibung | [Session-Tools](/de/concepts/session-tool)                      |

Für Bildarbeit verwenden Sie `image` zur Analyse und `image_generate` zur Erzeugung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansprechen, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansprechen, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansprechen, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für workflowgesteuerte Audioerzeugung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sitzungsgruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional eine sitzungsspezifische Modellüberschreibung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Laufzeit-Modellbezeichnung aus dem neuesten Nutzungs-Eintrag des Transkripts nachtragen.

`gateway` ist das nur für Eigentümer bestimmte Laufzeit-Tool für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsupdates mit Neustart
- `config.apply` nur für das Ersetzen der vollständigen Konfiguration
- `update.run` für explizites Selbst-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur dann, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Das Tool verweigert auch Änderungen an `tools.exec.ask` oder `tools.exec.security`;
alte `tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert.

### Plugin-bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — Nur-JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — Typisierte Workflow-Laufzeit mit fortsetzbaren Genehmigungen
- [Music Generation](/de/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — kompakte, verrauschte `exec`- und `bash`-Tool-Ergebnisse

## Tool-Konfiguration

### Allowlists und Denylists

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen darf. Deny gewinnt immer gegenüber Allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt geschlossen fehl, wenn eine explizite Allowlist zu keinen aufrufbaren Tools führt.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein eingebautes Tool, Plugin oder gebündeltes MCP-Tool zur Allowlist passt, wird der Lauf vor dem Modellaufruf gestoppt, statt als
Nur-Text-Lauf fortzusetzen, der Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es umfasst                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                          |
| `minimal`   | Nur `session_status`                                                                                                                                |

`coding` umfasst leichtgewichtige Web-Tools (`web_search`, `web_fetch`, `x_search`)
aber nicht das vollständige Browser-Steuerungstool. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern, daher fügen Sie es explizit mit
`tools.alsoAllow: ["browser"]` oder einer agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

Die Profile `coding` und `messaging` erlauben auch konfigurierte gebündelte MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen eingebauten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine gebündelten MCP-Tools.

### Tool-Gruppen

Verwenden Sie `group:*`-Kurzschreibweisen in Allow-/Deny-Listen:

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
| `group:openclaw`   | Alle eingebauten OpenClaw-Tools (schließt Plugin-Tools aus)                                              |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Recall-Ansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Gerüst, Klartext-Tool-Call-XML-
Payloads (einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Gerüst, durchgesickerte ASCII-/Full-Width-Modellsteuerungs-
Token und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text und wendet dann
Redaktion/Abschneidung sowie gegebenenfalls Platzhalter für übergroße Zeilen an, statt
als rohen Transkript-Dump zu fungieren.

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
