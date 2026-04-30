---
read_when:
    - Implementierung von Node-Kopplungsfreigaben ohne macOS-Benutzeroberfläche
    - Hinzufügen von CLI-Abläufen zur Genehmigung von Remote-Nodes
    - Erweiterung des Gateway-Protokolls um Node-Verwaltung
summary: Gateway-verwaltetes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Vom Gateway verwaltetes Pairing
x-i18n:
    generated_at: "2026-04-30T06:55:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Beim Gateway-verwalteten Pairing ist der **Gateway** die maßgebliche Quelle dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden während `connect` das **Geräte-Pairing** (Rolle `node`).
`node.pair.*` ist ein separater Pairing-Speicher und steuert **nicht** den WS-Handshake.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Ein Node hat den Beitritt angefragt; erfordert Genehmigung.
- **Gekoppelter Node**: Genehmigter Node mit ausgestelltem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über
  die Mitgliedschaft. (Die Unterstützung für die veraltete TCP-Bridge wurde entfernt.)

## So funktioniert Pairing

1. Ein Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Der Gateway speichert eine **ausstehende Anfrage** und gibt `node.pair.requested` aus.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung stellt der Gateway ein **neues Token** aus (Tokens werden beim erneuten Pairing rotiert).
5. Der Node verbindet sich erneut mit dem Token und ist nun „gekoppelt“.

Ausstehende Anfragen laufen automatisch nach **5 Minuten** ab.

## CLI-Workflow (headless-freundlich)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und ihre Funktionen.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` — ausstehende und gekoppelte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` — eine ausstehende Anfrage genehmigen (stellt Token aus).
- `node.pair.reject` — eine ausstehende Anfrage ablehnen.
- `node.pair.remove` — einen veralteten Eintrag eines gekoppelten Nodes entfernen.
- `node.pair.verify` — `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für denselben ausstehenden Node aktualisieren außerdem die gespeicherten
  Node-Metadaten und den neuesten Allowlist-Snapshot deklarierter Befehle für die Operator-Sichtbarkeit.
- Eine Genehmigung erzeugt **immer** ein neues Token; von `node.pair.request` wird nie ein Token zurückgegeben.
- Anfragen können `silent: true` als Hinweis für automatische Genehmigungsabläufe enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehl: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage für `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-Pairing ist ein Vertrauens- und Identitätsablauf plus Token-Ausstellung. Es pinnt **nicht** die Live-Befehlsoberfläche des Nodes pro Node.

- Live-Node-Befehle stammen aus dem, was der Node beim Verbinden deklariert, nachdem die globale Node-Befehlspolicy des Gateways (`gateway.nodes.allowCommands` und `denyCommands`) angewendet wurde.
- Die Pro-Node-Policy für Zulassen und Nachfragen bei `system.run` liegt auf dem Node in `exec.approvals.node.*`, nicht im Pairing-Datensatz.

</Warning>

## Node-Befehlssteuerung (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis das Node-Pairing genehmigt ist. Geräte-Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle verfügbar zu machen.
</Warning>

Wenn ein Node zum ersten Mal eine Verbindung herstellt, wird Pairing automatisch angefragt. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieses Nodes gefiltert und nicht ausgeführt. Sobald durch die Pairing-Genehmigung Vertrauen hergestellt ist, werden die deklarierten Befehle des Nodes gemäß der normalen Befehlspolicy verfügbar.

Das bedeutet:

- Nodes, die zuvor allein auf Geräte-Pairing angewiesen waren, um Befehle verfügbar zu machen, müssen jetzt Node-Pairing abschließen.
- Vor der Pairing-Genehmigung eingereihte Befehle werden verworfen, nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes ausgelöste Runs bleiben jetzt auf einer reduzierten vertrauenswürdigen Oberfläche.
</Warning>

Von Nodes ausgelöste Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die zuvor auf breiteren Host- oder Sitzungs-Toolzugriff angewiesen waren, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht über die Vertrauensgrenze des Nodes hinaus zu Toolzugriff auf Host-Ebene eskalieren können.

Dauerhafte Node-Präsenzaktualisierungen folgen derselben Identitätsgrenze. Das Ereignis `node.presence.alive` wird
nur von authentifizierten Node-Gerätesitzungen akzeptiert und aktualisiert Pairing-Metadaten nur, wenn die
Geräte-/Node-Identität bereits gekoppelt ist. Selbst deklarierte `client.id`-Werte reichen nicht aus, um
den Zuletzt-gesehen-Status zu schreiben.

## Automatische Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage als `silent` markiert ist, und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale Aufforderung „Genehmigen/Ablehnen“ zurück.

## Automatische Gerätegenehmigung per vertrauenswürdigem CIDR

WS-Geräte-Pairing für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, bei denen der Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
sich mit expliziten CIDRs oder exakten IPs dafür entscheiden:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Sicherheitsgrenze:

- Deaktiviert, wenn `gateway.nodes.pairing.autoApproveCidrs` nicht gesetzt ist.
- Es gibt keinen pauschalen LAN- oder Privatnetzwerk-Modus für automatische Genehmigung.
- Nur frisches Geräte-Pairing mit `role: node` ohne angeforderte Scopes ist berechtigt.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Rollen-, Scope-, Metadaten- und Public-Key-Upgrades bleiben manuell.
- Same-Host-local loopback-Pfade über vertrauenswürdige Proxy-Header sind nicht berechtigt, weil dieser
  Pfad von lokalen Aufrufern gefälscht werden kann.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn ein bereits gekoppeltes Gerät sich nur mit nicht sensiblen Metadatenänderungen
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Nicht-Browser-Wiederverbindungen, die bereits Besitz lokaler
oder gemeinsam genutzter Anmeldedaten nachgewiesen haben, einschließlich Same-Host-Wiederverbindungen nativer Apps nach
Änderungen an OS-Versionsmetadaten. Browser-/Control-UI-Clients und Remote-Clients verwenden weiterhin
den expliziten Ablauf zur erneuten Genehmigung. Scope-Upgrades (Lesen zu Schreiben/Admin) und
Public-Key-Änderungen sind **nicht** für automatische Genehmigung von Metadaten-Upgrades berechtigt —
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Pairing-Helfer

`/pair qr` rendert die Pairing-Nutzdaten als strukturierte Medien, damit Mobil- und
Browser-Clients sie direkt scannen können.

Das Löschen eines Geräts entfernt außerdem alle veralteten ausstehenden Pairing-Anfragen für diese
Geräte-ID, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Pairing behandelt eine Verbindung nur dann als loopback, wenn sowohl der rohe Socket
als auch alle Upstream-Proxy-Nachweise übereinstimmen. Wenn eine Anfrage über loopback eintrifft, aber
Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` enthält,
die auf einen nicht lokalen Ursprung verweisen, disqualifiziert dieser Forwarded-Header-Nachweis
die Behauptung der loopback-Lokalität. Der Pairing-Pfad erfordert dann eine explizite Genehmigung,
statt die Anfrage stillschweigend als Same-Host-Verbindung zu behandeln. Siehe
[Vertrauenswürdige Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Authentifizierung.

## Speicher (lokal, privat)

Der Pairing-Status wird im Gateway-Statusverzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird der Ordner `nodes/` mit verschoben.

Sicherheitshinweise:

- Tokens sind Geheimnisse; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn der Gateway offline ist oder Pairing deaktiviert ist, können Nodes nicht gekoppelt werden.
- Wenn der Gateway im Remote-Modus ist, erfolgt Pairing weiterhin gegen den Speicher des Remote-Gateways.

## Verwandt

- [Channel-Pairing](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Geräte-CLI](/de/cli/devices)
