---
read_when:
    - Sie verwenden weiterhin `openclaw daemon ...` in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (installieren/starten/stoppen/neu starten/status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-07-12T15:07:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für die Verwaltung des Gateway-Dienstes. `openclaw daemon ...` wird denselben Befehlen zur Dienststeuerung zugeordnet wie `openclaw gateway ...`. Verwenden Sie für aktuelle Dokumentation und Beispiele vorzugsweise [`openclaw gateway`](/de/cli/gateway).

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
| ------------ | ------------------------------------------------------------------------------------------------- |
| `status`     | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`    | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall`  | `--json`                                                                                         |
| `start`      | `--json`                                                                                         |
| `stop`       | `--json`, `--disable` (nur launchd: KeepAlive/RunAtLoad bis zum nächsten Start dauerhaft unterdrücken) |
| `restart`    | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: zeigt den Installationsstatus des Dienstes (launchd/systemd/schtasks) an und prüft den Zustand des Gateways.
- `install`: installiert den Dienst; `--force` installiert eine vorhandene Installation neu bzw. überschreibt sie.
- `restart --safe`: fordert das laufende Gateway auf, aktive Arbeiten vorab zu prüfen und einen einzigen zusammengefassten Neustart zu planen, nachdem die Arbeiten abgeschlossen sind, begrenzt durch `gateway.reload.deferralTimeoutMs` (Standardwert 300000ms/5 Minuten; auf `0` setzen, um unbegrenzt zu warten). Wenn dieses Zeitbudget abläuft, wird der Neustart trotzdem erzwungen. Ein einfaches `restart` verwendet direkt die Dienstverwaltung; `--force` bewirkt die sofortige Ausführung.
- `restart --safe --skip-deferral`: umgeht die Aufschubsperre für aktive Arbeiten, sodass das Gateway sofort neu startet, selbst wenn Blockierungen gemeldet werden. Erfordert `--safe`.

## Hinweise

- `status` löst konfigurierte SecretRefs für die Authentifizierung der Prüfung nach Möglichkeit auf. Wenn eine erforderliche SecretRef nicht aufgelöst ist, meldet `status --json` `rpc.authWarning`; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Quelle des Secrets auf. Warnungen zu nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung ansonsten erfolgreich ist.
- `status --deep` fügt eine bestmögliche systemweite Suche nach anderen Gateway-ähnlichen Diensten hinzu (gibt Hinweise zur Bereinigung aus; ein Gateway pro Rechner bleibt die Empfehlung) und führt die Konfigurationsvalidierung im Plugin-fähigen Modus aus. Dabei werden Warnungen zu Plugin-Manifesten angezeigt, die der schnelle Standardpfad überspringt.
- Bei Linux-Installationen mit systemd untersuchen Prüfungen auf Token-Abweichungen sowohl `Environment=`- als auch `EnvironmentFile=`-Quellen der Unit.
- Prüfungen auf Token-Abweichungen lösen SecretRefs für `gateway.auth.token` mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, dann die Prozessumgebung). Wenn die Token-Authentifizierung nicht tatsächlich aktiv ist (`gateway.auth.mode` ist `password`/`none`/`trusted-proxy`, oder nicht gesetzt und das Passwort kann Vorrang erhalten), wird die Auflösung des Konfigurations-Tokens übersprungen.
- `install` überprüft, ob ein über eine SecretRef verwaltetes `gateway.auth.token` aufgelöst werden kann, speichert den aufgelösten Wert jedoch niemals in den Umgebungsmetadaten des Dienstes; wenn die Auflösung nicht möglich ist, schlägt die Installation nach dem Fail-Closed-Prinzip fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert `install`, bis Sie den Modus explizit festlegen.
- Unter macOS beschränkt `install` LaunchAgent-Plists sowie die generierte Umgebungsdatei und den Wrapper auf den Eigentümer (Modus `0600`/`0700`), statt Secrets in `EnvironmentVariables` einzubetten.
- Mehrere Gateways auf einem Host ausführen: Isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche. Siehe [Mehrere Gateways](/de/gateway#multiple-gateways-same-host).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
