---
read_when:
    - Node-Pairing-Genehmigungen ohne macOS-UI implementieren
    - CLI-Abläufe zum Genehmigen von Remote-Knoten hinzufügen
    - Gateway-Protokoll um Node-Verwaltung erweitern
summary: Gateway-eigenes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigenes Pairing
x-i18n:
    generated_at: "2026-06-27T17:32:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Beim Gateway-eigenen Pairing ist der **Gateway** die Source of Truth dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` **Geräte-Pairing** (Rolle `node`).
`node.pair.*` ist ein separater Pairing-Speicher und steuert **nicht** den WS-Handshake.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat um Beitritt gebeten; erfordert Genehmigung.
- **Gepairte Node**: Genehmigte Node mit ausgestelltem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über
  die Mitgliedschaft. (Unterstützung für die veraltete TCP-Bridge wurde entfernt.)

## So funktioniert Pairing

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Der Gateway speichert eine **ausstehende Anfrage** und gibt `node.pair.requested` aus.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung stellt der Gateway ein **neues Token** aus (Tokens werden beim erneuten Pairing rotiert).
5. Die Node verbindet sich mit dem Token erneut und ist jetzt „gepairt“.

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

`nodes status` zeigt gepairte/verbundene Nodes und ihre Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Events:

- `node.pair.requested` - wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` - wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` - erstellt eine ausstehende Anfrage oder verwendet sie erneut.
- `node.pair.list` - listet ausstehende + gepairte Nodes auf (`operator.pairing`).
- `node.pair.approve` - genehmigt eine ausstehende Anfrage (stellt Token aus).
- `node.pair.reject` - lehnt eine ausstehende Anfrage ab.
- `node.pair.remove` - entfernt eine gepairte Node. Bei gerätegestützten Pairings
  widerruft dies die `node`-Rolle des Geräts: Es mutiert `devices/paired.json` und
  invalidiert/trennt die Node-Rollen-Sitzungen dieses Geräts. Ein **Mixed-Role**-
  Gerät (z. B. wenn es auch `operator` besitzt) behält seine Zeile und verliert nur die `node`-
  Rolle; eine reine Node-Gerätezeile wird gelöscht. Außerdem entfernt es jeden passenden veralteten
  Gateway-eigenen Node-Pairing-Eintrag. Authz: `operator.pairing` darf
  Nicht-Operator-Node-Zeilen entfernen; ein Device-Token-Aufrufer, der seine **eigene** Node-Rolle auf
  einem Mixed-Role-Gerät widerruft, benötigt zusätzlich `operator.admin`.
- `node.pair.verify` - verifiziert `{ nodeId, token }`.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren außerdem die gespeicherten Node-
  Metadaten und den neuesten auf der Allowlist stehenden deklarierten Befehls-Snapshot für Operator-Sichtbarkeit.
- Genehmigung erzeugt **immer** ein frisches Token; von
  `node.pair.request` wird niemals ein Token zurückgegeben.
- Operator-Scope-Stufen und Prüfungen zum Genehmigungszeitpunkt sind unter
  [Operator-Scopes](/de/gateway/operator-scopes) zusammengefasst.
- Anfragen können `silent: true` als Hinweis für automatische Genehmigungsabläufe enthalten.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage für `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-Pairing ist ein Vertrauens- und Identitätsablauf plus Token-Ausstellung. Es pinnt **nicht** die Live-Node-Befehlsoberfläche pro Node.

- Live-Node-Befehle stammen aus dem, was die Node beim Verbinden deklariert, nachdem die globale Node-Befehlspolicy des Gateways (`gateway.nodes.allowCommands` und `denyCommands`) angewendet wurde.
- Die Pro-Node-Allow- und Ask-Policy für `system.run` liegt auf der Node in `exec.approvals.node.*`, nicht im Pairing-Datensatz.

</Warning>

## Node-Befehls-Gating (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis Node-Pairing genehmigt ist. Geräte-Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle freizugeben.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird Pairing automatisch angefordert. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node gefiltert und nicht ausgeführt. Sobald Vertrauen durch Pairing-Genehmigung hergestellt ist, werden die deklarierten Befehle der Node gemäß der normalen Befehlspolicy verfügbar.

Das bedeutet:

- Nodes, die sich bisher allein auf Geräte-Pairing verlassen haben, um Befehle freizugeben, müssen jetzt Node-Pairing abschließen.
- Vor der Pairing-Genehmigung eingereihte Befehle werden verworfen, nicht verzögert.

## Vertrauensgrenzen für Node-Events (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes stammende Runs bleiben jetzt auf einer reduzierten vertrauenswürdigen Oberfläche.
</Warning>

Von Nodes stammende Zusammenfassungen und zugehörige Sitzungs-Events sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die zuvor auf breiteren Host- oder Sitzungstool-Zugriff angewiesen waren, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Events nicht über das hinaus zu Zugriff auf Host-Ebene-Tools eskalieren können, was die Vertrauensgrenze der Node erlaubt.

Dauerhafte Node-Präsenzaktualisierungen folgen derselben Identitätsgrenze. Das Event `node.presence.alive` wird
nur von authentifizierten Node-Gerätesitzungen akzeptiert und aktualisiert Pairing-Metadaten nur, wenn die
Geräte-/Node-Identität bereits gepairt ist. Selbst deklarierte `client.id`-Werte reichen nicht aus, um
den Zuletzt-gesehen-Status zu schreiben.

## Automatische Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage mit `silent` markiert ist, und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn stille Genehmigung fehlschlägt, fällt sie auf die normale „Genehmigen/Ablehnen“-Abfrage zurück.

## Automatische Gerätegenehmigung per vertrauenswürdigem CIDR

WS-Geräte-Pairing für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, bei denen der Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
sich mit expliziten CIDRs oder exakten IPs anmelden:

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
- Es gibt keinen pauschalen LAN- oder Privatnetzwerkmodus für automatische Genehmigung.
- Nur frisches `role: node`-Geräte-Pairing ohne angeforderte Scopes ist berechtigt.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Rollen-, Scope-, Metadaten- und Public-Key-Upgrades bleiben manuell.
- Vertrauenswürdige Proxy-Header-Pfade für Same-Host-Loopback sind nicht berechtigt, weil dieser
  Pfad von lokalen Aufrufern gefälscht werden kann.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn sich ein bereits gepairtes Gerät mit nur nicht sensiblen Metadatenänderungen
erneut verbindet (zum Beispiel Anzeigename oder Client-Plattformhinweise), behandelt OpenClaw
dies als `metadata-upgrade`. Stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Nicht-Browser-Wiederverbindungen, die bereits den Besitz lokaler
oder geteilter Zugangsdaten bewiesen haben, einschließlich Same-Host-Wiederverbindungen nativer Apps nach Änderungen an
OS-Versionsmetadaten. Browser-/Control-UI-Clients und Remote-Clients verwenden weiterhin
den expliziten Ablauf zur erneuten Genehmigung. Scope-Upgrades (read zu write/admin) und
Public-Key-Änderungen sind **nicht** für die automatische Genehmigung von Metadaten-Upgrades berechtigt -
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Pairing-Helfer

`/pair qr` rendert die Pairing-Nutzlast als strukturierte Medien, damit mobile und
Browser-Clients sie direkt scannen können.

Das Löschen eines Geräts bereinigt außerdem alle veralteten ausstehenden Pairing-Anfragen für diese
Geräte-ID, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Pairing behandelt eine Verbindung nur dann als Loopback, wenn sowohl der rohe Socket
als auch alle Upstream-Proxy-Nachweise übereinstimmen. Wenn eine Anfrage über Loopback eintrifft, aber
`Forwarded`, beliebige `X-Forwarded-*`- oder `X-Real-IP`-Header-Nachweise enthält, disqualifizieren diese
Forwarded-Header-Nachweise den Loopback-Lokalitätsanspruch. Der Pairing-
Pfad erfordert dann explizite Genehmigung, statt die Anfrage stillschweigend als
Same-Host-Verbindung zu behandeln. Siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für
die entsprechende Regel bei Operator-Auth.

## Speicherung (lokal, privat)

Pairing-Status wird im Gateway-Statusverzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird der Ordner `nodes/` mitverschoben.

Sicherheitshinweise:

- Tokens sind Geheimnisse; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn der Gateway offline ist oder Pairing deaktiviert ist, können Nodes nicht pairen.
- Wenn der Gateway im Remote-Modus ist, findet Pairing weiterhin gegen den Speicher des Remote-Gateways statt.

## Verwandt

- [Channel-Pairing](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Geräte-CLI](/de/cli/devices)
