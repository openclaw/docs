---
read_when:
    - Fehlerbehebung für die Registerkarte „Instanzen“
    - Untersuchen doppelter oder veralteter Instanzzeilen
    - Ändern von Gateway-WS-Verbindungs- oder system-event-Beacons
summary: Wie OpenClaw-Präsenz-Einträge erzeugt, zusammengeführt und angezeigt werden
title: Präsenz
x-i18n:
    generated_at: "2026-05-06T06:44:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw „Presence“ ist eine schlanke Best-Effort-Ansicht von:

- dem **Gateway** selbst und
- **Clients, die mit dem Gateway verbunden sind** (Mac-App, WebChat, CLI usw.)

Presence wird hauptsächlich verwendet, um den Tab **Instanzen** der macOS-App zu rendern und
schnelle operative Sichtbarkeit bereitzustellen.

## Presence-Felder (was angezeigt wird)

Presence-Einträge sind strukturierte Objekte mit Feldern wie:

- `instanceId` (optional, aber dringend empfohlen): stabile Client-Identität (normalerweise `connect.client.instanceId`)
- `host`: menschenlesbarer Hostname
- `ip`: Best-Effort-IP-Adresse
- `version`: Client-Versionszeichenfolge
- `deviceFamily` / `modelIdentifier`: Hardware-Hinweise
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: „Sekunden seit der letzten Benutzereingabe“ (falls bekannt)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: Zeitstempel der letzten Aktualisierung (ms seit der Epoche)

## Produzenten (woher Presence stammt)

Presence-Einträge werden von mehreren Quellen erzeugt und **zusammengeführt**.

### 1) Self-Eintrag des Gateway

Das Gateway legt beim Start immer einen „Self“-Eintrag an, damit UIs den Gateway-Host anzeigen,
noch bevor sich Clients verbinden.

### 2) WebSocket-Verbindung

Jeder WS-Client beginnt mit einer `connect`-Anfrage. Nach erfolgreichem Handshake
legt das Gateway einen Presence-Eintrag für diese Verbindung an oder aktualisiert ihn.

#### Warum einmalige CLI-Befehle nicht angezeigt werden

Die CLI verbindet sich oft für kurze, einmalige Befehle. Um die
Instanzenliste nicht zu überfluten, wird `client.mode === "cli"` **nicht** in einen Presence-Eintrag umgewandelt.

### 3) `system-event`-Beacons

Clients können über die Methode `system-event` umfangreichere periodische Beacons senden. Die Mac-App
verwendet dies, um Hostname, IP und `lastInputSeconds` zu melden.

### 4) Node-Verbindungen (Rolle: node)

Wenn sich ein Node über das Gateway-WebSocket mit `role: node` verbindet, legt das Gateway
einen Presence-Eintrag für diesen Node an oder aktualisiert ihn (derselbe Ablauf wie bei anderen WS-Clients).

## Regeln zum Zusammenführen und Deduplizieren (warum `instanceId` wichtig ist)

Presence-Einträge werden in einer einzelnen In-Memory-Map gespeichert:

- Einträge werden über einen **Presence-Schlüssel** indiziert.
- Der beste Schlüssel ist eine stabile `instanceId` (aus `connect.client.instanceId`), die Neustarts überdauert.
- Schlüssel sind nicht groß-/kleinschreibungssensitiv.

Wenn sich ein Client ohne stabile `instanceId` erneut verbindet, kann er als
**doppelte** Zeile erscheinen.

## TTL und begrenzte Größe

Presence ist absichtlich flüchtig:

- **TTL:** Einträge, die älter als 5 Minuten sind, werden entfernt
- **Maximale Einträge:** 200 (älteste werden zuerst verworfen)

Dadurch bleibt die Liste aktuell und unbegrenztes Speicherwachstum wird vermieden.

## Hinweis zu Remote/Tunnel (Loopback-IPs)

Wenn sich ein Client über einen SSH-Tunnel / eine lokale Portweiterleitung verbindet, sieht das Gateway
die Remote-Adresse möglicherweise als `127.0.0.1`. Um zu vermeiden, dass eine gute vom Client gemeldete
IP überschrieben wird, werden Loopback-Remote-Adressen ignoriert.

## Konsumenten

### macOS-Tab „Instanzen“

Die macOS-App rendert die Ausgabe von `system-presence` und wendet eine kleine Statusanzeige
(Aktiv/Inaktiv/Veraltet) basierend auf dem Alter der letzten Aktualisierung an.

## Debugging-Tipps

- Um die Rohdatenliste zu sehen, rufen Sie `system-presence` gegen das Gateway auf.
- Wenn Sie Duplikate sehen:
  - bestätigen Sie, dass Clients beim Handshake eine stabile `client.instanceId` senden
  - bestätigen Sie, dass periodische Beacons dieselbe `instanceId` verwenden
  - prüfen Sie, ob dem aus der Verbindung abgeleiteten Eintrag `instanceId` fehlt (Duplikate sind dann erwartet)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Eingabeindikatoren" href="/de/concepts/typing-indicators" icon="ellipsis">
    Wann Eingabeindikatoren gesendet werden und wie Sie sie abstimmen.
  </Card>
  <Card title="Streaming und Chunking" href="/de/concepts/streaming" icon="bars-staggered">
    Ausgehendes Streaming, Chunking und kanalspezifische Formatierung.
  </Card>
  <Card title="Gateway-Architektur" href="/de/concepts/architecture" icon="diagram-project">
    Gateway-Komponenten und das WebSocket-Protokoll, das Presence-Aktualisierungen steuert.
  </Card>
  <Card title="Gateway-Protokoll" href="/de/gateway/protocol" icon="plug">
    Das Wire-Protokoll für `connect`, `system-event` und `system-presence`.
  </Card>
</CardGroup>
