---
read_when:
    - Sie verwenden weiterhin `openclaw daemon ...` in Skripten
    - Sie benötigen Befehle zur Verwaltung des Dienstlebenszyklus (installieren/starten/stoppen/neu starten/Status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-07-12T01:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
| `stop`       | `--json`, `--disable` (nur launchd: KeepAlive/RunAtLoad dauerhaft bis zum nächsten Start unterdrücken) |
| `restart`    | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: Zeigt den Installationsstatus des Dienstes (launchd/systemd/schtasks) an und prüft den Zustand des Gateways.
- `install`: Installiert den Dienst; `--force` installiert eine vorhandene Installation neu bzw. überschreibt sie.
- `restart --safe`: Fordert das laufende Gateway auf, aktive Arbeiten vorab zu prüfen und einen zusammengefassten Neustart zu planen, sobald die Arbeiten abgeschlossen sind. Die Wartezeit ist durch `gateway.reload.deferralTimeoutMs` begrenzt (Standardwert: 300000 ms/5 Minuten; setzen Sie den Wert auf `0`, um unbegrenzt zu warten). Nach Ablauf dieses Zeitlimits wird der Neustart dennoch erzwungen. Ein einfaches `restart` verwendet direkt den Dienstmanager; `--force` erzwingt den sofortigen Neustart.
- `restart --safe --skip-deferral`: Umgeht die Verzögerungssperre für aktive Arbeiten, sodass das Gateway sofort neu startet, selbst wenn Blockierungen gemeldet werden. Erfordert `--safe`.

## Hinweise

- `status` löst konfigurierte SecretRefs für die Prüfauthentifizierung nach Möglichkeit auf. Wenn eine erforderliche SecretRef nicht aufgelöst werden kann, meldet `status --json` den Wert `rpc.authWarning`; übergeben Sie `--token`/`--password` explizit oder beheben Sie zunächst die geheime Quelle. Warnungen über nicht aufgelöste Authentifizierungsdaten werden unterdrückt, sobald die Prüfung ansonsten erfolgreich ist.
- `status --deep` ergänzt eine bestmögliche systemweite Suche nach weiteren Gateway-ähnlichen Diensten (gibt Hinweise zur Bereinigung aus; empfohlen wird weiterhin ein Gateway pro Rechner) und führt die Konfigurationsvalidierung im Plugin-kompatiblen Modus aus. Dadurch werden Warnungen zu Plugin-Manifesten angezeigt, die der schnelle Standardpfad überspringt.
- Bei Linux-Installationen mit systemd prüfen Kontrolldurchläufe auf Token-Abweichungen sowohl die Unit-Quellen `Environment=` als auch `EnvironmentFile=`.
- Kontrolldurchläufe auf Token-Abweichungen lösen SecretRefs für `gateway.auth.token` anhand der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, dann die Prozessumgebung). Wenn die Token-Authentifizierung faktisch nicht aktiv ist (`gateway.auth.mode` ist `password`/`none`/`trusted-proxy` oder nicht gesetzt und das Passwort kann Vorrang erhalten), wird die Auflösung des Konfigurationstokens übersprungen.
- `install` prüft, ob ein über eine SecretRef verwaltetes `gateway.auth.token` aufgelöst werden kann, speichert den aufgelösten Wert jedoch niemals in den Umgebungsmetadaten des Dienstes. Wenn die Auflösung fehlschlägt, wird die Installation sicher abgebrochen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert `install`, bis Sie den Modus explizit festlegen.
- Unter macOS beschränkt `install` den Zugriff auf LaunchAgent-plist-Dateien sowie die generierte Umgebungsdatei und den Wrapper auf den Eigentümer (Modus `0600`/`0700`), statt geheime Daten in `EnvironmentVariables` einzubetten.
- Mehrere Gateways auf einem Host ausführen: Isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche. Siehe [Mehrere Gateways](/de/gateway#multiple-gateways-same-host).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
