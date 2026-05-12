---
doc-schema-version: 1
read_when:
    - Sie möchten verstehen, welche Werkzeuge OpenClaw bereitstellt
    - Sie entscheiden zwischen integrierten Tools, Skills und Plugins
    - Sie benötigen den richtigen Einstiegspunkt in die Dokumentation für Tool-Richtlinien, Automatisierung oder Agentenkoordination
summary: 'Überblick über OpenClaw-Werkzeuge, Skills und Plugins: was Agenten aufrufen können und wie sie sich erweitern lassen'
title: Übersicht
x-i18n:
    generated_at: "2026-05-12T01:00:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Verwenden Sie diese Seite, um die passende Capabilities-Oberfläche auszuwählen. **Tools** sind aufrufbare
Aktionen, **Skills** bringen Agenten Arbeitsweisen bei, und **Plugins** fügen Runtime-
Capabilities wie Tools, Provider, Kanäle, Hooks und paketierte Skills hinzu.

Dies ist eine Übersichts- und Routing-Seite. Für vollständige Tool-Richtlinien, Standards,
Gruppenmitgliedschaft, Provider-Einschränkungen und Konfigurationsfelder verwenden Sie
[Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Hier beginnen

Für die meisten Agenten beginnen Sie mit den integrierten Tool-Kategorien und passen dann die Richtlinie
nur an, wenn der Agent weniger Tools sehen soll oder expliziten Host-Zugriff benötigt.

| Wenn Sie Folgendes benötigen...                         | Verwenden Sie zuerst                           | Lesen Sie anschließend                                                |
| ------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Einen Agenten mit bestehenden Capabilities handeln lassen | [Integrierte Tools](#built-in-tool-categories) | [Tool-Kategorien](#built-in-tool-categories)                          |
| Steuern, was ein Agent aufrufen kann                    | [Tool-Richtlinie](#configure-access-and-approvals) | [Tools und benutzerdefinierte Provider](/de/gateway/config-tools)     |
| Einem Agenten einen Workflow beibringen                 | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/de/tools/skills) und [Skills erstellen](/de/tools/creating-skills) |
| Eine neue Integration oder Runtime-Oberfläche hinzufügen | [Plugins](#extend-capabilities)                | [Plugins](/de/tools/plugin) und [Plugins erstellen](/de/plugins/building-plugins) |
| Arbeit später oder im Hintergrund ausführen             | [Automatisierung](/de/automation)                 | [Automatisierungsübersicht](/de/automation)                              |
| Mehrere Agenten oder Harnesses koordinieren             | [Sub-Agenten](/de/tools/subagents)                | [ACP-Agenten](/de/tools/acp-agents) und [Agent senden](/de/tools/agent-send) |
| Einen großen PI-Tool-Katalog durchsuchen                | [Tool-Suche](/de/tools/tool-search)               | [Tool-Suche](/de/tools/tool-search)                                      |

## Tools, Skills oder Plugins auswählen

<Steps>
  <Step title="Verwenden Sie ein Tool, wenn der Agent handeln muss">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann, etwa `exec`, `browser`,
    `web_search`, `message` oder `image_generate`. Verwenden Sie Tools, wenn der Agent
    Daten lesen, Dateien ändern, Nachrichten senden, einen Provider aufrufen oder ein
    anderes System bedienen muss. Sichtbare Tools werden als strukturierte Funktions-
    Definitionen an das Modell gesendet.

    Das Modell sieht nur Tools, die das aktive Profil, Allow-/Deny-
    Richtlinie, Provider-Einschränkungen, Sandbox-Zustand, Kanalberechtigungen und
    Plugin-Verfügbarkeit überstehen.

  </Step>

  <Step title="Verwenden Sie einen Skill, wenn der Agent Anweisungen benötigt">
    Ein Skill ist ein `SKILL.md`-Anweisungspaket, das in den Agenten-Prompt geladen wird. Verwenden Sie einen
    Skill, wenn der Agent bereits die benötigten Tools hat, aber einen wiederholbaren
    Workflow, eine Review-Rubrik, eine Befehlssequenz oder eine Betriebsbeschränkung benötigt.

    Skills können in einem Workspace, einem gemeinsamen Skill-Verzeichnis, einem verwalteten OpenClaw-
    Skill-Root oder einem Plugin-Paket liegen.

    [Skills](/de/tools/skills) | [Skills erstellen](/de/tools/creating-skills) | [Skills-Konfiguration](/de/tools/skills-config)

  </Step>

  <Step title="Verwenden Sie ein Plugin, wenn OpenClaw eine neue Capability benötigt">
    Ein Plugin kann Tools, Skills, Kanäle, Modell-Provider, Sprache, Echtzeit-
    Sprache, Mediengenerierung, Websuche, Webabruf, Hooks und andere Runtime-
    Capabilities hinzufügen. Verwenden Sie ein Plugin, wenn die Capability Code, Zugangsdaten,
    Lifecycle-Hooks, Manifest-Metadaten oder installierbare Paketierung hat. Bestehende
    Plugins können aus ClawHub, npm, git, lokalen Verzeichnissen oder
    Archiven installiert werden.

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Plugins erstellen](/de/plugins/building-plugins) | [Plugin SDK](/de/plugins/sdk-overview)

  </Step>
</Steps>

## Integrierte Tool-Kategorien

Die Tabelle listet repräsentative Tools auf, damit Sie die Oberfläche erkennen können. Sie ist
nicht die vollständige Richtlinienreferenz. Für genaue Gruppen, Standards und Allow-/Deny-
Semantik verwenden Sie [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

| Kategorie              | Verwenden, wenn der Agent Folgendes tun muss...                                | Repräsentative Tools                                                   | Weiterführende Informationen                                           |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime                | Befehle ausführen, Prozesse verwalten oder Provider-gestützte Python-Analyse verwenden | `exec`, `process`, `code_execution`                                    | [Exec](/de/tools/exec), [Codeausführung](/de/tools/code-execution)           |
| Dateien                | Workspace-Dateien lesen und ändern                                             | `read`, `write`, `edit`, `apply_patch`                                 | [Patch anwenden](/de/tools/apply-patch)                                   |
| Web                    | Das Web durchsuchen, X-Beiträge durchsuchen oder lesbare Seiteninhalte abrufen | `web_search`, `x_search`, `web_fetch`                                  | [Web-Tools](/de/tools/web), [Webabruf](/de/tools/web-fetch)                  |
| Browser                | Eine Browser-Sitzung bedienen                                                  | `browser`                                                              | [Browser](/de/tools/browser)                                              |
| Messaging und Kanäle   | Antworten oder Kanalaktionen senden                                            | `message`                                                              | [Agent senden](/de/tools/agent-send)                                      |
| Sitzungen und Agenten  | Sitzungen prüfen, Arbeit delegieren, einen anderen Lauf steuern oder Status melden | `sessions_*`, `subagents`, `agents_list`, `session_status`             | [Sub-Agenten](/de/tools/subagents), [Sitzungstool](/de/concepts/session-tool) |
| Automatisierung        | Arbeit planen oder auf Hintergrundereignisse reagieren                         | `cron`, `heartbeat_respond`                                            | [Automatisierung](/de/automation)                                         |
| Gateway und Nodes      | Gateway-Zustand oder gekoppelte Zielgeräte prüfen                              | `gateway`, `nodes`                                                     | [Gateway-Konfiguration](/de/gateway/configuration), [Nodes](/de/nodes)       |
| Medien                 | Medien analysieren, generieren oder sprechen                                   | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`   | [Medienübersicht](/de/tools/media-overview)                               |
| Große PI-Kataloge      | Viele zulässige Tools suchen und aufrufen, ohne jedes Schema an das Modell zu senden | `tool_search_code`, `tool_search`, `tool_describe`                     | [Tool-Suche](/de/tools/tool-search)                                       |

<Note>
Tool-Suche ist eine experimentelle PI-Agent-Oberfläche. Codex-Harness-Läufe verwenden
Codex-nativen Code-Modus, native Tool-Suche, verzögerte dynamische Tools und verschachtelte
Tool-Aufrufe anstelle von `tools.toolSearch`.
</Note>

## Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Plugin-Autoren verdrahten Tools über
`api.registerTool(...)` und `contracts.tools` des Manifests; verwenden Sie
[Plugin SDK](/de/plugins/sdk-overview) und [Plugin-Manifest](/de/plugins/manifest)
für Vertragsdetails.

Häufige von Plugins bereitgestellte Tools sind:

- [Diffs](/de/tools/diffs) zum Rendern von Datei- und Markdown-Diffs
- [LLM-Aufgabe](/de/tools/llm-task) für reine JSON-Workflow-Schritte
- [Lobster](/de/tools/lobster) für typisierte Workflows mit fortsetzbaren Genehmigungen
- [Tokenjuice](/de/tools/tokenjuice) zum Verdichten verrauschter `exec`- und `bash`-Tool-
  Ausgaben
- [Tool-Suche](/de/tools/tool-search) zum Entdecken und Aufrufen großer Tool-
  Kataloge, ohne jedes Schema in den Prompt zu stellen
- [Canvas](/de/plugins/reference/canvas) für Node-Canvas-Steuerung und A2UI-
  Rendering

## Zugriff und Genehmigungen konfigurieren

Die Tool-Richtlinie wird vor dem Modellaufruf erzwungen. Wenn die Richtlinie ein Tool entfernt, erhält das
Modell das Schema dieses Tools für diesen Turn nicht. Ein Lauf kann Tools verlieren
aufgrund globaler Konfiguration, Agent-spezifischer Konfiguration, Kanalrichtlinie, Provider-
Einschränkungen, Sandbox-Regeln, Owner-only-Gating oder Plugin-Verfügbarkeit.

- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) dokumentiert Tool-Profile,
  Allow-/Deny-Listen, Provider-spezifische Einschränkungen, Schleifenerkennung und
  Provider-gestützte Tool-Einstellungen.
- [Exec-Genehmigungen](/de/tools/exec-approvals) dokumentiert die Genehmigungsrichtlinie für Host-Befehle.
- [Erhöhtes Exec](/de/tools/elevated) dokumentiert kontrollierte Ausführung außerhalb der
  Sandbox.
- [Sandbox vs. Tool-Richtlinie vs. erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated) erklärt, welche Ebene Datei- und Prozesszugriff steuert.
- [Agent-spezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools)
  dokumentiert Agent-spezifische Einschränkungen für delegierte Läufe.

## Capabilities erweitern

Wählen Sie den Erweiterungspfad nach der Aufgabe, die OpenClaw ausführen soll:

- Installieren oder verwalten Sie ein bestehendes Plugin mit [Plugins](/de/tools/plugin).
- Erstellen Sie eine neue Integration, einen Provider, Kanal, ein Tool oder einen Hook mit
  [Plugins erstellen](/de/plugins/building-plugins).
- Fügen Sie wiederverwendbare Agentenanweisungen hinzu oder passen Sie diese an mit [Skills](/de/tools/skills) und
  [Skills erstellen](/de/tools/creating-skills).
- Paketieren Sie wiederverwendbares Workflow-Material mit
  [Skill-Workshop](/de/plugins/skill-workshop), wenn der Workflow in ein
  per Plugin verteiltes Skill-Bundle gehört.
- Verwenden Sie [Plugin SDK](/de/plugins/sdk-overview) und [Plugin-Manifest](/de/plugins/manifest), wenn Sie Implementierungsverträge benötigen.

## Fehlende Tools beheben

Wenn das Modell ein Tool nicht sehen oder aufrufen kann, beginnen Sie mit der effektiven Richtlinie für den
aktuellen Turn:

1. Prüfen Sie das aktive Profil, `tools.allow` und `tools.deny` in
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).
2. Prüfen Sie Provider-spezifische Einschränkungen in
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) und bestätigen Sie, dass der ausgewählte
   [Modell-Provider](/de/concepts/model-providers) die Tool-Form unterstützt.
3. Prüfen Sie Kanalberechtigungen, Sandbox-Zustand und erhöhten Zugriff mit
   [Sandbox vs. Tool-Richtlinie vs. erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated) und [Erhöhtes Exec](/de/tools/elevated).
4. Prüfen Sie, ob das besitzende Plugin in
   [Plugins](/de/tools/plugin) installiert und aktiviert ist.
5. Prüfen Sie für delegierte Läufe Agent-spezifische Einschränkungen in
   [Agent-spezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools).
6. Bestätigen Sie für große PI-Kataloge, ob der Lauf direkte Tool-Bereitstellung oder
   [Tool-Suche](/de/tools/tool-search) verwendet.

## Verwandte Themen

- [Automatisierung](/de/automation) für Cron, Aufgaben, Heartbeat, Zusagen, Hooks, Standing Orders und Task Flow
- [Agenten](/de/concepts/agent) für das Agentenmodell, Sitzungen, Memory und Multi-Agent-Koordination
- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) als kanonische Tool-Richtlinienreferenz
- [Plugins](/de/tools/plugin) für Plugin-Installation und -Verwaltung
- [Plugin SDK](/de/plugins/sdk-overview) als Referenz für Plugin-Autoren
- [Skills](/de/tools/skills) für Skill-Ladereihenfolge, Gating und Konfiguration
- [Tool-Suche](/de/tools/tool-search) für kompakte PI-Tool-Katalogerkennung
