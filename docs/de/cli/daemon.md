---
read_when:
    - Sie verwenden `openclaw daemon ...` weiterhin in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (Legacy-Alias für die Verwaltung des Gateway-Dienstes)
title: Daemon
x-i18n:
    generated_at: "2026-04-30T06:44:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für Befehle zur Verwaltung des Gateway-Diensts.

`openclaw daemon ...` verweist auf dieselbe Oberfläche zur Dienststeuerung wie die Dienstbefehle von `openclaw gateway ...`.

## Verwendung

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Unterbefehle

- `status`: Installationszustand des Diensts anzeigen und Gateway-Zustand prüfen
- `install`: Dienst installieren (`launchd`/`systemd`/`schtasks`)
- `uninstall`: Dienst entfernen
- `start`: Dienst starten
- `stop`: Dienst stoppen
- `restart`: Dienst neu starten

## Häufige Optionen

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- Lebenszyklus (`uninstall|start|stop|restart`): `--json`

Hinweise:

- `status` löst konfigurierte Auth-SecretRefs für die Authentifizierung der Prüfung auf, wenn möglich.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn die Verbindung oder Authentifizierung der Prüfung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die geheime Quelle auf.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um falsch positive Meldungen zu vermeiden.
- `status --deep` ergänzt eine Best-Effort-Dienstsuche auf Systemebene. Wenn dabei andere gateway-ähnliche Dienste gefunden werden, gibt die lesbare Ausgabe Bereinigungshinweise aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen umfassen Token-Drift-Prüfungen von `status` sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Runtime-Umgebung auf (zuerst Umgebung des Dienstbefehls, dann Prozessumgebung als Fallback).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in den Metadaten der Dienstumgebung.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit festgelegt ist.
- Unter macOS behält `install` LaunchAgent-plists nur für den Owner lesbar und lädt verwaltete Dienstumgebungswerte über eine nur für den Owner lesbare Datei und einen Wrapper, statt API-Schlüssel oder Auth-Profil-Env-Refs in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host betreiben, isolieren Sie Ports, Konfiguration/Zustand und Workspaces; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

## Empfohlen

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
