---
read_when:
    - Sie verwenden `openclaw daemon ...` weiterhin in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (Legacy-Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-05-10T19:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für Befehle zur Verwaltung des Gateway-Dienstes.

`openclaw daemon ...` verweist auf dieselbe Dienststeuerungsoberfläche wie die Dienstbefehle von `openclaw gateway ...`.

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

- `status`: Installationsstatus des Dienstes anzeigen und Gateway-Zustand prüfen
- `install`: Dienst installieren (`launchd`/`systemd`/`schtasks`)
- `uninstall`: Dienst entfernen
- `start`: Dienst starten
- `stop`: Dienst stoppen
- `restart`: Dienst neu starten

## Häufige Optionen

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- Lebenszyklus (`uninstall|start|stop`): `--json`

Hinweise:

- `status` löst konfigurierte Auth-SecretRefs nach Möglichkeit für die Probe-Authentifizierung auf.
- Wenn eine erforderliche Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn Probe-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um falsch positive Meldungen zu vermeiden.
- `status --deep` fügt einen Best-Effort-Scan auf Systemebene für Dienste hinzu. Wenn dabei andere gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass ein Gateway pro Rechner weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen umfassen `status`-Token-Drift-Prüfungen sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mit zusammengeführter Runtime-Umgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `install`, dass die SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht dauerhaft in Dienstumgebungsmetadaten.
- Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Unter macOS hält `install` LaunchAgent-plists auf den Besitzer beschränkt und lädt verwaltete Dienstumgebungswerte über eine besitzerbeschränkte Datei und einen Wrapper, statt API-Schlüssel oder Auth-Profil-Env-Refs in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
- `restart --safe` fordert das laufende Gateway auf, aktive Arbeit vorab zu prüfen und einen zusammengeführten Neustart zu planen, nachdem aktive Arbeit abgearbeitet ist. Einfaches `restart` behält das vorhandene Verhalten des Dienstmanagers bei; `--force` bleibt der unmittelbare Überschreibungspfad.
- `restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht aber die Aufschubprüfung für aktive Arbeit, sodass das Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Notfallausweg für Betreiber, wenn ein hängender Task-Lauf den sicheren Neustart festhält; erfordert `--safe`.

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
