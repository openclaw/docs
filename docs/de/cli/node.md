---
read_when:
    - Ausführen des Headless-Node-Hosts
    - Pairing eines Nicht-macOS-Node für `system.run`
summary: CLI-Referenz für `openclaw node` (Headless-Node-Host)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Führen Sie einen **Headless-Node-Host** aus, der sich mit dem Gateway-WebSocket verbindet und auf diesem Rechner
`system.run` / `system.which` bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Sie möchten, dass Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Labormaschinen, NAS).
- Exec auf dem Gateway **sandboxed** halten, aber genehmigte Ausführungen an andere Hosts delegieren.
- Ein leichtgewichtiges, Headless-Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Genehmigungen** und Allowlists pro Agent auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff begrenzt und explizit halten können.

## Browser-Proxy (Zero-Config)

Node-Hosts kündigen automatisch einen Browser-Proxy an, wenn `browser.enabled` auf dem
Node nicht deaktiviert ist. Dadurch kann der Agent Browser-Automatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browserprofiloberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` setzen, wird der Proxy restriktiv:
Nicht auf der Allowlist stehende Profilziele werden abgelehnt, und Routen zum Erstellen/Löschen
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
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikats-Fingerprint (sha256)
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Den Anzeigenamen des Node überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` lösen die Gateway-Authentifizierung aus config/env auf (keine Flags `--token`/`--password` bei Node-Befehlen):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Dann lokaler Konfigurations-Fallback: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst sind, schlägt die Auflösung der Node-Authentifizierung fail-closed fehl (kein Maskieren durch Remote-Fallback).
- In `gateway.mode=remote` kommen auch Remote-Client-Felder (`gateway.remote.token` / `gateway.remote.password`) gemäß den Prioritätsregeln für Remote in Frage.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur Env-Variablen `OPENCLAW_GATEWAY_*`.

Für einen Node, der sich mit einem nicht über Loopback laufenden `ws://`-Gateway in einem vertrauenswürdigen privaten
Netzwerk verbindet, setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Ohne dies schlägt der Start des Node
fail-closed fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder Tailscale zu verwenden.
Dies ist ein Prozess-Umgebungs-Opt-in, kein Konfigurationsschlüssel in `openclaw.json`.
`openclaw node install` speichert ihn im überwachten Node-Service, wenn er in der
Umgebung des Installationsbefehls vorhanden ist.

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
- `--node-id <id>`: Node-ID überschreiben (löscht Pairing-Token)
- `--display-name <name>`: Den Anzeigenamen des Node überschreiben
- `--runtime <runtime>`: Service-Laufzeit (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, falls bereits installiert

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
Genehmigen Sie sie über:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

In eng kontrollierten Node-Netzwerken kann sich der Gateway-Betreiber explizit dafür entscheiden,
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

Dies ist standardmäßig deaktiviert. Es gilt nur für neues Pairing von `role: node` mit
keinen angeforderten Scopes. Operator-/Browser-Clients, Control UI, WebChat sowie Rollen-,
Scope-, Metadaten- oder Public-Key-Upgrades erfordern weiterhin eine manuelle Genehmigung.

Wenn der Node das Pairing mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Scopes/Public Key),
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und die Gateway-Verbindungsinformationen in
`~/.openclaw/node.json`.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen gesteuert:

- `~/.openclaw/exec-approvals.json`
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigte asynchrone Node-Execs erstellt OpenClaw vor der Aufforderung einen kanonischen `systemRunPlan`.
Die später genehmigte Weiterleitung von `system.run` verwendet diesen gespeicherten
Plan erneut, sodass Änderungen an Feldern für Befehl/CWD/Sitzung, nachdem die Genehmigungsanfrage
erstellt wurde, abgelehnt werden, statt zu ändern, was der Node ausführt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
