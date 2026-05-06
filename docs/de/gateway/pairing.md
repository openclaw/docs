---
read_when:
    - Implementierung von Freigaben für Node-Pairing ohne macOS-Benutzeroberfläche
    - CLI-Abläufe zum Genehmigen von Remote-Nodes hinzufügen
    - Gateway-Protokoll um Node-Verwaltung erweitern
summary: Gateway-eigene Node-Kopplung (Option B) für iOS und andere entfernte Nodes
title: Vom Gateway verwaltete Kopplung
x-i18n:
    generated_at: "2026-05-06T06:49:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Bei der Gateway-eigenen Kopplung ist der **Gateway** die maßgebliche Quelle dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` die **Gerätekopplung** (Rolle `node`).
`node.pair.*` ist ein separater Kopplungsspeicher und steuert **nicht** den WS-Handshake.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Ein Node hat angefragt beizutreten; eine Genehmigung ist erforderlich.
- **Gekoppelter Node**: genehmigter Node mit ausgegebenem Authentifizierungstoken.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über
  Mitgliedschaft. (Die Unterstützung für die ältere TCP-Bridge wurde entfernt.)

## So funktioniert die Kopplung

1. Ein Node verbindet sich mit dem Gateway-WS und fordert die Kopplung an.
2. Der Gateway speichert eine **ausstehende Anfrage** und gibt `node.pair.requested` aus.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung gibt der Gateway ein **neues Token** aus (Tokens werden bei erneuter Kopplung rotiert).
5. Der Node verbindet sich erneut mit dem Token und ist nun „gekoppelt“.

Ausstehende Anfragen laufen nach **5 Minuten** automatisch ab.

## CLI-Workflow (für Headless-Umgebungen geeignet)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und ihre Fähigkeiten an.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` - wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` - wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` - eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` - ausstehende + gekoppelte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` - eine ausstehende Anfrage genehmigen (gibt Token aus).
- `node.pair.reject` - eine ausstehende Anfrage ablehnen.
- `node.pair.remove` - einen veralteten Eintrag eines gekoppelten Nodes entfernen.
- `node.pair.verify` - `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für denselben ausstehenden Node aktualisieren außerdem die gespeicherten Node-Metadaten
  und den neuesten allowlisteten Snapshot der deklarierten Befehle für die Operator-Sichtbarkeit.
- Eine Genehmigung erzeugt **immer** ein frisches Token; von `node.pair.request` wird nie ein Token zurückgegeben.
- Operator-Scope-Ebenen und Prüfungen zum Genehmigungszeitpunkt sind unter
  [Operator-Scopes](/de/gateway/operator-scopes) zusammengefasst.
- Anfragen können `silent: true` als Hinweis für automatische Genehmigungsabläufe enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungs-Scopes zu erzwingen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-Kopplung ist ein Vertrauens- und Identitätsablauf plus Token-Ausgabe. Sie pinnt **nicht** die Live-Befehlsoberfläche des Nodes pro Node.

- Live-Node-Befehle stammen aus dem, was der Node beim Verbinden deklariert, nachdem die globale Node-Befehlsrichtlinie des Gateways (`gateway.nodes.allowCommands` und `denyCommands`) angewendet wurde.
- Die pro-Node-Richtlinie für `system.run`-Allow und -Abfrage liegt auf dem Node in `exec.approvals.node.*`, nicht im Kopplungseintrag.

</Warning>

## Gating von Node-Befehlen (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt ist. Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle offenzulegen.
</Warning>

Wenn sich ein Node zum ersten Mal verbindet, wird die Kopplung automatisch angefragt. Bis die Kopplungsanfrage genehmigt ist, werden alle ausstehenden Node-Befehle von diesem Node herausgefiltert und nicht ausgeführt. Sobald durch die Kopplungsgenehmigung Vertrauen hergestellt ist, werden die vom Node deklarierten Befehle vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich zuvor allein auf Gerätekopplung verlassen haben, um Befehle offenzulegen, müssen nun die Node-Kopplung abschließen.
- Befehle, die vor der Kopplungsgenehmigung in die Warteschlange gestellt wurden, werden verworfen, nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes ausgehende Ausführungen bleiben nun auf einer reduzierten vertrauenswürdigen Oberfläche.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgesteuerte oder von Nodes ausgelöste Abläufe, die sich zuvor auf breiteren Zugriff auf Host- oder Sitzungstools verlassen haben, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse keinen Zugriff auf Tools auf Host-Ebene über das hinaus eskalieren können, was die Vertrauensgrenze des Nodes zulässt.

Dauerhafte Node-Präsenzaktualisierungen folgen derselben Identitätsgrenze. Das Ereignis `node.presence.alive` wird
nur von authentifizierten Node-Gerätesitzungen akzeptiert und aktualisiert Kopplungsmetadaten nur dann, wenn die
Geräte-/Node-Identität bereits gekoppelt ist. Selbst deklarierte `client.id`-Werte reichen nicht aus, um den
Zuletzt-gesehen-Status zu schreiben.

## Automatische Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage als `silent` markiert ist, und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale „Genehmigen/Ablehnen“-Aufforderung zurück.

## Automatische Genehmigung für Trusted-CIDR-Geräte

WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, bei denen der Gateway dem Netzwerkpfad bereits vertraut, können
Operatoren sich mit expliziten CIDRs oder exakten IPs anmelden:

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
- Es gibt keinen pauschalen automatischen Genehmigungsmodus für LAN oder private Netzwerke.
- Nur frische `role: node`-Gerätekopplung ohne angeforderte Scopes ist berechtigt.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Rollen-, Scope-, Metadaten- und Public-Key-Upgrades bleiben manuell.
- Trusted-Proxy-Headerpfade über same-host loopback sind nicht berechtigt, weil dieser
  Pfad von lokalen Aufrufern gefälscht werden kann.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn ein bereits gekoppeltes Gerät sich mit ausschließlich nicht sensiblen Metadatenänderungen
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige Nicht-Browser-Local-Reconnects, die bereits den Besitz lokaler
oder geteilter Zugangsdaten nachgewiesen haben, einschließlich Reconnects nativer same-host Apps nach Änderungen
an OS-Versionsmetadaten. Browser-/Control-UI-Clients und Remote-Clients verwenden weiterhin
den expliziten Ablauf zur erneuten Genehmigung. Scope-Upgrades (read zu write/admin) und
Public-Key-Änderungen sind **nicht** für die automatische Genehmigung von Metadaten-Upgrades berechtigt -
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Kopplungshilfen

`/pair qr` rendert die Kopplungsnutzlast als strukturierte Medien, sodass mobile und
Browser-Clients sie direkt scannen können.

Beim Löschen eines Geräts werden außerdem alle veralteten ausstehenden Kopplungsanfragen für diese
Geräte-ID bereinigt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Kopplung behandelt eine Verbindung nur dann als loopback, wenn sowohl der rohe Socket
als auch etwaige Upstream-Proxy-Nachweise übereinstimmen. Wenn eine Anfrage über loopback eingeht, aber
Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` enthält,
die auf einen nicht lokalen Ursprung verweisen, disqualifiziert dieser Nachweis durch weitergeleitete Header
den loopback-Lokalitätsanspruch. Der Kopplungspfad erfordert dann eine explizite Genehmigung,
statt die Anfrage stillschweigend als same-host Connect zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Authentifizierung.

## Speicher (lokal, privat)

Der Kopplungsstatus wird im Gateway-Statusverzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird der Ordner `nodes/` entsprechend verschoben.

Sicherheitshinweise:

- Tokens sind Geheimnisse; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn der Gateway offline ist oder die Kopplung deaktiviert ist, können Nodes nicht gekoppelt werden.
- Wenn der Gateway im Remote-Modus ist, erfolgt die Kopplung weiterhin gegen den Speicher des Remote-Gateways.

## Verwandte Themen

- [Channel-Kopplung](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Geräte-CLI](/de/cli/devices)
