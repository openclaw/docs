---
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie müssen Tools konfigurieren, zulassen oder verweigern
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
summary: 'OpenClaw-Tools und Plugins im Überblick: was der Agent tun kann und wie Sie ihn erweitern können'
title: Werkzeuge und Plugins
x-i18n:
    generated_at: "2026-05-06T07:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

Alles, was der Agent über das Generieren von Text hinaus tut, geschieht über **Werkzeuge**.
Werkzeuge sind die Art, wie der Agent Dateien liest, Befehle ausführt, im Web surft, Nachrichten
sendet und mit Geräten interagiert.

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
    Skills geben dem Agenten Kontext, Einschränkungen und Schritt-für-Schritt-Anleitungen, um
    Werkzeuge effektiv zu verwenden. Skills befinden sich in Ihrem Arbeitsbereich, in freigegebenen Ordnern
    oder werden innerhalb von Plugins ausgeliefert.

    [Skills-Referenz](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills)

  </Step>

  <Step title="Plugins bündeln alles zusammen">
    Ein Plugin ist ein Paket, das jede Kombination von Fähigkeiten registrieren kann:
    Kanäle, Modell-Provider, Werkzeuge, Skills, Sprache, Echtzeit-Transkription,
    Echtzeit-Stimme, Medienverständnis, Bilderzeugung, Videogenerierung,
    Web-Abruf, Websuche und mehr. Einige Plugins sind **Core**-Plugins (mit
    OpenClaw ausgeliefert), andere sind **extern** (von der Community auf npm veröffentlicht).

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Eigene Plugins erstellen](/de/plugins/building-plugins)

  </Step>
</Steps>

## Integrierte Werkzeuge

Diese Werkzeuge werden mit OpenClaw ausgeliefert und sind verfügbar, ohne Plugins zu installieren:

| Werkzeug                                   | Funktion                                                              | Seite                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell-Befehle ausführen, Hintergrundprozesse verwalten                | [Exec](/de/tools/exec), [Exec-Genehmigungen](/de/tools/exec-approvals) |
| `code_execution`                           | Sandboxed Remote-Python-Analyse ausführen                             | [Codeausführung](/de/tools/code-execution)                      |
| `browser`                                  | Einen Chromium-Browser steuern (navigieren, klicken, Screenshot)      | [Browser](/de/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Das Web durchsuchen, X-Beiträge durchsuchen, Seiteninhalte abrufen    | [Web](/de/tools/web), [Web-Abruf](/de/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Datei-I/O im Arbeitsbereich                                           |                                                              |
| `apply_patch`                              | Datei-Patches mit mehreren Hunks                                      | [Apply Patch](/de/tools/apply-patch)                            |
| `message`                                  | Nachrichten über alle Kanäle senden                                   | [Agent Send](/de/tools/agent-send)                              |
| `canvas`                                   | Node Canvas steuern (präsentieren, auswerten, Snapshot)               |                                                              |
| `nodes`                                    | Gekoppelte Geräte erkennen und ansteuern                              |                                                              |
| `cron` / `gateway`                         | Geplante Jobs verwalten; Gateway prüfen, patchen, neu starten oder aktualisieren |                                                              |
| `image` / `image_generate`                 | Bilder analysieren oder generieren                                    | [Bilderzeugung](/de/tools/image-generation)                     |
| `music_generate`                           | Musiktracks generieren                                                | [Musikerzeugung](/de/tools/music-generation)                    |
| `video_generate`                           | Videos generieren                                                     | [Videogenerierung](/de/tools/video-generation)                  |
| `tts`                                      | Einmalige Text-zu-Sprache-Konvertierung                               | [TTS](/de/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Sitzungsverwaltung, Status und Orchestrierung von Sub-Agenten         | [Sub-Agenten](/de/tools/subagents)                              |
| `session_status`                           | Leichtgewichtige `/status`-artige Rückmeldung und Sitzungsmodell-Override | [Sitzungswerkzeuge](/de/concepts/session-tool)                  |

Verwenden Sie für Bildarbeit `image` zur Analyse und `image_generate` für Generierung oder Bearbeitung. Wenn Sie `openai/*`, `google/*`, `fal/*` oder einen anderen nicht standardmäßigen Bild-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Musikarbeit `music_generate`. Wenn Sie `google/*`, `minimax/*` oder einen anderen nicht standardmäßigen Musik-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für Videoarbeit `video_generate`. Wenn Sie `qwen/*` oder einen anderen nicht standardmäßigen Video-Provider ansteuern, konfigurieren Sie zuerst die Authentifizierung bzw. den API-Schlüssel dieses Providers.

Verwenden Sie für workflow-gesteuerte Audiogenerierung `music_generate`, wenn ein Plugin wie
ComfyUI es registriert. Dies ist getrennt von `tts`, das Text-zu-Sprache ist.

`session_status` ist das leichtgewichtige Status-/Rückmeldewerkzeug in der Sitzungsgruppe.
Es beantwortet `/status`-artige Fragen zur aktuellen Sitzung und kann
optional einen Modell-Override pro Sitzung setzen; `model=default` löscht diesen
Override. Wie `/status` kann es lückenhafte Token-/Cache-Zähler und das
aktive Laufzeitmodell-Label aus dem neuesten Transcript-Nutzungseintrag nachtragen.

`gateway` ist das nur Ownern vorbehaltene Laufzeitwerkzeug für Gateway-Vorgänge:

- `config.schema.lookup` für einen pfadbezogenen Konfigurations-Unterbaum vor Bearbeitungen
- `config.get` für den aktuellen Konfigurations-Snapshot + Hash
- `config.patch` für partielle Konfigurationsaktualisierungen mit Neustart
- `config.apply` nur für vollständigen Konfigurationsersatz
- `update.run` für explizites Selbst-Update + Neustart

Bevorzugen Sie für partielle Änderungen `config.schema.lookup` und dann `config.patch`. Verwenden Sie
`config.apply` nur, wenn Sie absichtlich die gesamte Konfiguration ersetzen.
Für umfassendere Konfigurationsdokumentation lesen Sie [Konfiguration](/de/gateway/configuration) und
[Konfigurationsreferenz](/de/gateway/configuration-reference).
Das Werkzeug verweigert außerdem Änderungen an `tools.exec.ask` oder `tools.exec.security`;
Legacy-`tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert.

### Von Plugins bereitgestellte Werkzeuge

Plugins können zusätzliche Werkzeuge registrieren. Einige Beispiele:

- [Diffs](/de/tools/diffs) — Diff-Viewer und Renderer
- [LLM Task](/de/tools/llm-task) — JSON-only-LLM-Schritt für strukturierte Ausgabe
- [Lobster](/de/tools/lobster) — typisierte Workflow-Laufzeit mit fortsetzbaren Genehmigungen
- [Musikerzeugung](/de/tools/music-generation) — gemeinsames `music_generate`-Werkzeug mit workflow-gestützten Providern
- [OpenProse](/de/prose) — Markdown-first-Workflow-Orchestrierung
- [Tokenjuice](/de/tools/tokenjuice) — komprimiert laute `exec`- und `bash`-Werkzeugergebnisse

Plugin-Werkzeuge werden weiterhin mit `api.registerTool(...)` erstellt und in
der `contracts.tools`-Liste des Plugin-Manifests deklariert. OpenClaw erfasst den validierten
Werkzeugdeskriptor während der Erkennung und speichert ihn nach Plugin-Quelle und Vertrag im Cache, sodass
spätere Werkzeugplanung das Laden der Plugin-Laufzeit überspringen kann. Die Werkzeugausführung lädt weiterhin
das besitzende Plugin und ruft die live registrierte Implementierung auf.

## Werkzeugkonfiguration

### Allow- und Deny-Listen

Steuern Sie über `tools.allow` / `tools.deny` in der
Konfiguration, welche Werkzeuge der Agent aufrufen kann. Deny gewinnt immer gegenüber Allow.

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
`query_db` registriert. Wenn kein integriertes Werkzeug, Plugin oder gebündeltes MCP-Werkzeug mit der
Allowlist übereinstimmt, stoppt der Lauf vor dem Modellaufruf, anstatt als
Nur-Text-Lauf fortzufahren, der Werkzeugergebnisse halluzinieren könnte.

### Werkzeugprofile

`tools.profile` legt eine Basis-Allowlist fest, bevor `allow`/`deny` angewendet wird.
Override pro Agent: `agents.list[].tools.profile`.

| Profil      | Enthaltene Elemente                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Alle Core- und optionalen Plugin-Werkzeuge; uneingeschränkte Basis für umfassenderen Befehls-/Steuerungszugriff                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Nur `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` ist für kanalorientierte
Agenten absichtlich eng gefasst. Es lässt umfassendere Befehls-/Steuerungswerkzeuge wie Dateisystem, Laufzeit,
Browser, Canvas, Nodes, Cron und Gateway-Steuerung aus. Verwenden Sie `tools.profile: "full"`
als uneingeschränkte Basis für umfassenderen Befehls-/Steuerungszugriff und beschränken Sie den
Zugriff anschließend bei Bedarf mit `tools.allow` / `tools.deny`.
</Note>

`coding` enthält leichtgewichtige Webwerkzeuge (`web_search`, `web_fetch`, `x_search`),
aber nicht das vollständige Browser-Steuerungswerkzeug. Browser-Automatisierung kann echte
Sitzungen und angemeldete Profile steuern, fügen Sie sie daher explizit mit
`tools.alsoAllow: ["browser"]` oder einem agentenspezifischen
`agents.list[].tools.alsoAllow: ["browser"]` hinzu.

<Note>
Das Konfigurieren von `tools.exec` oder `tools.fs` unter einem restriktiven Profil (`messaging`, `minimal`) erweitert die Allowlist des Profils nicht implizit. Fügen Sie explizite `tools.alsoAllow`-Einträge hinzu (zum Beispiel `["exec", "process"]` für Exec oder `["read", "write", "edit"]` für fs), wenn ein restriktives Profil diese konfigurierten Abschnitte verwenden soll. OpenClaw protokolliert beim Start eine Warnung, wenn ein Konfigurationsabschnitt vorhanden ist, ohne dass eine passende `alsoAllow`-Freigabe existiert.
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

| Gruppe            | Werkzeuge                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` wird als Alias für `exec` akzeptiert)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Alle integrierten OpenClaw-Werkzeuge (schließt Plugin-Werkzeuge aus)                                      |

`sessions_history` gibt eine begrenzte, sicherheitsgefilterte Abrufansicht zurück. Es entfernt
Denk-Tags, `<relevant-memories>`-Gerüste, XML-Nutzdaten von Werkzeugaufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Werkzeugaufruf-Blöcke),
herabgestufte Werkzeugaufruf-Gerüste, offengelegte ASCII-/vollbreite Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Werkzeugaufruf-XML aus Assistant-Text, wendet dann
Redaktion/Kürzung und mögliche Platzhalter für übergroße Zeilen an, anstatt als
roher Transkript-Dump zu fungieren.

### Provider-spezifische Einschränkungen

Verwenden Sie `tools.byProvider`, um Werkzeuge für bestimmte Provider einzuschränken, ohne
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
