---
read_when:
    - Sie möchten verstehen, welche Werkzeuge OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'Überblick über OpenClaw-Tools und -Plugins: was der Agent tun kann und wie Sie ihn erweitern'
title: Tools und Plugins
x-i18n:
    generated_at: "2026-05-02T21:04:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Werkzeuge**.
Werkzeuge sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web surft, Nachrichten sendet und mit Geräten interagiert.

## Werkzeuge, Skills und Plugins

OpenClaw hat drei Ebenen, die zusammenarbeiten:

<Steps>
  <Step title="Werkzeuge sind das, was der Agent aufruft">
    Ein Werkzeug ist eine typisierte Funktion, die der Agent aufrufen kann (z. B. `exec`, `browser`,
    `web_search`, `message`). OpenClaw liefert eine Reihe **integrierter Werkzeuge** mit, und
    Plugins können zusätzliche registrieren.

    Der Agent sieht Werkzeuge als strukturierte Funktionsdefinitionen, die an die Modell-API gesendet werden.

  </Step>

  <Step title="Skills lehren den Agenten, wann und wie">
    Ein Skill ist eine Markdown-Datei (`SKILL.md`), die in den System-Prompt eingefügt wird.
    Skills geben dem Agenten Kontext, Einschränkungen und schrittweise Anleitung für den
    effektiven Einsatz von Werkzeugen. Skills befinden sich in Ihrem Workspace, in freigegebenen Ordnern
    oder werden in Plugins mitgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das jede Kombination von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Werkzeuge, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bilderzeugung, Videoerzeugung,
    Webabruf, Websuche und mehr. Einige Plugins sind **core** (werden mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigene Plugins erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Werkzeuge

Diese Werkzeuge werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Werkzeug                                   | Was es tut                                                          | Seite                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten              | [Exec](/de/tools/exec), [Exec Approvals](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                           | [Codeausführung](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)    | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Beiträge durchsuchen, Seiteninhalt abrufen   | [Web](/de/tools/web), [Web Fetch](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-E/A im Workspace                                              |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                    | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle senden                                 | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (präsentieren, auswerten, Snapshot)             |                                                              |
| `nodes`                                    | Gekoppelte Geräte ermitteln und ansprechen                          |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                  | [Bilderzeugung](/de/tools/image-generation)                     |
| `music_generate`                           | Musikspuren generieren                                              | [Musikerzeugung](/de/tools/music-generation)                    |
| `video_generate`                           | Videos generieren                                                   | [Videoerzeugung](/de/tools/video-generation)                    |
| `tts`                                      | Einmalige Text-zu-Sprache-Umwandlung                                | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Sub-Agent-Orchestrierung             | [Sub-Agents](/de/tools/subagents)                               |
| `session_status`                           | Leichtgewichtiges Readback im Stil von `/status` und Überschreiben des Sitzungsmodells | [Sitzungswerkzeuge](/de/concepts/session-tool)                  |

Für Bildarbeit verwenden Sie `image` für die Analyse und `image_generate` für die Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Musikarbeit verwenden Sie `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für Videoarbeit verwenden Sie `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Für workflowgesteuerte Audiogenerierung verwenden Sie `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Readback-Werkzeug in der Sitzungsgruppe.
Es beantwortet Fragen im Stil von `/status` zur aktuellen Sitzung und kann
optional eine Modellüberschreibung pro Sitzung setzen; `model=default` löscht diese
Überschreibung. Wie `/status` kann es spärliche Token-/Cache-Zähler und die
aktive Laufzeitmodell-Bezeichnung aus dem neuesten Transkript-Nutzungseintrag auffüllen.

`gateway` ist das nur für Owner bestimmte Laufzeitwerkzeug für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbegrenzten Konfigurations-Teilbaum vor Änderungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für den vollständigen Austausch der Konfiguration
- `update.run` für explizites Selbst-Update + Neustart

Für partielle Änderungen bevorzugen Sie `config.schema.lookup` und danach `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für weiterführende Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Werkzeug verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
ältere `tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Werkzeuge

Plugins können zusätzliche Werkzeuge registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — reiner JSON-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Laufzeit mit wiederaufnehmbaren Freigaben
- [Musikerzeugung](/de/tools/music-generation) — gemeinsames Werkzeug `music_generate` mit workflowgestützten Providern
- [OpenProse](/de/prose) — Markdown-zuerst-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — kompakte, rauschende Werkzeugergebnisse von `exec` und `bash`

Plugin-Werkzeuge werden weiterhin mit `api.registerTool(...)` erstellt und in
der Liste `contracts.tools` des Plugin-Manifests deklariert. OpenClaw erfasst den validierten
Werkzeugdeskriptor während der Discovery und cached ihn nach Plugin-Quelle und Vertrag, sodass
spätere Werkzeugplanung das Laden der Plugin-Laufzeit überspringen kann. Die Ausführung des Werkzeugs lädt weiterhin
das besitzende Plugin und ruft die live registrierte Implementierung auf.

## Werkzeugkonfiguration

### Zulassungs- und Sperrlisten

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Werkzeuge der Agent aufrufen kann. Sperren hat immer Vorrang vor Zulassen.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw verweigert standardmäßig, wenn eine explizite Allowlist zu keinen aufrufbaren Werkzeugen aufgelöst wird.
Zum Beispiel funktioniert `tools.allow: ["query_db"]` nur, wenn ein geladenes Plugin tatsächlich
`query_db` registriert. Wenn kein integriertes Werkzeug, Plugin oder gebündeltes MCP-Werkzeug zur
Allowlist passt, stoppt der Lauf vor dem Modellaufruf, statt als
nur-textlicher Lauf fortzufahren, der Werkzeugergebnisse halluzinieren könnte.

### Werkzeugprofile

`tools.profile` legt eine Basis-Allowlist fest, bevor `allow`/`deny` angewendet wird.
Überschreibung pro Agent: `agents.list[].tools.profile`.

| Profil      | Was es enthält                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff; entspricht einem nicht gesetzten `tools.profile`                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                          |
| `minimal`   | Nur `session_status`                                                                                                                                |

<Note>
`tools.profile: "messaging"` ist absichtlich eng für kanalorientierte
Agenten. Es lässt breitere Befehls-/Steuerungswerkzeuge wie Dateisystem, Laufzeit,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für breiteren Befehls-/Steuerungszugriff und reduzieren Sie dann
den Zugriff bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichtgewichtige Web-Werkzeuge (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungswerkzeug. Browserautomatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder pro Agent mit
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Konfigurationsabschnitt ohne passende `alsoAllow`-Freigabe vorhanden ist.
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

Verwenden Sie `group:*`-Kurzformen in Zulassungs-/Sperrlisten:

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
Denk-Tags, `<relevant-memories>`-Gerüste, Klartext-XML-Payloads von Tool-Aufrufen
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Aufruf-Blöcke),
herabgestufte Tool-Aufruf-Gerüste, durchgesickerte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Aufruf-XML aus Assistant-Text, wendet anschließend
Schwärzung/Kürzung und gegebenenfalls Platzhalter für übergroße Zeilen an, statt
als roher Transkript-Dump zu dienen.

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
