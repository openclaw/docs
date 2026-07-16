---
read_when:
    - Sie verwenden weiterhin `openclaw daemon ...` in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (installieren/starten/stoppen/neu starten/Status anzeigen)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Hintergrunddienst
x-i18n:
    generated_at: "2026-07-16T12:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für die Gateway-Dienstverwaltung. `openclaw daemon ...` verweist auf dieselben Befehle zur Dienststeuerung wie `openclaw gateway ...`. Aktuelle Dokumentation und Beispiele finden Sie unter [`openclaw gateway`](/de/cli/gateway).

## Verwendung

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Unterbefehle und Optionen

| Unterbefehl  | Optionen                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (nur launchd: KeepAlive/RunAtLoad bis zum nächsten Start dauerhaft unterdrücken) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: zeigt den Installationsstatus des Dienstes (launchd/systemd/schtasks) an und prüft den Zustand des Gateways.
- `install`: installiert den Dienst; `--force` installiert eine vorhandene Installation erneut bzw. überschreibt sie.
- `restart --safe`: fordert das laufende Gateway auf, aktive Arbeit vorab zu prüfen und einen einzigen zusammengefassten Neustart zu planen, nachdem die Arbeit abgeschlossen wurde, begrenzt durch `gateway.reload.deferralTimeoutMs` (Standardwert: 300000ms/5 Minuten; auf `0` setzen, um unbegrenzt zu warten). Wenn dieses Zeitbudget abläuft, wird der Neustart dennoch erzwungen. Ein einfaches `restart` verwendet direkt die Dienstverwaltung; `--force` ist die sofortige Außerkraftsetzung.
- `restart --safe --skip-deferral`: umgeht die Verzögerungssperre für aktive Arbeit, sodass das Gateway sofort neu gestartet wird, selbst wenn Blockaden gemeldet werden. Erfordert `--safe`.

## Hinweise

- `status` löst konfigurierte SecretRefs für die Authentifizierung der Prüfung nach Möglichkeit auf. Wenn eine erforderliche SecretRef nicht aufgelöst ist, meldet `status --json` `rpc.authWarning`; übergeben Sie `--token`/`--password` ausdrücklich oder lösen Sie zuerst die Quelle des Secrets auf. Warnungen zu nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung ansonsten erfolgreich ist.
- `status --deep` fügt eine nach bestem Bemühen ausgeführte systemweite Suche nach anderen Gateway-ähnlichen Diensten hinzu (gibt Hinweise zur Bereinigung aus; weiterhin wird ein Gateway pro Rechner empfohlen) und führt die Konfigurationsvalidierung im Plugin-kompatiblen Modus aus, wobei Warnungen aus Plugin-Manifesten angezeigt werden, die der schnelle Standardpfad überspringt.
- Bei Linux-Installationen mit systemd untersuchen Prüfungen auf Token-Abweichungen sowohl die Unit-Quellen `Environment=` als auch `EnvironmentFile=`.
- Prüfungen auf Token-Abweichungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, dann die Prozessumgebung). Wenn die Token-Authentifizierung nicht tatsächlich aktiv ist (`gateway.auth.mode` mit `password`/`none`/`trusted-proxy` oder nicht gesetzt, während das Passwort Vorrang erhalten kann), wird die Auflösung des Konfigurationstokens übersprungen.
- `install` überprüft, ob ein über eine SecretRef verwaltetes `gateway.auth.token` aufgelöst werden kann, speichert den aufgelösten Wert jedoch niemals dauerhaft in den Umgebungsmetadaten des Dienstes; kann er nicht aufgelöst werden, schlägt die Installation nach dem Fail-Closed-Prinzip fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert `install`, bis Sie den Modus ausdrücklich festlegen.
- Unter macOS sorgt `install` dafür, dass LaunchAgent-plist-Dateien sowie die generierte Umgebungsdatei und der Wrapper nur für den Eigentümer zugänglich sind (Modus `0600`/`0700`), anstatt Secrets in `EnvironmentVariables` einzubetten.
- Wenn Sie mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche. Siehe [Mehrere Gateways](/de/gateway#multiple-gateways-same-host).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
