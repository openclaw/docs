---
read_when:
    - Sie hosten mehrere Vertrauensdomänen verschiedener Mandanten auf einem Computer
    - Sie müssen Flottenzellen erstellen, überprüfen, aktualisieren oder entfernen
summary: CLI-Referenz zur Bereitstellung und Verwaltung isolierter OpenClaw-Zellen pro Mandant
title: Flotte
x-i18n:
    generated_at: "2026-07-24T03:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` verwaltet vollständige OpenClaw-Instanzen, die als **Zellen** bezeichnet werden. Jede Zelle verfügt über einen eigenen Gateway, Zustand, eigene Anmeldedaten, Kanalkonten, einen Container und einen ausschließlich über Loopback erreichbaren Host-Port. Verwenden Sie für jede Mandanten-Vertrauensgrenze eine eigene Zelle; verwenden Sie keinen gemeinsam genutzten Gateway als Grenze zwischen nicht vertrauenswürdigen Mandanten.

Fleet ist **experimentell**. Befehlsnamen, Flags, Ausgabeformate und das Containerprofil können sich zwischen Releases ohne vorherige Ankündigungsfrist ändern.

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

Zulässig sind 1 bis 40 Kleinbuchstaben, Ziffern und Bindestriche im Inneren. Eine ID muss mit einem Buchstaben oder einer Ziffer beginnen und enden. Großbuchstaben, Unterstriche, Schrägstriche, Punkte, Leerraum und Traversierungszeichenfolgen wie `../acme` werden abgelehnt.

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

Umgebungsschlüssel verwenden Buchstaben, Ziffern und Unterstriche und dürfen nicht mit einer Ziffer beginnen. Werte müssen einzeilig sein, da Fleet sie über eine geschützte Laufzeit-Umgebungsdatei übergibt. Fleet lehnt Versuche ab, die unter [Speicher- und Containerlayout](#storage-and-container-layout) aufgeführten verwalteten Variablen für Containerpfade und Gateway-Token zu überschreiben.

### Erstellungsoptionen

| Option                    | Standardwert                           | Beschreibung                                                                                  |
| ------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Container-Image für die Zelle.                                                                |
| `--runtime <runtime>`     | `docker`                              | Container-CLI: `docker` oder `podman`.                                                        |
| `--port <number>`         | Automatisch ab `19100` zugewiesen  | Loopback-Host-Port. Ein explizit ausgewählter Port darf keiner anderen registrierten Zelle zugeordnet sein. |
| `--memory <value>`        | `2g`                                  | Container-Arbeitsspeicherlimit in Docker-/Podman-Syntax.                                      |
| `--cpus <value>`          | `2`                                   | Container-CPU-Limit.                                                                          |
| `--disk <size>`           | Keiner                                | Begrenzt die beschreibbare Container-Schicht, wenn das Speicher-Backend Kontingente unterstützt. |
| `--network <mode>`        | `bridge`                              | Ausgehender Netzwerkmodus: `bridge` oder `internal`.                                             |
| `--pids-limit <number>`   | `512`                                 | Maximale Anzahl von Prozessen im Container.                                                   |
| `--env <KEY=VALUE>`       | Keiner                                | Übergibt eine Umgebungsvariable an die Zelle. Für mehrere Werte wiederholen.                  |
| `--gateway-token <value>` | Zufälliges 32-stelliges hexadezimales Token | Verwendet ein bereitgestelltes Gateway-Token, anstatt eines zu generieren. Siehe [Token-Verarbeitung](#token-handling). |
| `--no-start`              | Zelle wird gestartet                  | Erstellt den Container, ohne ihn zu starten.                                                  |
| `--json`                  | Menschenlesbare Ausgabe               | Gibt eine maschinenlesbare Ausgabe aus.                                                       |

Bei der automatischen Zuweisung wird der erste ungenutzte Registry-Port ab `19100` ausgewählt. Fleet lehnt doppelte Mandanten-IDs und explizite Ports ab, die bereits einer anderen Zelle zugewiesen sind.

Image-Referenzen werden als einzelnes Argument an die Container-Laufzeit übergeben. Leere Referenzen und Werte, die mit `-` beginnen, werden abgelehnt, damit ein Image nicht als Docker- oder Podman-Option interpretiert werden kann.

Der ausgewählte Docker- oder Podman-Endpunkt muss lokal sein. Fleet lehnt entfernte Docker-Kontexte, `DOCKER_HOST`-Endpunkte und entfernte Podman-Dienste ab, bevor ein Port reserviert oder ein lokaler Zustand erstellt wird. Entfernte Zellen-Hosts werden nicht unterstützt.

Wenn Fleet eine neue Zelle startet, wartet der Erstellungsvorgang bis zu etwa einer Minute darauf, dass ihr Gateway auf `/healthz` antwortet. Wenn die Zelle nicht fehlerfrei wird, belässt Fleet ihren Container und Registry-Eintrag für `fleet status`, `fleet logs` oder eine explizite Entfernung unverändert. `--no-start` überspringt diese Zustandsprüfung. Das generierte Gateway-Token einer fehlerhaften neuen Zelle geht nicht verloren – es verbleibt in der Containerumgebung (`docker|podman inspect`). Da die Zelle noch keinen Datenverkehr verarbeitet hat, ist `fleet rm --force` mit anschließender Neuerstellung immer eine sichere Alternative.

### Fixierung per Digest

Erstellung und Upgrade akzeptieren per Digest fixierte Image-Referenzen wie `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet übergibt die Image-Referenz unverändert an Docker oder Podman. Dadurch kann eine zuständige Person eine Zelle auf unveränderlichen Image-Bytes halten, statt ein veränderliches Tag zu verwenden.

Das Erstellungsergebnis enthält die Mandanten-ID, den Containernamen, den Host-Port, das Gateway-Token und die lokale URL. Behandeln Sie das Ergebnis auch bei einer JSON-Ausgabe als geheimnishaltig, da es das Token enthält.

### Speicherplatzbegrenzungen

`--disk` begrenzt nur die beschreibbare Container-Schicht. Die eingebundenen mandantenspezifischen Zustands- und Authentifizierungsverzeichnisse verbleiben im Hostspeicher; verwenden Sie Projektkontingente des Hostdateisystems, wenn auch für diese Verzeichnisse eine feste Begrenzung erforderlich ist.

| Laufzeit/Speicher-Backend | Unterstützung für `--disk`                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| Docker overlay2 auf XFS   | Erfordert die XFS-Einhängeoption `pquota`.                                       |
| Docker btrfs oder zfs     | Wird vom Speichertreiber unterstützt.                                             |
| Podman overlay            | Erfordert XFS als zugrunde liegenden Speicher.                                    |
| Andere Backends           | Die Containererstellung schlägt mit dem Daemon-Fehler und den Backend-Hinweisen von Fleet fehl. |

### Egress-Richtlinie

| Modus      | Docker                                                                                                  | Podman                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `bridge`   | Unterstützt; ausgehender Datenverkehr ist standardmäßig uneingeschränkt.                                | Unterstützt; ausgehender Datenverkehr ist standardmäßig uneingeschränkt.                |
| `internal` | Wird abgelehnt, da Docker den veröffentlichten Loopback-Gateway-Port in einem internen Netzwerk nicht beibehält. | Unterstützt; der Loopback-Gateway bleibt veröffentlicht, während ausgehender Datenverkehr blockiert wird. |

Behalten Sie für Docker den Bridge-Modus bei und setzen Sie die Richtlinie für ausgehenden Datenverkehr mit Host-Firewallregeln wie der `DOCKER-USER`-Kette durch.

## `fleet list`

Listen Sie Zellen in der Reihenfolge ihrer Mandanten-IDs auf:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Die Tabelle enthält:

| Spalte    | Bedeutung                                                                                                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | Mandanten-ID.                                                                                                                                                                                                                                                                         |
| `state`   | Aktueller Containerzustand aus der Docker- oder Podman-Inspektion. `unknown` bedeutet, dass die Laufzeit nicht verfügbar war oder dass ein Container mit dem Namen der Zelle vorhanden ist, dessen Fleet-Eigentumslabels jedoch nicht mit dem Registry-Eintrag übereinstimmen (ein Hinweis auf eine Kollision oder Manipulation – prüfen Sie dies vor weiteren Maßnahmen manuell). |
| `port`    | Dem Zellen-Gateway zugeordneter Loopback-Host-Port.                                                                                                                                                                                                                                   |
| `image`   | Aufgezeichnetes Container-Image.                                                                                                                                                                                                                                                      |
| `created` | Erstellungszeitpunkt der Zelle.                                                                                                                                                                                                                                                       |

Registry-Einträge bleiben sichtbar, wenn Docker oder Podman nicht verfügbar ist; nur der aktuelle Zustand wird zu `unknown`.

## `fleet status`

Prüfen Sie eine einzelne Zelle:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Der Status kombiniert den Fleet-Registry-Eintrag, die aktuelle Container-Inspektion und eine kurze Best-Effort-Anfrage an:

```text
http://127.0.0.1:<host-port>/healthz
```

Das Ergebnis der Zustandsprüfung ist `ok`, `failed` oder `skipped`. `/healthz` bestätigt die Erreichbarkeit des Gateways, nicht die vollständige Betriebsbereitschaft aller konfigurierten Kanäle oder Plugins. Die Prüfung wird übersprungen, wenn kein nutzbarer lokaler Endpunkt verfügbar ist.

## `fleet logs`

Streamen Sie die Containerprotokolle einer Zelle direkt an das Terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet prüft die Eigentumslabels des registrierten Containers, bevor Protokolle gelesen werden, und verweigert daher einen fremden Container, der den erwarteten Zellennamen verwendet. Der Stream ist an die ID des geprüften Containers gebunden, sodass eine gleichzeitige Ersetzung ihn nicht auf eine neuere Generation umleiten kann. Drücken Sie Strg-C, um `--follow` zu beenden, ohne den Abbruch durch die zuständige Person als Befehlsfehler zu behandeln. Die Protokollausgabe wird durch einen Schwärzungsfilter geleitet, der das aktuelle Gateway-Token der Zelle durch `<redacted>` ersetzt, bevor etwas das Terminal erreicht.

`fleet logs` verfügt über keinen `--json`-Modus, da Containerprotokolle ein roher stdout-/stderr-Stream sind. Begrenzen Sie für Skripte die Ausgabe mit `--tail` und verwenden Sie gewöhnliche Shell-Umleitungen oder Pipelines.

## `fleet start`, `fleet stop` und `fleet restart`

Steuern Sie eine vorhandene Zelle mit ihrer aufgezeichneten Runtime:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Diese Befehle wirken auf den registrierten Containernamen. Sie schlagen fehl, wenn der Mandant unbekannt ist oder die aufgezeichnete Runtime den Vorgang nicht ausführen kann.

## `fleet upgrade`

Laden Sie das aufgezeichnete Image erneut herunter und ersetzen Sie den Zellencontainer:

```bash
openclaw fleet upgrade acme
```

Verschieben Sie die Zelle auf ein anderes Image:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Beim Upgrade wird das Ziel-Image heruntergeladen, der vorhandene Container und das zellenspezifische Netzwerk werden geprüft, der Container wird angehalten und entfernt und anschließend neu erstellt und gestartet. Der Ersatz behält denselben Host-Port, dieselben Datenverzeichnisse, dasselbe zellenspezifische Bridge-Netzwerk, Runtime-Profil, dieselben Ressourcenlimits, dieselbe Neustartrichtlinie, dieselbe von Fleet verwaltete Umgebung und dieselben ursprünglich mit `--env` angegebenen Werte bei. Eingebundener Zustand bleibt beim Ersetzen des Containers erhalten; die Standardumgebung des Images kann sich mit dem Ziel-Image ändern.

Der Ersatz wird erst übernommen, nachdem sein Gateway auf dem Loopback-Port der Zelle auf `/healthz` antwortet und damit dem Health-Vertrag entspricht, den die offizielle Compose-Datei verwendet. Ein Ersatz, der beendet wird, in einer Absturzschleife hängt oder nicht innerhalb von etwa einer Minute fehlerfrei wird, wird entfernt und der vorherige Container wird wiederhergestellt, sodass ein fehlerhaftes Image keine funktionierende Zelle außer Betrieb setzt.

Das Gateway-Token wird absichtlich nicht in der Fleet-Registry gespeichert. Bevor der alte Container entfernt wird, liest Fleet dessen Umgebung und übernimmt `OPENCLAW_GATEWAY_TOKEN` in den Ersatz. Entfernen Sie den alten Container vor einem Upgrade nicht manuell, wenn das Token nirgendwo sonst unter Ihrer Kontrolle vorhanden ist.

## `fleet backup` und `fleet restore`

Sichern Sie eine angehaltene Zelle:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Stellen Sie dieses Archiv in der registrierten Zelle wieder her:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Dies sind Befehle mit Host-Operator-Berechtigungen. Archive enthalten Mandantenzustand und Authentifizierungsgeheimnisse, werden mit dem Modus `0600` erstellt und müssen wie Anmeldedaten gespeichert werden. Die Sicherung verweigert eine laufende Zelle, damit der SQLite-Zustand konsistent erfasst wird. Die Wiederherstellung verweigert eine laufende Zelle, sofern nicht `--force` angegeben wird, ersetzt nur den Zustand dieses Mandanten, rotiert das Gateway-Token und gibt das neue Token einmal aus. Fleet sichert jeweils einen Mandanten; die Sicherung aller Mandanten ist eine separate Operatoraktion.

Für die Wiederherstellung ist ein vorhandener angehaltener Container erforderlich, da dessen geprüftes Runtime-Profil die Ersatzlimits, Benutzerzuordnung, Herkunft der Umgebung und das Image bereitstellt. Wenn der registrierte Container außerhalb von Fleet entfernt wurde, führen Sie zunächst `fleet rm <tenant> --force` ohne `--purge-data` aus, erstellen Sie die Zelle mit dem vorgesehenen Image und `--no-start` neu und wiederholen Sie anschließend die Wiederherstellung. Beim ersten Entfernen bleiben beide Mandantendatenverzeichnisse intakt.

Beide Befehle akzeptieren `--max-bytes <bytes>`, um die Größe archivierter oder extrahierter Dateidaten zu begrenzen, und beide wenden dasselbe feste Budget von einer Million Archivpfadsegmenten an, damit reine Metadaten-Archivbomben die Inodes des Hosts nicht erschöpfen können und jede akzeptierte Sicherung wiederherstellbar bleibt. Die Sicherung akzeptiert `--out <path>`, und beide Befehle unterstützen `--json`.

Archive enthalten ausschließlich reguläre Dateien und Verzeichnisse. Die Sicherung folgt oder speichert niemals symbolische Links, harte Links, Sockets oder Geräteknoten; die Anzahl übersprungener Elemente wird im Ergebnis angegeben. Die Wiederherstellung lehnt Archive ab, die einen anderen Eintragstyp enthalten. Wiederherstellbare symbolische Linkbäume wie Workspace-`node_modules` müssen nach einer Wiederherstellung innerhalb der Zelle neu installiert werden.

## `fleet doctor`

Prüfen Sie alle Zellen oder einen Mandanten, ohne den Runtime- oder Dateisystemzustand zu verändern:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor prüft Runtime-Lokalität, Eigentumslabels, Funktionszustand, Absicherung, Ressourcenlimits, Loopback-Portbindung, Vorhandensein des Tokens, Netzwerkeigentum und Egress-Modus sowie die Berechtigungen privater Zustandsverzeichnisse. Warnungen beschreiben angehaltene Zellen oder abweichende Eigentumsverhältnisse; jeder fehlgeschlagene Befund setzt einen von null verschiedenen Prozess-Exitcode.

## `fleet rm`

Entfernen Sie eine angehaltene Zelle aus Runtime und Registry, während die Mandantendaten erhalten bleiben:

```bash
openclaw fleet rm acme
```

Ein laufender Container erfordert `--force`:

```bash
openclaw fleet rm acme --force
```

Entfernen Sie auch die Zellendaten dauerhaft:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet entfernt den Zellencontainer, bevor sein dediziertes Bridge-Netzwerk entfernt wird. `--purge-data` erfordert `--force`. Vor dem rekursiven Löschen löst Fleet sowohl die beiden Fleet-eigenen Stammverzeichnisse als auch die beiden mandantenspezifischen Verzeichnisse auf. Jedes Ziel muss exakt das erwartete Mandantenblatt sein, strikt innerhalb seines Stammverzeichnisses liegen und darf kein symbolischer Link sein. Diese Eingrenzungsprüfungen verhindern, dass ein beschädigter Registry-Pfad oder ein mandantenübergreifender symbolischer Link die Löschung an einen anderen Ort umleitet.

Die Bereinigung kann erneut ausgeführt werden, wenn ein exakt erwartetes Mandantenverzeichnis bereits fehlt. Dadurch kann ein späterer Aufruf die Bereinigung nach einem teilweisen Dateisystemfehler abschließen, ohne die Pfadprüfungen für noch vorhandene Verzeichnisse zu lockern.

## Speicher- und Containerlayout

Zellenzustand und Verschlüsselungsschlüssel für Authentifizierungsprofile verwenden separate mandantenspezifische Host-Pfade unter dem aktiven OpenClaw-Zustandsverzeichnis:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

Das erste Verzeichnis wird unter `/home/node/.openclaw` eingebunden. Das zweite wird unter `/home/node/.config/openclaw` eingebunden und entspricht damit dem Mount für Verschlüsselungsschlüssel der offiziellen Docker-Einrichtung. Der Verschlüsselungsschlüssel wird daher nicht unterhalb des gewöhnlichen Zustands-Mounts offengelegt oder eingeschlossen, wenn nur das Zellenzustandsverzeichnis gesichert oder freigegeben wird. Beide Verzeichnisse überstehen eine normale Entfernung und ein Upgrade; `fleet rm --purge-data --force` löscht beide nach separaten Eingrenzungsprüfungen.

Vor dem ersten Start initialisiert Fleet die Zellenkonfiguration mit `gateway.mode=local`, Token-Authentifizierung, der LAN-Containerbindung und Control-UI-Ursprüngen für den zugewiesenen Host-Port. Der Tokenwert wird nicht in diese Konfiguration geschrieben; er verbleibt in der Containerumgebung.

Fleet fixiert die Containerpfade des offiziellen Images mit diesen Umgebungswerten:

| Variable                 | Containerwert                        |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Generiertes oder angegebenes Zellen-Token |

Das offizielle Image verwendet standardmäßig den Nicht-Root-Benutzer `node` mit UID 1000. Fleet hält die privaten `0700`-Bind-Mounts beschreibbar, ohne sie für alle zugänglich zu machen. Rootful Docker führt die Zelle mit der UID und GID des aufrufenden Nicht-Root-Benutzers aus; Rootless Docker verwendet Container-UID 0, die im Benutzer-Namespace des Daemons dem aufrufenden unprivilegierten Hostbenutzer zugeordnet wird. Podman verwendet `keep-id` mit der aufrufenden UID und GID. Wenn Fleet selbst als Root mit einer Rootful-Runtime ausgeführt wird, behält es den Image-Benutzer bei und weist die anfänglichen Mount-Dateien UID/GID 1000 zu.

Auf SELinux-Hosts erhalten Docker- und Podman-Mounts eine private `:Z`-Neukennzeichnung. Wenn Sie Zellendaten wiederherstellen oder verschieben, müssen die per Bind-Mount eingebundenen Pfade für den effektiven Containerbenutzer beschreibbar bleiben. Das Profil ist für Rootless-Betrieb geeignet, Docker oder Podman muss jedoch bereits auf dem Host für Rootless-Betrieb konfiguriert sein; Fleet wandelt einen Rootful-Daemon nicht in einen Rootless-Daemon um.

## Sicherheitsprofil

Fleet wendet auf jede Zelle das folgende Profil an:

| Steuerung            | Angewendetes Profil                                  | Grund                                                                                  |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Linux-Fähigkeiten    | `--cap-drop=ALL`                                     | Das Gateway ist ein Node.js-Prozess und benötigt keine zusätzlichen Linux-Fähigkeiten. |
| Rechteausweitung     | `--security-opt no-new-privileges`                   | Verhindert, dass Prozesse über setuid- oder setgid-Binärdateien höhere Rechte erlangen. |
| Init-Prozess         | `--init`                                             | Räumt untergeordnete Prozesse auf und leitet Container-Lebenszyklussignale weiter.     |
| Prozesslimit         | Standardmäßig `--pids-limit 512`                    | Begrenzt Fork- und Prozesserschöpfung.                                                  |
| Speicherlimit        | Standardmäßig `--memory 2g`                         | Begrenzt die Speichernutzung der Zelle.                                                 |
| CPU-Limit            | Standardmäßig `--cpus 2`                            | Begrenzt die CPU-Nutzung der Zelle.                                                     |
| Datenträger der beschreibbaren Schicht | Optional `--disk`                         | Begrenzt die Containerschicht, wenn das Runtime-Speicher-Backend Kontingente unterstützt. |
| Neustartrichtlinie   | `--restart unless-stopped`                           | Startet eine fehlgeschlagene Zelle neu, ohne ein absichtliches Anhalten zu überschreiben. |
| Host-Veröffentlichung | Nur `127.0.0.1:<host-port>:18789`                  | Hält das Gateway von Wildcard-Hostschnittstellen fern.                                 |
| Zellennetzwerk       | Eine Bridge oder ein internes Podman-Netzwerk pro Zelle | Trennt Container-IP-Verkehr und blockiert optional ausgehenden Podman-Egress.          |
| Containeridentität   | An den Host angepasste Benutzerzuordnung             | Hält private Bind-Mounts beschreibbar, ohne weltweiten Zugriff zu gewähren.             |
| Persistenter Zustand | Zellenspezifische Mounts; kein gemeinsam genutzter Zustands-Mount | Hält Mandantenkonfiguration, Anmeldedaten, Sitzungen und Workspaces im Datenbaum dieses Mandanten. |
| Containerbefehl      | `node dist/index.js gateway --bind lan --port 18789` | Lauscht im Containernetzwerk, sodass die ausschließlich auf Loopback beschränkte Host-Port-Zuordnung es erreichen kann. |

Fleet bindet niemals `/var/run/docker.sock` ein, verwendet weder `--privileged` noch Host-Netzwerkbetrieb und fügt keine Fähigkeiten hinzu. Die zellenspezifische Bridge ist eine Grenze zur Trennung zwischen Zellen, keine ausgehende Firewall: Zellen behalten den für Provider und Kanäle erforderlichen Netzwerk-Egress. Schalten Sie dem Loopback-Port einen Proxy, SSH-Tunnel oder eine Tailnet-Konfiguration vor, die Ihrer Bereitstellung entspricht. `http://127.0.0.1:<port>` ist nur vom Fleet-Host aus direkt erreichbar.

Dieses Profil trennt Mandantencontainer, schützt Mandanten jedoch nicht vor dem Fleet-Operator, dem Administrator der Container-Runtime oder einem kompromittierten Host. Unter [Mandantenfähiges Hosting](/de/gateway/multi-tenant-hosting) finden Sie das vollständige Vertrauensmodell und stärkere Isolierungsoptionen.

## Token-Handhabung

Standardmäßig generiert `fleet create` ein kryptografisch zufälliges hexadezimales Gateway-Token mit 32 Zeichen und gibt es einmal im Erstellungsergebnis aus. Speichern Sie es in Ihrem genehmigten Secret Manager und vermeiden Sie, die Erstellungsausgabe in Protokollen zu erfassen.

`--gateway-token` platziert ein benutzerdefiniertes Token in den lokalen Prozessargumenten, die im Shellverlauf gespeichert oder in Prozesslisten sichtbar sein können. Bevorzugen Sie das generierte Token, sofern nicht ein vorhandener Geheimnisverwaltungs-Workflow einen angegebenen Wert erfordert.

Das Token und jeder mit `--env` übergebene Wert befinden sich in der Containerumgebung. Fleet schreibt sie in eine kurzlebige Umgebungsdatei mit Modus `0600`, übergibt nur den Pfad dieser Datei an Docker oder Podman und entfernt sie, nachdem der Runtime-Befehl abgeschlossen ist. Werte, die explizit in `openclaw fleet create --gateway-token ...` oder `--env KEY=VALUE` eingegeben wurden, können weiterhin in den Argumenten des äußeren `openclaw`-Prozesses und im Shellverlauf sichtbar sein.

Container-Umgebungswerte sind für den vertrauenswürdigen Hostbetreiber nicht verborgen: Docker- oder Podman-Administratoren können sie über die Container-Inspektion auslesen. Der Hinweis „shown once“ von Fleet beschreibt die normale CLI-Ausgabe, nicht den Schutz vor einem Hostadministrator.

## Verwandte Themen

- [Multi-Tenant-Hosting](/de/gateway/multi-tenant-hosting)
- [Docker](/de/install/docker)
- [Podman](/de/install/podman)
- [Gateway-Sicherheit](/de/gateway/security)
