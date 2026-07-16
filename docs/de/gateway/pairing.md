---
read_when:
    - Genehmigungen für das Node-Pairing ohne macOS-Benutzeroberfläche implementieren
    - CLI-Abläufe zur Genehmigung entfernter Nodes hinzufügen
    - Gateway-Protokoll um Node-Verwaltung erweitern
summary: 'Genehmigungen für Node-Funktionen: So erhalten Nodes nach der Gerätekopplung Zugriff auf Befehle'
title: Node-Kopplung
x-i18n:
    generated_at: "2026-07-16T13:06:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Die Node-Kopplung umfasst zwei Ebenen, die beide im Datensatz des gekoppelten Geräts in der SQLite-Zustandsdatenbank des Gateways gespeichert sind:

- **Gerätekopplung** (Rolle `node`) sichert den `connect`-Handshake ab. Siehe
  [Automatische Gerätegenehmigung für vertrauenswürdige CIDRs](#trusted-cidr-device-auto-approval)
  unten und [Kanalkopplung](/de/channels/pairing).
- **Genehmigung von Node-Funktionen** (`node.pair.*`) steuert, welche deklarierten
  Funktionen/Befehle ein verbundener Node bereitstellen darf. Das Gateway ist die
  maßgebliche Instanz; Benutzeroberflächen (macOS-App, Control UI) sind Frontends, die ausstehende Anfragen genehmigen oder
  ablehnen.

Der frühere eigenständige Speicher für Node-Kopplungen (`nodes/paired.json` mit einem Node-spezifischen
Token, im Januar 2026 aus dem Verbindungspfad entfernt) existiert nicht mehr: Gateways führen
beim Start einmalig alle verbliebenen Zeilen mit den Gerätedatensätzen zusammen und archivieren die
Legacy-Dateien mit dem Suffix `.migrated`. Die Unterstützung für die Legacy-TCP-Bridge wurde
entfernt.

## Funktionsweise der Funktionsgenehmigung

1. Ein Node stellt eine Verbindung zum Gateway-WS her (die Gerätekopplung sichert diesen Schritt ab).
2. Das Gateway vergleicht die deklarierte Funktions-/Befehlsoberfläche mit der
   genehmigten; neue oder erweiterte Oberflächen speichern eine **ausstehende Anfrage** im
   Gerätedatensatz und geben `node.pair.requested` aus.
3. Sie genehmigen die Anfrage oder lehnen sie ab (CLI oder Benutzeroberfläche).
4. Bis zur Genehmigung bleiben Node-Befehle gefiltert; nach der Genehmigung wird die deklarierte
   Oberfläche gemäß der normalen Befehlsrichtlinie bereitgestellt.

Ausstehende Anfragen laufen automatisch **5 Minuten nach dem letzten
Wiederholungsversuch des Nodes** ab — ein Node, der aktiv versucht, die Verbindung wiederherzustellen, hält seine eine ausstehende Anfrage aktiv,
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

`nodes status` zeigt gekoppelte/verbundene Nodes und ihre Funktionen an.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` - wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` - wird ausgegeben, wenn eine Anfrage genehmigt, abgelehnt oder
  abgelaufen ist.

Methoden:

- `node.pair.list` - ausstehende und gekoppelte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` - eine ausstehende Anfrage genehmigen.
- `node.pair.reject` - eine ausstehende Anfrage ablehnen.
- `node.pair.remove` - einen gekoppelten Node entfernen. Dadurch wird die Rolle `node`
  des Geräts im Speicher für gekoppelte Geräte widerrufen, zugleich die genehmigte Node-Oberfläche entfernt und
  die Node-Rollensitzungen dieses Geräts werden ungültig gemacht/getrennt. Ein Gerät mit **gemischten Rollen**
  (zum Beispiel eines, das auch `operator` besitzt) behält seine Zeile und verliert nur
  die Rolle `node`; die Zeile eines reinen Node-Geräts wird gelöscht. Autorisierung:
  `operator.pairing` darf Node-Zeilen ohne Operatorrolle entfernen; ein Aufrufer mit Gerätetoken,
  der auf einem Gerät mit gemischten Rollen seine **eigene** Node-Rolle widerruft, benötigt zusätzlich
  `operator.admin`.
- `node.rename` - den für Operatoren sichtbaren Anzeigenamen eines gekoppelten Nodes ändern.

In 2026.7 entfernt: `node.pair.request` und `node.pair.verify`. Ausstehende
Anfragen werden während Node-Verbindungen vom Gateway selbst erstellt, und das
eigenständige Node-spezifische Token, dem sie dienten, existiert nicht mehr; die Node-Authentifizierung erfolgt über das
Gerätekopplungstoken.

Hinweise:

- Erneute Verbindungen mit unveränderter Oberfläche verwenden die ausstehende Anfrage erneut; wiederholte
  Anfragen aktualisieren die gespeicherten Node-Metadaten und den neuesten Snapshot der
  deklarierten Befehle auf der Positivliste zur Einsicht durch Operatoren.
- Operator-Berechtigungsstufen und Prüfungen zum Genehmigungszeitpunkt werden unter
  [Operator-Berechtigungen](/de/gateway/operator-scopes) zusammengefasst.
- `node.pair.approve` verwendet die deklarierten Befehle der ausstehenden Anfrage, um
  zusätzliche Genehmigungsberechtigungen durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - gewöhnliche Befehlsanfrage: `operator.pairing` + `operator.write`
  - administrativ sensible Anfrage, die `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` oder
    `system.execApprovals.get/set` enthält: `operator.pairing` + `operator.admin`

<Warning>
Die Genehmigung der Node-Kopplung zeichnet die vertrauenswürdige Funktionsoberfläche auf. Sie fixiert **nicht** die aktive Node-Befehlsoberfläche pro Node.

- Aktive Node-Befehle stammen aus den Angaben des Nodes bei der Verbindung und werden anhand
  der globalen Node-Befehlsrichtlinie des Gateways (`gateway.nodes.allowCommands` und
  `denyCommands`) gefiltert.
- Die Node-spezifische `system.run`-Zulassungs- und Nachfragerichtlinie befindet sich auf dem Node in
  `exec.approvals.node.*`, nicht im Kopplungsdatensatz.

</Warning>

## Steuerung von Node-Befehlen (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis die Node-Kopplung genehmigt wurde. Die Gerätekopplung allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn ein Node zum ersten Mal eine Verbindung herstellt, wird die Kopplung automatisch angefordert.
Bis zur Genehmigung dieser Anfrage werden alle ausstehenden Node-Befehle dieses Nodes
gefiltert und nicht ausgeführt. Sobald die Kopplung genehmigt wurde, werden die deklarierten
Befehle des Nodes gemäß der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die zuvor ausschließlich auf die Gerätekopplung angewiesen waren, um Befehle bereitzustellen, müssen
  nun zusätzlich die Node-Kopplung abschließen.
- Vor der Kopplungsgenehmigung in die Warteschlange gestellte Befehle werden verworfen, nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Inkompatible Änderung:** Von Nodes stammende Ausführungen bleiben nun auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes stammende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die
vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgesteuerte oder von Nodes ausgelöste Abläufe, die
zuvor auf umfassenderen Zugriff auf Host- oder Sitzungstools angewiesen waren, müssen möglicherweise angepasst werden.
Diese Härtung verhindert, dass Node-Ereignisse über die zulässige Vertrauensgrenze des Nodes hinaus
zu Toolzugriff auf Hostebene eskalieren.

Dauerhafte Aktualisierungen der Node-Präsenz folgen derselben Identitätsgrenze: Das
Ereignis `node.presence.alive` wird nur von authentifizierten Node-Gerätesitzungen
akzeptiert und aktualisiert Kopplungsmetadaten nur, wenn die Geräte-/Node-Identität
bereits gekoppelt ist. Ein selbst deklarierter Wert `client.id` reicht nicht aus, um
den Zuletzt-gesehen-Zustand zu schreiben.

## SSH-verifizierte automatische Gerätegenehmigung (Standard)

Die erstmalige Gerätekopplung für `role: node` von einer privaten/CGNAT-Adresse wird
automatisch genehmigt, wenn das Gateway den **Maschinenbesitz über SSH nachweisen** kann: Es
verbindet sich zurück zum Kopplungshost (`BatchMode`, `StrictHostKeyChecking=yes`),
führt dort `openclaw node identity --json` aus und genehmigt nur, wenn die entfernte
Geräte-ID und der öffentliche Schlüssel exakt mit der ausstehenden Anfrage übereinstimmen. Der Schlüsselabgleich
gewährleistet die Sicherheit: Erreichbarkeit allein führt niemals zur Genehmigung, sodass NAT-Mitnutzer,
andere Benutzer auf einem gemeinsam genutzten Host und LAN-Spoofing sämtlich auf die normale
Aufforderung zurückfallen.

Standardmäßig aktiviert. Voraussetzungen für die Auslösung:

- Der Benutzer des Gateway-Prozesses (oder `sshVerify.user`) kann nicht interaktiv per SSH auf den Node-Host zugreifen
  (Schlüssel/Agent; Tailscale SSH funktioniert ebenfalls), und der Hostschlüssel ist
  bereits vertrauenswürdig.
- `openclaw` wird auf dem entfernten `PATH` für nicht interaktives `sh -lc` aufgelöst.
- Die verbindende IP ist eine direkte (nicht über einen Proxy geleitete, nicht Loopback-) private, ULA-,
  Link-Local- oder CGNAT-Adresse oder stimmt, sofern festgelegt, mit `sshVerify.cidrs` überein.
- Dieselbe Mindestvoraussetzung wie für die Genehmigung vertrauenswürdiger CIDRs: nur neue Node-Kopplungen
  ohne Berechtigungen; Upgrades, Browser, Control UI und WebChat fordern immer zur Genehmigung auf.

Während eine Prüfung läuft, wird der Node-Client angewiesen, die Versuche fortzusetzen
(`wait_then_retry`), anstatt für eine manuelle Genehmigung zu pausieren; schlägt die Prüfung
fehl, fällt der nächste Versuch auf den normalen Aufforderungsablauf zurück. Fehlgeschlagene Ziele
erhalten eine kurze Sperrzeit (5 Minuten nach einer fehlgeschlagenen Schlüsselübereinstimmung).

Genehmigte Geräte zeichnen `approvedVia: "ssh-verified"` auf, und ihre erste deklarierte
Funktionsoberfläche wird im selben Schritt genehmigt — die Schlüsselübereinstimmung weist bereits nach,
dass der Node unter dem Konto des Operators auf einer eigenen Maschine ausgeführt wird, was derselben
Aussage entspricht, die eine manuelle Funktionsgenehmigung bestätigt. Spätere Oberflächenerweiterungen fordern weiterhin
zur Genehmigung auf.

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

Die macOS-App kann eine **stille Genehmigung** von Anfragen für Node-Funktionen versuchen,
wenn:

- die Anfrage mit `silent` gekennzeichnet ist (das Gateway kennzeichnet die erste Funktionsoberfläche
  als still, wenn die Gerätekopplung nicht interaktiv genehmigt wurde), und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben
  Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale Approve/Reject-Aufforderung zurück.

## Automatische Gerätegenehmigung für vertrauenswürdige CIDRs

Die WS-Gerätekopplung für `role: node` bleibt standardmäßig manuell. Für private Node-
Netzwerke, in denen das Gateway dem Netzwerkpfad bereits vertraut, können Operatoren dies
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
- Es gibt keinen pauschalen Modus für automatische Genehmigungen im LAN oder privaten Netzwerk; die SSH-verifizierte
  automatische Genehmigung (oben) erfordert eine kryptografische Übereinstimmung des Geräteschlüssels, niemals
  ausschließlich die lokale Netzwerknähe.
- Nur eine neue Gerätekopplungsanfrage für `role: node` ohne angeforderte Berechtigungen ist
  zulässig.
- Operator-, Browser-, Control-UI- und WebChat-Clients bleiben manuell.
- Upgrades von Rolle, Berechtigung, Metadaten und öffentlichem Schlüssel bleiben manuell.
- Loopback-Pfade für Trusted-Proxy-Header auf demselben Host sind nicht zulässig, da dieser
  Pfad von lokalen Aufrufern gefälscht werden kann.

## Bereinigung bei Ersetzung stiller Kopplungen

Nicht interaktive Genehmigungen zeichnen ihren Ursprung in der Zeile des gekoppelten Geräts auf:
Genehmigungen durch lokale Richtlinien auf demselben Host als `silent`, Node-Genehmigungen für vertrauenswürdige CIDRs als
`trusted-cidr`, SSH-verifizierte Node-Genehmigungen als `ssh-verified`. Clients mit einem flüchtigen Zustandsverzeichnis (temporäre Home-Verzeichnisse,
Container, Sandboxes pro Ausführung) erzeugen bei jeder Ausführung ein neues Geräteschlüsselpaar, und jede
Ausführung koppelt sich still als völlig neues Gerät — ohne Bereinigung wächst die Liste gekoppelter Geräte
pro Ausführung um eine veraltete Zeile.

Wenn das Gateway eine **lokale** Gerätekopplung still genehmigt, entfernt es
ältere mit `silent` genehmigte Datensätze, die zum selben Client-Cluster gehören
(übereinstimmende `clientId`, `clientMode` und Anzeigename) und derzeit nicht
verbunden sind. Lokale Clients werden auf dem Gateway-Host selbst ausgeführt, sodass der Cluster-Schlüssel
nicht mit einer anderen Maschine übereinstimmen kann. Entfernte Zeilen verlieren ihre Token sofort;
jeder übereinstimmende Legacy-Node-Kopplungseintrag wird gelöscht und ein `node.pair.resolved`-
Entfernungsereignis wird gesendet.

Grenzen:

- Nur Datensätze, deren letzte Genehmigung lokal auf demselben Host (`silent`) erfolgte, kommen
  sowohl als Auslöser als auch als Ziel infrage. Durch vertrauenswürdige CIDRs und SSH verifizierte Kopplungen
  erstrecken sich über mehrere Hosts, auf denen Anzeigemetadaten keine Maschinenidentität darstellen. Daher werden sie
  niemals automatisch entfernt – verwenden Sie hierfür die Bereinigung in der Control UI oder
  `openclaw nodes remove`.
- Vom Eigentümer genehmigte Kopplungen und Kopplungen per QR-/Einrichtungscode (Bootstrap) werden niemals
  automatisch entfernt. Datensätze, die vor Einführung der Herkunftsinformationen genehmigt wurden, bleiben geschützt,
  selbst nach einer späteren stillen erneuten Genehmigung derselben Geräte-ID.
- Derzeit verbundene Geräte werden übersprungen, sodass gleichzeitige lokale Sitzungen mit
  separaten Zustandsverzeichnissen ihre Tokens behalten, solange sie aktiv sind. Datensätze, die
  innerhalb der letzten Minute genehmigt wurden, werden ebenfalls übersprungen, sodass gleichzeitige Kopplungs-Handshakes
  einander nicht aufheben können, bevor ihre Verbindungen registriert wurden.
- Betroffene Clients sind grundsätzlich lokal und koppeln sich daher bei
  ihrer nächsten Verbindung still erneut.

## Automatische Genehmigung bei Metadatenaktualisierungen

Wenn sich ein bereits gekoppeltes Gerät erneut verbindet und lediglich nicht vertrauliche Metadaten
geändert wurden (beispielsweise Anzeigename oder Hinweise zur Clientplattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille automatische Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige lokale Nicht-Browser-Wiederverbindungen, die bereits den Besitz
lokaler oder gemeinsam genutzter Anmeldedaten nachgewiesen haben, einschließlich erneuter Verbindungen nativer Apps auf demselben Host nach
Änderungen der Metadaten zur Betriebssystemversion. Browser-/Control-UI-Clients und Remote-Clients
verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung. Erweiterungen des Geltungsbereichs (von Lesen auf
Schreiben/Administration) und Änderungen des öffentlichen Schlüssels kommen **nicht** für eine
automatische Genehmigung bei Metadatenaktualisierungen infrage; sie bleiben explizite Anfragen zur erneuten Genehmigung.

## Hilfsfunktionen für die QR-Kopplung

`/pair qr` stellt die Kopplungsnutzlast als strukturierte Medien dar, sodass mobile und
Browser-Clients sie direkt scannen können.

Beim Löschen eines Geräts werden auch alle veralteten ausstehenden Kopplungsanfragen für diese
Geräte-ID entfernt, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Bei der Gateway-Kopplung gilt eine Verbindung nur dann als Loopback-Verbindung, wenn sowohl der rohe Socket
als auch sämtliche Hinweise eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage über Loopback eingeht, aber
`Forwarded`, einen beliebigen `X-Forwarded-*`- oder `X-Real-IP`-Header-Hinweis enthält, schließen diese
Hinweise aus weitergeleiteten Headern die Einstufung als lokale Loopback-Verbindung aus, und der
Kopplungspfad erfordert eine explizite Genehmigung, anstatt die
Anfrage still als Verbindung auf demselben Host zu behandeln. Die entsprechende Regel für die
Operatorauthentifizierung finden Sie unter
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Speicherung (lokal, privat)

Der Kopplungsstatus befindet sich in den Datensätzen der gekoppelten Geräte in der gemeinsamen SQLite-Zustandsdatenbank
unter dem Gateway-Zustandsverzeichnis (standardmäßig `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelte Geräte mit Geräteauthentifizierung,
  genehmigten Node-Oberflächen, ausstehenden Oberflächenanfragen, ausstehenden Gerätekopplungsanfragen
  und Bootstrap-Tokens)

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird die Datenbank entsprechend verschoben. Gateways,
die von Releases mit JSON-Speichern aktualisiert wurden, importieren diese beim Start und hinterlassen
die Archive `devices/*.json.migrated` und `nodes/*.json.migrated`.

Sicherheitshinweise:

- Geräte-Tokens sind Geheimnisse; behandeln Sie die Zustandsdatenbank als vertraulich.
- Zum Rotieren eines Geräte-Tokens dienen `openclaw devices rotate` /
  `device.token.rotate`.

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaften.
- Wenn das Gateway offline oder die Kopplung deaktiviert ist, können sich Nodes nicht koppeln.
- Im Remote-Modus erfolgt die Kopplung mit dem Speicher des Remote-Gateways.

## Verwandte Themen

- [Kanalkopplung](/de/channels/pairing)
- [Nodes-CLI](/de/cli/nodes)
- [Geräte-CLI](/de/cli/devices)
