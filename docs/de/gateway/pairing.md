---
read_when:
    - Node-Pairing-Freigaben ohne macOS-UI implementieren
    - CLI-Abläufe zum Freigeben von Remote-Nodes hinzufügen
    - Gateway-Protokoll mit Node-Verwaltung erweitern
summary: Gateway-eigenes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigenes Pairing
x-i18n:
    generated_at: "2026-04-25T13:47:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Beim Gateway-eigenen Pairing ist das **Gateway** die Quelle der Wahrheit dafür, welche Nodes beitreten dürfen. UIs (macOS-App, künftige Clients) sind nur Frontends, die ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` **Device Pairing** (Rolle `node`). `node.pair.*` ist ein separater Pairing-Store und steuert den WS-Handshake **nicht**. Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat angefragt beizutreten; Genehmigung erforderlich.
- **Gepairte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über die Mitgliedschaft. (Legacy-TCP-Bridge-Unterstützung wurde entfernt.)

## So funktioniert Pairing

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Das Gateway speichert eine **ausstehende Anfrage** und sendet `node.pair.requested`.
3. Du genehmigst oder lehnst die Anfrage ab (CLI oder UI).
4. Bei Genehmigung gibt das Gateway ein **neues Token** aus (Tokens werden bei Re-Pairing rotiert).
5. Die Node verbindet sich mit dem Token erneut und ist nun „gepairt“.

Ausstehende Anfragen laufen nach **5 Minuten** automatisch ab.

## CLI-Ablauf (headless-freundlich)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gepairte/verbundene Nodes und ihre Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird gesendet, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird gesendet, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` — ausstehende + gepairte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` — eine ausstehende Anfrage genehmigen (gibt Token aus).
- `node.pair.reject` — eine ausstehende Anfrage ablehnen.
- `node.pair.verify` — `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren außerdem die gespeicherten Node-Metadaten und den neuesten allowlisteten Snapshot deklarierter Befehle für die Sichtbarkeit des Operators.
- Eine Genehmigung erzeugt **immer** ein frisches Token; von `node.pair.request` wird nie ein Token zurückgegeben.
- Anfragen können `silent: true` als Hinweis für Auto-Genehmigungs-Abläufe enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um zusätzliche Genehmigungs-Scopes zu erzwingen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-`exec`-Befehl: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Wichtig:

- Node-Pairing ist ein Vertrauens-/Identitätsablauf plus Token-Ausgabe.
- Es pinnt **nicht** die Live-Befehlsoberfläche der Node pro Node fest.
- Live-Node-Befehle stammen aus dem, was die Node beim Verbindungsaufbau deklariert, nachdem die
  globale Node-Befehlsrichtlinie des Gateways (`gateway.nodes.allowCommands` /
  `denyCommands`) angewendet wurde.
- Die Allow-/Ask-Richtlinie pro Node für `system.run` liegt auf der Node in
  `exec.approvals.node.*`, nicht im Pairing-Record.

## Gating von Node-Befehlen (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis das Node-Pairing genehmigt wurde. Device Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird automatisch Pairing angefordert. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node herausgefiltert und nicht ausgeführt. Sobald Vertrauen durch die Genehmigung des Pairings hergestellt ist, werden die deklarierten Befehle der Node vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich zuvor darauf verlassen haben, dass Device Pairing allein Befehle bereitstellt, müssen jetzt Node-Pairing abschließen.
- Befehle, die vor der Genehmigung des Pairings in die Warteschlange gestellt wurden, werden verworfen, nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes stammende Läufe bleiben jetzt auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes stammende Zusammenfassungen und verwandte Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die sich zuvor auf breiteren Zugriff auf Host- oder Sitzungs-Tools stützten, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht über die Vertrauensgrenze der Node hinaus in Host-Level-Tool-Zugriff eskalieren können.

## Auto-Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage als `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf den normalen Prompt „Genehmigen/Ablehnen“ zurück.

## Auto-Genehmigung von Devices aus vertrauenswürdigen CIDR-Bereichen

WS-Device-Pairing für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, in denen das Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
explizit CIDRs oder genaue IPs freischalten:

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
- Nur frisches `role: node` Device Pairing ohne angeforderte Scopes ist berechtigt.
- Operator-, Browser-, Control UI- und WebChat-Clients bleiben manuell.
- Rollen-, Scope-, Metadaten- und Public-Key-Upgrades bleiben manuell.
- Trusted-Proxy-Header-Pfade über Loopback auf demselben Host sind nicht berechtigt, weil
  dieser Pfad von lokalen Aufrufern gefälscht werden kann.

## Auto-Genehmigung bei Metadaten-Upgrades

Wenn sich ein bereits gepairtes Device nur mit nicht sensiblen
Metadatenänderungen erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
das als `metadata-upgrade`. Die stille Auto-Genehmigung ist eng gefasst: Sie gilt nur für
vertrauenswürdige lokale CLI-/Helper-Reconnects, die bereits den Besitz des
gemeinsamen Tokens oder Passworts über Loopback nachgewiesen haben. Browser-/Control UI-Clients und Remote-
Clients verwenden weiterhin den expliziten Re-Genehmigungsablauf. Scope-Upgrades (von read auf
write/admin) und Änderungen des Public Keys kommen **nicht** für die Auto-Genehmigung bei Metadaten-Upgrades infrage —
sie bleiben explizite Re-Genehmigungsanfragen.

## Hilfen für QR-Pairing

`/pair qr` rendert die Pairing-Payload als strukturierte Medien, sodass mobile und
Browser-Clients sie direkt scannen können.

Das Löschen eines Devices bereinigt auch alle veralteten ausstehenden Pairing-Anfragen für diese
Device-ID, sodass `nodes pending` nach einem Revoke keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Pairing behandelt eine Verbindung nur dann als Loopback, wenn sowohl der rohe Socket
als auch alle Hinweise eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage über Loopback eintrifft,
aber `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-Header trägt,
die auf einen nicht lokalen Ursprung verweisen, disqualifizieren diese Hinweise aus den Forwarded Headers
die Behauptung einer Loopback-Lokalität. Der Pairing-Pfad erfordert dann eine explizite
Genehmigung, anstatt die Anfrage stillschweigend als Verbindung vom selben Host zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Auth.

## Speicher (lokal, privat)

Der Pairing-Status wird im Gateway-State-Verzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn du `OPENCLAW_STATE_DIR` überschreibst, wird der Ordner `nodes/` mitverschoben.

Sicherheitshinweise:

- Tokens sind Secrets; behandle `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine Re-Genehmigung (oder das Löschen des Node-Eintrags).

## Verhalten des Transports

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn das Gateway offline ist oder Pairing deaktiviert ist, können Nodes kein Pairing durchführen.
- Wenn sich das Gateway im Remote-Modus befindet, erfolgt Pairing weiterhin gegen den Store des Remote-Gateways.

## Verwandt

- [Channel Pairing](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Devices CLI](/de/cli/devices)
