---
doc-schema-version: 1
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
    - Sie benötigen den richtigen Doku-Einstiegspunkt für Tool-Richtlinien, Automatisierung oder Agentenkoordination.
summary: 'Übersicht über OpenClaw-Tools, Skills und Plugins: was Agenten aufrufen können und wie Sie sie erweitern'
title: Überblick
x-i18n:
    generated_at: "2026-06-27T18:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Verwenden Sie diese Seite, um die richtige Capabilities-Oberfläche auszuwählen. **Tools** sind aufrufbare
Aktionen, **Skills** bringen Agenten bei, wie sie arbeiten sollen, und **Plugins** fügen Laufzeit-
Fähigkeiten wie Tools, Provider, Kanäle, Hooks und paketierte Skills hinzu.

Dies ist eine Übersichts- und Routing-Seite. Für vollständige Tool-Richtlinien, Standardwerte,
Gruppenzugehörigkeit, Provider-Einschränkungen und Konfigurationsfelder verwenden Sie
[Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Hier beginnen

Beginnen Sie bei den meisten Agenten mit den integrierten Tool-Kategorien und passen Sie dann die Richtlinie
nur an, wenn der Agent weniger Tools sehen soll oder expliziten Host-Zugriff benötigt.

| Wenn Sie Folgendes benötigen...                         | Verwenden Sie zuerst dies                         | Lesen Sie danach                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Einem Agenten erlauben, mit vorhandenen Fähigkeiten zu handeln | [Integrierte Tools](#built-in-tool-categories)    | [Tool-Kategorien](#built-in-tool-categories)                                                                      |
| Steuern, was ein Agent aufrufen kann                    | [Tool-Richtlinie](#configure-access-and-approvals) | [Tools und benutzerdefinierte Provider](/de/gateway/config-tools)                                                     |
| Einem Agenten einen Workflow beibringen                 | [Skills](#choose-tools-skills-or-plugins)         | [Skills](/de/tools/skills), [Skills erstellen](/de/tools/creating-skills) und [Skill Workshop](/de/tools/skill-workshop)   |
| Eine neue Integration oder Laufzeitoberfläche hinzufügen | [Plugins](#extend-capabilities)                   | [Plugins](/de/tools/plugin) und [Plugins erstellen](/de/plugins/building-plugins)                                        |
| Arbeit später oder im Hintergrund ausführen             | [Automatisierung](/de/automation)                    | [Automatisierungsübersicht](/de/automation)                                                                          |
| Mehrere Agenten oder Harnesses koordinieren             | [Sub-Agents](/de/tools/subagents)                    | [ACP-Agenten](/de/tools/acp-agents) und [Agent send](/de/tools/agent-send)                                               |
| Einen großen OpenClaw-Tool-Katalog durchsuchen          | [Tool Search](/de/tools/tool-search)                 | [Tool Search](/de/tools/tool-search)                                                                                 |

## Tools, Skills oder Plugins auswählen

<Steps>
  <Step title="Verwenden Sie ein Tool, wenn der Agent handeln muss">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann, z. B. `exec`, `browser`,
    `web_search`, `message` oder `image_generate`. Verwenden Sie Tools, wenn der Agent
    Daten lesen, Dateien ändern, Nachrichten senden, einen Provider aufrufen oder
    ein anderes System bedienen muss. Sichtbare Tools werden als strukturierte Funktions-
    definitionen an das Modell gesendet.

    Das Modell sieht nur Tools, die das aktive Profil, Allow/Deny-
    Richtlinien, Provider-Einschränkungen, Sandbox-Status, Kanalberechtigungen und
    Plugin-Verfügbarkeit überstehen.

  </Step>

  <Step title="Verwenden Sie einen Skill, wenn der Agent Anweisungen benötigt">
    Ein Skill ist ein `SKILL.md`-Anweisungspaket, das in den Agenten-Prompt geladen wird. Verwenden Sie einen
    Skill, wenn der Agent bereits über die benötigten Tools verfügt, aber einen wiederholbaren
    Workflow, eine Review-Rubrik, eine Befehlssequenz oder eine Betriebsbeschränkung benötigt.

    Skills können in einem Workspace, einem gemeinsamen Skill-Verzeichnis, einem verwalteten OpenClaw-
    Skill-Root oder einem Plugin-Paket liegen.

    [Skills](/de/tools/skills) | [Skill Workshop](/de/tools/skill-workshop) | [Skills erstellen](/de/tools/creating-skills) | [Skills-Konfiguration](/de/tools/skills-config)

  </Step>

  <Step title="Verwenden Sie ein Plugin, wenn OpenClaw eine neue Fähigkeit benötigt">
    Ein Plugin kann Tools, Skills, Kanäle, Modell-Provider, Sprache, Echtzeit-
    Sprache, Mediengenerierung, Websuche, Webabruf, Hooks und andere Laufzeit-
    Fähigkeiten hinzufügen. Verwenden Sie ein Plugin, wenn die Fähigkeit Code, Zugangsdaten,
    Lifecycle-Hooks, Manifest-Metadaten oder installierbare Paketierung hat. Vorhandene
    Plugins können aus ClawHub, npm, Git, lokalen Verzeichnissen oder
    Archiven installiert werden.

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Plugins erstellen](/de/plugins/building-plugins) | [Plugin SDK](/de/plugins/sdk-overview)

  </Step>
</Steps>

## Integrierte Tool-Kategorien

Die Tabelle listet repräsentative Tools auf, damit Sie die Oberfläche erkennen können. Sie ist
nicht die vollständige Richtlinienreferenz. Für genaue Gruppen, Standardwerte und Allow/Deny-
Semantik verwenden Sie [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

| Kategorie               | Verwenden, wenn der Agent Folgendes benötigt...                              | Repräsentative Tools                                                | Weiter lesen                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Runtime                 | Befehle ausführen, Prozesse verwalten oder provider-gestützte Python-Analyse verwenden | `exec`, `process`, `code_execution`                                 | [Exec](/de/tools/exec), [Code-Ausführung](/de/tools/code-execution)                                |
| Dateien                 | Workspace-Dateien lesen und ändern                                            | `read`, `write`, `edit`, `apply_patch`                              | [Patch anwenden](/de/tools/apply-patch)                                                         |
| Web                     | Das Web durchsuchen, X-Posts durchsuchen oder lesbare Seiteninhalte abrufen   | `web_search`, `x_search`, `web_fetch`                               | [Web-Tools](/de/tools/web), [Web-Abruf](/de/tools/web-fetch)                                       |
| Browser                 | Eine Browser-Sitzung bedienen                                                 | `browser`                                                           | [Browser](/de/tools/browser)                                                                    |
| Messaging und Kanäle    | Antworten oder Kanalaktionen senden                                           | `message`                                                           | [Agent send](/de/tools/agent-send)                                                              |
| Sitzungen und Agenten   | Sitzungen prüfen, Arbeit delegieren, einen anderen Lauf steuern oder Status melden | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`  | [Ziel](/de/tools/goal), [Sub-Agents](/de/tools/subagents), [Session-Tool](/de/concepts/session-tool)  |
| Automatisierung         | Arbeit planen oder auf Hintergrundereignisse reagieren                        | `cron`, `heartbeat_respond`                                         | [Automatisierung](/de/automation)                                                               |
| Gateway und Nodes       | Gateway-Status oder gekoppelte Zielgeräte prüfen                              | `gateway`, `nodes`                                                  | [Gateway-Konfiguration](/de/gateway/configuration), [Nodes](/de/nodes)                             |
| Medien                  | Medien analysieren, generieren oder sprechen                                  | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Medienübersicht](/de/tools/media-overview)                                                     |
| Große OpenClaw-Kataloge | Viele berechtigte Tools suchen und aufrufen, ohne jedes Schema an das Modell zu senden | `tool_search_code`, `tool_search`, `tool_describe`                  | [Tool Search](/de/tools/tool-search)                                                            |

<Note>
Tool Search ist eine experimentelle OpenClaw-Agentenoberfläche. Codex-Harness-Läufe verwenden
Codex-nativen Codemodus, native Toolsuche, zurückgestellte dynamische Tools und verschachtelte
Tool-Aufrufe anstelle von `tools.toolSearch`.
</Note>

## Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Plugin-Autoren verbinden Tools über
`api.registerTool(...)` und `contracts.tools` des Manifests; verwenden Sie
[Plugin SDK](/de/plugins/sdk-overview) und [Plugin-Manifest](/de/plugins/manifest)
für Vertragsdetails.

Häufige von Plugins bereitgestellte Tools sind:

- [Diffs](/de/tools/diffs) zum Rendern von Datei- und Markdown-Diffs
- [LLM Task](/de/tools/llm-task) für reine JSON-Workflow-Schritte
- [Lobster](/de/tools/lobster) für typisierte Workflows mit fortsetzbaren Genehmigungen
- [Tokenjuice](/de/tools/tokenjuice) zum Komprimieren von rauschreicher `exec`- und `bash`-Tool-
  Ausgabe
- [Tool Search](/de/tools/tool-search) zum Entdecken und Aufrufen großer Tool-
  Kataloge, ohne jedes Schema in den Prompt zu stellen
- [Canvas](/de/plugins/reference/canvas) für Node-Canvas-Steuerung und A2UI-
  Rendering

## Zugriff und Genehmigungen konfigurieren

Tool-Richtlinien werden vor dem Modellaufruf durchgesetzt. Wenn eine Richtlinie ein Tool entfernt, erhält das
Modell das Schema dieses Tools für den Turn nicht. Ein Lauf kann Tools verlieren
aufgrund globaler Konfiguration, Agentenkonfiguration, Kanalrichtlinie, Provider-
Einschränkungen, Sandbox-Regeln, Kanal-/Runtime-Richtlinie oder Plugin-Verfügbarkeit.

- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) dokumentiert Tool-Profile,
  Allow/Deny-Listen, Provider-spezifische Einschränkungen, Schleifenerkennung und
  provider-gestützte Tool-Einstellungen.
- [Exec-Genehmigungen](/de/tools/exec-approvals) dokumentiert die Genehmigungsrichtlinie für
  Host-Befehle.
- [Elevated exec](/de/tools/elevated) dokumentiert kontrollierte Ausführung außerhalb der
  Sandbox.
- [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) erklärt, welche Ebene Datei- und Prozesszugriff steuert.
- [Sandbox und Tool-Einschränkungen pro Agent](/de/tools/multi-agent-sandbox-tools)
  dokumentiert agentenspezifische Einschränkungen für delegierte Läufe.

## Fähigkeiten erweitern

Wählen Sie den Erweiterungspfad nach der Aufgabe, die OpenClaw ausführen soll:

- Installieren oder verwalten Sie ein vorhandenes Plugin mit [Plugins](/de/tools/plugin).
- Erstellen Sie eine neue Integration, einen Provider, Kanal, ein Tool oder einen Hook mit
  [Plugins erstellen](/de/plugins/building-plugins).
- Fügen Sie wiederverwendbare Agentenanweisungen mit [Skills](/de/tools/skills) und
  [Skills erstellen](/de/tools/creating-skills) hinzu oder passen Sie sie an.
- Verwenden Sie [Plugin SDK](/de/plugins/sdk-overview) und [Plugin-Manifest](/de/plugins/manifest), wenn Sie Implementierungsverträge benötigen.

## Fehlende Tools beheben

Wenn das Modell ein Tool nicht sehen oder aufrufen kann, beginnen Sie mit der effektiven Richtlinie für den
aktuellen Turn:

1. Prüfen Sie das aktive Profil, `tools.allow` und `tools.deny` in
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).
2. Prüfen Sie Provider-spezifische Einschränkungen in
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) und bestätigen Sie, dass der ausgewählte
   [Modell-Provider](/de/concepts/model-providers) die Tool-Form unterstützt.
3. Prüfen Sie Kanalberechtigungen, Sandbox-Status und erhöhten Zugriff mit
   [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) und [Elevated exec](/de/tools/elevated).
4. Prüfen Sie, ob das besitzende Plugin in
   [Plugins](/de/tools/plugin) installiert und aktiviert ist.
5. Prüfen Sie für delegierte Läufe die agentenspezifischen Einschränkungen in
   [Sandbox und Tool-Einschränkungen pro Agent](/de/tools/multi-agent-sandbox-tools).
6. Bestätigen Sie für große OpenClaw-Kataloge, ob der Lauf direkte Tool-Bereitstellung oder
   [Tool Search](/de/tools/tool-search) verwendet.

## Verwandte Themen

- [Automatisierung](/de/automation) für Cron, Aufgaben, Heartbeat, Verpflichtungen, Hooks, Daueraufträge und Task Flow
- [Agenten](/de/concepts/agent) für das Agentenmodell, Sitzungen, Speicher und Multi-Agenten-Koordination
- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) als kanonische Referenz für Tool-Richtlinien
- [Plugins](/de/tools/plugin) für Plugin-Installation und -Verwaltung
- [Plugin SDK](/de/plugins/sdk-overview) als Referenz für Plugin-Autoren
- [Skills](/de/tools/skills) für Skill-Ladereihenfolge, Gating und Konfiguration
- [Skill Workshop](/de/tools/skill-workshop) für generierte und geprüfte Skill-Erstellung
- [Tool Search](/de/tools/tool-search) für kompakte Entdeckung von OpenClaw-Tool-Katalogen
