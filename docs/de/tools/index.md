---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Werkzeuge konfigurieren, zulassen oder ablehnen
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie Sie ihn erweitern'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-05-10T19:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Tools**.
Tools sind die Art, wie der Agent Dateien liest, Befehle ausführt, das Web durchsucht, Nachrichten
sendet und mit Geräten interagiert.

## Tools, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Tools sind das, was der Agent aufruft">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Tools** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Tools als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen, um
    Tools effektiv zu verwenden. Skills befinden sich in Ihrem Arbeitsbereich, in freigegebenen Ordnern
    oder werden innerhalb von Plugins ausgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das jede Kombination von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Tools, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Videogenerierung,
    Web Fetch, Websuche und mehr. Einige Plugins sind **Core** (mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Tools

Diese Tools werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Tool                                       | Was es tut                                                           | Seite                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten               | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                            | [Codeausführung](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)     | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Posts durchsuchen, Seiteninhalte abrufen      | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Arbeitsbereich                                          |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                     | [Patch anwenden](/de/tools/apply-patch)                         |
| `message`                                  | Nachrichten über alle Kanäle senden                                  | [Agent senden](/de/tools/agent-send)                            |
| `nodes`                                    | Gekoppelte Geräte erkennen und als Ziel auswählen                    |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; den Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                   | [Bildgenerierung](/de/tools/image-generation)                   |
| `music_generate`                           | Musikstücke generieren                                               | [Musikgenerierung](/de/tools/music-generation)                  |
| `video_generate`                           | Videos generieren                                                    | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                              | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung              | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtige `/status`-ähnliche Rückmeldung und Überschreibung des Sitzungsmodells | [Sitzungs-Tools](/de/concepts/session-tool)                     |

Für Bildarbeit verwenden Sie `image` für Analysen und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für workflow-gesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Rückmelde-Tool in der Sitzungsgruppe.
Es beantwortet `/status`-ähnliche Fragen zur aktuellen Sitzung und kann
optional eine Modellüberschreibung pro Sitzung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Laufzeitmodell-Beschriftung aus dem neuesten Transcript-Nutzungseintrag ergänzen.

`gateway` ist das nur für Besitzer vorgesehene Laufzeit-Tool für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbegrenzten Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständigen Konfigurationsersatz
- `update.run` für explizites Selbst-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Tool verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Einige Beispiele:

- [Canvas](/de/plugins/reference/canvas) — experimentelles gebündeltes Plugin für Node-Canvas-Steuerung und A2UI-Rendering
- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM-Aufgabe](/de/tools/llm-task) — JSON-only-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Laufzeit mit fortsetzbaren Genehmigungen
- [Musikgenerierung](/de/tools/music-generation) — gemeinsames `music_generate`-Tool mit workflow-gestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — kompakte verrauschte `exec`- und `bash`-Tool-Ergebnisse

Plugin-Tools werden weiterhin mit `api.registerTool(...)` erstellt und in der
Liste `contracts.tools` des Plugin-Manifests deklariert. OpenClaw erfasst den validierten
Tool-Deskriptor während der Erkennung und cached ihn nach Plugin-Quelle und Vertrag, sodass
spätere Tool-Planung das Laden der Plugin-Laufzeit überspringen kann. Die Tool-Ausführung lädt weiterhin
das besitzende Plugin und ruft die live registrierte Implementierung auf.

[Tool-Suche](/de/tools/tool-search) ist die kompakte Oberfläche
für große Kataloge. Statt jedes Schema von OpenClaw-, MCP- oder Client-Tools
in den Prompt zu legen, kann OpenClaw dem Modell eine isolierte Node-Laufzeit
mit `openclaw.tools.search`, `openclaw.tools.describe` und
`openclaw.tools.call` geben. Aufrufe fließen weiterhin zurück durch den Gateway, sodass Tool-
Richtlinien, Genehmigungen, Hooks und Sitzungslogs maßgeblich bleiben.

## Tool-Konfiguration

### Allow- und Deny-Listen

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Tools der Agent aufrufen kann. Deny gewinnt immer gegenüber Allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt geschlossen fehl, wenn eine explizite Allowlist zu keinen aufrufbaren Tools aufgelöst wird.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes, Plugin- oder gebündeltes MCP-Tool zur
Allowlist passt, stoppt der Lauf vor dem Modellaufruf, statt als
reiner Textlauf fortzufahren, der Tool-Ergebnisse halluzinieren könnte.

### Tool-Profile

`tools.profile` legt eine Basis-Allowlist fest, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es enthält                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle Core- und optionalen Plugin-Tools; uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` ist absichtlich schmal für kanalorientierte
Agenten. Es lässt breitere Befehls-/Steuerungs-Tools wie Dateisystem, Laufzeit,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff, und beschneiden Sie dann
den Zugriff bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichtgewichtige Web-Tools (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungs-Tool. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder einem agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für Exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Konfigurationsabschnitt ohne passende `alsoAllow`-Freigabe vorhanden ist.
</Note>

Die Profile `coding` und `messaging` erlauben außerdem konfigurierte gebündelte MCP-Tools
unter dem Plugin-Schlüssel `bundle-mcp`. Fügen Sie `tools.deny: ["bundle-mcp"]` hinzu, wenn Sie
möchten, dass ein Profil seine normalen integrierten Tools behält, aber alle konfigurierten MCP-Tools ausblendet.
Das Profil `minimal` enthält keine gebündelten MCP-Tools.

Beispiel (standardmäßig breiteste Tool-Oberfläche):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Tool-Gruppen

Verwenden Sie `group:*`-Kurzformen in Allow-/Deny-Listen:

| Gruppe             | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas, wenn das mitgelieferte Canvas-Plugin aktiviert ist                                       |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle integrierten OpenClaw-Tools (schließt Plugin-Tools aus)                                              |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Rückrufansicht zurück. Es entfernt
Thinking-Tags, `<relevant-memories>`-Gerüst, Tool-Call-XML-Nutzdaten im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
heruntergestufte Tool-Call-Strukturen, durchgesickerte ASCII-/Vollbreiten-Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML aus Assistant-Text, wendet dann
Schwärzung/Kürzung und mögliche Platzhalter für übergroße Zeilen an, anstatt
als reiner Transkript-Dump zu fungieren.

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
