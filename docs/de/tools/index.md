---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern.
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Übersicht über OpenClaw-Werkzeuge und Plugins: was der Agent kann und wie Sie ihn erweitern können'
title: Werkzeuge und Plugins
x-i18n:
    generated_at: "2026-05-03T21:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten
sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Tools** aus, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills bringen dem Agenten bei, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt eingefügt wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen zum
    effektiven Verwenden von Tools. Skills liegen in Ihrem Workspace, in freigegebenen Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das eine beliebige Kombination von Funktionen registrieren kann:
    Channels, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web-Abruf, Websuche und mehr. Einige Plugins sind **core** (werden mit
    OpenClaw ausgeliefert), andere sind **external** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind ohne Installation von Plugins verfügbar:

| Tool                                       | Was es tut                                                          | Seite                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten                       | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandbox-gestützte Remote-Python-Analyse ausführen                                  | [Code Execution](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot erstellen)              | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Beiträge durchsuchen, Seiteninhalte abrufen                    | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                             |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                               | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Channels senden                                     | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (present, eval, snapshot)                           |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und ansteuern                                    |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; das Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                            | [Bildgenerierung](/de/tools/image-generation)                  |
| `music_generate`                           | Musiktitel generieren                                                 | [Musikgenerierung](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                       | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                                    | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung               | [Sub-Agenten](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges `/status`-ähnliches Readback und Sitzungsmodell-Override       | [Sitzungs-Tools](/de/concepts/session-tool)                      |

Für Bildarbeit verwenden Sie `image` zur Analyse und `image_generate` zur Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Readback-Tool in der Sitzungsgruppe.
Es beantwortet `/status`-ähnliche Fragen zur aktuellen Sitzung und kann
optional ein Modell-Override pro Sitzung setzen; `model=default` entfernt dieses
Override. Wie `/status` kann es lückenhafte Token-/Cache-Zähler und die
aktive Laufzeit-Modellbezeichnung aus dem neuesten Transcript-Nutzungseintrag nachtragen.

`gateway` ist das nur für Owner vorgesehene Laufzeit-Tool für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für teilweise Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständigen Konfigurationsersatz
- `update.run` für explizites Self-Update + Neustart

Für teilweise Änderungen bevorzugen Sie `config.schema.lookup` und danach `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und -Renderer
- [LLM Task](/de/tools/llm-task) — JSON-only-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Laufzeit mit fortsetzbaren Genehmigungen
- [Musikgenerierung](/de/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — kompakte, rauschende `exec`- und `bash`-Tool-Ergebnisse

Plugin-Tools werden weiterhin mit `api.registerTool(...)` erstellt und in der
Liste `contracts.tools` des Plugin-Manifests deklariert. OpenClaw erfasst den validierten
Tool-Deskriptor während der Erkennung und cached ihn nach Plugin-Quelle und Vertrag, sodass
spätere Tool-Planung das Laden der Plugin-Laufzeit überspringen kann. Die Tool-Ausführung lädt weiterhin
das besitzende Plugin und ruft die live registrierte Implementierung auf.

## Tool-Konfiguration

### Allow- und Deny-Listen

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen kann. Deny hat immer Vorrang vor Allow.

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
`query_db` registriert. Wenn kein integriertes Tool, Plugin oder gebündeltes MCP-Tool zur
Allowlist passt, stoppt die Ausführung vor dem Modellaufruf, statt als
Nur-Text-Ausführung fortzufahren, die Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` legt eine Basis-Allowlist fest, bevor `allow`/`deny` angewendet wird.
Override pro Agent: `agents.list[].tools.profile`.

| Profil     | Was es enthält                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle Core- und optionalen Plugin-Tools; uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` ist absichtlich eng für channel-fokussierte
Agenten. Es lässt breitere Befehls-/Steuerungs-Tools wie Dateisystem, Laufzeit,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff und beschränken Sie dann
den Zugriff bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichtgewichtige Web-Tools (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungstool. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder einem agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für Exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Konfigurationsabschnitt vorhanden ist, ohne dass eine passende `alsoAllow`-Freigabe existiert.
</Note>

Die Profile `coding` und `messaging` erlauben auch konfigurierte Bundle-MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine Bundle-MCP-Tools.

Beispiel (standardmäßig die breiteste Tool-Oberfläche):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Tool-Gruppen

Verwenden Sie `group:*`-Kurzformen in Allow-/Deny-Listen:

| Gruppe             | Werkzeuge                                                                                                 |
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
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (ohne Plugin-Tools)                                                      |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Rückrufansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Gerüst, Klartext-XML-Nutzlasten von Tool-Aufrufen
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Aufruf-Blöcke),
herabgestuftes Tool-Aufruf-Gerüst, durchgesickerte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Aufruf-XML aus Assistant-Text, wendet anschließend
Redaktion/Kürzung sowie mögliche Platzhalter für übergroße Zeilen an, statt als
roher Transcript-Dump zu fungieren.

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
