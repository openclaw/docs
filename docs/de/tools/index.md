---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, erlauben oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie Sie ihn erweitern'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-06T03:12:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2371239316997b0fe389bfa2ec38404e1d3e177755ad81ff8035ac583d9adeb
    source_path: tools/index.md
    workflow: 15
---

# Tools und Plugins

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art und Weise, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Schichten, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Tools** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und schrittweise Anleitungen für die
    effektive Nutzung von Tools. Skills liegen in Ihrem Workspace, in gemeinsam genutzten Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills reference](/de/tools/skills) | [Creating skills](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Realtime-Transkription,
    Realtime-Voice, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Fetch, Web-Suche und mehr. Einige Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Ihr eigenes erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind ohne Installation von Plugins verfügbar:

| Tool                                       | Was es tut                                                           | Seite                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec)                         |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                            | [Code Execution](/de/tools/code-execution)     |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Posts durchsuchen, Seiteninhalte abrufen      | [Web](/de/tools/web)                           |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                             |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Apply Patch](/de/tools/apply-patch)           |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                           | [Agent Send](/de/tools/agent-send)             |
| `canvas`                                   | Node Canvas steuern (present, eval, snapshot)                        |                                             |
| `nodes`                                    | Gekoppelte Geräte erkennen und ansprechen                            |                                             |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                             |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                   | [Image Generation](/de/tools/image-generation) |
| `music_generate`                           | Musikstücke generieren                                               | [Music Generation](/tools/music-generation) |
| `video_generate`                           | Videos generieren                                                    | [Video Generation](/tools/video-generation) |
| `tts`                                      | Einmalige Text-zu-Sprache-Umwandlung                                 | [TTS](/de/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Orchestrierung von Sub-Agents         | [Sub-agents](/de/tools/subagents)              |
| `session_status`                           | Leichte Auslese im Stil von `/status` und modellbezogene Überschreibung pro Sitzung | [Session Tools](/de/concepts/session-tool)     |

Für Bildarbeit verwenden Sie `image` für Analysen und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansprechen, konfigurieren Sie zuerst Authentifizierung/API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansprechen, konfigurieren Sie zuerst Authentifizierung/API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansprechen, konfigurieren Sie zuerst Authentifizierung/API-Schlüssel dieses Providers.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichte Status-/Auslese-Tool in der Sessions-Gruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional eine modellbezogene Überschreibung pro Sitzung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und das
aktive Runtime-Modell-Label aus dem neuesten Usage-Eintrag des Transkripts ergänzen.

`gateway` ist das owner-only Runtime-Tool für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsupdates mit Neustart
- `config.apply` nur für den vollständigen Ersatz der Konfiguration
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur dann, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
veraltete Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Durch Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Lobster](/de/tools/lobster) — typisierte Workflow-Runtime mit wiederaufnehmbaren Genehmigungen
- [LLM Task](/de/tools/llm-task) — LLM-Schritt nur mit JSON für strukturierte Ausgabe
- [Music Generation](/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflowgestützten Providern
- [Diffs](/de/tools/diffs) — Diff-Betrachter und Renderer
- [OpenProse](/de/prose) — Markdown-zuerst-Workflow-Orchestrierung

## Tool-Konfiguration

### Erlaubnis- und Verweigerungslisten

Steuern Sie, welche Tools der Agent aufrufen kann, über `tools.allow` / `tools.deny` in der
Konfiguration. Verweigern hat immer Vorrang vor Erlauben.

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
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es umfasst                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Keine Einschränkung (entspricht nicht gesetzt)                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                      |
| `minimal`   | Nur `session_status`                                                                                                                            |

### Tool-Gruppen

Verwenden Sie Kurzformen `group:*` in Erlaubnis-/Verweigerungslisten:

| Gruppe             | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (schließt Plugin-Tools aus)                                              |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Recall-Ansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Gerüst, XML-Payloads von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Gerüst, durchgesickerte ASCII-/Vollbreiten-
Modell-Steuertokens und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text und wendet dann
Schwärzung/Kürzung sowie mögliche Platzhalter für übergroße Zeilen an, anstatt
als roher Transkript-Dump zu fungieren.

### Provider-spezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Tools für bestimmte Provider einzuschränken, ohne
globale Standardeinstellungen zu ändern:

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
