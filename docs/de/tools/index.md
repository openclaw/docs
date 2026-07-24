---
doc-schema-version: 1
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
    - Sie benötigen den richtigen Einstiegspunkt in die Dokumentation für Tool-Richtlinien, Automatisierung oder Agentenkoordination
summary: 'Übersicht über OpenClaw-Tools, Skills und Plugins: Was Agenten aufrufen können und wie sie erweitert werden können'
title: Übersicht
x-i18n:
    generated_at: "2026-07-24T04:11:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 45745bd5f2008a84cb6c4c1c9840073bfa8a9c40a0ff65bfefc682c5d99af09b
    source_path: tools/index.md
    workflow: 16
---

Verwenden Sie diese Seite, um die richtige Oberfläche für Funktionen auszuwählen. **Tools** sind
aufrufbare Aktionen, **Skills** vermitteln Agenten Arbeitsweisen und **Plugins** fügen
Laufzeitfunktionen wie Tools, Provider, Kanäle, Hooks und gebündelte
Skills hinzu.

Dies ist eine Übersichts- und Navigationsseite. Ausführliche Informationen zu Tool-Richtlinien, Standardwerten,
Gruppenzugehörigkeit, Provider-Einschränkungen und Konfigurationsfeldern finden Sie unter
[Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Erste Schritte

Beginnen Sie für die meisten Agenten mit den integrierten Tool-Kategorien und passen Sie die Richtlinie
nur an, wenn der Agent weniger Tools sehen oder ausdrücklich auf den Host zugreifen soll.

| Wenn Sie Folgendes benötigen ...                         | Verwenden Sie zuerst                              | Lesen Sie anschließend                                                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Einen Agenten mit vorhandenen Funktionen handeln lassen  | [Integrierte Tools](#built-in-tool-categories)    | [Tool-Kategorien](#built-in-tool-categories)                                                                                                                              |
| Steuern, was ein Agent aufrufen kann                      | [Tool-Richtlinie](#configure-access-and-approvals) | [Tools und benutzerdefinierte Provider](/de/gateway/config-tools)                                                                                                           |
| Einem Agenten einen Arbeitsablauf vermitteln              | [Skills](#choose-tools-skills-or-plugins)         | [Skills](/de/tools/skills), [Skills erstellen](/de/tools/creating-skills), [Skill Workshop](/de/tools/skill-workshop) und [Selbstlernen](/de/tools/self-learning)                    |
| Eine neue Integration oder Laufzeitoberfläche hinzufügen | [Plugins](#extend-capabilities)                   | [Plugins](/de/tools/plugin) und [Plugins erstellen](/de/plugins/building-plugins)                                                                                              |
| Arbeit später oder im Hintergrund ausführen               | [Automatisierung](/de/automation)                    | [Übersicht zur Automatisierung](/de/automation)                                                                                                                             |
| Mehrere Agenten oder Harnesses koordinieren                | [Unteragenten](/de/tools/subagents)                  | [ACP-Agenten](/de/tools/acp-agents) und [Agentenversand](/de/tools/agent-send)                                                                                                 |
| Gleichzeitige Agenten aus Code orchestrieren               | [Swarm](/tools/swarm)                             | [Code Mode](/de/tools/code-mode) und [Unteragenten](/de/tools/subagents)                                                                                                       |
| Einen großen OpenClaw-Toolkatalog durchsuchen              | [Tool Search](/de/tools/tool-search)                 | [Tool Search](/de/tools/tool-search)                                                                                                                                         |
| Mehrere Tools in einem kompakten Programm kombinieren      | [Code Mode](/de/tools/code-mode)                     | [Code Mode](/de/tools/code-mode)                                                                                                                                             |

## Tools, Skills oder Plugins auswählen

<Steps>
  <Step title="Verwenden Sie ein Tool, wenn der Agent handeln muss">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann, etwa `exec`, `browser`,
    `web_search`, `message` oder `image_generate`. Verwenden Sie Tools, wenn der Agent
    Daten lesen, Dateien ändern, Nachrichten senden, einen Provider aufrufen oder
    ein anderes System bedienen muss. Sichtbare Tools werden als strukturierte
    Funktionsdefinitionen an das Modell gesendet.

    Das Modell sieht nur Tools, die nach Anwendung des aktiven Profils, der Zulassungs-/Ablehnungsrichtlinie,
    der Provider-Einschränkungen, des Sandbox-Status, der Kanalberechtigungen und
    der Plugin-Verfügbarkeit verbleiben.

  </Step>

  <Step title="Verwenden Sie einen Skill, wenn der Agent Anweisungen benötigt">
    Ein Skill ist ein `SKILL.md`-Anweisungspaket, das in den Agenten-Prompt geladen wird. Verwenden Sie
    einen Skill, wenn der Agent bereits über die erforderlichen Tools verfügt, aber einen
    wiederholbaren Arbeitsablauf, ein Prüfschema, eine Befehlsfolge oder eine betriebliche
    Einschränkung benötigt.

    Skills können in einem Workspace, einem gemeinsam genutzten Skill-Verzeichnis, einem verwalteten OpenClaw-
    Skill-Stammverzeichnis oder einem Plugin-Paket gespeichert sein.

    [Skills](/de/tools/skills) | [Skill Workshop](/de/tools/skill-workshop) | [Selbstlernen](/de/tools/self-learning) | [Skills erstellen](/de/tools/creating-skills) | [Skills-Konfiguration](/de/tools/skills-config)

  </Step>

  <Step title="Verwenden Sie ein Plugin, wenn OpenClaw eine neue Funktion benötigt">
    Ein Plugin kann Tools, Skills, Kanäle, Modell-Provider, Sprachausgabe,
    Echtzeitsprachkommunikation, Medienerzeugung, Websuche, Webabruf, Hooks und weitere
    Laufzeitfunktionen hinzufügen. Verwenden Sie ein Plugin, wenn die Funktion Code,
    Anmeldedaten, Lebenszyklus-Hooks, Manifest-Metadaten oder ein installierbares
    Paket umfasst. Vorhandene Plugins können aus ClawHub, npm, git,
    lokalen Verzeichnissen oder Archiven installiert werden.

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Plugins erstellen](/de/plugins/building-plugins) | [Plugin SDK](/de/plugins/sdk-overview)

  </Step>
</Steps>

## Integrierte Tool-Kategorien

Die Tabelle enthält repräsentative Tools, damit Sie die Oberfläche erkennen können. Sie ist
nicht die vollständige Richtlinienreferenz. Genaue Informationen zu Gruppen, Standardwerten und der Semantik
von Zulassungs-/Ablehnungsregeln finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

| Kategorie                 | Verwenden, wenn der Agent Folgendes benötigt ...                                                    | Repräsentative Tools                                                                                               | Als Nächstes lesen                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Laufzeit                  | Befehle ausführen, Prozesse verwalten oder Provider-gestützte Python-Analysen verwenden             | `exec`, `process`, `terminal`, `code_execution`                                                                    | [Exec](/de/tools/exec), [Control-UI-Terminal](/de/web/control-ui#operator-terminal), [Codeausführung](/de/tools/code-execution)              |
| Dateien                   | Workspace-Dateien lesen und ändern                                                                  | `read`, `write`, `edit`, `apply_patch`                                                                             | [Patch anwenden](/de/tools/apply-patch)                                                                                                |
| Menschliche Eingabe       | Für eine strukturierte Entscheidung pausieren, für die der Benutzer verantwortlich ist              | `ask_user`                                                                                                         | [Benutzer fragen](/tools/ask-user)                                                                                                  |
| Web                       | Das Web oder Beiträge auf X durchsuchen oder lesbare Seiteninhalte abrufen                          | `web_search`, `x_search`, `web_fetch`                                                                              | [Web-Tools](/de/tools/web), [Webabruf](/de/tools/web-fetch)                                                                                |
| Browser                   | Eine Browsersitzung bedienen                                                                         | `browser`                                                                                                          | [Browser](/de/tools/browser)                                                                                                           |
| Bedienoberfläche          | Verbundene Bereiche, Panels und die Navigation der Control UI anordnen                              | `screen`                                                                                                           | [Bildschirm](/tools/screen)                                                                                                         |
| Nachrichten und Kanäle    | Antworten oder Kanalaktionen senden                                                                  | `message`                                                                                                          | [Agentenversand](/de/tools/agent-send)                                                                                                 |
| Sitzungen und Agenten     | Sitzungen prüfen, Arbeit delegieren, Collectors orchestrieren, einen anderen Lauf steuern oder Status melden | `sessions_*`, `agents_wait`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Ziel](/de/tools/goal), [Swarm](/tools/swarm), [Unteragenten](/de/tools/subagents), [Sitzungs-Tool](/de/concepts/session-tool)               |
| Automatisierung           | Arbeit planen oder auf Hintergrundereignisse reagieren                                               | `cron`, `heartbeat_respond`                                                                                        | [Automatisierung](/de/automation)                                                                                                      |
| Gateway und Nodes         | Den Gateway-Status oder gekoppelte Zielgeräte prüfen                                                 | `gateway`, `nodes`                                                                                                 | [Gateway-Konfiguration](/de/gateway/configuration), [Nodes](/de/nodes)                                                                    |
| Medien                    | Medien analysieren, erzeugen oder sprachlich ausgeben                                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                               | [Medienübersicht](/de/tools/media-overview)                                                                                            |
| Große OpenClaw-Kataloge   | Viele geeignete Tools suchen, aufrufen und kombinieren, ohne jedes Schema an das Modell zu senden    | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`                                                 | [Code Mode](/de/tools/code-mode), [Tool Search](/de/tools/tool-search)                                                                    |

<Note>
Code Mode und Tool Search sind experimentelle OpenClaw-Agentenoberflächen. Codex-
Harness-Läufe verwenden den nativen Code Mode und die native Tool Search von Codex, verzögert bereitgestellte dynamische
Tools sowie verschachtelte Tool-Aufrufe anstelle von `tools.codeMode` oder `tools.toolSearch`.
</Note>

## Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Plugin-Autoren binden Tools über
`api.registerTool(...)` und `contracts.tools` des Manifests ein; Einzelheiten zum Vertrag finden Sie im
[Plugin SDK](/de/plugins/sdk-overview) und unter [Plugin-Manifest](/de/plugins/manifest).

Zu den üblichen von Plugins bereitgestellten Tools gehören:

- [Diffs](/de/tools/diffs) zum Rendern von Datei- und Markdown-Diffs
- [Widget anzeigen](/de/tools/show-widget) für eigenständiges Inline-SVG und -HTML in unterstützten Chat-Clients
- [Bildschirm](/tools/screen) zum Anordnen einer verbundenen Control UI
- [LLM-Aufgabe](/de/tools/llm-task) für reine JSON-Workflow-Schritte
- [Lobster](/de/tools/lobster) für typisierte Workflows mit fortsetzbaren Genehmigungen
- [Tokenjuice](/de/tools/tokenjuice) zum Komprimieren unübersichtlicher Ausgaben der Tools
  `exec` und `bash`
- [Tool-Suche](/de/tools/tool-search) zum Ermitteln und Aufrufen großer Tool-
  Kataloge, ohne jedes Schema in den Prompt aufzunehmen
- [Canvas](/de/plugins/reference/canvas) zur Steuerung von Node Canvas und zum
  A2UI-Rendering

## Zugriff und Genehmigungen konfigurieren

Die Tool-Richtlinie wird vor dem Modellaufruf durchgesetzt. Wenn die Richtlinie ein Tool entfernt,
erhält das Modell das Schema dieses Tools für diesen Durchlauf nicht. Ein Lauf kann Tools
aufgrund der globalen Konfiguration, der agentspezifischen Konfiguration, der Kanalrichtlinie, der Provider-
Einschränkungen, der Sandbox-Regeln, der Kanal-/Laufzeitrichtlinie oder der Plugin-Verfügbarkeit verlieren.

- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) dokumentiert Tool-Profile,
  Zulassungs-/Sperrlisten, providerspezifische Einschränkungen, Schleifenerkennung und
  providergestützte Tool-Einstellungen.
- [Exec-Genehmigungen](/de/tools/exec-approvals) dokumentiert die Genehmigungsrichtlinie
  für Host-Befehle.
- [Exec mit erhöhten Rechten](/de/tools/elevated) dokumentiert die kontrollierte Ausführung außerhalb der
  Sandbox.
- [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
  erläutert, welche Ebene den Datei- und Prozesszugriff steuert.
- [Agentspezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools)
  dokumentiert agentspezifische Einschränkungen für delegierte Läufe.

## Funktionen erweitern

Wählen Sie den Erweiterungspfad entsprechend der Aufgabe, die OpenClaw ausführen soll:

- Installieren oder verwalten Sie ein vorhandenes Plugin mit [Plugins](/de/tools/plugin).
- Erstellen Sie eine neue Integration, einen Provider, einen Kanal, ein Tool oder einen Hook mit
  [Plugins erstellen](/de/plugins/building-plugins).
- Fügen Sie wiederverwendbare Agent-Anweisungen mit [Skills](/de/tools/skills) und
  [Skills erstellen](/de/tools/creating-skills) hinzu oder optimieren Sie sie.
- Verwenden Sie das [Plugin SDK](/de/plugins/sdk-overview) und das
  [Plugin-Manifest](/de/plugins/manifest), wenn Sie Implementierungs-
  verträge benötigen.

## Fehlende Tools beheben

Wenn das Modell ein Tool nicht sehen oder aufrufen kann, beginnen Sie mit der wirksamen Richtlinie für
den aktuellen Durchlauf:

1. Prüfen Sie das aktive Profil, `tools.allow` und `tools.deny` unter
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).
2. Prüfen Sie die providerspezifischen Einschränkungen unter
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) und bestätigen Sie, dass der
   ausgewählte [Modell-Provider](/de/concepts/model-providers) die Tool-
   Struktur unterstützt.
3. Prüfen Sie Kanalberechtigungen, Sandbox-Status und erhöhten Zugriff unter
   [Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
   und [Exec mit erhöhten Rechten](/de/tools/elevated).
4. Prüfen Sie unter [Plugins](/de/tools/plugin), ob das zuständige Plugin installiert
   und aktiviert ist.
5. Prüfen Sie bei delegierten Läufen die agentspezifischen Einschränkungen unter
   [Agentspezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools).
6. Prüfen Sie bei großen OpenClaw-Katalogen, ob der Lauf die direkte Tool-
   Bereitstellung, den [Code-Modus](/de/tools/code-mode) oder die [Tool-Suche](/de/tools/tool-search) verwendet.

## Verwandte Themen

- [Automatisierung](/de/automation) für Cron, Aufgaben, Heartbeat, Hooks,
  Daueraufträge und Task Flow
- [Agents](/de/concepts/agent) für das Agent-Modell, Sitzungen, Speicher und
  Multi-Agent-Koordination
- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) als maßgebliche Referenz
  für Tool-Richtlinien
- [Plugins](/de/tools/plugin) für die Installation und Verwaltung von Plugins
- [Plugin SDK](/de/plugins/sdk-overview) als Referenz für Plugin-Autoren
- [Skills](/de/tools/skills) für Skill-Ladereihenfolge, Zugriffssteuerung und Konfiguration
- [Skill-Workshop](/de/tools/skill-workshop) zum Erstellen generierter und geprüfter Skills
- [Tool-Suche](/de/tools/tool-search) zur kompakten Ermittlung des OpenClaw-Tool-
  Katalogs
- [Code-Modus](/de/tools/code-mode) für kompakte JavaScript- oder TypeScript-Workflows
  über einen verborgenen OpenClaw-Tool-Katalog
- [Swarm](/tools/swarm) für strukturierte Auffächerung und Ergebnissammlung im Code-Modus
