---
read_when:
    - Sie entwickeln eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert
    - Sie wählen zwischen Gateway-RPC und dem Plugin SDK.
    - Sie integrieren Gateway-Agentenläufe, Sitzungen, Ereignisse, Genehmigungen, Modelle oder Tools.
    - Sie koppeln einen Hosting-Controller mit einem externen Aktivierungsplaner.
sidebarTitle: External apps
summary: Aktueller Integrationsweg für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: Gateway-Integrationen für externe Apps
x-i18n:
    generated_at: "2026-07-24T03:48:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 276c6f4173197683a60770327e131e6ab2fa4d33f416ba96c170539df7246f83
    source_path: gateway/external-apps.md
    workflow: 16
---

Externe Apps kommunizieren über das Gateway-Protokoll mit OpenClaw: WebSocket-
Transport plus RPC-Methoden. Verwenden Sie es, wenn ein Skript, Dashboard, CI-Job, eine IDE-
Erweiterung oder ein anderer Prozess Agent-Ausführungen starten, Ereignisse streamen, auf
Ergebnisse warten, Arbeit abbrechen oder Gateway-Ressourcen untersuchen soll.

<Note>
  Beginnen Sie für npm-Pakete, Gerätekopplung, Wiederherstellung nach Verbindungsabbrüchen, Verlauf, Abonnements
  und Genehmigungen mit
  [Erstellen eines Gateway-Clients](https://docs.openclaw.ai/gateway/clients). Wenn Ihre
  App das Gateway als untergeordneten Prozess überwacht, lesen Sie außerdem
  [Einbetten von OpenClaw](https://docs.openclaw.ai/gateway/embedding). Während der
  anfänglichen Paketbereitstellung gibt npm möglicherweise `E404` zurück, bis die erste OpenClaw-Version
  mit Paketen veröffentlicht wurde.
</Note>

<Note>
  Diese Seite gilt für Code außerhalb des OpenClaw-Prozesses. Plugin-Code, der
  innerhalb von OpenClaw ausgeführt wird, sollte stattdessen dokumentierte `openclaw/plugin-sdk/*`-Unterpfade verwenden.
</Note>

## Was derzeit verfügbar ist

| Oberfläche                                                        | Status                | Verwendungszweck                                                                              |
| ---------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| [Gateway-Client-Leitfaden](https://docs.openclaw.ai/gateway/clients) | Veröffentlichungszyklus | npm-Pakete, Authentifizierung, Wiederverbindung, Verlauf, Ereignisse, Genehmigungen und Versionsrichtlinie. |
| [Leitfaden zum Einbetten](https://docs.openclaw.ai/gateway/embedding) | Veröffentlichungszyklus | Umgebung untergeordneter Prozesse, Bereitschaft, Lebenszyklus, Wiederherstellung, RPC-Verantwortung und Paketierung. |
| [Gateway-Protokoll](/de/gateway/protocol)                            | Bereit                | WebSocket-Transport, Verbindungs-Handshake, Authentifizierungsbereiche, Protokollversionierung und Ereignisse. |
| [Gateway-RPC-Referenz](/de/reference/rpc)                            | Bereit                | Aktuelle Gateway-Methoden für Agenten, Sitzungen, Aufgaben, Modelle, Tools, Artefakte und Genehmigungen. |
| [`openclaw agent`](/de/cli/agent)                                   | Bereit                | Einmalige Skriptintegration, wenn der Aufruf der CLI über die Shell ausreicht.                 |
| [`openclaw message`](/de/cli/message)                               | Bereit                | Senden von Nachrichten oder Kanalaktionen aus Skripten.                                       |

## Empfohlener Ablauf

1. Führen Sie ein Gateway aus oder ermitteln Sie eines.
2. Stellen Sie über das [Gateway-Protokoll](/de/gateway/protocol) eine Verbindung her.
3. Rufen Sie dokumentierte RPC-Methoden aus der [Gateway-RPC-Referenz](/de/reference/rpc) auf.
4. Fixieren Sie die OpenClaw-Version, mit der Sie testen.
5. Prüfen Sie beim Upgrade von OpenClaw die RPC-Referenz erneut.

Beginnen Sie für Agent-Ausführungen mit dem RPC `agent` und kombinieren Sie ihn für ein
abschließendes Ergebnis mit `agent.wait`. Verwenden Sie für dauerhaften Konversationszustand die Methoden `sessions.*`.
Abonnieren Sie für UI-Integrationen Gateway-Ereignisse und stellen Sie nur die Ereignisfamilien
dar, die Ihre App versteht.

## Kooperative Host-Suspendierung

Hosting-Controller, die einen laufenden Prozess einfrieren oder einen Snapshot davon erstellen, können den
hostneutralen Suspendierungs-Handshake verwenden:

1. Unterbinden Sie die Annahme externen, vom Host gesteuerten eingehenden Datenverkehrs.
2. Rufen Sie `gateway.suspend.prepare` mit einer stabilen, eindeutigen `requestId` auf.
3. Wenn die Antwort `busy` lautet, lassen Sie den Prozess weiterlaufen und versuchen Sie es später erneut.
4. Wenn sie `ready` lautet, speichern Sie die zurückgegebene `suspensionId` und frieren Sie den Prozess dann vor
   `expiresAtMs` ein oder erstellen Sie einen Snapshot.
5. Rufen Sie nach dem Auftauen oder bei Abbruch der Suspendierung `gateway.suspend.resume`
   mit dieser `suspensionId` über den bestehenden WebSocket- oder Admin-HTTP-Steuerungspfad
   auf.

Ein vorbereitetes Gateway lehnt neue WebSocket-Handshakes ab. Ein WebSocket-Controller
muss seine authentifizierte Verbindung während des Host-Vorgangs offen halten. Wenn dies
nicht garantiert werden kann, aktivieren und verwenden Sie vor der Vorbereitung das
[Admin-HTTP-RPC-Plugin](/de/plugins/admin-http-rpc). Wenn der
Steuerungspfad verloren geht, warten Sie vor dem erneuten Verbindungsaufbau, bis die zweiminütige Lease
abläuft; nach Ablauf wird die Annahme automatisch wieder geöffnet.

Der RPC-Vertrag lautet:

- `gateway.suspend.prepare` — `operator.admin`; Parameter
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; Parameter
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; Parameter
  `{ "suspensionId": "id-from-prepare" }`

IDs werden von umgebenden Leerzeichen bereinigt, müssen ein Zeichen enthalten, das kein Leerzeichen ist, und sind auf
128 Zeichen begrenzt. Ein Vorbereitungsergebnis bei Auslastung enthält `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` und `blockers`. Ein Bereitschaftsergebnis hat folgende Form:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Der Status gibt `{"status":"running"}` oder ein Bereitschaftsergebnis mit `expiresAtMs` zurück.
Die Wiederaufnahme gibt `{"ok":true,"status":"running","resumed":true}` zurück; eine Wiederholung
nach einer erfolgreichen Wiederaufnahme gibt `resumed: false` zurück.

Eine konkurrierende Anforderungs-ID oder ein vorübergehender Fehler bei der Wiederaufnahme des Schedulers gibt den wiederholbaren
Fehler `UNAVAILABLE` mit `retryAfterMs` zurück. Während der Scheduler-Wiederherstellung geben Vorbereitung, Status
und Wiederaufnahme jeweils diesen Fehler zurück, das Gateway bleibt nicht bereit und
nach dem Fail-Closed-Prinzip geschlossen, und der Host darf es weder einfrieren noch einen Snapshot erstellen. OpenClaw versucht die
Scheduler-Wiederherstellung automatisch erneut und öffnet die Annahme erst wieder, wenn die Wiederherstellung erfolgreich war. Eine
nicht übereinstimmende Wiederaufnahme-ID gibt `INVALID_REQUEST` zurück. Die Vorbereitung teilt sich das
Kontrollebenen-Schreibbudget des Gateways von drei Versuchen pro Minute; beachten Sie die zurückgegebene
Wiederholungsverzögerung. WebSocket-Clients werden nach Gerät und IP gruppiert. Admin-HTTP-
Controller werden nach der aufgelösten Client-IP gruppiert, sodass Controller hinter demselben
Proxy ein Budget gemeinsam nutzen können.

Die Vorbereitung dient ausschließlich der Ablehnung: OpenClaw schließt die Annahme neuer Root-/Sitzungs-/Befehlsvorgänge,
pausiert automatische Cron-Takte und prüft laufende Arbeit synchron. Wenn etwas
aktiv ist, setzt es den Scheduler fort und öffnet die Annahme wieder, bevor
`busy` zurückgegeben wird; diese Arbeit wird weder unterbrochen noch abgearbeitet. Eine Bereitschafts-Lease gilt zwei
Minuten. Das Wiederholen von `prepare` mit derselben `requestId` verlängert sie; bei Ablauf wird
der Scheduler fortgesetzt, bevor die Annahme wieder geöffnet wird.
Eine während einer Bereitschafts-Lease fällig werdende Neustartauslösung wartet, bis die Lease
fortgesetzt wird; ein bereits laufender Neustart bewirkt, dass die Vorbereitung `busy` zurückgibt.

Im Bereitschaftszustand bleibt `/healthz` aktiv und `/readyz` gibt `503` zurück. Lokale oder
authentifizierte Bereitschaftsantworten enthalten `gateway-draining`; nicht authentifizierte
Remote-Prüfungen erhalten nur `{ "ready": false }`. Die HTTP-Zustandsprüfung,
Suspendierungsmethoden auf bestehenden WebSocket-Verbindungen und eine bereits aktivierte
Admin-HTTP-RPC-Route bleiben verfügbar. Andere RPCs geben den wiederholbaren Fehler
`UNAVAILABLE` zurück. Integrierte HTTP-Routen für Benutzerarbeit und gewöhnliche Plugin-HTTP-Routen,
einschließlich OpenAI-kompatibler APIs, Tool-/Sitzungsvorgänge, Node-Überwachungen und
konfigurierter Hooks, geben `503` mit `error.code: "gateway_unavailable"` zurück. Neue
Plugin-eigene WebSocket-Upgrades geben ebenfalls `503` zurück; dies betrifft die Zuständigkeit
für das Upgrade, nicht später über einen bestehenden Plugin-Socket ausgeführte Arbeit.

Dieser Handshake speichert keine eingehenden Nachrichten dauerhaft, stoppt keine Kanaltransporte
von Drittanbietern und steuert nicht die Hosting-Plattform. Der Host muss seinen eingehenden Datenverkehr
vor der Vorbereitung abschirmen und bleibt für Aktivierung, Snapshot/Einfrieren und
Beenden verantwortlich. `activeCount` ist die aggregierte Anzahl erfasster Arbeitsvorgänge, während `blockers`
die von null verschiedenen Kategorieanzahlen und begrenzte Aufgabendetails enthält. Dies ist keine
allgemeine Barriere für den Ruhezustand eines Prozesses. Ein Blocker `background-exec` ist ausschließlich
aggregiert: Befehlstext, Prozess-IDs, Ausgabe sowie Sitzungs- oder Bereichskennungen werden niemals
über das Protokoll übertragen. Kanalzustand, Wartung, Cache-Aktualisierung, bestehende
Plugin-WebSocket-Sitzungen und nicht registrierte Plugin-eigene Hintergrundarbeit können
aktiv bleiben.
Die Hosting-Plattform muss den vollständigen Prozessbaum und sein
Dateisystem konsistent einfrieren oder als Snapshot erfassen; bei nicht registrierter Arbeit kann durch diesen ersten
Vertrag kein Leerlauf nachgewiesen werden.

<Tip>
  Belassen Sie für die Aktivierungsplanung des Hosts den OpenClaw-seitigen Teil in einem prozessinternen
  Plugin und übertragen Sie idempotente vollständige Snapshots an den externen Hostadapter.
  Der Hosting-Controller sollte weder das Plugin SDK importieren noch den Cron-
  Zustand aus Ereignisdeltas rekonstruieren. Siehe [Sichere externe Cron-
  Projektion](/de/plugins/hooks#safe-external-cron-projection).
</Tip>

## App-Code im Vergleich zu Plugin-Code

Verwenden Sie Gateway-RPC, wenn sich der Code außerhalb von OpenClaw befindet:

- Node-Skripte, die Agent-Ausführungen starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Administrationsoberflächen
- IDE-Erweiterungen
- externe Brücken, die nicht zu Kanal-Plugins werden müssen
- Integrationstests mit simulierten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw ausgeführt wird:

- Provider-Plugins
- Kanal-Plugins
- Tool- oder Lebenszyklus-Hooks
- Plugins für Agent-Harnesses
- vertrauenswürdige Laufzeithelfer

Externe Apps sollten `openclaw/plugin-sdk/*` nicht importieren; diese Unterpfade sind für
Plugins vorgesehen, die von OpenClaw geladen werden.

## Verwandte Themen

- [Erstellen eines Gateway-Clients](https://docs.openclaw.ai/gateway/clients)
- [Einbetten von OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [CLI-Agent-Befehl](/de/cli/agent)
- [CLI-Nachrichtenbefehl](/de/cli/message)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
