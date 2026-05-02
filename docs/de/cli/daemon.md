---
read_when:
    - Sie verwenden `openclaw daemon ...` weiterhin in Skripten
    - Sie benötigen Befehle für den Dienstlebenszyklus (install/start/stop/restart/status)
summary: CLI-Referenz für `openclaw daemon` (Legacy-Alias für die Gateway-Dienstverwaltung)
title: Daemon
x-i18n:
    generated_at: "2026-05-02T22:17:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Veralteter Alias für Befehle zur Verwaltung des Gateway-Dienstes.

`openclaw daemon ...` wird derselben Dienststeuerungsoberfläche zugeordnet wie die Dienstbefehle von `openclaw gateway ...`.

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

- `status`: Installationsstatus des Dienstes anzeigen und Gateway-Integrität prüfen
- `install`: Dienst installieren (`launchd`/`systemd`/`schtasks`)
- `uninstall`: Dienst entfernen
- `start`: Dienst starten
- `stop`: Dienst stoppen
- `restart`: Dienst neu starten

## Allgemeine Optionen

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- Lebenszyklus (`uninstall|start|stop`): `--json`

Hinweise:

- `status` löst konfigurierte Authentifizierungs-SecretRefs für die Prüf-Authentifizierung auf, wenn möglich.
- Wenn ein erforderlicher Authentifizierungs-SecretRef in diesem Befehlspfad nicht aufgelöst ist, meldet `daemon status --json` `rpc.authWarning`, wenn die Prüf-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Authentifizierungsreferenzen unterdrückt, um falsch positive Meldungen zu vermeiden.
- `status --deep` fügt einen Best-Effort-Scan des Dienstes auf Systemebene hinzu. Wenn andere gateway-ähnliche Dienste gefunden werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass ein Gateway pro Maschine weiterhin die normale Empfehlung ist.
- Bei Linux-systemd-Installationen umfassen `status`-Prüfungen auf Token-Abweichungen sowohl `Environment=`- als auch `EnvironmentFile=`-Unit-Quellen.
- Abweichungsprüfungen lösen `gateway.auth.token`-SecretRefs über die zusammengeführte Laufzeitumgebung auf (zuerst die Umgebung des Dienstbefehls, dann die Prozessumgebung als Fallback).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem das Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Abweichungsprüfungen die Auflösung des Konfigurationstokens.
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert `install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Metadaten der Dienstumgebung.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation sicher fehl.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Unter macOS hält `install` LaunchAgent-plists nur für den Eigentümer zugänglich und lädt verwaltete Dienstumgebungswerte über eine nur für den Eigentümer zugängliche Datei und einen Wrapper, statt API-Schlüssel oder Authentifizierungsprofil-Umgebungsreferenzen in `EnvironmentVariables` zu serialisieren.
- Wenn Sie absichtlich mehrere Gateways auf einem Host ausführen, isolieren Sie Ports, Konfiguration/Zustand und Arbeitsbereiche; siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

## Bevorzugt

Verwenden Sie [`openclaw gateway`](/de/cli/gateway) für aktuelle Dokumentation und Beispiele.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
