---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Sitzungen an temporäre Cloud-Maschinen weiterleiten: Bereitstellung, Worker-Laufzeit, weitergeleitete Inferenz und Streaming-Ergebnisse'
title: Cloud-Worker
x-i18n:
    generated_at: "2026-07-16T12:45:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Cloud-Worker ermöglichen es, die Agentenschleife einer Sitzung auf einer temporären Cloud-Maschine auszuführen, während alles zur Sitzung dort bleibt, wo es immer war: in der Seitenleiste sichtbar, live gestreamt und mit dem Transkript im Besitz des Gateways. Das Gateway mietet eine Box, installiert darauf eine festgelegte Version von OpenClaw, synchronisiert den Arbeitsbereich der Sitzung dorthin und übergibt die Ausführungsschleife an einen eingeschränkten `openclaw worker`-Prozess. Modellaufrufe werden über das Gateway zurückgeleitet, sodass Provider-Anmeldedaten niemals Ihre Maschine verlassen. Prompt-Caching funktioniert weiterhin, da der Provider einen einzigen kontinuierlichen Datenstrom sieht.

Wenn die Arbeit abgeschlossen ist (oder die Box ausfällt), wird die Maschine verworfen. Der dauerhafte Zustand – Transkript, Arbeitsbereich-Commits, Platzierungsdatensätze – verbleibt beim Gateway.

<Note>
Cloud-Worker sind optional und bleiben unsichtbar, bis Sie ein Profil konfigurieren. Bei unkonfigurierten Installationen werden keine neuen RPCs, Konfigurationen oder UI-Elemente angezeigt.
</Note>

## Was wo ausgeführt wird

| Bereich                                                 | Ort                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Agentenschleife + Tools (`exec`, `read`, `write`, `edit`, …) | Cloud-Worker-Box                                                                 |
| Modellinferenz und Provider-Anmeldedaten                | Gateway (über `{provider, model}`-Referenz weitergeleitet)                        |
| Transkript (dauerhaft, Sitzungsspeicher)                | Gateway                                                                          |
| Live-Streaming in die Seitenleiste                      | Gateway-Fanout, gespeist durch den wiederholbaren Ereignisdatenstrom des Workers |
| Git-Verlauf des Arbeitsbereichs                         | Wird auf der Box ohne Anmeldedaten erstellt; das Gateway übernimmt Commits und verwaltet Push/PR |

Die Box benötigt außer `sshd` keine eingehenden Ports: Das Gateway stellt über SSH mit festgelegtem Hostschlüssel eine ausgehende Verbindung her, und ein Reverse-Tunnel leitet den WebSocket des Workers zurück. Der mitgelieferte Crabbox-Provider erzwingt die öffentliche SSH-Route und deaktiviert die verwaltete Tailscale-Registrierung. Ausgehender Internetzugriff unterliegt den Richtlinien des Providers; das standardmäßige AWS-Profil kann auf das Internet zugreifen, sofern Sie dessen Netzwerk oder Sicherheitsgruppe nicht einschränken.

## Anforderungen

- Ein Worker-Provider-Plugin. Das mitgelieferte `crabbox`-Plugin steuert die [Crabbox](https://github.com/openclaw/crabbox)-CLI, die die Anmietung über Cloud-Backends hinweg vermittelt (AWS, Hetzner und weitere). Die `crabbox`-Binärdatei muss sich in `PATH` befinden (oder legen Sie `settings.binary` fest), und die Provider-Anmeldedaten müssen bereits konfiguriert sein. Die AWS-Zulassung erfordert Crabbox 0.38.1 oder neuer.
- Für Crabbox-AWS-Worker muss der effektive Wert von `aws.instanceProfile` leer sein. Der Provider prüft `crabbox config show --json` vor der Zuweisung und verlangt anschließend, dass `crabbox inspect --json` den Wert `providerMetadata.instanceProfileAttached: false` aus EC2-`DescribeInstances` meldet. Anmietungen mit einer Instanzrolle oder ohne maßgebliche Metadaten werden beendet und abgelehnt.
- Node.js auf der angemieteten Maschine. Reine Cloud-Images enthalten es üblicherweise nicht – installieren Sie es mit dem `setup`-Befehl des Profils.
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
| `provider` | Von einem Plugin registrierte Worker-Provider-ID (`crabbox` für das mitgelieferte Plugin).                                                                                                                                     |
| `install`  | `bundle` (Standard) überträgt den Build des laufenden Gateways; `npm` installiert die exakte veröffentlichte Gateway-Version mit festgelegter Integrität. `npm` setzt voraus, dass das Gateway aus einer paketierten Version ausgeführt wird. |
| `settings` | Provider-eigenes JSON. Für Crabbox: `provider` (Backend), `class` (Maschinenklasse), `ttl`, `idleTimeout` (Go-Zeitspannen), optional `setup` und absoluter `binary`-Pfad. OpenClaw erzwingt öffentliches SSH und deaktiviert verwaltetes Tailscale für diese Anmietungen. |
| `lifetime` | Optional gespeicherte Richtlinie (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                               |

### Der Einrichtungsbefehl

`settings.setup` wird auf der angemieteten Box ausgeführt, nachdem diese über SSH erreichbar ist und bevor OpenClaw installiert wird. Er wird bei **jedem** Bereitstellungsversuch ausgeführt (einschließlich Wiederholungen nach einem unterbrochenen Dispatch) und muss daher idempotent sein – sichern Sie Installationen wie im Beispiel mit einer `command -v`-/`test -x`-Prüfung ab. Wenn die Einrichtung fehlschlägt, beendet der Provider die Anmietung, und der Dispatch schlägt nach dem Fail-Closed-Prinzip fehl; es bleibt keine teilweise konfigurierte Box in Betrieb.

### Installationskanäle

- **`bundle`** bündelt `dist` des laufenden Gateways, eine bereinigte `package.json` und alle vom Build referenzierten Arbeitsbereichspakete; alles wird durch einen Inhalts-Hash abgedeckt. Die Box überprüft das unveränderte Bundle anhand dieses Hashes und installiert anschließend die produktiven npm-Abhängigkeiten (Skripte deaktiviert). Auf diese Weise führen Sie einen Entwicklungs-Build auf einem Worker aus.
- **`npm`** weist nach, dass die Version in der öffentlichen Registry vorhanden ist, legt ihre SHA-512-Integrität fest und installiert `openclaw@<version>` exakt passend zum Gateway.

## Eine Sitzung dispatchen

Öffnen Sie in der Control UI **New Session**, wählen Sie einen Agenten, dessen konfigurierte Runtime OpenClaw ist, wählen Sie im Menü **Where** ein konfiguriertes Ziel vom Typ **Cloud · profile** aus und starten Sie die Aufgabe. Die Cloud-Auswahl aktiviert automatisch den erforderlichen verwalteten Worktree; das Gateway erstellt die Sitzung, schließt den Dispatch ab und sendet erst dann den ersten Durchlauf. Das Server-Badge in der Seitenleiste der Sitzung zeigt den dauerhaften Platzierungszustand an. Cloud-Ziele werden für externe CLI-Sitzungskataloge nicht angeboten.

Der entsprechende RPC-Ablauf lautet:

Erstellen Sie eine Sitzung mit einem verwalteten Worktree und dispatchen Sie sie anschließend (der RPC erfordert `operator.admin` und ist nur vorhanden, wenn Profile konfiguriert sind):

Cloud-Worker führen die OpenClaw-Agenten-Runtime aus. Wählen Sie ein `openai/*`- oder anderes Modell, das dieser Runtime zugeordnet wird; Sitzungen, die für eine externe CLI-Runtime wie `claude-cli` konfiguriert sind, können nicht dispatcht werden.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` sperrt die lokale Annahme von Durchläufen, lässt aktive Arbeit auslaufen, stellt die Anmietung bereit, führt die Einrichtung aus, initialisiert OpenClaw, synchronisiert den Arbeitsbereich und kehrt zurück, sobald die Platzierung die `active`-Worker-Eigentümerschaft erreicht. Planen Sie für den ersten Dispatch mehrere Minuten ein; Anmietungen und Installationen werden zwischengespeichert, sofern der Provider dies unterstützt. Danach kommunizieren Sie wie gewohnt mit der Sitzung – Durchläufe werden automatisch an den Worker weitergeleitet.

Abgeschlossene Worker-Durchläufe gleichen geeignete Arbeitsbereichsdateien innerhalb der Größenbegrenzung mit dem verwalteten Worktree der Sitzung ab, bevor der Anspruch auf den Durchlauf freigegeben wird. Das abschließende Worker-Ereignis erstellt vor seiner Bestätigung eine dauerhafte Sperre für ausstehende Ergebnisse, sodass die Wiederherstellung nach einem Neustart des Gateways den entfernten Arbeitsbereich zurückholt, bevor die Bereinigung veralteter Durchläufe dessen Eigentümer zerstören kann. Der Abgleich authentifiziert das Worker-Manifest und hält bei lokalen Abweichungen an, anstatt eine der beiden Seiten zu überschreiben. Bevor Dateien geändert werden, speichert das Gateway ein größenbegrenztes Rollback-Journal in seiner SQLite-Zustandsdatenbank; bei einer Wiederholung wird dieses Journal nach einem unterbrochenen Gateway-Prozess wiederhergestellt. Arbeitsbereichsergebnisse verwenden die Git-Dateisemantik: reguläre Dateien, Ausführbarkeitsbits, symbolische Links, Hinzufügungen, Änderungen und Löschungen bleiben erhalten, leere Verzeichnisse und andere Verzeichnismodi dagegen nicht. Entfernte Commit-Objekte werden nicht übernommen; die resultierenden Dateiänderungen verbleiben im verwalteten Worktree für die übliche Überprüfung und den üblichen Commit.

Wenn die Arbeit abgeschlossen ist und kein Durchlauf ausgeführt wird, öffnen Sie das Sitzungsmenü und wählen Sie **Stop cloud worker…**. Das Gateway führt einen letzten Arbeitsbereichsabgleich durch, bevor es die Umgebung zerstört. Eine Platzierung, die sich bereits in `draining` oder `reconciling` befindet, schließt den Abbau ab; warten Sie, bis ihr Badge `reclaimed` anzeigt, bevor Sie die Sitzung löschen.

Bei einem defekten oder außer Kontrolle geratenen verbundenen Worker kann ein Operator als letztes Mittel `environments.destroy` mit `{ "force": true }` aufrufen. Ein erzwungener Abbau markiert die Platzierung dauerhaft als fehlgeschlagen und verwirft alle nicht abgeglichenen entfernten Ergebnisse, bevor die Umgebung zerstört wird.

Der entsprechende administrative RPC lautet:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Die Platzierung durchläuft eine dauerhafte Zustandsmaschine (`local → requested → provisioning → syncing → starting → active`), sodass ein Neustart des Gateways während des Dispatches einen Abgleich ausführt, anstatt Maschinen zurückzulassen. Bei einem fehlgeschlagenen Modelldurchlauf bleibt die aktive Platzierung für einen erneuten Versuch verfügbar. Wenn der eingehende Arbeitsbereichsabgleich fehlschlägt, bleibt der Worker ebenfalls aktiv, damit der Operator den lokalen Konflikt beheben und den Vorgang wiederholen kann, ohne das entfernte Ergebnis zu verlieren. Lebenszyklusfehler versetzen die Platzierung dagegen in einen Fehler- oder zurückgeforderten Zustand und bewahren das Ende ihrer Diagnoseausgabe auf.

## Sicherheitsmodell

- **Geschlossener Worker-Zugriff.** Worker kommunizieren über ein dediziertes Protokoll auf dem getunnelten Socket mit einer geschlossenen Methoden-Zulassungsliste – ein Worker kann keine Operator-RPCs aufrufen.
- **Ausgestellte Anmeldedaten, im Ruhezustand gehasht.** Jeder Dispatch stellt Worker-Anmeldedaten aus; das Gateway speichert nur deren Hash. Die Rotation der Anmeldedaten und die Absicherung durch Eigentümer-Epochen garantieren höchstens einen aktiven Eigentümer pro Sitzung – ein veralteter Worker, der die Verbindung wiederherstellt, wird abgegrenzt und niemals zusammengeführt.
- **Festlegung des Hostschlüssels.** Der Provider muss den SSH-Hostschlüssel der Box zum Bereitstellungszeitpunkt bereitstellen; die Initialisierung stellt die Verbindung mit strikter Festlegung her und schlägt ohne diesen nach dem Fail-Closed-Prinzip fehl.
- **Keine dauerhaften Modell-, Forge- oder Cloud-Anmeldedaten auf der Box.** Die Modellauthentifizierung verbleibt auf dem Gateway (die Inferenz wird über eine `{provider, model}`-Referenz übertragen), Git-Commits des Arbeitsbereichs werden ohne Forge-Anmeldedaten erstellt, und die Metadaten der Crabbox-AWS-Anmietung werden vor der Einrichtung maßgeblich auf eine Instanzrolle geprüft. Halten Sie auch Einrichtungsbefehle frei von Anmeldedaten.
- **Provider-eigener ausgehender Datenverkehr.** Durch den Reverse-Tunnel benötigt OpenClaw keinen direkten Modellzugriff, OpenClaw schreibt jedoch keine Provider-Firewalls um. Schränken Sie den ausgehenden Datenverkehr beim Worker-Provider ein, wenn die Aufgabe dies erfordert.
- **Dauerhafte, genau einmal erfasste Transkripte.** Der Worker schreibt Transkript-Batches über ein Compare-and-Swap-Protokoll gegen das Blatt der Sitzung fest; eine veraltete Basis stoppt die Ausführung bei einem Fehler, statt kostenpflichtige Ausgaben zu duplizieren oder neu zu basieren.

## Fehlerbehebung

- **`sessions.dispatch` ist eine unbekannte Methode** — es sind keine `cloudWorkers.profiles` konfiguriert oder dem Aufrufer fehlt `operator.admin`.
- **„Cloud-Worker-Durchläufe erfordern die OpenClaw-Runtime“** — wählen Sie ein Modell, dessen konfigurierte Runtime OpenClaw ist. Externe CLI-Runtimes wie `claude-cli` unterstützen keine Worker-Inferenz.
- **„Das Worker-Bootstrapping erfordert Node.js auf dem geleasten Host“** — fügen Sie `settings.setup` eine Node-Installation hinzu (siehe oben).
- **Die AWS-Instance-Role-Attestierung schlägt fehl** — löschen Sie `aws.instanceProfile` (und `CRABBOX_AWS_INSTANCE_PROFILE`, falls gesetzt). Installieren Sie Crabbox 0.38.1 oder neuer; ältere Binärdateien stellen den für die AWS-Zulassung erforderlichen maßgeblichen `providerMetadata.instanceProfileAttached`-Vertrag nicht bereit.
- **Der Dispatch schlägt mit einem Provider-Fehler fehl** — der Platzierungsdatensatz und `environments.list` bewahren den letzten Fehler einschließlich des stderr-Endes von Einrichtung und Bootstrapping auf. Boxen werden bei einem Fehler zerstört, daher ist dieses Ende die primäre forensische Informationsquelle.
- **Client-Zeitüberschreitung während des Dispatchs** — `openclaw gateway call` verwendet standardmäßig eine Zeitüberschreitung von 10s; bemessen Sie `--timeout` großzügig (der Dispatch wird in jedem Fall serverseitig fortgesetzt, und ein erneuter Versuch während der Bereitstellung wird mit `session cannot dispatch from placement provisioning` abgelehnt).
- **Lease-Verwaltung** — `crabbox list --provider <backend>` zeigt aktive Leases an; `crabbox stop --provider <backend> --id <lease>` gibt eine Lease manuell frei. Inaktive Leases laufen gemäß `idleTimeout` des Profils ab.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) — Begrenzung des Schadensradius bei lokaler Werkzeugausführung
- [Sessions-CLI](/de/cli/sessions) — Überprüfen gespeicherter Sitzungen
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
