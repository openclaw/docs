---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Werkzeuge und Plugins: was der Agent kann und wie Sie ihn erweitern'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-05-07T13:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Werkzeuge**.
Werkzeuge sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten sendet
und mit Geräten interagiert.

## Werkzeuge, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Werkzeuge sind das, was der Agent aufruft">
    Ein Werkzeug ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Werkzeugen** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Werkzeuge als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt eingefügt wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen für
    den effektiven Einsatz von Werkzeugen. Skills befinden sich in Ihrem Workspace, in freigegebenen Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Werkzeuge, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web Fetch, Websuche und mehr. Einige Plugins sind **Kern-Plugins** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Werkzeuge

Diese Werkzeuge werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Werkzeug                                   | Funktion                                                              | Seite                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten                | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                             | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)      | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Im Web suchen, X-Beiträge durchsuchen, Seiteninhalte abrufen          | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                                |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                      | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle hinweg senden                            | [Agent Send](/de/tools/agent-send)                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und gezielt ansprechen                     |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                    | [Bildgenerierung](/de/tools/image-generation)                   |
| `music_generate`                           | Musiktracks generieren                                                | [Musikgenerierung](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                     | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                               | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung               | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges `/status`-ähnliches Readback und Modell-Override pro Sitzung | [Sitzungswerkzeuge](/de/concepts/session-tool)                  |

Für Bildarbeit verwenden Sie `image` für die Analyse und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider verwenden, konfigurieren Sie zuerst die Auth/API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider verwenden, konfigurieren Sie zuerst die Auth/API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider verwenden, konfigurieren Sie zuerst die Auth/API-Schlüssel dieses Providers.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-to-Speech ist.

`session_status` ist das leichtgewichtige Status-/Readback-Werkzeug in der Sitzungsgruppe.
Es beantwortet `/status`-ähnliche Fragen zur aktuellen Sitzung und kann
optional einen Modell-Override pro Sitzung setzen; `model=default` löscht diesen
Override. Wie `/status` kann es spärliche Token-/Cache-Zähler und das
aktive Runtime-Modell-Label aus dem neuesten Transcript-Nutzungseintrag nachtragen.

`gateway` ist das nur für Owner verfügbare Runtime-Werkzeug für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbezogenen Config-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Config-Snapshot + Hash
- `config.patch` für partielle Config-Aktualisierungen mit Neustart
- `config.apply` nur für den vollständigen Austausch der Config
- `update.run` für explizites Self-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und danach `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Config ersetzen.
Für umfassendere Config-Dokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Werkzeug weigert sich außerdem, `tools.exec.ask` oder `tools.exec.security` zu ändern;
alte `tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Werkzeuge

Plugins können zusätzliche Werkzeuge registrieren. Einige Beispiele:

- [Canvas](/de/plugins/reference/canvas) — experimentelles gebündeltes Plugin für Node-Canvas-Steuerung und A2UI-Rendering
- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — reiner JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Runtime mit fortsetzbaren Genehmigungen
- [Musikgenerierung](/de/tools/music-generation) — gemeinsames `music_generate`-Werkzeug mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — komprimiert verrauschte `exec`- und `bash`-Werkzeugergebnisse

Plugin-Werkzeuge werden weiterhin mit `api.registerTool(...)` erstellt und in
der `contracts.tools`-Liste des Plugin-Manifests deklariert. OpenClaw erfasst den validierten
Werkzeugdeskriptor während der Discovery und cached ihn nach Plugin-Quelle und Contract, sodass
spätere Werkzeugplanung das Laden der Plugin-Runtime überspringen kann. Die Werkzeugausführung lädt weiterhin
das besitzende Plugin und ruft die live registrierte Implementierung auf.

## Werkzeugkonfiguration

### Allow- und Deny-Listen

Steuern Sie über `tools.allow` / `tools.deny` in
der Config, welche Werkzeuge der Agent aufrufen kann. Deny gewinnt immer gegenüber Allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt geschlossen fehl, wenn eine explizite Allowlist zu keinen aufrufbaren Werkzeugen aufgelöst wird.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes, Plugin- oder gebündeltes MCP-Werkzeug der
Allowlist entspricht, stoppt der Lauf vor dem Modellaufruf, statt als
reiner Textlauf fortzufahren, der Werkzeugergebnisse halluzinieren könnte.

### Werkzeugprofile

`tools.profile` setzt eine Basis-Allowlist, bevor `allow`/`deny` angewendet wird.
Override pro Agent: `agents.list[].tools.profile`.

| Profil      | Enthaltene Werkzeuge                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle Kern- und optionalen Plugin-Werkzeuge; uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` ist absichtlich eng gefasst für kanalorientierte
Agenten. Es lässt breitere Befehls-/Steuerungswerkzeuge wie Dateisystem, Runtime,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff und begrenzen Sie dann
den Zugriff bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichtgewichtige Webwerkzeuge (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungswerkzeug. Browserautomatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder pro Agent mit
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für Exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Config-Abschnitt vorhanden ist, ohne dass eine passende `alsoAllow`-Freigabe existiert.
</Note>

Die Profile `coding` und `messaging` erlauben außerdem konfigurierte Bundle-MCP-Werkzeuge
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Werkzeuge behält, aber alle konfigurierten MCP-Werkzeuge ausblendet.
Das Profil `minimal` enthält keine Bundle-MCP-Werkzeuge.

Beispiel (standardmäßig breiteste Werkzeugoberfläche):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Werkzeuggruppen

Verwenden Sie `group:*`-Kurzformen in Allow-/Deny-Listen:

| Gruppe             | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas, wenn das gebündelte Canvas-Plugin aktiviert ist                                          |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (schließt Plugin-Tools aus)                                              |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Abrufansicht zurück. Es entfernt
Denk-Tags, `<relevant-memories>`-Gerüste, Tool-Aufruf-XML-Payloads im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und gekürzte Tool-Aufruf-Blöcke),
herabgestufte Tool-Aufruf-Gerüste, durchgesickerte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Aufruf-XML aus Assistant-Text, wendet anschließend
Schwärzung/Kürzung und mögliche Platzhalter für übergroße Zeilen an, statt
als Roh-Transkript-Dump zu fungieren.

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
