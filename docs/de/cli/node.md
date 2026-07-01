---
read_when:
    - Ausführen des Headless-Node-Hosts
    - Koppeln eines Nicht-macOS-Knotens für system.run
summary: CLI-Referenz für `openclaw node` (headless Node-Host)
title: Node
x-i18n:
    generated_at: "2026-07-01T12:53:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Führen Sie einen **Headless-Node-Host** aus, der sich mit dem Gateway-WebSocket verbindet und
`system.run` / `system.which` auf dieser Maschine bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Agenten **Befehle auf anderen Maschinen** in Ihrem
Netzwerk ausführen sollen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Systemen ausführen (Build-Server, Labormaschinen, NAS).
- Exec auf dem Gateway **sandboxed** halten, genehmigte Ausführungen aber an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung bleibt weiterhin durch **Exec-Genehmigungen** und agentenspezifische Allowlists auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff gezielt und explizit begrenzen können.

## Browser-Proxy (ohne Konfiguration)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem
Node nicht deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browser-Profiloberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` festlegen, wird der Proxy restriktiv:
nicht in der Allowlist enthaltenes Profil-Targeting wird abgelehnt, und Routen zum Erstellen/Löschen
persistenter Profile werden über den Proxy blockiert.

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
- `--context-path <path>`: Gateway-WebSocket-Kontextpfad (z. B. `/openclaw-gw`). Wird an die WebSocket-URL angehängt.
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für Node-Host

`openclaw node run` und `openclaw node install` lösen Gateway-Authentifizierung aus Konfiguration/Umgebung auf (keine `--token`-/`--password`-Flags für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach lokaler Konfigurations-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Node-Authentifizierungsauflösung sicher fehl (keine Maskierung durch Remote-Fallback).
- In `gateway.mode=remote` sind Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Remote-Prioritätsregeln ebenfalls zulässig.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der sich mit einem Klartext-`ws://`-Gateway verbindet, werden loopback, private IP-
Literale, `.local` und Tailnet-`*.ts.net`-Hosts akzeptiert. Für andere
vertrauenswürdige private DNS-Namen setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; ohne
diese Einstellung schlägt der Node-Start sicher fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder
Tailscale zu verwenden. Dies ist ein Opt-in über die Prozessumgebung, kein `openclaw.json`-Konfigurationsschlüssel.
`openclaw node install` persistiert dies im überwachten Node-Dienst, wenn es in der Umgebung des Installationsbefehls
vorhanden ist.

## Dienst (Hintergrund)

Installieren Sie einen Headless-Node-Host als Benutzerdienst.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--context-path <path>`: Gateway-WebSocket-Kontextpfad (z. B. `/openclaw-gw`). Wird an die WebSocket-URL angehängt.
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Dienst-Runtime (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, falls bereits installiert

Dienst verwalten:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (kein Dienst).

Dienstbefehle akzeptieren `--json` für maschinenlesbare Ausgabe.

Der Node-Host versucht Gateway-Neustarts und Netzwerkschließungen im Prozess erneut. Wenn das
Gateway eine terminale Authentifizierungspause für Token/Passwort/Bootstrap meldet, protokolliert der Node-Host
die Schließungsdetails und beendet sich mit einem Nicht-Null-Code, damit launchd/systemd ihn mit
frischer Konfiguration und neuen Anmeldedaten neu starten kann. Pairing-erforderliche Pausen bleiben im Vordergrund-
Ablauf, damit die ausstehende Anfrage genehmigt werden kann.

## Pairing

Die erste Verbindung erstellt eine ausstehende Geräte-Pairing-Anfrage (`role: node`) auf dem Gateway.
Genehmigen Sie sie über:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

In streng kontrollierten Node-Netzwerken kann der Gateway-Betreiber explizit zustimmen,
erstmaliges Node-Pairing aus vertrauenswürdigen CIDRs automatisch zu genehmigen:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies ist standardmäßig deaktiviert. Es gilt nur für frisches `role: node`-Pairing ohne
angeforderte Scopes. Operator-/Browser-Clients, Control UI, WebChat sowie Rollen-,
Scope-, Metadaten- oder Public-Key-Upgrades erfordern weiterhin manuelle Genehmigung.

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/Public Key) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen geschützt:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` oder
  `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigtes asynchrones Node-Exec bereitet OpenClaw vor der Abfrage einen kanonischen `systemRunPlan`
vor. Die später genehmigte `system.run`-Weiterleitung verwendet diesen gespeicherten
Plan wieder, sodass Änderungen an Befehls-/cwd-/Sitzungsfeldern nach Erstellung der Genehmigungsanfrage
abgelehnt werden, statt zu ändern, was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
