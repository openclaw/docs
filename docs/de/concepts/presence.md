---
read_when:
    - Live-Status auf der Seite „Geräte“ der Control UI debuggen
    - Untersuchung doppelter oder veralteter Instanzzeilen
    - Ändern der Gateway-WS-Verbindungs- oder Systemereignis-Beacons
summary: Wie OpenClaw-Präsenzeinträge erstellt, zusammengeführt und angezeigt werden
title: Präsenz
x-i18n:
    generated_at: "2026-07-16T12:57:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw-„Präsenz“ ist eine leichtgewichtige Best-Effort-Ansicht von:

- dem **Gateway** selbst und
- **für Benutzer sichtbaren Clients, die mit dem Gateway verbunden sind** (Mac-App, WebChat, Nodes usw.)

Die Präsenz zeigt Live-Verbindungsmetadaten auf der Seite **Devices** der Control UI
(unter **Settings → Devices**) und auf der Registerkarte **Instances** der macOS-App an.

Diese Seite behandelt die Client-Liste des Gateways. Informationen dazu, wie der zuletzt
verwendete Mac erkannt wird und Node-Benachrichtigungen dorthin weitergeleitet werden, finden Sie unter
[Präsenz des aktiven Computers](/de/nodes/presence).

## Präsenzfelder (was angezeigt wird)

Präsenzeinträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Client-Identität (normalerweise `connect.client.instanceId`)
- `host`: benutzerfreundlicher Hostname
- `ip`: Best-Effort-IP-Adresse
- `version`: Client-Versionszeichenfolge
- `deviceFamily` / `modelIdentifier`: Hardware-Hinweise
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: Sekunden seit der letzten Benutzereingabe, sofern bekannt
- `reason`: frei formatierbare, vom Client bereitgestellte Zeichenfolge; das Gateway selbst gibt nur `self`, `connect` und `disconnect` aus
- `deviceId`, `roles`, `scopes`: Geräteidentität sowie Rollen-/Bereichshinweise aus dem Verbindungs-Handshake
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit der Epoche)

## Erzeuger (woher die Präsenz stammt)

Präsenzeinträge werden von mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Selbsteintrag des Gateways

Das Gateway legt beim Start immer einen „Selbst“-Eintrag an, damit Benutzeroberflächen den Gateway-Host anzeigen,
noch bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach einem erfolgreichen Handshake
fügt das Gateway einen Präsenzeintrag für diese Verbindung ein oder aktualisiert ihn.

#### Warum kurzlebige Control-Plane-Verbindungen nicht angezeigt werden

CLI-Befehle, Backend-RPC-Clients und Prüfprogramme stellen häufig nur kurzzeitig eine Verbindung her. Um zu vermeiden,
dass diese Fluktuation während der gesamten Präsenz-TTL beibehalten wird, werden Clients im Modus `cli`, `backend`
oder `probe` **nicht** in Präsenzeinträge umgewandelt. Clients im Testmodus
werden weiterhin verfolgt, da Testsuiten sie als Stellvertreter für echte Clients verwenden.

### 3) `system-event`-Beacons

Clients können über die Methode `system-event` umfangreichere periodische Beacons senden. Die Mac-App
verwendet dies, um Hostname, IP und `lastInputSeconds` zu melden.

### 4) Node-Verbindungen (Rolle: Node)

Wenn sich ein Node über den Gateway-WebSocket mit `role: node` verbindet, fügt das Gateway
einen Präsenzeintrag für diesen Node ein oder aktualisiert ihn (derselbe Ablauf wie bei anderen WS-Clients).

## Zusammenführungs- und Deduplizierungsregeln (warum `instanceId` wichtig ist)

Präsenzeinträge werden in einer einzigen In-Memory-Map gespeichert und ohne Beachtung der Groß-/Kleinschreibung
nach dem ersten verfügbaren Wert in folgender Reihenfolge indiziert: ID eines gekoppelten Geräts, `connect.client.instanceId`
oder als letzte Möglichkeit die verbindungsspezifische ID.

Kurzlebige Control-Plane-Clients werden vollständig von der Verfolgung ausgeschlossen (siehe
oben), sodass ihre Verbindungs-IDs niemals zu Schlüsseln werden. Bei jedem anderen Client führt
der Rückgriff auf die Verbindungs-ID dazu, dass ein Client, der sich ohne stabile
`instanceId` erneut verbindet, als **doppelte** Zeile angezeigt wird.

## TTL und begrenzte Größe

Die Präsenz ist bewusst kurzlebig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden entfernt
- **Maximale Anzahl Einträge:** 200 (die ältesten werden zuerst verworfen)

Dadurch bleibt die Liste aktuell und ein unbegrenztes Speicherwachstum wird vermieden.

## Einschränkung bei Remote-Verbindungen/Tunneln (Loopback-IPs)

Wenn sich ein Client über einen SSH-Tunnel bzw. eine lokale Portweiterleitung verbindet, sieht das Gateway
die Remote-Adresse möglicherweise als `127.0.0.1`. Damit diese Tunneladresse nicht
als IP-Adresse des Clients aufgezeichnet wird, lässt die Verbindungsverarbeitung `ip` für
als lokal erkannte Clients (Loopback) vollständig aus, anstatt die Loopback-Adresse
in den Eintrag zu schreiben.

## Verbraucher

### Seite „Devices“ der Control UI

Die Seite **Devices** verknüpft `system-presence` mit dauerhaften Kopplungs- und Node-
Datensätzen. Sie fixiert den Selbst-Beacon des Gateways an erster Stelle und verwendet übereinstimmende Geräte-
oder Instanz-IDs für Live-Metadaten zu Plattform, Version, Modell und Aktualität der Eingabe.

### Registerkarte „Instances“ unter macOS

Die macOS-App stellt die Ausgabe von `system-presence` dar und zeigt abhängig vom Alter
der letzten Aktualisierung einen kleinen Statusindikator (Active/Idle/Stale) an.

## Tipps zur Fehlerbehebung

- Um die Rohdatenliste anzuzeigen, rufen Sie `system-presence` am Gateway auf.
- Wenn doppelte Einträge angezeigt werden:
  - Bestätigen Sie, dass Clients beim Handshake eine stabile `client.instanceId` senden
  - Bestätigen Sie, dass periodische Beacons dieselbe `instanceId` verwenden
  - Prüfen Sie, ob dem aus der Verbindung abgeleiteten Eintrag `instanceId` fehlt (doppelte Einträge sind zu erwarten)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz des aktiven Computers" href="/de/nodes/presence" icon="computer-mouse">
    Wie physische Eingaben am Mac einen aktiven Node auswählen und Verbindungsbenachrichtigungen weiterleiten.
  </Card>
  <Card title="Tippindikatoren" href="/de/concepts/typing-indicators" icon="ellipsis">
    Wann Tippindikatoren gesendet werden und wie sie angepasst werden können.
  </Card>
  <Card title="Streaming und Aufteilung" href="/de/concepts/streaming" icon="bars-staggered">
    Ausgehendes Streaming, Aufteilung und kanalspezifische Formatierung.
  </Card>
  <Card title="Gateway-Architektur" href="/de/concepts/architecture" icon="diagram-project">
    Gateway-Komponenten und das WebSocket-Protokoll, das Präsenzaktualisierungen steuert.
  </Card>
  <Card title="Gateway-Protokoll" href="/de/gateway/protocol" icon="plug">
    Das Übertragungsprotokoll für `connect`, `system-event` und `system-presence`.
  </Card>
</CardGroup>
