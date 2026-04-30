---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Werkzeuge und -Plugins: Was der Agent kann und wie Sie ihn erweitern können'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-30T16:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art und Weise, wie der Agent Dateien liest, Befehle ausführt, im Web surft, Nachrichten sendet
und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe **integrierter Tools** aus, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt eingefügt wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitung für
    die effektive Nutzung von Tools. Skills befinden sich in Ihrem Workspace, in freigegebenen Ordnern
    oder werden innerhalb von Plugins ausgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das beliebige Kombinationen von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Webabruf, Websuche und mehr. Einige Plugins sind **Core** (mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Tool                                       | Was es tut                                                           | Seite                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandbox-basierte Remote-Python-Analyse ausführen                     | [Code-Ausführung](/de/tools/code-execution)                    |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Beiträge durchsuchen, Seiteninhalte abrufen   | [Web](/de/tools/web), [Webabruf](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Workspace                                               |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Patch anwenden](/de/tools/apply-patch)                        |
| `message`                                  | Nachrichten über alle Kanäle senden                                  | [Agentensendung](/de/tools/agent-send)                         |
| `canvas`                                   | Node Canvas steuern (präsentieren, auswerten, Snapshot)              |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und gezielt ansprechen                    |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                   | [Bildgenerierung](/de/tools/image-generation)                  |
| `music_generate`                           | Musikstücke generieren                                               | [Musikgenerierung](/de/tools/music-generation)                 |
| `video_generate`                           | Videos generieren                                                    | [Videogenerierung](/de/tools/video-generation)                 |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                              | [TTS](/de/tools/tts)                                           |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Orchestrierung von Sub-Agenten        | [Sub-Agenten](/de/tools/subagents)                             |
| `session_status`                           | Schlanke `/status`-ähnliche Rückmeldung und Sitzungsmodell-Override  | [Sitzungs-Tools](/de/concepts/session-tool)                    |

Verwenden Sie für Bildarbeiten `image` für Analysen und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Musikarbeiten `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Videoarbeiten `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider verwenden, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für workflowgesteuerte Audiogenerierung `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das schlanke Status-/Rückmeldungs-Tool in der Sitzungsgruppe.
Es beantwortet `/status`-ähnliche Fragen zur aktuellen Sitzung und kann
optional einen modellbezogenen Override pro Sitzung setzen; `model=default` löscht diesen
Override. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Runtime-Modellbezeichnung aus dem neuesten Transcript-Nutzungseintrag nachtragen.

`gateway` ist das nur Eigentümern vorbehaltene Runtime-Tool für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständige Konfigurationsersetzung
- `update.run` für explizites Selbst-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und danach `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM-Aufgabe](/de/tools/llm-task) — Nur-JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Runtime mit fortsetzbaren Genehmigungen
- [Musikgenerierung](/de/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — komprimiert verrauschte `exec`- und `bash`-Tool-Ergebnisse

## Tool-Konfiguration

### Erlaubnis- und Sperrlisten

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen kann. Sperren haben immer Vorrang vor Erlaubnissen.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt geschlossen fehl, wenn eine explizite Allowlist keine aufrufbaren Tools ergibt.
Beispielsweise funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes Tool, Plugin oder gebündeltes MCP-Tool zur
Allowlist passt, stoppt der Lauf vor dem Modellaufruf, statt als
reiner Textlauf fortzufahren, der Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` legt eine Basis-Allowlist fest, bevor `allow`/`deny` angewendet wird.
Override pro Agent: `agents.list[].tools.profile`.

| Profil      | Was enthalten ist                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff; identisch damit, `tools.profile` nicht zu setzen                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | nur `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` ist für kanalorientierte
Agenten absichtlich eng gefasst. Es lässt breitere Befehls-/Steuerungs-Tools wie Dateisystem, Runtime,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff und beschneiden Sie dann
den Zugriff bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält schlanke Web-Tools (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungstool. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern; fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder einem agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für Exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Konfigurationsabschnitt ohne passende `alsoAllow`-Freigabe vorhanden ist.
</Note>

Die Profile `coding` und `messaging` erlauben außerdem konfigurierte Bundle-MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine Bundle-MCP-Tools.

Beispiel (standardmäßig breiteste Tool-Oberfläche):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Tool-Gruppen

Verwenden Sie `group:*`-Kurzformen in Erlaubnis-/Sperrlisten:

| Gruppe             | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                              |
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
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (schließt Plugin-Tools aus)                                             |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Abrufansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Gerüst, Klartext-XML-Nutzlasten von Tool-Aufrufen
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittene Tool-Aufruf-Blöcke),
herabgestuftes Tool-Aufruf-Gerüst, offengelegte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Aufruf-XML aus Assistant-Text, wendet danach
Schwärzung/Kürzung und mögliche Platzhalter für übergroße Zeilen an, statt als
roher Transcript-Dump zu fungieren.

### Provider-spezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Tools für bestimmte Provider einzuschränken, ohne
die globalen Standardwerte zu ändern:

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
