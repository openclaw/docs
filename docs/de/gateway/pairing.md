---
read_when:
    - Genehmigungen für die Node-Kopplung ohne macOS-Benutzeroberfläche implementieren
    - Hinzufügen von CLI-Abläufen zur Genehmigung entfernter Nodes
    - Erweiterung des Gateway-Protokolls um die Node-Verwaltung
summary: 'Genehmigungen für Node-Funktionen: So erhalten Nodes nach der Gerätekopplung Zugriff auf Befehle'
title: Node-Kopplung
x-i18n:
    generated_at: "2026-07-24T04:25:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 25e4016657379573ddb7e9027899afd8b97b16709da6e73ed44d4016b99e715a
    source_path: gateway/pairing.md
    workflow: 16
---

Node-Kopplung besteht aus zwei Ebenen, die beide im Datensatz des gekoppelten Geräts in der
SQLite-Statusdatenbank des Gateways gespeichert werden:

- **Gerätekopplung** (Rolle `node`) sichert den `connect`-Handshake ab. Siehe
  [Automatische Gerätegenehmigung für vertrauenswürdige CIDRs](#trusted-cidr-device-auto-approval)
  weiter unten und [Kanalkopplung](/de/channels/pairing).
- **Genehmigung von Node-Fähigkeiten** (`node.pair.*`) steuert, welche deklarierten
  Fähigkeiten/Befehle eine verbundene Node bereitstellen darf. Das Gateway ist die
  maßgebliche Instanz; Benutzeroberflächen (macOS-App, Control UI) sind Frontends, die ausstehende Anfragen genehmigen oder
  ablehnen.

Der frühere eigenständige Speicher für Node-Kopplungen (`nodes/paired.json` mit einem
Token pro Node, im Januar 2026 aus dem Verbindungspfad entfernt) ist nicht mehr vorhanden: Gateways überführen
beim Start einmalig alle verbleibenden Zeilen in die Gerätedatensätze und archivieren die
veralteten Dateien mit dem Suffix `.migrated`. Die Unterstützung für die veraltete TCP-Bridge wurde
entfernt.

## Funktionsweise der Genehmigung von Fähigkeiten

1. Eine Node verbindet sich mit dem Gateway-WS (die Gerätekopplung sichert diesen Schritt ab).
2. Das Gateway vergleicht die deklarierte Fähigkeiten-/Befehlsoberfläche mit der
   genehmigten Oberfläche; neue oder erweiterte Oberflächen speichern eine **ausstehende Anfrage** im
   Gerätedatensatz und lösen `node.pair.requested` aus.
3. Sie genehmigen die Anfrage oder lehnen sie ab (CLI oder Benutzeroberfläche).
4. Bis zur Genehmigung bleiben Node-Befehle gefiltert; die Genehmigung gibt die deklarierte
   Oberfläche gemäß der normalen Befehlsrichtlinie frei.

Ausstehende Anfragen laufen automatisch **5 Minuten nach dem letzten
Wiederholungsversuch der Node** ab — eine Node, die aktiv versucht, die Verbindung wiederherzustellen, hält ihre eine ausstehende Anfrage aktiv,
anstatt bei jedem Versuch eine neue Anfrage (und Genehmigungsaufforderung) zu erzeugen.

## CLI-Arbeitsablauf (für Headless-Betrieb geeignet)

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
- `node.pair.remove` – entfernt eine gekoppelte Node. Dadurch wird die Rolle `node`
  des Geräts im Speicher für gekoppelte Geräte widerrufen, die genehmigte Node-Oberfläche ebenfalls entfernt und
  die Sitzungen dieses Geräts mit der Node-Rolle ungültig gemacht/getrennt. Ein Gerät mit **gemischten Rollen**
  (beispielsweise eines, das auch über `operator` verfügt) behält seinen Datensatz und verliert nur
  die Rolle `node`; ein Datensatz für ein reines Node-Gerät wird gelöscht. Autorisierung:
  `operator.pairing` darf Node-Datensätze entfernen, die nicht zu Operatoren gehören; ein Aufrufer mit Geräte-Token,
  der seine **eigene** Node-Rolle auf einem Gerät mit gemischten Rollen widerruft, benötigt zusätzlich
  `operator.admin`.
- `node.rename` – benennt den für Operatoren sichtbaren Anzeigenamen einer gekoppelten Node um.

In 2026.7 entfernt: `node.pair.request` und `node.pair.verify`. Ausstehende
Anfragen werden bei Node-Verbindungen vom Gateway selbst erstellt, und das
eigenständige Token pro Node, dem sie dienten, existiert nicht mehr; für die Node-Authentifizierung wird das
Gerätekopplungs-Token verwendet.

Hinweise:

- Bei erneuten Verbindungen mit unveränderter Oberfläche wird die ausstehende Anfrage wiederverwendet; wiederholte
  Anfragen aktualisieren die gespeicherten Node-Metadaten und den neuesten Snapshot der zulässigen
  deklarierten Befehle für die Sichtbarkeit durch Operatoren.
- Operator-Berechtigungsstufen und Prüfungen zum Genehmigungszeitpunkt sind unter
  [Operator-Berechtigungsbereiche](/de/gateway/operator-scopes) zusammengefasst.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungsberechtigungen durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit gewöhnlichen Befehlen: `operator.pairing` + `operator.write`
  - administrativ sensible Anfrage mit `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` oder
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
Die Genehmigung der Node-Kopplung zeichnet die vertrauenswürdige Fähigkeitenoberfläche auf. Sie fixiert **nicht** die aktuelle Node-Befehlsoberfläche pro Node.

- Aktuelle Node-Befehle stammen aus den Angaben, die die Node beim Verbindungsaufbau deklariert, gefiltert durch
  die globale Node-Befehlsrichtlinie des Gateways (`gateway.nodes.commands.allow` und
  `gateway.nodes.commands.deny`).
- Die `system.run`-Zulassungs- und Nachfragerichtlinie pro Node befindet sich für die Node in
  `exec.approvals.node.*`, nicht im Kopplungsdatensatz.

</Warning>

## Steuerung von Node-Befehlen (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt wurde. Die Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird die Kopplung automatisch angefordert.
Bis diese Anfrage genehmigt wurde, werden alle ausstehenden Node-Befehle dieser Node
gefiltert und nicht ausgeführt. Sobald die Kopplung genehmigt wurde, stehen die deklarierten
Befehle der Node gemäß der normalen Befehlsrichtlinie zur Verfügung.

Das bedeutet:

- Nodes, die sich zuvor allein auf die Gerätekopplung verlassen haben, um Befehle bereitzustellen, müssen
  nun zusätzlich die Node-Kopplung abschließen.
- Vor der Kopplungsgenehmigung in die Warteschlange gestellte Befehle werden verworfen, nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Von Nodes ausgehende Ausführungen verbleiben nun auf einer eingeschränkten vertrauenswürdigen Oberfläche.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die
vorgesehene vertrauenswürdige Oberfläche beschränkt. Durch Benachrichtigungen oder Nodes ausgelöste Abläufe, die
zuvor auf einen umfassenderen Zugriff auf Host- oder Sitzungswerkzeuge angewiesen waren, müssen möglicherweise angepasst werden.
Diese Härtung verhindert, dass Node-Ereignisse über die von der
Vertrauensgrenze der Node erlaubten Befugnisse hinaus Zugriff auf Werkzeuge auf Host-Ebene erhalten.

Dauerhafte Aktualisierungen der Node-Präsenz folgen derselben Identitätsgrenze: Das Ereignis
`node.presence.alive` wird nur von authentifizierten Node-Gerätesitzungen
akzeptiert und aktualisiert Kopplungsmetadaten nur, wenn die Geräte-/Node-Identität
bereits gekoppelt ist. Ein selbst deklarierter Wert `client.id` reicht nicht aus, um den
Zuletzt-gesehen-Status zu schreiben.

## SSH-verifizierte automatische Gerätegenehmigung (Standard)

Die erstmalige `role: node`-Gerätekopplung von einer privaten/CGNAT-Adresse wird
automatisch genehmigt, wenn das Gateway den **Besitz des Rechners über SSH nachweisen** kann: Es
verbindet sich zurück zum Kopplungshost (`BatchMode`, `StrictHostKeyChecking=yes`),
führt dort `openclaw node identity --json` aus und genehmigt nur, wenn die entfernte
Geräte-ID und der öffentliche Schlüssel exakt mit der ausstehenden Anfrage übereinstimmen. Der Schlüsselabgleich
macht dieses Verfahren sicher: Erreichbarkeit allein führt niemals zur Genehmigung, sodass NAT-Mitnutzer,
andere Benutzer auf einem gemeinsam genutzten Host und LAN-Spoofing sämtlich auf die normale
Aufforderung zurückfallen.

Standardmäßig aktiviert. Voraussetzungen für die Ausführung:

- Der Benutzer des Gateway-Prozesses (oder `sshVerify.user`) kann sich per SSH
  nicht interaktiv mit dem Node-Host verbinden (Schlüssel/Agent; Tailscale SSH funktioniert ebenfalls), und der Hostschlüssel ist
  bereits vertrauenswürdig.
- `openclaw` wird auf der entfernten `PATH` für nicht interaktives `sh -lc` aufgelöst.
- Die verbindende IP-Adresse ist eine direkte (nicht über einen Proxy geleitete und nicht Loopback-) private, ULA-,
  link-lokale oder CGNAT-Adresse oder stimmt mit `sshVerify.cidrs` überein, wenn dies festgelegt ist.
- Dieselbe Mindestvoraussetzung wie bei der Genehmigung vertrauenswürdiger CIDRs: nur neue Node-Kopplungen
  ohne Berechtigungsbereiche; Upgrades, Browser, Control UI und WebChat zeigen immer eine Aufforderung an.

Während eine Prüfung läuft, wird der Node-Client angewiesen, die Versuche fortzusetzen
(`wait_then_retry`), anstatt auf eine manuelle Genehmigung zu warten; wenn die Prüfung
fehlschlägt, fällt der nächste Versuch auf den normalen Aufforderungsablauf zurück. Fehlgeschlagene Ziele
erhalten eine kurze Sperrfrist (5 Minuten nach einem Schlüsselkonflikt).

Genehmigte Geräte zeichnen `approvedVia: "ssh-verified"` auf, und ihre erste deklarierte
Fähigkeitenoberfläche wird im selben Schritt genehmigt — der Schlüsselabgleich weist bereits nach,
dass die Node unter dem Konto des Operators auf einem Rechner ausgeführt wird, der ihm gehört, was derselben
Aussage entspricht, die eine manuelle Genehmigung von Fähigkeiten bestätigt. Spätere Erweiterungen der Oberfläche
zeigen weiterhin eine Aufforderung an.

Absichern oder deaktivieren:

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

Die macOS-App kann eine **stille Genehmigung** von Anfragen zu Node-Fähigkeiten versuchen,
wenn:

- die Anfrage als `silent` markiert ist (das Gateway markiert die erste Fähigkeitenoberfläche
  als still, wenn die Gerätekopplung nicht interaktiv genehmigt wurde), und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben
  Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale Approve/Reject-Aufforderung zurück.

## Automatische Gerätegenehmigung für vertrauenswürdige CIDRs

Die WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private Node-
Netzwerke, bei denen das Gateway dem Netzwerkpfad bereits vertraut, können Operatoren dies
mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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
- Es gibt keinen pauschalen Modus zur automatischen Genehmigung für LANs oder private Netzwerke; die SSH-verifizierte
  automatische Genehmigung (oben) erfordert einen kryptografischen Abgleich des Geräteschlüssels und niemals
  nur die Netzwerknähe.
- Nur eine neue `role: node`-Gerätekopplungsanfrage ohne angeforderte Berechtigungsbereiche ist
  berechtigt.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Upgrades von Rolle, Berechtigungsbereich, Metadaten und öffentlichem Schlüssel bleiben manuell.
- Loopback-Pfade mit Trusted-Proxy-Headern auf demselben Host sind nicht berechtigt, da dieser
  Pfad von lokalen Aufrufern manipuliert werden kann.

## Bereinigung beim Ersetzen stiller Kopplungen

Nicht interaktive Genehmigungen zeichnen ihre Herkunft in der Zeile des gekoppelten Geräts auf:
Genehmigungen durch lokale Richtlinien auf demselben Host als `silent`, Genehmigungen von Nodes über vertrauenswürdige CIDRs als
`trusted-cidr`, SSH-verifizierte Node-Genehmigungen als `ssh-verified`. Clients mit einem flüchtigen Statusverzeichnis (temporäre Home-Verzeichnisse,
Container, Sandboxes pro Ausführung) erzeugen bei jeder Ausführung ein neues Geräteschlüsselpaar, und jede
Ausführung koppelt sich still als völlig neues Gerät — ohne Bereinigung wächst die Liste der gekoppelten Geräte
bei jeder Ausführung um einen veralteten Datensatz.

Wenn das Gateway eine **lokale** Gerätekopplung still genehmigt, setzt es
ältere mit `silent` genehmigte Datensätze außer Betrieb, die zum selben Client-Cluster gehören
(Übereinstimmung von `clientId`, `clientMode` und Anzeigename) und derzeit nicht
verbunden sind. Lokale Clients werden auf dem Gateway-Host selbst ausgeführt, sodass der Cluster-Schlüssel
nicht mit einem anderen Rechner übereinstimmen kann. Außer Betrieb gesetzte Datensätze verlieren ihre Token sofort;
jeder übereinstimmende veraltete Node-Kopplungseintrag wird gelöscht und ein `node.pair.resolved`-
Entfernungsereignis wird übertragen.

Grenzen:

- Nur Datensätze, deren letzte Genehmigung lokal auf demselben Host (`silent`) erfolgte, sind
  sowohl als Auslöser als auch als Ziel zulässig. Durch vertrauenswürdige CIDRs und per SSH verifizierte Kopplungen
  werden Hosts übergreifend verbunden, wobei die Anzeigemetadaten keine Maschinenidentität darstellen. Daher werden sie
  niemals automatisch entfernt – verwenden Sie dafür die Bereinigung in der Control UI oder
  `openclaw nodes remove`.
- Vom Eigentümer genehmigte Kopplungen und Kopplungen per QR-/Einrichtungscode (Bootstrap) werden niemals
  automatisch entfernt. Datensätze, die genehmigt wurden, bevor Herkunftsinformationen verfügbar waren, bleiben geschützt,
  selbst nach einer späteren stillen erneuten Genehmigung derselben Geräte-ID.
- Aktuell verbundene Geräte werden übersprungen, sodass gleichzeitige lokale Sitzungen mit
  separaten Zustandsverzeichnissen ihre Tokens behalten, solange sie aktiv sind. Datensätze, die
  innerhalb der letzten Minute genehmigt wurden, werden ebenfalls übersprungen, sodass gleichzeitige Kopplungs-Handshakes
  einander nicht aufheben können, bevor ihre Verbindungen registriert wurden.
- Betroffene Clients sind konstruktionsbedingt lokal und koppeln sich daher bei
  ihrer nächsten Verbindung still erneut.

## Automatische Genehmigung bei Metadaten-Upgrades

Wenn ein bereits gekoppeltes Gerät erneut eine Verbindung herstellt und sich nur nicht vertrauliche Metadaten
geändert haben (beispielsweise der Anzeigename oder Hinweise zur Clientplattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Nicht-Browser-Verbindungen, die bereits den Besitz
lokaler oder gemeinsam genutzter Anmeldedaten nachgewiesen haben, einschließlich erneuter Verbindungen nativer Apps auf demselben Host nach
Änderungen der Betriebssystem-Versionsmetadaten. Browser-/Control-UI-Clients und Remote-Clients
verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung. Erweiterungen des Berechtigungsumfangs (Lesen auf
Schreiben/Administration) und Änderungen des öffentlichen Schlüssels sind **nicht** für die
automatische Genehmigung bei Metadaten-Upgrades zulässig; sie bleiben explizite Anfragen zur erneuten Genehmigung.

## Hilfsfunktionen für die QR-Kopplung

`/pair qr` rendert die Kopplungsnutzlast als strukturierte Medien, sodass Mobil- und
Browser-Clients sie direkt scannen können.

Beim Löschen eines Geräts werden auch alle veralteten ausstehenden Kopplungsanfragen für diese
Geräte-ID entfernt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Bei der Gateway-Kopplung wird eine Verbindung nur dann als Loopback behandelt, wenn sowohl der unverarbeitete Socket
als auch alle Hinweise eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage über Loopback eingeht, aber
`Forwarded`, einen beliebigen `X-Forwarded-*`- oder `X-Real-IP`-Header-Hinweis enthält, entkräftet dieser
Hinweis aus weitergeleiteten Headern die Annahme der Loopback-Lokalität, und der
Kopplungspfad erfordert eine explizite Genehmigung, statt die
Anfrage still als Verbindung auf demselben Host zu behandeln. Die entsprechende Regel für die
Operator-Authentifizierung finden Sie unter
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Speicherung (lokal, privat)

Der Kopplungsstatus befindet sich in den Datensätzen der gekoppelten Geräte in der gemeinsamen SQLite-Zustandsdatenbank
unter dem Zustandsverzeichnis des Gateways (standardmäßig `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelte Geräte mit Geräteauthentifizierung,
  genehmigte Node-Oberflächen, ausstehende Oberflächenanfragen, ausstehende Kopplungsanfragen
  für Geräte und Bootstrap-Tokens)

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird die Datenbank entsprechend verschoben. Gateways,
die von Releases mit JSON-Speichern aktualisiert wurden, importieren diese beim Start und hinterlassen
die Archive `devices/*.json.migrated` und `nodes/*.json.migrated`.

Sicherheitshinweise:

- Geräte-Tokens sind Geheimnisse; behandeln Sie die Zustandsdatenbank als vertraulich.
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
