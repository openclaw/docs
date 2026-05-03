---
read_when:
    - Implementieren von Node-Kopplungsfreigaben ohne macOS-Benutzeroberfläche
    - Hinzufügen von CLI-Abläufen zum Genehmigen von Remote-Nodes
    - Erweiterung des Gateway-Protokolls um Node-Verwaltung
summary: Gateway-gesteuertes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigene Kopplung
x-i18n:
    generated_at: "2026-05-03T06:38:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Bei Gateway-verwalteter Kopplung ist der **Gateway** die Quelle der Wahrheit dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, künftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden während `connect` die **Gerätekopplung** (Rolle `node`).
`node.pair.*` ist ein separater Kopplungsspeicher und steuert **nicht** den WS-Handshake.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat um Beitritt gebeten; erfordert Genehmigung.
- **Gekoppelte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über
  Mitgliedschaft. (Die Unterstützung für die alte TCP-Bridge wurde entfernt.)

## So funktioniert die Kopplung

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Kopplung an.
2. Der Gateway speichert eine **ausstehende Anfrage** und gibt `node.pair.requested` aus.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung gibt der Gateway ein **neues Token** aus (Tokens werden bei erneuter Kopplung rotiert).
5. Die Node verbindet sich erneut mit dem Token und ist nun „gekoppelt“.

Ausstehende Anfragen laufen nach **5 Minuten** automatisch ab.

## CLI-Workflow (für Headless-Betrieb geeignet)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und ihre Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` — ausstehende + gekoppelte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` — eine ausstehende Anfrage genehmigen (gibt Token aus).
- `node.pair.reject` — eine ausstehende Anfrage ablehnen.
- `node.pair.remove` — einen veralteten Eintrag einer gekoppelten Node entfernen.
- `node.pair.verify` — `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren außerdem die gespeicherten Node-Metadaten
  und den letzten zugelassenen Snapshot deklarierter Befehle für die Operator-Sichtbarkeit.
- Genehmigung erzeugt **immer** ein frisches Token; von `node.pair.request` wird nie ein Token zurückgegeben.
- Operator-Scope-Stufen und Prüfungen zum Genehmigungszeitpunkt sind unter
  [Operator-Scopes](/de/gateway/operator-scopes) zusammengefasst.
- Anfragen können `silent: true` als Hinweis für Abläufe mit automatischer Genehmigung enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungs-Scopes zu erzwingen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage für `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-Kopplung ist ein Vertrauens- und Identitätsablauf plus Token-Ausgabe. Sie pinnt die Live-Node-Befehlsoberfläche pro Node **nicht**.

- Live-Node-Befehle stammen aus dem, was die Node beim Verbinden deklariert, nachdem die globale Node-Befehlspolitik des Gateways (`gateway.nodes.allowCommands` und `denyCommands`) angewendet wurde.
- Die node-spezifische Allow- und Ask-Policy für `system.run` liegt auf der Node in `exec.approvals.node.*`, nicht im Kopplungsdatensatz.

</Warning>

## Steuerung von Node-Befehlen (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt wurde. Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle offenzulegen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird die Kopplung automatisch angefordert. Bis die Kopplungsanfrage genehmigt ist, werden alle ausstehenden Node-Befehle von dieser Node gefiltert und nicht ausgeführt. Sobald Vertrauen durch die Kopplungsgenehmigung hergestellt ist, werden die deklarierten Befehle der Node gemäß der normalen Befehlspolitik verfügbar.

Das bedeutet:

- Nodes, die zuvor allein auf Gerätekopplung vertraut haben, um Befehle offenzulegen, müssen nun die Node-Kopplung abschließen.
- Befehle, die vor der Kopplungsgenehmigung in die Warteschlange gestellt wurden, werden verworfen, nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes gestartete Runs bleiben nun auf einer reduzierten vertrauenswürdigen Oberfläche.
</Warning>

Von Nodes stammende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die zuvor auf breiteren Host- oder Sitzungs-Tool-Zugriff angewiesen waren, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht in Host-Level-Tool-Zugriff eskalieren können, der über die Vertrauensgrenze der Node hinausgeht.

Dauerhafte Node-Präsenzaktualisierungen folgen derselben Identitätsgrenze. Das Ereignis `node.presence.alive` wird
nur von authentifizierten Node-Gerätesitzungen akzeptiert und aktualisiert Kopplungsmetadaten nur, wenn die
Geräte-/Node-Identität bereits gekoppelt ist. Selbst deklarierte `client.id`-Werte reichen nicht aus, um
den Last-Seen-Status zu schreiben.

## Automatische Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage mit `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale Aufforderung „Genehmigen/Ablehnen“ zurück.

## Automatische Genehmigung für Geräte über vertrauenswürdige CIDRs

WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private
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
- Es gibt keinen pauschalen LAN- oder Private-Network-Modus für automatische Genehmigung.
- Nur frische `role: node`-Gerätekopplung ohne angeforderte Scopes ist berechtigt.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Rollen-, Scope-, Metadaten- und Public-Key-Upgrades bleiben manuell.
- Same-Host-local loopback-Pfade mit Trusted-Proxy-Headern sind nicht berechtigt, weil dieser
  Pfad von lokalen Aufrufern gefälscht werden kann.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn sich ein bereits gekoppeltes Gerät nur mit nicht sensiblen Metadatenänderungen
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Nicht-Browser-Wiederverbindungen, die bereits den Besitz lokaler
oder geteilter Anmeldedaten nachgewiesen haben, einschließlich Same-Host-Wiederverbindungen nativer Apps nach
Änderungen der OS-Versionsmetadaten. Browser-/Control-UI-Clients und Remote-Clients
verwenden weiterhin den expliziten Ablauf für erneute Genehmigung. Scope-Upgrades (Lesen auf Schreiben/Admin) und
Public-Key-Änderungen sind **nicht** für automatische Genehmigung von Metadaten-Upgrades berechtigt —
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Kopplungshilfen

`/pair qr` rendert die Kopplungsnutzlast als strukturierte Medien, damit mobile und
Browser-Clients sie direkt scannen können.

Das Löschen eines Geräts räumt außerdem veraltete ausstehende Kopplungsanfragen für diese
Geräte-ID auf, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Kopplung behandelt eine Verbindung nur dann als local loopback, wenn sowohl der rohe Socket
als auch alle Upstream-Proxy-Nachweise übereinstimmen. Wenn eine Anfrage über local loopback eingeht, aber
Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` enthält,
die auf einen nicht lokalen Ursprung verweisen, disqualifiziert dieser Forwarded-Header-Nachweis
die Behauptung der local loopback-Lokalität. Der Kopplungspfad erfordert dann explizite Genehmigung,
anstatt die Anfrage still als Same-Host-Verbindung zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Authentifizierung.

## Speicherung (lokal, privat)

Der Kopplungsstatus wird im Gateway-Statusverzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, zieht der Ordner `nodes/` mit.

Sicherheitshinweise:

- Tokens sind Geheimnisse; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn der Gateway offline ist oder die Kopplung deaktiviert ist, können Nodes sich nicht koppeln.
- Wenn der Gateway im Remote-Modus ist, erfolgt die Kopplung weiterhin gegen den Speicher des Remote-Gateways.

## Verwandte Themen

- [Channel-Kopplung](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Geräte-CLI](/de/cli/devices)
