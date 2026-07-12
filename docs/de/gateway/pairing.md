---
read_when:
    - Genehmigungen für die Node-Kopplung ohne macOS-Benutzeroberfläche implementieren
    - CLI-Abläufe zur Genehmigung entfernter Nodes hinzufügen
    - Erweiterung des Gateway-Protokolls um die Node-Verwaltung
summary: 'Genehmigungen für Node-Funktionen: Wie Nodes nach der Gerätekopplung Befehle verfügbar machen'
title: Node-Kopplung
x-i18n:
    generated_at: "2026-07-12T15:26:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Die Node-Kopplung umfasst zwei Ebenen, die beide im Datensatz des gekoppelten Geräts in der SQLite-Zustandsdatenbank des Gateways gespeichert werden:

- **Gerätekopplung** (Rolle `node`) schützt den `connect`-Handshake. Siehe
  [Automatische Gerätegenehmigung für vertrauenswürdige CIDRs](#trusted-cidr-device-auto-approval)
  weiter unten und [Kanalkopplung](/de/channels/pairing).
- **Genehmigung von Node-Funktionen** (`node.pair.*`) steuert, welche deklarierten
  Funktionen/Befehle ein verbundener Node bereitstellen darf. Der Gateway ist die
  maßgebliche Instanz; Benutzeroberflächen (macOS-App, Control UI) dienen als Frontends,
  die ausstehende Anfragen genehmigen oder ablehnen.

Der frühere eigenständige Speicher für die Node-Kopplung (`nodes/paired.json` mit einem
Token pro Node, im Januar 2026 aus dem Verbindungspfad entfernt) ist nicht mehr vorhanden:
Gateways übernehmen beim Start einmalig alle verbleibenden Einträge in die Gerätedatensätze
und archivieren die Legacy-Dateien mit dem Suffix `.migrated`. Die Unterstützung für die
Legacy-TCP-Bridge wurde entfernt.

## Funktionsweise der Funktionsgenehmigung

1. Ein Node verbindet sich mit dem Gateway-WS (die Gerätekopplung schützt diesen Schritt).
2. Der Gateway vergleicht die deklarierte Funktions-/Befehlsoberfläche mit der
   genehmigten Oberfläche; neue oder erweiterte Oberflächen speichern eine **ausstehende Anfrage**
   im Gerätedatensatz und lösen `node.pair.requested` aus.
3. Sie genehmigen die Anfrage oder lehnen sie ab (CLI oder Benutzeroberfläche).
4. Bis zur Genehmigung bleiben Node-Befehle gefiltert; die Genehmigung gibt die deklarierte
   Oberfläche gemäß der normalen Befehlsrichtlinie frei.

Ausstehende Anfragen laufen automatisch **5 Minuten nach dem letzten
Wiederholungsversuch des Nodes** ab – bei einem Node, der aktiv versucht, die Verbindung
wiederherzustellen, bleibt die eine ausstehende Anfrage bestehen, anstatt bei jedem Versuch
eine neue Anfrage (und Genehmigungsaufforderung) zu erzeugen.

## CLI-Arbeitsablauf (für Umgebungen ohne Benutzeroberfläche geeignet)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und deren Funktionen an.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` – wird ausgelöst, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` – wird ausgelöst, wenn eine Anfrage genehmigt, abgelehnt oder
  abgelaufen ist.

Methoden:

- `node.pair.list` – ausstehende und gekoppelte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` – eine ausstehende Anfrage genehmigen.
- `node.pair.reject` – eine ausstehende Anfrage ablehnen.
- `node.pair.remove` – einen gekoppelten Node entfernen. Dadurch wird die Rolle `node`
  des Geräts im Speicher für gekoppelte Geräte widerrufen, die genehmigte Node-Oberfläche
  wird zusammen damit entfernt und die Node-Rollensitzungen dieses Geräts werden
  ungültig gemacht/getrennt. Bei einem Gerät mit **gemischten Rollen** (beispielsweise
  einem Gerät, das auch `operator` besitzt) bleibt der Eintrag erhalten und nur die Rolle
  `node` geht verloren; der Eintrag eines reinen Node-Geräts wird gelöscht. Autorisierung:
  Mit `operator.pairing` dürfen Node-Einträge ohne Operator-Rolle entfernt werden; ein
  Aufrufer mit Geräte-Token, der seine **eigene** Node-Rolle auf einem Gerät mit gemischten
  Rollen widerruft, benötigt zusätzlich `operator.admin`.
- `node.rename` – den für Operatoren sichtbaren Anzeigenamen eines gekoppelten Nodes ändern.

In 2026.7 entfernt: `node.pair.request` und `node.pair.verify`. Ausstehende
Anfragen werden bei Node-Verbindungen vom Gateway selbst erstellt, und das eigenständige
Token pro Node, für das diese Methoden vorgesehen waren, existiert nicht mehr; die
Node-Authentifizierung verwendet das Gerätekopplungs-Token.

Hinweise:

- Erneute Verbindungen mit unveränderter Oberfläche verwenden die ausstehende Anfrage
  erneut; wiederholte Anfragen aktualisieren die gespeicherten Node-Metadaten und den
  neuesten zulässigen Snapshot der deklarierten Befehle zur Einsicht durch Operatoren.
- Die Ebenen des Operator-Berechtigungsumfangs und die Prüfungen zum Genehmigungszeitpunkt
  sind unter [Operator-Berechtigungsumfänge](/de/gateway/operator-scopes) zusammengefasst.
- `node.pair.approve` verwendet die in der ausstehenden Anfrage deklarierten Befehle, um
  zusätzliche Genehmigungsberechtigungen durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Ausführungsbefehl: `operator.pairing` + `operator.write`
  - Anfrage für `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Die Genehmigung der Node-Kopplung zeichnet die vertrauenswürdige Funktionsoberfläche auf. Sie fixiert **nicht** die aktive Node-Befehlsoberfläche für jeden Node.

- Aktive Node-Befehle stammen aus den Deklarationen des Nodes beim Verbindungsaufbau,
  gefiltert durch die globale Node-Befehlsrichtlinie des Gateways
  (`gateway.nodes.allowCommands` und `denyCommands`).
- Die knotenbezogene Zulassungs- und Rückfragerichtlinie für `system.run` befindet sich
  auf dem Node unter `exec.approvals.node.*`, nicht im Kopplungsdatensatz.

</Warning>

## Sperrung von Node-Befehlen (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt wurde. Die Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn ein Node zum ersten Mal eine Verbindung herstellt, wird die Kopplung automatisch
angefordert. Bis diese Anfrage genehmigt wurde, werden alle ausstehenden Node-Befehle
dieses Nodes gefiltert und nicht ausgeführt. Sobald die Kopplung genehmigt ist, stehen
die deklarierten Befehle des Nodes gemäß der normalen Befehlsrichtlinie zur Verfügung.

Das bedeutet:

- Nodes, die sich bisher allein auf die Gerätekopplung verlassen haben, um Befehle
  bereitzustellen, müssen nun zusätzlich die Node-Kopplung abschließen.
- Vor der Kopplungsgenehmigung eingereihte Befehle werden verworfen und nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Von Nodes stammende Ausführungen bleiben jetzt auf eine eingeschränkte vertrauenswürdige Oberfläche begrenzt.
</Warning>

Von Nodes stammende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die
vorgesehene vertrauenswürdige Oberfläche beschränkt. Durch Benachrichtigungen oder Nodes
ausgelöste Abläufe, die bisher einen umfassenderen Zugriff auf Host- oder Sitzungstools
verwendet haben, müssen möglicherweise angepasst werden. Diese Härtung verhindert, dass
Node-Ereignisse über die von der Vertrauensgrenze des Nodes erlaubten Zugriffe hinaus
Zugriff auf Tools auf Host-Ebene erlangen.

Dauerhafte Aktualisierungen der Node-Anwesenheit folgen derselben Identitätsgrenze: Das
Ereignis `node.presence.alive` wird nur von authentifizierten Gerätesitzungen mit
Node-Rolle akzeptiert und aktualisiert die Kopplungsmetadaten nur, wenn die Geräte-/Node-Identität
bereits gekoppelt ist. Ein selbst deklarierter Wert für `client.id` reicht nicht aus, um
den Status der letzten Aktivität zu schreiben.

## SSH-verifizierte automatische Gerätegenehmigung (Standard)

Die erstmalige Gerätekopplung mit `role: node` von einer privaten/CGNAT-Adresse wird
automatisch genehmigt, wenn der Gateway den **Besitz des Computers über SSH nachweisen**
kann: Er verbindet sich zurück zum Kopplungshost (`BatchMode`, `StrictHostKeyChecking=yes`),
führt dort `openclaw node identity --json` aus und genehmigt nur, wenn die ID und der
öffentliche Schlüssel des entfernten Geräts exakt mit der ausstehenden Anfrage übereinstimmen.
Der Schlüsselabgleich gewährleistet die Sicherheit: Alleinige Erreichbarkeit führt niemals
zu einer Genehmigung, sodass andere NAT-Teilnehmer, andere Benutzer auf einem gemeinsam
genutzten Host und LAN-Spoofing sämtlich auf die normale Aufforderung zurückfallen.

Standardmäßig aktiviert. Voraussetzungen für die Ausführung:

- Der Benutzer des Gateway-Prozesses (oder `sshVerify.user`) kann sich nicht interaktiv per
  SSH mit dem Node-Host verbinden (Schlüssel/Agent; Tailscale SSH funktioniert ebenfalls),
  und dem Host-Schlüssel wird bereits vertraut.
- `openclaw` wird auf dem entfernten `PATH` für nicht interaktives `sh -lc` gefunden.
- Die verbindende IP-Adresse ist eine direkte (nicht über einen Proxy geleitete und keine
  Loopback-Adresse) private, ULA-, Link-Local- oder CGNAT-Adresse oder entspricht, falls
  festgelegt, `sshVerify.cidrs`.
- Es gilt dieselbe Mindestvoraussetzung wie bei der Genehmigung für vertrauenswürdige CIDRs:
  nur eine neue Node-Kopplung ohne Berechtigungsumfänge; Upgrades, Browser, Control UI und
  WebChat zeigen immer eine Aufforderung an.

Während eine Prüfung läuft, wird der Node-Client angewiesen, seine Versuche fortzusetzen
(`wait_then_retry`), anstatt für eine manuelle Genehmigung zu pausieren. Wenn die Prüfung
fehlschlägt, greift der nächste Versuch auf den normalen Aufforderungsablauf zurück.
Fehlgeschlagene Ziele erhalten eine kurze Sperrzeit (5 Minuten nach einer
Schlüsselabweichung).

Genehmigte Geräte zeichnen `approvedVia: "ssh-verified"` auf, und ihre erste deklarierte
Funktionsoberfläche wird im selben Schritt genehmigt – der Schlüsselabgleich belegt bereits,
dass der Node unter dem Konto des Operators auf einem Computer ausgeführt wird, den dieser
besitzt. Dies entspricht derselben Aussage, die eine manuelle Funktionsgenehmigung bestätigt.
Spätere Erweiterungen der Oberfläche zeigen weiterhin eine Aufforderung an.

Härten oder deaktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Vollständig deaktivieren:
        sshVerify: false,
        // ...oder Umfang/Parameter der Prüfung festlegen:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatische Genehmigung (macOS-App)

Die macOS-App kann unter folgenden Bedingungen eine **stille Genehmigung** von
Node-Funktionsanfragen versuchen:

- Die Anfrage ist als `silent` gekennzeichnet (der Gateway kennzeichnet die erste
  Funktionsoberfläche als still, wenn die Gerätekopplung nicht interaktiv genehmigt wurde),
  und
- die App kann eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren.

Wenn die stille Genehmigung fehlschlägt, greift sie auf die normale Aufforderung
Approve/Reject zurück.

## Automatische Gerätegenehmigung für vertrauenswürdige CIDRs

Die WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Bei privaten
Node-Netzwerken, in denen der Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
dies mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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

- Deaktiviert, wenn `gateway.nodes.pairing.autoApproveCidrs` nicht festgelegt ist.
- Es gibt keinen pauschalen Modus zur automatischen Genehmigung für LANs oder private
  Netzwerke; die SSH-verifizierte automatische Genehmigung (oben) erfordert einen
  kryptografischen Abgleich des Geräteschlüssels und niemals allein die Netzwerknähe.
- Nur eine neue Gerätekopplungsanfrage für `role: node` ohne angeforderte
  Berechtigungsumfänge kommt infrage.
- Clients für Operatoren, Browser, Control UI und WebChat bleiben manuell.
- Upgrades von Rollen, Berechtigungsumfängen, Metadaten und öffentlichen Schlüsseln bleiben
  manuell.
- Loopback-Pfade mit vertrauenswürdigen Proxy-Headern auf demselben Host kommen nicht
  infrage, da dieser Pfad von lokalen Aufrufern manipuliert werden kann.

## Bereinigung abgelöster stiller Kopplungen

Nicht interaktive Genehmigungen zeichnen ihre Herkunft im Eintrag des gekoppelten Geräts
auf: Genehmigungen durch lokale Richtlinien auf demselben Host als `silent`,
Node-Genehmigungen für vertrauenswürdige CIDRs als `trusted-cidr`, SSH-verifizierte
Node-Genehmigungen als `ssh-verified`. Clients mit einem flüchtigen Zustandsverzeichnis
(temporäre Home-Verzeichnisse, Container, Sandboxes pro Ausführung) erzeugen bei jeder
Ausführung ein neues Geräteschlüsselpaar und koppeln sich bei jeder Ausführung still als
brandneues Gerät neu – ohne Bereinigung wächst die Liste der gekoppelten Geräte bei jeder
Ausführung um einen veralteten Eintrag.

Wenn der Gateway eine **lokale** Gerätekopplung still genehmigt, setzt er ältere als
`silent` genehmigte Datensätze außer Betrieb, die zum selben Client-Cluster gehören
(übereinstimmende Werte für `clientId`, `clientMode` und Anzeigename) und derzeit nicht
verbunden sind. Lokale Clients werden auf dem Gateway-Host selbst ausgeführt, daher kann
der Cluster-Schlüssel nicht mit einem anderen Computer übereinstimmen. Die Token
ausgesonderter Einträge verlieren sofort ihre Gültigkeit; jeder passende Legacy-Eintrag
für die Node-Kopplung wird gelöscht, und ein Entfernungsereignis `node.pair.resolved`
wird gesendet.

Grenzen:

- Nur Datensätze, deren letzte Genehmigung lokal auf demselben Host (`silent`) erfolgte,
  kommen als Auslöser und Ziel infrage. Kopplungen über vertrauenswürdige CIDRs und
  SSH-verifizierte Kopplungen erstrecken sich über Hosts, bei denen Anzeigemetadaten keine
  Computeridentität darstellen. Daher werden sie niemals automatisch entfernt – verwenden
  Sie dafür die Bereinigungsfunktion der Control UI oder `openclaw nodes remove`.
- Vom Eigentümer genehmigte Kopplungen und Kopplungen über QR-/Einrichtungscode
  (Bootstrap) werden niemals automatisch entfernt. Datensätze, die vor Einführung der
  Herkunftsinformation genehmigt wurden, bleiben geschützt, selbst nach einer späteren
  stillen erneuten Genehmigung derselben Geräte-ID.
- Derzeit verbundene Geräte werden übersprungen, sodass gleichzeitige lokale Sitzungen mit
  separaten Zustandsverzeichnissen ihre Token behalten, solange sie aktiv sind. Datensätze,
  die innerhalb der letzten Minute genehmigt wurden, werden ebenfalls übersprungen, damit
  gleichzeitige Kopplungs-Handshakes einander nicht außer Betrieb setzen können, bevor ihre
  Verbindungen registriert sind.
- Betroffene Clients sind konstruktionsbedingt lokal und koppeln sich daher bei ihrer
  nächsten Verbindung erneut still.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn ein bereits gekoppeltes Gerät erneut eine Verbindung herstellt und nur nicht sensible
Metadaten geändert wurden (beispielsweise Anzeigename oder Hinweise zur Client-Plattform),
behandelt OpenClaw dies als `metadata-upgrade`. Die stille automatische Genehmigung ist eng
begrenzt: Sie gilt nur für vertrauenswürdige lokale Verbindungen außerhalb von Browsern,
die bereits den Besitz lokaler oder gemeinsam genutzter Anmeldedaten nachgewiesen haben,
einschließlich erneuter Verbindungen nativer Apps auf demselben Host nach Änderungen an
Metadaten der Betriebssystemversion. Browser-/Control-UI-Clients und entfernte Clients
verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung. Upgrades des
Berechtigungsumfangs (Lesen zu Schreiben/Administrator) und Änderungen des öffentlichen
Schlüssels kommen **nicht** für die automatische Genehmigung von Metadaten-Upgrades infrage;
sie bleiben explizite Anfragen zur erneuten Genehmigung.

## Hilfsfunktionen für die QR-Kopplung

`/pair qr` rendert die Kopplungsnutzdaten als strukturierte Medien, damit Mobil- und
Browser-Clients sie direkt scannen können.

Beim Löschen eines Geräts werden außerdem alle veralteten ausstehenden Kopplungsanfragen für diese
Geräte-ID entfernt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Bei der Gateway-Kopplung wird eine Verbindung nur dann als Loopback behandelt, wenn sowohl der rohe Socket
als auch alle Nachweise eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage über Loopback eingeht, aber
Nachweise durch `Forwarded`-, beliebige `X-Forwarded-*`- oder `X-Real-IP`-Header enthält, entkräften diese
weitergeleiteten Header den Anspruch auf Loopback-Lokalität, und der
Kopplungspfad erfordert eine ausdrückliche Genehmigung, anstatt die
Anfrage stillschweigend als Verbindung vom selben Host zu behandeln. Die entsprechende Regel für die
Operatorauthentifizierung finden Sie unter
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Speicherung (lokal, privat)

Der Kopplungsstatus befindet sich in den Datensätzen der gekoppelten Geräte in der gemeinsam genutzten SQLite-
Statusdatenbank im Gateway-Statusverzeichnis (standardmäßig `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelte Geräte mit Geräteauthentifizierung,
  genehmigte Node-Oberflächen, ausstehende Oberflächenanfragen, ausstehende Gerätekopplungsanfragen
  und Bootstrap-Token)

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird die Datenbank entsprechend verschoben. Gateways,
die von Versionen mit JSON-Speichern aktualisiert wurden, importieren diese beim Start und hinterlassen
die Archive `devices/*.json.migrated` und `nodes/*.json.migrated`.

Sicherheitshinweise:

- Geräte-Token sind Geheimnisse; behandeln Sie die Statusdatenbank als vertraulich.
- Zum Rotieren eines Geräte-Tokens dienen `openclaw devices rotate` /
  `device.token.rotate`.

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaften.
- Wenn das Gateway offline oder die Kopplung deaktiviert ist, können Nodes nicht gekoppelt werden.
- Im Remote-Modus erfolgt die Kopplung mit dem Speicher des Remote-Gateways.

## Verwandte Themen

- [Kanalkopplung](/de/channels/pairing)
- [Nodes-CLI](/de/cli/nodes)
- [Geräte-CLI](/de/cli/devices)
