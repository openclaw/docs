---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Sitzungen an temporäre Cloud-Maschinen verteilen: Bereitstellung, Worker-Laufzeit, weitergeleitete Inferenz und Streaming-Ergebnisse'
title: Cloud-Worker
x-i18n:
    generated_at: "2026-07-24T04:33:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e81fb50512639b3b0e00522dea914533b596574f35baf304c932c2962ac103c
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Cloud-Worker ermöglichen es, die Agentenschleife einer Sitzung auf einer kurzlebigen Cloud-Maschine auszuführen, während alles rund um die Sitzung dort bleibt, wo es immer war: in der Seitenleiste sichtbar, mit Live-Streaming und einem vom Gateway verwalteten Transkript. Das Gateway mietet eine Box, installiert darauf eine angeheftete Kopie von OpenClaw, synchronisiert den Arbeitsbereich der Sitzung und übergibt die Bearbeitungsschleife an einen eingeschränkten `openclaw worker`-Prozess. Modellaufrufe werden über das Gateway zurückgeleitet, sodass Provider-Anmeldedaten Ihre Maschine nie verlassen. Prompt-Caching funktioniert weiterhin, da der Provider einen einzigen kontinuierlichen Datenstrom sieht.

Wenn die Arbeit abgeschlossen ist (oder die Box ausfällt), wird die Maschine verworfen. Der dauerhafte Zustand – Transkript, Arbeitsbereich-Commits, Platzierungsdatensätze – verbleibt beim Gateway.

<Note>
Cloud-Worker müssen ausdrücklich aktiviert werden und bleiben unsichtbar, bis Sie ein Profil konfigurieren. Bei nicht konfigurierten Installationen werden keine neuen RPCs, Konfigurationen oder UI-Elemente angezeigt.
</Note>

## Was wo ausgeführt wird

| Bereich                                                 | Ort                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Agentenschleife + Werkzeuge (`exec`, `read`, `write`, `edit`, …) | Cloud-Worker-Box                                                                 |
| Modellinferenz und Provider-Anmeldedaten                | Gateway (über `{provider, model}`-Referenz weitergeleitet)                        |
| Transkript (dauerhafter Sitzungsspeicher)               | Gateway                                                                          |
| Live-Streaming in die Seitenleiste                      | Gateway-Fan-out, gespeist vom wiederholbaren Ereignisstrom des Workers            |
| Git-Verlauf des Arbeitsbereichs                         | Wird auf der Box ohne Anmeldedaten erstellt; das Gateway übernimmt Commits und verwaltet Push/PR |

Die Box benötigt außer `sshd` keine eingehenden Ports: Das Gateway stellt über angeheftetes SSH eine ausgehende Verbindung her, und ein Reverse-Tunnel leitet den WebSocket des Workers zurück. Der mitgelieferte Crabbox-Provider erzwingt die öffentliche SSH-Route und deaktiviert die verwaltete Tailscale-Registrierung. Ausgehender Internetzugriff unterliegt der Provider-Richtlinie; das standardmäßige AWS-Profil kann auf das Internet zugreifen, sofern Sie sein Netzwerk oder seine Sicherheitsgruppe nicht einschränken.

## Voraussetzungen

- Ein Worker-Provider-Plugin. Das mitgelieferte `crabbox`-Plugin steuert die [Crabbox](https://github.com/openclaw/crabbox)-CLI, die das Mieten von Maschinen über verschiedene Cloud-Backends (AWS, Hetzner und andere) vermittelt. Das `crabbox`-Programm muss sich in `PATH` befinden (oder legen Sie `settings.binary` fest), und die Provider-Anmeldedaten müssen bereits konfiguriert sein. Die AWS-Zulassung erfordert Crabbox 0.38.1 oder neuer.
- Für Crabbox-AWS-Worker muss der effektive Wert von `aws.instanceProfile` leer sein. Der Provider prüft `crabbox config show --json` vor der Zuweisung und verlangt anschließend, dass `crabbox inspect --json` den Wert `providerMetadata.instanceProfileAttached: false` aus EC2-`DescribeInstances` meldet. Gemietete Maschinen mit einer Instanzrolle oder ohne maßgebliche Metadaten werden gestoppt und abgelehnt.
- Node.js auf der gemieteten Maschine. Unveränderte Cloud-Images enthalten es üblicherweise nicht – installieren Sie es mit dem `setup`-Befehl des Profils.
- Eine Sitzung mit einem sitzungseigenen verwalteten Worktree (erstellen Sie einen mit `worktree: true`). Beim Dispatch wird der Inhalt dieses Worktrees verschoben; einfache Verzeichnisse werden als Manifest-Spiegel synchronisiert.

## Konfiguration

Fügen Sie in `openclaw.json` unter `cloudWorkers.profiles` ein Profil hinzu:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Profilfelder:

| Schlüssel  | Bedeutung                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Von einem Plugin registrierte Worker-Provider-ID (`crabbox` für das mitgelieferte Plugin).                                                                                                                                                     |
| `install`  | `bundle` (Standard) überträgt den Build des laufenden Gateways; `npm` installiert die exakte veröffentlichte Gateway-Version mit angehefteter Integrität. `npm` setzt voraus, dass das Gateway aus einer paketierten Veröffentlichung ausgeführt wird. |
| `settings` | Providereigenes JSON. Für Crabbox: `provider` (Backend), `class` (Maschinenklasse), `ttl`, `idleTimeout` (Go-Zeitangaben), optional `setup` und absoluter `binary`-Pfad. OpenClaw erzwingt für diese gemieteten Maschinen öffentliches SSH und deaktiviert verwaltetes Tailscale. |
| `lifetime` | Optional gespeicherte Richtlinie (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                      |

### Der Einrichtungsbefehl

`settings.setup` wird auf der gemieteten Box ausgeführt, nachdem sie über SSH erreichbar ist und bevor OpenClaw installiert wird. Der Befehl wird bei **jedem** Bereitstellungsversuch ausgeführt (einschließlich Wiederholungen nach einem unterbrochenen Dispatch) und muss daher idempotent sein – sichern Sie Installationen wie im Beispiel mit einer `command -v`-/`test -x`-Prüfung ab. Schlägt die Einrichtung fehl, stoppt der Provider die gemietete Maschine und der Dispatch schlägt sicher geschlossen fehl; es bleibt keine nur teilweise konfigurierte Box aktiv.

### Installationskanäle

- **`bundle`** packt das `dist` des laufenden Gateways, ein bereinigtes `package.json` und alle vom Build referenzierten Arbeitsbereichspakete, die gemeinsam durch einen Inhalts-Hash abgedeckt sind. Die Box prüft das unveränderte Bundle anhand dieses Hashs und installiert anschließend die npm-Produktionsabhängigkeiten (Skripte deaktiviert). So führen Sie einen Entwicklungs-Build auf einem Worker aus.
- **`npm`** weist nach, dass die Veröffentlichung in der öffentlichen Registry vorhanden ist, heftet ihre SHA-512-Integrität an und installiert `openclaw@<version>` in exakt der zum Gateway passenden Version.

## Eine Sitzung dispatchen

Öffnen Sie in der Control UI **New Session**, wählen Sie einen Agenten, dessen konfigurierte Runtime OpenClaw ist, wählen Sie im Menü **Where** ein konfiguriertes Ziel vom Typ **Cloud · profile** und starten Sie die Aufgabe. Durch die Cloud-Auswahl wird der erforderliche verwaltete Worktree automatisch aktiviert; das Gateway erstellt die Sitzung, schließt den Dispatch ab und sendet erst danach die erste Bearbeitung. Das Server-Badge in der Sitzungsseitenleiste zeigt den dauerhaften Platzierungsstatus an. Cloud-Ziele werden für Sitzungskataloge externer CLIs nicht angeboten.

Der entsprechende RPC-Ablauf lautet:

Erstellen Sie eine Sitzung mit einem verwalteten Worktree und dispatchen Sie sie anschließend (der RPC erfordert `operator.admin` und ist nur vorhanden, wenn Profile konfiguriert sind):

Cloud-Worker führen die OpenClaw-Agenten-Runtime aus. Wählen Sie ein `openai/*` oder ein anderes Modell, das zu dieser Runtime aufgelöst wird; für eine externe CLI-Runtime wie `claude-cli` konfigurierte Sitzungen können nicht dispatcht werden.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` sperrt die lokale Annahme neuer Bearbeitungen, lässt aktive Arbeit auslaufen, stellt die gemietete Maschine bereit, führt die Einrichtung aus, bootstrapt OpenClaw, synchronisiert den Arbeitsbereich und kehrt zurück, sobald die Platzierung den Status `active` unter Worker-Verwaltung erreicht. Planen Sie für den ersten Dispatch mehrere Minuten ein; gemietete Maschinen und Installationen werden zwischengespeichert, sofern der Provider dies unterstützt. Anschließend können Sie wie gewohnt mit der Sitzung interagieren – Bearbeitungen werden automatisch an den Worker weitergeleitet.

Nach abgeschlossenen Worker-Bearbeitungen werden geeignete, größenbeschränkte Arbeitsbereichsdateien wieder mit dem verwalteten Worktree der Sitzung abgeglichen, bevor der Bearbeitungsanspruch freigegeben wird. Das abschließende Worker-Ereignis erstellt vor seiner Bestätigung eine dauerhafte Sperre für das ausstehende Ergebnis. Anschließend stellt das Gateway das vollständige Cloud-Ergebnis als Git-Ref unter `refs/openclaw/worker-results/` bereit, bevor es dieses anwendet. Dadurch bleibt die Cloud-Version wiederherstellbar, selbst wenn das Gateway während der Anwendung stoppt. Arbeitsbereichsergebnisse verwenden die Git-Dateisemantik: Reguläre Dateien, Ausführbarkeitsbits, symbolische Links, Ergänzungen, Änderungen und Löschungen bleiben erhalten, leere Verzeichnisse und andere Verzeichnismodi dagegen nicht. Die resultierenden Dateiänderungen verbleiben zur normalen Prüfung und zum Committen im verwalteten Worktree.

Für die Anwendung wird das zum Dispatch-Zeitpunkt erstellte Manifest als Merge-Basis verwendet. Ausschließlich in der Cloud vorgenommene Änderungen werden angewendet, ausschließlich lokale Änderungen bleiben bestehen, und für auf beiden Seiten geänderte Pfade gilt eine Drei-Wege-Richtlinie, die die lokale Version beibehält. Eine Bearbeitung mit Konflikten wird dennoch abgeschlossen: Das Transkript meldet die begrenzte Pfadzusammenfassung und die bereitgestellte Ergebnis-Ref, die Platzierung stellt denselben Konflikt für die Control UI bereit und konfliktfreie Cloud-Änderungen bleiben angewendet. Der Hinweis enthält `git show <ref>:<path>`, um eine vorhandene Cloud-Datei zu prüfen, sowie einen `git checkout <ref> -- <path>`-Befehl mit einem Literal-Pathspec auf oberster Ebene, um sie aus einem beliebigen Arbeitsbereichsverzeichnis zu übernehmen. Führen Sie die Befehle in Bash oder zsh aus (Git Bash unter Windows). Wenn die Prüfung meldet, dass der Pfad nicht vorhanden ist, wurde er durch das Cloud-Ergebnis gelöscht; prüfen Sie dies und entfernen Sie den beibehaltenen lokalen Pfad manuell. Wenn Checkout eine Datei-/Verzeichnisblockade meldet, verschieben oder entfernen Sie den blockierenden lokalen Pfad und versuchen Sie es erneut. Wenn die bereitgestellte Ref selbst nicht mehr vorhanden ist, behandeln Sie den Hinweis als veraltet und ändern Sie den lokalen Pfad nicht. Bereitgestellte Refs mit Konflikten bleiben verfügbar, nachdem die normale Bearbeitungssperre freigegeben wurde; ein späteres konfliktfreies Ergebnis entfernt den Hinweis und stellt die alte Ref außer Dienst, während das explizite Entfernen der Sperre die endgültige Bereinigungsgrenze darstellt.

Während ein gesperrtes Ergebnis noch abgeglichen wird, wartet eine neue Bearbeitung bis zu 15 Sekunden auf die Freigabe des vorherigen Anspruchs. Ist er danach weiterhin belegt, schlägt die Bearbeitung mit der umsetzbaren Meldung „das Arbeitsbereichsergebnis der vorherigen Cloud-Bearbeitung wird noch abgeglichen“ fehl und kann kurze Zeit später erneut versucht werden. Nach einem Neustart erkennt die Wiederherstellung ausstehende und bereitgestellte Ergebnisse vor der Bereinigung veralteter Ansprüche, schließt ihre lokale Anwendung ab oder versucht sie erneut und gibt ausgefallene Umgebungen erst frei, nachdem das Ergebnis gesichert wurde. Das begrenzte SQLite-Rollback-Journal ermöglicht die Wiederherstellung einer unterbrochenen Dateisystemanwendung, ohne bereits akzeptierte Änderungen erneut abzuspielen.

Wenn die Arbeit abgeschlossen ist und keine Bearbeitung ausgeführt wird, öffnen Sie das Sitzungsmenü und wählen Sie **Stop cloud worker…**. Das Gateway führt einen letzten Abgleich des Arbeitsbereichs durch, bevor es die Umgebung zerstört. Eine Platzierung, die sich bereits in `draining` oder `reconciling` befindet, schließt den Abbau ab; warten Sie, bis ihr Badge `reclaimed` anzeigt, bevor Sie die Sitzung löschen.

Bei einem defekten oder außer Kontrolle geratenen verbundenen Worker kann ein Operator als letztes Mittel `environments.destroy` mit `{ "force": true }` aufrufen. Ein erzwungener Abbau markiert die Platzierung dauerhaft als fehlgeschlagen und verwirft alle noch nicht abgeglichenen Remote-Ergebnisse, bevor die Umgebung zerstört wird.

Der entsprechende administrative RPC lautet:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Die Platzierung durchläuft einen dauerhaften Zustandsautomaten (`local → requested → provisioning → syncing → starting → active`), sodass ein Neustart des Gateway während des Dispatch-Vorgangs eine Abstimmung auslöst, statt Maschinen zurückzulassen. Ein fehlgeschlagener Modelldurchlauf hält die aktive Platzierung für einen erneuten Versuch verfügbar. Bei Konflikten mit Workspace-Pfaden wird die lokale Version beibehalten, der übrige Teil des Cloud-Ergebnisses angewendet und die bereitgestellte Cloud-Referenz zur Überprüfung bewahrt; bei anderen Abstimmungs- oder Lebenszyklusfehlern bleiben die dauerhafte Wiederherstellungssperre und das Diagnoseprotokollende erhalten, bis die Wiederherstellung einen erneuten Versuch sicher durchführen oder die Umgebung zurückfordern kann.

## Sicherheitsmodell

- **Geschlossener Worker-Eingang.** Worker kommunizieren über ein dediziertes Protokoll auf dem getunnelten Socket mit einer geschlossenen Methoden-Zulassungsliste — ein Worker kann keine Operator-RPCs aufrufen.
- **Ausgestellte Anmeldedaten, im Ruhezustand gehasht.** Jeder Dispatch stellt Worker-Anmeldedaten aus; das Gateway speichert nur deren Hash. Die Rotation der Anmeldedaten und die Absicherung durch Owner-Epochen garantieren höchstens einen aktiven Owner pro Sitzung — ein veralteter Worker, der erneut eine Verbindung herstellt, wird abgegrenzt und niemals zusammengeführt.
- **Host-Key-Pinning.** Der Provider muss den SSH-Hostschlüssel der Box bei der Bereitstellung ausgeben; der Bootstrap stellt die Verbindung mit strikt festgelegtem Schlüssel her und schlägt ohne ihn sicher geschlossen fehl.
- **Keine dauerhaft vorhandenen Modell-, Forge- oder Cloud-Anmeldedaten auf der Box.** Die Modellauthentifizierung verbleibt auf dem Gateway (Inferenz wird über eine `{provider, model}`-Referenz übertragen), Workspace-Git-Commits werden ohne Forge-Anmeldedaten erstellt und die AWS-Lease-Metadaten von Crabbox werden vor der Einrichtung autoritativ auf eine Instanzrolle geprüft. Halten Sie auch Einrichtungsbefehle frei von Anmeldedaten.
- **Vom Provider kontrollierter ausgehender Datenverkehr.** Durch den Reverse-Tunnel benötigt OpenClaw keinen direkten Modellzugriff, OpenClaw schreibt jedoch keine Provider-Firewalls um. Beschränken Sie den ausgehenden Datenverkehr beim Worker-Provider, wenn die Aufgabe dies erfordert.
- **Dauerhafte, exakt einmal übertragene Transkripte.** Der Worker schreibt Transkriptbatches über ein Compare-and-Swap-Protokoll gegen den Endknoten der Sitzung fest; eine veraltete Basis stoppt den Lauf vollständig, statt kostenpflichtige Ausgaben zu duplizieren oder umzubasieren.

## Fehlerbehebung

- **`sessions.dispatch` ist eine unbekannte Methode** — es sind keine `cloudWorkers.profiles` konfiguriert oder dem Aufrufer fehlt `operator.admin`.
- **„Cloud-Worker-Durchläufe erfordern die OpenClaw-Laufzeit“** — wählen Sie ein Modell, dessen konfigurierte Laufzeit OpenClaw ist. Externe CLI-Laufzeiten wie `claude-cli` unterstützen keine Worker-Inferenz.
- **„Der Worker-Bootstrap erfordert Node.js auf dem geleasten Host“** — fügen Sie `settings.setup` eine Node-Installation hinzu (siehe oben).
- **Die Attestierung der AWS-Instanzrolle schlägt fehl** — löschen Sie `aws.instanceProfile` (und `CRABBOX_AWS_INSTANCE_PROFILE`, falls gesetzt). Installieren Sie Crabbox 0.38.1 oder neuer; ältere Binärdateien stellen den für die AWS-Zulassung erforderlichen autoritativen `providerMetadata.instanceProfileAttached`-Vertrag nicht bereit.
- **Der Dispatch schlägt mit einem Provider-Fehler fehl** — der Platzierungsdatensatz und `environments.list` bewahren den letzten Fehler einschließlich des Endes der Standardfehlerausgabe von Einrichtung und Bootstrap auf. Boxen werden bei einem Fehler zerstört, daher ist dieses Protokollende die primäre forensische Informationsquelle.
- **Client-Zeitüberschreitung während des Dispatch-Vorgangs** — `openclaw gateway call` verwendet standardmäßig ein Zeitlimit von 10s; geben Sie `--timeout` großzügig an (der Dispatch wird in jedem Fall serverseitig fortgesetzt und ein erneuter Versuch während der Bereitstellung wird mit `session cannot dispatch from placement provisioning` abgelehnt).
- **Hinweis auf einen Cloud-Workspace-Konflikt** — der Durchlauf wurde abgeschlossen und für jeden aufgeführten Pfad wurde die lokale Version beibehalten. Verwenden Sie die Befehle für die bereitgestellte Referenz im Hinweis, um die Cloud-Version zu überprüfen oder zu übernehmen; für die nicht in Konflikt stehenden Änderungen ist kein erneuter Versuch erforderlich, da sie bereits angewendet wurden.
- **„Das Workspace-Ergebnis des vorherigen Cloud-Durchlaufs wird noch abgestimmt“** — das Gateway hat kurz auf die dauerhafte Sperre des vorherigen Ergebnisses gewartet und konnte den Anspruch auf die Sitzung nicht erwerben. Warten Sie, bis die Abstimmung abgeschlossen ist, und versuchen Sie den Durchlauf dann erneut; ein Neustart des Gateway ist sicher, da die Wiederherstellung bereitgestellte Ergebnisse bewahrt, bevor sie einen ausgefallenen Worker zurückfordert.
- **Lease-Verwaltung** — `crabbox list --provider <backend>` zeigt aktive Leases an; `crabbox stop --provider <backend> --id <lease>` gibt eine Lease manuell frei. Inaktive Leases laufen gemäß `idleTimeout` des Profils ab.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) — Verringerung des Schadensradius bei der lokalen Werkzeugausführung
- [Sitzungs-CLI](/de/cli/sessions) — Überprüfen gespeicherter Sitzungen
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
