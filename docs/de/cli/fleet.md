---
read_when:
    - Sie hosten mehrere Vertrauensdomänen verschiedener Mandanten auf einem Rechner.
    - Sie müssen Flottenzellen erstellen, prüfen, aktualisieren oder entfernen.
summary: CLI-Referenz zur Bereitstellung und Verwaltung isolierter mandantenspezifischer OpenClaw-Zellen
title: Flotte
x-i18n:
    generated_at: "2026-07-12T15:12:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160c1242073f506c2a2f98481f4ec933a073fd3da0bc20c4cee3e146a38e293
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` verwaltet vollständige OpenClaw-Instanzen, die als **Zellen** bezeichnet werden. Jede Zelle verfügt über einen eigenen Gateway, Zustand, eigene Anmeldedaten, Kanalkonten, einen Container und einen ausschließlich über Loopback erreichbaren Host-Port. Verwenden Sie für jede Vertrauensgrenze eines Mandanten eine eigene Zelle; verwenden Sie einen gemeinsam genutzten Gateway nicht als Grenze zwischen nicht vertrauenswürdigen Mandanten.

Fleet ist **experimentell**. Befehlsnamen, Flags, Ausgabeformate und das Containerprofil können sich zwischen Releases ohne Übergangsfrist ändern, solange sich die Schnittstelle noch stabilisiert.

Fleet unterstützt Docker und Podman. Das Standard-Image ist `ghcr.io/openclaw/openclaw:latest`.

Fleet wird auf Linux- und macOS-Hosts getestet. Windows-Hosts sind derzeit nicht getestet.

## Schnellstart

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` gibt das generierte Gateway-Token einmal zusammen mit der URL der Zelle aus. Speichern Sie das Token sofort und konfigurieren Sie anschließend die Kanalkonten jedes Mandanten innerhalb der Zelle dieses Mandanten.

## Mandanten-IDs

Mandanten-IDs müssen folgendem Muster entsprechen:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Zulässig sind 1 bis 40 Kleinbuchstaben, Ziffern und Bindestriche innerhalb der ID. Eine ID muss mit einem Buchstaben oder einer Ziffer beginnen und enden. Großbuchstaben, Unterstriche, Schrägstriche, Punkte, Leerzeichen und Pfadnavigationselemente wie `../acme` werden abgelehnt.

Die ID wird Teil des Containernamens: `openclaw-cell-<tenant>`.

## `fleet create`

Erstellen und starten Sie eine Zelle:

```bash
openclaw fleet create acme
```

Erstellen Sie eine Podman-Zelle an einem festen Port, ohne sie zu starten:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Übergeben Sie mandantenspezifische Umgebungsvariablen, indem Sie `--env` wiederholen:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Umgebungsschlüssel dürfen Buchstaben, Ziffern und Unterstriche enthalten und nicht mit einer Ziffer beginnen. Werte müssen einzeilig sein, da Fleet sie über eine geschützte Laufzeit-Umgebungsdatei übergibt. Fleet lehnt Versuche ab, die unter [Speicher- und Container-Layout](#storage-and-container-layout) aufgeführten verwalteten Variablen für Containerpfade und Gateway-Token zu überschreiben.

### Erstellungsoptionen

| Option                    | Standardwert                           | Beschreibung                                                                                                                         |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`     | Container-Image für die Zelle.                                                                                                       |
| `--runtime <runtime>`     | `docker`                               | Container-CLI: `docker` oder `podman`.                                                                                               |
| `--port <number>`         | Automatisch ab `19100` zugewiesen      | Loopback-Host-Port. Ein explizit ausgewählter Port darf keiner anderen registrierten Zelle zugeordnet sein.                           |
| `--memory <value>`        | `2g`                                   | Arbeitsspeicherlimit des Containers in Docker-/Podman-Syntax.                                                                        |
| `--cpus <value>`          | `2`                                    | CPU-Limit des Containers.                                                                                                            |
| `--disk <size>`           | Keiner                                 | Begrenzt die beschreibbare Container-Schicht, sofern das Speicher-Backend Kontingente unterstützt.                                   |
| `--network <mode>`        | `bridge`                               | Modus für ausgehende Netzwerkverbindungen: `bridge` oder `internal`.                                                                 |
| `--pids-limit <number>`   | `512`                                  | Maximale Anzahl von Prozessen im Container.                                                                                           |
| `--env <KEY=VALUE>`       | Keiner                                 | Übergibt eine Umgebungsvariable an die Zelle. Für mehrere Werte wiederholen.                                                          |
| `--gateway-token <value>` | Zufälliges 32-stelliges Hexadezimaltoken | Verwendet ein bereitgestelltes Gateway-Token, statt eines zu generieren. Siehe [Token-Handhabung](#token-handling).                    |
| `--no-start`              | Zelle wird gestartet                   | Erstellt den Container, ohne ihn zu starten.                                                                                          |
| `--json`                  | Für Menschen lesbare Ausgabe           | Gibt eine maschinenlesbare Ausgabe aus.                                                                                               |

Bei der automatischen Zuweisung wird der erste ungenutzte Registry-Port ab `19100` ausgewählt. Fleet lehnt doppelte Mandanten-IDs und explizite Ports ab, die bereits einer anderen Zelle zugewiesen sind.

Image-Referenzen werden als einzelnes Argument an die Container-Laufzeit übergeben. Leere Referenzen und Werte, die mit `-` beginnen, werden abgelehnt, damit ein Image nicht als Docker- oder Podman-Option interpretiert werden kann.

Der ausgewählte Docker- oder Podman-Endpunkt muss lokal sein. Fleet lehnt entfernte Docker-Kontexte, `DOCKER_HOST`-Endpunkte und entfernte Podman-Dienste ab, bevor ein Port reserviert oder lokaler Zustand erstellt wird. Entfernte Zellen-Hosts benötigen einen separaten Speicher- und Endpunktvertrag und sind in diesem MVP nicht vorgesehen.

Wenn Fleet eine neue Zelle startet, wartet der Erstellungsvorgang bis zu etwa einer Minute darauf, dass ihr Gateway auf `/healthz` antwortet. Wenn die Zelle nicht fehlerfrei wird, lässt Fleet ihren Container und Registry-Eintrag für `fleet status`, `fleet logs` oder eine explizite Entfernung bestehen. `--no-start` überspringt diese Zustandsprüfung. Das generierte Gateway-Token einer fehlerhaften neuen Zelle geht nicht verloren – es verbleibt in der Container-Umgebung (`docker|podman inspect`). Da die Zelle noch keinen Datenverkehr verarbeitet hat, ist `fleet rm --force` gefolgt von einer erneuten Erstellung immer eine sichere Alternative.

### Anheften per Digest

Erstellung und Upgrade akzeptieren Digest-fixierte Image-Referenzen wie `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet übergibt die Image-Referenz unverändert an Docker oder Podman. Dadurch kann ein Betreiber eine Zelle auf unveränderlichen Image-Bytes halten, anstatt ein veränderliches Tag zu verwenden.

Das Ergebnis der Erstellung enthält die Mandanten-ID, den Containernamen, den Host-Port, das Gateway-Token und die lokale URL. Behandeln Sie das Ergebnis auch bei einer JSON-Ausgabe als geheimnishaltig, da es das Token enthält.

### Datenträgerlimits

`--disk` begrenzt nur die beschreibbare Schicht des Containers. Die per Bind-Mount eingebundenen mandantenspezifischen Zustands- und Authentifizierungsverzeichnisse verbleiben im Hostspeicher; verwenden Sie Projektkontingente des Hostdateisystems, wenn auch für diese Verzeichnisse ein festes Limit erforderlich ist.

| Laufzeit-/Speicher-Backend | Unterstützung für `--disk`                                                   |
| -------------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 auf XFS    | Erfordert die XFS-Mount-Option `pquota`.                                      |
| Docker btrfs oder zfs      | Wird vom Speichertreiber unterstützt.                                        |
| Podman overlay             | Erfordert XFS als zugrunde liegenden Speicher.                               |
| Andere Backends            | Die Containererstellung schlägt mit dem Daemon-Fehler und den Backend-Hinweisen von Fleet fehl. |

### Egress-Richtlinie

| Modus      | Docker                                                                                                         | Podman                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `bridge`   | Unterstützt; ausgehender Netzwerkverkehr ist standardmäßig uneingeschränkt.                                    | Unterstützt; ausgehender Netzwerkverkehr ist standardmäßig uneingeschränkt.                          |
| `internal` | Wird abgelehnt, da Docker den veröffentlichten Loopback-Gateway-Port in einem internen Netzwerk nicht beibehält. | Unterstützt; das Loopback-Gateway bleibt veröffentlicht, während ausgehender Netzwerkverkehr blockiert wird. |

Behalten Sie für Docker den Bridge-Modus bei und erzwingen Sie die Richtlinie für ausgehenden Netzwerkverkehr mit Host-Firewallregeln wie der `DOCKER-USER`-Kette.

## `fleet list`

Zellen in der Reihenfolge der Mandanten-IDs auflisten:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Die Tabelle enthält:

| Spalte    | Bedeutung                                                                                                                                                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | Mandanten-ID.                                                                                                                                                                                                                                                                            |
| `state`   | Aktueller Containerzustand aus der Docker- oder Podman-Inspektion. `unknown` bedeutet, dass die Laufzeit nicht verfügbar war oder ein Container mit dem Namen der Zelle vorhanden ist, dessen Fleet-Eigentumslabels jedoch nicht mit dem Registrierungseintrag übereinstimmen (ein Hinweis auf eine Kollision oder Manipulation — prüfen Sie ihn manuell, bevor Sie handeln). |
| `port`    | Loopback-Host-Port, der dem Gateway der Zelle zugeordnet ist.                                                                                                                                                                                                                             |
| `image`   | Aufgezeichnetes Container-Image.                                                                                                                                                                                                                                                         |
| `created` | Erstellungszeitpunkt der Zelle.                                                                                                                                                                                                                                                          |

Registrierungszeilen bleiben sichtbar, wenn Docker oder Podman nicht verfügbar ist; nur der aktuelle Zustand wird zu `unknown`.

## `fleet status`

Eine Zelle prüfen:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Der Status kombiniert die Zeile der Fleet-Registrierung, die aktuelle Containerinspektion und eine kurze Best-Effort-Anfrage an:

```text
http://127.0.0.1:<host-port>/healthz
```

Das Ergebnis der Integritätsprüfung lautet `ok`, `failed` oder `skipped`. `/healthz` weist die Erreichbarkeit des Gateway nach, nicht die vollständige Betriebsbereitschaft jedes konfigurierten Channels oder Plugins. Die Prüfung wird übersprungen, wenn kein verwendbarer lokaler Endpunkt verfügbar ist.

## `fleet logs`

Die Containerprotokolle einer Zelle direkt an das Terminal streamen:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet überprüft die Eigentumslabels des registrierten Containers, bevor Protokolle gelesen werden, und verweigert daher den Zugriff auf einen fremden Container, der den erwarteten Zellennamen verwendet. Drücken Sie Strg-C, um `--follow` zu beenden, ohne den Abbruch durch den Bediener als Befehlsfehler zu behandeln. Die Protokollausgabe wird durch einen Schwärzungsfilter geleitet, der das aktuelle Gateway-Token der Zelle durch `<redacted>` ersetzt, bevor Daten das Terminal erreichen.

`fleet logs` hat keinen `--json`-Modus, da Containerprotokolle einen unverarbeiteten stdout/stderr-Datenstrom darstellen. Begrenzen Sie für Skripte die Ausgabe mit `--tail` und verwenden Sie die gewöhnliche Shell-Umleitung oder Pipelines.

## `fleet start`, `fleet stop` und `fleet restart`

Eine vorhandene Zelle mit ihrer aufgezeichneten Laufzeit steuern:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Diese Befehle arbeiten mit dem registrierten Containernamen. Sie schlagen fehl, wenn der Mandant unbekannt ist oder die aufgezeichnete Laufzeit den Vorgang nicht ausführen kann.

## `fleet upgrade`

Das aufgezeichnete Image erneut abrufen und den Container der Zelle ersetzen:

```bash
openclaw fleet upgrade acme
```

Verschieben Sie die Zelle auf ein anderes Image:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Beim Upgrade wird das Ziel-Image abgerufen, der vorhandene Container und das zellenspezifische Netzwerk werden geprüft, der Container wird gestoppt und entfernt und anschließend neu erstellt und gestartet. Der Ersatz behält denselben Host-Port, dieselben Datenverzeichnisse, dasselbe zellenspezifische Bridge-Netzwerk, dasselbe Laufzeitprofil, dieselben Ressourcenlimits, dieselbe Neustartrichtlinie, dieselbe von Fleet verwaltete Umgebung sowie die ursprünglich mit `--env` angegebenen Werte bei. Eingebundener Zustand bleibt beim Ersetzen des Containers erhalten; die standardmäßige Image-Umgebung kann sich mit dem Ziel-Image ändern.

Der Ersatz wird erst übernommen, nachdem sein Gateway auf dem Loopback-Port der Zelle auf `/healthz` antwortet und damit dem Health-Check-Vertrag entspricht, den die offizielle Compose-Datei verwendet. Ein Ersatz, der beendet wird, wiederholt abstürzt oder nicht innerhalb von etwa einer Minute fehlerfrei wird, wird entfernt und der vorherige Container wird wiederhergestellt, sodass ein fehlerhaftes Image keine funktionierende Zelle außer Betrieb setzt.

Das Gateway-Token wird absichtlich nicht in der Fleet-Registry gespeichert. Bevor Fleet den alten Container entfernt, liest Fleet dessen Umgebung aus und übernimmt `OPENCLAW_GATEWAY_TOKEN` in den Ersatz. Entfernen Sie den alten Container vor einem Upgrade nicht manuell, wenn das Token an keiner anderen von Ihnen kontrollierten Stelle vorhanden ist.

## `fleet backup` und `fleet restore`

Sichern Sie eine gestoppte Zelle:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Stellen Sie dieses Archiv in der registrierten Zelle wieder her:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Dies sind privilegierte Befehle für Host-Operatoren. Archive enthalten Mandantenzustand und Authentifizierungsgeheimnisse, werden mit dem Modus `0600` erstellt und müssen wie Anmeldedaten gespeichert werden. Backup verweigert die Sicherung einer laufenden Zelle, damit der SQLite-Zustand konsistent erfasst wird. Restore verweigert die Wiederherstellung einer laufenden Zelle, sofern nicht `--force` angegeben wird, ersetzt ausschließlich den Zustand dieses Mandanten, rotiert das Gateway-Token und gibt das neue Token einmal aus. Fleet sichert jeweils einen Mandanten; eine Sicherung aller Mandanten ist eine separate Operatoraktion.

Beide Befehle akzeptieren `--max-bytes <bytes>`, um die Menge der archivierten oder extrahierten Dateidaten zu begrenzen, und beide wenden dasselbe feste Budget von einer Million Archivpfadsegmenten an, damit rein metadatenbasierte Archivbomben die Inodes des Hosts nicht erschöpfen können und jede akzeptierte Sicherung wiederherstellbar bleibt. Backup akzeptiert `--out <path>`, und beide Befehle unterstützen `--json`.

Archive enthalten ausschließlich reguläre Dateien und Verzeichnisse. Backup folgt niemals symbolischen Links und speichert weder symbolische Links noch Hardlinks, Sockets oder Geräteknoten; die Anzahl der übersprungenen Einträge wird im Ergebnis angegeben. Restore lehnt Archive ab, die einen anderen Eintragstyp enthalten. Neu erstellbare Bäume symbolischer Links wie `node_modules` im Workspace müssen nach einer Wiederherstellung innerhalb der Zelle neu installiert werden.

## `fleet doctor`

Prüfen Sie alle Zellen oder einen einzelnen Mandanten, ohne den Laufzeit- oder Dateisystemzustand zu ändern:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor prüft Laufzeitlokalität, Eigentümerlabels, Systemzustand, Härtung, Ressourcenlimits, die Bindung des Loopback-Ports, das Vorhandensein des Tokens, Netzwerkeigentum und Egress-Modus sowie die Berechtigungen privater Zustandsverzeichnisse. Warnungen beschreiben gestoppte Zellen oder Abweichungen beim Eigentum; jeder fehlgeschlagene Befund führt zu einem von null verschiedenen Prozess-Exitcode.

## `fleet rm`

Entfernen Sie eine gestoppte Zelle aus der Laufzeit und Registry, während die Mandantendaten erhalten bleiben:

```bash
openclaw fleet rm acme
```

Für einen laufenden Container ist `--force` erforderlich:

```bash
openclaw fleet rm acme --force
```

Entfernen Sie außerdem die Zelldaten dauerhaft:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet entfernt den Zellencontainer, bevor das zugehörige dedizierte Bridge-Netzwerk entfernt wird. `--purge-data` erfordert `--force`. Vor der rekursiven Löschung löst Fleet sowohl die beiden Fleet-eigenen Stammverzeichnisse als auch die beiden mandantenspezifischen Verzeichnisse auf. Jedes Ziel muss exakt das erwartete Mandanten-Endverzeichnis sein, sich strikt innerhalb seines Stammverzeichnisses befinden und darf kein symbolischer Link sein. Diese Eingrenzungsprüfungen verhindern, dass ein beschädigter Registry-Pfad oder ein mandantenübergreifender symbolischer Link die Löschung an eine andere Stelle umleitet.

Die Bereinigung kann erneut ausgeführt werden, wenn ein exakt erwartetes Mandantenverzeichnis bereits fehlt. Dadurch kann ein späterer Aufruf die Bereinigung nach einem teilweisen Dateisystemfehler abschließen, ohne die Pfadprüfungen für noch vorhandene Verzeichnisse zu lockern.

## Speicher- und Containerlayout

Zellenzustand und Verschlüsselungsschlüssel für Authentifizierungsprofile verwenden separate mandantenspezifische Hostpfade unter dem aktiven OpenClaw-Zustandsverzeichnis:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

Das erste Verzeichnis wird unter `/home/node/.openclaw` eingebunden. Das zweite wird unter `/home/node/.config/openclaw` eingebunden und entspricht damit der Einbindung des Verschlüsselungsschlüssels in der offiziellen Docker-Konfiguration. Der Verschlüsselungsschlüssel wird daher weder unterhalb der regulären Zustandseinbindung offengelegt noch einbezogen, wenn nur das Zellenzustandsverzeichnis gesichert oder freigegeben wird. Beide Verzeichnisse bleiben bei normaler Entfernung und bei Upgrades erhalten; `fleet rm --purge-data --force` löscht beide nach separaten Eingrenzungsprüfungen.

Vor dem ersten Start initialisiert Fleet die Zellenkonfiguration mit `gateway.mode=local`, Token-Authentifizierung, der LAN-Containerbindung und Control-UI-Ursprüngen für den zugewiesenen Host-Port. Der Tokenwert wird nicht in diese Konfiguration geschrieben; er verbleibt in der Containerumgebung.

Fleet legt die Containerpfade des offiziellen Images mit diesen Umgebungswerten fest:

| Variable                 | Containerwert                         |
| ------------------------ | ------------------------------------- |
| `HOME`                   | `/home/node`                          |
| `OPENCLAW_HOME`          | `/home/node`                          |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`                |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json`  |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`      |
| `OPENCLAW_GATEWAY_TOKEN` | Generiertes oder angegebenes Zellentoken |

Das offizielle Image verwendet standardmäßig den Nicht-Root-Benutzer `node` mit UID 1000. Fleet hält die privaten `0700`-Bind-Mounts beschreibbar, ohne sie für alle zugänglich zu machen. Rootful Docker führt die Zelle mit der UID und GID des aufrufenden Nicht-Root-Benutzers aus; rootless Docker verwendet Container-UID 0, die innerhalb des Benutzer-Namespace des Daemons dem aufrufenden unprivilegierten Hostbenutzer zugeordnet wird. Podman verwendet `keep-id` mit der aufrufenden UID und GID. Wenn Fleet selbst als Root mit einer rootful Laufzeit ausgeführt wird, behält es den Image-Benutzer bei und weist die anfänglichen Mount-Dateien UID/GID 1000 zu.

Auf SELinux-Hosts erhalten Docker- und Podman-Mounts eine private `:Z`-Neukennzeichnung. Wenn Sie Zelldaten wiederherstellen oder verschieben, müssen die eingebundenen Pfade für den effektiven Containerbenutzer beschreibbar bleiben. Das Profil ist für rootless Betrieb geeignet, Docker oder Podman muss jedoch bereits auf dem Host für rootless Betrieb konfiguriert sein; Fleet wandelt einen rootful Daemon nicht in einen rootless Daemon um.

## Sicherheitsprofil

Fleet wendet auf jede Zelle das folgende Profil an:

| Kontrollmaßnahme       | Angewendetes Profil                                  | Grund                                                                                              |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Linux-Capabilities     | `--cap-drop=ALL`                                     | Das Gateway ist ein Node.js-Prozess und benötigt keine zusätzlichen Linux-Capabilities.            |
| Rechteausweitung       | `--security-opt no-new-privileges`                   | Verhindert, dass Prozesse über setuid- oder setgid-Binärdateien zusätzliche Rechte erhalten.        |
| Init-Prozess           | `--init`                                             | Bereinigt untergeordnete Prozesse und leitet Signale des Containerlebenszyklus weiter.              |
| Prozesslimit           | Standardmäßig `--pids-limit 512`                     | Begrenzt die Erschöpfung durch Forks und Prozesse.                                                  |
| Arbeitsspeicherlimit   | Standardmäßig `--memory 2g`                          | Begrenzt die Arbeitsspeichernutzung der Zelle.                                                      |
| CPU-Limit              | Standardmäßig `--cpus 2`                             | Begrenzt die CPU-Nutzung der Zelle.                                                                |
| Beschreibbarer Layer   | Optional `--disk`                                    | Begrenzt den Container-Layer, wenn das Speicher-Backend der Laufzeit Kontingente unterstützt.       |
| Neustartrichtlinie     | `--restart unless-stopped`                           | Startet eine ausgefallene Zelle neu, ohne ein absichtliches Stoppen außer Kraft zu setzen.          |
| Host-Veröffentlichung  | Nur `127.0.0.1:<host-port>:18789`                    | Hält das Gateway von Wildcard-Hostschnittstellen fern.                                             |
| Zellennetzwerk         | Eine Bridge oder ein internes Podman-Netzwerk je Zelle | Trennt den Datenverkehr zwischen Container-IPs und blockiert optional ausgehenden Podman-Datenverkehr. |
| Containeridentität     | Dem Host entsprechende Benutzerzuordnung             | Hält private Bind-Mounts beschreibbar, ohne allgemeinen Zugriff zu gewähren.                        |
| Persistenter Zustand   | Zellspezifische Mounts; keine gemeinsame Zustandseinbindung | Hält Mandantenkonfiguration, Anmeldedaten, Sitzungen und Workspaces im Datenbaum dieses Mandanten. |
| Containerbefehl        | `node dist/index.js gateway --bind lan --port 18789` | Lauscht im Containernetzwerk, sodass die ausschließlich an Loopback gebundene Host-Port-Zuordnung darauf zugreifen kann. |

Fleet bindet niemals `/var/run/docker.sock` ein, verwendet weder `--privileged` noch Host-Netzwerkbetrieb und fügt keine Capabilities hinzu. Die zellenspezifische Bridge ist eine Trennungsgrenze zwischen Zellen, keine ausgehende Firewall: Zellen behalten den für Provider und Kanäle erforderlichen Netzwerk-Egress. Schalten Sie dem Loopback-Port einen Proxy, SSH-Tunnel oder eine Tailnet-Konfiguration vor, die zu Ihrer Bereitstellung passt. `http://127.0.0.1:<port>` ist nur vom Fleet-Host aus direkt erreichbar.

Dieses Profil trennt Mandantencontainer, schützt Mandanten jedoch nicht vor dem Fleet-Operator, dem Administrator der Containerlaufzeit oder einem kompromittierten Host. Das vollständige Vertrauensmodell und stärkere Isolierungsoptionen finden Sie unter [Mandantenfähiges Hosting](/gateway/multi-tenant-hosting).

## Token-Handhabung

Standardmäßig generiert `fleet create` ein kryptografisch zufälliges hexadezimales Gateway-Token mit 32 Zeichen und gibt es einmal im Erstellungsergebnis aus. Speichern Sie es in Ihrer genehmigten Geheimnisverwaltung und vermeiden Sie, die Erstellungsausgabe in Protokollen zu erfassen.

`--gateway-token` platziert ein benutzerdefiniertes Token in den Argumenten des lokalen Prozesses, die möglicherweise im Shellverlauf gespeichert werden oder in Prozesslisten sichtbar sind. Bevorzugen Sie das generierte Token, sofern kein bestehender Arbeitsablauf zur Geheimnisverwaltung einen angegebenen Wert erfordert.

Das Token und jeder mit `--env` übergebene Wert befinden sich in der Containerumgebung. Fleet schreibt sie in eine kurzlebige Umgebungsdatei mit dem Modus `0600`, übergibt Docker oder Podman ausschließlich den Pfad dieser Datei und entfernt sie, nachdem der Laufzeitbefehl abgeschlossen ist. Werte, die explizit in `openclaw fleet create --gateway-token ...` oder `--env KEY=VALUE` eingegeben werden, können weiterhin in den Argumenten des äußeren `openclaw`-Prozesses und im Shellverlauf sichtbar sein.

Containerumgebungswerte werden vor dem vertrauenswürdigen Host-Operator nicht verborgen: Docker- oder Podman-Administratoren können sie durch Containerinspektion lesen. Der Hinweis „einmal angezeigt“ von Fleet beschreibt die normale CLI-Ausgabe und keinen Schutz vor einem Host-Administrator.

## Verwandte Themen

- [Mandantenfähiges Hosting](/gateway/multi-tenant-hosting)
- [Docker](/de/install/docker)
- [Podman](/de/install/podman)
- [Gateway-Sicherheit](/de/gateway/security)
