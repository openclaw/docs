---
read_when:
    - Sie möchten verstehen, welche Werkzeuge OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Übersicht über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie Sie ihn erweitern'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-04-30T07:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Werkzeuge**.
Werkzeuge sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web browsed, Nachrichten
sendet und mit Geräten interagiert.

## Werkzeuge, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Werkzeuge sind das, was der Agent aufruft">
    Ein Werkzeug ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe von **integrierten Werkzeugen** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Werkzeuge als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills bringen dem Agenten bei, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt injiziert wird.
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen, um
    Werkzeuge effektiv zu verwenden. Skills befinden sich in Ihrem Workspace, in freigegebenen Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das eine beliebige Kombination von Funktionen registrieren kann:
    Kanäle, Modell-Provider, Werkzeuge, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bilderzeugung, Videoerzeugung,
    Web-Abruf, Web-Suche und mehr. Einige Plugins sind **Core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigenes Plugin erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Werkzeuge

Diese Werkzeuge werden mit OpenClaw ausgeliefert und sind ohne Installation von Plugins verfügbar:

| Werkzeug                                   | Funktion                                                              | Seite                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten                | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Remote-Python-Analyse in einer Sandbox ausführen                      | [Code-Ausführung](/de/tools/code-execution)                     |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)      | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Beiträge durchsuchen, Seiteninhalte abrufen    | [Web](/de/tools/web), [Web-Abruf](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-E/A im Workspace                                                |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                      | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle senden                                   | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (präsentieren, auswerten, Snapshot)               |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und gezielt ansprechen                     |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway inspizieren, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder erzeugen                                      | [Bilderzeugung](/de/tools/image-generation)                     |
| `music_generate`                           | Musiktitel erzeugen                                                   | [Musikerzeugung](/de/tools/music-generation)                    |
| `video_generate`                           | Videos erzeugen                                                       | [Videoerzeugung](/de/tools/video-generation)                    |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                               | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung               | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichte `/status`-ähnliche Rückmeldung und Modellüberschreibung pro Sitzung | [Sitzungswerkzeuge](/de/concepts/session-tool)                  |

Verwenden Sie für Bildarbeiten `image` zur Analyse und `image_generate` zur Erzeugung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Musikarbeiten `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Videoarbeiten `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für workflow-gesteuerte Audiogenerierung `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichte Status-/Rückmeldewerkzeug in der Sitzungsgruppe.
Es beantwortet `/status`-ähnliche Fragen zur aktuellen Sitzung und kann
optional eine Modellüberschreibung pro Sitzung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Runtime-Modellbezeichnung aus dem neuesten Transkript-Nutzungseintrag nachtragen.

`gateway` ist das nur für Owner bestimmte Runtime-Werkzeug für Gateway-Operationen:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Teilbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständigen Konfigurationsersatz
- `update.run` für explizites Selbst-Update + Neustart

Bevorzugen Sie für partielle Änderungen `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Werkzeug verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten exec-Pfade normalisiert.

### Von Plugins bereitgestellte Werkzeuge

Plugins können zusätzliche Werkzeuge registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — Nur-JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — Typisierte Workflow-Runtime mit fortsetzbaren Genehmigungen
- [Musikerzeugung](/de/tools/music-generation) — Gemeinsames Werkzeug `music_generate` mit workflow-gestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — Komprimiert verrauschte Werkzeugergebnisse von `exec` und `bash`

## Werkzeugkonfiguration

### Erlaubnis- und Sperrlisten

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Werkzeuge der Agent aufrufen kann. Sperren haben immer Vorrang vor Erlaubnissen.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw schlägt geschlossen fehl, wenn eine explizite Allowlist zu keinen aufrufbaren Werkzeugen führt.
Beispielsweise funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes Werkzeug, kein Plugin und kein gebündeltes MCP-Werkzeug zur
Allowlist passt, stoppt der Lauf vor dem Modellaufruf, anstatt als
reiner Textlauf fortzufahren, der Werkzeugergebnisse halluzinieren könnte.

### Werkzeugprofile

`tools.profile` setzt eine Basis-Allowlist, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Enthaltene Funktionen                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff; entspricht nicht gesetztem `tools.profile`                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` ist absichtlich eng für kanalorientierte
Agenten. Es lässt breitere Befehls-/Steuerungswerkzeuge wie Dateisystem, Runtime,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff und beschränken Sie
den Zugriff bei Bedarf anschließend mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichte Web-Werkzeuge (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungswerkzeug. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder pro Agent mit
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

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

Verwenden Sie `group:*`-Kurzformen in Erlaubnis-/Sperrlisten:

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

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Abrufansicht zurück. Es entfernt
Tags für Denkspuren, `<relevant-memories>`-Gerüste, Klartext-XML-Nutzlasten von Tool-Aufrufen
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke),
herabgestufte Tool-Aufrufgerüste, durchgesickerte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Aufruf-XML aus Assistententexten, wendet anschließend
Schwärzung/Kürzung und mögliche Platzhalter für übergroße Zeilen an, anstatt
als unverarbeiteter Transkript-Dump zu dienen.

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
