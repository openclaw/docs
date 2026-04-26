---
read_when:
    - Implementieren von Genehmigungen für Node-Kopplung ohne macOS-UI
    - Hinzufügen von CLI-Abläufen zum Genehmigen von Remote-Nodes
    - Erweitern des Gateway-Protokolls um Node-Verwaltung
summary: Gateway-eigene Node-Kopplung (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigene Kopplung
x-i18n:
    generated_at: "2026-04-26T11:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Bei der Gateway-eigenen Kopplung ist das **Gateway** die Quelle der Wahrheit dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` **Gerätekopplung** (Rolle `node`).
`node.pair.*` ist ein separater Kopplungsspeicher und steuert den WS-Handshake **nicht**.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat den Beitritt angefragt; Genehmigung erforderlich.
- **Gekoppelte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der WS-Endpunkt des Gateway leitet Anfragen weiter, entscheidet aber nicht
  über die Mitgliedschaft. (Die Unterstützung für die ältere TCP-Bridge wurde entfernt.)

## So funktioniert die Kopplung

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Kopplung an.
2. Das Gateway speichert eine **ausstehende Anfrage** und sendet `node.pair.requested`.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung gibt das Gateway ein **neues Token** aus (Tokens werden beim erneuten Koppeln rotiert).
5. Die Node verbindet sich mit dem Token erneut und ist jetzt „gekoppelt“.

Ausstehende Anfragen laufen automatisch nach **5 Minuten** ab.

## CLI-Ablauf (headless-freundlich)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und ihre Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — erstellt eine ausstehende Anfrage oder verwendet eine bestehende erneut.
- `node.pair.list` — listet ausstehende + gekoppelte Nodes auf (`operator.pairing`).
- `node.pair.approve` — genehmigt eine ausstehende Anfrage (gibt Token aus).
- `node.pair.reject` — lehnt eine ausstehende Anfrage ab.
- `node.pair.verify` — verifiziert `{ nodeId, token }`.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren auch die gespeicherten Node-
  Metadaten und den neuesten allowlist-basierten Snapshot deklarierter Befehle für die Sichtbarkeit des Operators.
- Genehmigung erzeugt **immer** ein neues Token; von
  `node.pair.request` wird niemals ein Token zurückgegeben.
- Anfragen können `silent: true` als Hinweis für Auto-Genehmigungsabläufe enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehl: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Wichtig:

- Node-Kopplung ist ein Vertrauens-/Identitätsablauf plus Token-Ausgabe.
- Sie fixiert **nicht** die aktive Node-Befehlsoberfläche pro Node.
- Aktive Node-Befehle stammen aus dem, was die Node beim Verbinden deklariert, nachdem die
  globale Node-Befehlsrichtlinie des Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) angewendet wurde.
- Die Allow-/Ask-Richtlinie pro Node für `system.run` liegt auf der Node in
  `exec.approvals.node.*`, nicht im Kopplungseintrag.

## Steuerung von Node-Befehlen (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt ist. Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle verfügbar zu machen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird automatisch eine Kopplung angefordert. Bis die Kopplungsanfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node gefiltert und nicht ausgeführt. Sobald durch die Kopplungsgenehmigung Vertrauen hergestellt ist, werden die deklarierten Befehle der Node vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich zuvor darauf verlassen haben, dass allein die Gerätekopplung Befehle verfügbar macht, müssen nun die Node-Kopplung abschließen.
- Vor der Genehmigung der Kopplung in die Warteschlange gestellte Befehle werden verworfen, nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes ausgehende Läufe bleiben jetzt auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die beabsichtigte vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die sich zuvor auf breiteren Host- oder Sitzungs-Tool-Zugriff stützten, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht in Tool-Zugriff auf Host-Ebene eskalieren können, der über die Vertrauensgrenze der Node hinausgeht.

## Auto-Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage mit `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, wird auf die normale Aufforderung „Genehmigen/Ablehnen“ zurückgefallen.

## Auto-Genehmigung für vertrauenswürdige CIDR-Geräte

WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, bei denen das Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
dies mit expliziten CIDRs oder exakten IPs aktivieren:

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
- Es gibt keinen pauschalen Auto-Genehmigungsmodus für LAN oder private Netzwerke.
- Nur neue Gerätekopplung mit `role: node`, für die keine Scopes angefordert werden, ist zulässig.
- Operator-, Browser-, Control UI- und WebChat-Clients bleiben manuell.
- Upgrades von Rolle, Scope, Metadaten und öffentlichem Schlüssel bleiben manuell.
- Headerpfade vertrauenswürdiger Proxys über Loopback auf demselben Host sind nicht zulässig, weil
  dieser Pfad von lokalen Aufrufern gefälscht werden kann.

## Auto-Genehmigung für Metadaten-Upgrades

Wenn sich ein bereits gekoppeltes Gerät nur mit nicht sensiblen Änderungen der Metadaten
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille Auto-Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Wiederverbindungen ohne Browser, die bereits den Besitz lokaler
oder gemeinsam genutzter Zugangsdaten nachgewiesen haben, einschließlich Wiederverbindungen nativer Apps auf demselben Host nach Änderungen der OS-Versionsmetadaten. Browser-/Control UI-Clients und Remote-Clients verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung. Scope-Upgrades (von read zu write/admin) und Änderungen des öffentlichen Schlüssels kommen **nicht** für die Auto-Genehmigung von Metadaten-Upgrades infrage —
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Kopplungshilfen

`/pair qr` rendert die Kopplungsnutzlast als strukturierte Medien, sodass mobile und
browserbasierte Clients sie direkt scannen können.

Beim Löschen eines Geräts werden auch alle veralteten ausstehenden Kopplungsanfragen für diese
Geräte-ID bereinigt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Die Gateway-Kopplung behandelt eine Verbindung nur dann als Loopback, wenn sowohl der rohe Socket
als auch mögliche Hinweise eines Upstream-Proxys übereinstimmen. Wenn eine Anfrage über Loopback eingeht, aber `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-Header enthält,
die auf einen nicht lokalen Ursprung verweisen, disqualifizieren diese Hinweise aus weitergeleiteten Headern die Behauptung einer Loopback-Lokalität. Der Kopplungspfad erfordert dann eine explizite Genehmigung, statt die Anfrage stillschweigend als Verbindung vom selben Host zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Auth.

## Speicherung (lokal, privat)

Der Kopplungszustand wird unter dem Gateway-Zustandsverzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird der Ordner `nodes/` mit verschoben.

Sicherheitshinweise:

- Tokens sind Secrets; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn das Gateway offline ist oder die Kopplung deaktiviert ist, können Nodes nicht gekoppelt werden.
- Wenn sich das Gateway im Remote-Modus befindet, erfolgt die Kopplung trotzdem gegen den Speicher des Remote-Gateway.

## Verwandt

- [Kanal-Kopplung](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Devices CLI](/de/cli/devices)
