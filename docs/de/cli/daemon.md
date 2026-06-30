---
read_when:
    - Sie verwenden weiterhin `openclaw daemon ...` in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (veralteter Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-06-30T13:55:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Legacy-Alias für Befehle zur Verwaltung des Gateway-Dienstes.

`openclaw daemon ...` wird derselben Dienststeuerungsoberfläche zugeordnet wie Dienstbefehle unter `openclaw gateway ...`.

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

- `status` löst konfigurierte Authentifizierungs-SecretRefs nach Möglichkeit für die Prüf-Authentifizierung auf.
- Wenn eine erforderliche Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn Prüf-Konnektivität oder -Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Authentifizierungsreferenzen unterdrückt, um Fehlalarme zu vermeiden.
- `status --deep` fügt eine bestmögliche systemweite Dienstsuche hinzu. Wenn dabei andere Gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- `status --deep` führt außerdem eine Konfigurationsvalidierung im Plugin-bewussten Modus aus und zeigt konfigurierte Plugin-Manifestwarnungen an (zum Beispiel fehlende Metadaten zur Kanalkonfiguration), damit Installations- und Update-Smoke-Checks sie erfassen. Das standardmäßige `status` behält den schnellen schreibgeschützten Pfad bei, der die Plugin-Validierung überspringt.
- Bei Linux-systemd-Installationen berücksichtigen Token-Drift-Prüfungen von `status` sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs über die zusammengeführte Runtime-Umgebung auf (zuerst die Umgebung des Dienstbefehls, danach als Fallback die Prozessumgebung).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder ein nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `install`, dass die SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt wird.
- Unter macOS hält `install` LaunchAgent-plists nur für den Besitzer zugänglich und lädt verwaltete Dienstumgebungswerte über eine nur für den Besitzer zugängliche Datei und einen Wrapper, anstatt API-Schlüssel oder Authentifizierungsprofil-Umgebungsreferenzen in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
- `restart --safe` fordert das laufende Gateway auf, aktive Arbeit vorab zu prüfen und einen zusammengefassten Neustart zu planen, nachdem aktive Arbeit abgearbeitet wurde. Der standardmäßige sichere Neustart wartet bis zur konfigurierten `gateway.reload.deferralTimeoutMs` (Standard: 5 Minuten) auf aktive Arbeit; wenn dieses Budget abläuft, wird der Neustart erzwungen. Setzen Sie `gateway.reload.deferralTimeoutMs` auf `0`, um unbegrenzt sicher zu warten, ohne jemals zu erzwingen. Einfaches `restart` behält das bestehende Verhalten des Dienstmanagers bei; `--force` bleibt der unmittelbare Überschreibungspfad.
- `restart --safe --skip-deferral` führt den OpenClaw-bewussten sicheren Neustart aus, umgeht aber die Zurückstellungsschranke für aktive Arbeit, sodass das Gateway den Neustart sofort ausgibt, selbst wenn Blocker gemeldet werden. Dies ist ein Operator-Notausstieg, wenn ein festhängender Tasklauf den sicheren Neustart blockiert; erfordert `--safe`.

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
