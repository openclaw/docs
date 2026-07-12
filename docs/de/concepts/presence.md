---
read_when:
    - Fehlerbehebung beim Live-Status auf der Geräteseite der Control UI
    - Untersuchung doppelter oder veralteter Instanzzeilen
    - Ändern der Gateway-WS-Verbindungs- oder Systemereignis-Beacons
summary: Wie OpenClaw-Präsenzeinträge erzeugt, zusammengeführt und angezeigt werden
title: Anwesenheit
x-i18n:
    generated_at: "2026-07-12T15:16:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

Die „Präsenz“ von OpenClaw ist eine schlanke Best-Effort-Übersicht über:

- den **Gateway** selbst und
- **für Benutzer sichtbare Clients, die mit dem Gateway verbunden sind** (Mac-App, WebChat, Nodes usw.)

Die Präsenz zeigt Live-Verbindungsmetadaten auf der Seite **Geräte** der Control UI
und auf der Registerkarte **Instanzen** der macOS-App an.

Diese Seite behandelt die Client-Liste des Gateway. Informationen dazu, wie Sie den zuletzt
verwendeten Mac erkennen und Node-Benachrichtigungen dorthin weiterleiten, finden Sie unter
[Präsenz des aktiven Computers](/nodes/presence).

## Präsenzfelder (was angezeigt wird)

Präsenzeinträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Clientidentität (üblicherweise `connect.client.instanceId`)
- `host`: benutzerfreundlicher Hostname
- `ip`: nach bestem Bemühen ermittelte IP-Adresse
- `version`: Zeichenfolge mit der Clientversion
- `deviceFamily` / `modelIdentifier`: Hinweise zur Hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: Sekunden seit der letzten Benutzereingabe, sofern bekannt
- `reason`: frei formulierbare, vom Client bereitgestellte Zeichenfolge; der Gateway selbst gibt nur `self`, `connect` und `disconnect` aus
- `deviceId`, `roles`, `scopes`: Hinweise zur Geräteidentität sowie zu Rollen und Geltungsbereichen aus dem Verbindungs-Handshake
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit der Epoche)

## Erzeuger (woher die Präsenzdaten stammen)

Präsenzeinträge werden von mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Selbsteintrag des Gateway

Der Gateway legt beim Start immer einen „Selbst“-Eintrag an, damit Benutzeroberflächen den Gateway-Host
bereits anzeigen, bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach erfolgreichem Handshake
fügt der Gateway einen Präsenzeintrag für diese Verbindung ein oder aktualisiert ihn.

#### Warum kurzlebige Verbindungen der Steuerungsebene nicht angezeigt werden

CLI-Befehle, Backend-RPC-Clients und Prüf-Clients stellen häufig nur kurz eine Verbindung her. Damit
diese Fluktuation nicht während der gesamten Präsenz-TTL gespeichert wird, werden Clients im Modus `cli`, `backend`
oder `probe` **nicht** in Präsenzeinträge umgewandelt. Clients im Testmodus
werden weiterhin erfasst, da Testsuiten sie als Stellvertreter für echte Clients verwenden.

### 3) `system-event`-Signale

Clients können über die Methode `system-event` regelmäßig ausführlichere Signale senden. Die Mac-
App meldet damit den Hostnamen, die IP-Adresse und `lastInputSeconds`.

### 4) Node-Verbindungen (Rolle: Node)

Wenn sich ein Node über den Gateway-WebSocket mit `role: node` verbindet, fügt der Gateway
einen Präsenzeintrag für diesen Node ein oder aktualisiert ihn (derselbe Ablauf wie bei anderen WS-Clients).

## Regeln für Zusammenführung und Deduplizierung (warum `instanceId` wichtig ist)

Präsenzeinträge werden in einer einzigen In-Memory-Map gespeichert. Als Schlüssel wird ohne Beachtung der Groß-/Kleinschreibung
der erste verfügbare Wert in folgender Reihenfolge verwendet: eine gekoppelte Geräte-ID, `connect.client.instanceId`
oder als letzte Möglichkeit die verbindungsspezifische ID.

Kurzlebige Clients der Steuerungsebene werden vollständig von der Erfassung ausgeschlossen (siehe
oben), sodass ihre Verbindungs-IDs niemals als Schlüssel verwendet werden. Bei allen anderen Clients führt
die Ausweichlösung mit der Verbindungs-ID dazu, dass ein Client, der sich ohne stabile
`instanceId` erneut verbindet, als **doppelte** Zeile erscheint.

## TTL und begrenzte Größe

Die Präsenz ist bewusst kurzlebig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden entfernt
- **Maximale Einträge:** 200 (die ältesten werden zuerst entfernt)

Dadurch bleibt die Liste aktuell und ein unbegrenztes Speicherwachstum wird vermieden.

## Einschränkung bei Remote-Verbindungen/Tunneln (Loopback-IPs)

Wenn sich ein Client über einen SSH-Tunnel bzw. eine lokale Portweiterleitung verbindet, erkennt der Gateway
die Remote-Adresse möglicherweise als `127.0.0.1`. Damit diese Tunnel-
adresse nicht als IP-Adresse des Clients gespeichert wird, lässt die Verbindungsverarbeitung bei
als lokal erkannten Clients (Loopback) das Feld `ip` vollständig weg, anstatt die Loopback-Adresse
in den Eintrag zu schreiben.

## Verbraucher

### Seite „Geräte“ der Control UI

Die Seite **Geräte** verknüpft `system-presence` mit dauerhaften Kopplungs- und Node-
Datensätzen. Sie setzt das Selbstsignal des Gateway an die erste Stelle und verwendet übereinstimmende Geräte- oder
Instanz-IDs für Live-Metadaten zu Plattform, Version, Modell und Aktualität der Eingaben.

### Registerkarte „Instanzen“ unter macOS

Die macOS-App stellt die Ausgabe von `system-presence` dar und zeigt abhängig vom Alter
der letzten Aktualisierung eine kleine Statusanzeige (Aktiv/Inaktiv/Veraltet) an.

## Tipps zur Fehlerbehebung

- Um die unverarbeitete Liste anzuzeigen, rufen Sie `system-presence` für den Gateway auf.
- Wenn Sie Duplikate sehen:
  - Vergewissern Sie sich, dass Clients beim Handshake eine stabile `client.instanceId` senden
  - Vergewissern Sie sich, dass regelmäßige Signale dieselbe `instanceId` verwenden
  - Prüfen Sie, ob dem aus der Verbindung abgeleiteten Eintrag die `instanceId` fehlt (Duplikate sind dann zu erwarten)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Präsenz des aktiven Computers" href="/nodes/presence" icon="computer-mouse">
    Wie physische Eingaben am Mac einen aktiven Node auswählen und Verbindungsbenachrichtigungen weiterleiten.
  </Card>
  <Card title="Eingabeanzeigen" href="/de/concepts/typing-indicators" icon="ellipsis">
    Wann Eingabeanzeigen gesendet werden und wie sie angepasst werden können.
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
