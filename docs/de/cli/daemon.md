---
read_when:
    - Sie verwenden `openclaw daemon ...` weiterhin in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (Legacy-Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-05-11T20:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw daemon`

Legacy-Alias für Befehle zur Verwaltung des Gateway-Diensts.

`openclaw daemon ...` wird derselben Oberfläche zur Dienststeuerung zugeordnet wie die Dienstbefehle von `openclaw gateway ...`.

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

- `status`: Installationsstatus des Diensts anzeigen und Gateway-Zustand prüfen
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

- `status` löst konfigurierte Auth-SecretRefs für die Prüf-Authentifizierung auf, wenn möglich.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn Prüf-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um falsch-positive Meldungen zu vermeiden.
- `status --deep` fügt eine bestmögliche Dienstsuche auf Systemebene hinzu. Wenn andere Gateway-ähnliche Dienste gefunden werden, gibt die Ausgabe für Menschen Bereinigungshinweise aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- `status --deep` führt außerdem eine Konfigurationsvalidierung im Plugin-bewussten Modus aus und zeigt Warnungen aus konfigurierten Plugin-Manifesten an (zum Beispiel fehlende Metadaten zur Channel-Konfiguration), damit Installations- und Update-Smoke-Checks sie erfassen. Das standardmäßige `status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
- Bei Linux-systemd-Installationen beziehen Token-Drift-Prüfungen von `status` sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen ein.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mit zusammengeführter Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Prozessumgebung als Fallback).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem das Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token jedoch nicht in Dienstumgebungs-Metadaten.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.
- Unter macOS hält `install` LaunchAgent-plists nur für den Besitzer zugänglich und lädt verwaltete Dienstumgebungswerte über eine nur für den Besitzer zugängliche Datei und einen Wrapper, statt API-Schlüssel oder Auth-Profil-Env-Refs in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
- `restart --safe` fordert das laufende Gateway auf, aktive Arbeit vorab zu prüfen und einen zusammengeführten Neustart zu planen, nachdem aktive Arbeit abgearbeitet wurde. Einfaches `restart` behält das bestehende Verhalten des Dienstmanagers bei; `--force` bleibt der Pfad für die sofortige Außerkraftsetzung.
- `restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht jedoch die Zurückstellungssperre für aktive Arbeit, sodass das Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Operator-Ausweg, wenn ein hängender Task-Lauf den sicheren Neustart festhält; erfordert `--safe`.

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
