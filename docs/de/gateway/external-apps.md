---
read_when:
    - Sie erstellen eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert.
    - Sie wählen zwischen Gateway-RPC und dem Plugin SDK.
    - Sie integrieren Gateway-Agent-Ausführungen, Sitzungen, Ereignisse, Genehmigungen, Modelle oder Tools
sidebarTitle: External apps
summary: Aktueller Integrationspfad für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: Gateway-Integrationen für externe Apps
x-i18n:
    generated_at: "2026-06-27T17:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Externe Apps sollten heute über das Gateway-Protokoll mit OpenClaw kommunizieren. Verwenden Sie
Gateway WebSocket und RPC-Methoden, wenn ein Skript, Dashboard, CI-Job, eine IDE-
Erweiterung oder ein anderer Prozess Agent-Läufe starten, Ereignisse streamen, auf
Ergebnisse warten, Arbeit abbrechen oder Gateway-Ressourcen prüfen möchte.

<Warning>
  Es gibt noch kein öffentliches npm-Clientpaket. Fügen Sie keine OpenClaw-Clientpaket-
  Namen als Anwendungsabhängigkeiten hinzu, bis Release Notes ein veröffentlichtes
  Paket ankündigen und diese Seite Installationsanweisungen enthält.
</Warning>

<Note>
  Diese Seite ist für Code außerhalb des OpenClaw-Prozesses gedacht. Plugin-Code, der
  innerhalb von OpenClaw ausgeführt wird, sollte stattdessen die dokumentierten
  `openclaw/plugin-sdk/*`-Unterpfade verwenden.
</Note>

## Was heute verfügbar ist

| Oberfläche                             | Status | Verwenden Sie sie für                                                                         |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Gateway-Protokoll](/de/gateway/protocol) | Bereit | WebSocket-Transport, Connect-Handshake, Auth-Bereiche, Protokollversionierung und Ereignisse. |
| [Gateway-RPC-Referenz](/de/reference/rpc) | Bereit | Aktuelle Gateway-Methoden für Agents, Sitzungen, Aufgaben, Modelle, Tools, Artefakte und Genehmigungen. |
| [`openclaw agent`](/de/cli/agent)         | Bereit | Einmalige Skriptintegration, wenn der Aufruf über die CLI ausreicht.                          |
| [`openclaw message`](/de/cli/message)     | Bereit | Senden von Nachrichten oder Channel-Aktionen aus Skripten.                                    |

Der Quellbaum enthält interne Paketarbeit für eine zukünftige Clientbibliothek, aber
das ist keine öffentliche Installationsoberfläche. Behandeln Sie sie als Vorschau-
Implementierungsdetail, bis die Pakete veröffentlicht und versioniert sind.

## Empfohlener Weg

1. Führen Sie ein Gateway aus oder ermitteln Sie eines.
2. Stellen Sie eine Verbindung über das [Gateway-Protokoll](/de/gateway/protocol) her.
3. Rufen Sie dokumentierte RPC-Methoden aus der [Gateway-RPC-Referenz](/de/reference/rpc) auf.
4. Pinnen Sie die OpenClaw-Version, gegen die Sie testen.
5. Prüfen Sie die RPC-Referenz erneut, wenn Sie OpenClaw aktualisieren.

Für Agent-Läufe beginnen Sie mit dem `agent`-RPC und kombinieren ihn mit `agent.wait`, wenn
Sie ein terminales Ergebnis benötigen. Für dauerhaften Konversationszustand verwenden Sie die
`sessions.*`-Methoden. Für UI-Integrationen abonnieren Sie Gateway-Ereignisse und rendern nur die
Ereignisfamilien, die Ihre App versteht.

## App-Code vs. Plugin-Code

Verwenden Sie Gateway-RPC, wenn Code außerhalb von OpenClaw lebt:

- Node-Skripte, die Agent-Läufe starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Admin-Panels
- IDE-Erweiterungen
- externe Bridges, die nicht zu Channel-Plugins werden müssen
- Integrationstests mit gefälschten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw ausgeführt wird:

- Provider-Plugins
- Channel-Plugins
- Tool- oder Lifecycle-Hooks
- Agent-Harness-Plugins
- vertrauenswürdige Runtime-Hilfsfunktionen

Externe Apps sollten `openclaw/plugin-sdk/*` nicht importieren; diese Unterpfade sind für
Plugins, die von OpenClaw geladen werden.

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [CLI-Agent-Befehl](/de/cli/agent)
- [CLI-Nachrichtenbefehl](/de/cli/message)
- [Agent-Loop](/de/concepts/agent-loop)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agents](/de/tools/acp-agents)
- [Plugin SDK-Übersicht](/de/plugins/sdk-overview)
