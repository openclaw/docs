---
read_when:
    - Den Headless-Node-Host ausführen
    - Einen Nicht-macOS-Node für `system.run` koppeln
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: Node
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Führen Sie einen **Headless-Node-Host** aus, der sich mit dem Gateway-WebSocket verbindet und auf diesem Rechner `system.run` / `system.which` bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Sie möchten, dass Agents **Befehle auf anderen Rechnern** in Ihrem Netzwerk ausführen, ohne dort eine vollständige macOS-Companion-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Laborrechner, NAS).
- Exec auf dem Gateway **isoliert** halten, aber genehmigte Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, Headless-Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Freigaben** und Allowlists pro Agent auf dem Node-Host geschützt, sodass Sie den Befehlszugriff begrenzt und explizit halten können.

## Browser-Proxy (ohne Konfiguration)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem Node nicht deaktiviert ist. Dadurch kann der Agent die Browser-Automatisierung auf diesem Node ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browser-Profile-Oberfläche des Nodes bereit. Wenn Sie `nodeHost.browserProxy.allowProfiles` festlegen, wird der Proxy restriktiv:
Zugriffe auf nicht allowlistete Profile werden abgelehnt, und Routen zum Erstellen/Löschen persistenter Profile werden über den Proxy blockiert.

Deaktivieren Sie ihn bei Bedarf auf dem Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ausführen (Vordergrund)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikats-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (setzt Pairing-Token zurück)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus config/env auf (keine `--token`-/`--password`-Flags bei Node-Befehlen):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokaler Config-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung der Node-Authentifizierung kontrolliert fehl (kein Remote-Fallback, der dies verdeckt).
- In `gateway.mode=remote` kommen gemäß den Vorrangregeln für Remote auch die Felder des Remote-Clients (`gateway.remote.token` / `gateway.remote.password`) infrage.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der sich mit einem Nicht-Loopback-`ws://`-Gateway in einem vertrauenswürdigen privaten Netzwerk verbindet, setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Ohne diese Einstellung schlägt der Start des Nodes kontrolliert fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder Tailscale zu verwenden.
Dies ist ein Prozess-Umgebungs-Opt-in und kein Config-Schlüssel in `openclaw.json`.
`openclaw node install` speichert diese Einstellung im überwachten Node-Service, wenn sie in der Befehlsumgebung von install vorhanden ist.

## Service (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikats-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (setzt Pairing-Token zurück)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Service-Laufzeit (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, wenn bereits installiert

Den Service verwalten:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (ohne Service).

Service-Befehle akzeptieren `--json` für maschinenlesbare Ausgabe.

## Pairing

Die erste Verbindung erstellt auf dem Gateway eine ausstehende Geräte-Pairing-Anfrage (`role: node`).
Bestätigen Sie sie mit:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Bestätigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Informationen zur Gateway-Verbindung in `~/.openclaw/node.json`.

## Exec-Freigaben

`system.run` wird durch lokale Exec-Freigaben gesteuert:

- `~/.openclaw/exec-approvals.json`
- [Exec-Freigaben](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigte asynchrone Node-Ausführung bereitet OpenClaw vor der Aufforderung einen kanonischen `systemRunPlan` vor. Die später genehmigte `system.run`-Weiterleitung verwendet diesen gespeicherten Plan erneut, sodass Änderungen an Feldern für command/cwd/session nach Erstellung der Freigabeanfrage abgelehnt werden, statt zu ändern, was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
