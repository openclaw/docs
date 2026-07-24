---
read_when:
    - Live-Status auf der Seite „Geräte“ der Control UI debuggen
    - Untersuchung doppelter oder veralteter Instanzzeilen
    - Ändern der Gateway-WS-Verbindungs- oder Systemereignis-Beacons
summary: Wie OpenClaw-Präsenzeinträge erzeugt, zusammengeführt und angezeigt werden
title: Präsenz
x-i18n:
    generated_at: "2026-07-24T03:47:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac5800eebddb82e69a7d0c06733e6a19addbc57be7776e7361411866af0c60f5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw-„Präsenz“ ist eine leichtgewichtige Best-Effort-Ansicht von:

- dem **Gateway** selbst und
- **für Benutzer sichtbaren, mit dem Gateway verbundenen Clients** (Mac-App, WebChat, Nodes usw.)

Die Präsenz zeigt Live-Verbindungsmetadaten auf der Seite **Devices** der Control UI
(unter **Settings → Devices**) und im Tab **Instances** der macOS-App an.

Diese Seite behandelt die Client-Liste des Gateways. Informationen dazu, wie der zuletzt
verwendete Mac erkannt wird und Node-Warnmeldungen dorthin weitergeleitet werden, finden Sie unter
[Präsenz des aktiven Computers](/de/nodes/presence).

## Präsenzfelder (was angezeigt wird)

Präsenzeinträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Client-Identität (normalerweise `connect.client.instanceId`)
- `host`: benutzerfreundlicher Hostname
- `ip`: Best-Effort-IP-Adresse
- `version`: Client-Versionszeichenfolge
- `deviceFamily` / `modelIdentifier`: Hardwarehinweise
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: Sekunden seit der letzten Benutzereingabe, sofern bekannt
- `reason`: frei formatierbare, vom Client bereitgestellte Zeichenfolge; das Gateway selbst gibt nur `self`, `connect` und `disconnect` aus
- `deviceId`, `roles`, `scopes`: Geräteidentität sowie Rollen-/Bereichshinweise aus dem Verbindungs-Handshake
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit der Epoche)

## Erzeuger (woher die Präsenz stammt)

Präsenzeinträge werden von mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Selbsteintrag des Gateways

Das Gateway legt beim Start immer einen „Selbst“-Eintrag an, damit Benutzeroberflächen den Gateway-Host
bereits anzeigen, bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach einem erfolgreichen Handshake
fügt das Gateway für diese Verbindung einen Präsenzeintrag ein oder aktualisiert ihn.

#### Warum kurzlebige Control-Plane-Verbindungen nicht angezeigt werden

CLI-Befehle, Backend-RPC-Clients und Prüfsonden stellen häufig nur kurzzeitig eine Verbindung her. Damit
diese Fluktuation nicht für die gesamte Präsenz-TTL gespeichert wird, werden Clients im Modus `cli`, `backend`
oder `probe` **nicht** in Präsenzeinträge umgewandelt. Clients im Testmodus
werden weiterhin verfolgt, da Testsuiten sie als Stellvertreter für echte Clients verwenden.

### 3) `system-event`-Beacons

Clients können über die Methode `system-event` umfangreichere regelmäßige Beacons senden. Die Mac-
App verwendet dies, um Hostname, IP-Adresse, Version und Verfügbarkeitsmetadaten zu melden. Physische
Eingabeaktivität ist nicht Bestandteil dieses generischen Beacons; dafür ist das zweckspezifische native
Node-Ereignis zuständig, das unter [Präsenz des aktiven Computers](/de/nodes/presence) beschrieben wird. Der
Mac versieht diese Beacons mit `system-presence-clear-last-input`; aktuelle Gateways
verwenden diese abwärtskompatible Kennzeichnung, um die von einer älteren App gespeicherte Aktualität von
Eingaben zu entfernen. Der Beacon enthält außerdem einen festen Wert von 30 Tagen, damit ältere Gateways,
die die Kennzeichnung ignorieren, die genaue Aktualität überschreiben, anstatt sie beizubehalten. Für
diesen Kompatibilitätswert wird keine neue Aktivität erfasst.

### 4) Node-Verbindungen (Rolle: Node)

Wenn sich ein Node über den Gateway-WebSocket mit `role: node` verbindet, fügt das Gateway
einen Präsenzeintrag für diesen Node ein oder aktualisiert ihn (derselbe Ablauf wie bei anderen WS-Clients).

## Regeln für Zusammenführung und Deduplizierung (warum `instanceId` wichtig ist)

Präsenzeinträge werden in einer einzigen In-Memory-Map gespeichert. Die Schlüssel werden ohne Beachtung der Groß-/Kleinschreibung
anhand des ersten verfügbaren Werts in dieser Reihenfolge gebildet: eine gekoppelte Geräte-ID, `connect.client.instanceId`
oder als letzte Möglichkeit die verbindungsspezifische ID.

Kurzlebige Control-Plane-Clients werden vollständig von der Verfolgung ausgeschlossen (siehe
oben), sodass ihre Verbindungs-IDs niemals als Schlüssel verwendet werden. Bei jedem anderen Client führt die
Ausweichlösung mit der Verbindungs-ID dazu, dass ein Client, der sich ohne stabile
`instanceId` erneut verbindet, als **doppelte** Zeile angezeigt wird.

## TTL und begrenzte Größe

Die Präsenz ist bewusst kurzlebig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden entfernt
- **Maximale Anzahl Einträge:** 200 (die ältesten werden zuerst entfernt)

Dadurch bleibt die Liste aktuell und ein unbegrenztes Speicherwachstum wird vermieden.

## Einschränkung bei Remote-Verbindungen/Tunneln (Loopback-IPs)

Wenn sich ein Client über einen SSH-Tunnel bzw. eine lokale Portweiterleitung verbindet, sieht das Gateway
die Remote-Adresse möglicherweise als `127.0.0.1`. Damit diese Tunneladresse nicht
als IP-Adresse des Clients gespeichert wird, lässt die Verbindungsverarbeitung `ip` bei
als lokal erkannten Clients (Loopback) vollständig weg, anstatt die Loopback-Adresse
in den Eintrag zu schreiben.

## Verbraucher

### Seite „Devices“ der Control UI

Die Seite **Devices** verknüpft `system-presence` mit dauerhaften Kopplungs- und Node-
Datensätzen. Sie fixiert den Selbst-Beacon des Gateways an erster Stelle und verwendet übereinstimmende Geräte- oder
Instanz-IDs für Live-Metadaten zu Plattform, Version, Modell und Aktualität der Eingaben.

### Tab „Instances“ unter macOS

Die macOS-App stellt die Ausgabe von `system-presence` dar und zeigt anhand des Alters
der letzten Aktualisierung einen kleinen Statusindikator (Aktiv/Inaktiv/Veraltet) an.

## Tipps zur Fehlerbehebung

- Um die Rohdatenliste anzuzeigen, rufen Sie `system-presence` am Gateway auf.
- Wenn doppelte Einträge angezeigt werden:
  - Prüfen Sie, ob Clients beim Handshake eine stabile `client.instanceId` senden
  - Prüfen Sie, ob regelmäßige Beacons dieselbe `instanceId` verwenden
  - Prüfen Sie, ob im aus der Verbindung abgeleiteten Eintrag `instanceId` fehlt (doppelte Einträge sind dann zu erwarten)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz des aktiven Computers" href="/de/nodes/presence" icon="computer-mouse">
    Wie physische Eingaben am Mac einen aktiven Node auswählen und Verbindungswarnmeldungen weiterleiten.
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
