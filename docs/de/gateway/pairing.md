---
read_when:
    - Genehmigungen für die Node-Kopplung ohne macOS-Benutzeroberfläche implementieren
    - CLI-Abläufe zur Genehmigung entfernter Nodes hinzufügen
    - Erweiterung des Gateway-Protokolls um die Node-Verwaltung
summary: 'Genehmigungen für Node-Funktionen: So erhalten Nodes nach der Gerätekopplung Zugriff auf Befehle'
title: Node-Kopplung
x-i18n:
    generated_at: "2026-07-12T01:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Die Node-Kopplung umfasst zwei Ebenen, die beide im Datensatz des gekoppelten Geräts in der SQLite-Statusdatenbank des Gateways gespeichert werden:

- **Gerätekopplung** (Rolle `node`) kontrolliert den `connect`-Handshake. Siehe
  [Automatische Gerätegenehmigung für vertrauenswürdige CIDRs](#trusted-cidr-device-auto-approval)
  weiter unten und [Kanalkopplung](/de/channels/pairing).
- **Genehmigung von Node-Fähigkeiten** (`node.pair.*`) kontrolliert, welche deklarierten
  Fähigkeiten/Befehle ein verbundener Node bereitstellen darf. Der Gateway ist die
  maßgebliche Quelle; Benutzeroberflächen (macOS-App, Control UI) dienen als Frontends,
  die ausstehende Anfragen genehmigen oder ablehnen.

Der frühere eigenständige Speicher für die Node-Kopplung (`nodes/paired.json` mit einem
Token pro Node, im Januar 2026 aus dem Verbindungspfad entfernt) ist nicht mehr vorhanden:
Gateways führen beim Start einmalig alle verbleibenden Einträge mit den Gerätedatensätzen
zusammen und archivieren die veralteten Dateien mit dem Suffix `.migrated`. Die Unterstützung
der veralteten TCP-Bridge wurde entfernt.

## Funktionsweise der Genehmigung von Fähigkeiten

1. Ein Node stellt eine Verbindung zum Gateway-WS her (die Gerätekopplung kontrolliert diesen Schritt).
2. Der Gateway vergleicht den Umfang der deklarierten Fähigkeiten/Befehle mit dem
   genehmigten Umfang; neue oder erweiterte Umfänge speichern eine **ausstehende Anfrage**
   im Gerätedatensatz und lösen `node.pair.requested` aus.
3. Sie genehmigen die Anfrage oder lehnen sie ab (über CLI oder Benutzeroberfläche).
4. Bis zur Genehmigung bleiben Node-Befehle gefiltert; durch die Genehmigung wird der
   deklarierte Umfang gemäß der normalen Befehlsrichtlinie verfügbar.

Ausstehende Anfragen laufen automatisch **5 Minuten nach dem letzten
Wiederholungsversuch des Nodes** ab – bei einem Node, der aktiv versucht, die Verbindung
wiederherzustellen, bleibt die eine ausstehende Anfrage bestehen, statt bei jedem Versuch
eine neue Anfrage (und Genehmigungsaufforderung) zu erzeugen.

## CLI-Arbeitsablauf (für Systeme ohne grafische Oberfläche geeignet)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gekoppelte/verbundene Nodes und deren Fähigkeiten an.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` – wird ausgelöst, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` – wird ausgelöst, wenn eine Anfrage genehmigt, abgelehnt oder
  abgelaufen ist.

Methoden:

- `node.pair.list` – listet ausstehende und gekoppelte Nodes auf (`operator.pairing`).
- `node.pair.approve` – genehmigt eine ausstehende Anfrage.
- `node.pair.reject` – lehnt eine ausstehende Anfrage ab.
- `node.pair.remove` – entfernt einen gekoppelten Node. Dadurch wird die Rolle `node`
  des Geräts im Speicher für gekoppelte Geräte widerrufen, der genehmigte Node-Umfang
  wird ebenfalls entfernt und die Sitzungen dieses Geräts mit der Node-Rolle werden
  ungültig gemacht und getrennt. Bei einem Gerät mit **mehreren Rollen** (beispielsweise
  einem Gerät, das auch `operator` besitzt) bleibt der Datensatz erhalten und nur die
  Rolle `node` geht verloren; der Datensatz eines Geräts, das ausschließlich ein Node ist,
  wird gelöscht. Autorisierung: Mit `operator.pairing` können Node-Datensätze ohne
  Operator-Rolle entfernt werden; ein Aufrufer mit Gerätetoken, der seine **eigene**
  Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich
  `operator.admin`.
- `node.rename` – benennt den für Operatoren sichtbaren Anzeigenamen eines gekoppelten Nodes um.

In Version 2026.7 entfernt: `node.pair.request` und `node.pair.verify`. Ausstehende
Anfragen werden vom Gateway selbst während der Node-Verbindung erstellt, und das
eigenständige Token pro Node, dem diese Methoden dienten, existiert nicht mehr; für die
Node-Authentifizierung wird das Gerätekopplungstoken verwendet.

Hinweise:

- Bei Wiederverbindungen mit unverändertem Umfang wird die ausstehende Anfrage
  wiederverwendet; wiederholte Anfragen aktualisieren die gespeicherten Node-Metadaten
  und die neueste Positivlisten-Momentaufnahme der deklarierten Befehle zur Einsicht durch
  Operatoren.
- Die Ebenen der Operator-Berechtigungsumfänge und die Prüfungen zum Genehmigungszeitpunkt
  sind unter [Operator-Berechtigungsumfänge](/de/gateway/operator-scopes) zusammengefasst.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungsberechtigungen durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Befehlen ohne Ausführung: `operator.pairing` + `operator.write`
  - Anfrage für `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Die Genehmigung der Node-Kopplung zeichnet den vertrauenswürdigen Fähigkeitsumfang auf. Sie fixiert **nicht** den aktuellen Node-Befehlsumfang für jeden Node.

- Die aktuellen Node-Befehle ergeben sich aus den Deklarationen des Nodes beim
  Verbindungsaufbau und werden durch die globale Node-Befehlsrichtlinie des Gateways
  (`gateway.nodes.allowCommands` und `denyCommands`) gefiltert.
- Die Positivlisten- und Abfragerichtlinie für `system.run` pro Node befindet sich auf dem
  Node unter `exec.approvals.node.*`, nicht im Kopplungsdatensatz.

</Warning>

## Steuerung von Node-Befehlen (ab 2026.3.31)

<Warning>
**Inkompatible Änderung:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt wurde. Die Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn ein Node zum ersten Mal eine Verbindung herstellt, wird die Kopplung automatisch
angefordert. Bis diese Anfrage genehmigt wurde, werden alle ausstehenden Node-Befehle
dieses Nodes gefiltert und nicht ausgeführt. Nach Genehmigung der Kopplung werden die
deklarierten Befehle des Nodes gemäß der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, bei denen zuvor allein die Gerätekopplung zur Bereitstellung von Befehlen
  ausreichte, müssen jetzt zusätzlich die Node-Kopplung abschließen.
- Vor der Kopplungsgenehmigung in die Warteschlange gestellte Befehle werden verworfen
  und nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (ab 2026.3.31)

<Warning>
**Inkompatible Änderung:** Von Nodes stammende Ausführungen bleiben jetzt auf einen reduzierten vertrauenswürdigen Umfang beschränkt.
</Warning>

Von Nodes stammende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf den
vorgesehenen vertrauenswürdigen Umfang beschränkt. Benachrichtigungsgesteuerte oder von
Nodes ausgelöste Abläufe, die zuvor auf einen umfassenderen Zugriff auf Host- oder
Sitzungswerkzeuge angewiesen waren, müssen möglicherweise angepasst werden. Diese
Absicherung verhindert, dass Node-Ereignisse über die Vertrauensgrenze des Nodes hinaus
Zugriff auf Werkzeuge auf Hostebene erlangen.

Dauerhafte Aktualisierungen der Node-Anwesenheit folgen derselben Identitätsgrenze: Das
Ereignis `node.presence.alive` wird nur von authentifizierten Gerätesitzungen mit Node-Rolle
akzeptiert und aktualisiert Kopplungsmetadaten nur, wenn die Geräte-/Node-Identität bereits
gekoppelt ist. Ein selbst deklarierter Wert für `client.id` reicht nicht aus, um den Status
der letzten Aktivität zu schreiben.

## SSH-verifizierte automatische Gerätegenehmigung (Standard)

Die erstmalige Gerätekopplung mit `role: node` von einer privaten/CGNAT-Adresse wird
automatisch genehmigt, wenn der Gateway den **Besitz des Rechners über SSH nachweisen**
kann: Er verbindet sich zurück zum Host der Kopplungsanfrage (`BatchMode`,
`StrictHostKeyChecking=yes`), führt dort `openclaw node identity --json` aus und genehmigt
die Anfrage nur, wenn die ID und der öffentliche Schlüssel des entfernten Geräts exakt mit
der ausstehenden Anfrage übereinstimmen. Der Schlüsselabgleich gewährleistet die Sicherheit:
Alleinige Erreichbarkeit führt niemals zur Genehmigung, sodass Mitnutzer derselben
NAT-Umgebung, andere Benutzer auf einem gemeinsam genutzten Host und LAN-Spoofing
weiterhin die normale Aufforderung auslösen.

Standardmäßig aktiviert. Voraussetzungen für die Ausführung:

- Der Benutzer des Gateway-Prozesses (oder `sshVerify.user`) kann sich nicht interaktiv
  per SSH mit dem Node-Host verbinden (Schlüssel/Agent; Tailscale SSH funktioniert ebenfalls),
  und der Hostschlüssel ist bereits vertrauenswürdig.
- `openclaw` kann auf dem entfernten `PATH` für ein nicht interaktives `sh -lc` aufgelöst werden.
- Die IP-Adresse der Verbindung ist eine direkte (nicht über einen Proxy geleitete und keine
  Loopback-Adresse) private, ULA-, Link-Local- oder CGNAT-Adresse oder entspricht, sofern
  festgelegt, `sshVerify.cidrs`.
- Es gelten dieselben Mindestvoraussetzungen wie für die Genehmigung über vertrauenswürdige
  CIDRs: ausschließlich neue Node-Kopplungen ohne Berechtigungsumfänge; Upgrades, Browser,
  Control UI und WebChat zeigen immer eine Aufforderung an.

Während eine Prüfung ausgeführt wird, wird der Node-Client angewiesen, die Versuche
fortzusetzen (`wait_then_retry`), anstatt für eine manuelle Genehmigung zu pausieren.
Schlägt die Prüfung fehl, fällt der nächste Versuch auf den normalen Ablauf mit Aufforderung
zurück. Für fehlgeschlagene Ziele gilt eine kurze Sperrfrist (5 Minuten nach einer
Schlüsselabweichung).

Bei genehmigten Geräten werden `approvedVia: "ssh-verified"` und der erste deklarierte
Fähigkeitsumfang im selben Schritt genehmigt – der Schlüsselabgleich weist bereits nach,
dass der Node unter dem Konto des Operators auf einem Rechner ausgeführt wird, der ihm
gehört. Dies entspricht derselben Aussage wie eine manuelle Genehmigung der Fähigkeiten.
Bei späteren Erweiterungen des Umfangs wird weiterhin eine Aufforderung angezeigt.

Absichern oder deaktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Vollständig deaktivieren:
        sshVerify: false,
        // ...oder Umfang und Parameter der Prüfung konfigurieren:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatische Genehmigung (macOS-App)

Die macOS-App kann eine **stille Genehmigung** von Anfragen zu Node-Fähigkeiten versuchen,
wenn:

- die Anfrage als `silent` markiert ist (der Gateway markiert den ersten Fähigkeitsumfang
  als still, wenn die Gerätekopplung nicht interaktiv genehmigt wurde), und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, wird stattdessen die normale Aufforderung mit Approve/Reject angezeigt.

## Automatische Gerätegenehmigung für vertrauenswürdige CIDRs

Die WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private
Node-Netzwerke, in denen der Gateway dem Netzwerkpfad bereits vertraut, können Operatoren
die Funktion mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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
  Netzwerke; die SSH-verifizierte automatische Genehmigung (siehe oben) erfordert einen
  kryptografischen Abgleich des Geräteschlüssels und niemals nur die räumliche Nähe im Netzwerk.
- Nur eine neue Gerätekopplungsanfrage mit `role: node` ohne angeforderte
  Berechtigungsumfänge ist zulässig.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Upgrades von Rollen, Berechtigungsumfängen, Metadaten und öffentlichen Schlüsseln
  bleiben manuell.
- Pfade über vertrauenswürdige Proxy-Header mit Loopback auf demselben Host sind nicht
  zulässig, da dieser Pfad von lokalen Aufrufern manipuliert werden kann.

## Bereinigung bei Ablösung stiller Kopplungen

Nicht interaktive Genehmigungen zeichnen ihre Herkunft im Datensatz des gekoppelten Geräts
auf: Genehmigungen durch lokale Richtlinien auf demselben Host als `silent`,
Node-Genehmigungen über vertrauenswürdige CIDRs als `trusted-cidr` und SSH-verifizierte
Node-Genehmigungen als `ssh-verified`. Clients, deren Statusverzeichnis flüchtig ist
(temporäre Home-Verzeichnisse, Container, Sandboxes pro Ausführung), erzeugen bei jeder
Ausführung ein neues Geräteschlüsselpaar und werden bei jeder Ausführung still als
brandneues Gerät erneut gekoppelt – ohne Bereinigung wächst die Liste der gekoppelten
Geräte bei jeder Ausführung um einen veralteten Datensatz.

Wenn der Gateway eine **lokale** Gerätekopplung still genehmigt, setzt er ältere, mit
`silent` genehmigte Datensätze außer Betrieb, die demselben Client-Cluster angehören
(übereinstimmende Werte für `clientId`, `clientMode` und Anzeigename) und derzeit nicht
verbunden sind. Lokale Clients werden auf dem Gateway-Host selbst ausgeführt, daher kann
der Cluster-Schlüssel nicht mit einem anderen Rechner übereinstimmen. Die Token der außer
Betrieb gesetzten Datensätze verlieren sofort ihre Gültigkeit; alle übereinstimmenden
veralteten Node-Kopplungseinträge werden gelöscht und ein Entfernungsereignis
`node.pair.resolved` wird übertragen.

Grenzen:

- Nur Datensätze, deren letzte Genehmigung lokal auf demselben Host (`silent`) erfolgte,
  sind sowohl als Auslöser als auch als Ziel zulässig. Kopplungen über vertrauenswürdige
  CIDRs und SSH-verifizierte Kopplungen überschreiten Hostgrenzen, an denen
  Anzeigemetadaten keine Rechneridentität darstellen. Daher werden sie niemals automatisch
  entfernt – verwenden Sie dafür die Bereinigungsfunktion der Control UI oder
  `openclaw nodes remove`.
- Vom Eigentümer genehmigte Kopplungen und Kopplungen über QR-/Einrichtungscodes
  (Bootstrap) werden niemals automatisch entfernt. Datensätze, die genehmigt wurden,
  bevor die Herkunft aufgezeichnet wurde, bleiben geschützt, auch nach einer späteren
  stillen erneuten Genehmigung derselben Geräte-ID.
- Derzeit verbundene Geräte werden übersprungen, sodass gleichzeitige lokale Sitzungen mit
  getrennten Statusverzeichnissen ihre Token behalten, solange sie aktiv sind. Datensätze,
  die innerhalb der letzten Minute genehmigt wurden, werden ebenfalls übersprungen, damit
  gleichzeitige Kopplungs-Handshakes einander nicht außer Betrieb setzen können, bevor ihre
  Verbindungen registriert wurden.
- Betroffene Clients sind konstruktionsbedingt lokal und werden daher bei ihrer nächsten
  Verbindung erneut still gekoppelt.

## Automatische Genehmigung von Metadaten-Upgrades

Wenn ein bereits gekoppeltes Gerät die Verbindung ausschließlich mit Änderungen an nicht
sensiblen Metadaten wiederherstellt (beispielsweise Anzeigename oder Hinweise zur
Clientplattform), behandelt OpenClaw dies als `metadata-upgrade`. Die stille automatische
Genehmigung ist eng begrenzt: Sie gilt nur für vertrauenswürdige lokale Wiederverbindungen
außerhalb eines Browsers, die bereits den Besitz lokaler oder gemeinsam genutzter
Anmeldedaten nachgewiesen haben. Dazu gehören Wiederverbindungen nativer Apps auf demselben
Host nach Änderungen an den Metadaten der Betriebssystemversion. Browser-/Control-UI-Clients
und entfernte Clients verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung.
Upgrades von Berechtigungsumfängen (Lesen auf Schreiben/Administration) und Änderungen
öffentlicher Schlüssel sind **nicht** für die automatische Genehmigung von
Metadaten-Upgrades zulässig; sie bleiben explizite Anfragen zur erneuten Genehmigung.

## Hilfsfunktionen für die QR-Kopplung

`/pair qr` stellt die Kopplungsnutzdaten als strukturierte Medien dar, sodass mobile Clients und Browser-Clients sie direkt scannen können.

Beim Löschen eines Geräts werden außerdem alle veralteten ausstehenden Kopplungsanfragen für diese Geräte-ID entfernt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Bei der Gateway-Kopplung gilt eine Verbindung nur dann als local loopback, wenn sowohl der unverarbeitete Socket als auch alle Hinweise eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage über local loopback eingeht, aber Hinweise aus den Headern `Forwarded`, `X-Forwarded-*` oder `X-Real-IP` enthält, schließen diese weitergeleiteten Header die Einstufung als local loopback aus, und der Kopplungsvorgang erfordert eine ausdrückliche Genehmigung, anstatt die Anfrage stillschweigend als Verbindung vom selben Host zu behandeln. Die entsprechende Regel für die Operator-Authentifizierung finden Sie unter [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Speicherung (lokal, privat)

Der Kopplungsstatus wird in den Datensätzen der gekoppelten Geräte in der gemeinsam genutzten SQLite-Statusdatenbank im Gateway-Statusverzeichnis gespeichert (standardmäßig `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelte Geräte mit Geräteauthentifizierung, genehmigte Node-Oberflächen, ausstehende Oberflächenanfragen, ausstehende Gerätekopplungsanfragen und Bootstrap-Token)

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird die Datenbank entsprechend verschoben. Gateways, die von Versionen mit JSON-Speichern aktualisiert wurden, importieren diese beim Start und behalten die Archive `devices/*.json.migrated` und `nodes/*.json.migrated` bei.

Sicherheitshinweise:

- Geräte-Token sind Geheimnisse; behandeln Sie die Statusdatenbank als vertraulich.
- Zum Rotieren eines Geräte-Tokens werden `openclaw devices rotate` bzw. `device.token.rotate` verwendet.

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaften.
- Wenn das Gateway offline oder die Kopplung deaktiviert ist, können Nodes nicht gekoppelt werden.
- Im Remote-Modus erfolgt die Kopplung mit dem Speicher des entfernten Gateways.

## Verwandte Themen

- [Kanalkopplung](/de/channels/pairing)
- [Nodes-CLI](/de/cli/nodes)
- [Geräte-CLI](/de/cli/devices)
