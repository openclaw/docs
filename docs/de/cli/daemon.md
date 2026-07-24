---
read_when:
    - Sie verwenden weiterhin `openclaw daemon ...` in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (Installieren/Starten/Stoppen/Neustarten/Status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-07-24T03:42:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 629852ebf3efe86dedc4c84f6ddc9349b25ddde832df5d78521641fe4b137658
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für die Gateway-Dienstverwaltung. `openclaw daemon ...` wird denselben Dienststeuerungsbefehlen wie `openclaw gateway ...` zugeordnet. Verwenden Sie für die aktuelle Dokumentation und Beispiele vorzugsweise [`openclaw gateway`](/de/cli/gateway).

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

- `status`: Zeigt den Installationsstatus des Dienstes (launchd/systemd/schtasks) an und prüft den Zustand des Gateways.
- `install`: Installiert den Dienst; `--force` installiert eine vorhandene Installation erneut bzw. überschreibt sie.
- `restart --safe`: Fordert das laufende Gateway auf, aktive Aufgaben vorab zu prüfen und nach deren Abschluss einen einzigen zusammengefassten Neustart zu planen, begrenzt auf 5 Minuten. Nach Ablauf dieses Zeitbudgets wird der Neustart dennoch erzwungen. Der einfache Befehl `restart` verwendet direkt die Dienstverwaltung; `--force` setzt dies sofort außer Kraft.
- `restart --safe --skip-deferral`: Umgeht die Verzögerungssperre für aktive Aufgaben, sodass das Gateway sofort neu startet, selbst wenn Blockierungen gemeldet werden. Erfordert `--safe`.

## Hinweise

- `status` löst konfigurierte Authentifizierungs-SecretRefs nach Möglichkeit für die Prüfauthentifizierung auf. Wenn eine erforderliche SecretRef nicht aufgelöst ist, meldet `status --json` `rpc.authWarning`; übergeben Sie `--token`/`--password` ausdrücklich oder lösen Sie zuerst die Quelle des Secrets auf. Warnungen wegen nicht aufgelöster Authentifizierung werden unterdrückt, sobald die Prüfung ansonsten erfolgreich ist.
- `status --deep` ergänzt eine nach bestem Bemühen ausgeführte systemweite Suche nach anderen Gateway-ähnlichen Diensten (gibt Bereinigungshinweise aus; weiterhin wird ein Gateway pro Rechner empfohlen) und führt die Konfigurationsvalidierung im Plugin-kompatiblen Modus aus. Dabei werden Warnungen zu Plugin-Manifesten angezeigt, die der schnelle Standardpfad überspringt.
- Bei Linux-Installationen mit systemd prüfen Token-Abweichungsprüfungen sowohl die Unit-Quellen `Environment=` als auch `EnvironmentFile=`.
- Token-Abweichungsprüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, danach die Prozessumgebung). Wenn die Token-Authentifizierung nicht tatsächlich aktiv ist (`gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht festgelegt, während das Passwort Vorrang erhalten kann), wird die Auflösung des Konfigurationstokens übersprungen.
- `install` prüft, ob ein über eine SecretRef verwaltetes `gateway.auth.token` aufgelöst werden kann, speichert den aufgelösten Wert jedoch niemals in den Umgebungsmetadaten des Dienstes. Wenn die Auflösung fehlschlägt, wird die Installation sicher abgebrochen.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, blockiert `install`, bis Sie den Modus ausdrücklich festlegen.
- Unter macOS beschränkt `install` den Zugriff auf LaunchAgent-plist-Dateien und die generierte Umgebungsdatei bzw. den Wrapper auf den Eigentümer (Modus `0600`/`0700`), anstatt Secrets in `EnvironmentVariables` einzubetten.
- Wenn mehrere Gateways auf einem Host ausgeführt werden, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche. Siehe [Mehrere Gateways](/de/gateway#multiple-gateways-same-host).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Betriebshandbuch](/de/gateway)
