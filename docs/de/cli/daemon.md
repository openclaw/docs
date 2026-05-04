---
read_when:
    - Sie verwenden `openclaw daemon ...` weiterhin in Skripten
    - Sie benötigen Befehle für den Dienst-Lebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (Legacy-Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-05-04T18:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Legacy-Alias für Befehle zur Verwaltung des Gateway-Dienstes.

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

- `status`: Dienstinstallationsstatus anzeigen und Gateway-Zustand prüfen
- `install`: Dienst installieren (`launchd`/`systemd`/`schtasks`)
- `uninstall`: Dienst entfernen
- `start`: Dienst starten
- `stop`: Dienst stoppen
- `restart`: Dienst neu starten

## Häufige Optionen

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- Lebenszyklus (`uninstall|start|stop`): `--json`

Hinweise:

- `status` löst konfigurierte Auth-SecretRefs für die Prüfungsauthentifizierung auf, wenn möglich.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn Prüfungsverbindung oder -authentifizierung fehlschlagen; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
- `status --deep` fügt einen Best-Effort-Systemscan auf Dienstebene hinzu. Wenn dabei andere Gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen berücksichtigen `status`-Token-Drift-Prüfungen sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen.
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mit zusammengeführter Laufzeitumgebung auf (zuerst die Dienstbefehlsumgebung, dann als Fallback die Prozessumgebung).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder ein nicht gesetzter Modus, bei dem das Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` durch SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht dauerhaft in den Dienstumgebungsmetadaten.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation geschlossen fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Unter macOS hält `install` LaunchAgent-plists nur für den Eigentümer zugänglich und lädt verwaltete Dienstumgebungswerte über eine nur für den Eigentümer zugängliche Datei und einen Wrapper, statt API-Schlüssel oder Auth-Profil-Env-Refs in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host betreiben, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
- `restart --safe` weist das laufende Gateway an, aktive Arbeit vorab zu prüfen und einen zusammengeführten Neustart einzuplanen, nachdem aktive Arbeit abgearbeitet ist. Ein einfaches `restart` behält das bestehende Verhalten des Dienstmanagers bei; `--force` bleibt der Pfad für eine sofortige Überschreibung.

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
