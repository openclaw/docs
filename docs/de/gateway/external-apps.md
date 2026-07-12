---
read_when:
    - Sie entwickeln eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert.
    - Sie wählen zwischen Gateway-RPC und dem Plugin-SDK.
    - Sie integrieren Gateway-Agent-Ausführungen, Sitzungen, Ereignisse, Genehmigungen, Modelle oder Tools.
    - Sie koppeln einen Hosting-Controller mit einem externen Aktivierungsplaner.
sidebarTitle: External apps
summary: Aktueller Integrationspfad für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: Gateway-Integrationen für externe Apps
x-i18n:
    generated_at: "2026-07-12T01:38:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Externe Anwendungen kommunizieren über das Gateway-Protokoll mit OpenClaw: WebSocket-
Transport sowie RPC-Methoden. Verwenden Sie es, wenn ein Skript, Dashboard, CI-Job, eine IDE-
Erweiterung oder ein anderer Prozess Agent-Ausführungen starten, Ereignisse streamen, auf
Ergebnisse warten, Arbeit abbrechen oder Gateway-Ressourcen untersuchen soll.

<Warning>
  Es gibt noch kein öffentliches npm-Clientpaket. Fügen Sie keine Namen von
  OpenClaw-Clientpaketen als Anwendungsabhängigkeiten hinzu, bevor die
  Versionshinweise ein veröffentlichtes Paket ankündigen und diese Seite
  Installationsanweisungen enthält.
</Warning>

<Note>
  Diese Seite gilt für Code außerhalb des OpenClaw-Prozesses. Plugin-Code, der
  innerhalb von OpenClaw ausgeführt wird, sollte stattdessen die dokumentierten
  Unterpfade von `openclaw/plugin-sdk/*` verwenden.
</Note>

## Was derzeit verfügbar ist

| Oberfläche                              | Status      | Verwendungszweck                                                                               |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| [Gateway-Protokoll](/de/gateway/protocol)  | Verfügbar   | WebSocket-Transport, Verbindungs-Handshake, Authentifizierungsbereiche, Protokollversionierung und Ereignisse. |
| [Gateway-RPC-Referenz](/de/reference/rpc)  | Verfügbar   | Aktuelle Gateway-Methoden für Agenten, Sitzungen, Aufgaben, Modelle, Werkzeuge, Artefakte und Genehmigungen. |
| [`openclaw agent`](/de/cli/agent)          | Verfügbar   | Einmalige Skriptintegration, wenn der Aufruf der CLI über die Shell ausreicht.                  |
| [`openclaw message`](/de/cli/message)      | Verfügbar   | Senden von Nachrichten oder Kanalaktionen aus Skripten.                                        |

An einem zukünftigen Clientbibliothekspaket wird intern gearbeitet, es ist
jedoch noch keine öffentliche Installationsschnittstelle. Betrachten Sie es als
Implementierungsdetail einer Vorschau, bis eine Version ein veröffentlichtes,
versioniertes Paket ankündigt.

## Empfohlenes Vorgehen

1. Führen Sie ein Gateway aus oder ermitteln Sie eines.
2. Stellen Sie über das [Gateway-Protokoll](/de/gateway/protocol) eine Verbindung her.
3. Rufen Sie dokumentierte RPC-Methoden aus der [Gateway-RPC-Referenz](/de/reference/rpc) auf.
4. Legen Sie die OpenClaw-Version fest, gegen die Sie testen.
5. Prüfen Sie beim Aktualisieren von OpenClaw erneut die RPC-Referenz.

Beginnen Sie für Agent-Ausführungen mit dem RPC `agent` und kombinieren Sie ihn
mit `agent.wait`, um ein abschließendes Ergebnis zu erhalten. Verwenden Sie für
dauerhaften Konversationszustand die Methoden `sessions.*`. Abonnieren Sie für
UI-Integrationen Gateway-Ereignisse und stellen Sie nur die Ereignisfamilien
dar, die Ihre Anwendung versteht.

## Kooperative Host-Suspendierung

Hosting-Controller, die einen laufenden Prozess einfrieren oder einen Snapshot
davon erstellen, können den hostneutralen Suspendierungs-Handshake verwenden:

1. Lassen Sie keinen weiteren vom Host gesteuerten externen Eingangsdatenverkehr zu.
2. Rufen Sie `gateway.suspend.prepare` mit einer stabilen, eindeutigen `requestId` auf.
3. Wenn die Antwort `busy` lautet, lassen Sie den Prozess weiterlaufen und versuchen Sie es später erneut.
4. Wenn sie `ready` lautet, speichern Sie die zurückgegebene `suspensionId` und
   frieren Sie den Prozess vor `expiresAtMs` ein oder erstellen Sie einen Snapshot.
5. Rufen Sie nach dem Fortsetzen oder bei Abbruch der Suspendierung
   `gateway.suspend.resume` mit dieser `suspensionId` über die bestehende
   WebSocket-Verbindung oder den Admin-HTTP-Steuerpfad auf.

Ein vorbereitetes Gateway lehnt neue WebSocket-Handshakes ab. Ein
WebSocket-Controller muss seine authentifizierte Verbindung während des
Hostvorgangs offen halten. Wenn dies nicht gewährleistet werden kann,
aktivieren und verwenden Sie vor der Vorbereitung das
[Admin-HTTP-RPC-Plugin](/de/plugins/admin-http-rpc). Wenn der Steuerpfad verloren
geht, warten Sie vor dem erneuten Verbindungsaufbau, bis die zweiminütige Lease
abläuft; nach Ablauf wird die Annahme automatisch wieder geöffnet.

Der RPC-Vertrag lautet:

- `gateway.suspend.prepare` — `operator.admin`; Parameter
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; Parameter
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; Parameter
  `{ "suspensionId": "id-from-prepare" }`

IDs werden von umgebenden Leerzeichen bereinigt, müssen ein Zeichen enthalten,
das kein Leerraumzeichen ist, und sind auf 128 Zeichen begrenzt. Ein
`busy`-Ergebnis der Vorbereitung enthält `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` und `blockers`. Ein `ready`-Ergebnis hat folgende
Form:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Die Statusabfrage gibt `{"status":"running"}` oder ein `ready`-Ergebnis mit
`expiresAtMs` zurück. Das Fortsetzen gibt
`{"ok":true,"status":"running","resumed":true}` zurück; eine Wiederholung nach
erfolgreichem Fortsetzen gibt `resumed: false` zurück.

Eine konkurrierende Anfrage-ID oder ein vorübergehender Fehler beim Fortsetzen
des Schedulers gibt den wiederholbaren Fehler `UNAVAILABLE` mit `retryAfterMs`
zurück. Während der Wiederherstellung des Schedulers geben Vorbereitung,
Statusabfrage und Fortsetzung diesen Fehler zurück, das Gateway bleibt nicht
bereit und im geschlossenen Fehlerzustand, und der Host darf es weder
einfrieren noch einen Snapshot davon erstellen. OpenClaw versucht die
Wiederherstellung des Schedulers automatisch erneut und öffnet die Annahme erst
wieder, nachdem die Wiederherstellung erfolgreich war. Eine nicht
übereinstimmende ID beim Fortsetzen gibt `INVALID_REQUEST` zurück. Die
Vorbereitung teilt sich das Schreibbudget der Gateway-Steuerungsebene von drei
Versuchen pro Minute; beachten Sie die zurückgegebene Wartezeit. WebSocket-
Clients werden nach Gerät und IP gruppiert. Admin-HTTP-Controller werden nach
der ermittelten Client-IP gruppiert, sodass Controller hinter demselben Proxy
ein gemeinsames Budget verwenden können.

Die Vorbereitung dient ausschließlich der Ablehnung: OpenClaw schließt die
Annahme neuer Stamm-, Sitzungs- und Befehlsvorgänge, pausiert automatische
Cron-Takte und prüft die Arbeit synchron. Wenn etwas aktiv ist, setzt es den
Scheduler fort und öffnet die Annahme wieder, bevor es `busy` zurückgibt; es
unterbricht oder leert diese Arbeit nicht. Eine `ready`-Lease gilt zwei Minuten.
Eine Wiederholung von `prepare` mit derselben `requestId` verlängert sie; nach
Ablauf wird der Scheduler fortgesetzt, bevor die Annahme wieder geöffnet wird.
Eine während einer `ready`-Lease fällig werdende Neustartauslösung wartet, bis
die Lease fortgesetzt wird; bei einem laufenden Neustart gibt die Vorbereitung
`busy` zurück.

Im Zustand `ready` bleibt `/healthz` erreichbar und `/readyz` gibt `503`
zurück. Lokale oder authentifizierte Bereitschaftsantworten enthalten
`gateway-draining`; nicht authentifizierte entfernte Prüfungen erhalten nur
`{ "ready": false }`. Die HTTP-Zustandsprüfung, Suspendierungsmethoden über
bestehende WebSocket-Verbindungen und eine bereits aktivierte Admin-HTTP-RPC-
Route bleiben verfügbar. Andere RPCs geben den wiederholbaren Fehler
`UNAVAILABLE` zurück. Integrierte HTTP-Routen für Benutzerarbeit und gewöhnliche
Plugin-HTTP-Routen, einschließlich OpenAI-kompatibler APIs, Werkzeug- und
Sitzungsvorgänge, Node-Überwachungen und konfigurierter Hooks, geben `503` mit
`error.code: "gateway_unavailable"` zurück. Neue Plugin-eigene WebSocket-
Upgrades geben ebenfalls `503` zurück; dies betrifft die Zuständigkeit für das
Upgrade, nicht Arbeit, die später über einen bestehenden Plugin-Socket
ausgeführt wird.

Dieser Handshake speichert keine eingehenden Nachrichten dauerhaft, stoppt
keine Kanaltransporte von Drittanbietern und steuert nicht die Hosting-
Plattform. Der Host muss seinen Eingangsdatenverkehr vor der Vorbereitung
abschirmen und bleibt für Aufwecken, Snapshot beziehungsweise Einfrieren und
Beenden verantwortlich. `activeCount` ist die Gesamtzahl der nachverfolgten
Arbeitsvorgänge, während `blockers` die von null verschiedenen
Kategorienanzahlen und begrenzte Aufgabendetails enthält. Dies ist keine
allgemeine Barriere für den Ruhezustand des Prozesses. Ein
`background-exec`-Blockierer wird nur aggregiert dargestellt: Befehlstext,
Prozess-IDs, Ausgabe sowie Sitzungs- oder Bereichskennungen werden niemals über
das Protokoll übertragen. Kanalzustand, Wartung, Cache-Aktualisierung,
bestehende Plugin-WebSocket-Sitzungen und nicht registrierte Plugin-eigene
Hintergrundarbeit können aktiv bleiben.
Die Hosting-Plattform muss den vollständigen Prozessbaum und sein Dateisystem
konsistent einfrieren oder als Snapshot erfassen; mit diesem ersten Vertrag
kann nicht nachgewiesen werden, dass nicht registrierte Arbeit inaktiv ist.

<Tip>
  Belassen Sie für die Aufweckplanung des Hosts den OpenClaw-seitigen Teil in
  einem prozessinternen Plugin und projizieren Sie idempotente vollständige
  Snapshots an den externen Hostadapter. Der Hosting-Controller sollte weder
  das Plugin SDK importieren noch den Cron-Zustand aus Ereignisdeltas
  rekonstruieren. Siehe [Sichere externe Cron-
  Projektion](/de/plugins/hooks#safe-external-cron-projection).
</Tip>

## Anwendungscode im Vergleich zu Plugin-Code

Verwenden Sie Gateway-RPC, wenn sich der Code außerhalb von OpenClaw befindet:

- Node-Skripte, die Agent-Ausführungen starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Administrationsoberflächen
- IDE-Erweiterungen
- externe Brücken, die keine Kanal-Plugins werden müssen
- Integrationstests mit simulierten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw ausgeführt wird:

- Provider-Plugins
- Kanal-Plugins
- Werkzeug- oder Lebenszyklus-Hooks
- Plugins für Agent-Ausführungsumgebungen
- vertrauenswürdige Laufzeithilfen

Externe Anwendungen sollten `openclaw/plugin-sdk/*` nicht importieren; diese
Unterpfade sind für von OpenClaw geladene Plugins vorgesehen.

## Verwandte Themen

- [Gateway-Protokoll](/de/gateway/protocol)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [CLI-Agent-Befehl](/de/cli/agent)
- [CLI-Nachrichtenbefehl](/de/cli/message)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
