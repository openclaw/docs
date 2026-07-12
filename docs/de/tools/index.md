---
doc-schema-version: 1
read_when:
    - Sie möchten verstehen, welche Tools OpenClaw bereitstellt
    - Sie entscheiden sich zwischen integrierten Tools, Skills und Plugins
    - Sie benötigen den richtigen Einstiegspunkt in die Dokumentation für Tool-Richtlinien, Automatisierung oder Agentenkoordination
summary: 'Überblick über OpenClaw-Tools, Skills und Plugins: Was Agenten aufrufen können und wie sie erweitert werden können'
title: Übersicht
x-i18n:
    generated_at: "2026-07-12T02:14:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Verwenden Sie diese Seite, um die passende Oberfläche für Funktionen auszuwählen. **Tools** sind
aufrufbare Aktionen, **Skills** vermitteln Agenten Arbeitsweisen, und **Plugins** fügen
Laufzeitfunktionen wie Tools, Provider, Kanäle, Hooks und gebündelte
Skills hinzu.

Dies ist eine Übersichts- und Navigationsseite. Ausführliche Informationen zu Tool-Richtlinien, Standardwerten,
Gruppenzugehörigkeit, Provider-Einschränkungen und Konfigurationsfeldern finden Sie unter
[Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Erste Schritte

Beginnen Sie für die meisten Agenten mit den integrierten Tool-Kategorien und passen Sie die Richtlinien
nur an, wenn der Agent weniger Tools sehen soll oder ausdrücklichen Host-Zugriff benötigt.

| Wenn Sie Folgendes benötigen ...                         | Verwenden Sie zuerst                              | Lesen Sie anschließend                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Einen Agenten mit vorhandenen Funktionen handeln lassen  | [Integrierte Tools](#built-in-tool-categories)    | [Tool-Kategorien](#built-in-tool-categories)                                                                       |
| Steuern, was ein Agent aufrufen kann                     | [Tool-Richtlinie](#configure-access-and-approvals) | [Tools und benutzerdefinierte Provider](/de/gateway/config-tools)                                                      |
| Einem Agenten einen Arbeitsablauf vermitteln             | [Skills](#choose-tools-skills-or-plugins)         | [Skills](/de/tools/skills), [Skills erstellen](/de/tools/creating-skills) und [Skill-Workshop](/de/tools/skill-workshop)    |
| Eine neue Integration oder Laufzeitoberfläche hinzufügen | [Plugins](#extend-capabilities)                   | [Plugins](/de/tools/plugin) und [Plugins erstellen](/de/plugins/building-plugins)                                        |
| Aufgaben später oder im Hintergrund ausführen            | [Automatisierung](/de/automation)                    | [Automatisierungsübersicht](/de/automation)                                                                           |
| Mehrere Agenten oder Harnesses koordinieren              | [Unteragenten](/de/tools/subagents)                  | [ACP-Agenten](/de/tools/acp-agents) und [Agentenversand](/de/tools/agent-send)                                           |
| Einen großen OpenClaw-Tool-Katalog durchsuchen           | [Tool Search](/de/tools/tool-search)                 | [Tool Search](/de/tools/tool-search)                                                                                  |

## Tools, Skills oder Plugins auswählen

<Steps>
  <Step title="Verwenden Sie ein Tool, wenn der Agent handeln muss">
    Ein Tool ist eine typisierte Funktion, die der Agent aufrufen kann, beispielsweise `exec`, `browser`,
    `web_search`, `message` oder `image_generate`. Verwenden Sie Tools, wenn der Agent
    Daten lesen, Dateien ändern, Nachrichten senden, einen Provider aufrufen oder
    ein anderes System bedienen muss. Sichtbare Tools werden dem Modell als strukturierte
    Funktionsdefinitionen übermittelt.

    Das Modell sieht nur Tools, die das aktive Profil, die Zulassen-/Ablehnen-Richtlinie,
    Provider-Einschränkungen, den Sandbox-Status, Kanalberechtigungen und
    die Plugin-Verfügbarkeit passieren.

  </Step>

  <Step title="Verwenden Sie einen Skill, wenn der Agent Anweisungen benötigt">
    Ein Skill ist ein `SKILL.md`-Anweisungspaket, das in den Agenten-Prompt geladen wird. Verwenden Sie
    einen Skill, wenn der Agent bereits über die benötigten Tools verfügt, aber einen
    wiederholbaren Arbeitsablauf, Prüfkriterien, eine Befehlsfolge oder betriebliche
    Einschränkungen benötigt.

    Skills können in einem Workspace, einem freigegebenen Skill-Verzeichnis, dem verwalteten OpenClaw-
    Skill-Stammverzeichnis oder einem Plugin-Paket gespeichert sein.

    [Skills](/de/tools/skills) | [Skill-Workshop](/de/tools/skill-workshop) | [Skills erstellen](/de/tools/creating-skills) | [Skills-Konfiguration](/de/tools/skills-config)

  </Step>

  <Step title="Verwenden Sie ein Plugin, wenn OpenClaw eine neue Funktion benötigt">
    Ein Plugin kann Tools, Skills, Kanäle, Modell-Provider, Sprachausgabe,
    Echtzeit-Sprache, Mediengenerierung, Websuche, Webabruf, Hooks und weitere
    Laufzeitfunktionen hinzufügen. Verwenden Sie ein Plugin, wenn die Funktion Code,
    Anmeldedaten, Lebenszyklus-Hooks, Manifest-Metadaten oder installierbare
    Pakete umfasst. Vorhandene Plugins können über ClawHub, npm, Git,
    lokale Verzeichnisse oder Archive installiert werden.

    [Plugins installieren und konfigurieren](/de/tools/plugin) | [Plugins erstellen](/de/plugins/building-plugins) | [Plugin-SDK](/de/plugins/sdk-overview)

  </Step>
</Steps>

## Integrierte Tool-Kategorien

Die Tabelle enthält repräsentative Tools, damit Sie die Oberfläche erkennen können. Sie ist
keine vollständige Richtlinienreferenz. Genaue Informationen zu Gruppen, Standardwerten und der Semantik
von Zulassen und Ablehnen finden Sie unter [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

| Kategorie                  | Verwenden, wenn der Agent Folgendes benötigt ...                                  | Repräsentative Tools                                                                                 | Weiterlesen                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Laufzeit                   | Befehle ausführen, Prozesse verwalten oder Provider-gestützte Python-Analysen nutzen | `exec`, `process`, `code_execution`                                                                  | [Exec](/de/tools/exec), [Codeausführung](/de/tools/code-execution)                                  |
| Dateien                    | Workspace-Dateien lesen und ändern                                                 | `read`, `write`, `edit`, `apply_patch`                                                               | [Patch anwenden](/de/tools/apply-patch)                                                          |
| Web                        | Das Web oder Beiträge auf X durchsuchen oder lesbare Seiteninhalte abrufen         | `web_search`, `x_search`, `web_fetch`                                                                | [Web-Tools](/de/tools/web), [Webabruf](/de/tools/web-fetch)                                         |
| Browser                    | Eine Browsersitzung bedienen                                                       | `browser`                                                                                            | [Browser](/de/tools/browser)                                                                     |
| Nachrichten und Kanäle     | Antworten oder Kanalaktionen senden                                                | `message`                                                                                            | [Agentenversand](/de/tools/agent-send)                                                           |
| Sitzungen und Agenten      | Sitzungen prüfen, Aufgaben delegieren, einen anderen Lauf steuern oder Status melden | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Ziel](/de/tools/goal), [Unteragenten](/de/tools/subagents), [Sitzungs-Tool](/de/concepts/session-tool) |
| Automatisierung            | Aufgaben planen oder auf Hintergrundereignisse reagieren                           | `cron`, `heartbeat_respond`                                                                          | [Automatisierung](/de/automation)                                                                |
| Gateway und Nodes          | Den Gateway-Status oder gekoppelte Zielgeräte prüfen                               | `gateway`, `nodes`                                                                                   | [Gateway-Konfiguration](/de/gateway/configuration), [Nodes](/de/nodes)                              |
| Medien                     | Medien analysieren, generieren oder vertonen                                       | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Medienübersicht](/de/tools/media-overview)                                                      |
| Große OpenClaw-Kataloge    | Viele geeignete Tools suchen und aufrufen, ohne jedes Schema an das Modell zu senden | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [Tool Search](/de/tools/tool-search)                                                             |

<Note>
Tool Search ist eine experimentelle Agentenoberfläche von OpenClaw. Läufe im Codex-Harness verwenden
den Codex-nativen Codemodus, die native Tool-Suche, verzögert bereitgestellte dynamische Tools und
verschachtelte Tool-Aufrufe anstelle von `tools.toolSearch`.
</Note>

## Von Plugins bereitgestellte Tools

Plugins können zusätzliche Tools registrieren. Plugin-Autoren binden Tools über
`api.registerTool(...)` und `contracts.tools` im Manifest ein; Einzelheiten zu den Verträgen finden Sie im
[Plugin-SDK](/de/plugins/sdk-overview) und im [Plugin-Manifest](/de/plugins/manifest).

Zu den häufig von Plugins bereitgestellten Tools gehören:

- [Diffs](/de/tools/diffs) zum Darstellen von Datei- und Markdown-Diffs
- [Widget anzeigen](/tools/show-widget) für eigenständiges Inline-SVG und -HTML im Webchat
- [LLM-Aufgabe](/de/tools/llm-task) für ausschließlich JSON-basierte Arbeitsschritte
- [Lobster](/de/tools/lobster) für typisierte Arbeitsabläufe mit fortsetzbaren Genehmigungen
- [Tokenjuice](/de/tools/tokenjuice) zum Komprimieren umfangreicher Ausgaben der Tools `exec` und `bash`
- [Tool Search](/de/tools/tool-search) zum Ermitteln und Aufrufen großer Tool-Kataloge,
  ohne jedes Schema in den Prompt aufzunehmen
- [Canvas](/de/plugins/reference/canvas) zur Steuerung von Node Canvas und zum A2UI-
  Rendering

## Zugriff und Genehmigungen konfigurieren

Die Tool-Richtlinie wird vor dem Modellaufruf durchgesetzt. Wenn eine Richtlinie ein Tool entfernt,
erhält das Modell das Schema dieses Tools für den aktuellen Durchlauf nicht. Ein Lauf kann Tools
aufgrund der globalen Konfiguration, der agentenspezifischen Konfiguration, der Kanalrichtlinie, von Provider-
Einschränkungen, Sandbox-Regeln, Kanal-/Laufzeitrichtlinien oder der Plugin-Verfügbarkeit verlieren.

- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) dokumentiert Tool-Profile,
  Zulassen-/Ablehnen-Listen, Provider-spezifische Einschränkungen, Schleifenerkennung und
  Provider-gestützte Tool-Einstellungen.
- [Exec-Genehmigungen](/de/tools/exec-approvals) dokumentiert die Genehmigungsrichtlinie
  für Host-Befehle.
- [Erhöhte Exec-Berechtigungen](/de/tools/elevated) dokumentiert die kontrollierte Ausführung außerhalb der
  Sandbox.
- [Sandbox im Vergleich zu Tool-Richtlinie und erhöhten Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
  erläutert, welche Ebene den Datei- und Prozesszugriff steuert.
- [Agentenspezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools)
  dokumentiert agentenspezifische Einschränkungen für delegierte Läufe.

## Funktionen erweitern

Wählen Sie den Erweiterungspfad anhand der Aufgabe, die OpenClaw ausführen soll:

- Installieren oder verwalten Sie ein vorhandenes Plugin mit [Plugins](/de/tools/plugin).
- Erstellen Sie eine neue Integration, einen Provider, einen Kanal, ein Tool oder einen Hook mit
  [Plugins erstellen](/de/plugins/building-plugins).
- Fügen Sie wiederverwendbare Agentenanweisungen mit [Skills](/de/tools/skills) und
  [Skills erstellen](/de/tools/creating-skills) hinzu oder passen Sie sie an.
- Verwenden Sie das [Plugin-SDK](/de/plugins/sdk-overview) und das
  [Plugin-Manifest](/de/plugins/manifest), wenn Sie Implementierungsverträge
  benötigen.

## Fehlende Tools beheben

Wenn das Modell ein Tool nicht sehen oder aufrufen kann, beginnen Sie mit der wirksamen Richtlinie für
den aktuellen Durchlauf:

1. Prüfen Sie das aktive Profil sowie `tools.allow` und `tools.deny` unter
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools).
2. Prüfen Sie Provider-spezifische Einschränkungen unter
   [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) und bestätigen Sie, dass der
   ausgewählte [Modell-Provider](/de/concepts/model-providers) die Tool-
   Struktur unterstützt.
3. Prüfen Sie Kanalberechtigungen, Sandbox-Status und erhöhte Zugriffsrechte unter
   [Sandbox im Vergleich zu Tool-Richtlinie und erhöhten Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
   und [Erhöhte Exec-Berechtigungen](/de/tools/elevated).
4. Prüfen Sie unter [Plugins](/de/tools/plugin), ob das zuständige Plugin installiert und aktiviert ist.
5. Prüfen Sie bei delegierten Läufen die agentenspezifischen Einschränkungen unter
   [Agentenspezifische Sandbox- und Tool-Einschränkungen](/de/tools/multi-agent-sandbox-tools).
6. Prüfen Sie bei großen OpenClaw-Katalogen, ob der Lauf eine direkte Tool-
   Bereitstellung oder [Tool Search](/de/tools/tool-search) verwendet.

## Verwandte Themen

- [Automatisierung](/de/automation) für Cron, Aufgaben, Heartbeat, Verpflichtungen, Hooks,
  Daueraufträge und TaskFlow
- [Agenten](/de/concepts/agent) für das Agentenmodell, Sitzungen, Speicher und
  die Koordination mehrerer Agenten
- [Tools und benutzerdefinierte Provider](/de/gateway/config-tools) als maßgebliche Referenz
  für Tool-Richtlinien
- [Plugins](/de/tools/plugin) für die Installation und Verwaltung von Plugins
- [Plugin-SDK](/de/plugins/sdk-overview) als Referenz für Plugin-Autoren
- [Skills](/de/tools/skills) für Ladereihenfolge, Zugriffssteuerung und Konfiguration von Skills
- [Skill-Workshop](/de/tools/skill-workshop) für die generierte und überprüfte Erstellung
  von Skills
- [Tool-Suche](/de/tools/tool-search) für die kompakte Suche im Tool-Katalog
  von OpenClaw
